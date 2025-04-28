"""
Manages dosage-related operations, including CRUD for medication dosages.
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

router = APIRouter(prefix="/dosages", tags=["dosages"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dosages")

TIARA_API_KEY = os.getenv("TIARA_API_KEY")
TIARA_SENDER_ID = os.getenv("TIARA_SENDER_ID", "AUTICARE")
TIARA_SMS_ENDPOINT = os.getenv("TIARA_SMS_ENDPOINT", "https://api.tiaraconnect.io/api/messaging/sendsms")

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

@router.get("/", response_model=List[DosageOut])
async def get_dosages(email: str, db: AsyncSession = Depends(get_db)):
    logger.info(f"Fetching dosages for email: {email}")
    try:
        result = await db.execute(select(Caregiver).filter(Caregiver.email == email))
        caregiver = result.scalars().first()
        if not caregiver:
            logger.warning(f"Caregiver not found for email: {email}")
            raise HTTPException(status_code=404, detail="Caregiver not found")

        result = await db.execute(select(Child).filter(Child.caregiver_id == caregiver.id))
        children = result.scalars().all()
        child_ids = [child.id for child in children]

        result = await db.execute(select(Dosage).filter(Dosage.child_id.in_(child_ids)))
        dosages = result.scalars().all()

        # Deserialize intervals from JSON string to list
        for dosage in dosages:
            try:
                dosage.intervals = json.loads(dosage.intervals) if dosage.intervals else ["00:00"]
            except json.JSONDecodeError as e:
                logger.warning(f"Invalid JSON in intervals for dosage id {dosage.id}: {dosage.intervals}")
                dosage.intervals = ["00:00"]

        logger.info(f"Fetched {len(dosages)} dosages for email: {email}")
        return dosages
    except Exception as e:
        logger.error(f"Error fetching dosages for email {email}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/", response_model=DosageOut, status_code=201)
async def create_dosage(
    dosage: DosageCreate,
    email: str,
    db: AsyncSession = Depends(get_db)
):
    logger.info(f"Creating dosage for email: {email}, payload: {dosage.dict()}")
    try:
        # Verify caregiver
        result = await db.execute(select(Caregiver).filter(Caregiver.email == email))
        caregiver = result.scalars().first()
        if not caregiver:
            logger.warning(f"Caregiver not found for email: {email}")
            raise HTTPException(status_code=404, detail="Caregiver not found")

        # Verify child belongs to caregiver
        result = await db.execute(select(Child).filter(Child.id == dosage.child_id, Child.caregiver_id == caregiver.id))
        child = result.scalars().first()
        if not child:
            logger.warning(f"Child not found for id: {dosage.child_id} under caregiver: {email}")
            raise HTTPException(status_code=404, detail="Child not found or does not belong to this caregiver")

        # Serialize intervals to JSON string
        dosage_data = dosage.dict()
        dosage_data['intervals'] = json.dumps(dosage_data['intervals'] or ["00:00"])

        # Create dosage
        db_dosage = Dosage(**dosage_data)
        db.add(db_dosage)
        await db.commit()
        await db.refresh(db_dosage)

        # Deserialize intervals for response
        try:
            db_dosage.intervals = json.loads(db_dosage.intervals) if db_dosage.intervals else ["00:00"]
        except json.JSONDecodeError as e:
            logger.warning(f"Invalid JSON in intervals for new dosage id {db_dosage.id}: {db_dosage.intervals}")
            db_dosage.intervals = ["00:00"]

        # Send SMS notification
        if caregiver.phone:
            message = (
                f"New dosage for {child.name}: {db_dosage.medication}, {db_dosage.dosage}, "
                f"{db_dosage.frequency} at {db_dosage.intervals[0]}. Notes: {db_dosage.notes or 'None'}"
            )
            sms_response = await send_sms(
                phone=caregiver.phone,
                message=message[:160],  # SMS limit
                ref_id=f"dosage-{db_dosage.id}"
            )
            if sms_response.get("status") != "SUCCESS":
                logger.warning(f"SMS notification failed for dosage id {db_dosage.id}: {sms_response.get('desc')}")
        else:
            logger.warning(f"No phone number for caregiver {email}, skipping SMS")

        logger.info(f"Dosage created for child_id: {dosage.child_id}, email: {email}")
        return db_dosage
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Integrity error creating dosage for email {email}: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid data: possible duplicate or invalid child_id")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating dosage for email {email}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.put("/{id}", response_model=DosageOut)
async def update_dosage(
    id: int,
    dosage_update: DosageUpdate,
    email: str,
    db: AsyncSession = Depends(get_db)
):
    logger.info(f"Updating dosage id: {id} for email: {email}, payload: {dosage_update.dict()}")
    try:
        result = await db.execute(select(Caregiver).filter(Caregiver.email == email))
        caregiver = result.scalars().first()
        if not caregiver:
            logger.warning(f"Caregiver not found for email: {email}")
            raise HTTPException(status_code=404, detail="Caregiver not found")

        result = await db.execute(select(Child).filter(Child.caregiver_id == caregiver.id))
        child_ids = [child.id for child in result.scalars().all()]

        result = await db.execute(select(Dosage).filter(Dosage.id == id, Dosage.child_id.in_(child_ids)))
        dosage = result.scalars().first()
        if not dosage:
            logger.warning(f"Dosage not found for id: {id} under child_ids: {child_ids}")
            raise HTTPException(status_code=404, detail="Dosage not found")

        # Get child name for SMS
        result = await db.execute(select(Child).filter(Child.id == dosage.child_id))
        child = result.scalars().first()

        # Serialize intervals to JSON string
        update_data = dosage_update.dict(exclude_unset=True)
        if 'intervals' in update_data:
            update_data['intervals'] = json.dumps(update_data['intervals'] or ["00:00"])

        for key, value in update_data.items():
            setattr(dosage, key, value)
        await db.commit()
        await db.refresh(dosage)

        # Deserialize intervals for response
        try:
            dosage.intervals = json.loads(dosage.intervals) if dosage.intervals else ["00:00"]
        except json.JSONDecodeError as e:
            logger.warning(f"Invalid JSON in intervals for dosage id {dosage.id}: {dosage.intervals}")
            dosage.intervals = ["00:00"]

        # Send SMS notification
        if caregiver.phone:
            message = (
                f"Updated dosage for {child.name}: {dosage.medication}, {dosage.dosage}, "
                f"{dosage.frequency} at {dosage.intervals[0]}. Notes: {dosage.notes or 'None'}"
            )
            sms_response = await send_sms(
                phone=caregiver.phone,
                message=message[:160],  # SMS limit
                ref_id=f"dosage-{dosage.id}"
            )
            if sms_response.get("status") != "SUCCESS":
                logger.warning(f"SMS notification failed for dosage id {dosage.id}: {sms_response.get('desc')}")
        else:
            logger.warning(f"No phone number for caregiver {email}, skipping SMS")

        logger.info(f"Dosage updated: id {id}, email: {email}")
        return dosage
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating dosage id {id} for email {email}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.delete("/{id}")
async def delete_dosage(
    id: int,
    email: str,
    db: AsyncSession = Depends(get_db)
):
    logger.info(f"Deleting dosage id: {id} for email: {email}")
    try:
        result = await db.execute(select(Caregiver).filter(Caregiver.email == email))
        caregiver = result.scalars().first()
        if not caregiver:
            logger.warning(f"Caregiver not found for email: {email}")
            raise HTTPException(status_code=404, detail="Caregiver not found")

        result = await db.execute(select(Child).filter(Child.caregiver_id == caregiver.id))
        child_ids = [child.id for child in result.scalars().all()]

        result = await db.execute(select(Dosage).filter(Dosage.id == id, Dosage.child_id.in_(child_ids)))
        dosage = result.scalars().first()
        if not dosage:
            logger.warning(f"Dosage not found for id: {id} under child_ids: {child_ids}")
            raise HTTPException(status_code=404, detail="Dosage not found")

        await db.delete(dosage)
        await db.commit()
        logger.info(f"Dosage deleted: id {id}, email: {email}")
        return {"message": "Dosage deleted"}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting dosage id {id} for email {email}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")