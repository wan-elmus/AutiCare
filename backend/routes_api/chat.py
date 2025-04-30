from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime, timedelta
import os
import logging
from google.generativeai import configure, GenerativeModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database.db import get_db
from database.models import User, Child, SensorData, Prediction, Dosage
from typing import List, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chat"])

configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = GenerativeModel("gemini-1.5-flash")

# Pydantic models
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    timestamp: str

class Insight(BaseModel):
    text: str
    timestamp: str

class InsightsResponse(BaseModel):
    insights: List[Insight]

def format_medication(d):
    """Helper function to properly format medication information"""
    return f"{d['medication']} ({d['frequency']})"

async def get_user_by_email(email: str, db: AsyncSession) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if not user:
        logger.warning(f"User not found for email: {email}")
    return user

async def get_child_data(email: str, db: AsyncSession) -> List[dict]:
    user = await get_user_by_email(email, db)
    if not user:
        return []
    result = await db.execute(select(Child).where(Child.caregiver_id == user.id))
    children = result.scalars().all()
    return [
        {
            "id": child.id,
            "name": child.name,
            "age": child.age,
            "conditions": child.conditions,
            "behavioral_notes": child.behavioral_notes
        }
        for child in children
    ]

async def get_recent_sensor_data(email: str, db: AsyncSession) -> List[dict]:
    user = await get_user_by_email(email, db)
    if not user:
        return []
    twelve_hours_ago = datetime.utcnow() - timedelta(hours=0.17)
    result = await db.execute(
        select(SensorData)
        .where(SensorData.user_id == user.id, SensorData.timestamp >= twelve_hours_ago)
        .order_by(SensorData.timestamp.desc())
        .limit(10)
    )
    sensor_data = result.scalars().all()
    return [
        {
            "gsr": data.gsr,
            "heart_rate": data.heart_rate,
            "temperature": data.temperature,
            "timestamp": data.timestamp.isoformat()
        }
        for data in sensor_data
    ]

async def get_recent_predictions(email: str, db: AsyncSession) -> List[dict]:
    user = await get_user_by_email(email, db)
    if not user:
        return []
    twelve_hours_ago = datetime.utcnow() - timedelta(hours=12)
    result = await db.execute(
        select(Prediction)
        .where(Prediction.user_id == user.id, Prediction.timestamp >= twelve_hours_ago)
        .order_by(Prediction.timestamp.desc())
        .limit(5)
    )
    predictions = result.scalars().all()
    return [{"stress_level": pred.stress_level, "timestamp": pred.timestamp.isoformat()} for pred in predictions]

async def get_dosages(email: str, db: AsyncSession) -> List[dict]:
    user = await get_user_by_email(email, db)
    if not user:
        return []
    result = await db.execute(select(Child).where(Child.caregiver_id == user.id))
    children = result.scalars().all()
    child_ids = [child.id for child in children]
    if not child_ids:
        return []
    result = await db.execute(select(Dosage).where(Dosage.child_id.in_(child_ids)))
    dosages = result.scalars().all()
    return [
        {
            "child_id": dose.child_id,
            "medication": dose.medication,
            "frequency": dose.frequency,
            "condition": dose.condition
        }
        for dose in dosages
    ]

