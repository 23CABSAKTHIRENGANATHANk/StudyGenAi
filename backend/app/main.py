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
        with get_connection() as conn:
            with conn.cursor() as cur:
                # Get overall stats
                cur.execute("SELECT COUNT(*) FROM documents")
                total_docs = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM document_chunks")
                total_chunks = cur.fetchone()[0]
                
                # Get details of recent documents
                cur.execute("""
                    SELECT id, name, size_bytes, preview_text, created_at 
                    FROM documents 
                    ORDER BY created_at DESC 
                    LIMIT 10
                """)
                rows = cur.fetchall()
                recent_docs = []
                for r in rows:
                    doc_id, name, size, preview, created = r
                    cur.execute("SELECT COUNT(*) FROM document_chunks WHERE document_id = %s", (doc_id,))
                    chunk_count = cur.fetchone()[0]
                    recent_docs.append({
                        "id": doc_id,
                        "name": name,
                        "size_bytes": size,
                        "chunk_count": chunk_count,
                        "preview_length": len(preview) if preview else 0,
                        "preview_snippet": preview[:200] if preview else "",
                        "created_at": str(created)
                    })
        return {
            "status": "success",
            "total_documents": total_docs,
            "total_chunks": total_chunks,
            "recent_documents": recent_docs
        }
    except Exception as e:
        return {"status": "error", "error": str(e), "traceback": traceback.format_exc()}


# Wrap app in Sentry middleware if configured
if 'sentry_sdk' in globals() and SENTRY_DSN:
    app.add_middleware(SentryAsgiMiddleware)
