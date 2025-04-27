"""
Manages user-related operations, including CRUD for user profiles.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import get_db
from database.models import User
from utils.auth import get_current_user
from pydantic import BaseModel
from passlib.context import CryptContext
import logging
import jwt
from ..config import settings

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("users")

class UserUpdate(BaseModel):
    first_name: str = None
    last_name: str = None
    email: str = None
    password: str = None
    child_name: str = None
    child_age: int = None
    child_bio: str = None
    child_avatar: str = None

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str

@router.get("/users/me")
async def get_current_user_details(
    token: str = None,  # Token from query parameter
    db: AsyncSession = Depends(get_db),
):
    if not token:
        raise HTTPException(status_code=401, detail="Token not provided")
    current_user = await get_current_user(token=token, db=db)
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return {
        "id": current_user.id,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
        "access_token": token
    }

@router.put("/users/me")
async def update_user(
    user_data: UserUpdate, 
    token: str = None,  # Token from query parameter
    db: AsyncSession = Depends(get_db),
):
    if not token:
        raise HTTPException(status_code=401, detail="Token not provided")
    current_user = await get_current_user(token=token, db=db)
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if user_data.email:
        existing_user = await db.execute(select(User).where(User.email == user_data.email, User.id != current_user.id))
        if existing_user.scalar():
            raise HTTPException(status_code=400, detail="Email already registered")
    
    update_data = user_data.dict(exclude_unset=True)
    if "password" in update_data:
        current_user.hashed_password = pwd_context.hash(update_data.pop("password"))
    
    for key, value in update_data.items():
        setattr(current_user, key, value)
    
    await db.commit()
    return {"message": "User updated successfully"}

@router.post("/users/me")
async def create_user(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    existing_user = await db.execute(select(User).where(User.email == user_data.email))
    if existing_user.scalar():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email=user_data.email,
        hashed_password=pwd_context.hash(user_data.password)
    )
    db.add(new_user)
    await db.commit()
    return {"message": "User created successfully", "id": new_user.id}