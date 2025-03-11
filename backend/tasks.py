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
from database.models import User, SensorData, Prediction, ProcessedData, Notification
from datetime import datetime, timedelta
from utils.websocket_manager import websocket_manager
import time
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("stress_model")

scheduler = AsyncIOScheduler(timezone="Africa/Nairobi")
model = load_model()

async def process_data_for_user(user_id: int, db: AsyncSession):
    """Process data for a single user with optimized queries"""
    try:
        start_time = time.time()
        five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
        
        # Fetch full SensorData objects for compute_features compatibility
        sensor_query = select(SensorData).where(
            SensorData.user_id == user_id,
            SensorData.timestamp >= five_minutes_ago
        ).order_by(desc(SensorData.timestamp)).limit(100)

        result = await db.execute(sensor_query)
        data_points = result.scalars().all()
        
        if not data_points:
            logger.debug(f"No sensor data for user {user_id}")
            return

        features = compute_features(data_points)
        processing_time = time.time() - start_time

        processed_data = ProcessedData(
            user_id=user_id,
            timestamp=datetime.utcnow(),
            sensor_data_id=data_points[0].id,
            gsr_max=float(features["gsr_max"]),
            gsr_min=float(features["gsr_min"]),
            gsr_mean=float(features["gsr_mean"]),
            gsr_sd=float(features["gsr_sd"]),
            hrate_mean=float(features["hrate_mean"]),
            temp_avg=float(features["temp_avg"])
        )
        db.add(processed_data)
        await db.flush()

        prediction_start = time.time()
        stress_level = predict_stress(model, features)
        inference_time = time.time() - prediction_start

        prediction = Prediction(
            user_id=user_id,
            stress_level=stress_level,
            timestamp=datetime.utcnow(),
            inference_time=inference_time,       
        )
        db.add(prediction)
        await db.flush()
        
        # Notifications based on stress_level
        if stress_level == 0:
            notification = Notification(
                user_id=user_id,
                prediction_id=prediction.id,
                level="normal",
                message=f"Normal: Stress level at {stress_level}",
                recommendation="No action needed; continue with regular activities and monitor trends."
            )
        elif stress_level in [1, 2]:
            notification = Notification(
                user_id=user_id,
                prediction_id=prediction.id,
                level="slight",
                message=f"Slight Stress Detected: Stress level at {stress_level}",
                recommendation=(
                    "Encourage calm activities such as listening to soft music or playing with sensory toys. "
                    "Suggest a short break, deep breathing, or a change of environment. Monitor for any escalation."
                )
            )
        elif stress_level == 3:
            notification = Notification(
                user_id=user_id,
                prediction_id=prediction.id,
                level="high",
                message=f"High Stress Detected: Stress level at {stress_level}",
                recommendation=(
                    "Notify the caregiver immediately and move the child to a safe, quiet space. "
                    "Use de-escalation techniques (e.g., speaking softly, providing comforting items). "
                    "If distress persists, seek medical attention or contact the child's therapist."
                )
            )
        db.add(notification)
        await db.commit()
        
        latest_data = data_points[0]
        sensor_payload = {
            "type": "sensor_data",
            "timestamp": latest_data.timestamp.isoformat(),
            "heart_rate": latest_data.heart_rate,
            "temperature": latest_data.temperature,
            "gsr": latest_data.gsr,
            "stress_level": stress_level
        }
        await websocket_manager.broadcast_user(
            user_id=str(user_id),
            message=json.dumps(sensor_payload)
        )
        
        # Broadcast notifications
        notification_payload = {
            "type": "notification",
            "data": {
                "id": notification.id,
                "level": notification.level,
                "message": notification.message,
                "recommendation": notification.recommendation,
                "timestamp": notification.timestamp.isoformat()
            }
        }
        await websocket_manager.broadcast_user(
            user_id=str(user_id),
            message=json.dumps(notification_payload)
        )
        
        logger.info(
            f"Processed user {user_id} | "
            f"Processing: {processing_time:.2f}s | "
            f"Inference: {inference_time:.2f}s | "
            f"Stress: {stress_level}"
        )

    except Exception as e:
        logger.error(f"Error processing user {user_id}: {str(e)}")
        await db.rollback()


async def process_all_users():
    """Process all users in batches"""
    db = None
    db_gen = get_db()
    try:
        db = await anext(db_gen)
        result = await db.execute(select(User))
        users = result.scalars().all()
        for user in users:
            await process_data_for_user(user.id, db)
    except Exception as e:
        logger.error(f"Error processing all users: {str(e)}")
    finally:
        if db is not None:
            await db.close()
        await db_gen.aclose()


def scheduler_startup():
    scheduler.add_job(
        process_all_users,
        trigger='interval',
        minutes=5,
        id='process_users',
        replace_existing=True,
        misfire_grace_time=60
    )
    scheduler.start()
    logger.info("Scheduler started")
    return scheduler

