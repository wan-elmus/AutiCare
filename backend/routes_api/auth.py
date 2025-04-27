"""
Authenticates users using email & password.
Hashes passwords before storing using bcrypt.
Ensures password confirmation matches.
Prevents duplicate emails.
Allows email-based login.
Verifies hashed passwords.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import get_db
from database.models import User
from pydantic import BaseModel, EmailStr
import logging
from passlib.context import CryptContext

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("auth")

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    confirm_password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

@router.post("/auth/signup")
async def signup(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    if user_data.password != user_data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    existing_user = await db.execute(select(User).where(User.email == user_data.email))
    if existing_user.scalar():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
    )
    db.add(new_user)
    await db.commit()
    return {"message": "User registered successfully"}

@router.post("/auth/login")
async def login(user_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_data.email))
    user = result.scalar_one_or_none()
    if not user or not pwd_context.verify(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user_response = {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
    }
    logger.info(f"User logged in: {user.email}")
    return {"user": user_response}

@router.post("/auth/logout")
async def logout():
    response = JSONResponse(content={"message": "Logged out successfully"})
    response.delete_cookie("token")
    response.delete_cookie("refresh_token")
    logger.info("Deleted cookie 'token' and 'refresh_token'")
    return response
