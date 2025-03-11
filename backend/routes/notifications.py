"""
Manages notification-related operations.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import get_db
from sqlalchemy import desc
from database.models import Notification, User
from utils.auth import get_current_user
import logging
from utils.websocket_manager import websocket_manager
import json

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("notifications")

@router.get("/")
async def get_notifications(
    user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db),
    limit: int = 8
):
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    try:
        result = await db.execute(
            select(Notification)
            .where(Notification.user_id == user.id, Notification.dismissed == False)
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
        logger.info(f"Fetched {len(notifications)} notifications for user {user.email}")
        return {"notifications": response}
    except Exception as e:
        logger.error(f"Error fetching notifications: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.put("/{notification_id}/dismiss")
async def dismiss_notification(
    notification_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(Notification).where(Notification.id == notification_id, Notification.user_id == user.id)
        )
        notification = result.scalar_one_or_none()
        if not notification:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
        
        notification.dismissed = True
        await db.commit()
        await websocket_manager.broadcast_user(
        user_id=str(user.id),
        message=json.dumps({"type": "dismiss_notification", "id": notification_id})
        )
        logger.info(f"Dismissed notification {notification_id} for user {user.email}")
        return {"message": "Notification dismissed"}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error dismissing notification: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.put("/dismiss-all")
async def dismiss_all_notifications(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        await db.execute(
            Notification.__table__.update()
            .where(Notification.user_id == user.id, Notification.dismissed == False)
            .values(dismissed=True)
        )
        await db.commit()
        await websocket_manager.broadcast_user(
        user_id=str(user.id),
        message=json.dumps({"type": "dismiss_all_notifications"})
        )
        logger.info(f"Dismissed all notifications for user {user.email}")
        return {"message": "All notifications dismissed"}
    except Exception as e:
        logger.error(f"Error dismissing all notifications: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))