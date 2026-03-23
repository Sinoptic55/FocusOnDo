"""
Task Lists API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from db.database import get_db
from models.task_list import TaskList
from models.task import Task
from schemas.reference import TaskListCreate, TaskListUpdate, TaskListResponse
from auth.dependencies import get_current_user
from models.user import User

router = APIRouter(prefix="/api/lists", tags=["Task Lists"])


@router.post("", response_model=TaskListResponse, status_code=status.HTTP_201_CREATED)
async def create_task_list(
    task_list: TaskListCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new task list.
    """
    # Check if list name already exists for this user
    result = await db.execute(
        select(TaskList).where(
            TaskList.user_id == current_user.id,
            TaskList.name == task_list.name
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A task list with this name already exists"
        )

    new_list = TaskList(
        user_id=current_user.id,
        **task_list.model_dump()
    )
    db.add(new_list)
    await db.commit()
    await db.refresh(new_list)

    return TaskListResponse.model_validate(new_list)


@router.get("", response_model=List[TaskListResponse])
async def get_task_lists(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all task lists for current user.
    """
    result = await db.execute(
        select(TaskList)
        .where(TaskList.user_id == current_user.id)
        .order_by(TaskList.order)
    )
    lists = result.scalars().all()

    return [TaskListResponse.model_validate(lst) for lst in lists]


@router.get("/{list_id}", response_model=TaskListResponse)
async def get_task_list(
    list_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific task list.
    """
    result = await db.execute(
        select(TaskList).where(
            TaskList.id == list_id,
            TaskList.user_id == current_user.id
        )
    )
    task_list = result.scalar_one_or_none()

    if not task_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task list not found"
        )

    return TaskListResponse.model_validate(task_list)


@router.put("/{list_id}", response_model=TaskListResponse)
async def update_task_list(
    list_id: int,
    list_update: TaskListUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a task list.
    """
    result = await db.execute(
        select(TaskList).where(
            TaskList.id == list_id,
            TaskList.user_id == current_user.id
        )
    )
    task_list = result.scalar_one_or_none()

    if not task_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task list not found"
        )

    # Check if new name already exists for this user (excluding current list)
    update_data = list_update.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != task_list.name:
        result = await db.execute(
            select(TaskList).where(
                TaskList.user_id == current_user.id,
                TaskList.name == update_data["name"],
                TaskList.id != list_id
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A task list with this name already exists"
            )

    # Update list fields
    for field, value in update_data.items():
        setattr(task_list, field, value)

    await db.commit()
    await db.refresh(task_list)

    return TaskListResponse.model_validate(task_list)


@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task_list(
    list_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a task list.
    """
    result = await db.execute(
        select(TaskList).where(
            TaskList.id == list_id,
            TaskList.user_id == current_user.id
        )
    )
    task_list = result.scalar_one_or_none()

    if not task_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task list not found"
        )

    # Check if there are tasks associated with this list
    result = await db.execute(
        select(func.count(Task.id)).where(Task.list_id == list_id)
    )
    task_count = result.scalar()

    if task_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete task list with {task_count} associated task(s). Please reassign or delete the tasks first."
        )

    await db.delete(task_list)
    await db.commit()

    return None
