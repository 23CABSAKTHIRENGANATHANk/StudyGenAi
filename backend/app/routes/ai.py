import json
import uuid
import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from ..db import get_connection
from ..services import ai_service
from ..deps import get_current_user
from ..utils.common import resolve_user_id
from ..middleware.rate_limit import rate_limit
from ..core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


class AIRequest(BaseModel):
    document_id: str
    prompt: str
    mode: Optional[str] = "summary"  # summary | notes | quiz | flashcards | chat


def _fetch_context(document_id: str, prompt: str) -> str:
    """Retrieve top-5 most relevant document chunks for a given prompt."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            try:
                # Attempt semantic search using pgvector cosine similarity
                embed = ai_service.generate_embedding(prompt)
                cur.execute(
                    """
                    SELECT dc.content
                    FROM embeddings e
                    JOIN document_chunks dc ON e.document_chunk_id = dc.id
                    WHERE dc.document_id = %s
                    ORDER BY e.vector <=> %s::vector
                    LIMIT 5
                    """,
                    (document_id, str(embed))
                )
                rows = cur.fetchall()
                if rows:
                    return '\n\n'.join(r[0] for r in rows)
            except Exception:
                # pgvector not available or other error — fall back to first chunks
                pass

            # Fallback: return earliest chunks
            cur.execute(
                "SELECT content FROM document_chunks WHERE document_id = %s ORDER BY chunk_index LIMIT 5",
                (document_id,)
            )
            rows = cur.fetchall()
            return '\n\n'.join(r[0] for r in rows)


def _save_generated_content(mode: str, result: str, document_id: str, user_id: str) -> None:
    """Persist generated AI content into the appropriate table for dashboard stats."""
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                if mode in ("summary", "notes"):
                    title = f"{'Summary' if mode == 'summary' else 'Notes'} — {document_id[:8]}"
                    cur.execute(
                        """INSERT INTO notes (id, user_id, document_id, title, content, type)
                           VALUES (%s, %s, %s, %s, %s, %s)
                           ON CONFLICT DO NOTHING""",
                        (str(uuid.uuid4()), user_id, document_id, title, result, mode)
                    )
                elif mode == "flashcards":
                    # Parse flashcard pairs from the AI result
                    pairs = _parse_flashcards(result)
                    for q, a in pairs:
                        cur.execute(
                            """INSERT INTO flashcards (id, user_id, document_id, question, answer)
                               VALUES (%s, %s, %s, %s, %s)""",
                            (str(uuid.uuid4()), user_id, document_id, q, a)
                        )
                elif mode == "quiz":
                    cur.execute(
                        """INSERT INTO quizzes (id, user_id, document_id, title, questions)
                           VALUES (%s, %s, %s, %s, %s::jsonb)""",
                        (
                            str(uuid.uuid4()),
                            user_id,
                            document_id,
                            f"Quiz — {document_id[:8]}",
                            json.dumps([{"raw": result}])
                        )
                    )
            conn.commit()
    except Exception as e:
        logger.warning("Could not save generated content to DB: %s", e)


def _parse_flashcards(text: str) -> list[tuple[str, str]]:
    """Extract Q&A pairs from Gemini flashcard output."""
    pairs: list[tuple[str, str]] = []
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if line.lower().startswith(('q:', 'question:', 'front:')):
            question = line.split(':', 1)[-1].strip()
            if i + 1 < len(lines):
                answer_line = lines[i + 1].strip()
                if answer_line.lower().startswith(('a:', 'answer:', 'back:')):
                    answer = answer_line.split(':', 1)[-1].strip()
                    if question and answer:
                        pairs.append((question, answer))
                    i += 2
                    continue
        i += 1
    # If no structured pairs found, create a single pair with full text
    if not pairs and text.strip():
        pairs.append(("Generated Flashcards", text[:500]))
    return pairs


@router.post("/generate")
@rate_limit(max_requests=10, window_seconds=60)
async def generate_ai_content(
    request: AIRequest,
    user: dict = Depends(get_current_user)
):
    """Generate AI study content (summary, notes, quiz, or flashcards) for a document."""
    user_id = resolve_user_id(user)

    # Verify the document belongs to the requesting user
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM documents WHERE id = %s AND user_id = %s",
                (request.document_id, user_id)
            )
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Document not found")

    context = _fetch_context(request.document_id, request.prompt)
    mode = request.mode or "summary"
    result = ai_service.generate_chat_response(
        prompt=request.prompt,
        context=context,
        mode=mode
    )

    # Persist the result so dashboard stats reflect it
    _save_generated_content(mode, result, request.document_id, user_id)

    return {
        "document_id": request.document_id,
        "mode": mode,
        "result": result
    }


@router.get('/key-check')
async def key_check():
    """Return basic status about Gemini API key configuration (masked)."""
    key = settings.google_gemini_api_key
    if not key or key in ('', 'your-google-gemini-key'):
        return {"configured": False}
    masked = ('*' * max(0, len(key) - 4)) + key[-4:]
    return {
        "configured": True,
        "key_masked": masked,
        "embed_model": settings.gemini_embed_model,
        "chat_model": settings.gemini_chat_model,
    }


@router.post("/chat")
@rate_limit(max_requests=15, window_seconds=60)
async def chat_document(
    request: AIRequest,
    user: dict = Depends(get_current_user)
):
    """Chat with a document using conversational context retrieval."""
    user_id = resolve_user_id(user)

    # Verify ownership
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM documents WHERE id = %s AND user_id = %s",
                (request.document_id, user_id)
            )
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Document not found")

    context = _fetch_context(request.document_id, request.prompt)
    reply = ai_service.generate_chat_response(
        prompt=request.prompt,
        context=context,
        mode="chat"
    )
    return {
        "document_id": request.document_id,
        "reply": reply
    }
