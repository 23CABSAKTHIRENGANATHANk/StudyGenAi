from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from ..db import get_connection
from ..deps import get_current_user
from ..utils.common import resolve_user_id

router = APIRouter()


class StudyPlanCreate(BaseModel):
    title: str
    description: Optional[str] = None
    target_date: Optional[str] = None
    plan_items: Optional[List[dict]] = None


class StudyPlanUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_date: Optional[str] = None
    completed: Optional[bool] = None
    plan_items: Optional[List[dict]] = None


@router.get("/")
async def list_study_plans(
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    """List study plans for the authenticated user."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, title, description, target_date, completed, plan_items, created_at, updated_at
                   FROM study_plans
                   WHERE user_id = %s
                   ORDER BY updated_at DESC
                   LIMIT %s""",
                (user_id, limit)
            )
            rows = cur.fetchall()

    return {
        "study_plans": [
            {
                "id": r[0],
                "title": r[1],
                "description": r[2],
                "target_date": str(r[3]) if r[3] else None,
                "completed": r[4],
                "plan_items": r[5],
                "created_at": r[6].isoformat() if r[6] else None,
                "updated_at": r[7].isoformat() if r[7] else None,
            }
            for r in rows
        ]
    }


@router.post("/")
async def create_study_plan(data: StudyPlanCreate, user: dict = Depends(get_current_user)):
    """Create a new study plan."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO study_plans (user_id, title, description, target_date, plan_items)
                   VALUES (%s, %s, %s, %s, %s)
                   RETURNING id""",
                (user_id, data.title, data.description, data.target_date, data.plan_items or [])
            )
            plan_id = cur.fetchone()[0]
            conn.commit()

    return {"message": "Study plan created", "plan_id": plan_id}


@router.put("/{plan_id}")
async def update_study_plan(
    plan_id: str,
    data: StudyPlanUpdate,
    user: dict = Depends(get_current_user)
):
    """Update a study plan."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM study_plans WHERE id = %s AND user_id = %s",
                (plan_id, user_id)
            )
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Study plan not found")

            fields = []
            values = []
            if data.title is not None:
                fields.append("title = %s")
                values.append(data.title)
            if data.description is not None:
                fields.append("description = %s")
                values.append(data.description)
            if data.target_date is not None:
                fields.append("target_date = %s")
                values.append(data.target_date)
            if data.completed is not None:
                fields.append("completed = %s")
                values.append(data.completed)
            if data.plan_items is not None:
                fields.append("plan_items = %s")
                values.append(data.plan_items)
            if not fields:
                raise HTTPException(status_code=400, detail="No fields to update")

            fields.append("updated_at = now()")
            values.append(plan_id)
            values.append(user_id)

            cur.execute(
                f"UPDATE study_plans SET {', '.join(fields)} WHERE id = %s AND user_id = %s",
                values
            )
            conn.commit()

    return {"message": "Study plan updated", "plan_id": plan_id}


@router.delete("/{plan_id}")
async def delete_study_plan(plan_id: str, user: dict = Depends(get_current_user)):
    """Delete a study plan."""
    user_id = resolve_user_id(user)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM study_plans WHERE id = %s AND user_id = %s RETURNING id",
                (plan_id, user_id)
            )
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Study plan not found")
            conn.commit()

    return {"message": "Study plan deleted", "plan_id": plan_id}
