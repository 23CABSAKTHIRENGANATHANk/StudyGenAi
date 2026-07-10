from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from ..db import get_connection
from ..deps import get_current_user

router = APIRouter()


class NoteOut(BaseModel):
    id: str
    document_id: Optional[str]
    title: str
    content: str
    type: str
    created_at: Optional[str]


class FlashcardOut(BaseModel):
    id: str
    document_id: Optional[str]
    question: str
    answer: str
    created_at: Optional[str]


class QuizOut(BaseModel):
    id: str
    document_id: Optional[str]
    title: str
    questions: list
    created_at: Optional[str]


def _resolve_uid(user) -> str:
    if isinstance(user, dict):
        uid = user.get('id') or user.get('sub')
    else:
        uid = getattr(user, 'id', None)
    if not uid:
        raise HTTPException(status_code=401, detail='Could not determine user identity')
    return str(uid)


# ── Notes ─────────────────────────────────────────────────────────────────────

@router.get("/notes")
async def list_notes(
    limit: int = Query(default=50, ge=1, le=200),
    user: dict = Depends(get_current_user)
):
    """Return the authenticated user's saved notes."""
    user_id = _resolve_uid(user)
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, document_id, title, content, type, created_at
                   FROM notes WHERE user_id = %s
                   ORDER BY created_at DESC LIMIT %s""",
                (user_id, limit)
            )
            rows = cur.fetchall()
    finally:
        conn.close()

    return {
        "notes": [
            {
                "id": str(r[0]),
                "document_id": str(r[1]) if r[1] else None,
                "title": r[2],
                "content": r[3],
                "type": r[4],
                "created_at": r[5].isoformat() if r[5] else None,
            }
            for r in rows
        ]
    }


@router.delete("/notes/{note_id}")
async def delete_note(note_id: str, user: dict = Depends(get_current_user)):
    user_id = _resolve_uid(user)
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM notes WHERE id = %s AND user_id = %s RETURNING id",
                (note_id, user_id)
            )
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Note not found")
        conn.commit()
    finally:
        conn.close()
    return {"message": "Deleted", "id": note_id}


# ── Flashcards ────────────────────────────────────────────────────────────────

@router.get("/flashcards")
async def list_flashcards(
    limit: int = Query(default=100, ge=1, le=500),
    user: dict = Depends(get_current_user)
):
    """Return the authenticated user's saved flashcards."""
    user_id = _resolve_uid(user)
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, document_id, question, answer, created_at
                   FROM flashcards WHERE user_id = %s
                   ORDER BY created_at DESC LIMIT %s""",
                (user_id, limit)
            )
            rows = cur.fetchall()
    finally:
        conn.close()

    return {
        "flashcards": [
            {
                "id": str(r[0]),
                "document_id": str(r[1]) if r[1] else None,
                "question": r[2],
                "answer": r[3],
                "created_at": r[4].isoformat() if r[4] else None,
            }
            for r in rows
        ]
    }


@router.delete("/flashcards/{card_id}")
async def delete_flashcard(card_id: str, user: dict = Depends(get_current_user)):
    user_id = _resolve_uid(user)
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM flashcards WHERE id = %s AND user_id = %s RETURNING id",
                (card_id, user_id)
            )
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Flashcard not found")
        conn.commit()
    finally:
        conn.close()
    return {"message": "Deleted", "id": card_id}


# ── Quizzes ───────────────────────────────────────────────────────────────────

@router.get("/quizzes")
async def list_quizzes(
    limit: int = Query(default=50, ge=1, le=200),
    user: dict = Depends(get_current_user)
):
    """Return the authenticated user's saved quizzes."""
    user_id = _resolve_uid(user)
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, document_id, title, questions, created_at
                   FROM quizzes WHERE user_id = %s
                   ORDER BY created_at DESC LIMIT %s""",
                (user_id, limit)
            )
            rows = cur.fetchall()
    finally:
        conn.close()

    return {
        "quizzes": [
            {
                "id": str(r[0]),
                "document_id": str(r[1]) if r[1] else None,
                "title": r[3],
                "questions": r[3] if isinstance(r[3], list) else [],
                "created_at": r[4].isoformat() if r[4] else None,
            }
            for r in rows
        ]
    }
