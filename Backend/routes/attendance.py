"""
Attendance Routes
Endpoints for check-in/check-out and attendance tracking
"""
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta, timezone
from typing import Optional
import logging

from models.attendance import (
    AttendanceCheckIn,
    AttendanceCheckOut,
    AttendanceRecord,
    AttendanceResponse,
    TodayAttendanceResponse,
    AttendanceHistoryResponse
)
from routes.auth import get_current_user
from database import get_database

router = APIRouter(prefix="/attendance", tags=["attendance"])
logger = logging.getLogger(__name__)

# IST Timezone offset (UTC+5:30)
IST = timezone(timedelta(hours=5, minutes=30))

def get_ist_now():
    """Get current time in IST"""
    return datetime.now(IST)

def get_today_range_ist():
    """Get start and end of today in IST, returns both aware datetimes and ISO strings"""
    now_ist = get_ist_now()
    today_start = now_ist.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    # Return UTC datetimes for database queries
    return today_start.astimezone(timezone.utc), today_end.astimezone(timezone.utc)


@router.post("/check-in", response_model=AttendanceResponse)
async def check_in(
    check_in_data: AttendanceCheckIn,
    current_user: dict = Depends(get_current_user)
):
    """
    Check-in endpoint with geolocation and device verification
    """
    try:
        db = get_database()
        user_id = current_user["phone"]
        
        # Get today's date range in IST
        today_start, today_end = get_today_range_ist()
        
        # Check if already checked in today
        existing_checkin = await db.attendance.find_one({
            "user_id": user_id,
            "type": "check-in",
            "timestamp": {"$gte": today_start.isoformat(), "$lt": today_end.isoformat()}
        })
        
        if existing_checkin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already checked in today"
            )
        
        # Verify device consistency (optional - can be made stricter)
        user = await db.users.find_one({"phone": user_id})
        if user and user.get("device_id") and user["device_id"] != check_in_data.device_id:
            logger.warning(f"Device mismatch for user {user_id}: expected {user['device_id']}, got {check_in_data.device_id}")
            # For MVP, we'll allow but log the mismatch
        
        # Update user's device_id if not set
        if not user.get("device_id"):
            await db.users.update_one(
                {"phone": user_id},
                {"$set": {"device_id": check_in_data.device_id}}
            )
        
        # Create attendance record with UTC timestamp for storage
        ist_now = get_ist_now()
        attendance_record = AttendanceRecord(
            user_id=user_id,
            type="check-in",
            timestamp=ist_now,  # Pydantic will handle timezone serialization
            location=check_in_data.location,
            device_id=check_in_data.device_id,
            work_status=check_in_data.work_status,
            photo_url=check_in_data.photo_url,
            notes=check_in_data.notes
        )
        
        # Insert into database - store datetime object for proper querying
        result = await db.attendance.insert_one(attendance_record.model_dump(by_alias=True, exclude=["id"]))
        attendance_record.id = result.inserted_id
        
        logger.info(f"User {user_id} checked in at {attendance_record.timestamp}")
        
        return AttendanceResponse(
            success=True,
            message="Checked in successfully",
            attendance=attendance_record
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Check-in failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process check-in"
        )


