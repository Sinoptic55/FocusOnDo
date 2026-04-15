"""
Pydantic schemas for reference data.
"""
from pydantic import BaseModel, Field
from typing import Optional


class TaskListBase(BaseModel):
    """Base task list schema."""
    name: str = Field(..., min_length=1, max_length=100)
    color: str = Field(..., pattern=r'^#[0-9A-Fa-f]{6}$')
    order: Optional[int] = 0


class TaskListCreate(TaskListBase):
    """Schema for creating a task list."""
    pass


class TaskListUpdate(BaseModel):
    """Schema for updating a task list."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    order: Optional[int] = None


class TaskListResponse(TaskListBase):
    """Response schema for a task list."""
    id: int
    user_id: int

    class Config:
        from_attributes = True


class TaskStatusBase(BaseModel):
    """Base task status schema."""
    name: str = Field(..., min_length=1, max_length=50)
    color: str = Field("#808080", pattern=r'^#[0-9A-Fa-f]{6}$')
    board_visible: Optional[bool] = True
    order: Optional[int] = 0


class TaskStatusCreate(TaskStatusBase):
    """Schema for creating a task status."""
    pass


class TaskStatusUpdate(BaseModel):
    """Schema for updating a task status."""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    board_visible: Optional[bool] = None
    order: Optional[int] = None


class TaskStatusResponse(TaskStatusBase):
    """Response schema for a task status."""
    id: int
    user_id: int

    class Config:
        from_attributes = True


class ProjectBase(BaseModel):
    """Base project schema."""
    name: str = Field(..., min_length=1, max_length=100)
    color: str = Field(..., pattern=r'^#[0-9A-Fa-f]{6}$')
    archived: Optional[bool] = False


class ProjectCreate(ProjectBase):
    """Schema for creating a project."""
    pass


class ProjectUpdate(BaseModel):
    """Schema for updating a project."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    archived: Optional[bool] = None


class ProjectResponse(ProjectBase):
    """Response schema for a project."""
    id: int
    user_id: int

    class Config:
        from_attributes = True


class ClientBase(BaseModel):
    """Base client schema."""
    name: str = Field(..., min_length=1, max_length=100)


class ClientCreate(ClientBase):
    """Schema for creating a client."""
    pass


class ClientUpdate(BaseModel):
    """Schema for updating a client."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)


class ClientResponse(ClientBase):
    """Response schema for a client."""
    id: int
    user_id: int

    class Config:
        from_attributes = True


class PomodoroIntervalBase(BaseModel):
    """Base pomodoro interval schema."""
    order: int = Field(..., ge=0)
    type: str = Field(..., pattern=r'^(work|break|short_break|long_break)$')
    duration_minutes: int = Field(..., gt=0)


class PomodoroIntervalCreate(PomodoroIntervalBase):
    """Schema for creating a pomodoro interval."""
    pass


class PomodoroIntervalUpdate(BaseModel):
    """Schema for updating a pomodoro interval."""
    order: Optional[int] = Field(None, ge=0)
    type: Optional[str] = Field(None, pattern=r'^(work|break|short_break|long_break)$')
    duration_minutes: Optional[int] = Field(None, gt=0)


class PomodoroIntervalResponse(PomodoroIntervalBase):
    """Response schema for a pomodoro interval."""
    id: int
    user_id: int

    class Config:
        from_attributes = True
