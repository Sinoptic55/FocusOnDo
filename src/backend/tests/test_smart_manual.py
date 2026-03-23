import sys
import os
import asyncio
from unittest.mock import MagicMock, AsyncMock
from datetime import date, timedelta

# Add current directory to path
sys.path.append(os.path.abspath(os.curdir))

from api.smart import get_next_task
from models.user import User
from models.task import Task
from fastapi import HTTPException

async def test_get_next_task_overdue():
    print("Testing get_next_task overdue...")
    current_user = User(id=1)
    db = AsyncMock()
    
    overdue_task = Task(id=101, title="Overdue Task", deadline=date.today() - timedelta(days=1))
    
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = overdue_task
    db.execute.return_value = mock_result
    
    response = await get_next_task(current_user, db)
    
    assert response.id == 101
    assert response.priority_score == 1
    print("✓ Overdue task prioritization passed")

async def test_get_next_task_today():
    print("Testing get_next_task today...")
    current_user = User(id=1)
    db = AsyncMock()
    
    mock_result_none = MagicMock()
    mock_result_none.scalar_one_or_none.return_value = None
    
    today_task = Task(id=102, title="Today Task", planned_date=date.today())
    mock_result_task = MagicMock()
    mock_result_task.scalar_one_or_none.return_value = today_task
    
    db.execute.side_effect = [mock_result_none, mock_result_task]
    
    response = await get_next_task(current_user, db)
    
    assert response.id == 102
    assert response.priority_score == 2
    print("✓ Today task prioritization passed")

async def test_get_next_task_no_tasks_found():
    print("Testing get_next_task no tasks found...")
    current_user = User(id=1)
    db = AsyncMock()
    
    mock_result_none = MagicMock()
    mock_result_none.scalar_one_or_none.return_value = None
    db.execute.return_value = mock_result_none
    
    try:
        await get_next_task(current_user, db)
        assert False, "Should have raised HTTPException"
    except HTTPException as e:
        assert e.status_code == 404
        assert e.detail == "No tasks found"
    print("✓ No tasks found handling passed")

async def main():
    try:
        await test_get_next_task_overdue()
        await test_get_next_task_today()
        await test_get_next_task_no_tasks_found()
        print("\nAll smart tool manual tests passed successfully!")
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
