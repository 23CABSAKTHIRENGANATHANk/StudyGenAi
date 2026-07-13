import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import auth, documents, ai, profile, dashboard, notes, flashcards, quizzes, study_plans, notifications
from .core.config import settings
from .middleware.logging import RequestIDMiddleware
from .middleware.rate_limit import general_limiter
import os
try:
    import sentry_sdk
    from sentry_sdk.integrations.asgi import SentryAsgiMiddleware
    SENTRY_DSN = os.getenv('SENTRY_DSN') or None
    if SENTRY_DSN:
        sentry_sdk.init(dsn=SENTRY_DSN)
except Exception:
    SENTRY_DSN = None

# ── Logging setup ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="StudyGen AI Backend",
    description="API backend for StudyGen AI learning assistant",
    version="0.1.0",
)

# Middleware
app.add_middleware(RequestIDMiddleware)

# CORS — allow the Vercel frontend (including preview URLs) and local dev
origins = ["*"] if settings.dev_cors_all else settings.allowed_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.vercel\.app" if not settings.dev_cors_all else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(notes.router, prefix="/api/notes", tags=["notes"])
app.include_router(flashcards.router, prefix="/api/flashcards", tags=["flashcards"])
app.include_router(quizzes.router, prefix="/api/quizzes", tags=["quizzes"])
app.include_router(study_plans.router, prefix="/api/study-plans", tags=["study-plans"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/", tags=["health"])
async def health_check():
    """Simple health probe for load-balancers and uptime monitors."""
    return {"status": "ok", "service": "StudyGen AI Backend", "version": "0.1.0"}


@app.get("/api/debug-db", tags=["health"])
async def debug_db():
    import traceback
    try:
        from .db import get_connection
        from .services.supabase_service import supabase_service
        from pypdf import PdfReader
        import io
        
        with get_connection() as conn:
            with conn.cursor() as cur:
                # Get the most recent document
                cur.execute("""
                    SELECT id, name, storage_path, user_id
                    FROM documents 
                    ORDER BY created_at DESC 
                    LIMIT 1
                """)
                row = cur.fetchone()
                if not row:
                    return {"status": "success", "message": "No documents uploaded yet"}
                
                doc_id, name, storage_path, user_id = row
                
                # Download from Supabase Storage
                try:
                    bucket = supabase_service.client.storage.from_('documents')
                    file_bytes = bucket.download(storage_path)
                    
                    # Test pypdf extraction
                    reader = PdfReader(io.BytesIO(file_bytes))
                    pages_info = []
                    for idx, page in enumerate(reader.pages[:5]):
                        text = page.extract_text() or ""
                        pages_info.append({
                            "page": idx + 1,
                            "char_count": len(text),
                            "snippet": repr(text[:100])
                        })
                    
                    return {
                        "status": "success",
                        "doc_name": name,
                        "doc_id": doc_id,
                        "file_size_downloaded": len(file_bytes),
                        "total_pages": len(reader.pages),
                        "pages_diagnostic": pages_info
                    }
                except Exception as dl_err:
                    return {
                        "status": "error",
                        "message": f"Failed to download/parse file: {dl_err}",
                        "traceback": traceback.format_exc()
                    }
    except Exception as e:
        return {"status": "error", "error": str(e), "traceback": traceback.format_exc()}


# Wrap app in Sentry middleware if configured
if 'sentry_sdk' in globals() and SENTRY_DSN:
    app.add_middleware(SentryAsgiMiddleware)
