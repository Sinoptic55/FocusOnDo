"""
Analytics API endpoints.
"""
from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
import io

from db.database import get_db
from models.time_segment import TimeSegment
from models.task import Task
from models.project import Project
from models.client import Client
from models.task_status import TaskStatus
from models.task_list import TaskList
from auth.dependencies import get_current_user
from models.user import User
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract

# ODS generation
from odf.opendocument import OpenDocumentSpreadsheet
from odf.table import Table, TableRow, TableCell
from odf.text import P

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


class ProjectTimeResponse(BaseModel):
    """Response schema for time by project."""
    project_id: int
    project_name: str
    project_color: str
    actual_time_seconds: int
    billed_time_seconds: int


class ClientTimeResponse(BaseModel):
    """Response schema for time by client."""
    client_id: int
    client_name: str
    actual_time_seconds: int
    billed_time_seconds: int


class ProductivityPeakResponse(BaseModel):
    """Response schema for productivity peaks."""
    hour: int
    total_time_seconds: int


class EstimationAccuracyResponse(BaseModel):
    """Response schema for estimation accuracy."""
    task_id: int
    task_title: str
    estimated_pomodoros: Optional[int]
    actual_pomodoros: float


class WorkSpeedResponse(BaseModel):
    """Response schema for work speed."""
    date: date
    tasks_completed: int


class StuckPatternResponse(BaseModel):
    """Response schema for stuck patterns."""
    task_id: int
    task_title: str
    stuck_count: int


class DashboardResponse(BaseModel):
    """Response schema for dashboard summary."""
    total_tasks: int
    completed_tasks: int
    total_time_actual: int
    total_time_billed: int
    today_time_actual: int


class UnpaidTaskResponse(BaseModel):
    """Response schema for a single unpaid task in the report."""
    task_id: int
    task_title: str
    end_date: Optional[datetime]  # Max start_time of time segments
    actual_time_minutes: int  # Sum of actual_time_seconds / 60
    billed_time_minutes: int  # Sum of billed_time_seconds / 60


class UnpaidTasksFilter(BaseModel):
    """Filter parameters for unpaid tasks report."""
    project_id: Optional[int] = None
    client_id: Optional[int] = None
    list_id: Optional[int] = None


@router.get("/projects", response_model=List[ProjectTimeResponse])
async def get_time_by_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """
    Get time breakdown by projects.
    """
    query = (
        select(
            Project.id,
            Project.name,
            Project.color,
            func.coalesce(func.sum(TimeSegment.actual_time_seconds), 0).label("actual_time"),
            func.coalesce(func.sum(TimeSegment.billed_time_seconds), 0).label("billed_time")
        )
        .join(Task, Task.project_id == Project.id)
        .join(TimeSegment, TimeSegment.task_id == Task.id)
        .where(Task.user_id == current_user.id)
        .group_by(Project.id, Project.name, Project.color)
    )

    if start_date:
        query = query.where(TimeSegment.start_time >= start_date)
    if end_date:
        query = query.where(TimeSegment.start_time <= end_date)

    result = await db.execute(query)
    rows = result.all()

    return [
        ProjectTimeResponse(
            project_id=row.id,
            project_name=row.name,
            project_color=row.color,
            actual_time_seconds=row.actual_time or 0,
            billed_time_seconds=row.billed_time or 0
        )
        for row in rows
    ]


