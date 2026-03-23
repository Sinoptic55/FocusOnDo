"""
Service for managing recurring tasks.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
import json
from typing import Optional

from models.task import Task
from models.recurring_task import RecurringTask


async def create_next_occurrence(
    db: AsyncSession,
    task_id: int
) -> Optional[Task]:
    """
    Create the next occurrence of a recurring task.
    Returns the new task if created, None if recurrence should stop.
    """
    # Get the original task and its recurrence config
    result = await db.execute(
        select(Task, RecurringTask)
        .join(RecurringTask, Task.id == RecurringTask.task_id)
        .where(Task.id == task_id)
    )
    row = result.first()
    
    if not row:
        return None
    
    task, recurrence = row
    
    # Check if recurrence should end
    if recurrence.end_date and datetime.now() > recurrence.end_date:
        return None
    
    if recurrence.end_count:
        # Count occurrences (this is approximate - we'd need a separate counter for accuracy)
        # For now, just check if we've reached the limit
        # In production, we'd track occurrence_count in RecurringTask
        pass
    
    # Calculate next occurrence date based on frequency
    frequency_data = json.loads(recurrence.frequency_data_json)
    next_planned_date = _calculate_next_date(
        recurrence.frequency_type,
        frequency_data,
        recurrence.last_created_date or task.created_at
    )
    
    # Create new task
    new_task = Task(
        user_id=task.user_id,
        parent_task_id=None,  # Recurring tasks are top-level
        title=task.title,
        description=task.description,
        planned_date=next_planned_date,
        deadline=None,  # Don't copy deadline
        status_id=task.status_id,
        list_id=task.list_id,
        project_id=task.project_id,
        client_id=task.client_id,
        pomodoro_estimate=task.pomodoro_estimate,
        first_action=task.first_action,
        external_link=task.external_link
    )
    
    db.add(new_task)
    await db.commit()
    await db.refresh(new_task)
    
    # Update last_created_date
    recurrence.last_created_date = datetime.now()
    await db.commit()
    
    return new_task


def _calculate_next_date(
    frequency_type: str,
    frequency_data: dict,
    last_date: datetime
) -> datetime:
    """
    Calculate the next occurrence date based on frequency type and data.
    """
    if frequency_type == "daily":
        days = frequency_data.get("interval", 1)  # Default: every 1 day
        return last_date + timedelta(days=days)
    
    elif frequency_type == "weekly":
        weeks = frequency_data.get("interval", 1)  # Default: every 1 week
        days_of_week = frequency_data.get("days", [])  # Days: 0=Monday, 6=Sunday
        
        if not days_of_week:
            # If no specific days, just add weeks
            return last_date + timedelta(weeks=weeks)
        
        # Find next occurrence on specified days
        for day in days_of_week:
            # Calculate days until next occurrence
            current_weekday = last_date.weekday()
            days_until_day = (day - current_weekday) % 7
            if days_until_day == 0:
                days_until_day = 7  # Next week if today
            
            candidate_date = last_date + timedelta(days=days_until_day)
            
            # Check if this is within the first week interval
            if candidate_date <= last_date + timedelta(weeks=weeks):
                return candidate_date
        
        # If no day found in first week, use first day of next cycle
        first_day = min(days_of_week)
        current_weekday = last_date.weekday()
        days_until_day = (first_day - current_weekday) % 7
        if days_until_day == 0:
            days_until_day = 7
        return last_date + timedelta(weeks=weeks) + timedelta(days=days_until_day)
    
    elif frequency_type == "monthly":
        months = frequency_data.get("interval", 1)  # Default: every 1 month
        day_of_month = frequency_data.get("day", last_date.day)  # Default: same day
        
        # Calculate next month
        next_date = last_date + timedelta(days=32 * months)  # Rough estimate
        # Adjust to the correct day of month
        next_date = next_date.replace(day=min(day_of_month, 28))  # Use 28 to avoid invalid dates
        
        # Fine-tune to get the right month
        while next_date <= last_date:
            next_date = next_date.replace(day=min(day_of_month, 28))
            next_date += timedelta(days=32)
        
        return next_date
    
    else:
        # Default: add 1 day
        return last_date + timedelta(days=1)
