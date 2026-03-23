"""
Pydantic schemas for tasks.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TaskBase(BaseModel):
    """Base task schema."""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    planned_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    status_id: Optional[int] = None
    list_id: Optional[int] = None
    project_id: Optional[int] = None
    client_id: Optional[int] = None
    pomodoro_estimate: Optional[int] = Field(None, ge=0)
    first_action: Optional[str] = Field(None, max_length=500)
    external_link: Optional[str] = Field(None, max_length=500)
    parent_task_id: Optional[int] = None


class TaskCreate(TaskBase):
    """Schema for creating a task."""
    pass


class TaskUpdate(BaseModel):
    """Schema for updating a task."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    planned_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    status_id: Optional[int] = None
    list_id: Optional[int] = None
    project_id: Optional[int] = None
    client_id: Optional[int] = None
    pomodoro_estimate: Optional[int] = Field(None, ge=0)
    first_action: Optional[str] = Field(None, max_length=500)
    external_link: Optional[str] = Field(None, max_length=500)
    parent_task_id: Optional[int] = None


class TaskResponse(TaskBase):
    """Response schema for a task."""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    total_time: int = 0  # Total time in seconds

    class Config:
        from_attributes = True


class TaskQuickCreate(BaseModel):
    """Schema for quick task creation (Inbox capture)."""
    title: str = Field(..., min_length=1, max_length=200)
    list_id: Optional[int] = None
