"""
FastAPI route — POST /api/analyze
"""
import logging
from fastapi import APIRouter
from pydantic import BaseModel, field_validator

from ai.inference import analyze_prompt, CATEGORY_META, ACTION_META
from ai.load_model import get_model_data

logger = logging.getLogger(__name__)
router = APIRouter()

# ── In-process session counter (reset on restart) ──────────────────────────
_session = {"total": 0, "blocked": 0, "flagged": 0, "allowed": 0, "monitored": 0}


# ── Schemas ────────────────────────────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    prompt: str

    @field_validator("prompt")
    @classmethod
    def prompt_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("prompt must not be empty")
        return v


# ── Endpoints ────────────────────────────────────────────────────────────


@router.post("/analyze")
async def analyze(req: AnalyzeRequest):
    """Primary inference endpoint — POST /api/analyze"""
    result = await analyze_prompt(req.prompt)

    # Track session statistics
    _session["total"] += 1
    action = result.get("action", "allow")
    if action == "block":
        _session["blocked"] += 1
    elif action == "flag":
        _session["flagged"] += 1
    elif action == "monitor":
        _session["monitored"] += 1
    else:
        _session["allowed"] += 1

    logger.info(
        f"[{result['scan_id']}] '{req.prompt[:60]}…' → {action.upper()} "
        f"({result['latency_ms']} ms)"
    )
    return result


@router.get("/categories")
async def get_categories():
    """Returns all category metadata (used by frontend reference panel)."""
    return CATEGORY_META


@router.get("/stats")
async def get_stats():
    """Session + dataset statistics."""
    model_data = get_model_data()
    cat_breakdown: dict = {}
    act_breakdown: dict = {}

    if model_data:
        for cat in model_data.get("categories", []):
            cat_breakdown[cat] = cat_breakdown.get(cat, 0) + 1
        for act in model_data.get("actions", []):
            act_breakdown[act] = act_breakdown.get(act, 0) + 1

    return {
        "dataset": {
            "total_records": len(model_data.get("prompts", [])) if model_data else 0,
            "categories": cat_breakdown,
            "actions": act_breakdown,
        },
        "session": _session,
        "category_meta": CATEGORY_META,
        "action_meta": ACTION_META,
    }


@router.get("/health")
async def health():
    """Readiness probe — returns 200 once models are loaded."""
    model_data = get_model_data()
    return {
        "status": "ready" if model_data else "loading",
        "embeddings": len(model_data.get("prompts", [])) if model_data else 0,
    }
