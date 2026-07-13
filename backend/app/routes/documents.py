from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Optional
from ..services.supabase_service import supabase_service
from ..services import ai_service
from ..db import get_connection
from ..deps import get_current_user
from ..utils.common import resolve_user_id
import uuid
import json
from ..utils.extraction import extract_text_from_bytes, chunk_text
import logging
import mimetypes
import os

logger = logging.getLogger(__name__)
router = APIRouter()


class DocumentUploadResponse(BaseModel):
    document_id: str
    message: str


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    subject: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Upload a document, extract text, chunk it, and generate embeddings."""
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail='Empty file')

    # Server-side validation
    MAX_FILE_SIZE = int(os.getenv('MAX_UPLOAD_SIZE_BYTES', str(25 * 1024 * 1024)))  # 25 MB default
    ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.pptx', '.txt'}
    ALLOWED_MIME = {
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain'
    }

    # Size check
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f'File too large (max {MAX_FILE_SIZE} bytes)')

    # Content type / extension validation
    content_type = file.content_type or mimetypes.guess_type(file.filename or '')[0]
    filename = os.path.basename(file.filename or '')
    _, ext = os.path.splitext(filename)
    ext = ext.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f'Unsupported file type: {ext}')

    if content_type and content_type not in ALLOWED_MIME:
        # Allow PDFs that may report an alternate mime on some clients
        if not (ext == '.pdf' and content_type.startswith('application')):
            raise HTTPException(status_code=400, detail=f'Unsupported content type: {content_type}')

    user_id = resolve_user_id(user)

    # Upload raw file to Supabase Storage
    file_id = str(uuid.uuid4())
    storage_path = f"documents/{user_id}/{file_id}_{file.filename}"
    try:
        supabase_service.upload_file('documents', storage_path, content, content_type=file.content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Storage upload failed: {e}')

    # Extract plain text from the file
    text = extract_text_from_bytes(content, file.filename or '')

    # Check if we got any extractable text chunks
    chunks = chunk_text(text)
    if not chunks:
        # Clean up the raw file from Supabase storage
        try:
            supabase_service.client.storage.from_('documents').remove([storage_path])
        except Exception:
            pass
        raise HTTPException(
            status_code=400,
            detail="The uploaded PDF appears to be scanned or contains only images. Please upload a document with selectable text, or upload a .txt or .docx file."
        )

    with get_connection() as conn:
        with conn.cursor() as cur:
            # Insert document record
            cur.execute(
                """INSERT INTO documents
                   (id, user_id, name, subject, mime_type, size_bytes, storage_path, preview_text)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                (file_id, user_id, file.filename, subject,
                 file.content_type, len(content), storage_path, text[:2000])
            )

            # Chunk and embed in a single transaction
            for idx, chunk in enumerate(chunks):
                chunk_id = str(uuid.uuid4())
                cur.execute(
                    """INSERT INTO document_chunks
                       (id, document_id, chunk_index, content, token_count)
                       VALUES (%s, %s, %s, %s, %s)""",
                    (chunk_id, file_id, idx, chunk, len(chunk.split()))
                )

                # Generate and store embedding
                try:
                    emb = ai_service.generate_embedding(chunk)
                    cur.execute(
                        """INSERT INTO embeddings
                           (id, document_chunk_id, user_id, vector, metadata)
                           VALUES (%s, %s, %s, %s::vector, %s)""",
                        (str(uuid.uuid4()), chunk_id, user_id,
                         str(emb), json.dumps({'source': file.filename}))
                    )
                except Exception as emb_err:
                    # Embedding failure is non-fatal — the document is still usable
                    logger.warning(
                        "Embedding failed for chunk %d of doc %s: %s", idx, file_id, emb_err
                    )
            conn.commit()

    return {"document_id": file_id, "message": "Uploaded and processed successfully"}


@router.get("/list")
async def list_documents(
    limit: int = Query(default=50, ge=1, le=200),
    user: dict = Depends(get_current_user)
):
    """Return the authenticated user's documents, newest first."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, name, subject, mime_type, size_bytes, created_at, storage_path
                   FROM documents
                   WHERE user_id = %s
                   ORDER BY created_at DESC
                   LIMIT %s""",
                (user_id, limit)
            )
            rows = cur.fetchall()

    documents = []
    for r in rows:
        storage_path = r[6]
        # Stored path may include the bucket prefix (e.g. "documents/...") — strip it
        path_in_bucket = storage_path
        prefix = 'documents/'
        if path_in_bucket.startswith(prefix):
            path_in_bucket = path_in_bucket[len(prefix):]
        # Build public or signed URL via supabase service
        try:
            url = supabase_service.get_file_url('documents', path_in_bucket)
        except Exception:
            url = None

        documents.append({
            "id": r[0],
            "name": r[1],
            "subject": r[2],
            "mime_type": r[3],
            "size_bytes": r[4],
            "created_at": r[5].isoformat() if r[5] else None,
            "url": url,
        })

    return {"documents": documents}


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    user: dict = Depends(get_current_user)
):
    """Delete a document (and its chunks/embeddings via CASCADE) — owner only."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            # Enforce ownership before deleting
            cur.execute(
                "SELECT storage_path FROM documents WHERE id = %s AND user_id = %s",
                (document_id, user_id)
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Document not found")

            storage_path = row[0]
            cur.execute("DELETE FROM documents WHERE id = %s AND user_id = %s", (document_id, user_id))
            conn.commit()

        # Best-effort removal from Supabase Storage
        try:
            supabase_service.client.storage.from_('documents').remove([storage_path])
        except Exception:
            pass

    return {"message": "Deleted", "document_id": document_id}
