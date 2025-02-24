'''
Receives JSON payload from ESP8266
Stores in database asynchronously
'''
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import get_db
from database.models import SensorData
from pydantic import BaseModel
import datetime

router = APIRouter()

class SensorDataInput(BaseModel):
    gsr: float
    heart_rate: float
    temperature: float

@router.post("/sensor/data")
async def receive_sensor_data(data: SensorDataInput, db: AsyncSession = Depends(get_db)):
    new_entry = SensorData(**data.dict(), timestamp=datetime.datetime.utcnow())
    db.add(new_entry)
    await db.commit()
    return {"message": "Data received successfully"}
