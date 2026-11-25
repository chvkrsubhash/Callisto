# Callisto — Professional Diagramming and UML Design Platform

**A product of AkashaVyom Labs** · *Connect Ideas. Design Systems.*

Callisto is a browser-based vector diagramming, UML 2.x modeling, ER database design, and software architecture platform built with React, TypeScript, XYFlow, ELK.js, Dagre, CodeMirror, IndexedDB, and a Python FastAPI + MongoDB Atlas backend.

---

## Project Structure

- `frontend/` — React 19 + TypeScript + Vite + Tailwind CSS + XYFlow + Zustand + Vitest
- `backend/` — Python FastAPI + Motor (MongoDB) + WebSockets (Yjs-compatible relay) + AI Provider Proxy + Pytest
- `docs/` — Schema, API, Security, Ecosystem Integration, and Feature Completion documentation

---

## Installation & Local Development

### 1. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Run frontend unit tests and production build:

```bash
cd frontend
npm test
npm run build
```

### 2. Backend (Python 3.11+)

```bash
cd backend
cp .env.example .env
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Run backend tests:

```bash
cd backend
pytest
```

---

## Deployment Notes

- **Frontend:** Build static assets via `npm run build` (`frontend/dist/`) and serve from any CDN or static host (Cloudflare Pages, Netlify, Vercel, Nginx).
- **Backend:** Run `uvicorn app.main:app --host 0.0.0.0 --port 8000` behind TLS (Caddy / Nginx / Fly.io / Render) with `MONGODB_URI`, `JWT_SECRET_KEY`, and server-side AI provider keys configured via environment variables.

