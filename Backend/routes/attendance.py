"""
Attendance Routes
Endpoints for check-in/check-out and attendance tracking
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from datetime import datetime, timedelta, timezone
from typing import Optional
import logging
import io
import pandas as pd

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

def convert_datetime_to_ist_iso(dt):
    """Convert a datetime object (UTC or naive) to IST ISO string"""
    if dt is None:
        return None
    # If datetime is naive (from MongoDB), assume it's UTC
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    # Convert to IST
    ist_dt = dt.astimezone(IST)
    # Return ISO string with timezone offset
    return ist_dt.isoformat()


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
        
        # Prepare response with IST timestamp and proper serialization
        response_data = attendance_record.model_dump(by_alias=True, exclude=["id", "_id"])
        response_data["timestamp"] = convert_datetime_to_ist_iso(attendance_record.timestamp)
        # Ensure location is a dict
        if hasattr(response_data.get("location"), "model_dump"):
            response_data["location"] = response_data["location"].model_dump()
        
        return AttendanceResponse(
            success=True,
            message="Checked in successfully",
            attendance=response_data
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
        # Make timezone-aware if needed
        if check_in_time.tzinfo is None:
            check_in_time = check_in_time.replace(tzinfo=timezone.utc)
        hours_worked = (ist_now - check_in_time.astimezone(IST)).total_seconds() / 3600
        
        # Insert into database
        result = await db.attendance.insert_one(attendance_record.model_dump(by_alias=True, exclude=["id"]))
        attendance_record.id = result.inserted_id
        
        logger.info(f"User {user_id} checked out at {attendance_record.timestamp}. Hours worked: {hours_worked:.2f}")
        
        # Prepare response with IST timestamp and proper serialization
        response_data = attendance_record.model_dump(by_alias=True, exclude=["id", "_id"])
        response_data["timestamp"] = convert_datetime_to_ist_iso(attendance_record.timestamp)
        # Ensure location is a dict
        if hasattr(response_data.get("location"), "model_dump"):
            response_data["location"] = response_data["location"].model_dump()
        
        return AttendanceResponse(
            success=True,
            message=f"Checked out successfully. Hours worked: {hours_worked:.2f}",
            attendance=response_data,
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
        
        # Determine status and convert timestamps
        if check_out:
            status_str = "checked-out"
            checkout_time = check_out["timestamp"]
            checkin_time = check_in["timestamp"]
            # Make timezone-aware if needed
            if checkout_time.tzinfo is None:
                checkout_time = checkout_time.replace(tzinfo=timezone.utc)
            if checkin_time.tzinfo is None:
                checkin_time = checkin_time.replace(tzinfo=timezone.utc)
            hours_worked = (checkout_time - checkin_time).total_seconds() / 3600
        elif check_in:
            status_str = "checked-in"
            checkin_time = check_in["timestamp"]
            # Make timezone-aware if needed
            if checkin_time.tzinfo is None:
                checkin_time = checkin_time.replace(tzinfo=timezone.utc)
            hours_worked = (get_ist_now() - checkin_time.astimezone(IST)).total_seconds() / 3600
        else:
            status_str = "not-started"
            hours_worked = None
        
        # Convert to response with IST timestamps
        check_in_record = None
        if check_in:
            check_in_copy = {k: v for k, v in check_in.items() if k != "_id"}
            check_in_copy["timestamp"] = convert_datetime_to_ist_iso(check_in_copy["timestamp"])
            check_in_record = check_in_copy
        
        check_out_record = None
        if check_out:
            check_out_copy = {k: v for k, v in check_out.items() if k != "_id"}
            check_out_copy["timestamp"] = convert_datetime_to_ist_iso(check_out_copy["timestamp"])
            check_out_record = check_out_copy
        
        return TodayAttendanceResponse(
            check_in=check_in_record,
            check_out=check_out_record,
            status=status_str,
            hours_worked=round(hours_worked, 2) if hours_worked else None
        )
        
    except Exception as e:
        logger.error(f"Failed to get today's attendance: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve attendance data: {str(e)}"
        )


@router.get("/history", response_model=AttendanceHistoryResponse)
async def get_attendance_history(
    page: int = 1,
    page_size: int = 50,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get attendance history with pagination and optional date filtering
    """
    try:
        db = get_database()
        user_id = current_user["phone"]
        
        # Build query filter
        query_filter = {"user_id": user_id}
        
        # Add date range filter if provided
        if start_date or end_date:
            date_filter = {}
            if start_date:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                date_filter["$gte"] = start_dt
            if end_date:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                date_filter["$lt"] = end_dt
            query_filter["timestamp"] = date_filter
        
        # Calculate skip for pagination
        skip = (page - 1) * page_size
        
        # Get total count
        total_count = await db.attendance.count_documents(query_filter)
        
        # Get records with pagination (newest first)
        cursor = db.attendance.find(query_filter).sort("timestamp", -1).skip(skip).limit(page_size)
        records = await cursor.to_list(length=page_size)
        
        # Convert to response models with IST timestamps
        attendance_records = []
        for record in records:
            record_copy = {k: v for k, v in record.items() if k != "_id"}
            # Convert timestamp to IST ISO string
            record_copy["timestamp"] = convert_datetime_to_ist_iso(record_copy["timestamp"])
            attendance_records.append(record_copy)
        
        return {
            "records": attendance_records,
            "total_count": total_count,
            "page": page,
            "page_size": page_size
        }
        
    except Exception as e:
        logger.error(f"Failed to get attendance history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve attendance history"
        )


