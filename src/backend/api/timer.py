"""
Timer API endpoints.
"""
from fastapi import APIRouter, Depends
from typing import Optional
from pydantic import BaseModel

from auth.dependencies import get_current_user, get_current_user_optional
from models.user import User

router = APIRouter(prefix="/api/timer", tags=["Timer"])


class TimerStateResponse(BaseModel):
    """Response schema for timer state."""
    active: bool
    active_task_id: Optional[int] = None
    interval_type: Optional[str] = None
    start_time: Optional[str] = None
    duration: Optional[int] = None


@router.get("/state", response_model=TimerStateResponse)
async def get_timer_state(
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Get current timer state.
    Note: Timer state is stored in app_settings JSON.
    This endpoint returns the state from settings or defaults.
    """
    if not current_user:
        return TimerStateResponse(
            active=False,
            active_task_id=None,
            interval_type=None,
            start_time=None,
            duration=None
        )

    # TODO: Get timer state from app_settings
    # For now, return default state
    return TimerStateResponse(
        active=False,
        active_task_id=None,
        interval_type=None,
        start_time=None,
        duration=None
    )
