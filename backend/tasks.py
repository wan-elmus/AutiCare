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
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database.db import get_db
from utils.model_utils import load_model, predict_stress
from utils.data_processing import compute_features
from database.models import User, SensorData, Prediction, ProcessedData
from datetime import datetime, timedelta
from utils.websocket_manager import websocket_manager
import asyncio
import time
from typing import List

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("stress_model")

# Load model once at startup
model = load_model()

async def process_data_for_user(user_id: int, db: AsyncSession):
    """Process data for a single user with optimized queries"""
    try:
        start_time = time.time()
        five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
        
        # Optimized query with field selection, ordering, and limit
        sensor_query = select(
            SensorData.gsr,
            SensorData.heart_rate,
            SensorData.temperature
        ).where(
            SensorData.user_id == user_id,
            SensorData.timestamp >= five_minutes_ago
        ).order_by(desc(SensorData.timestamp)).limit(100)

        result = await db.execute(sensor_query)
        data_points = result.all()
        
        if not data_points:
            logger.debug(f"No sensor data for user {user_id}")
            return

        # Feature computation
        features = compute_features(data_points)
        processing_time = time.time() - start_time

        # Store processed data
        processed_data = ProcessedData(
            user_id=user_id,
            timestamp=datetime.utcnow(),
            **features
        )
        db.add(processed_data)
        await db.flush()  # Flush instead of commit to maintain transaction

        # Make prediction
        prediction_start = time.time()
        stress_level = predict_stress(model, features)
        inference_time = time.time() - prediction_start

        # Store prediction
        prediction = Prediction(
            user_id=user_id,
            stress_level=stress_level,
            timestamp=datetime.utcnow(),
            inference_time=inference_time,       
        )
        db.add(prediction)
        
        await db.commit()
        
        logger.info(
            f"Processed user {user_id} | "
            f"Processing: {processing_time:.2f}s | "
            f"Inference: {inference_time:.2f}s | "
            f"Stress: {stress_level}"
        )

        # Broadcast prediction
        await websocket_manager.broadcast_user(
            user_id=str(user_id),
            message=f"prediction,{stress_level}"
        )

    except Exception as e:
        logger.error(f"Error processing user {user_id}: {str(e)}")
        await db.rollback()

async def process_users_batch(user_ids: List[int]):
    """Process batch of users concurrently, each with its own DB session (during shared session)"""
    async def process_single(uid: int):
        db = await anext(get_db())
        try:
            await process_data_for_user(uid, db)
        finally:
            await db.close()
    tasks = [process_single(uid) for uid in user_ids]
    await asyncio.gather(*tasks)

async def process_all_users():
    """Process all users in batches"""
    try:
        db = await anext(get_db())
        try:
            result = await db.execute(select(User.id))
            user_ids = result.scalars().all()
        finally:
            await db.close()
            
        # Process in batches of 50 users
        batch_size = 50
        for i in range(0, len(user_ids), batch_size):
            batch = user_ids[i:i+batch_size]
            await process_users_batch(batch)
            logger.info(f"Processed batch {i//batch_size + 1}/{(len(user_ids)//batch_size)+1}")

    except Exception as e:
        logger.error(f"Error processing users: {str(e)}")

def scheduler_startup():
    """Initialize and configure the scheduler for processing users every 5 minutes"""
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        process_all_users,
        'interval',
        minutes=5,
        max_instances=1  # Prevent overlapping runs
    )
    scheduler.start()
    return scheduler