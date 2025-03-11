'''
Handles stress level predictions every 5 minutes, using processed data.
'''

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import get_db
from database.models import ProcessedData, Prediction, User
from utils.model_utils import load_model, predict_stress
from datetime import datetime, timedelta
from utils.auth import get_current_user

router = APIRouter()

@router.get("/predict")
async def get_prediction(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        # latest processed data for the user (last 5 minutes)
        five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
        result = await db.execute(
            select(ProcessedData).where(ProcessedData.timestamp >= five_minutes_ago).order_by(ProcessedData.timestamp.desc()).limit(1)
        )
        processed_data = result.scalar()
        if not processed_data:
            raise HTTPException(status_code=404, detail="No processed data available for the last 5 minutes")

        # features for prediction
        features = {
            "gsr_max": processed_data.gsr_max,
            "gsr_min": processed_data.gsr_min,
            "gsr_mean": processed_data.gsr_mean,
            "gsr_sd": processed_data.gsr_sd,
            "hrate_mean": processed_data.hrate_mean,
            "temp_avg": processed_data.temp_avg
        }

        model = load_model()
        stress_level = predict_stress(model, features)

        # Store prediction
        new_prediction = Prediction(
            stress_level=stress_level,
            user_id=user.id,
            timestamp=datetime.utcnow()
        )
        db.add(new_prediction)
        await db.commit()

        return {"stress_level": stress_level, "timestamp": new_prediction.timestamp}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))