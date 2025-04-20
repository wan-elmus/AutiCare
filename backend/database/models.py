from pydantic import BaseModel, EmailStr, Field
from datetime import date
from typing import List, Optional
from enum import Enum
from sqlalchemy import Column, Integer, String, Float, DateTime, func, ForeignKey, Index, Boolean, Date, Enum as SQLAlchemyEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import enum

Base = declarative_base()

class DosageStatus(str, Enum):
    active = "active"
    inactive = "inactive"

class CaregiverBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    relation_type: Optional[str] = None 

class CaregiverCreate(CaregiverBase):
    pass

class CaregiverUpdate(CaregiverBase):
    pass

class CaregiverOut(CaregiverBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

class ChildBase(BaseModel):
    name: str
    age: int = Field(..., gt=0)
    gender: Optional[str] = None
    conditions: Optional[str] = None
    allergies: Optional[str] = None
    milestones: Optional[str] = None
    behavioral_notes: Optional[str] = None
    emergency_contacts: Optional[str] = None
    medical_history: Optional[str] = None

class ChildCreate(ChildBase):
    pass

class ChildUpdate(ChildBase):
    pass

class ChildOut(ChildBase):
    id: int
    caregiver_id: int
    class Config:
        from_attributes = True

class DosageBase(BaseModel):
    medication: str
    condition: str
    start_date: date
    dosage: str
    frequency: str
    intervals: Optional[List[str]] = None
    status: DosageStatus = DosageStatus.active
    notes: Optional[str] = None

class DosageCreate(DosageBase):
    child_id: int

class DosageUpdate(DosageBase):
    pass

class DosageOut(DosageBase):
    id: int
    child_id: int
    class Config:
        from_attributes = True

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    child_name = Column(String(100))
    child_age = Column(Integer)
    child_bio = Column(String(500))
    child_avatar = Column(String(255))

    predictions = relationship("Prediction", back_populates="user")
    sensor_data = relationship("SensorData", back_populates="user")
    processed_data = relationship("ProcessedData", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    caregiver_profile = relationship("Caregiver", back_populates="user_profile", uselist=False)

class SensorData(Base):
    __tablename__ = "sensor_data"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), default=func.now(), nullable=False, index=True)
    gsr = Column(Float, nullable=False)
    heart_rate = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="sensor_data")
    processed_data = relationship("ProcessedData", back_populates="sensor_data", uselist=False)
    __table_args__ = (Index('sensor_data_user_timestamp_idx', "user_id", "timestamp"),)

class ProcessedData(Base):
    __tablename__ = "processed_data"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    gsr_max = Column(Float, nullable=False)
    gsr_min = Column(Float, nullable=False)
    gsr_mean = Column(Float, nullable=False)
    gsr_sd = Column(Float, nullable=False)
    hrate_mean = Column(Float, nullable=False)
    temp_avg = Column(Float, nullable=False)
    sensor_data_id = Column(Integer, ForeignKey("sensor_data.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sensor_data = relationship("SensorData", back_populates="processed_data")
    user = relationship("User", back_populates="processed_data")

class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), default=func.now(), nullable=False, index=True)
    stress_level = Column(Integer, nullable=False)
    inference_time = Column(Float, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="predictions")
    notification = relationship("Notification", back_populates="prediction", uselist=False)
    __table_args__ = (Index('predictions_user_timestamp_idx', "user_id", "timestamp"),)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=False)
    level = Column(String(50), nullable=False)
    message = Column(String(255), nullable=False)
    recommendation = Column(String(255), nullable=False)
    timestamp = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    dismissed = Column(Boolean, default=False)
    user = relationship("User", back_populates="notifications")
    prediction = relationship("Prediction", back_populates="notification")
    __table_args__ = (Index('notifications_user_timestamp_idx', "user_id", "timestamp"),)

class Caregiver(Base):
    __tablename__ = "caregivers"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(20))
    relation_type = Column(String(50)) 
    user_profile = relationship("User", back_populates="caregiver_profile")
    children = relationship("Child", back_populates="caregiver")

class Child(Base):
    __tablename__ = "children"
    id = Column(Integer, primary_key=True, index=True)
    caregiver_id = Column(Integer, ForeignKey("caregivers.id"), nullable=False)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20))
    conditions = Column(Text)
    allergies = Column(Text)
    milestones = Column(Text)
    behavioral_notes = Column(Text)
    emergency_contacts = Column(Text)
    medical_history = Column(Text)
    caregiver = relationship("Caregiver", back_populates="children")
    dosages = relationship("Dosage", back_populates="child")

class Dosage(Base):
    __tablename__ = "dosages"
    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False)
    medication = Column(String(100), nullable=False)
    condition = Column(String(100), nullable=False)
    start_date = Column(Date, nullable=False)
    dosage = Column(String(50), nullable=False)
    frequency = Column(String(50), nullable=False)
    intervals = Column(Text)
    status = Column(SQLAlchemyEnum(DosageStatus), default=DosageStatus.active, nullable=False)
    notes = Column(Text)
    child = relationship("Child", back_populates="dosages")