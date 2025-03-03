'''
Clients connect to /ws/predictions and stay connected.
Keeps the WebSocket connection open indefinitely.
Extracts JWT token from WebSocket query parameters.
Decodes the token to verify user identity.
'''
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from utils.websocket_manager import websocket_manager
from sqlalchemy.ext.asyncio import AsyncSession
from utils.auth import get_current_user
from database.db import get_db
from database.models import User
import logging
import asyncio

router = APIRouter()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("websocket_routes")

@router.websocket("/ws/predictions")
async def websocket_endpoint(
        websocket: WebSocket,
        user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ):
        """WebSocket endpoint secured with JWT authentication via cookies."""
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            logger.info("Authentication failed: No valid user")
            return
        connected = await websocket_manager.connect(websocket, db, user)
        if not connected:
            logger.info(f"Connection rejected for {user.email}")
            return
        try:
            while True:
                try: 
                    data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                    logger.info(f"Received from {user.email}: {data}")
                    await websocket.send_text(f"Echo: {data}")  # Echo for testing
                except asyncio.TimeoutError:
                    await websocket.send_text("Ping")
                    logger.debug(f"Sent ping to {user.email}")   
        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected for user: {user.email}")
        finally:
            await websocket_manager.disconnect(user.email)