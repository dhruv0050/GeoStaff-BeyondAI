"""
Health check routes for testing API connectivity
"""
from fastapi import APIRouter, HTTPException
from database import get_database

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
async def health_check():
    """
    Basic health check endpoint
    Returns API status and timestamp
    """
    from datetime import datetime
    return {
        "status": "ok",
        "message": "GeoStaff API is running",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/db")
async def database_health_check():
    """
    Check database connectivity
    Returns database status
    """
    try:
        db = get_database()
        # Perform a simple database operation
        await db.command('ping')
        return {
            "status": "ok",
            "message": "Database connection is healthy",
            "database": db.name
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database connection failed: {str(e)}")
