"""
Manages caregiver-related operations, including retrieving and updating caregiver profiles.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import get_db
from database.models import Caregiver, CaregiverOut, CaregiverUpdate
from utils.auth import get_current_user
import logging

router = APIRouter(prefix="/caregivers", tags=["caregivers"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("caregivers")

@router.get("/me", response_model=CaregiverOut)
async def get_caregiver(request: Request, db: AsyncSession = Depends(get_db)):
    token = request.cookies.get("token")
    current_user = await get_current_user(token=token, db=db)
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    result = await db.execute(select(Caregiver).filter(Caregiver.user_id == current_user.id))
    caregiver = result.scalars().first()
    if not caregiver:
        raise HTTPException(status_code=404, detail="Caregiver not found")
    return caregiver

@router.put("/me", response_model=CaregiverOut)
async def update_caregiver(
    caregiver_update: CaregiverUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    token = request.cookies.get("token")
    current_user = await get_current_user(token=token, db=db)
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    result = await db.execute(select(Caregiver).filter(Caregiver.user_id == current_user.id))
    caregiver = result.scalars().first()
    if not caregiver:
        raise HTTPException(status_code=404, detail="Caregiver not found")

    for key, value in caregiver_update.dict(exclude_unset=True).items():
        setattr(caregiver, key, value)
    await db.commit()
    await db.refresh(caregiver)
    return caregiver