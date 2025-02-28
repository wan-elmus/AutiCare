from fastapi import Depends, WebSocket, HTTPException
from jose import jwt, JWTError
from config import SECRET_KEY, ALGORITHM

async def get_current_user(websocket: WebSocket):
    """Extract user from JWT token in WebSocket headers."""
    token = websocket.query_params.get("token")
    if not token:
        raise HTTPException(status_code=403, detail="Missing token")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"user_id": payload.get("sub")}
    except JWTError:
        raise HTTPException(status_code=403, detail="Invalid token")
    
    