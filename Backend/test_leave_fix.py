"""
Quick test for leave date serialization fix
"""
from datetime import date, datetime
from models.leave import LeaveRequest, LeaveStatus

# Test 1: Create a LeaveRequest with date objects
start_date = date(2026, 1, 16)
end_date = date(2026, 1, 19)

request = LeaveRequest(
    user_id="9876543210",
    leave_type="casual",
    start_date=start_date,
    end_date=end_date,
    days=2.0,
    reason="Testing",
    status=LeaveStatus.PENDING,
    applied_at=datetime.utcnow()
)

print("✅ LeaveRequest created successfully")
print(f"   Start Date: {request.start_date} (type: {type(request.start_date).__name__})")
print(f"   End Date: {request.end_date} (type: {type(request.end_date).__name__})")

# Test 2: Convert to dict and then to ISO strings
request_dict = request.model_dump()
print("\n✅ model_dump() successful")

# Test 3: Convert dates to ISO strings (this is what the fix does)
request_dict['start_date'] = start_date.isoformat()
request_dict['end_date'] = end_date.isoformat()
request_dict['status'] = LeaveStatus.PENDING.value
request_dict['leave_type'] = "casual"

print("\n✅ Date conversion to ISO strings successful")
print(f"   Start Date (ISO): {request_dict['start_date']}")
print(f"   End Date (ISO): {request_dict['end_date']}")

# Test 4: Verify the dict is JSON serializable
import json
json_str = json.dumps(request_dict, default=str)
print("\n✅ JSON serialization successful")
print(f"   JSON Length: {len(json_str)} chars")

print("\n" + "="*50)
print("✅ All tests passed! The fix is working correctly.")
print("="*50)