@router.get("/clients", response_model=List[ClientTimeResponse])
async def get_time_by_clients(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """
    Get time breakdown by clients.
    """
    query = (
        select(
            Client.id,
            Client.name,
            func.coalesce(func.sum(TimeSegment.actual_time_seconds), 0).label("actual_time"),
            func.coalesce(func.sum(TimeSegment.billed_time_seconds), 0).label("billed_time")
        )
        .join(Task, Task.client_id == Client.id)
        .join(TimeSegment, TimeSegment.task_id == Task.id)
        .where(Task.user_id == current_user.id)
        .group_by(Client.id, Client.name)
    )

    if start_date:
        query = query.where(TimeSegment.start_time >= start_date)
    if end_date:
        query = query.where(TimeSegment.start_time <= end_date)

    result = await db.execute(query)
    rows = result.all()

    return [
        ClientTimeResponse(
            client_id=row.id,
            client_name=row.name,
            actual_time_seconds=row.actual_time or 0,
            billed_time_seconds=row.billed_time or 0
        )
        for row in rows
    ]


@router.get("/productivity-peaks", response_model=List[ProductivityPeakResponse])
async def get_productivity_peaks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """
    Get productivity peaks by hour of day.
    """
    query = (
        select(
            extract('hour', TimeSegment.start_time).label("hour"),
            func.coalesce(func.sum(TimeSegment.actual_time_seconds), 0).label("total_time")
        )
        .join(Task, TimeSegment.task_id == Task.id)
        .where(Task.user_id == current_user.id)
        .group_by(extract('hour', TimeSegment.start_time))
        .order_by(func.sum(TimeSegment.actual_time_seconds).desc())
    )

    if start_date:
        query = query.where(TimeSegment.start_time >= start_date)
    if end_date:
        query = query.where(TimeSegment.start_time <= end_date)

    result = await db.execute(query)
    rows = result.all()

    return [
        ProductivityPeakResponse(
            hour=int(row.hour),
            total_time_seconds=row.total_time or 0
        )
        for row in rows
    ]


@router.get("/estimation-accuracy", response_model=List[EstimationAccuracyResponse])
async def get_estimation_accuracy(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """
    Get task estimation accuracy (estimated vs actual pomodoros).
    Assumes 25 minutes per pomodoro.
    """
    query = (
        select(
            Task.id,
            Task.title,
            Task.pomodoro_estimate,
            func.coalesce(func.sum(TimeSegment.actual_time_seconds), 0).label("total_actual_seconds")
        )
        .outerjoin(TimeSegment, TimeSegment.task_id == Task.id)
        .where(Task.user_id == current_user.id)
        .group_by(Task.id, Task.title, Task.pomodoro_estimate)
    )

    if start_date:
        query = query.where(TimeSegment.start_time >= start_date)
    if end_date:
        query = query.where(TimeSegment.start_time <= end_date)

    result = await db.execute(query)
    rows = result.all()

    responses = []
    for row in rows:
        estimated_pomodoros = row.pomodoro_estimate
        actual_seconds = row.total_actual_seconds or 0
        actual_pomodoros = actual_seconds / 60.0 / 25.0  # Convert seconds to pomodoros (25 min each)
        
        responses.append(
            EstimationAccuracyResponse(
                task_id=row.id,
                task_title=row.title,
                estimated_pomodoros=estimated_pomodoros,
                actual_pomodoros=round(actual_pomodoros, 2)
            )
        )

    return responses


@router.get("/work-speed", response_model=List[WorkSpeedResponse])
async def get_work_speed(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """
    Get work speed (tasks completed per day).
    """
    query = (
        select(
            func.date(TimeSegment.start_time).label("date"),
            func.count(func.distinct(Task.id)).label("tasks_completed")
        )
        .join(Task, TimeSegment.task_id == Task.id)
        .where(
            Task.user_id == current_user.id,
            Task.status_id.in_(
                select(TaskStatus.id).where(TaskStatus.name.ilike("%done%"))
            )
        )
        .group_by(func.date(TimeSegment.start_time))
        .order_by(func.date(TimeSegment.start_time).desc())
    )

    if start_date:
        query = query.where(TimeSegment.start_time >= start_date)
    if end_date:
        query = query.where(TimeSegment.start_time <= end_date)

    result = await db.execute(query)
    rows = result.all()

    return [
        WorkSpeedResponse(
            date=row.date,
            tasks_completed=row.tasks_completed or 0
        )
        for row in rows
    ]


@router.get("/stuck-patterns", response_model=List[StuckPatternResponse])
async def get_stuck_patterns(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """
    Get stuck patterns (tasks with stuck=true time segments).
    """
    query = (
        select(
            Task.id,
            Task.title,
            func.count(TimeSegment.id).label("stuck_count")
        )
        .join(TimeSegment, TimeSegment.task_id == Task.id)
        .where(
            Task.user_id == current_user.id,
            TimeSegment.stuck == True
        )
        .group_by(Task.id, Task.title)
        .order_by(func.count(TimeSegment.id).desc())
    )

    if start_date:
        query = query.where(TimeSegment.start_time >= start_date)
    if end_date:
        query = query.where(TimeSegment.start_time <= end_date)

    result = await db.execute(query)
    rows = result.all()

    return [
        StuckPatternResponse(
            task_id=row.id,
            task_title=row.title,
            stuck_count=row.stuck_count or 0
        )
        for row in rows
    ]


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get dashboard summary statistics.
    """
    # Total tasks
    total_tasks_result = await db.execute(
        select(func.count(Task.id))
        .where(Task.user_id == current_user.id)
    )
    total_tasks = total_tasks_result.scalar() or 0

    # Completed tasks
    completed_tasks_result = await db.execute(
        select(func.count(Task.id))
        .where(
            Task.user_id == current_user.id,
            Task.status_id.in_(
                select(TaskStatus.id).where(TaskStatus.name.ilike("%done%"))
            )
        )
    )
    completed_tasks = completed_tasks_result.scalar() or 0

    # Total time (actual and billed)
    total_time_result = await db.execute(
        select(
            func.coalesce(func.sum(TimeSegment.actual_time_seconds), 0).label("actual_time"),
            func.coalesce(func.sum(TimeSegment.billed_time_seconds), 0).label("billed_time")
        )
        .join(Task, TimeSegment.task_id == Task.id)
        .where(Task.user_id == current_user.id)
    )
    total_time_row = total_time_result.one()
    total_time_actual = total_time_row.actual_time or 0
    total_time_billed = total_time_row.billed_time or 0

    # Today's time
    today = date.today()
    today_time_result = await db.execute(
        select(
            func.coalesce(func.sum(TimeSegment.actual_time_seconds), 0).label("today_time")
        )
        .join(Task, TimeSegment.task_id == Task.id)
        .where(
            Task.user_id == current_user.id,
            func.date(TimeSegment.start_time) == today
        )
    )
    today_time_row = today_time_result.one()
    today_time_actual = today_time_row.today_time or 0

    return DashboardResponse(
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        total_time_actual=total_time_actual,
        total_time_billed=total_time_billed,
        today_time_actual=today_time_actual
    )


@router.get("/unpaid-tasks", response_model=List[UnpaidTaskResponse])
async def get_unpaid_tasks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    project_id: Optional[int] = None,
    client_id: Optional[int] = None,
    list_id: Optional[int] = None
):
    """
    Get unpaid completed tasks with aggregated time data.
    
    Returns tasks where is_completed=true and is_paid=false,
    with aggregated actual and billed time from time segments.
    Only parent tasks (parent_task_id IS NULL) are returned,
    with time from subtasks aggregated.
    """
    # Step 1: Get all unpaid parent tasks
    parent_query = (
        select(Task)
        .where(
            Task.user_id == current_user.id,
            Task.is_completed == True,
            Task.is_paid == False,
            Task.parent_task_id.is_(None)
        )
    )

    # Apply filters
    if project_id:
        parent_query = parent_query.where(Task.project_id == project_id)
    if client_id:
        parent_query = parent_query.where(Task.client_id == client_id)
    if list_id:
        parent_query = parent_query.where(Task.list_id == list_id)

    parent_result = await db.execute(parent_query)
    parent_tasks = parent_result.scalars().all()

    if not parent_tasks:
        return []

    parent_ids = [t.id for t in parent_tasks]
    parent_map = {t.id: t for t in parent_tasks}

    # Step 2: Get all time segments for these tasks and their subtasks
    segments_query = (
        select(
            TimeSegment.task_id,
            TimeSegment.actual_time_seconds,
            TimeSegment.billed_time_seconds,
            TimeSegment.start_time
        )
        .where(
            TimeSegment.user_id == current_user.id,
            # Get segments for parent tasks or their subtasks
            TimeSegment.task_id.in_(
                select(Task.id).where(
                    Task.user_id == current_user.id,
                    (Task.id.in_(parent_ids)) | (Task.parent_task_id.in_(parent_ids))
                )
            )
        )
    )

    segments_result = await db.execute(segments_query)
    segments = segments_result.all()

    # Step 3: Map segments to parent tasks
    # For subtask segments, find the parent
    task_to_parent = {}
    subtasks_result = await db.execute(
        select(Task.id, Task.parent_task_id).where(
            Task.user_id == current_user.id,
            Task.parent_task_id.in_(parent_ids)
        )
    )
    for row in subtasks_result.all():
        task_to_parent[row.id] = row.parent_task_id

    # Aggregate by parent task
    aggregation = {}
    for seg in segments:
        task_id = seg.task_id
        parent_id = task_to_parent.get(task_id, task_id)  # If subtask, use parent; else use itself

        if parent_id not in parent_map:
            continue

        if parent_id not in aggregation:
            aggregation[parent_id] = {
                "actual": 0,
                "billed": 0,
                "max_start": None
            }

        aggregation[parent_id]["actual"] += seg.actual_time_seconds
        aggregation[parent_id]["billed"] += seg.billed_time_seconds
        if seg.start_time:
            if aggregation[parent_id]["max_start"] is None or seg.start_time > aggregation[parent_id]["max_start"]:
                aggregation[parent_id]["max_start"] = seg.start_time

    # Step 4: Build response
    unpaid_tasks = []
    for parent_id, parent_task in parent_map.items():
        agg = aggregation.get(parent_id, {"actual": 0, "billed": 0, "max_start": None})

        unpaid_tasks.append(UnpaidTaskResponse(
            task_id=parent_id,
            task_title=parent_task.title,
            end_date=agg["max_start"],
            actual_time_minutes=agg["actual"] // 60,
            billed_time_minutes=agg["billed"] // 60
        ))

    return unpaid_tasks


def _add_text_cell(table, text: str):
    """Add a text cell to an ODS table."""
    row = TableRow()
    cell = TableCell()
    cell.addElement(P(text=str(text)))
    row.addElement(cell)
    table.addElement(row)


def _generate_unpaid_tasks_ods(unpaid_tasks: List[UnpaidTaskResponse]) -> bytes:
    """
    Generate ODS file content for unpaid tasks report.
    
    Columns: Задача, Дата окончания, Продолжительность (мин), Продолжительность к оплате (мин)
    """
    doc = OpenDocumentSpreadsheet()
    table = Table(name="Неоплаченные задачи")

    # Header row
    headers = ["Задача", "Дата окончания", "Продолжительность (мин)", "Продолжительность к оплате (мин)"]
    header_row = TableRow()
    for header in headers:
        cell = TableCell()
        cell.addElement(P(text=header))
        header_row.addElement(cell)
    table.addElement(header_row)

    # Data rows
    for task in unpaid_tasks:
        row = TableRow()
        
        # Task title
        cell = TableCell()
        cell.addElement(P(text=task.task_title))
        row.addElement(cell)
        
        # End date
        end_date_str = task.end_date.strftime("%Y-%m-%d %H:%M") if task.end_date else ""
        cell = TableCell()
        cell.addElement(P(text=end_date_str))
        row.addElement(cell)
        
        # Actual time minutes
        cell = TableCell()
        cell.addElement(P(text=str(task.actual_time_minutes)))
        row.addElement(cell)
        
        # Billed time minutes
        cell = TableCell()
        cell.addElement(P(text=str(task.billed_time_minutes)))
        row.addElement(cell)
        
        table.addElement(row)

    doc.spreadsheet.addElement(table)
    
    # Write to bytes
    buffer = io.BytesIO()
    doc.save(buffer)
    return buffer.getvalue()


@router.get("/unpaid-tasks/export")
async def export_unpaid_tasks_ods(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    project_id: Optional[int] = None,
    client_id: Optional[int] = None,
    list_id: Optional[int] = None
):
    """
    Export unpaid tasks report as ODS file.
    """
    # Get the same data as the JSON endpoint
    unpaid_tasks = await get_unpaid_tasks(
        current_user=current_user,
        db=db,
        project_id=project_id,
        client_id=client_id,
        list_id=list_id
    )

    # Generate ODS
    ods_content = _generate_unpaid_tasks_ods(unpaid_tasks)

    return Response(
        content=ods_content,
        media_type="application/vnd.oasis.opendocument.spreadsheet",
        headers={"Content-Disposition": "attachment; filename=unpaid_tasks.ods"}
    )
