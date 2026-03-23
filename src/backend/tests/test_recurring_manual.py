import sys
import os
import asyncio
from unittest.mock import MagicMock, AsyncMock
from datetime import datetime, timedelta
import json

# Add current directory to path
sys.path.append(os.path.abspath(os.curdir))

from services.recurring import create_next_occurrence, _calculate_next_date
from models.task import Task
from models.recurring_task import RecurringTask

async def test_calculate_next_date_daily():
    print("Testing _calculate_next_date daily...")
    last_date = datetime(2026, 3, 23)  # Monday
    frequency_type = "daily"
    frequency_data = {"interval": 1}
    
    next_date = _calculate_next_date(frequency_type, frequency_data, last_date)
    
    assert next_date == last_date + timedelta(days=1)
    print("✓ _calculate_next_date daily passed")

async def test_calculate_next_date_weekly():
    print("Testing _calculate_next_date weekly...")
    last_date = datetime(2026, 3, 23)  # Monday (weekday 0)
    frequency_type = "weekly"
    frequency_data = {"interval": 1, "days": [2]}  # Wednesday (weekday 2)
    
    next_date = _calculate_next_date(frequency_type, frequency_data, last_date)
    
    assert next_date.weekday() == 2
    assert (next_date - last_date).days == 2
    print("✓ _calculate_next_date weekly passed")

async def test_create_next_occurrence():
    print("Testing create_next_occurrence...")
    db = AsyncMock()
    # db.add is not async in SQLAlchemy
    db.add = MagicMock()
    
    task_id = 1
    task = Task(id=task_id, user_id=1, title="Recurring Task", created_at=datetime.now())
    recurrence = RecurringTask(
        id=1,
        task_id=task_id,
        frequency_type="daily",
        frequency_data_json=json.dumps({"interval": 1})
    )
    
    mock_result = MagicMock()
    mock_result.first.return_value = (task, recurrence)
    db.execute.return_value = mock_result
    
    # Mock refresh to set ID on new task
    def mock_refresh(obj):
        obj.id = 2
    db.refresh.side_effect = mock_refresh
    
    new_task = await create_next_occurrence(db, task_id)
    
    assert new_task is not None
    assert new_task.id == 2
    assert new_task.title == "Recurring Task"
    assert db.add.called
    assert db.commit.called
    assert recurrence.last_created_date is not None
    print("✓ create_next_occurrence passed")

async def main():
    try:
        await test_calculate_next_date_daily()
        await test_calculate_next_date_weekly()
        await test_create_next_occurrence()
        print("\nAll recurring tasks manual tests passed successfully!")
    except AssertionError as e:
        print(f"\nTest failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nAn error occurred: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