# Chat endpoint
@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, email: str, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_email(email, db)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Fetch context data
    children = await get_child_data(email, db)
    sensor_data = await get_recent_sensor_data(email, db)
    predictions = await get_recent_predictions(email, db)
    dosages = await get_dosages(email, db)

    # context per child
    context = []
    for child in children:
        child_context = [
            f"Child: {child['name']}, Age: {child['age']}, Conditions: {child['conditions'] or 'None'}, "
            f"Behavioral Notes: {child['behavioral_notes'] or 'None'}"
        ]
        child_sensor_data = [d for d in sensor_data]  
        if child_sensor_data:
            latest_sensor = child_sensor_data[0]
            child_context.append(
                f"Latest Sensor Data (last 12h): GSR: {latest_sensor['gsr']}, Heart Rate: {latest_sensor['heart_rate']} bpm, "
                f"Temperature: {latest_sensor['temperature']}°C"
            )
        child_predictions = [p for p in predictions]  
        if child_predictions:
            latest_pred = child_predictions[0]
            child_context.append(f"Latest Stress Level (last 12h): {latest_pred['stress_level']}")
        child_dosages = [d for d in dosages if d['child_id'] == child['id']]
        if child_dosages:
            child_context.append(
                f"Medications: {', '.join(format_medication(d) for d in child_dosages)}"
            )
        context.append("; ".join(child_context))

    prompt = (
        "You are AutiCare's AI assistant, an expert in autism spectrum disorder (ASD) care, drawing from CDC guidelines, "
        "Autism Speaks, National Autism Association, and 2025 research. AutiCare is a real-time monitoring platform for "
        "caregivers of children with autism, using wearable sensors (GSR, heart rate, temperature) to track stress, provide "
        "personalized insights, manage medications, and offer AI-driven guidance. It empowers caregivers to anticipate meltdowns, "
        "reduce stress, and share data with professionals via dashboards and profiles.\n\n"
        "ASD symptoms include:\n"
        "- Social communication: Limited eye contact, difficulty with social cues, challenges in sharing emotions.\n"
        "- Repetitive behaviors: Hand-flapping, rocking, insistence on sameness, intense interests.\n"
        "- Sensory sensitivities: Over/under-reaction to sounds, lights, textures.\n"
        "- Other: Delayed speech, echolalia, co-occurring conditions (e.g., anxiety, ADHD, epilepsy).\n\n"
        "Care strategies include:\n"
        "- Behavioral: Applied Behavior Analysis (ABA), speech therapy, social skills training.\n"
        "- Sensory: Sensory-friendly spaces, weighted blankets, fidget toys, sensory breaks.\n"
        "- Routine: Consistent schedules, visual aids (e.g., picture schedules).\n"
        "- Support: Parental education, IEPs/504 Plans for school accommodations.\n\n"
        "Emergency remedies include:\n"
        "- Meltdowns: Stay calm, reduce stimuli (e.g., quiet area), use calming tools (e.g., weighted blanket).\n"
        "- Sensory overload: Remove triggers, offer earplugs or sunglasses, use distraction (e.g., music).\n"
        "- Wandering: Use GPS trackers, secure exits, inform neighbors.\n"
        "- Seizures: Administer rescue medication if prescribed, call emergency services if >5 minutes.\n\n"
        "For novel queries, search the web for 2025 autism research, guidelines, or therapies (e.g., PubMed, CDC). "
        "Use this context:\n"
        f"{'; '.join(context) or 'No specific child data available.'}\n\n"
        "Answer the following question or provide guidance:\n"
        f"{request.message}\n\n"
        "If asked about AutiCare, explain its features (e.g., stress tracking, medication management, chatbot), benefits "
        "(e.g., meltdown prevention, professional collaboration), and usage (e.g., check dashboards in the app, update profiles). "
        "Avoid medical diagnoses or medication advice; suggest consulting professionals when appropriate. "
        "Be concise, empathetic, and informative, tailoring responses to the child's data."
    )

    try:
        response = await gemini_model.generate_content_async(prompt)
        logger.info(f"Chat response generated for user {email}: {response.text[:100]}...")
        return ChatResponse(
            response=response.text,
            timestamp=datetime.utcnow().isoformat()
        )
    except Exception as e:
        logger.error(f"Error generating chat response for {email}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")

# Insights endpoint
@router.get("/insights", response_model=InsightsResponse)
async def get_insights(email: str, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_email(email, db)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Fetch context data
    children = await get_child_data(email, db)
    sensor_data = await get_recent_sensor_data(email, db)
    predictions = await get_recent_predictions(email, db)

    if not (children and (sensor_data or predictions)):
        logger.info(f"No insights generated for {email}: Insufficient data")
        return InsightsResponse(insights=[])


    insights = []
    for child in children:
        context = [f"Child: {child['name']}, Age: {child['age']}, Conditions: {child['conditions'] or 'None'}"]
        child_sensor_data = [d for d in sensor_data]  
        if child_sensor_data:
            hr_mean = sum(d['heart_rate'] for d in child_sensor_data) / len(child_sensor_data)
            gsr_mean = sum(d['gsr'] for d in child_sensor_data) / len(child_sensor_data)
            context.append(f"12h Avg Heart Rate: {hr_mean:.1f} bpm, Avg GSR: {gsr_mean:.2f}")
        child_predictions = [p for p in predictions]  
        if child_predictions:
            stress_levels = [p['stress_level'] for p in child_predictions]
            latest_stress = child_predictions[0]['stress_level']
            context.append(f"Latest Stress Level (last 12h): {latest_stress}")

        prompt = (
            "You are AutiCare's AI assistant, specializing in autism care. AutiCare uses wearable sensors to monitor stress "
            "(via GSR, heart rate, temperature) and predict stress levels for children with autism, providing tailored insights. "
            "Analyze this child's data from the last 12 hours:\n"
            f"{'; '.join(context)}\n"
            "Insights are derived from sensor data and stress predictions, identifying patterns like high stress or sensory overload. "
            "Provide one concise, actionable insight for stress management or care, tailored to the child's data. Examples include "
            "suggesting calming activities (e.g., sensory breaks, deep breathing) or routine adjustments. Avoid medical advice; "
            "suggest general strategies or professional consultation."
        )

        try:
            response = await gemini_model.generate_content_async(prompt)
            insights.append(
                Insight(
                    text=response.text,
                    timestamp=datetime.utcnow().isoformat()
                )
            )
            logger.info(f"Insight generated for {child['name']}: {response.text}")
        except Exception as e:
            logger.error(f"Error generating insight for {child['name']}: {str(e)}")

    return InsightsResponse(insights=insights)