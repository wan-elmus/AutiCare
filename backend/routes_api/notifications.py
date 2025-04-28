"""
Manages notification-related operations, including in-app notifications and SMS delivery receipts.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import get_db
from sqlalchemy import desc
from database.models import Notification, Caregiver
from utils.websocket_manager import websocket_manager
import logging
import json

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("notifications")

@router.get("/")
async def get_notifications(
    email: str,
    db: AsyncSession = Depends(get_db),
    limit: int = 8
):
    try:
        result = await db.execute(select(Caregiver).where(Caregiver.email == email))
        caregiver = result.scalars().first()
        if not caregiver:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caregiver not found")

        result = await db.execute(
            select(Notification)
            .where(Notification.user_id == caregiver.user_id, Notification.dismissed == False)
            .order_by(desc(Notification.timestamp)).limit(limit)
        )
        notifications = result.scalars().all()

        response = [
            {
                "id": n.id,
                "level": n.level,
                "message": n.message,
                "recommendation": n.recommendation,
                "timestamp": n.timestamp.isoformat()
            }
            for n in notifications
        ]
        logger.info(f"Fetched {len(notifications)} notifications for user {email}")
        return {"notifications": response}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching notifications: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.put("/{notification_id}/dismiss")
async def dismiss_notification(
    notification_id: int,
    email: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(select(Caregiver).where(Caregiver.email == email))
        caregiver = result.scalars().first()
        if not caregiver:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caregiver not found")

        result = await db.execute(
            select(Notification).where(Notification.id == notification_id, Notification.user_id == caregiver.user_id)
        )
        notification = result.scalar_one_or_none()
        if not notification:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
        
        notification.dismissed = True
        await db.commit()
        await websocket_manager.broadcast_user(
            user_id=str(caregiver.user_id),
            message=json.dumps({"type": "dismiss_notification", "id": notification_id})
        )
        logger.info(f"Dismissed notification {notification_id} for user {email}")
        return {"message": "Notification dismissed"}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error dismissing notification: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.put("/dismiss-all")
async def dismiss_all_notifications(
    email: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(select(Caregiver).where(Caregiver.email == email))
        caregiver = result.scalars().first()
        if not caregiver:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caregiver not found")

        await db.execute(
            Notification.__table__.update()
            .where(Notification.user_id == caregiver.user_id, Notification.dismissed == False)
            .values(dismissed=True)
        )
        await db.commit()
        await websocket_manager.broadcast_user(
            user_id=str(caregiver.user_id),
            message=json.dumps({"type": "dismiss_all_notifications"})
        )
        logger.info(f"Dismissed all notifications for user {email}")
        return {"message": "All notifications dismissed"}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error dismissing all notifications: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/sms-delivery")
async def sms_delivery_callback(payload: dict):
    """
    Handle SMS delivery receipt from Tiara Connect.
    Payload includes msgId, status, deliveryTime, etc.
    """
    try:
        msg_id = payload.get("msgId")
        status = payload.get("status")
        ref_id = payload.get("refId")
        delivery_time = payload.get("deliveryTime")
        status_reason = payload.get("statusReason")

        if not msg_id or not status:
            logger.error(f"Invalid delivery receipt payload: {payload}")
            raise HTTPException(status_code=400, detail="Missing msgId or status")

        logger.info(
            f"SMS delivery receipt: msgId={msg_id}, refId={ref_id}, "
            f"status={status}, reason={status_reason}, deliveryTime={delivery_time}"
        )

        return {"status": "received", "msgId": msg_id}
    except Exception as e:
        logger.error(f"Error processing SMS delivery receipt: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")