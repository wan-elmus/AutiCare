'''
Stores sensor data & stress predictions
Uses SQLAlchemy ORM
Uses PostgreSQL as a fully indexed user table.
Stores passwords securely (hashed).
'''

from sqlalchemy import Column, Integer, String, Float, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.ext.declarative import declarative_base
from passlib.context import CryptContext

Base = declarative_base()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    predictions = relationship("Prediction", back_populates="user")

class SensorData(Base):
    __tablename__ = "sensor_data"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=func.now(), nullable=False)
    gsr = Column(Float, nullable=False)
    heart_rate = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    processed_data = relationship("ProcessedData", back_populates="sensor_data", uselist=False)

class ProcessedData(Base):
    __tablename__ = "processed_data"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=func.now(), nullable=False)
    gsr_max = Column(Float, nullable=False)
    gsr_min = Column(Float, nullable=False)
    gsr_mean = Column(Float, nullable=False)
    gsr_sd = Column(Float, nullable=False)
    hrate_mean = Column(Float, nullable=False)
    temp_avg = Column(Float, nullable=False)
    sensor_data_id = Column(Integer, ForeignKey("sensor_data.id"), nullable=False)

    sensor_data = relationship("SensorData", back_populates="processed_data")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=func.now(), nullable=False)
    stress_level = Column(Integer, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    user = relationship("User", back_populates="predictions")