"""
Pydantic schemas for time segments.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TimeSegmentBase(BaseModel):
    """Base time segment schema."""
    task_id: int
    start_time: datetime
    duration_seconds: int = Field(..., gt=0)
    actual_time_seconds: int = Field(..., ge=0)
    billed_time_seconds: int = Field(..., ge=0)
    energy_level: Optional[int] = Field(None, ge=1, le=5)
    task_progressed: Optional[bool] = False
    stuck: Optional[bool] = False


class TimeSegmentCreate(TimeSegmentBase):
    """Schema for creating a time segment."""
    pass


class TimeSegmentUpdate(BaseModel):
    """Schema for updating a time segment."""
    actual_time_seconds: Optional[int] = Field(None, ge=0)
    billed_time_seconds: Optional[int] = Field(None, ge=0)
    energy_level: Optional[int] = Field(None, ge=1, le=5)
    task_progressed: Optional[bool] = None
    stuck: Optional[bool] = None


class TimeSegmentResponse(TimeSegmentBase):
    """Response schema for a time segment."""
    id: int
    user_id: int

    class Config:
        from_attributes = True
