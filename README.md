# PromptShield v3.0

PromptShield is an AI-powered Prompt Injection Firewall. It utilizes Google's Universal Sentence Encoder (USE) via TensorFlow Hub and highly optimized NumPy vectorized cosine similarity to identify, block, flag, or monitor malicious prompts with sub-200ms latency.

## Architecture Migration

This repository was fully refactored from a monolithic Node.js/HTML deployment into a modern, decoupled production-ready architecture:

1. **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, Lucide Icons, shadcn-like class structures.
2. **Backend**: FastAPI (Python), Uvicorn, TensorFlow, Numpy, optimized caching layers.

---

## 🚀 Quick Start

### 1. Backend (FastAPI)

Prerequisites: Python 3.10+

```bash
cd promptshield/backend
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate # Mac/Linux

pip install -r requirements.txt

# Start the server on port 8000
python main.py
```

The AI model will load on startup (takes ~10-15 seconds the first time). Once loaded, inference operations are heavily cached.

### 2. Frontend (React / Vite)

Prerequisites: Node.js 20+

```bash
cd promptshield/frontend
npm i --legacy-peer-deps

# Start the dev server on port 5173
npm run dev
```

The frontend uses Vite's proxy capabilities to silently forward `/api/` calls directly to the FastAPI server running on `localhost:8000`.

---

## 🗂️ Component Directory

- **`frontend/src/components/PromptInput.tsx`**: Input field with examples, char limit, and loading states.
- **`frontend/src/components/RiskMeter.tsx`**: Visualizes threat levels with a responsive gradient bar and confidence SVG circle.
- **`frontend/src/components/PipelineVisualizer.tsx`**: Displays the active status of the 5-step classification framework.
- **`frontend/src/components/ResultPanel.tsx`**: Displays categorical meta data, AI agent dummy responses, and Nearest-Neighbor matching patterns.

## 🧠 AI Engine
- **`backend/ai/inference.py`**: The classification brain, driving vectorized calculations.
- **`backend/ai/load_model.py`**: Model caching limits memory overhead.
- **`backend/ai/similarity.py`**: Fast O(1) comparison against datasets using pure numpy matrices.

*This project is built for defense-in-depth security demonstration and testing.*
# PromptShield
