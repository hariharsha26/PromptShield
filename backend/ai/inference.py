"""
Core inference engine — keeps the same classification logic as the original
Node.js server.js while being ~5x faster via NumPy vectorisation and async I/O.
"""
import time
import numpy as np
from typing import Any

from ai.load_model import get_use_model, get_model_data, get_embeddings_matrix
from ai.similarity import cosine_similarity_vectorised
from config import SIMILARITY_THRESHOLD, TOP_K_MATCHES

# ──────────────────────────────────────────────────────────────────────────────
# Metadata tables  (mirrors CATEGORY_META / ACTION_META from server.js)
# ──────────────────────────────────────────────────────────────────────────────
CATEGORY_META: dict[str, dict] = {
    "Override": {
        "icon": "⚡", "label": "Instruction Override", "severity": "critical",
        "description": "Attempt to bypass or override system-level instructions and safety measures",
        "color": "#f97316",
    },
    "Exfiltration": {
        "icon": "🔓", "label": "Data Exfiltration", "severity": "critical",
        "description": "Attempt to extract sensitive or confidential data from the system",
        "color": "#dc2626",
    },
    "Tool Misuse": {
        "icon": "🔧", "label": "Tool Misuse", "severity": "critical",
        "description": "Abuse of system tools or capabilities for malicious purposes",
        "color": "#ef4444",
    },
    "Safe": {
        "icon": "✅", "label": "Safe Request", "severity": "none",
        "description": "Legitimate, safe request with no malicious intent detected",
        "color": "#22c55e",
    },
    # Extended / fallback categories
    "prompt_injection": {
        "icon": "💉", "label": "Prompt Injection", "severity": "critical",
        "description": "Direct attempt to inject malicious instructions into the AI system",
        "color": "#ef4444",
    },
    "instruction_override": {
        "icon": "⚡", "label": "Instruction Override", "severity": "critical",
        "description": "Attempt to bypass or override system-level instructions",
        "color": "#f97316",
    },
    "data_exfiltration": {
        "icon": "🔓", "label": "Data Exfiltration", "severity": "critical",
        "description": "Attempt to extract sensitive or confidential data from the system",
        "color": "#dc2626",
    },
    "social_engineering": {
        "icon": "🎭", "label": "Social Engineering", "severity": "high",
        "description": "Manipulative tactics to trick the AI into non-compliant behavior",
        "color": "#f59e0b",
    },
    "obfuscation_attack": {
        "icon": "🔀", "label": "Obfuscation Attack", "severity": "high",
        "description": "Malicious intent hidden through encoding, ciphers, or obfuscation",
        "color": "#a855f7",
    },
    "multi_step_attack": {
        "icon": "🔗", "label": "Multi-Step Attack", "severity": "critical",
        "description": "Complex attack chain designed to escalate across multiple prompts",
        "color": "#ec4899",
    },
    "indirect_injection": {
        "icon": "🎯", "label": "Indirect Injection", "severity": "high",
        "description": "Injection via external content, URLs, or data sources",
        "color": "#fb923c",
    },
    "roleplay_jailbreak": {
        "icon": "🎪", "label": "Roleplay Jailbreak", "severity": "high",
        "description": "Using roleplay or character scenarios to bypass safety filters",
        "color": "#e11d48",
    },
    "benign_request": {
        "icon": "✅", "label": "Benign Request", "severity": "none",
        "description": "Legitimate, safe request with no malicious intent detected",
        "color": "#22c55e",
    },
    "educational_request": {
        "icon": "📚", "label": "Educational Request", "severity": "none",
        "description": "Learning-focused query about security or AI topics",
        "color": "#3b82f6",
    },
    "cybersecurity_research": {
        "icon": "🔬", "label": "Security Research", "severity": "low",
        "description": "Legitimate cybersecurity research inquiry",
        "color": "#06b6d4",
    },
    "security_testing": {
        "icon": "🧪", "label": "Security Testing", "severity": "low",
        "description": "Authorized penetration testing or security assessment",
        "color": "#8b5cf6",
    },
    "fictional_scenario": {
        "icon": "📖", "label": "Fictional Scenario", "severity": "none",
        "description": "Creative fiction with security-adjacent themes",
        "color": "#14b8a6",
    },
}

ACTION_META: dict[str, dict] = {
    "allow":   {"icon": "✅", "label": "ALLOWED",   "color": "#22c55e", "description": "Prompt is safe — forwarded to AI agent"},
    "block":   {"icon": "🛑", "label": "BLOCKED",   "color": "#ef4444", "description": "Prompt blocked — security policy violation detected"},
    "flag":    {"icon": "🚩", "label": "FLAGGED",   "color": "#f59e0b", "description": "Prompt flagged for review — suspicious but not confirmed malicious"},
    "monitor": {"icon": "👁️",  "label": "MONITORED", "color": "#8b5cf6", "description": "Prompt allowed but logged for security monitoring"},
}

