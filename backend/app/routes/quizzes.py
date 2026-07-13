import json
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from ..db import get_connection
from ..deps import get_current_user
from ..utils.common import resolve_user_id

router = APIRouter()


class QuizCreate(BaseModel):
    document_id: Optional[str] = None
    title: str
    questions: List[dict]
    summary: Optional[str] = None


class QuizResultCreate(BaseModel):
    quiz_id: str
    score: int
    total: int
    answers: dict


@router.get("/")
async def list_quizzes(
    document_id: Optional[str] = None,
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    """List quizzes for the authenticated user."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            if document_id:
                cur.execute(
                    """SELECT id, document_id, title, questions, summary, created_at, updated_at
                       FROM quizzes
                       WHERE user_id = %s AND document_id = %s
                       ORDER BY created_at DESC
                       LIMIT %s""",
                    (user_id, document_id, limit)
                )
            else:
                cur.execute(
                    """SELECT id, document_id, title, questions, summary, created_at, updated_at
                       FROM quizzes
                       WHERE user_id = %s
                       ORDER BY created_at DESC
                       LIMIT %s""",
                    (user_id, limit)
                )
            rows = cur.fetchall()

    return {
        "quizzes": [
            {
                "id": r[0],
                "document_id": r[1],
                "title": r[2],
                "questions": r[3],
                "summary": r[4],
                "created_at": r[5].isoformat() if r[5] else None,
                "updated_at": r[6].isoformat() if r[6] else None,
            }
            for r in rows
        ]
    }


@router.post("/")
async def create_quiz(data: QuizCreate, user: dict = Depends(get_current_user)):
    """Create a new quiz."""
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
                """INSERT INTO quizzes (user_id, document_id, title, questions, summary)
                   VALUES (%s, %s, %s, %s, %s)
                   RETURNING id""",
                (user_id, data.document_id, data.title, json.dumps(data.questions), data.summary)
            )
            quiz_id = cur.fetchone()[0]
            conn.commit()

    return {"message": "Quiz created", "quiz_id": quiz_id}


@router.get("/{quiz_id}")
async def get_quiz(quiz_id: str, user: dict = Depends(get_current_user)):
    """Get a single quiz."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, document_id, title, questions, summary, created_at, updated_at
                   FROM quizzes
                   WHERE id = %s AND user_id = %s""",
                (quiz_id, user_id)
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Quiz not found")

    return {
        "id": row[0],
        "document_id": row[1],
        "title": row[2],
        "questions": row[3],
        "summary": row[4],
        "created_at": row[5].isoformat() if row[5] else None,
        "updated_at": row[6].isoformat() if row[6] else None,
    }


@router.delete("/{quiz_id}")
async def delete_quiz(quiz_id: str, user: dict = Depends(get_current_user)):
    """Delete a quiz."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM quizzes WHERE id = %s AND user_id = %s RETURNING id",
                (quiz_id, user_id)
            )
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Quiz not found")
            conn.commit()

    return {"message": "Quiz deleted", "quiz_id": quiz_id}


@router.post("/results")
async def submit_quiz_result(data: QuizResultCreate, user: dict = Depends(get_current_user)):
    """Submit a quiz result."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            # Verify quiz exists and belongs to user
            cur.execute(
                "SELECT id FROM quizzes WHERE id = %s AND user_id = %s",
                (data.quiz_id, user_id)
            )
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Quiz not found")

            cur.execute(
                """INSERT INTO quiz_results (quiz_id, user_id, score, total, answers)
                   VALUES (%s, %s, %s, %s, %s)
                   RETURNING id""",
                (data.quiz_id, user_id, data.score, data.total, json.dumps(data.answers))
            )
            result_id = cur.fetchone()[0]
            conn.commit()

    return {"message": "Result submitted", "result_id": result_id}


@router.get("/results/{quiz_id}")
async def get_quiz_results(quiz_id: str, user: dict = Depends(get_current_user)):
    """Get all results for a specific quiz."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, score, total, answers, completed_at
                   FROM quiz_results
                   WHERE quiz_id = %s AND user_id = %s
                   ORDER BY completed_at DESC""",
                (quiz_id, user_id)
            )
            rows = cur.fetchall()

    return {
        "results": [
            {
                "id": r[0],
                "score": r[1],
                "total": r[2],
                "answers": r[3],
                "completed_at": r[4].isoformat() if r[4] else None,
            }
            for r in rows
        ]
    }
