"""
Attendance Model
Schema for attendance records with geolocation tracking
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal, Dict, Any
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)
    
    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


class Location(BaseModel):
    """Geolocation coordinates"""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    accuracy: Optional[float] = None  # Accuracy in meters
    address: Optional[str] = None  # Reverse geocoded address


class AttendanceRecord(BaseModel):
    """Complete attendance record"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str = Field(..., description="User's phone number")
    type: Literal["check-in", "check-out"] = Field(..., description="Check-in or check-out")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    location: Location = Field(..., description="Geolocation at time of attendance")
    device_id: str = Field(..., description="Device identifier for verification")
    work_status: Literal["office", "site", "remote"] = Field(..., description="Work location type")
    photo_url: Optional[str] = None  # URL to stored photo (if captured)
    notes: Optional[str] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "user_id": "+911234567890",
                "type": "check-in",
                "location": {
                    "latitude": 28.7041,
                    "longitude": 77.1025,
                    "accuracy": 10.5,
                    "address": "Connaught Place, New Delhi"
                },
                "device_id": "device_123abc",
                "work_status": "office",
                "photo_url": "https://storage.example.com/photos/123.jpg"
            }
        }


class AttendanceCheckIn(BaseModel):
    """Request payload for check-in"""
    location: Location
    device_id: str
    work_status: Literal["office", "site", "remote"]
    photo_url: Optional[str] = None
    notes: Optional[str] = None


class AttendanceCheckOut(BaseModel):
    """Request payload for check-out"""
    location: Location
    device_id: str
    notes: Optional[str] = None


class AttendanceResponse(BaseModel):
    """Response with attendance record and status"""
    success: bool
    message: str
    attendance: Optional[Dict[str, Any]] = None
    hours_worked: Optional[float] = None  # For check-out responses


class TodayAttendanceResponse(BaseModel):
    """Today's attendance summary"""
    check_in: Optional[Dict[str, Any]] = None
    check_out: Optional[Dict[str, Any]] = None
    status: Literal["not-started", "checked-in", "checked-out"]
    hours_worked: Optional[float] = None


class AttendanceHistoryResponse(BaseModel):
    """Historical attendance records"""
    records: list[Dict[str, Any]]
    total_count: int
    page: int
    page_size: int
