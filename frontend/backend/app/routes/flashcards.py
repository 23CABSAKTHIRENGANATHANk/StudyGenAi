from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from ..db import get_connection
from ..deps import get_current_user
from ..utils.common import resolve_user_id

router = APIRouter()


class FlashcardCreate(BaseModel):
    document_id: Optional[str] = None
    question: str
    answer: str


class FlashcardUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None


@router.get("/")
async def list_flashcards(
    document_id: Optional[str] = None,
    limit: int = 100,
    user: dict = Depends(get_current_user)
):
    """List flashcards for the authenticated user."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            if document_id:
                cur.execute(
                    """SELECT id, document_id, question, answer, created_at, updated_at
                       FROM flashcards
                       WHERE user_id = %s AND document_id = %s
                       ORDER BY created_at DESC
                       LIMIT %s""",
                    (user_id, document_id, limit)
                )
            else:
                cur.execute(
                    """SELECT id, document_id, question, answer, created_at, updated_at
                       FROM flashcards
                       WHERE user_id = %s
                       ORDER BY created_at DESC
                       LIMIT %s""",
                    (user_id, limit)
                )
            rows = cur.fetchall()

    return {
        "flashcards": [
            {
                "id": r[0],
                "document_id": r[1],
                "question": r[2],
                "answer": r[3],
                "created_at": r[4].isoformat() if r[4] else None,
                "updated_at": r[5].isoformat() if r[5] else None,
            }
            for r in rows
        ]
    }


@router.post("/")
async def create_flashcard(data: FlashcardCreate, user: dict = Depends(get_current_user)):
    """Create a new flashcard."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            if data.document_id:
                cur.execute(
                    "SELECT id FROM documents WHERE id = %s AND user_id = %s",
                    (data.document_id, user_id)
                )
                if not cur.fetchone():
                    raise HTTPException(status_code=404, detail="Document not found")

            cur.execute(
                """INSERT INTO flashcards (user_id, document_id, question, answer)
                   VALUES (%s, %s, %s, %s)
                   RETURNING id""",
                (user_id, data.document_id, data.question, data.answer)
            )
            fc_id = cur.fetchone()[0]
            conn.commit()

    return {"message": "Flashcard created", "flashcard_id": fc_id}


@router.put("/{flashcard_id}")
async def update_flashcard(
    flashcard_id: str,
    data: FlashcardUpdate,
    user: dict = Depends(get_current_user)
):
    """Update a flashcard."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM flashcards WHERE id = %s AND user_id = %s",
                (flashcard_id, user_id)
            )
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Flashcard not found")

            fields = []
            values = []
            if data.question is not None:
                fields.append("question = %s")
                values.append(data.question)
            if data.answer is not None:
                fields.append("answer = %s")
                values.append(data.answer)
            if not fields:
                raise HTTPException(status_code=400, detail="No fields to update")

            fields.append("updated_at = now()")
            values.append(flashcard_id)
            values.append(user_id)

            cur.execute(
                f"UPDATE flashcards SET {', '.join(fields)} WHERE id = %s AND user_id = %s",
                values
            )
            conn.commit()

    return {"message": "Flashcard updated", "flashcard_id": flashcard_id}


@router.delete("/{flashcard_id}")
async def delete_flashcard(flashcard_id: str, user: dict = Depends(get_current_user)):
    """Delete a flashcard."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM flashcards WHERE id = %s AND user_id = %s RETURNING id",
                (flashcard_id, user_id)
            )
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Flashcard not found")
            conn.commit()

    return {"message": "Flashcard deleted", "flashcard_id": flashcard_id}
