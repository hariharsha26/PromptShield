"""
AI Model Loader — loads model_data.json and Universal Sentence Encoder once at startup,
then caches both in memory for sub-200ms inference.
"""
import json
import logging
import numpy as np
import tensorflow_hub as hub

from config import MODEL_DATA_PATH, USE_MODEL_URL

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────
# In-memory caches (populated at startup)
# ──────────────────────────────────────────
_use_model = None           # TF-Hub USE model
_model_data: dict = {}      # Raw JSON: prompts / embeddings / categories / actions
_embeddings_matrix = None   # NumPy (N, 512) — pre-stacked for vectorised cosine


def load_models() -> None:
    """
    Called once during FastAPI startup.
    Loads USE from TF-Hub and model_data.json embeddings into memory.
    """
    global _use_model, _model_data, _embeddings_matrix

    # 1. Load JSON embeddings
    logger.info("📂 Loading model_data.json …")
    with open(MODEL_DATA_PATH, "r", encoding="utf-8") as f:
        _model_data = json.load(f)

    n_prompts = len(_model_data.get("prompts", []))
    logger.info(f"✅ Loaded {n_prompts} prompt embeddings from model_data.json")

    # 2. Pre-stack into a NumPy matrix (enables vectorised similarity in one call)
    _embeddings_matrix = np.array(_model_data["embeddings"], dtype=np.float32)

    # 3. Load Universal Sentence Encoder from TF-Hub
    logger.info("🧠 Loading Universal Sentence Encoder from TF-Hub …")
    _use_model = hub.load(USE_MODEL_URL)
    logger.info("✅ USE model loaded and ready")


def get_use_model():
    return _use_model


def get_model_data() -> dict:
    return _model_data


def get_embeddings_matrix() -> np.ndarray:
    return _embeddings_matrix
