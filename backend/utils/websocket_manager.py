'''
Handles multiple clients efficiently.
Supports real-time data streaming.
Logs new connections and disconnections.
Catches errors when broadcasting messages.
WebSockets require authentication using JWT tokens.
Ensures only logged-in users receive stress predictions.
'''
import logging
import asyncio
from fastapi import WebSocket, WebSocketDisconnect, status
from starlette.websockets import WebSocketState
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import User
from utils.auth import get_current_user
from typing import Dict

# Configure logging once
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("websocket_manager")

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_map: Dict[str, str] = {}

    async def connect(
        self, websocket: WebSocket, 
        # token: str, 
        db: AsyncSession,
        user: User
        ):
        """Authenticate and register WebSocket connection"""
        try:
            if user.email in self.active_connections:
                logger.warning(f"Duplicate connection for {user.email}")
                if websocket.client_state == WebSocketState.CONNECTED:
                    await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Duplicate connection")
                return False

            # await websocket.accept()
            self.active_connections[user.email] = websocket
            self.user_map[str(user.id)] = user.email
            logger.info(f"User {user.email} connected. Active: {len(self.active_connections)}")
            return True 

        except Exception as e:
            logger.error(f"Connection error: {str(e)}")
            if websocket.client_state == WebSocketState.CONNECTED:
                await websocket.close(code=status.WS_1011_INTERNAL_ERROR, reason="Internal error")
            return False

    async def disconnect(self, email: str):
        """Cleanup disconnected clients"""
        websocket = self.active_connections.pop(email, None)
        if websocket and websocket.client_state == WebSocketState.CONNECTED:
            try:
                await websocket.close(code=status.WS_1000_NORMAL_CLOSURE)
                logger.info(f"Closed WebSocket for {email}")
            except Exception as e:
                logger.warning(f"Error closing connection for {email}: {str(e)}")

        user_id = next((uid for uid, em in self.user_map.items() if em == email), None)
        if user_id:
            del self.user_map[user_id]
        
        logger.info(f"User {email} disconnected. Active: {len(self.active_connections)}")

    async def broadcast_user(self, user_id: str, message: str):
        """Send message to specific user"""
        email = self.user_map.get(user_id)
        
        if not email:
            logger.warning(f"User ID {user_id} not found in user_map")
            return
        
        websocket = self.active_connections.get(email)
        if not websocket:
            logger.warning(f"User {email} is not connected. Skipping message.")
            return
        
        try:
            if websocket.client_state == WebSocketState.CONNECTED:
                await websocket.send_text(message)
                logger.info(f"Sent message to {email}: {message}")
        except WebSocketDisconnect:
            logger.info(f"User {email} disconnected during message send")
            await self.disconnect(email)
        except Exception as e:
            logger.error(f"Failed to send message to {email}: {str(e)}")
            await self.disconnect(email)
            
    async def ping_connections(self, interval: int = 30):
        """
        Periodically send a ping message to all connected clients.
        If a ping fails or the connection is no longer active, disconnect that client.
        """
        while True:
            await asyncio.sleep(interval)
            for email, websocket in list(self.active_connections.items()):
                try:
                    if websocket.client_state != WebSocketState.CONNECTED:
                        await self.disconnect(email)
                        continue
                    await websocket.send_text("ping")
                except Exception as e:
                    logger.warning(f"Error pinging {email}: {str(e)}")
                    await self.disconnect(email)

    async def broadcast(self, message: str):
        """Broadcast to all connected users"""
        disconnected = []
        for email, ws in self.active_connections.items():
            try:
                if ws.client_state == WebSocketState.CONNECTED:
                    await ws.send_text(message)
            except WebSocketDisconnect:
                logger.info(f"Client {email} disconnected during broadcast")
                disconnected.append(email)
            except Exception as e:
                logger.error(f"Broadcast error to {email}: {str(e)}")
                disconnected.append(email)

        for email in disconnected:
            await self.disconnect(email)

# Singleton instance
websocket_manager = WebSocketManager()
