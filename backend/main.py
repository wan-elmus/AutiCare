'''
Registers API routes
Starts the scheduled task
'''
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from database.db import get_db
from routes import auth, history, predict, sensors, users, websocket_routes
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from tasks import process_all_users
from utils.websocket_manager import websocket_manager

app = FastAPI()

# Register API routes
app.include_router(auth.router)
app.include_router(history.router)
app.include_router(predict.router)
app.include_router(sensors.router)
app.include_router(users.router)
app.include_router(websocket_routes.router)

# WebSocket route
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")
    async with get_db() as db:
        try:
            await websocket_manager.connect(websocket, token, db)
            while True:
                data = await websocket.receive_text()
                # Handle incoming messages if needed
        except WebSocketDisconnect:
            await websocket_manager.disconnect(websocket)

# Initialize scheduler
scheduler = AsyncIOScheduler()
scheduler.add_job(process_all_users, "interval", minutes=5, max_instances=1)  # Prevent overlapping runs

@app.on_event("startup")
async def startup_event():
    if not scheduler.running:
        scheduler.start()

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
    await websocket_manager.disconnect_all()