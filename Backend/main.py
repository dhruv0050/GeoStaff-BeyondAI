from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

import uvicorn


# Load environment variables from .env file
load_dotenv()
app = FastAPI(
    title="GeoStaff",
    description="API for analyzing videos using advanced machine learning models.",
    version="1.0.0",
)

if __name__ == "__main__":
    print("Starting Geo-Fenced Attendance Management System API...")
    # Use import string form to allow reload without warnings
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
