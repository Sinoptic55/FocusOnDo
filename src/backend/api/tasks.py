"""
Tasks API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
import json

from db.database import get_db
from models.task import Task
from models.time_segment import TimeSegment
from models.recurring_task import RecurringTask
from models.task_status import TaskStatus
from schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskQuickCreate
from schemas.recurring import RecurringTaskCreate, RecurringTaskResponse
from auth.dependencies import get_current_user
from models.user import User
from services.recurring import create_next_occurrence

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


async def _calculate_total_time(task_id: int, db: AsyncSession) -> int:
    """Calculate total time for a task from time segments."""
    result = await db.execute(
        select(func.coalesce(func.sum(TimeSegment.actual_time_seconds), 0))
        .where(TimeSegment.task_id == task_id)
    )
    return result.scalar() or 0


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new task.
    """
    new_task = Task(
        user_id=current_user.id,
        **task.model_dump(exclude_unset=True)
    )
    db.add(new_task)
    await db.commit()
    await db.refresh(new_task)

    # Calculate total time
    total_time = await _calculate_total_time(new_task.id, db)
    new_task.total_time = total_time

    return TaskResponse.model_validate(new_task)


@router.post("/quick", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_quick_task(
    task: TaskQuickCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a quick task (Inbox capture).
    """
    new_task = Task(
        user_id=current_user.id,
        title=task.title,
        list_id=task.list_id
    )
    db.add(new_task)
    await db.commit()
    await db.refresh(new_task)

    return TaskResponse.model_validate(new_task)


@router.get("", response_model=List[TaskResponse])
async def get_tasks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    list_id: Optional[int] = None,
    status_id: Optional[int] = None,
    project_id: Optional[int] = None,
    client_id: Optional[int] = None
):
    """
    Get all tasks for current user with optional filters.
    """
    query = select(Task).where(Task.user_id == current_user.id)

    if list_id is not None:
        query = query.where(Task.list_id == list_id)
    if status_id is not None:
        query = query.where(Task.status_id == status_id)
    if project_id is not None:
        query = query.where(Task.project_id == project_id)
    if client_id is not None:
        query = query.where(Task.client_id == client_id)

    result = await db.execute(query.order_by(Task.created_at.desc()))
    tasks = result.scalars().all()

    # Calculate total time for each task
    task_responses = []
    for task in tasks:
        total_time = await _calculate_total_time(task.id, db)
        task.total_time = total_time
        task_responses.append(TaskResponse.model_validate(task))

    return task_responses


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific task.
    """
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Calculate total time
    total_time = await _calculate_total_time(task.id, db)
    task.total_time = total_time

    return TaskResponse.model_validate(task)


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a task.
    """
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Check if status is being changed to a "done" status
    old_status_id = task.status_id
    update_data = task_update.model_dump(exclude_unset=True)
    
    # Update task fields
    for field, value in update_data.items():
        setattr(task, field, value)

    # Automatically set status to 'Done' if marked as completed
    if update_data.get("is_completed") is True:
        # Find 'Done' status for this user
        status_result = await db.execute(
            select(TaskStatus).where(
                TaskStatus.user_id == current_user.id,
                TaskStatus.name == "Done"
            )
        )
        done_status = status_result.scalar_one_or_none()
        if done_status:
            task.status_id = done_status.id

    await db.commit()
    await db.refresh(task)

    # Check if task was marked as done and has recurrence
    if "status_id" in update_data and update_data["status_id"] != old_status_id:
        # Check if new status is a "done" status (board_visible=False)
        result = await db.execute(
            select(TaskStatus).where(TaskStatus.id == update_data["status_id"])
        )
        new_status = result.scalar_one_or_none()
        
        if new_status and not new_status.board_visible:
            # Task was marked as done, check for recurrence
            result = await db.execute(
                select(RecurringTask).where(RecurringTask.task_id == task_id)
            )
            recurrence = result.scalar_one_or_none()
            
            if recurrence:
                # Create next occurrence
                new_task = await create_next_occurrence(db, task_id)
                
                # Copy subtasks (steps) to new occurrence
                if new_task:
                    await _copy_subtasks(db, task_id, new_task.id)

    # Calculate total time
    total_time = await _calculate_total_time(task.id, db)
    task.total_time = total_time

    return TaskResponse.model_validate(task)


async def _copy_subtasks(db: AsyncSession, source_task_id: int, target_task_id: int):
    """
    Copy subtasks (steps) from source task to target task.
    """
    result = await db.execute(
        select(Task).where(Task.parent_task_id == source_task_id)
    )
    subtasks = result.scalars().all()
    
    for subtask in subtasks:
        new_subtask = Task(
            user_id=subtask.user_id,
            parent_task_id=target_task_id,
            title=subtask.title,
            description=subtask.description,
            planned_date=None,  # Don't copy planned date for subtasks
            deadline=None,
            status_id=subtask.status_id,
            list_id=None,  # Subtasks don't have lists
            project_id=None,  # Subtasks don't have projects
            client_id=None,  # Subtasks don't have clients
            pomodoro_estimate=subtask.pomodoro_estimate,
            first_action=subtask.first_action,
            external_link=subtask.external_link
        )
        db.add(new_subtask)
    
    await db.commit()


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a task (cascade deletes subtasks).
    """
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    await db.delete(task)
    await db.commit()

    return None


@router.post("/{task_id}/recurrence", response_model=RecurringTaskResponse, status_code=status.HTTP_201_CREATED)
async def set_task_recurrence(
    task_id: int,
    recurrence: RecurringTaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Set up recurrence for a task.
    """
    # Verify task exists and belongs to user
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Check if recurrence already exists
    result = await db.execute(
        select(RecurringTask).where(RecurringTask.task_id == task_id)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recurrence already set for this task. Use DELETE to remove it first."
        )

    # Create recurrence configuration
    new_recurrence = RecurringTask(
        task_id=task_id,
        frequency_type=recurrence.frequency_type,
        frequency_data_json=json.dumps(recurrence.frequency_data),
        end_date=recurrence.end_date,
        end_count=recurrence.end_count
    )
    db.add(new_recurrence)
    await db.commit()
    await db.refresh(new_recurrence)

    return RecurringTaskResponse(
        id=new_recurrence.id,
        task_id=new_recurrence.task_id,
        frequency_type=new_recurrence.frequency_type,
        frequency_data=json.loads(new_recurrence.frequency_data_json),
        last_created_date=new_recurrence.last_created_date,
        end_date=new_recurrence.end_date,
        end_count=new_recurrence.end_count
    )


@router.delete("/{task_id}/recurrence", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task_recurrence(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Remove recurrence from a task.
    """
    # Verify task exists and belongs to user
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Find and delete recurrence
    result = await db.execute(
        select(RecurringTask).where(RecurringTask.task_id == task_id)
    )
    recurrence = result.scalar_one_or_none()

    if not recurrence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurrence not found for this task"
        )

    await db.delete(recurrence)
    await db.commit()

    return None
