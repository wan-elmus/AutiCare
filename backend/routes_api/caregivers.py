"""
Manages caregiver-related operations, including retrieving and updating caregiver profiles.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import get_db
from database.models import Caregiver, CaregiverOut, CaregiverUpdate
import logging

router = APIRouter(prefix="/caregivers", tags=["caregivers"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("caregivers")

@router.get("/me", response_model=CaregiverOut)
async def get_caregiver(email: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Caregiver).filter(Caregiver.email == email))
    caregiver = result.scalars().first()
    if not caregiver:
        raise HTTPException(status_code=404, detail="Caregiver not found")
    return caregiver

@router.put("/me", response_model=CaregiverOut)
async def update_caregiver(
    caregiver_update: CaregiverUpdate,
    email: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Caregiver).filter(Caregiver.email == email))
    caregiver = result.scalars().first()
    if not caregiver:
        raise HTTPException(status_code=404, detail="Caregiver not found")

    for key, value in caregiver_update.dict(exclude_unset=True).items():
        setattr(caregiver, key, value)
    await db.commit()
    await db.refresh(caregiver)
    return caregiver