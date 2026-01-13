"""
MongoDB database connection and instance
"""
from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGODB_URI, MONGODB_NAME

# Global MongoDB client and database instances
mongo_client: AsyncIOMotorClient = None
database = None


async def connect_to_mongo():
    """
    Establish connection to MongoDB
    Called on application startup
    """
    global mongo_client, database
    try:
        mongo_client = AsyncIOMotorClient(MONGODB_URI)
        database = mongo_client[MONGODB_NAME]
        # Test the connection
        await mongo_client.admin.command('ping')
        print(f"✓ Connected to MongoDB: {MONGODB_NAME}")
    except Exception as e:
        print(f"✗ Failed to connect to MongoDB: {e}")
        raise e


async def close_mongo_connection():
    """
    Close MongoDB connection
    Called on application shutdown
    """
    global mongo_client
    if mongo_client:
        mongo_client.close()
        print("✓ MongoDB connection closed")


def get_database():
    """
    Get database instance
    Use this function to access the database in routes
    """
    return database
