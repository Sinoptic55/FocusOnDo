"""
Authentication dependencies for FastAPI.
"""
from typing import Optional
from fastapi import Depends, HTTPException, status, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import JWTError

from db.database import get_db
from models.user import User
from auth.jwt import decode_jwt_token
from dotenv import load_dotenv
import os

load_dotenv()

# Cookie name for JWT token
JWT_COOKIE_NAME = "auth_token"


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    auth_token: Optional[str] = Cookie(None, alias=JWT_COOKIE_NAME)
) -> User:
    """
    Dependency to get current authenticated user from JWT cookie.

    Args:
        db: Database session
        auth_token: JWT token from HTTP-only cookie

    Returns:
        Current authenticated User

    Raises:
        HTTPException: If token is invalid or user not found
    """
    if not auth_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_jwt_token(auth_token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = int(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Query user from database
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_current_user_optional(
    db: AsyncSession = Depends(get_db),
    auth_token: Optional[str] = Cookie(None, alias=JWT_COOKIE_NAME)
) -> Optional[User]:
    """
    Optional dependency to get current user without raising exception.

    Returns:
        Current authenticated User or None if not authenticated
    """
    if not auth_token:
        return None

    payload = decode_jwt_token(auth_token)
    if payload is None:
        return None

    user_id: str = payload.get("sub")
    if user_id is None:
        return None

    try:
        user_id = int(user_id)
    except ValueError:
        return None

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    return user
