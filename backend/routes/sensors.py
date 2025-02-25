'''
Receives JSON payload from ESP8266
Stores in database asynchronously
user_id for user association, ensuring each reading is linked to a user.
Improved error handling with try-except, rolling back on failure and returning a 500 error with details.
'''
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import get_db
from database.models import SensorData
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class SensorDataInput(BaseModel):
    gsr: float
    heart_rate: float
    temperature: float
    user_id: int 

@router.post("/sensor/data")
async def receive_sensor_data(data: SensorDataInput, db: AsyncSession = Depends(get_db)):
    try:
        new_entry = SensorData(
            gsr=data.gsr,
            heart_rate=data.heart_rate,
            temperature=data.temperature,
            timestamp=datetime.utcnow(),
            user_id=data.user_id
        )
        db.add(new_entry)
        await db.commit()
        return {"message": "Data received successfully", "id": new_entry.id}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))