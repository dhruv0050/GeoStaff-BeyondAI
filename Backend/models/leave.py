"""
Leave Management Models
Handles leave requests, balances, and types
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from enum import Enum


class LeaveType(str, Enum):
    """Leave type enumeration"""
    CASUAL = "casual"
    SICK = "sick"
    EARNED = "earned"


class LeaveStatus(str, Enum):
    """Leave request status"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class LeaveRequest(BaseModel):
    """Leave request model"""
    user_id: str
    leave_type: LeaveType
    start_date: date
    end_date: date
    days: float
    reason: str
    status: LeaveStatus = LeaveStatus.PENDING
    applied_at: datetime = Field(default_factory=datetime.utcnow)
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    cancelled_at: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }


class LeaveRequestCreate(BaseModel):
    """Leave request creation payload"""
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: str
    
    class Config:
        json_encoders = {
            date: lambda v: v.isoformat()
        }


class LeaveBalance(BaseModel):
    """Leave balance model"""
    user_id: str
    casual_balance: float = 10.0
    sick_balance: float = 10.0
    earned_balance: float = 10.0
    total_balance: float = 30.0
    used_casual: float = 0.0
    used_sick: float = 0.0
    used_earned: float = 0.0
    year: int = Field(default_factory=lambda: datetime.utcnow().year)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class LeaveRequestResponse(BaseModel):
    """Leave request response"""
    id: str
    user_id: str
    leave_type: LeaveType
    start_date: date
    end_date: date
    days: float
    reason: str
    status: LeaveStatus
    applied_at: datetime
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    cancelled_at: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }


class LeaveHistoryResponse(BaseModel):
    """Leave history response with pagination"""
    requests: List[LeaveRequestResponse]
    total_count: int
    page: int
    page_size: int


class LeaveBalanceResponse(BaseModel):
    """Leave balance response"""
    casual_balance: float
    sick_balance: float
    earned_balance: float
    total_balance: float
    used_casual: float
    used_sick: float
    used_earned: float
    total_used: float
    year: int
