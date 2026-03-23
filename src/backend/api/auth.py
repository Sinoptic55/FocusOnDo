"""
Authentication API endpoints.
"""
from fastapi import APIRouter, HTTPException, status, Response, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from db.database import get_db
from models.user import User
from schemas.auth import RegisterRequest, LoginRequest, UserResponse
from auth.password import hash_password, verify_password
from auth.jwt import create_jwt_token
from auth.dependencies import JWT_COOKIE_NAME
from auth.rate_limiter import login_rate_limiter
from services.seed_data import create_seed_data
from dotenv import load_dotenv
import os

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user.
    """
    # Check if username already exists
    result = await db.execute(
        select(User).where(User.username == request.username)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # Check if email already exists
    result = await db.execute(
        select(User).where(User.email == request.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    user = User(
        username=request.username,
        email=request.email,
        password_hash=hash_password(request.password)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Create seed data for new user
    await create_seed_data(db, user.id)

    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        created_at=user.created_at.isoformat()
    )


@router.post("/login")
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Login user and set JWT cookie.
    """
    # Rate limiting check
    if not await login_rate_limiter.is_allowed(request.username):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later."
        )

    # Find user by username
    result = await db.execute(
        select(User).where(User.username == request.username)
    )
    user = result.scalar_one_or_none()

    if not user:
        await login_rate_limiter.record_failed_attempt(request.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    # Verify password
    if not verify_password(request.password, user.password_hash):
        await login_rate_limiter.record_failed_attempt(request.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    # Clear failed attempts on successful login
    await login_rate_limiter.clear_attempts(request.username)

    # Create JWT token
    token = create_jwt_token(user.id)

    # Set HTTP-only cookie
    response = Response(content='{"message": "Login successful"}')
    response.set_cookie(
        key=JWT_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=24 * 60 * 60  # 24 hours
    )

    return response


@router.post("/logout")
async def logout():
    """
    Logout user by clearing JWT cookie.
    """
    response = Response(content='{"message": "Logout successful"}')
    response.delete_cookie(JWT_COOKIE_NAME)
    return response