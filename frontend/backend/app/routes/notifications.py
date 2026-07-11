from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from ..db import get_connection
from ..deps import get_current_user
from ..utils.common import resolve_user_id

router = APIRouter()


class NotificationCreate(BaseModel):
    type: str
    title: str
    body: Optional[str] = None
    scheduled_at: Optional[str] = None


@router.get("/")
async def list_notifications(
    unread_only: bool = False,
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    """List notifications for the authenticated user."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            if unread_only:
                cur.execute(
                    """SELECT id, type, title, body, read, scheduled_at, created_at
                       FROM notifications
                       WHERE user_id = %s AND read = false
                       ORDER BY created_at DESC
                       LIMIT %s""",
                    (user_id, limit)
                )
            else:
                cur.execute(
                    """SELECT id, type, title, body, read, scheduled_at, created_at
                       FROM notifications
                       WHERE user_id = %s
                       ORDER BY created_at DESC
                       LIMIT %s""",
                    (user_id, limit)
                )
            rows = cur.fetchall()

    return {
        "notifications": [
            {
                "id": r[0],
                "type": r[1],
                "title": r[2],
                "body": r[3],
                "read": r[4],
                "scheduled_at": r[5].isoformat() if r[5] else None,
                "created_at": r[6].isoformat() if r[6] else None,
            }
            for r in rows
        ]
    }


@router.post("/")
async def create_notification(data: NotificationCreate, user: dict = Depends(get_current_user)):
    """Create a notification for the authenticated user."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO notifications (user_id, type, title, body, scheduled_at)
                   VALUES (%s, %s, %s, %s, %s)
                   RETURNING id""",
                (user_id, data.type, data.title, data.body, data.scheduled_at)
            )
            notif_id = cur.fetchone()[0]
            conn.commit()

    return {"message": "Notification created", "notification_id": notif_id}


@router.post("/{notification_id}/read")
async def mark_notification_read(notification_id: str, user: dict = Depends(get_current_user)):
    """Mark a notification as read."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE notifications SET read = true WHERE id = %s AND user_id = %s RETURNING id",
                (notification_id, user_id)
            )
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Notification not found")
            conn.commit()

    return {"message": "Notification marked as read", "notification_id": notification_id}


@router.post("/mark-all-read")
async def mark_all_notifications_read(user: dict = Depends(get_current_user)):
    """Mark all notifications as read."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE notifications SET read = true WHERE user_id = %s",
                (user_id,)
            )
            conn.commit()

    return {"message": "All notifications marked as read"}


@router.delete("/{notification_id}")
async def delete_notification(notification_id: str, user: dict = Depends(get_current_user)):
    """Delete a notification."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM notifications WHERE id = %s AND user_id = %s RETURNING id",
                (notification_id, user_id)
            )
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Notification not found")
            conn.commit()

    return {"message": "Notification deleted", "notification_id": notification_id}
