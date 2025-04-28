"""
Manages caregiver-related operations, including retrieving and updating caregiver profiles.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy.future import select
from database.db import get_db
from database.models import Caregiver, CaregiverOut, CaregiverCreate, CaregiverUpdate
import logging

router = APIRouter(prefix="/caregivers", tags=["caregivers"])
logger = logging.getLogger("caregivers")

@router.post("/", response_model=CaregiverOut, status_code=201)
async def create_caregiver(caregiver: CaregiverCreate, db: AsyncSession = Depends(get_db)):
    try:
        db_caregiver = Caregiver(**caregiver.dict())
        db.add(db_caregiver)
        await db.commit()
        await db.refresh(db_caregiver)
        logger.info(f"Caregiver created: {caregiver.email}")
        return db_caregiver
    except IntegrityError:
        await db.rollback()
        logger.warning(f"Caregiver already exists: {caregiver.email}")
        raise HTTPException(status_code=409, detail="Caregiver already exists")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating caregiver: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/me", response_model=CaregiverOut)
async def get_caregiver(email: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Caregiver).filter(Caregiver.email == email))
    caregiver = result.scalars().first()
    if not caregiver:
        logger.warning(f"Caregiver not found for email: {email}")
        raise HTTPException(status_code=404, detail="Caregiver not found")
    logger.info(f"Caregiver fetched for email: {email}")
    return caregiver

@router.put("/me", response_model=CaregiverOut)
async def update_caregiver(
    caregiver_update: CaregiverUpdate,
    email: str,
    db: AsyncSession = Depends(get_db)
):
    logger.info(f"Updating caregiver with email: {email}, payload: {caregiver_update.dict()}")
    try:
        result = await db.execute(select(Caregiver).filter(Caregiver.email == email))
        caregiver = result.scalars().first()
        if not caregiver:
            logger.info(f"Caregiver not found for email: {email}, creating new caregiver")
            # Fetch user to get user_id
            user_result = await db.execute(select(User).filter(User.email == email))
            user = user_result.scalars().first()
            if not user:
                logger.warning(f"User not found for email: {email}")
                raise HTTPException(status_code=404, detail="User not found")
            # Create new caregiver
            caregiver_data = caregiver_update.dict(exclude_unset=True)
            caregiver_data.update({
                "user_id": user.id,
                "email": email
            })
            db_caregiver = Caregiver(**caregiver_data)
            db.add(db_caregiver)
            await db.commit()
            await db.refresh(db_caregiver)
            logger.info(f"Caregiver created for email: {email}")
            return db_caregiver

        if caregiver_update.email != email:
            logger.warning(f"Email mismatch: {caregiver_update.email} != {email}")
            raise HTTPException(status_code=400, detail="Cannot change email")

        for key, value in caregiver_update.dict(exclude_unset=True).items():
            setattr(caregiver, key, value)
        await db.commit()
        await db.refresh(caregiver)
        logger.info(f"Caregiver updated for email: {email}")
        return caregiver
    except Exception as e:
        logger.error(f"Error updating caregiver for email {email}: {str(e)}")
        await db.rollback()
        raise