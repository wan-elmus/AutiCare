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

router = APIRouter(prefix="/dosages", tags=["dosages"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dosages")

@router.get("/", response_model=List[DosageOut])
async def get_dosages(email: str, db: AsyncSession = Depends(get_db)):
    logger.info(f"Fetching dosages for email: {email}")
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
    logger.info(f"Fetched {len(dosages)} dosages for email: {email}")
    return dosages

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

        # Create dosage
        db_dosage = Dosage(**dosage.dict())
        db.add(db_dosage)
        await db.commit()
        await db.refresh(db_dosage)
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

        for key, value in dosage_update.dict(exclude_unset=True).items():
            setattr(dosage, key, value)
        await db.commit()
        await db.refresh(dosage)
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