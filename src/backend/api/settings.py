"""
Settings API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any

from db.database import get_db
from models.app_settings import AppSettings
from schemas.settings import AppSettingsSchema, AppSettingsResponse, AppSettingsUpdate
from auth.dependencies import get_current_user
from models.user import User

router = APIRouter(prefix="/api/settings", tags=["Settings"])


@router.get("", response_model=AppSettingsResponse)
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user's settings.
    If settings don't exist, create default ones.
    """
    result = await db.execute(
        select(AppSettings).where(AppSettings.user_id == current_user.id)
    )
    app_settings = result.scalar_one_or_none()

    if not app_settings:
        # Create default settings
        app_settings = AppSettings(
            user_id=current_user.id,
            settings_json={
                "theme": "system",
                "sounds": {"work": True, "break": True},
                "hotkey": "ctrl+space",
                "morning_ritual_enabled": True,
                "review_day": 0,  # Sunday
                "stuck_threshold": 3,
                "additional_settings": {}
            }
        )
        db.add(app_settings)
        await db.commit()
        await db.refresh(app_settings)

    import json
    settings_data = app_settings.settings_json
    if isinstance(settings_data, str):
        settings_data = json.loads(settings_data)

    return AppSettingsResponse(
        id=app_settings.id,
        user_id=app_settings.user_id,
        settings=AppSettingsSchema(**settings_data)
    )


@router.put("", response_model=AppSettingsResponse)
async def update_settings(
    settings_update: AppSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update current user's settings.
    """
    result = await db.execute(
        select(AppSettings).where(AppSettings.user_id == current_user.id)
    )
    app_settings = result.scalar_one_or_none()

    if not app_settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Settings not found"
        )

    # Get current settings
    import json
    current_settings = app_settings.settings_json
    if isinstance(current_settings, str):
        current_settings = json.loads(current_settings)
    
    current_settings = current_settings.copy() if current_settings else {}

    # Update only the fields that are provided
    update_data = settings_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            current_settings[key] = value

    # Save updated settings
    app_settings.settings_json = current_settings
    await db.commit()
    await db.refresh(app_settings)

    import json
    settings_data = app_settings.settings_json
    if isinstance(settings_data, str):
        settings_data = json.loads(settings_data)

    return AppSettingsResponse(
        id=app_settings.id,
        user_id=app_settings.user_id,
        settings=AppSettingsSchema(**settings_data)
    )
