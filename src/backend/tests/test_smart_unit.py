import pytest
from unittest.mock import MagicMock, AsyncMock
from datetime import date, datetime, timedelta
from api.smart import get_next_task
from models.user import User
from models.task import Task
from fastapi import HTTPException

@pytest.mark.asyncio
async def test_get_next_task_overdue():
    """Test that overdue tasks are prioritized first."""
    current_user = User(id=1)
    db = AsyncMock()
    
    # Mocking the first query (overdue)
    overdue_task = Task(id=101, title="Overdue Task", deadline=date.today() - timedelta(days=1))
    
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = overdue_task
    db.execute.return_value = mock_result
    
    response = await get_next_task(current_user, db)
    
    assert response.id == 101
    assert response.priority_score == 1
    # Ensure only the first query was executed (or at least it returned early)
    assert db.execute.called

@pytest.mark.asyncio
async def test_get_next_task_today():
    """Test that tasks planned for today are prioritized second."""
    current_user = User(id=1)
    db = AsyncMock()
    
    # First query (overdue) returns None
    mock_result_none = MagicMock()
    mock_result_none.scalar_one_or_none.return_value = None
    
    # Second query (today) returns a task
    today_task = Task(id=102, title="Today Task", planned_date=date.today())
    mock_result_task = MagicMock()
    mock_result_task.scalar_one_or_none.return_value = today_task
    
    db.execute.side_effect = [mock_result_none, mock_result_task]
    
    response = await get_next_task(current_user, db)
    
    assert response.id == 102
    assert response.priority_score == 2
    assert db.execute.call_count == 2

@pytest.mark.asyncio
async def test_get_next_task_no_date():
    """Test that tasks without planned date are prioritized third."""
    current_user = User(id=1)
    db = AsyncMock()
    
    mock_result_none = MagicMock()
    mock_result_none.scalar_one_or_none.return_value = None
    
    no_date_task = Task(id=103, title="No Date Task", planned_date=None)
    mock_result_task = MagicMock()
    mock_result_task.scalar_one_or_none.return_value = no_date_task
    
    db.execute.side_effect = [mock_result_none, mock_result_none, mock_result_task]
    
    response = await get_next_task(current_user, db)
    
    assert response.id == 103
    assert response.priority_score == 3
    assert db.execute.call_count == 3

@pytest.mark.asyncio
async def test_get_next_task_no_tasks_found():
    """Test that HTTPException 404 is raised when no tasks are found."""
    current_user = User(id=1)
    db = AsyncMock()
    
    mock_result_none = MagicMock()
    mock_result_none.scalar_one_or_none.return_value = None
    db.execute.return_value = mock_result_none
    
    with pytest.raises(HTTPException) as excinfo:
        await get_next_task(current_user, db)
    
    assert excinfo.value.status_code == 404
    assert excinfo.value.detail == "No tasks found"
