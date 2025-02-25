'''
Fetches historical predictions for dashboard visualization.
'''
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import get_db
from database.models import Prediction, User
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer
from jose import jwt,JWTError
from config import SECRET_KEY, ALGORITHM

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

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

@router.get("/history")
async def get_history(days: int = 7, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        result = await db.execute(
            select(Prediction).where(Prediction.user_id == user.id, Prediction.timestamp >= start_date)
        )
        predictions = result.scalars().all()
        return [{"timestamp": p.timestamp, "stress_level": p.stress_level} for p in predictions]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))