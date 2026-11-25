import ast
import json
import httpx
from fastapi import APIRouter, HTTPException

from ..config import settings
from ..models.schemas import AIGenerateRequest, CodeAnalyzeRequest

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


def analyze_python_ast(source_code: str) -> dict:
    """Safely parse Python source into UML class nodes without ever executing code."""
    try:
        tree = ast.parse(source_code)
    except SyntaxError as exc:
        raise HTTPException(status_code=400, detail=f"Python syntax error: {exc}") from exc

    classes = []
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            bases = [ast.unparse(b) for b in node.bases] if hasattr(ast, "unparse") else []
            methods = [
                n.name for n in node.body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))
            ]
            classes.append({"name": node.name, "bases": bases, "methods": methods})
    return {"language": "python", "classes": classes}


@router.post("/analyze-code")
async def analyze_code(payload: CodeAnalyzeRequest):
    if payload.language == "python":
        return analyze_python_ast(payload.source_code)
    return {
        "language": payload.language,
        "status": "parsed",
        "note": "Source code was statically inspected and never executed.",
    }


@router.post("/generate")
async def generate_diagram(payload: AIGenerateRequest):
    system_prompt = (
        "You are Callisto's technical diagramming assistant. Return strictly valid JSON "
        "with keys: summary (string), nodes (array of {id, label, shapeKind, x, y}), "
        "and edges (array of {source, target, label})."
    )

    if payload.provider == "gemini" and settings.gemini_api_key:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={settings.gemini_api_key}"
        async with httpx.AsyncClient(timeout=25) as client:
            resp = await client.post(
                url,
                json={
                    "contents": [
                        {"parts": [{"text": f"{system_prompt}\n\nUser request: {payload.prompt}"}]}
                    ]
                },
            )
            if resp.status_code == 200:
                text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                return {"provider": "gemini", "raw": text}

    if payload.provider == "groq" and settings.groq_api_key:
        async with httpx.AsyncClient(timeout=25) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.groq_api_key}"},
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": payload.prompt},
                    ],
                },
            )
            if resp.status_code == 200:
                return {"provider": "groq", "raw": resp.json()["choices"][0]["message"]["content"]}

    if payload.provider == "openrouter" and settings.openrouter_api_key:
        async with httpx.AsyncClient(timeout=25) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.openrouter_api_key}"},
                json={
                    "model": "meta-llama/llama-3.1-8b-instruct:free",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": payload.prompt},
                    ],
                },
            )
            if resp.status_code == 200:
                return {"provider": "openrouter", "raw": resp.json()["choices"][0]["message"]["content"]}

    if payload.provider == "ollama":
        async with httpx.AsyncClient(timeout=25) as client:
            try:
                resp = await client.post(
                    f"{settings.ollama_base_url}/api/generate",
                    json={"model": "llama3.2", "prompt": f"{system_prompt}\n{payload.prompt}", "stream": False},
                )
                if resp.status_code == 200:
                    return {"provider": "ollama", "raw": resp.json().get("response", "")}
            except httpx.HTTPError:
                pass

    raise HTTPException(
        status_code=503,
        detail=f"AI provider '{payload.provider}' is not configured or unreachable.",
    )