@router.post("/check-out", response_model=AttendanceResponse)
async def check_out(
    check_out_data: AttendanceCheckOut,
    current_user: dict = Depends(get_current_user)
):
    """
    Check-out endpoint with hours calculation
    """
    try:
        db = get_database()
        user_id = current_user["phone"]
        
        # Get today's date range in IST
        today_start, today_end = get_today_range_ist()
        
        # Check if already checked out today
        existing_checkout = await db.attendance.find_one({
            "user_id": user_id,
            "type": "check-out",
            "timestamp": {"$gte": today_start, "$lt": today_end}
        })
        
        if existing_checkout:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already checked out today"
            )
        
        # Find today's check-in
        check_in_record = await db.attendance.find_one({
            "user_id": user_id,
            "type": "check-in",
            "timestamp": {"$gte": today_start, "$lt": today_end}
        })
        
        if not check_in_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No check-in found for today. Please check in first."
            )
        
        # Verify device
        if check_in_record["device_id"] != check_out_data.device_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Device mismatch. Please use the same device for check-out."
            )
        
        # Create check-out record
        ist_now = get_ist_now()
        attendance_record = AttendanceRecord(
            user_id=user_id,
            type="check-out",
            timestamp=ist_now,
            location=check_out_data.location,
            device_id=check_out_data.device_id,
            work_status=check_in_record["work_status"],  # Use same work status as check-in
            notes=check_out_data.notes
        )
        
        # Calculate hours worked
        check_in_time = check_in_record["timestamp"]
        hours_worked = (ist_now - check_in_time.astimezone(IST)).total_seconds() / 3600
        
        # Insert into database
        result = await db.attendance.insert_one(attendance_record.model_dump(by_alias=True, exclude=["id"]))
        attendance_record.id = result.inserted_id
        
        logger.info(f"User {user_id} checked out at {attendance_record.timestamp}. Hours worked: {hours_worked:.2f}")
        
        return AttendanceResponse(
            success=True,
            message=f"Checked out successfully. Hours worked: {hours_worked:.2f}",
            attendance=attendance_record,
            hours_worked=round(hours_worked, 2)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Check-out failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process check-out"
        )


@router.get("/today", response_model=TodayAttendanceResponse)
async def get_today_attendance(current_user: dict = Depends(get_current_user)):
    """
    Get today's attendance status
    """
    try:
        db = get_database()
        user_id = current_user["phone"]
        
        # Get today's date range in IST
        today_start, today_end = get_today_range_ist()
        
        # Find today's check-in and check-out
        check_in = await db.attendance.find_one({
            "user_id": user_id,
            "type": "check-in",
            "timestamp": {"$gte": today_start, "$lt": today_end}
        })
        
        check_out = await db.attendance.find_one({
            "user_id": user_id,
            "type": "check-out",
            "timestamp": {"$gte": today_start, "$lt": today_end}
        })
        
        # Determine status and convert timestamps from ISO strings to datetime objects
        if check_out:
            status_str = "checked-out"
            checkout_time = check_out["timestamp"]
            checkin_time = check_in["timestamp"]
            hours_worked = (checkout_time - checkin_time).total_seconds() / 3600
        elif check_in:
            status_str = "checked-in"
            checkin_time = check_in["timestamp"]
            hours_worked = (get_ist_now() - checkin_time.astimezone(IST)).total_seconds() / 3600
        else:
            status_str = "not-started"
            hours_worked = None
        
        # Convert to AttendanceRecord models - exclude _id field to avoid Pydantic validation issues
        check_in_record = None
        if check_in:
            check_in_copy = {k: v for k, v in check_in.items() if k != "_id"}
            check_in_record = AttendanceRecord(**check_in_copy)
        
        check_out_record = None
        if check_out:
            check_out_copy = {k: v for k, v in check_out.items() if k != "_id"}
            check_out_record = AttendanceRecord(**check_out_copy)
        
        return TodayAttendanceResponse(
            check_in=check_in_record,
            check_out=check_out_record,
            status=status_str,
            hours_worked=round(hours_worked, 2) if hours_worked else None
        )
        
    except Exception as e:
        logger.error(f"Failed to get today's attendance: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve attendance data"
        )


@router.get("/history", response_model=AttendanceHistoryResponse)
async def get_attendance_history(
    page: int = 1,
    page_size: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """
    Get attendance history with pagination
    """
    try:
        db = get_database()
        user_id = current_user["phone"]
        
        # Calculate skip for pagination
        skip = (page - 1) * page_size
        
        # Get total count
        total_count = await db.attendance.count_documents({"user_id": user_id})
        
        # Get records with pagination (newest first)
        cursor = db.attendance.find({"user_id": user_id}).sort("timestamp", -1).skip(skip).limit(page_size)
        records = await cursor.to_list(length=page_size)
        
        # Convert to AttendanceRecord models
        attendance_records = [AttendanceRecord(**record) for record in records]
        
        return AttendanceHistoryResponse(
            records=attendance_records,
            total_count=total_count,
            page=page,
            page_size=page_size
        )
        
    except Exception as e:
        logger.error(f"Failed to get attendance history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve attendance history"
        )
