"""
Smart Tools API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from pydantic import BaseModel
from datetime import datetime, date

from db.database import get_db
from models.task import Task
from auth.dependencies import get_current_user
from models.user import User
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

router = APIRouter(prefix="/api/smart", tags=["Smart Tools"])


class NextTaskResponse(BaseModel):
    """Response schema for next task."""
    id: int
    title: str
    description: Optional[str]
    planned_date: Optional[datetime]
    deadline: Optional[datetime]
    priority_score: int


@router.get("/next-task", response_model=NextTaskResponse)
async def get_next_task(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the next priority task to work on.
    Priority algorithm:
    1. Overdue tasks (deadline < today)
    2. Tasks planned for today
    3. Tasks without planned date
    4. Tasks with planned date in the future
    """
    today = date.today()

    # Priority 1: Overdue tasks
    result = await db.execute(
        select(Task)
        .where(
            Task.user_id == current_user.id,
            Task.deadline < today
        )
        .order_by(Task.deadline.asc())
    )
    task = result.scalar_one_or_none()

    if task:
        return NextTaskResponse(
            id=task.id,
            title=task.title,
            description=task.description,
            planned_date=task.planned_date,
            deadline=task.deadline,
            priority_score=1
        )

    # Priority 2: Tasks planned for today
    result = await db.execute(
        select(Task)
        .where(
            Task.user_id == current_user.id,
            Task.planned_date == today
        )
        .order_by(Task.created_at.asc())
    )
    task = result.scalar_one_or_none()

    if task:
        return NextTaskResponse(
            id=task.id,
            title=task.title,
            description=task.description,
            planned_date=task.planned_date,
            deadline=task.deadline,
            priority_score=2
        )

    # Priority 3: Tasks without planned date
    result = await db.execute(
        select(Task)
        .where(
            Task.user_id == current_user.id,
            Task.planned_date.is_(None)
        )
        .order_by(Task.created_at.asc())
    )
    task = result.scalar_one_or_none()

    if task:
        return NextTaskResponse(
            id=task.id,
            title=task.title,
            description=task.description,
            planned_date=task.planned_date,
            deadline=task.deadline,
            priority_score=3
        )

    # Priority 4: Tasks with planned date in the future
    result = await db.execute(
        select(Task)
        .where(
            Task.user_id == current_user.id,
            Task.planned_date > today
        )
        .order_by(Task.planned_date.asc())
    )
    task = result.scalar_one_or_none()

    if task:
        return NextTaskResponse(
            id=task.id,
            title=task.title,
            description=task.description,
            planned_date=task.planned_date,
            deadline=task.deadline,
            priority_score=4
        )

    # No tasks found
    raise HTTPException(
        status_code=404,
        detail="No tasks found"
    )
