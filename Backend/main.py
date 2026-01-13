from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from config import CORS_ORIGINS, CORS_ORIGIN_REGEX, APP_HOST, APP_PORT
from database import connect_to_mongo, close_mongo_connection
from routes import health, auth, attendance


# Lifespan event handler for startup and shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB
    await connect_to_mongo()
    yield
    # Shutdown: Close MongoDB connection
    await close_mongo_connection()


# Initialize FastAPI app
app = FastAPI(
    title="GeoStaff API",
    description="Geo-Fenced Attendance Management System for Store Employees",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS (supports explicit origins and optional regex)
cors_kwargs = {
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}

# Always include explicit origins if provided (and not just '*')
explicit_origins = [o for o in CORS_ORIGINS if o != "*"]
if explicit_origins:
    cors_kwargs["allow_origins"] = explicit_origins

# If regex provided, or wildcard '*' present, enable regex mode
if CORS_ORIGIN_REGEX:
    cors_kwargs["allow_origin_regex"] = CORS_ORIGIN_REGEX
elif "*" in CORS_ORIGINS:
    cors_kwargs["allow_origin_regex"] = ".*"

app.add_middleware(CORSMiddleware, **cors_kwargs)

# Include routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(attendance.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to GeoStaff API",
        "version": "1.0.0",
        "docs": "/docs"
    }


if __name__ == "__main__":
    print("Starting GeoStaff API...")
    uvicorn.run("main:app", host=APP_HOST, port=APP_PORT, reload=True)
