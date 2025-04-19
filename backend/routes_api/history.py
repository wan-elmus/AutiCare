from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import get_db
from database.models import SensorData, Prediction
from datetime import datetime, timedelta
import logging

router = APIRouter(prefix="/history", tags=["history"])
logger = logging.getLogger("history")

@router.get("/processed_data")
async def get_processed_data(
    user_id: int, 
    days: float = 7.0,
    db: AsyncSession = Depends(get_db)
):
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        sensor_result = await db.execute(
            select(SensorData).where(SensorData.user_id == user_id, SensorData.timestamp >= start_date).order_by(SensorData.timestamp.asc())
        )
        sensor_data = sensor_result.scalars().all()
        
        prediction_result = await db.execute(
            select(Prediction).where(
                Prediction.user_id == user_id,
                Prediction.timestamp >= start_date
            ).order_by(Prediction.timestamp.asc())
        )
        predictions = prediction_result.scalars().all()
        
        combined_data = []
        sensor_dict = {s.timestamp: {"heart_rate": s.heart_rate, "temperature": s.temperature, "gsr": s.gsr} for s in sensor_data}
        prediction_dict = {p.timestamp: p.stress_level for p in predictions}
        
        for timestamp in sorted(set(sensor_dict.keys()) | set(prediction_dict.keys())):
            entry = {"timestamp": timestamp.isoformat()}
            if timestamp in sensor_dict:
                entry.update(sensor_dict[timestamp])
            if timestamp in prediction_dict:
                entry["stress_level"] = prediction_dict[timestamp]
            combined_data.append(entry)

        return combined_data
    except Exception as e:
        logger.error(f"Error fetching processed data: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))




# '''
# Fetches historical predictions for dashboard visualization.
# '''
# from fastapi import APIRouter, Depends, HTTPException, status, Request
# from sqlalchemy.future import select
# from sqlalchemy.ext.asyncio import AsyncSession
# from database.db import get_db
# from database.models import SensorData, Prediction, User
# from datetime import datetime, timedelta
# from utils.auth import get_current_user 
# import logging 

# router = APIRouter(prefix="/history", tags=["history"])
# logger = logging.getLogger("history")

# @router.get("/processed_data")
# async def get_processed_data(
#     request: Request,
#     days: float = 7.0, 
#     # user: User = Depends(get_current_user), 
#     db: AsyncSession = Depends(get_db)
#     ):
#     token = request.cookies.get("token")
#     user = await get_current_user(token=token, db=db)  # Pass token explicitly
#     if not user:
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
#     try:
#         start_date = datetime.utcnow() - timedelta(days=days)
#         # SensorData
#         sensor_result = await db.execute(
#             select(SensorData).where(SensorData.user_id == user.id, SensorData.timestamp >= start_date).order_by(SensorData.timestamp.asc())
#         )
#         sensor_data = sensor_result.scalars().all()
        
#         # Predictions
#         prediction_result = await db.execute(
#             select(Prediction).where(
#                 Prediction.user_id == user.id,
#                 Prediction.timestamp >= start_date
#             ).order_by(Prediction.timestamp.asc())
#         )
#         predictions = prediction_result.scalars().all()
        
#         # Combine data
#         combined_data = []
#         sensor_dict = {s.timestamp: {"heart_rate": s.heart_rate, "temperature": s.temperature, "gsr": s.gsr} for s in sensor_data}
#         prediction_dict = {p.timestamp: p.stress_level for p in predictions}
        
#         # Merging by timestamp (allowing some tolerance if timestamps don't align perfectly)
#         for timestamp in sorted(set(sensor_dict.keys()) | set(prediction_dict.keys())):
#             entry = {"timestamp": timestamp.isoformat()}
#             if timestamp in sensor_dict:
#                 entry.update(sensor_dict[timestamp])
#             if timestamp in prediction_dict:
#                 entry["stress_level"] = prediction_dict[timestamp]
#             combined_data.append(entry)

#         return combined_data
            
#     except Exception as e:
#         logger.error(f"Error fetching processed data: {str(e)}")
#         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))