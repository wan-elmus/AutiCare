'''
Registers API routes
Starts the scheduled task
'''
from fastapi import FastAPI
from routes import sensors, websocket_routes
from tasks import scheduler

app = FastAPI()

app.include_router(sensors.router)
app.include_router(websocket_routes.router)

@app.on_event("startup")
async def startup_event():
    if not scheduler.running:
        scheduler.start()

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
