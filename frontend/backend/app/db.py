from .core.config import settings
import psycopg
try:
    from psycopg_pool import ConnectionPool
except Exception:
    ConnectionPool = None


_pool = None


def _ensure_pool():
    global _pool
    if _pool is None:
        if ConnectionPool and settings.database_url:
            _pool = ConnectionPool(settings.database_url)
        else:
            _pool = None


def get_connection() -> psycopg.Connection:
    """Return a raw psycopg connection.

    Caller is responsible for closing it (typically in a finally block).

    Usage:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(...)
            conn.commit()
        finally:
            conn.close()
    """
    if not settings.database_url:
        raise ValueError('DATABASE_URL is not configured')
    _ensure_pool()
    if _pool is not None:
        return _pool.connect()
    return psycopg.connect(settings.database_url)
