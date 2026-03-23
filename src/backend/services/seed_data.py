"""
Seed data service for creating default reference data for new users.
"""
from sqlalchemy.ext.asyncio import AsyncSession

from models.task_list import TaskList
from models.task_status import TaskStatus
from models.pomodoro_interval import PomodoroInterval
from models.app_settings import AppSettings
import json


async def create_seed_data(db: AsyncSession, user_id: int):
    """
    Create default seed data for a new user:
    - Inbox task list
    - Default task statuses (To Do, In Progress, Done)
    - Default pomodoro intervals (25 min work, 5 min short break, 15 min long break)
    - Default app settings
    """
    # Create Inbox list
    inbox_list = TaskList(
        user_id=user_id,
        name="Inbox",
        color="#6B7280",  # Gray
        order=0
    )
    db.add(inbox_list)

    # Create default statuses
    todo_status = TaskStatus(
        user_id=user_id,
        name="To Do",
        board_visible=True,
        order=0
    )
    in_progress_status = TaskStatus(
        user_id=user_id,
        name="In Progress",
        board_visible=True,
        order=1
    )
    done_status = TaskStatus(
        user_id=user_id,
        name="Done",
        board_visible=False,
        order=2
    )
    db.add(todo_status)
    db.add(in_progress_status)
    db.add(done_status)

    # Create default pomodoro intervals
    # Standard Pomodoro: 25 min work, 5 min short break, 15 min long break
    work_interval = PomodoroInterval(
        user_id=user_id,
        order=0,
        type="work",
        duration_minutes=25
    )
    short_break_interval = PomodoroInterval(
        user_id=user_id,
        order=1,
        type="short_break",
        duration_minutes=5
    )
    long_break_interval = PomodoroInterval(
        user_id=user_id,
        order=2,
        type="long_break",
        duration_minutes=15
    )
    db.add(work_interval)
    db.add(short_break_interval)
    db.add(long_break_interval)

    # Create default app settings
    default_settings = {
        "theme": "auto",  # auto, light, dark
        "sounds": {
            "work_end": True,
            "break_end": True
        },
        "hotkey": "Ctrl+Shift+I",
        "morning_ritual_enabled": True,
        "review_day": 5,  # Friday
        "stuck_threshold": 3,  # Number of stuck intervals before suggesting to break down task
        "language": "ru"
    }
    app_settings = AppSettings(
        user_id=user_id,
        settings_json=json.dumps(default_settings)
    )
    db.add(app_settings)

    await db.commit()
