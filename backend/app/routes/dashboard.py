from fastapi import APIRouter, Depends, HTTPException
from ..db import get_connection
from ..deps import get_current_user
from ..utils.common import resolve_user_id

router = APIRouter()


@router.get("/overview")
async def dashboard_overview(user: dict = Depends(get_current_user)):
    """Return live usage stats and recent documents for the authenticated user."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            # Document count
            cur.execute("SELECT COUNT(*) FROM documents WHERE user_id = %s", (user_id,))
            doc_count = cur.fetchone()[0]

            # Notes count
            cur.execute("SELECT COUNT(*) FROM notes WHERE user_id = %s", (user_id,))
            notes_count = cur.fetchone()[0]

            # Flashcard count
            cur.execute("SELECT COUNT(*) FROM flashcards WHERE user_id = %s", (user_id,))
            flashcard_count = cur.fetchone()[0]

            # Quiz count
            cur.execute("SELECT COUNT(*) FROM quizzes WHERE user_id = %s", (user_id,))
            quiz_count = cur.fetchone()[0]

            # Recent documents (newest 5)
            cur.execute(
                """SELECT id, name, subject, mime_type, size_bytes, created_at
                   FROM documents
                   WHERE user_id = %s
                   ORDER BY created_at DESC
                   LIMIT 5""",
                (user_id,)
            )
            rows = cur.fetchall()

    recent_documents = [
        {
            "id": r[0],
            "name": r[1],
            "subject": r[2],
            "mime_type": r[3],
            "size_bytes": r[4],
            "created_at": r[5].isoformat() if r[5] else None,
        }
        for r in rows
    ]

    return {
        "welcome": "Welcome to StudyGen AI",
        "recent_documents": recent_documents,
        "usage": {
            "documents_uploaded": doc_count,
            "notes_generated": notes_count,
            "flashcards_created": flashcard_count,
            "quizzes_taken": quiz_count,
        }
    }
