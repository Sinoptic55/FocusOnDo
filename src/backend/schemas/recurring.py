"""
Pydantic schemas for recurring tasks.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class RecurringTaskCreate(BaseModel):
    """Schema for creating a recurring task configuration."""
    frequency_type: str = Field(..., description="Type of recurrence: daily, weekly, monthly")
    frequency_data: Dict[str, Any] = Field(..., description="Additional frequency config")
    end_date: Optional[datetime] = Field(None, description="Optional end date for recurrence")
    end_count: Optional[int] = Field(None, ge=1, description="Optional max number of occurrences")


class RecurringTaskResponse(BaseModel):
    """Schema for recurring task response."""
    id: int
    task_id: int
    frequency_type: str
    frequency_data: Dict[str, Any]
    last_created_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    end_count: Optional[int] = None

    class Config:
        from_attributes = True
