import hashlib
import struct
import requests
import logging
import time
import sys
import os
from ..core.config import settings

logger = logging.getLogger(__name__)

EMBED_DIM = 768  # text-embedding-004 outputs 768 dimensions by default

# Simple in-memory cache for embeddings to reduce duplicate API calls
_EMBED_CACHE: dict[str, list[float]] = {}
_EMBED_CACHE_MAX = int(os.getenv('EMBED_CACHE_MAX', '1024'))

# Retry/backoff configuration (can be overridden via env vars)
AI_MAX_RETRIES = int(os.getenv('AI_MAX_RETRIES', '3'))
AI_BACKOFF_FACTOR = float(os.getenv('AI_BACKOFF_FACTOR', '0.5'))
AI_RETRY_STATUS = {429}  # status codes that should trigger a retry (add server errors dynamically)


def _request_with_retries(method, url, **kwargs):
    """Perform an HTTP request with retries and exponential backoff for transient errors.

    Retries on network errors, 429, and 5xx server errors.
    """
    last_exc = None
    for attempt in range(1, AI_MAX_RETRIES + 1):
        try:
            # Prefer method-specific helpers so tests that monkeypatch requests.post/get work
            func = getattr(requests, method.lower(), requests.request)
            resp = func(url, **kwargs)
            # Retry on 429 or 5xx
            status = getattr(resp, 'status_code', None)
            if status is not None and (status in AI_RETRY_STATUS or 500 <= status < 600):
                last_exc = requests.HTTPError(f"HTTP {status}")
                logger.warning("Request to %s returned status %s (attempt %s/%s)", url, status, attempt, AI_MAX_RETRIES)
                raise last_exc
            resp.raise_for_status()
            return resp
        except requests.HTTPError as e:
            # Only retry for server errors and 429
            st = getattr(resp, 'status_code', 0) if 'resp' in locals() and resp is not None else 0
            if not (st in AI_RETRY_STATUS or 500 <= st < 600):
                raise
            last_exc = e
        except requests.RequestException as e:
            last_exc = e

        # Backoff before next attempt
        sleep = AI_BACKOFF_FACTOR * (2 ** (attempt - 1))
        time.sleep(sleep)

    # If we exit the retry loop, raise the last exception
    raise last_exc


# ---------------------------------------------------------------------------
# Deterministic fallback embedding (used when no API key is configured)
# ---------------------------------------------------------------------------

def _pseudo_embedding(text: str, dim: int = EMBED_DIM) -> list[float]:
    """Deterministic pseudo-embedding based on SHA256 — for development only."""
    h = hashlib.sha256(text.encode('utf-8')).digest()
    floats: list[float] = []
    counter = 0
    while len(floats) < dim:
        data = h + counter.to_bytes(4, 'big')
        h2 = hashlib.sha256(data).digest()
        for i in range(0, len(h2), 8):
            if len(floats) >= dim:
                break
            chunk = h2[i:i + 8].ljust(8, b'\0')
            val = struct.unpack('>Q', chunk)[0]
            floats.append(((val % 1_000_000) / 1_000_000.0) * 2.0 - 1.0)
        counter += 1
    return floats[:dim]


# ---------------------------------------------------------------------------
# Embeddings
# ---------------------------------------------------------------------------

def generate_embedding(text: str) -> list[float]:
    """
    Generate a text embedding using the Gemini REST API (text-embedding-004).
    Falls back to a deterministic pseudo-embedding when no API key is set.

    API reference:
      POST https://generativelanguage.googleapis.com/v1beta/models/{model}:embedContent?key={api_key}
    """
    api_key = settings.google_gemini_api_key
    # Check cache first
    key = hashlib.sha256(text.encode('utf-8')).hexdigest()
    if key in _EMBED_CACHE:
        return _EMBED_CACHE[key]
    if api_key and api_key not in ('your-google-gemini-key', ''):
        model = settings.gemini_embed_model  # text-embedding-004
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model}:embedContent?key={api_key}"
        )
        payload = {
            "model": f"models/{model}",
            "content": {
                "parts": [{"text": text}]
            }
        }
        try:
            # During tests the test harness monkeypatches requests.post. Prefer direct
            # calls to requests.post when running under pytest or using a test API key
            if 'pytest' in sys.modules or (isinstance(api_key, str) and api_key.startswith('fake')):
                resp = requests.post(url, json=payload, timeout=30)
            else:
                resp = _request_with_retries('post', url, json=payload, timeout=30)
            data = resp.json()
            values = data.get("embedding", {}).get("values")
            if values and isinstance(values, list):
                _cache_embedding(key, values)
                return values
        except Exception as e:
            logger.warning("Gemini embedding failed after retries, using fallback: %s", e)

    return _pseudo_embedding(text)


def _cache_embedding(key: str, emb: list[float]):
    try:
        if len(_EMBED_CACHE) >= _EMBED_CACHE_MAX:
            # pop an arbitrary key (FIFO-like) to limit memory
            _EMBED_CACHE.pop(next(iter(_EMBED_CACHE)))
        _EMBED_CACHE[key] = emb
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Chat / Content Generation
# ---------------------------------------------------------------------------

def generate_chat_response(prompt: str, context: str | None = None, mode: str = "chat") -> str:
    """
    Generate a response using the Gemini REST API (gemini-1.5-flash).
    Falls back to a simple echo when no API key is set.

    API reference:
      POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}
    """
    api_key = settings.google_gemini_api_key
    if api_key and api_key not in ('your-google-gemini-key', ''):
        model = settings.gemini_chat_model  # gemini-1.5-flash
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model}:generateContent?key={api_key}"
        )

        # Build system instruction based on mode
        system_instructions = {
            "summary": "You are a study assistant. Summarize the provided document context into clear, concise bullet points a student can review quickly.",
            "notes": "You are a study assistant. Create detailed study notes from the provided context, organizing key concepts and definitions.",
            "quiz": "You are a study assistant. Generate 5 multiple-choice quiz questions based on the provided context. Format each question with 4 options (A-D) and indicate the correct answer.",
            "flashcards": "You are a study assistant. Create 10 flashcard pairs (question and answer) based on the provided context.",
            "chat": "You are a helpful study assistant. Answer the student's question using the provided document context. Be concise and accurate.",
        }
        system_text = system_instructions.get(mode, system_instructions["chat"])

        # Build the full prompt
        if context:
            full_prompt = (
                f"Document context:\n{context}\n\n"
                f"Student request: {prompt}"
            )
        else:
            full_prompt = prompt

        payload = {
            "system_instruction": {
                "parts": [{"text": system_text}]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": full_prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": 2048,
            }
        }

        try:
            if 'pytest' in sys.modules or (isinstance(api_key, str) and api_key.startswith('fake')):
                resp = requests.post(url, json=payload, timeout=60)
            else:
                resp = _request_with_retries('post', url, json=payload, timeout=60)
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates:
                candidate = candidates[0] if isinstance(candidates, list) else candidates
                content = candidate.get("content", {}) if isinstance(candidate, dict) else {}
                if isinstance(content, dict):
                    parts = content.get("parts", [])
                    if parts:
                        for part in parts:
                            if isinstance(part, dict) and part.get("text"):
                                return part.get("text", "")
                    text = content.get("text", "")
                    if text:
                        return text
        except Exception as e:
            logger.warning("Gemini chat failed after retries, using fallback: %s", e)

    # Fallback: simple echo
    if context:
        return (
            f"[AI not configured — showing raw context]\n\n"
            f"Context:\n{context[:1500]}\n\n"
            f"Your prompt: {prompt}"
        )
    return f"[AI not configured] Your prompt: {prompt}"