@router.get("/monthly-summary")
async def get_monthly_summary(
    year: int,
    month: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Get monthly attendance summary (present/absent days)
    """
    try:
        db = get_database()
        user_id = current_user["phone"]
        
        # Calculate month range in IST
        month_start_ist = datetime(year, month, 1, tzinfo=IST)
        
        # Get today's date in IST
        today_ist = get_ist_now().date()
        
        # If the requested month is in the future, set end to month end
        # If the requested month is current, set end to today
        if month == today_ist.month and year == today_ist.year:
            # Current month - only count up to today
            month_end_ist = datetime.combine(today_ist, datetime.max.time(), tzinfo=IST)
        else:
            # Past or future month - use the end of that month
            if month == 12:
                month_end_ist = datetime(year + 1, 1, 1, tzinfo=IST)
            else:
                month_end_ist = datetime(year, month + 1, 1, tzinfo=IST)
        
        # Convert to UTC for database query
        month_start_utc = month_start_ist.astimezone(timezone.utc)
        month_end_utc = month_end_ist.astimezone(timezone.utc)
        
        # Get all check-ins for the period
        check_ins = await db.attendance.find({
            "user_id": user_id,
            "type": "check-in",
            "timestamp": {"$gte": month_start_utc, "$lt": month_end_utc}
        }).to_list(length=None)
        
        # Count unique days with check-ins
        present_days = len(set(
            record["timestamp"].astimezone(IST).date()
            for record in check_ins
        ))
        
        # Calculate working days from month start to today (or month end if past month)
        from calendar import monthrange
        
        if month == today_ist.month and year == today_ist.year:
            # For current month, count working days from start to today
            last_day = today_ist.day
        else:
            # For past/future months, count all working days in that month
            last_day = monthrange(year, month)[1]
        
        # Count weekdays from month start to last_day
        working_days = sum(
            1 for day in range(1, last_day + 1)
            if datetime(year, month, day).weekday() < 5  # Monday=0, Friday=4
        )
        
        absent_days = max(0, working_days - present_days)
        leave_days = 0  # TODO: Integrate with leave management
        
        return {
            "year": year,
            "month": month,
            "present_days": present_days,
            "absent_days": absent_days,
            "leave_days": leave_days,
            "working_days": working_days,
            "total_days": last_day
        }
        
    except Exception as e:
        logger.error(f"Failed to get monthly summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve monthly summary"
        )


@router.get("/recent")
async def get_recent_attendance(
    days: int = 7,
    current_user: dict = Depends(get_current_user)
):
    """
    Get recent attendance records (last N days)
    """
    try:
        db = get_database()
        user_id = current_user["phone"]
        
        # Calculate date range
        end_time = get_ist_now()
        start_time = end_time - timedelta(days=days)
        
        # Convert to UTC for query
        start_time_utc = start_time.astimezone(timezone.utc)
        end_time_utc = end_time.astimezone(timezone.utc)
        
        # Get records
        records = await db.attendance.find({
            "user_id": user_id,
            "timestamp": {"$gte": start_time_utc, "$lte": end_time_utc}
        }).sort("timestamp", -1).to_list(length=None)
        
        # Group by date and calculate daily summary
        daily_summary = {}
        for record in records:
            # Convert timestamp to IST for date grouping
            record_timestamp = record["timestamp"]
            if record_timestamp.tzinfo is None:
                record_timestamp = record_timestamp.replace(tzinfo=timezone.utc)
            ist_timestamp = record_timestamp.astimezone(IST)
            date_key = ist_timestamp.date().isoformat()
            
            if date_key not in daily_summary:
                daily_summary[date_key] = {
                    "date": date_key,
                    "check_in": None,
                    "check_out": None,
                    "hours_worked": None,
                    "status": "absent"
                }
            
            # Convert record timestamp to IST ISO string and create response
            record_copy = {k: v for k, v in record.items() if k != "_id"}
            record_copy["timestamp"] = convert_datetime_to_ist_iso(record_copy["timestamp"])
            
            if record["type"] == "check-in":
                daily_summary[date_key]["check_in"] = record_copy
                daily_summary[date_key]["status"] = "present"
            elif record["type"] == "check-out":
                daily_summary[date_key]["check_out"] = record_copy
        
        # Calculate hours for each day
        for date_key in daily_summary:
            day_data = daily_summary[date_key]
            if day_data["check_in"] and day_data["check_out"]:
                # Parse the ISO strings back to datetime for calculation
                checkin_str = day_data["check_in"]["timestamp"]
                checkout_str = day_data["check_out"]["timestamp"]
                checkin_time = datetime.fromisoformat(checkin_str)
                checkout_time = datetime.fromisoformat(checkout_str)
                hours = (checkout_time - checkin_time).total_seconds() / 3600
                day_data["hours_worked"] = round(hours, 2)
        
        return {
            "days": days,
            "records": list(daily_summary.values())
        }
        
    except Exception as e:
        logger.error(f"Failed to get recent attendance: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve recent attendance"
        )


@router.get("/export")
async def export_attendance(
    format: str = "excel",  # "excel" or "csv"
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Export attendance data to Excel or CSV
    """
    try:
        db = get_database()
        user_id = current_user["phone"]
        user = await db.users.find_one({"phone": user_id})
        
        # Build query filter
        query_filter = {"user_id": user_id}
        
        # Add date range filter
        if start_date or end_date:
            date_filter = {}
            if start_date:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                date_filter["$gte"] = start_dt
            if end_date:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                date_filter["$lt"] = end_dt
            query_filter["timestamp"] = date_filter
        
        # Get all records
        records = await db.attendance.find(query_filter).sort("timestamp", -1).to_list(length=None)
        
        # Prepare data for export
        export_data = []
        for record in records:
            timestamp_ist = record["timestamp"].astimezone(IST)
            export_data.append({
                "Date": timestamp_ist.strftime("%Y-%m-%d"),
                "Time": timestamp_ist.strftime("%H:%M:%S"),
                "Type": record["type"].title(),
                "Status": record.get("work_status", "").title(),
                "Location": f"{record['location']['latitude']}, {record['location']['longitude']}",
                "Accuracy": f"{record['location']['accuracy']}m",
                "Notes": record.get("notes", "")
            })
        
        # Create DataFrame
        df = pd.DataFrame(export_data)
        
        if format.lower() == "csv":
            # Export as CSV
            output = io.StringIO()
            df.to_csv(output, index=False)
            output.seek(0)
            
            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=attendance_{user.get('name', user_id)}_{datetime.now().strftime('%Y%m%d')}.csv"
                }
            )
        else:
            # Export as Excel (default)
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Attendance')
                
                # Auto-adjust column widths
                worksheet = writer.sheets['Attendance']
                for idx, col in enumerate(df.columns):
                    max_length = max(
                        df[col].astype(str).apply(len).max(),
                        len(col)
                    ) + 2
                    worksheet.column_dimensions[chr(65 + idx)].width = min(max_length, 50)
            
            output.seek(0)
            
            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={
                    "Content-Disposition": f"attachment; filename=attendance_{user.get('name', user_id)}_{datetime.now().strftime('%Y%m%d')}.xlsx"
                }
            )
        
    except Exception as e:
        logger.error(f"Failed to export attendance: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export attendance data"
        )
