import sys
import os
import asyncio
from unittest.mock import MagicMock, AsyncMock
from datetime import date, datetime

# Add current directory to path
sys.path.append(os.path.abspath(os.curdir))

from api.analytics import get_time_by_projects, get_dashboard
from models.user import User
from fastapi import HTTPException

async def test_get_time_by_projects():
    print("Testing get_time_by_projects...")
    current_user = User(id=1)
    db = AsyncMock()
    
    # Mock row results for the join query
    mock_row = MagicMock()
    mock_row.id = 1
    mock_row.name = "Test Project"
    mock_row.color = "#ff0000"
    mock_row.actual_time = 3600
    mock_row.billed_time = 3000
    
    mock_result = MagicMock()
    mock_result.all.return_value = [mock_row]
    db.execute.return_value = mock_result
    
    response = await get_time_by_projects(current_user, db)
    
    assert len(response) == 1
    assert response[0].project_name == "Test Project"
    assert response[0].actual_time_seconds == 3600
    print("✓ get_time_by_projects passed")

async def test_get_dashboard():
    print("Testing get_dashboard...")
    current_user = User(id=1)
    db = AsyncMock()
    
    # Mock total tasks count
    mock_total_tasks = MagicMock()
    mock_total_tasks.scalar.return_value = 10
    
    # Mock completed tasks count
    mock_completed_tasks = MagicMock()
    mock_completed_tasks.scalar.return_value = 5
    
    # Mock total time
    mock_total_time = MagicMock()
    mock_total_time.one.return_value.actual_time = 5000
    mock_total_time.one.return_value.billed_time = 4500
    
    # Mock today's time
    mock_today_time = MagicMock()
    mock_today_time.one.return_value.today_time = 1000
    
    db.execute.side_effect = [
        mock_total_tasks,
        mock_completed_tasks,
        mock_total_time,
        mock_today_time
    ]
    
    response = await get_dashboard(current_user, db)
    
    assert response.total_tasks == 10
    assert response.completed_tasks == 5
    assert response.total_time_actual == 5000
    assert response.today_time_actual == 1000
    print("✓ get_dashboard passed")

async def main():
    try:
        await test_get_time_by_projects()
        await test_get_dashboard()
        print("\nAll analytics API manual tests passed successfully!")
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
