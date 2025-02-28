'''
Manages user-related operations, including CRUD for user profiles.
'''
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import get_db
from database.models import User
from pydantic import BaseModel
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from config import SECRET_KEY, ALGORITHM

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str

class UserUpdate(BaseModel):
    first_name: str = None
    last_name: str = None
    email: str = None
    password: str = None
    child_name: str = None
    child_age: int = None
    child_bio: str = None
    child_avatar: str = None
    


async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        result = await db.execute(select(User).where(User.email == user_id))
        user = result.scalar()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/users")
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

@router.get("/users/me")
async def get_current_user_details(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email
    }

@router.put("/users/me")
async def update_user(
    user_data: UserUpdate, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)):
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
