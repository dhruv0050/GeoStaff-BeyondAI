"""
Authentication Routes
Handles user authentication: OTP generation, verification, and token refresh
"""
from fastapi import APIRouter, HTTPException, status, Depends
from database import get_database
from models.user import LoginRequest, OTPVerifyRequest, TokenResponse, UserResponse, UserRole
from services.otp_service import generate_otp, verify_otp, resend_otp
from utils.jwt_handler import create_user_token, decode_token
from utils.auth_middleware import get_current_user
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/send-otp")
async def send_otp(request: LoginRequest):
    """
    Send OTP to user's phone number
    Creates user if doesn't exist (first-time login)
    
    For MVP: OTP is always 123456
    """
    db = get_database()
    users_collection = db["users"]
    
    # Check if user exists
    user = await users_collection.find_one({"phone": request.phone})
    
    if not user:
        # First-time user - create account with basic info
        # Admin will need to assign role and location later
        new_user = {
            "phone": request.phone,
            "name": f"User {request.phone[-4:]}",  # Temporary name
            "role": UserRole.EMPLOYEE.value,
            "device_id": None,
            "is_active": True,
            "location_id": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await users_collection.insert_one(new_user)
        print(f"✨ New user created: {request.phone}")
    else:
        # Check if user is active
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been deactivated. Contact admin."
            )
    
    # Generate and send OTP
    otp = generate_otp(request.phone)
    
    return {
        "success": True,
        "message": f"OTP sent successfully to {request.phone}",
        "otp": otp  # Only for MVP testing - REMOVE in production!
    }


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp_endpoint(request: OTPVerifyRequest):
    """
    Verify OTP and return JWT token
    Updates device_id if provided
    """
    db = get_database()
    users_collection = db["users"]
    
    # Verify OTP
    if not verify_otp(request.phone, request.otp):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP. Please try again."
        )
    
    # Get user from database
    user = await users_collection.find_one({"phone": request.phone})
    
    # If user doesn't exist (client skipped send-otp), create a basic record
    if not user:
        new_user = {
            "phone": request.phone,
            "name": f"User {request.phone[-4:]}",
            "role": UserRole.EMPLOYEE.value,
            "device_id": None,
            "is_active": True,
            "location_id": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await users_collection.insert_one(new_user)
        user = new_user
        print(f"✨ User auto-created during OTP verify: {request.phone}")
    
    # Update device_id if provided
    if request.device_id:
        await users_collection.update_one(
            {"phone": request.phone},
            {
                "$set": {
                    "device_id": request.device_id,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        user["device_id"] = request.device_id
    
    # Generate JWT token
    access_token = create_user_token(
        phone=user["phone"],
        role=user["role"],
        name=user["name"]
    )
    
    # Prepare user response
    user_response = UserResponse(
        phone=user["phone"],
        name=user["name"],
        role=user["role"],
        is_active=user.get("is_active", True),
        location_id=user.get("location_id"),
        created_at=user["created_at"]
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )


@router.post("/refresh")
async def refresh_token(current_user: dict = Depends(get_current_user)):
    """
    Refresh JWT token
    Returns a new token with updated expiration
    """
    db = get_database()
    users_collection = db["users"]
    
    # Get latest user data from database
    user = await users_collection.find_one({"phone": current_user["phone"]})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated"
        )
    
    # Generate new token
    new_token = create_user_token(
        phone=user["phone"],
        role=user["role"],
        name=user["name"]
    )
    
    # Prepare user response
    user_response = UserResponse(
        phone=user["phone"],
        name=user["name"],
        role=user["role"],
        is_active=user.get("is_active", True),
        location_id=user.get("location_id"),
        created_at=user["created_at"]
    )
    
    return TokenResponse(
        access_token=new_token,
        token_type="bearer",
        user=user_response
    )


@router.post("/resend-otp")
async def resend_otp_endpoint(request: LoginRequest):
    """
    Resend OTP to user's phone number
    """
    db = get_database()
    users_collection = db["users"]
    
    # Check if user exists
    user = await users_collection.find_one({"phone": request.phone})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please register first."
        )
    
    # Generate and send new OTP
    otp = resend_otp(request.phone)
    
    return {
        "success": True,
        "message": f"OTP resent successfully to {request.phone}",
        "otp": otp  # Only for MVP testing - REMOVE in production!
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """
    Get current authenticated user's information
    Protected route - requires valid JWT token
    """
    db = get_database()
    users_collection = db["users"]
    
    # Get user from database
    user = await users_collection.find_one({"phone": current_user["phone"]})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        phone=user["phone"],
        name=user["name"],
        role=user["role"],
        is_active=user.get("is_active", True),
        location_id=user.get("location_id"),
        created_at=user["created_at"]
    )
