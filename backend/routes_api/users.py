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
from jose import jwt

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
    email: str,
    db: AsyncSession = Depends(get_db),
):
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided")
    result = await db.execute(select(User).filter(User.email == email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
    }

@router.put("/users/me")
async def update_user(
    user_data: UserUpdate,
    email: str,
    db: AsyncSession = Depends(get_db),
):
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided")
    result = await db.execute(select(User).filter(User.email == email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_data.email and user_data.email != email:
        existing_user = await db.execute(select(User).where(User.email == user_data.email, User.id != user.id))
        if existing_user.scalar():
            raise HTTPException(status_code=400, detail="Email already registered")
    
    update_data = user_data.dict(exclude_unset=True)
    if "password" in update_data:
        user.hashed_password = pwd_context.hash(update_data.pop("password"))
    
    for key, value in update_data.items():
        setattr(user, key, value)
    
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




# ''' without authentication'''

# """
# Manages user-related operations, including CRUD for user profiles.
# """
# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.future import select
# from sqlalchemy.ext.asyncio import AsyncSession
# from database.db import get_db
# from database.models import User
# from utils.auth import get_current_user
# from pydantic import BaseModel
# from passlib.context import CryptContext
# import logging

# router = APIRouter()
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger("users")

# class UserUpdate(BaseModel):
#     first_name: str = None
#     last_name: str = None
#     email: str = None
#     password: str = None
#     child_name: str = None
#     child_age: int = None
#     child_bio: str = None
#     child_avatar: str = None


# @router.get("/users/me")
# async def get_current_user_details(db: AsyncSession = Depends(get_db)):
#     result = await db.execute(select(User).limit(1))
#     user = result.scalar_one_or_none()
#     if not user:
#         raise HTTPException(status_code=404, detail="No users found in database")
    
#     return {
#         "id": user.id,
#         "first_name": user.first_name,
#         "last_name": user.last_name,
#         "email": user.email
#     }

# @router.put("/users/me")
# async def update_user(
#     user_data: UserUpdate,
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_db)
# ):
#     if not current_user:
#         raise HTTPException(status_code=401, detail="Not authenticated")
    
#     if user_data.email:
#         existing_user = await db.execute(select(User).where(User.email == user_data.email, User.id != current_user.id))
#         if existing_user.scalar():
#             raise HTTPException(status_code=400, detail="Email already registered")
    
#     update_data = user_data.dict(exclude_unset=True)
#     if "password" in update_data:
#         current_user.hashed_password = pwd_context.hash(update_data.pop("password"))
    
#     for key, value in update_data.items():
#         setattr(current_user, key, value)
    
#     await db.commit()
#     return {"message": "User updated successfully"}