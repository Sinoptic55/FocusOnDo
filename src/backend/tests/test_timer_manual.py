import sys
import os
import asyncio
from unittest.mock import MagicMock, AsyncMock
from datetime import datetime

# Add current directory to path
sys.path.append(os.path.abspath(os.curdir))

from api.time_segments import create_time_segment, get_time_segments
from models.user import User
from models.task import Task
from models.time_segment import TimeSegment
from schemas.time_segment import TimeSegmentCreate
from fastapi import HTTPException

async def test_create_time_segment():
    print("Testing create_time_segment...")
    current_user = User(id=1)
    db = AsyncMock()
    # db.add is not async in SQLAlchemy
    db.add = MagicMock()
    
    # Mock task existence check
    mock_task_result = MagicMock()
    mock_task_result.scalar_one_or_none.return_value = Task(id=1, user_id=1)
    db.execute.return_value = mock_task_result
    
    segment_data = TimeSegmentCreate(
        task_id=1, 
        start_time=datetime.now(), 
        duration_seconds=1500, 
        actual_time_seconds=1500,
        billed_time_seconds=1500
    )
    
    # Mock refresh to set attributes
    def mock_refresh(obj):
        obj.id = 1
        obj.billed_time_seconds = 1500
        obj.energy_level = None
        obj.task_progressed = None
        obj.stuck = False
    db.refresh.side_effect = mock_refresh
    
    response = await create_time_segment(segment_data, current_user, db)
    
    assert response.id == 1
    assert response.duration_seconds == 1500
    assert db.add.called
    assert db.commit.called
    print("✓ create_time_segment passed")

async def test_create_time_segment_task_not_found():
    print("Testing create_time_segment task not found...")
    current_user = User(id=1)
    db = AsyncMock()
    
    mock_task_result = MagicMock()
    mock_task_result.scalar_one_or_none.return_value = None
    db.execute.return_value = mock_task_result
    
    segment_data = TimeSegmentCreate(
        task_id=999, 
        start_time=datetime.now(), 
        duration_seconds=1500,
        actual_time_seconds=1500,
        billed_time_seconds=1500
    )
    
    try:
        await create_time_segment(segment_data, current_user, db)
        assert False, "Should have raised HTTPException"
    except HTTPException as e:
        assert e.status_code == 404
    print("✓ create_time_segment task not found handling passed")

async def main():
    try:
        await test_create_time_segment()
        await test_create_time_segment_task_not_found()
        print("\nAll timer manual tests passed successfully!")
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
