"""
Task Statuses API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from db.database import get_db
from models.task_status import TaskStatus
from models.task import Task
from schemas.reference import TaskStatusCreate, TaskStatusUpdate, TaskStatusResponse
from auth.dependencies import get_current_user
from models.user import User

router = APIRouter(prefix="/api/statuses", tags=["Task Statuses"])


@router.post("", response_model=TaskStatusResponse, status_code=status.HTTP_201_CREATED)
async def create_task_status(
    task_status: TaskStatusCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new task status.
    """
    # Check if status name already exists for this user
    result = await db.execute(
        select(TaskStatus).where(
            TaskStatus.user_id == current_user.id,
            TaskStatus.name == task_status.name
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A task status with this name already exists"
        )

    new_status = TaskStatus(
        user_id=current_user.id,
        **task_status.model_dump()
    )
    db.add(new_status)
    await db.commit()
    await db.refresh(new_status)

    return TaskStatusResponse.model_validate(new_status)


@router.get("", response_model=List[TaskStatusResponse])
async def get_task_statuses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    board_visible_only: bool = False
):
    """
    Get all task statuses for current user.
    Optionally filter by board_visible.
    """
    query = select(TaskStatus).where(TaskStatus.user_id == current_user.id)

    if board_visible_only:
        query = query.where(TaskStatus.board_visible == True)

    result = await db.execute(query.order_by(TaskStatus.order))
    statuses = result.scalars().all()

    return [TaskStatusResponse.model_validate(status) for status in statuses]


@router.get("/{status_id}", response_model=TaskStatusResponse)
async def get_task_status(
    status_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific task status.
    """
    result = await db.execute(
        select(TaskStatus).where(
            TaskStatus.id == status_id,
            TaskStatus.user_id == current_user.id
        )
    )
    task_status = result.scalar_one_or_none()

    if not task_status:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task status not found"
        )

    return TaskStatusResponse.model_validate(task_status)


@router.put("/{status_id}", response_model=TaskStatusResponse)
async def update_task_status(
    status_id: int,
    status_update: TaskStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a task status.
    """
    result = await db.execute(
        select(TaskStatus).where(
            TaskStatus.id == status_id,
            TaskStatus.user_id == current_user.id
        )
    )
    task_status = result.scalar_one_or_none()

    if not task_status:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task status not found"
        )

    # Check if new name already exists for this user (excluding current status)
    update_data = status_update.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != task_status.name:
        result = await db.execute(
            select(TaskStatus).where(
                TaskStatus.user_id == current_user.id,
                TaskStatus.name == update_data["name"],
                TaskStatus.id != status_id
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A task status with this name already exists"
            )

    # Update status fields
    for field, value in update_data.items():
        setattr(task_status, field, value)

    await db.commit()
    await db.refresh(task_status)

    return TaskStatusResponse.model_validate(task_status)


@router.delete("/{status_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task_status(
    status_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a task status.
    """
    result = await db.execute(
        select(TaskStatus).where(
            TaskStatus.id == status_id,
            TaskStatus.user_id == current_user.id
        )
    )
    task_status = result.scalar_one_or_none()

    if not task_status:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task status not found"
        )

    # Check if there are tasks associated with this status
    result = await db.execute(
        select(func.count(Task.id)).where(Task.status_id == status_id)
    )
    task_count = result.scalar()

    if task_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete task status with {task_count} associated task(s). Please reassign or delete the tasks first."
        )

    await db.delete(task_status)
    await db.commit()

    return None
