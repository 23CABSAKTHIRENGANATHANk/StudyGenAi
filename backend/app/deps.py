from fastapi import Depends, HTTPException, Header
from typing import Optional
from .services.supabase_service import supabase_service
from .utils.common import _extract_user_dict


def get_current_user(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """Extract user from Supabase access token in Authorization header.
    Expects header: Authorization: Bearer <access_token>
    Returns user dict or raises HTTPException if invalid.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail='Missing authorization header')
    try:
        parts = authorization.split(' ', 1)
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            raise HTTPException(status_code=401, detail='Invalid auth scheme')
        token = parts[1]
    except Exception:
        raise HTTPException(status_code=401, detail='Invalid authorization header')

    if not supabase_service.client:
        raise HTTPException(status_code=503, detail='Auth service unavailable')

    try:
        response = supabase_service.client.auth.get_user(token)
        # supabase-py v2: response is UserResponse with a .user attribute
        user_obj = getattr(response, 'user', response)
        user = _extract_user_dict(user_obj)
        if not user:
            raise HTTPException(status_code=401, detail='Could not resolve user')
        
        # JIT sync/upsert user in database to prevent foreign key errors on subsequent queries
        uid = user.get('id') or user.get('sub')
        email = user.get('email')
        if uid and email:
            try:
                from .db import get_connection
                conn = get_connection()
                try:
                    with conn.cursor() as cur:
                        cur.execute(
                            """INSERT INTO users (id, email)
                               VALUES (%s, %s)
                               ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = now()""",
                            (str(uid), str(email))
                        )
                    conn.commit()
                finally:
                    conn.close()
            except Exception as db_err:
                import logging
                logging.getLogger(__name__).warning("JIT user upsert failed: %s", db_err)

        return user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail='Invalid or expired token')
