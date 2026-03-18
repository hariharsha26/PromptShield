"""
PromptShield Configuration
"""
import os

# Server
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# Model
MODEL_DATA_PATH = os.path.join(os.path.dirname(__file__), "model", "model_data.json")
USE_MODEL_URL = "https://tfhub.dev/google/universal-sentence-encoder/4"

# Similarity
SIMILARITY_THRESHOLD = 0.30   # Below this → Safe by default
TOP_K_MATCHES = 5              # Top cosine matches to evaluate

# CORS
ALLOWED_ORIGINS = [
    "http://localhost:5173",   # Vite dev server
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]
