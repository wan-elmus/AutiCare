'''
Registers API routes
Starts the scheduled task
'''
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routes import auth, history, predict, sensors, users, notifications
from tasks import scheduler_startup
from utils.websocket_manager import websocket_manager
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

# API routes
app.include_router(auth.router)
app.include_router(history.router)
app.include_router(predict.router)
app.include_router(sensors.router)
app.include_router(users.router)
# app.include_router(websocket_routes.router)
app.include_router(notifications.router)

# Middleware to log requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url} Cookies: {request.cookies}")
    response = await call_next(request)
    return response

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse("static/favicon.ico")


scheduler = scheduler_startup()

@app.on_event("startup")
async def startup_event():
    if not scheduler.running:
        scheduler.start()
    asyncio.create_task(websocket_manager.ping_connections())

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
    for user_id in list(websocket_manager.active_connections.keys()):
        await websocket_manager.disconnect(user_id)