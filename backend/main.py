'''
Registers API routes
Starts the scheduled task
'''
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import get_db
from database.models import User
from routes import auth, history, predict, sensors, users, websocket_routes
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from tasks import process_all_users
from utils.websocket_manager import websocket_manager
from utils.auth import get_current_user
import logging
import asyncio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(auth.router)
app.include_router(history.router)
app.include_router(predict.router)
app.include_router(sensors.router)
app.include_router(users.router)
app.include_router(websocket_routes.router)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url} Cookies: {request.cookies}")
    response = await call_next(request)
    return response

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse("static/favicon.ico")


# WebSocket route
@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket, 
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
    ):
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION) # Policy violation
        return
    connected = await websocket_manager.connect(websocket, db, user)
    if not connected:
        return
    
    try:
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                # Example: Echo or broadcast stress predictions
                # Handle incoming messages if needed
                logger.info(f"Received from {user.email}: {data}")
                await websocket.send_text(f"Echo: {data}")
            except asyncio.TimeoutError:
            # Send ping if no message received within timeout
                await websocket.send_text("Ping")
            except WebSocketDisconnect:
                raise
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user: {user.email}")
    finally:
        # Use email for disconnection
        await websocket_manager.disconnect(user.email)

# Initialize scheduler
scheduler = AsyncIOScheduler()
scheduler.add_job(process_all_users, "interval", minutes=5, max_instances=1)  # Prevent overlapping runs

@app.on_event("startup")
async def startup_event():
    if not scheduler.running:
        scheduler.start()
    asyncio.create_task(websocket_manager.ping_connections())

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
    for email in list(websocket_manager.active_connections.keys()):
        await websocket_manager.disconnect(email)