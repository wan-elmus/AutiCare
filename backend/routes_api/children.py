"""
Manages child-related operations, including CRUD for child profiles.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import get_db
from database.models import Child, Caregiver, ChildOut, ChildCreate, ChildUpdate
from typing import List
import logging

router = APIRouter(prefix="/children", tags=["children"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("children")

@router.get("/", response_model=List[ChildOut])
async def get_children(email: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Caregiver).filter(Caregiver.email == email))
    caregiver = result.scalars().first()
    if not caregiver:
        raise HTTPException(status_code=404, detail="Caregiver not found")

    result = await db.execute(select(Child).filter(Child.caregiver_id == caregiver.id))
    children = result.scalars().all()
    return children

@router.post("/", response_model=ChildOut)
async def create_child(
    child: ChildCreate,
    email: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Caregiver).filter(Caregiver.email == email))
    caregiver = result.scalars().first()
    if not caregiver:
        raise HTTPException(status_code=404, detail="Caregiver not found")

    db_child = Child(**child.dict(), caregiver_id=caregiver.id)
    db.add(db_child)
    await db.commit()
    await db.refresh(db_child)
    return db_child

@router.put("/{id}", response_model=ChildOut)
async def update_child(
    id: int,
    child_update: ChildUpdate,
    email: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Caregiver).filter(Caregiver.email == email))
    caregiver = result.scalars().first()
    if not caregiver:
        raise HTTPException(status_code=404, detail="Caregiver not found")

    result = await db.execute(select(Child).filter(Child.id == id, Child.caregiver_id == caregiver.id))
    child = result.scalars().first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    for key, value in child_update.dict(exclude_unset=True).items():
        setattr(child, key, value)
    await db.commit()
    await db.refresh(child)
    return child

@router.delete("/{id}")
async def delete_child(
    id: int,
    email: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Caregiver).filter(Caregiver.email == email))
    caregiver = result.scalars().first()
    if not caregiver:
        raise HTTPException(status_code=404, detail="Caregiver not found")

    result = await db.execute(select(Child).filter(Child.id == id, Child.caregiver_id == caregiver.id))
    child = result.scalars().first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    await db.delete(child)
    await db.commit()
    return {"message": "Child deleted"}