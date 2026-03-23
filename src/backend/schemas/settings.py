"""
Pydantic schemas for application settings.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class AppSettingsSchema(BaseModel):
    """Schema for application settings."""
    theme: str = Field(default="system", pattern=r'^(light|dark|system|auto)$')
    sounds: Dict[str, bool] = Field(default={"work": True, "break": True})
    hotkey: str = Field(default="ctrl+space")
    morning_ritual_enabled: bool = Field(default=True)
    review_day: int = Field(default=0, ge=0, le=6)  # 0=Sunday, 6=Saturday
    stuck_threshold: int = Field(default=3, ge=1)  # Number of stuck segments to trigger notification
    # Additional settings can be added here
    # Store any extra settings in a flexible JSON field
    additional_settings: Dict[str, Any] = Field(default_factory=dict)


class AppSettingsResponse(BaseModel):
    """Response schema for app settings."""
    id: int
    user_id: int
    settings: AppSettingsSchema

    class Config:
        from_attributes = True


class AppSettingsUpdate(BaseModel):
    """Schema for updating app settings."""
    theme: Optional[str] = Field(None, pattern=r'^(light|dark|system|auto)$')
    sounds: Optional[Dict[str, bool]] = None
    hotkey: Optional[str] = None
    morning_ritual_enabled: Optional[bool] = None
    review_day: Optional[int] = Field(None, ge=0, le=6)
    stuck_threshold: Optional[int] = Field(None, ge=1)
    additional_settings: Optional[Dict[str, Any]] = None
