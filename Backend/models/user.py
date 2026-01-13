"""
User Model
Represents employees, managers, and admins in the system
"""
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """User roles in the system"""
    EMPLOYEE = "employee"
    MANAGER = "manager"
    ADMIN = "admin"


class User(BaseModel):
    """User model for database operations"""
    phone: str = Field(..., description="User's phone number (unique identifier)")
    name: str = Field(..., description="User's full name")
    role: UserRole = Field(default=UserRole.EMPLOYEE, description="User's role")
    device_id: Optional[str] = Field(None, description="Device identifier for attendance tracking")
    is_active: bool = Field(default=True, description="Whether the user account is active")
    location_id: Optional[str] = Field(None, description="Assigned location ID for employee")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @validator('phone')
    def validate_phone(cls, v):
        """Validate phone number format"""
        # Remove any spaces or special characters
        cleaned = ''.join(filter(str.isdigit, v))
        if len(cleaned) < 10:
            raise ValueError('Phone number must be at least 10 digits')
        return cleaned
    
    class Config:
        use_enum_values = True
        json_schema_extra = {
            "example": {
                "phone": "9876543210",
                "name": "John Doe",
                "role": "employee",
                "device_id": "device-123",
                "is_active": True,
                "location_id": "location-1"
            }
        }


class UserCreate(BaseModel):
    """Schema for creating a new user"""
    phone: str
    name: str
    role: UserRole = UserRole.EMPLOYEE
    location_id: Optional[str] = None
    
    @validator('phone')
    def validate_phone(cls, v):
        """Validate phone number format"""
        cleaned = ''.join(filter(str.isdigit, v))
        if len(cleaned) < 10:
            raise ValueError('Phone number must be at least 10 digits')
        return cleaned


class UserUpdate(BaseModel):
    """Schema for updating user information"""
    name: Optional[str] = None
    role: Optional[UserRole] = None
    device_id: Optional[str] = None
    is_active: Optional[bool] = None
    location_id: Optional[str] = None


class UserResponse(BaseModel):
    """Schema for user response (without sensitive data)"""
    phone: str
    name: str
    role: str
    is_active: bool
    location_id: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    """Schema for login request"""
    phone: str
    
    @validator('phone')
    def validate_phone(cls, v):
        """Validate phone number format"""
        cleaned = ''.join(filter(str.isdigit, v))
        if len(cleaned) < 10:
            raise ValueError('Phone number must be at least 10 digits')
        return cleaned


class OTPVerifyRequest(BaseModel):
    """Schema for OTP verification"""
    phone: str
    otp: str
    device_id: Optional[str] = None
    
    @validator('otp')
    def validate_otp(cls, v):
        """Validate OTP format"""
        if not v.isdigit() or len(v) != 6:
            raise ValueError('OTP must be a 6-digit number')
        return v


class TokenResponse(BaseModel):
    """Schema for token response"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
