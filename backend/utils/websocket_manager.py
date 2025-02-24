'''
Handles multiple clients efficiently.
Supports real-time data streaming.
Logs new connections and disconnections.
Catches errors when broadcasting messages.
WebSockets require authentication using JWT tokens.
Ensures only logged-in users receive stress predictions.
'''
import logging
from fastapi import WebSocket, WebSocketDisconnect, Depends, HTTPException
from jose import jwt, JWTError
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import User
from database.db import get_db
from config import SECRET_KEY, ALGORITHM
from typing import Dict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("websocket_manager")

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, token: str, db: AsyncSession):
        """
        Authenticate users via JWT and add them to active WebSocket connections.
        """
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email = payload.get("sub")
            if not email:
                raise HTTPException(status_code=401, detail="Invalid token")

            result = await db.execute(select(User).where(User.email == email))
            user = result.scalar()

            if not user:
                raise HTTPException(status_code=401, detail="User not found")

            # Accept WebSocket connection and store it
            await websocket.accept()
            self.active_connections[email] = websocket
            logger.info(f"User {email} connected. Active connections: {len(self.active_connections)}")

        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
        except Exception as e:
            logger.error(f"Error authenticating WebSocket connection: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    def disconnect(self, websocket: WebSocket):
        """
        Remove disconnected WebSocket clients.
        """
        email_to_remove = None
        for email, conn in self.active_connections.items():
            if conn == websocket:
                email_to_remove = email
                break

        if email_to_remove:
            del self.active_connections[email_to_remove]
            logger.info(f"User {email_to_remove} disconnected. Active connections: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        """
        Send a message to all active WebSocket clients.
        """
        disconnected_clients = []
        for email, connection in self.active_connections.items():
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error sending message to {email}: {e}")
                disconnected_clients.append(email)

        # Remove disconnected clients
        for email in disconnected_clients:
            del self.active_connections[email]
            logger.info(f"User {email} removed due to connection error. Active connections: {len(self.active_connections)}")


# Create a global WebSocket manager instance
websocket_manager = WebSocketManager()
