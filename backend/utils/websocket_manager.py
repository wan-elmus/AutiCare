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
from typing import Dict

# logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("websocket_manager")

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_map: Dict[str, str] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        """Register WebSocket connection with user_id"""
        try:
            if user_id in self.active_connections:
                logger.warning(f"Duplicate connection for user_id {user_id}")
                if websocket.client_state == WebSocketState.CONNECTED:
                    await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Duplicate connection")
                return False

            self.active_connections[user_id] = websocket
            self.user_map[user_id] = user_id
            logger.info(f"User_id {user_id} connected. Active: {len(self.active_connections)}")
            return True

        except Exception as e:
            logger.error(f"Connection error: {str(e)}")
            if websocket.client_state == WebSocketState.CONNECTED:
                await websocket.close(code=status.WS_1011_INTERNAL_ERROR, reason="Internal error")
            return False

    async def disconnect(self, user_id: str):
        """Cleanup disconnected clients"""
        websocket = self.active_connections.pop(user_id, None)
        if websocket and websocket.client_state == WebSocketState.CONNECTED:
            try:
                await websocket.close(code=status.WS_1000_NORMAL_CLOSURE)
                logger.info(f"Closed WebSocket for user_id {user_id}")
            except Exception as e:
                logger.warning(f"Error closing connection for user_id {user_id}: {str(e)}")

        if user_id in self.user_map:
            del self.user_map[user_id]
        
        logger.info(f"User_id {user_id} disconnected. Active: {len(self.active_connections)}")

    async def broadcast_user(self, user_id: str, message: str):
        """Send message to specific user"""
        websocket = self.active_connections.get(user_id)
        if not websocket:
            logger.warning(f"User_id {user_id} is not connected. Skipping message.")
            return
        
        try:
            if websocket.client_state == WebSocketState.CONNECTED:
                await websocket.send_text(message)
                logger.info(f"Sent message to user_id {user_id}: {message}")
        except WebSocketDisconnect:
            logger.info(f"User_id {user_id} disconnected during message send")
            await self.disconnect(user_id)
        except Exception as e:
            logger.error(f"Failed to send message to user_id {user_id}: {str(e)}")
            await self.disconnect(user_id)
            
    async def ping_connections(self, interval: int = 30):
        """Periodically ping connected clients"""
        while True:
            await asyncio.sleep(interval)
            for user_id, websocket in list(self.active_connections.items()):
                try:
                    if websocket.client_state != WebSocketState.CONNECTED:
                        await self.disconnect(user_id)
                        continue
                    await websocket.send_text("ping")
                except Exception as e:
                    logger.warning(f"Error pinging user_id {user_id}: {str(e)}")
                    await self.disconnect(user_id)

    async def broadcast(self, message: str):
        """Broadcast to all connected users"""
        disconnected = []
        for user_id, ws in self.active_connections.items():
            try:
                if ws.client_state == WebSocketState.CONNECTED:
                    await ws.send_text(message)
            except WebSocketDisconnect:
                logger.info(f"User_id {user_id} disconnected during broadcast")
                disconnected.append(user_id)
            except Exception as e:
                logger.error(f"Broadcast error to user_id {user_id}: {str(e)}")
                disconnected.append(user_id)

        for user_id in disconnected:
            await self.disconnect(user_id)

# Singleton instance
websocket_manager = WebSocketManager()