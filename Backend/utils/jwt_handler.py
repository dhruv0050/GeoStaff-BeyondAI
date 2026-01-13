"""
JWT Token Generation and Validation Utilities
Handles creation and verification of JWT tokens for authentication
"""
from datetime import datetime, timedelta
from typing import Optional, Dict
from jose import JWTError, jwt
from config import JWT_SECRET_KEY, JWT_ALGORITHM, JWT_ACCESS_TOKEN_EXPIRE_MINUTES


def create_access_token(data: Dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token
    
    Args:
        data: Dictionary containing user data to encode in token
        expires_delta: Optional custom expiration time
    
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    # Set expiration time
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow()
    })
    
    # Create JWT token
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[Dict]:
    """
    Verify and decode a JWT token
    
    Args:
        token: JWT token string to verify
    
    Returns:
        Decoded token payload if valid, None if invalid
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError as e:
        print(f"JWT verification failed: {e}")
        return None


def create_user_token(phone: str, role: str, name: str) -> str:
    """
    Create a JWT token for a user
    
    Args:
        phone: User's phone number
        role: User's role (employee/manager/admin)
        name: User's name
    
    Returns:
        JWT token string
    """
    token_data = {
        "sub": phone,  # Subject (user identifier)
        "role": role,
        "name": name
    }
    return create_access_token(token_data)


def decode_token(token: str) -> Optional[Dict]:
    """
    Decode a JWT token and extract user information
    
    Args:
        token: JWT token string
    
    Returns:
        Dictionary with user info (phone, role, name) or None if invalid
    """
    payload = verify_token(token)
    if payload:
        return {
            "phone": payload.get("sub"),
            "role": payload.get("role"),
            "name": payload.get("name")
        }
    return None
