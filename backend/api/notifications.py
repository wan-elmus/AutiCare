from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import get_db
from database.models import Prediction, User
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
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

@router.get("/notifications")
async def get_notifications(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        # Fetch predictions from the last 30 minutes, for example
        thirty_minutes_ago = datetime.utcnow() - timedelta(minutes=30)
        result = await db.execute(
            select(Prediction).where(Prediction.timestamp >= thirty_minutes_ago, Prediction.user_id == user.id)
            .order_by(Prediction.timestamp.desc())
        )
        predictions = result.scalars().all()

        # Create notifications from predictions (this is just one example approach)
        notifications = []
        for pred in predictions:
            if pred.stress_level > 80:
                notifications.append({
                    "id": pred.id,
                    "level": "high",
                    "message": f"High Stress Detected: Stress level at {pred.stress_level}",
                    "recommendation": "Consider deep breathing exercises or a short break.",
                    "timestamp": pred.timestamp
                })
            elif pred.stress_level > 50:
                notifications.append({
                    "id": pred.id,
                    "level": "moderate",
                    "message": f"Moderate Stress Warning: Stress level at {pred.stress_level}",
                    "recommendation": "Maybe try a calming activity or a short walk.",
                    "timestamp": pred.timestamp
                })

        return {"notifications": notifications}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
