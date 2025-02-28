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
        # Fetch predictions from the last 30 minutes for this user
        five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
        result = await db.execute(
            select(Prediction)
            .where(Prediction.timestamp >= five_minutes_ago, Prediction.user_id == user.id)
            .order_by(Prediction.timestamp.desc())
        )
        predictions = result.scalars().all()

        notifications = []
        for pred in predictions:
            # Assuming pred.stress_level is an integer between 0 and 3
            if pred.stress_level == 0:
                notifications.append({
                    "id": pred.id,
                    "level": "normal",
                    "message": f"Normal: Stress level at {pred.stress_level}",
                    "recommendation": "No action needed; continue with regular activities and monitor trends.",
                    "timestamp": pred.timestamp.isoformat()
                })
            elif pred.stress_level in [1, 2]:
                notifications.append({
                    "id": pred.id,
                    "level": "slight",
                    "message": f"Slight Stress Detected: Stress level at {pred.stress_level}",
                    "recommendation": (
                        "Encourage calm activities such as listening to soft music or playing with sensory toys. "
                        "Suggest a short break, deep breathing, or a change of environment. Monitor for any escalation."
                    ),
                    "timestamp": pred.timestamp.isoformat()
                })
            elif pred.stress_level == 3:
                notifications.append({
                    "id": pred.id,
                    "level": "high",
                    "message": f"High Stress Detected: Stress level at {pred.stress_level}",
                    "recommendation": (
                        "Notify the caregiver immediately and move the child to a safe, quiet space. "
                        "Use de-escalation techniques (e.g., speaking softly, providing comforting items). "
                        "If distress persists, seek medical attention or contact the child's therapist."
                    ),
                    "timestamp": pred.timestamp.isoformat()
                })
        return {"notifications": notifications}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
