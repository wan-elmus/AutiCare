'''
Aggregates data every 5 minutes
Processes features & runs ML model
Ensures real-time updates without polling.
Sends new predictions instantly to all connected clients.
Selects only necessary fields instead of SELECT *.
Uses .order_by(SensorData.timestamp.desc()) for efficiency.
Limits results to 100 for faster query execution.
Logs inference time to monitor model performance.
Tracks prediction values for debugging.
Logs database commits to confirm data storage.
'''
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database.db import SessionLocal
from utils.model_utils import load_model, predict_stress
from utils.data_processing import compute_features
from database.models import SensorData, Prediction
from datetime import datetime, timedelta
from utils.websocket_manager import websocket_manager
import asyncio
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("stress_model")

scheduler = BackgroundScheduler()
model = load_model()


async def process_data():
    async with SessionLocal() as db:
        now = datetime.utcnow()
        start_time = now - timedelta(minutes=5)

        # Optimized Query: Select only the necessary fields and limit results
        result = await db.execute(
            select(SensorData.value, SensorData.timestamp)
            .where(SensorData.timestamp >= start_time)
            .order_by(SensorData.timestamp.desc())
            .limit(100) 
        )
        data_points = result.all()

        if len(data_points) >= 60:
            start_time = time.time() #stsrt measuring inference time
            features = compute_features(data_points)
            prediction = predict_stress(model, features)
            inference_time = time.time() - start_time # compute duration
            
            logger.info(f"Stree prediction:
                        {prediction}, Inference time:
                        {inference_time:.3f} seconds")

            new_prediction = Prediction(stress_level=prediction)
            db.add(new_prediction)
            await db.commit()
            logger.info("Prediction saved to database.")

            # Broadcast via WebSocket
            await websocket_manager.broadcast(f"New Stress Prediction: {prediction}")

            
# Schedule job correctly without start()
scheduler.add_job(process_data, "interval", minutes=5)

