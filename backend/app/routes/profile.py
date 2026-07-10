from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from ..db import get_connection
from ..deps import get_current_user
from ..utils.common import resolve_user_id

router = APIRouter()


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


@router.get("/")
async def get_profile(user: dict = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT display_name, bio, avatar_url, preferences, created_at
                   FROM profiles WHERE user_id = %s""",
                (user_id,)
            )
            row = cur.fetchone()

            # Fetch email from users table
            cur.execute("SELECT email, role FROM users WHERE id = %s", (user_id,))
            user_row = cur.fetchone()

    profile = {
        "user_id": user_id,
        "email": user_row[0] if user_row else None,
        "role": user_row[1] if user_row else "student",
        "display_name": row[0] if row else None,
        "bio": row[1] if row else None,
        "avatar_url": row[2] if row else None,
        "preferences": row[3] if row else {},
        "created_at": row[4].isoformat() if row and row[4] else None,
    }
    return {"profile": profile}


@router.put("/")
async def update_profile(
    data: ProfileUpdate,
    user: dict = Depends(get_current_user)
):
    """Create or update the authenticated user's profile."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            # Upsert profile row
            cur.execute(
                """INSERT INTO profiles (user_id, display_name, bio, avatar_url)
                   VALUES (%s, %s, %s, %s)
                   ON CONFLICT (user_id) DO UPDATE
                   SET display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
                       bio          = COALESCE(EXCLUDED.bio, profiles.bio),
                       avatar_url   = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
                       updated_at   = now()""",
                (user_id, data.display_name, data.bio, data.avatar_url)
            )
            conn.commit()

    return {"message": "Profile updated", "profile": data.model_dump()}
