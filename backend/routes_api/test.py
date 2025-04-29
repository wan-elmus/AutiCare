"""
Test System
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from database.db import get_db
from database.models import Dosage, Child, Caregiver, DosageOut, DosageCreate, DosageUpdate
from typing import List
import logging
import json
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/test", tags=["test"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test")

# Tiara Connect configuration
TIARA_API_KEY = os.getenv("TIARA_API_KEY")
TIARA_SENDER_ID = os.getenv("TIARA_SENDER_ID", "AUTICARE")
TIARA_SMS_ENDPOINT = os.getenv("TIARA_SMS_ENDPOINT", "https://api2.tiaraconnect.io/api/messaging/sendsms")

async def send_sms(phone: str, message: str, ref_id: str):
    """Send SMS via Tiara Connect SMS API."""
    if not TIARA_API_KEY:
        logger.error("Tiara API key not configured")
        return {"status": "failed", "desc": "API key not configured"}
    
    payload = {
        "from": TIARA_SENDER_ID,
        "to": phone,
        "message": message,
        "refId": ref_id,
        "messageType": "1"
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {TIARA_API_KEY}"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(TIARA_SMS_ENDPOINT, json=payload, headers=headers, timeout=10.0)
            response_data = response.json()
            if response.status_code == 200 and response_data.get("status") == "SUCCESS":
                logger.info(f"SMS sent to {phone}, msgId: {response_data.get('msgId')}")
                return response_data
            else:
                logger.error(f"Failed to send SMS to {phone}: {response_data}")
                return response_data
    except Exception as e:
        logger.error(f"Error sending SMS to {phone}: {str(e)}")
        return {"status": "failed", "desc": str(e)}

@router.get("/")
async def test_sms():
    logger.info(f"Sending SMS")
