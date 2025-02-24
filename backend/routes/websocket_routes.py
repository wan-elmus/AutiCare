'''
Clients connect to /ws/predictions and stay connected.
Keeps the WebSocket connection open indefinitely.
Extracts JWT token from WebSocket query parameters.
Decodes the token to verify user identity.
'''
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from utils.websocket_manager import websocket_manager
from utils.auth import get_current_user

router = APIRouter()

@router.websocket("/ws/predictions")
async def websocket_endpoint(websocket: WebSocket, user: dict = Depends(get_current_user)):
    """Websocket endpoint secured with JWT authentication."""
    if not user:
        raise HTTPException(status_code=403, detail="Unauthorized")
    await websocket_manager.connect(websocket)
    try:
        while True:
            # Keep the connection open (ping-pong messages can be handled here)
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)


