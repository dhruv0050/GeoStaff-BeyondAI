"""
Leave Management Routes
Endpoints for leave requests, balances, and approvals
"""
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, date
from typing import Optional
import logging
from bson import ObjectId

from models.leave import (
    LeaveType,
    LeaveStatus,
    LeaveRequest,
    LeaveRequestCreate,
    LeaveBalance,
    LeaveRequestResponse,
    LeaveHistoryResponse,
    LeaveBalanceResponse
)
from routes.auth import get_current_user
from database import get_database

router = APIRouter(prefix="/leave", tags=["leave"])
logger = logging.getLogger(__name__)


async def get_or_create_leave_balance(db, user_id: str, year: int) -> LeaveBalance:
    """Get or create leave balance for user and year"""
    balance = await db.leave_balances.find_one({
        "user_id": user_id,
        "year": year
    })
    
    if not balance:
        # Create new balance for the year (30 paid leaves total)
        new_balance = LeaveBalance(
            user_id=user_id,
            casual_balance=10.0,
            sick_balance=10.0,
            earned_balance=10.0,
            total_balance=30.0,
            year=year
        )
        await db.leave_balances.insert_one(new_balance.model_dump())
        return new_balance
    
    return LeaveBalance(**balance)


def calculate_leave_days(start_date: date, end_date: date) -> float:
    """Calculate number of leave days (excluding weekends)"""
    if end_date < start_date:
        raise ValueError("End date must be after start date")
    
    days = 0
    current = start_date
    while current <= end_date:
        # Count only weekdays (Monday=0, Sunday=6)
        if current.weekday() < 5:
            days += 1
        current = date.fromordinal(current.toordinal() + 1)
    
    return float(days)


@router.post("/apply")
async def apply_leave(
    leave_request: LeaveRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    """Apply for leave"""
    try:
        db = get_database()
        user_id = current_user["phone"]
        
        # Calculate leave days
        try:
            days = calculate_leave_days(leave_request.start_date, leave_request.end_date)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        
        if days <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Leave duration must be at least 1 day"
            )
        
        # Check leave balance
        current_year = datetime.utcnow().year
        balance = await get_or_create_leave_balance(db, user_id, current_year)
        
        # Check if sufficient balance
        leave_type = leave_request.leave_type
        if leave_type == LeaveType.CASUAL:
            if balance.casual_balance < days:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient casual leave balance. Available: {balance.casual_balance} days"
                )
        elif leave_type == LeaveType.SICK:
            if balance.sick_balance < days:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient sick leave balance. Available: {balance.sick_balance} days"
                )
        elif leave_type == LeaveType.EARNED:
            if balance.earned_balance < days:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient earned leave balance. Available: {balance.earned_balance} days"
                )
        
        # Check for overlapping leaves
        existing_leaves = await db.leave_requests.find({
            "user_id": user_id,
            "status": {"$in": [LeaveStatus.PENDING.value, LeaveStatus.APPROVED.value]},
            "$or": [
                {
                    "start_date": {"$lte": leave_request.end_date.isoformat()},
                    "end_date": {"$gte": leave_request.start_date.isoformat()}
                }
            ]
        }).to_list(length=10)
        
        if existing_leaves:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Leave dates overlap with existing leave request"
            )
        
        # Create leave request
        new_request = LeaveRequest(
            user_id=user_id,
            leave_type=leave_request.leave_type,
            start_date=leave_request.start_date,
            end_date=leave_request.end_date,
            days=days,
            reason=leave_request.reason,
            status=LeaveStatus.PENDING,
            applied_at=datetime.utcnow()
        )
        
        # Convert to dict and convert dates to ISO strings for MongoDB
        request_dict = new_request.model_dump()
        request_dict['start_date'] = leave_request.start_date.isoformat()
        request_dict['end_date'] = leave_request.end_date.isoformat()
        request_dict['applied_at'] = datetime.utcnow()
        request_dict['status'] = LeaveStatus.PENDING.value
        request_dict['leave_type'] = leave_request.leave_type.value
        
        result = await db.leave_requests.insert_one(request_dict)
        
        logger.info(f"Leave request created for user {user_id}: {days} days ({leave_type})")
        
        return {
            "success": True,
            "message": f"Leave request submitted successfully for {days} days",
            "request_id": str(result.inserted_id),
            "days": days
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to apply leave: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit leave request"
        )


