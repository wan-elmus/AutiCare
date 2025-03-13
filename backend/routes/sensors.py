'''
Receives JSON payload from ESP8266
Stores in database asynchronously
user_id for user association, ensuring each reading is linked to a user.
Improved error handling with try-except, rolling back on failure and returning a 500 error with details.
'''
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, status, Query, Request
from starlette.websockets import WebSocketState
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import get_db
from database.models import SensorData, User, Prediction
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime, timedelta
from utils.auth import get_current_user
from utils.websocket_manager import websocket_manager
import asyncio
import logging
import json

router = APIRouter(prefix="/sensor", tags=["sensor"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sensor")

class SensorDataInput(BaseModel):
    gsr: float
    heart_rate: float
    temperature: float
    # user_id: int 
    

@router.post("/data")
async def receive_sensor_data(
    data: SensorDataInput, 
    # user: User = Depends(get_current_user),
    request: Request,
    db: AsyncSession = Depends(get_db)
    ):
    token = request.cookies.get("token")
    user = await get_current_user(token=token, db=db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        new_entry = SensorData(
            user_id=user.id,
            gsr=data.gsr,
            heart_rate=data.heart_rate,
            temperature=data.temperature,
            timestamp=datetime.utcnow(),
        )
        db.add(new_entry)
        await db.commit()
        await db.refresh(new_entry)
        
        # Fetch latest stress_level from Prediction
        result = await db.execute(
            select(Prediction)
            .where(Prediction.user_id == user.id)
            .order_by(Prediction.timestamp.desc())
            .limit(1)
        )
        latest_prediction = result.scalar()
        stress_level = latest_prediction.stress_level if latest_prediction else None

        # Broadcast raw data and stress level (if available) to specific user
        payload = {
            "type": "sensor_data",
            "timestamp": new_entry.timestamp.isoformat(),
            "heart_rate": new_entry.heart_rate,
            "temperature": new_entry.temperature,
            "gsr": new_entry.gsr,
            "stress_level": stress_level
        }
        await websocket_manager.broadcast_user(
            user_id=str(user.id), 
            message=json.dumps(payload) + "\n"
        )
        logger.info(f"Sensor data stored and broadcasted for user {user.id}: {payload}")
        
        return {"message": "Data received successfully", "id": new_entry.id}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    
@router.websocket("/ws/sensor/data")
async def websocket_sensor_data(
    websocket: WebSocket, 
    # token: str = Query(...), 
    # user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """WebSocket endpoint for sensor data ingestion and prediction broadcasts."""
    # await websocket.accept()
    token = websocket.cookies.get("token")
    logger.info(f"WebSocket cookies: {websocket.cookies}")
    user = await get_current_user(token=token, db=db)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        logger.info("Authentication failed: No valid token")
        return
    
    await websocket.accept()
    connected = await websocket_manager.connect(websocket, db, user)
    if not connected:
        logger.info(f"Connection rejected for {user.email}")
        # await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Connection rejected")
        return
    try:
        # await websocket.accept()
        logger.info(f"WebSocket connected for user: {user.email}")
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                if data != "ping":
                    try:
                        sensor_data = json.loads(data)
                        db_sensor_data = SensorData(
                            user_id=user.id,
                            heart_rate=sensor_data.get("heart_rate"),
                            temperature=sensor_data.get("temperature"),
                            gsr=sensor_data.get("gsr"),
                        )
                        db.add(db_sensor_data)
                        await db.commit()
                        payload = {
                            "type": "sensor_data",
                            "timestamp": db_sensor_data.timestamp.isoformat(),
                            "heart_rate": db_sensor_data.heart_rate,
                            "temperature": db_sensor_data.temperature,
                            "gsr": db_sensor_data.gsr,
                            "stress_level": None
                        }
                        await websocket_manager.broadcast_user(
                            user_id=str(user.id),
                            message=json.dumps(payload)
                        )
                        await websocket.send_text(json.dumps({"message": "Sensor data received"}))
                        logger.info(f"Received sensor data via WebSocket from {user.email}: {data}")
                    except json.JSONDecodeError:
                        await websocket.send_text("Error: Invalid JSON data")
                        logger.error(f"Invalid JSON from {user.email}: {data}")
            except asyncio.TimeoutError:
                await websocket.send_text("ping")
                logger.debug(f"Sent ping to {user.email}")
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user: {user.email}")
    except Exception as e:
        logger.error(f"WebSocket error for {user.email}: {str(e)}")
    finally:
        if websocket.client_state == WebSocketState.CONNECTED:
            await websocket.close(code=status.WS_1000_NORMAL_CLOSURE)
        await websocket_manager.disconnect(str(user.email))