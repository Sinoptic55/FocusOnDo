"""
Authentication module.
"""
from .password import hash_password, verify_password
from .jwt import create_jwt_token, decode_jwt_token
from .dependencies import get_current_user, get_current_user_optional, JWT_COOKIE_NAME

__all__ = [
    "hash_password",
    "verify_password",
    "create_jwt_token",
    "decode_jwt_token",
    "get_current_user",
    "get_current_user_optional",
    "JWT_COOKIE_NAME"
]
