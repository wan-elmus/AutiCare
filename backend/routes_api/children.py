"""
Manages child-related operations, including CRUD for child profiles.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import get_db
from database.models import Child, Caregiver, Dosage, ChildOut, ChildCreate, ChildUpdate
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
    logger.info(f"Deleting child id: {id} for email: {email}")
    try:
        # Verify caregiver
        result = await db.execute(select(Caregiver).filter(Caregiver.email == email))
        caregiver = result.scalars().first()
        if not caregiver:
            logger.warning(f"Caregiver not found for email: {email}")
            raise HTTPException(status_code=404, detail="Caregiver not found")

        result = await db.execute(select(Child).filter(Child.id == id, Child.caregiver_id == caregiver.id))
        child = result.scalars().first()
        if not child:
            logger.warning(f"Child not found for id: {id} under caregiver: {email}")
            raise HTTPException(status_code=404, detail="Child not found")

        await db.execute(
            Dosage.__table__.delete().where(Dosage.child_id == id)
        )

        # Delete child
        await db.delete(child)
        await db.commit()
        logger.info(f"Child deleted: id {id}, email: {email}")
        return {"message": "Child deleted"}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting child id {id} for email {email}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")