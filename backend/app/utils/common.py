"""Shared utilities for resolving user identity across the backend."""
from fastapi import HTTPException
from typing import Optional


def resolve_user_id(user: dict | object | None) -> str:
    """Extract a string user id from a Supabase user dict/object.

    Raises HTTPException(401) if the user cannot be resolved.
    """
    if not user:
        raise HTTPException(status_code=401, detail='Not authenticated')
    if isinstance(user, dict):
        uid = user.get('id') or user.get('sub')
    else:
        uid = getattr(user, 'id', None)
    if not uid:
        raise HTTPException(status_code=401, detail='Could not determine user identity')
    return str(uid)


def _extract_user_dict(user_obj) -> Optional[dict]:
    """Safely convert any Supabase user representation to a plain dict."""
    if user_obj is None:
        return None
    if hasattr(user_obj, 'model_dump'):
        return user_obj.model_dump()
    if hasattr(user_obj, 'dict'):
        return user_obj.dict()
    if isinstance(user_obj, dict):
        return user_obj
    try:
        return {k: v for k, v in vars(user_obj).items() if not k.startswith('_')}
    except Exception:
        return None


def get_db_connection():
    """Yield a psycopg connection context manager."""
    from ..core.config import settings
    import psycopg
    if not settings.database_url:
        raise ValueError('DATABASE_URL is not configured')
    conn = psycopg.connect(settings.database_url)
    try:
        yield conn
    finally:
        conn.close()


def safe_path(path: str) -> str:
    """Normalize and validate storage path fragments to avoid directory traversal."""
    if not path:
        return ''
    # Disallow absolute or parent-traversal components
    if path.startswith('/') or '..' in path or '\\' in path:
        raise ValueError('Invalid path')
    # Collapse any accidental repeated slashes
    return '/'.join(p for p in path.split('/') if p)