SAFE_CATEGORIES = {"Safe", "benign_request", "educational_request", "fictional_scenario"}
MALICIOUS_CATEGORIES = {
    "Override", "Exfiltration", "Tool Misuse",
    "prompt_injection", "instruction_override", "data_exfiltration",
    "social_engineering", "obfuscation_attack", "multi_step_attack",
    "indirect_injection", "roleplay_jailbreak",
}


def _category_to_risk(category: str) -> dict:
    cat = (category or "").lower()
    if cat in ("safe", "benign_request", "educational_request", "fictional_scenario"):
        return {"level": "none", "percent": 0}
    if cat == "override":
        return {"level": "critical", "percent": 95}
    if cat == "exfiltration":
        return {"level": "critical", "percent": 90}
    if cat == "tool misuse":
        return {"level": "high", "percent": 85}
    if category in MALICIOUS_CATEGORIES:
        return {"level": "critical", "percent": 85}
    return {"level": "medium", "percent": 50}


def _map_pipeline(category: str, action: str) -> dict:
    is_safe = category in SAFE_CATEGORIES
    is_malicious = not is_safe
    act = (action or "").lower()
    return {
        "user_input":  {"status": "active",  "label": "User Input",         "detail": "Prompt received and queued for inspection"},
        "inspection":  {"status": "alert" if is_malicious else "pass", "label": "Content Inspection",
                        "detail": "Suspicious content patterns identified" if is_malicious else "Content appears clean"},
        "detection":   {"status": "alert" if is_malicious else "pass", "label": "Threat Detection",
                        "detail": f"Threat classified: {CATEGORY_META.get(category, {}).get('label', category)}" if is_malicious else "No threats detected"},
        "policy":      {"status": "blocked" if act == "block" else ("warning" if act == "flag" else "pass"),
                        "label": "Policy Engine", "detail": f"Decision: {ACTION_META.get(act, {}).get('label', act.upper())}"},
        "ai_agent":    {"status": "blocked" if act == "block" else "pass", "label": "AI Agent",
                        "detail": "Request rejected — not forwarded" if act == "block" else "Processing request normally"},
    }


async def analyze_prompt(prompt: str) -> dict[str, Any]:
    """
    Full inference pipeline:
      1. Embed prompt via USE
      2. Vectorised cosine similarity against all stored embeddings
      3. Classify and return rich JSON response
    """
    t0 = time.perf_counter()

    model = get_use_model()
    model_data = get_model_data()
    emb_matrix = get_embeddings_matrix()

    if model is None or not model_data or emb_matrix is None:
        raise RuntimeError("AI model is not loaded yet — wait for startup to complete")

    # Step 1: Embed the incoming prompt
    vec = model([prompt]).numpy()[0].astype(np.float32)   # shape (512,)

    # Step 2: Vectorised similarity against all N stored embeddings
    scores: np.ndarray = cosine_similarity_vectorised(vec, emb_matrix)

    # Step 3: Argsort — descending
    top_indices = np.argsort(scores)[::-1][:TOP_K_MATCHES]
    top_scores = scores[top_indices]

    elapsed_ms = (time.perf_counter() - t0) * 1000

    # Step 4: Default-safe if nothing matches well
    if len(top_scores) == 0 or float(top_scores[0]) < SIMILARITY_THRESHOLD:
        return {
            "input_prompt": prompt,
            "category": "Safe",
            "action": "allow",
            "risk_level": "none",
            "risk_percentage": 0,
            "confidence": int(float(top_scores[0]) * 100) if len(top_scores) > 0 else 0,
            "category_meta": CATEGORY_META["Safe"],
            "action_meta": ACTION_META["allow"],
            "pipeline": _map_pipeline("Safe", "allow"),
            "top_matches": [],
            "scan_id": f"PS-{int(time.time() * 1000)}",
            "latency_ms": round(elapsed_ms, 1),
        }

    # Step 5: Best match metadata
    best_idx = int(top_indices[0])
    confidence = min(99, int(float(top_scores[0]) * 100))
    category = model_data["categories"][best_idx] or "Safe"
    action = (model_data["actions"][best_idx] or "Allow").lower()
    risk = _category_to_risk(category)

    return {
        "input_prompt":  prompt,
        "matched_prompt": (model_data["prompts"][best_idx] or "")[:200],
        "category":      category,
        "action":        action,
        "risk_level":    risk["level"],
        "risk_percentage": risk["percent"],
        "confidence":    confidence,
        "category_meta": CATEGORY_META.get(category, CATEGORY_META["Safe"]),
        "action_meta":   ACTION_META.get(action, ACTION_META["allow"]),
        "pipeline":      _map_pipeline(category, action),
        "top_matches": [
            {
                "prompt":   (model_data["prompts"][int(top_indices[i])] or "")[:120],
                "category": model_data["categories"][int(top_indices[i])],
                "action":   model_data["actions"][int(top_indices[i])],
                "score":    int(float(top_scores[i]) * 100),
            }
            for i in range(min(3, len(top_indices)))
        ],
        "scan_id":    f"PS-{int(time.time() * 1000)}",
        "latency_ms": round(elapsed_ms, 1),
    }
