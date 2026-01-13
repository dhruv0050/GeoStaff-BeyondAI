"""
OTP Service
Handles OTP generation and validation
For MVP: Uses mock OTPs (always 123456)
TODO: Integrate with SMS service (Twilio, MSG91, etc.) in production
"""
from typing import Dict, Optional
from datetime import datetime, timedelta
import random


# In-memory storage for OTPs (for MVP only)
# In production, use Redis or database with TTL
otp_storage: Dict[str, Dict] = {}


def generate_otp(phone: str) -> str:
    """
    Generate a 6-digit OTP for a phone number
    
    For MVP: Always returns "123456" for easy testing
    In production: Generate random OTP and send via SMS
    
    Args:
        phone: User's phone number
    
    Returns:
        Generated OTP string
    """
    # MVP: Mock OTP for testing
    otp = "123456"
    
    # Production: Use random OTP
    # otp = str(random.randint(100000, 999999))
    
    # Store OTP with expiration time (5 minutes)
    expiry_time = datetime.utcnow() + timedelta(minutes=5)
    otp_storage[phone] = {
        "otp": otp,
        "expires_at": expiry_time,
        "attempts": 0
    }
    
    print(f"📱 OTP for {phone}: {otp} (expires at {expiry_time})")
    
    # TODO: Send OTP via SMS service
    # send_sms(phone, f"Your GeoStaff OTP is: {otp}")
    
    return otp


def verify_otp(phone: str, otp: str) -> bool:
    """
    Verify if the provided OTP is valid for the phone number
    
    Args:
        phone: User's phone number
        otp: OTP to verify
    
    Returns:
        True if OTP is valid, False otherwise
    """
    # Check if OTP exists for this phone
    if phone not in otp_storage:
        print(f"❌ No OTP found for phone: {phone}")
        return False
    
    stored_otp_data = otp_storage[phone]
    
    # Check if OTP has expired
    if datetime.utcnow() > stored_otp_data["expires_at"]:
        print(f"❌ OTP expired for phone: {phone}")
        del otp_storage[phone]
        return False
    
    # Check attempt limit (max 3 attempts)
    if stored_otp_data["attempts"] >= 3:
        print(f"❌ Maximum OTP attempts exceeded for phone: {phone}")
        del otp_storage[phone]
        return False
    
    # Verify OTP
    if stored_otp_data["otp"] == otp:
        print(f"✅ OTP verified successfully for phone: {phone}")
        # Clear OTP after successful verification
        del otp_storage[phone]
        return True
    else:
        # Increment attempt counter
        stored_otp_data["attempts"] += 1
        print(f"❌ Invalid OTP for phone: {phone} (Attempt {stored_otp_data['attempts']}/3)")
        return False


def clear_expired_otps():
    """
    Clear expired OTPs from storage
    Should be called periodically in production
    """
    current_time = datetime.utcnow()
    expired_phones = [
        phone for phone, data in otp_storage.items()
        if current_time > data["expires_at"]
    ]
    
    for phone in expired_phones:
        del otp_storage[phone]
        print(f"🧹 Cleared expired OTP for phone: {phone}")
    
    return len(expired_phones)


def resend_otp(phone: str) -> Optional[str]:
    """
    Resend OTP to a phone number
    Generates a new OTP and invalidates the old one
    
    Args:
        phone: User's phone number
    
    Returns:
        New OTP string if successful, None otherwise
    """
    # Clear any existing OTP
    if phone in otp_storage:
        del otp_storage[phone]
    
    # Generate new OTP
    return generate_otp(phone)
