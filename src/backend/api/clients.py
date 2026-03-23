"""
Clients API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from db.database import get_db
from models.client import Client
from models.task import Task
from schemas.reference import ClientCreate, ClientUpdate, ClientResponse
from auth.dependencies import get_current_user
from models.user import User

router = APIRouter(prefix="/api/clients", tags=["Clients"])


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    client: ClientCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new client.
    """
    # Check if client name already exists for this user
    result = await db.execute(
        select(Client).where(
            Client.user_id == current_user.id,
            Client.name == client.name
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A client with this name already exists"
        )

    new_client = Client(
        user_id=current_user.id,
        **client.model_dump()
    )
    db.add(new_client)
    await db.commit()
    await db.refresh(new_client)

    return ClientResponse.model_validate(new_client)


@router.get("", response_model=List[ClientResponse])
async def get_clients(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all clients for current user.
    """
    result = await db.execute(
        select(Client)
        .where(Client.user_id == current_user.id)
        .order_by(Client.name)
    )
    clients = result.scalars().all()

    return [ClientResponse.model_validate(client) for client in clients]


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific client.
    """
    result = await db.execute(
        select(Client).where(
            Client.id == client_id,
            Client.user_id == current_user.id
        )
    )
    client = result.scalar_one_or_none()

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )

    return ClientResponse.model_validate(client)


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: int,
    client_update: ClientUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a client.
    """
    result = await db.execute(
        select(Client).where(
            Client.id == client_id,
            Client.user_id == current_user.id
        )
    )
    client = result.scalar_one_or_none()

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )

    # Check if new name already exists for this user (excluding current client)
    update_data = client_update.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != client.name:
        result = await db.execute(
            select(Client).where(
                Client.user_id == current_user.id,
                Client.name == update_data["name"],
                Client.id != client_id
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A client with this name already exists"
            )

    # Update client fields
    for field, value in update_data.items():
        setattr(client, field, value)

    await db.commit()
    await db.refresh(client)

    return ClientResponse.model_validate(client)


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a client.
    """
    result = await db.execute(
        select(Client).where(
            Client.id == client_id,
            Client.user_id == current_user.id
        )
    )
    client = result.scalar_one_or_none()

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )

    # Check if there are tasks associated with this client
    result = await db.execute(
        select(func.count(Task.id)).where(Task.client_id == client_id)
    )
    task_count = result.scalar()

    if task_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete client with {task_count} associated task(s). Please reassign or delete the tasks first."
        )

    await db.delete(client)
    await db.commit()

    return None
