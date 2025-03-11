'''
Stores sensor data & stress predictions
Uses SQLAlchemy ORM
Uses PostgreSQL as a fully indexed user table.
Stores passwords securely (hashed).
'''

from sqlalchemy import Column, Integer, String, Float, DateTime, func, ForeignKey, Index, Boolean
from sqlalchemy.orm import relationship
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
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    child_name = Column(String)
    child_age = Column(Integer)
    child_bio = Column(String)
    child_avatar = Column(String)

    predictions = relationship("Prediction", back_populates="user")
    sensor_data = relationship("SensorData", back_populates="user")
    processed_data = relationship("ProcessedData", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

class SensorData(Base):
    __tablename__ = "sensor_data"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=func.now(), nullable=False, index=True)
    gsr = Column(Float, nullable=False)
    heart_rate = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    user = relationship("User", back_populates="sensor_data")
    processed_data = relationship("ProcessedData", back_populates="sensor_data", uselist=False)
    
    __table_args__ = (Index('ix_sensor_data_user_timestamp', "user_id", "timestamp"),)

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
    sensor_data_id = Column(Integer, ForeignKey("sensor_data.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    sensor_data = relationship("SensorData", back_populates="processed_data")
    user = relationship("User", back_populates="processed_data")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=func.now(), nullable=False, index=True)
    stress_level = Column(Integer, nullable=False)
    inference_time = Column(Float, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    user = relationship("User", back_populates="predictions")
    notification = relationship("Notification", back_populates="prediction", uselist=False)
    
    __table_args__ = (Index('ix_predictions_user_timestamp', "user_id", "timestamp"),)
    
class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=False)
    level = Column(String, nullable=False)
    message = Column(String, nullable=False)
    recommendation = Column(String, nullable=False)
    timestamp = Column(DateTime, default=func.now(), nullable=False)
    dismissed = Column(Boolean, default=False)

    user = relationship("User", back_populates="notifications")
    prediction = relationship("Prediction", back_populates="notification")

    __table_args__ = (Index('ix_notifications_user_timestamp', "user_id", "timestamp"),)
    

    