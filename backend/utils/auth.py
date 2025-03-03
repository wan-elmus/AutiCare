from fastapi import Depends, Request
from jose import jwt, JWTError
from database.db import get_db
from sqlalchemy.future import select
from database.models import User
from sqlalchemy.ext.asyncio import AsyncSession
from config import SECRET_KEY, ALGORITHM
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("auth")

async def get_current_user(
    request: Request, 
    db: AsyncSession = Depends(get_db)
    ):
    token = request.cookies.get("token")
    logger.info(f"Checking cookies: {request.cookies}")
    if not token:
        logger.info("No token found in cookies")
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            logger.warning("No email in token payload")
            return None
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            logger.warning(f"User with email {email} not found")
        return user
    except JWTError as e:
        logger.error(f"JWT decode error: {str(e)}")
        return None
    
    