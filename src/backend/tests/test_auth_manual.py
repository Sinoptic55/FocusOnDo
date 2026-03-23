import sys
import os
from datetime import timedelta
import time

# Add current directory to path
sys.path.append(os.path.abspath(os.curdir))

from auth.password import hash_password, verify_password
from auth.jwt import create_jwt_token, decode_jwt_token

def test_password_hashing():
    print("Testing password hashing...")
    password = "secret-password"
    hashed = hash_password(password)
    
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong-password", hashed) is False
    print("✓ Password hashing tests passed")

def test_jwt_token_creation_and_decoding():
    print("Testing JWT creation and decoding...")
    user_id = 123
    token = create_jwt_token(user_id)
    
    assert isinstance(token, str)
    
    payload = decode_jwt_token(token)
    assert payload is not None
    assert payload["sub"] == str(user_id)
    assert "exp" in payload
    assert "iat" in payload
    print("✓ JWT creation and decoding tests passed")

def test_jwt_token_expiration():
    print("Testing JWT expiration...")
    user_id = 456
    # Create a token that is already expired
    token = create_jwt_token(user_id, expires_delta=timedelta(seconds=-1))
    
    payload = decode_jwt_token(token)
    assert payload is None
    print("✓ JWT expiration tests passed")

if __name__ == "__main__":
    try:
        test_password_hashing()
        test_jwt_token_creation_and_decoding()
        test_jwt_token_expiration()
        print("\nAll manual tests passed successfully!")
    except AssertionError as e:
        print(f"\nTest failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nAn error occurred: {e}")
        sys.exit(1)
