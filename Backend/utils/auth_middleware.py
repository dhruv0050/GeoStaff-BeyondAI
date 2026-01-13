"""
Authentication Middleware
Validates JWT tokens and protects routes requiring authentication
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from utils.jwt_handler import decode_token


# Security scheme for extracting Bearer token from Authorization header
security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Dependency to get current authenticated user from JWT token
    
    Args:
        credentials: HTTP Bearer token credentials
    
    Returns:
        Dictionary with user information (phone, role, name)
    
    Raises:
        HTTPException: If token is invalid or missing
    """
    token = credentials.credentials
    
    # Decode and verify token
    user_data = decode_token(token)
    
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user_data


async def get_current_active_user(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency to ensure user is active
    Can be extended to check database for user's active status
    
    Args:
        current_user: Current user from JWT token
    
    Returns:
        User dictionary if active
    
    Raises:
        HTTPException: If user is inactive
    """
    # TODO: Query database to check if user is active
    # For now, we trust the token
    return current_user


def require_role(allowed_roles: list):
    """
    Dependency factory to check if user has required role
    
    Args:
        allowed_roles: List of roles that are allowed to access the route
    
    Returns:
        Dependency function that checks user role
    
    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_role(["admin"]))])
    """
    async def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role")
        
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}"
            )
        
        return current_user
    
    return role_checker


# Pre-defined role dependencies for common use cases
require_admin = require_role(["admin"])
require_manager = require_role(["manager", "admin"])
require_employee = require_role(["employee", "manager", "admin"])
