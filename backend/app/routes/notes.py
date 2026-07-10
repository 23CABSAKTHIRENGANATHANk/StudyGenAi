from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from ..db import get_connection
from ..deps import get_current_user
from ..utils.common import resolve_user_id
from ..middleware.rate_limit import rate_limit

router = APIRouter()


class NoteCreate(BaseModel):
    document_id: Optional[str] = None
    title: str
    content: str
    type: Optional[str] = "auto"


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    type: Optional[str] = None


@router.get("/")
async def list_notes(
    document_id: Optional[str] = None,
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    """List all notes for the authenticated user, optionally filtered by document."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            if document_id:
                cur.execute(
                    """SELECT id, document_id, title, content, type, created_at, updated_at
                       FROM notes
                       WHERE user_id = %s AND document_id = %s
                       ORDER BY updated_at DESC
                       LIMIT %s""",
                    (user_id, document_id, limit)
                )
            else:
                cur.execute(
                    """SELECT id, document_id, title, content, type, created_at, updated_at
                       FROM notes
                       WHERE user_id = %s
                       ORDER BY updated_at DESC
                       LIMIT %s""",
                    (user_id, limit)
                )
            rows = cur.fetchall()

    notes = [
        {
            "id": r[0],
            "document_id": r[1],
            "title": r[2],
            "content": r[3],
            "type": r[4],
            "created_at": r[5].isoformat() if r[5] else None,
            "updated_at": r[6].isoformat() if r[6] else None,
        }
        for r in rows
    ]
    return {"notes": notes}


@router.post("/")
@rate_limit(max_requests=30, window_seconds=60)
async def create_note(data: NoteCreate, user: dict = Depends(get_current_user)):
    """Create a new note."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            # Verify document ownership if document_id provided
            if data.document_id:
                cur.execute(
                    "SELECT id FROM documents WHERE id = %s AND user_id = %s",
                    (data.document_id, user_id)
                )
                if not cur.fetchone():
                    raise HTTPException(status_code=404, detail="Document not found")

            note_id = cur.execute(
                """INSERT INTO notes (user_id, document_id, title, content, type)
                   VALUES (%s, %s, %s, %s, %s)
                   RETURNING id""",
                (user_id, data.document_id, data.title, data.content, data.type or "auto")
            ).fetchone()[0]
            conn.commit()

    return {"message": "Note created", "note_id": note_id}


@router.get("/{note_id}")
async def get_note(note_id: str, user: dict = Depends(get_current_user)):
    """Get a single note by ID."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, document_id, title, content, type, created_at, updated_at
                   FROM notes
                   WHERE id = %s AND user_id = %s""",
                (note_id, user_id)
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Note not found")

    return {
        "id": row[0],
        "document_id": row[1],
        "title": row[2],
        "content": row[3],
        "type": row[4],
        "created_at": row[5].isoformat() if row[5] else None,
        "updated_at": row[6].isoformat() if row[6] else None,
    }


@router.put("/{note_id}")
async def update_note(note_id: str, data: NoteUpdate, user: dict = Depends(get_current_user)):
    """Update a note."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            # Verify ownership
            cur.execute(
                "SELECT id FROM notes WHERE id = %s AND user_id = %s",
                (note_id, user_id)
            )
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Note not found")

            # Build dynamic update
            fields = []
            values = []
            if data.title is not None:
                fields.append("title = %s")
                values.append(data.title)
            if data.content is not None:
                fields.append("content = %s")
                values.append(data.content)
            if data.type is not None:
                fields.append("type = %s")
                values.append(data.type)
            if not fields:
                raise HTTPException(status_code=400, detail="No fields to update")

            fields.append("updated_at = now()")
            values.append(note_id)
            values.append(user_id)

            cur.execute(
                f"UPDATE notes SET {', '.join(fields)} WHERE id = %s AND user_id = %s",
                values
            )
            conn.commit()

    return {"message": "Note updated", "note_id": note_id}


@router.delete("/{note_id}")
async def delete_note(note_id: str, user: dict = Depends(get_current_user)):
    """Delete a note."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM notes WHERE id = %s AND user_id = %s RETURNING id",
                (note_id, user_id)
            )
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Note not found")
            conn.commit()

    return {"message": "Note deleted", "note_id": note_id}