@router.get("/balance", response_model=LeaveBalanceResponse)
async def get_leave_balance(
    year: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get leave balance for current or specified year"""
    try:
        db = get_database()
        user_id = current_user["phone"]
        
        if year is None:
            year = datetime.utcnow().year
        
        balance = await get_or_create_leave_balance(db, user_id, year)
        
        return LeaveBalanceResponse(
            casual_balance=balance.casual_balance,
            sick_balance=balance.sick_balance,
            earned_balance=balance.earned_balance,
            total_balance=balance.total_balance,
            used_casual=balance.used_casual,
            used_sick=balance.used_sick,
            used_earned=balance.used_earned,
            total_used=balance.used_casual + balance.used_sick + balance.used_earned,
            year=balance.year
        )
        
    except Exception as e:
        logger.error(f"Failed to get leave balance: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve leave balance"
        )


@router.get("/history", response_model=LeaveHistoryResponse)
async def get_leave_history(
    page: int = 1,
    page_size: int = 50,
    status_filter: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get leave request history"""
    try:
        db = get_database()
        user_id = current_user["phone"]
        
        # Build query
        query = {"user_id": user_id}
        if status_filter:
            query["status"] = status_filter
        
        # Calculate skip
        skip = (page - 1) * page_size
        
        # Get total count
        total_count = await db.leave_requests.count_documents(query)
        
        # Get records
        cursor = db.leave_requests.find(query).sort("applied_at", -1).skip(skip).limit(page_size)
        records = await cursor.to_list(length=page_size)
        
        # Convert to response models
        requests = []
        for record in records:
            # Parse dates from ISO strings
            start_date_obj = record["start_date"]
            end_date_obj = record["end_date"]
            
            if isinstance(start_date_obj, str):
                start_date_obj = datetime.fromisoformat(start_date_obj).date()
            elif isinstance(start_date_obj, datetime):
                start_date_obj = start_date_obj.date()
            
            if isinstance(end_date_obj, str):
                end_date_obj = datetime.fromisoformat(end_date_obj).date()
            elif isinstance(end_date_obj, datetime):
                end_date_obj = end_date_obj.date()
            
            requests.append(LeaveRequestResponse(
                id=str(record["_id"]),
                user_id=record["user_id"],
                leave_type=record["leave_type"],
                start_date=start_date_obj,
                end_date=end_date_obj,
                days=record["days"],
                reason=record["reason"],
                status=record["status"],
                applied_at=record["applied_at"],
                approved_by=record.get("approved_by"),
                approved_at=record.get("approved_at"),
                rejection_reason=record.get("rejection_reason"),
                cancelled_at=record.get("cancelled_at")
            ))
        
        return LeaveHistoryResponse(
            requests=requests,
            total_count=total_count,
            page=page,
            page_size=page_size
        )
        
    except Exception as e:
        logger.error(f"Failed to get leave history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve leave history"
        )


@router.post("/cancel/{request_id}")
async def cancel_leave(
    request_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Cancel a pending leave request"""
    try:
        db = get_database()
        user_id = current_user["phone"]
        
        # Get leave request
        leave_request = await db.leave_requests.find_one({
            "_id": ObjectId(request_id),
            "user_id": user_id
        })
        
        if not leave_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Leave request not found"
            )
        
        # Check if cancellable
        if leave_request["status"] not in [LeaveStatus.PENDING.value, LeaveStatus.APPROVED.value]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel leave with status: {leave_request['status']}"
            )
        
        # If approved, restore balance
        if leave_request["status"] == LeaveStatus.APPROVED.value:
            current_year = datetime.utcnow().year
            leave_type = leave_request["leave_type"]
            days = leave_request["days"]
            
            update_field = {
                LeaveType.CASUAL.value: "casual_balance",
                LeaveType.SICK.value: "sick_balance",
                LeaveType.EARNED.value: "earned_balance"
            }[leave_type]
            
            used_field = {
                LeaveType.CASUAL.value: "used_casual",
                LeaveType.SICK.value: "used_sick",
                LeaveType.EARNED.value: "used_earned"
            }[leave_type]
            
            # Restore balance
            await db.leave_balances.update_one(
                {"user_id": user_id, "year": current_year},
                {
                    "$inc": {
                        update_field: days,
                        used_field: -days
                    }
                }
            )
        
        # Update leave request status
        await db.leave_requests.update_one(
            {"_id": ObjectId(request_id)},
            {
                "$set": {
                    "status": LeaveStatus.CANCELLED.value,
                    "cancelled_at": datetime.utcnow()
                }
            }
        )
        
        logger.info(f"Leave request {request_id} cancelled by user {user_id}")
        
        return {
            "success": True,
            "message": "Leave request cancelled successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to cancel leave: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel leave request"
        )


@router.get("/pending-count")
async def get_pending_count(current_user: dict = Depends(get_current_user)):
    """Get count of pending leave requests"""
    try:
        db = get_database()
        user_id = current_user["phone"]
        
        count = await db.leave_requests.count_documents({
            "user_id": user_id,
            "status": LeaveStatus.PENDING.value
        })
        
        return {"pending_count": count}
        
    except Exception as e:
        logger.error(f"Failed to get pending count: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get pending count"
        )
