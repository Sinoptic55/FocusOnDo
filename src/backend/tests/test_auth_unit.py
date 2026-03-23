import pytest
from auth.password import hash_password, verify_password
from auth.jwt import create_jwt_token, decode_jwt_token
from datetime import timedelta
import time

def test_password_hashing():
    """Test that passwords are correctly hashed and verified."""
    password = "secret-password"
    hashed = hash_password(password)
    
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong-password", hashed) is False

def test_jwt_token_creation_and_decoding():
    """Test that JWT tokens can be created and decoded."""
    user_id = 123
    token = create_jwt_token(user_id)
    
    assert isinstance(token, str)
    
    payload = decode_jwt_token(token)
    assert payload is not None
    assert payload["sub"] == str(user_id)
    assert "exp" in payload
    assert "iat" in payload

def test_jwt_token_expiration():
    """Test that JWT tokens expire correctly."""
    user_id = 456
    # Create a token that expires in 0 seconds (effectively immediate)
    # Note: python-jose might need at least 1 second or might handle 0 as expired
    token = create_jwt_token(user_id, expires_delta=timedelta(seconds=-1))
    
    payload = decode_jwt_token(token)
    assert payload is None

def test_jwt_invalid_token():
    """Test that invalid JWT tokens return None."""
    assert decode_jwt_token("invalid-token") is None
    assert decode_jwt_token("header.payload.signature") is None
