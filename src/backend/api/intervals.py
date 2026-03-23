"""
Pomodoro Intervals API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from db.database import get_db
from models.pomodoro_interval import PomodoroInterval
from schemas.reference import PomodoroIntervalCreate, PomodoroIntervalUpdate, PomodoroIntervalResponse
from auth.dependencies import get_current_user
from models.user import User

router = APIRouter(prefix="/api/intervals", tags=["Pomodoro Intervals"])


@router.post("", response_model=PomodoroIntervalResponse, status_code=status.HTTP_201_CREATED)
async def create_interval(
    interval: PomodoroIntervalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new pomodoro interval.
    """
    new_interval = PomodoroInterval(
        user_id=current_user.id,
        **interval.model_dump()
    )
    db.add(new_interval)
    await db.commit()
    await db.refresh(new_interval)

    return PomodoroIntervalResponse.model_validate(new_interval)


@router.get("", response_model=List[PomodoroIntervalResponse])
async def get_intervals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all pomodoro intervals for current user.
    """
    result = await db.execute(
        select(PomodoroInterval)
        .where(PomodoroInterval.user_id == current_user.id)
        .order_by(PomodoroInterval.order)
    )
    intervals = result.scalars().all()

    return [PomodoroIntervalResponse.model_validate(interval) for interval in intervals]


@router.get("/{interval_id}", response_model=PomodoroIntervalResponse)
async def get_interval(
    interval_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific pomodoro interval.
    """
    result = await db.execute(
        select(PomodoroInterval).where(
            PomodoroInterval.id == interval_id,
            PomodoroInterval.user_id == current_user.id
        )
    )
    interval = result.scalar_one_or_none()

    if not interval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pomodoro interval not found"
        )

    return PomodoroIntervalResponse.model_validate(interval)


@router.put("/{interval_id}", response_model=PomodoroIntervalResponse)
async def update_interval(
    interval_id: int,
    interval_update: PomodoroIntervalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a pomodoro interval.
    """
    result = await db.execute(
        select(PomodoroInterval).where(
            PomodoroInterval.id == interval_id,
            PomodoroInterval.user_id == current_user.id
        )
    )
    interval = result.scalar_one_or_none()

    if not interval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pomodoro interval not found"
        )

    # Update interval fields
    update_data = interval_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(interval, field, value)

    await db.commit()
    await db.refresh(interval)

    return PomodoroIntervalResponse.model_validate(interval)


@router.delete("/{interval_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_interval(
    interval_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a pomodoro interval.
    """
    result = await db.execute(
        select(PomodoroInterval).where(
            PomodoroInterval.id == interval_id,
            PomodoroInterval.user_id == current_user.id
        )
    )
    interval = result.scalar_one_or_none()

    if not interval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pomodoro interval not found"
        )

    await db.delete(interval)
    await db.commit()

    return None
