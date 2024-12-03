from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from pydantic import BaseModel
from contextlib import asynccontextmanager
import bcrypt
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Models
class UserLogin(BaseModel):
    email: str
    password: str
    action: str

class UserResponse(BaseModel):
    id: str
    email: str

# MongoDB setup
try:
    uri = os.getenv("MONGODB_URI")
    if not uri:
        raise ValueError("MONGODB_URI environment variable not set")
        
    mongo_client = MongoClient(uri)
    mongo_client.admin.command('ping')
    print("Successfully connected to MongoDB!")
    
    db = mongo_client['mydatabase']
    users = db['users']
    
except Exception as e:
    print(f"Failed to connect to MongoDB: {e}")
    raise

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    mongo_client.close()

app = FastAPI(lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/auth")
async def auth_handler(user_data: UserLogin):
    try:
        if user_data.action == 'register':
            existing_user = users.find_one({"email": user_data.email})
            if existing_user:
                raise HTTPException(status_code=400, detail="User already exists")

            # Convert password to bytes and store hashed password as string
            password_bytes = user_data.password.encode('utf-8')
            hashed_password = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
            new_user = {
                "email": user_data.email,
                "password": hashed_password.decode('utf-8')  # Store as string
            }
            result = users.insert_one(new_user)
            return {"message": "User created successfully"}

        elif user_data.action == 'login':
            user = users.find_one({"email": user_data.email})
            if not user:
                raise HTTPException(status_code=401, detail="Invalid credentials")

            # Convert both passwords to bytes for comparison
            password_bytes = user_data.password.encode('utf-8')
            stored_password_bytes = user['password'].encode('utf-8')
            
            if bcrypt.checkpw(password_bytes, stored_password_bytes):
                return {
                    "success": True,
                    "user": {
                        "id": str(user['_id']),
                        "email": user['email']
                    }
                }
            raise HTTPException(status_code=401, detail="Invalid credentials")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)