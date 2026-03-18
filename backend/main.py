"""
PromptShield FastAPI Backend — main entry point
"""
import logging
import sys
import io
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import HOST, PORT, ALLOWED_ORIGINS
from ai.load_model import load_models
from api.analyze import router as analyze_router

# ── Logging ────────────────────────────────────────────────────────────────
# Fix UTF-8 encoding for Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("promptshield")


# ── Lifespan (startup / shutdown) ──────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Loads the USE model and model_data.json exactly once at startup.
    All subsequent requests reuse the cached in-memory objects.
    """
    logger.info("🔄  PromptShield startup — loading AI engine …")
    load_models()
    logger.info("🛡️   PromptShield API ready")
    yield
    logger.info("🔻  PromptShield shutting down")


# ── FastAPI App ────────────────────────────────────────────────────────────
app = FastAPI(
    title="PromptShield API",
    description="AI Prompt Injection Firewall — Universal Sentence Encoder + cosine similarity",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS — allow Vite dev server and production origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes under /api
app.include_router(analyze_router, prefix="/api")


# ── Dev entry point ────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=False,   # reload=True breaks TF Hub caching
        log_level="info",
    )
