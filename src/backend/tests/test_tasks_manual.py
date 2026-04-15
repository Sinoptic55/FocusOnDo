import sys
import os
import asyncio
from unittest.mock import MagicMock, AsyncMock
from datetime import datetime

# Add current directory to path
sys.path.append(os.path.abspath(os.curdir))

from api.tasks import create_task, get_tasks, get_task, update_task, delete_task
from models.user import User
from models.task import Task
from schemas.task import TaskCreate, TaskUpdate
from fastapi import HTTPException

async def test_create_task():
    print("Testing create_task...")
    current_user = User(id=1)
    db = AsyncMock()
    # db.add is not async in SQLAlchemy
    db.add = MagicMock()
    
    task_data = TaskCreate(title="New Task", description="Test Description")
    
    # Mock calculate_total_time return value
    mock_time_result = MagicMock()
    mock_time_result.scalar.return_value = 0
    db.execute.return_value = mock_time_result
    
    # To handle TaskResponse validation, we need to mock attributes that DB would set
    def mock_refresh(obj):
        obj.id = 1
        obj.created_at = datetime.now()
        obj.updated_at = datetime.now()
        obj.is_completed = False
        obj.is_paid = False
    db.refresh.side_effect = mock_refresh
    
    response = await create_task(task_data, current_user, db)
    
    assert response.id == 1
    assert response.title == "New Task"
    assert db.add.called
    assert db.commit.called
    print("✓ create_task passed")

async def test_get_tasks():
    print("Testing get_tasks...")
    current_user = User(id=1)
    db = AsyncMock()
    
    tasks = [
        Task(id=1, user_id=1, title="Task 1", is_completed=False, is_paid=False, created_at=datetime.now(), updated_at=datetime.now()),
        Task(id=2, user_id=1, title="Task 2", is_completed=False, is_paid=False, created_at=datetime.now(), updated_at=datetime.now())
    ]
    
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = tasks
    
    # Also need to mock calculate_total_time for each task
    mock_time_result = MagicMock()
    mock_time_result.scalar.return_value = 0
    
    db.execute.side_effect = [mock_result, mock_time_result, mock_time_result]
    
    response = await get_tasks(current_user, db)
    
    assert len(response) == 2
    assert response[0].title == "Task 1"
    assert response[1].title == "Task 2"
    print("✓ get_tasks passed")

async def test_get_task_not_found():
    print("Testing get_task not found...")
    current_user = User(id=1)
    db = AsyncMock()
    
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    db.execute.return_value = mock_result
    
    try:
        await get_task(999, current_user, db)
        assert False, "Should have raised HTTPException"
    except HTTPException as e:
        assert e.status_code == 404
    print("✓ get_task not found handling passed")

async def main():
    try:
        await test_create_task()
        await test_get_tasks()
        await test_get_task_not_found()
        print("\nAll tasks API manual tests passed successfully!")
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
