"""
Manages dosage-related operations, including CRUD for medication dosages.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import get_db
from database.models import Dosage, Child, Caregiver, DosageOut, DosageCreate, DosageUpdate
from typing import List
import logging

router = APIRouter(prefix="/dosages", tags=["dosages"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dosages")

@router.get("/", response_model=List[DosageOut])
async def get_dosages(email: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Caregiver).filter(Caregiver.email == email))
    caregiver = result.scalars().first()
    if not caregiver:
        raise HTTPException(status_code=404, detail="Caregiver not found")

    result = await db.execute(select(Child).filter(Child.caregiver_id == caregiver.id))
    children = result.scalars().all()
    child_ids = [child.id for child in children]

    result = await db.execute(select(Dosage).filter(Dosage.child_id.in_(child_ids)))
    dosages = result.scalars().all()
    return dosages

@router.post("/", response_model=DosageOut)
async def create_dosage(
    dosage: DosageCreate,
    email: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Caregiver).filter(Caregiver.email == email))
    caregiver = result.scalars().first()
    if not caregiver:
        raise HTTPException(status_code=404, detail="Caregiver not found")

    result = await db.execute(select(Child).filter(Child.id == dosage.child_id, Child.caregiver_id == caregiver.id))
    child = result.scalars().first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    db_dosage = Dosage(**dosage.dict())
    db.add(db_dosage)
    await db.commit()
    await db.refresh(db_dosage)
    return db_dosage

@router.put("/{id}", response_model=DosageOut)
async def update_dosage(
    id: int,
    dosage_update: DosageUpdate,
    email: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Caregiver).filter(Caregiver.email == email))
    caregiver = result.scalars().first()
    if not caregiver:
        raise HTTPException(status_code=404, detail="Caregiver not found")

    result = await db.execute(select(Child).filter(Child.caregiver_id == caregiver.id))
    child_ids = [child.id for child in result.scalars().all()]

    result = await db.execute(select(Dosage).filter(Dosage.id == id, Dosage.child_id.in_(child_ids)))
    dosage = result.scalars().first()
    if not dosage:
        raise HTTPException(status_code=404, detail="Dosage not found")

    for key, value in dosage_update.dict(exclude_unset=True).items():
        setattr(dosage, key, value)
    await db.commit()
    await db.refresh(dosage)
    return dosage

@router.delete("/{id}")
async def delete_dosage(
    id: int,
    email: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Caregiver).filter(Caregiver.email == email))
    caregiver = result.scalars().first()
    if not caregiver:
        raise HTTPException(status_code=404, detail="Caregiver not found")

    result = await db.execute(select(Child).filter(Child.caregiver_id == caregiver.id))
    child_ids = [child.id for child in result.scalars().all()]

    result = await db.execute(select(Dosage).filter(Dosage.id == id, Dosage.child_id.in_(child_ids)))
    dosage = result.scalars().first()
    if not dosage:
        raise HTTPException(status_code=404, detail="Dosage not found")

    await db.delete(dosage)
    await db.commit()
    return {"message": "Dosage deleted"}