'''
Authenticates users using email & password.
Generates a JWT token valid for a set duration.
Uses bcrypt to securely hash and verify passwords.
Ensures password confirmation matches.
Hashes passwords before storing.
Prevents duplicate emails.
Allows email-based login.
Verifies hashed passwords.
Returns a valid JWT token on login.
'''
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import JSONResponse
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext
from database.db import get_db
from database.models import User
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from pydantic import BaseModel, EmailStr
from fastapi.security import OAuth2PasswordBearer
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("auth")

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

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

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

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
async def login(
    user_data: LoginRequest, 
    db: AsyncSession = Depends(get_db)
    ):
    result = await db.execute(select(User).where(User.email == user_data.email))
    user = result.scalar_one_or_none()
    print(user)

    if not user or not pwd_context.verify(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({"sub": user.email})
    
    response =JSONResponse(
        content={"message": "Login successful", "access_token": access_token, "token_type": "bearer"},
        status_code=200
    )
    
    response.set_cookie(
        key="token",
        value=access_token,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=False,
        samesite="Lax",
        path="/",
    )
    print(access_token)
    
    logger.info(f"Set cookie 'token' for {user.email}: {access_token}")
    return response

@router.post("/auth/logout")
async def logout():
    response = JSONResponse(content={"message": "Logged out successfully"})
    response.delete_cookie("token")
    logger.info("Deleted cookie 'token'")
    return response
