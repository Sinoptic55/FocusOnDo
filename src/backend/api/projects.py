"""
Projects API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from db.database import get_db
from models.project import Project
from models.task import Task
from schemas.reference import ProjectCreate, ProjectUpdate, ProjectResponse
from auth.dependencies import get_current_user
from models.user import User

router = APIRouter(prefix="/api/projects", tags=["Projects"])


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new project.
    """
    # Check if project name already exists for this user
    result = await db.execute(
        select(Project).where(
            Project.user_id == current_user.id,
            Project.name == project.name
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A project with this name already exists"
        )

    new_project = Project(
        user_id=current_user.id,
        **project.model_dump()
    )
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)

    return ProjectResponse.model_validate(new_project)


@router.get("", response_model=List[ProjectResponse])
async def get_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    include_archived: bool = False
):
    """
    Get all projects for current user.
    Optionally include archived projects.
    """
    query = select(Project).where(Project.user_id == current_user.id)

    if not include_archived:
        query = query.where(Project.archived == False)

    result = await db.execute(query.order_by(Project.id))
    projects = result.scalars().all()

    return [ProjectResponse.model_validate(project) for project in projects]


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific project.
    """
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user.id
        )
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    return ProjectResponse.model_validate(project)


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a project.
    """
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user.id
        )
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Check if new name already exists for this user (excluding current project)
    update_data = project_update.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != project.name:
        result = await db.execute(
            select(Project).where(
                Project.user_id == current_user.id,
                Project.name == update_data["name"],
                Project.id != project_id
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A project with this name already exists"
            )

    # Update project fields
    for field, value in update_data.items():
        setattr(project, field, value)

    await db.commit()
    await db.refresh(project)

    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a project.
    """
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user.id
        )
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Check if there are tasks associated with this project
    result = await db.execute(
        select(func.count(Task.id)).where(Task.project_id == project_id)
    )
    task_count = result.scalar()

    if task_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete project with {task_count} associated task(s). Please reassign or delete the tasks first."
        )

    await db.delete(project)
    await db.commit()

    return None
