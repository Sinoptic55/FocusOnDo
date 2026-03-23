"""
Time Segments API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from db.database import get_db
from models.time_segment import TimeSegment
from models.task import Task
from schemas.time_segment import TimeSegmentCreate, TimeSegmentUpdate, TimeSegmentResponse
from auth.dependencies import get_current_user
from models.user import User

router = APIRouter(prefix="/api/time-segments", tags=["Time Segments"])


@router.post("", response_model=TimeSegmentResponse, status_code=status.HTTP_201_CREATED)
async def create_time_segment(
    segment: TimeSegmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new time segment (fix time on a task).
    """
    # Verify task exists and belongs to user
    result = await db.execute(
        select(Task).where(
            Task.id == segment.task_id,
            Task.user_id == current_user.id
        )
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    new_segment = TimeSegment(
        user_id=current_user.id,
        **segment.model_dump()
    )
    db.add(new_segment)
    await db.commit()
    await db.refresh(new_segment)

    return TimeSegmentResponse.model_validate(new_segment)


@router.get("", response_model=List[TimeSegmentResponse])
async def get_time_segments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    task_id: int = None
):
    """
    Get time segments for current user.
    Optionally filter by task_id.
    """
    query = select(TimeSegment).where(TimeSegment.user_id == current_user.id)

    if task_id is not None:
        query = query.where(TimeSegment.task_id == task_id)

    result = await db.execute(query.order_by(TimeSegment.start_time.desc()))
    segments = result.scalars().all()

    return [TimeSegmentResponse.model_validate(segment) for segment in segments]


@router.get("/{segment_id}", response_model=TimeSegmentResponse)
async def get_time_segment(
    segment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific time segment.
    """
    result = await db.execute(
        select(TimeSegment).where(
            TimeSegment.id == segment_id,
            TimeSegment.user_id == current_user.id
        )
    )
    segment = result.scalar_one_or_none()

    if not segment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time segment not found"
        )

    return TimeSegmentResponse.model_validate(segment)


@router.put("/{segment_id}", response_model=TimeSegmentResponse)
async def update_time_segment(
    segment_id: int,
    segment_update: TimeSegmentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a time segment (e.g., adjust billed time).
    """
    result = await db.execute(
        select(TimeSegment).where(
            TimeSegment.id == segment_id,
            TimeSegment.user_id == current_user.id
        )
    )
    segment = result.scalar_one_or_none()

    if not segment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time segment not found"
        )

    # Update segment fields
    update_data = segment_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(segment, field, value)

    await db.commit()
    await db.refresh(segment)

    return TimeSegmentResponse.model_validate(segment)


@router.delete("/{segment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_time_segment(
    segment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a time segment.
    """
    result = await db.execute(
        select(TimeSegment).where(
            TimeSegment.id == segment_id,
            TimeSegment.user_id == current_user.id
        )
    )
    segment = result.scalar_one_or_none()

    if not segment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time segment not found"
        )

    await db.delete(segment)
    await db.commit()

    return None
