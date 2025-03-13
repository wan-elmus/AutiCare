# AutiCare - Stress Monitoring System for Children with ASD

This is a real-time, web-based application designed to track and analyze physiological data for stress detection. Leveraging wearable sensor technology, the system collects metrics such as heart rate, temperature, and galvanic skin response (GSR), processes them using an ML model utilizing RF, and provides actionable insights to users.

Built with a modern tech stack, it ensures seamless data flow, secure authentication, and a responsive user interface, making it an invaluable tool for health monitoring and stress management.

This application is ideal for individuals, caregivers, or professionals seeking to monitor stress levels in real-time, with features like historical data visualization, instant notifications, and predictive analytics.

## Features

**Real-Time Data Collection:** Integrates with sensor devices to capture heart rate, temperature, and GSR data continuously.

**Stress Level Prediction:** Uses ML model to compute stress levels (0-3) based on aggregated sensor data, updated every 5 minutes.

**Historical Trends:** Visualizes past sensor data and stress predictions over selectable time ranges (e.g., *last hour, day, week*).

**Notifications:** Delivers real-time alerts with stress level insights and recommendations (e.g., *"High Stress Detected: Move to a quiet space"*).

**Secure Authentication:** Implements JWT-based authentication with token refresh for persistent, secure user sessions.

**WebSocket Integration:** Ensures live updates of sensor data and notifications without manual refreshing.

**Responsive UI:** Offers an intuitive, user-friendly interface accessible across devices.

## Architecture

**Frontend:** Built with Next.js, React, and Tailwind CSS for a dynamic, responsive client-side experience.

**Backend:** Powered by FastAPI, SQLAlchemy, and APScheduler, hosted on a Python-based server with WebSocket support.

**Database:** Utilizes an asynchronous PostgreSQL database for efficient storage and retrieval of sensor data, predictions, and user information.

**Communication:** Employs WebSockets for real-time data streaming and RESTful APIs for other interactions.

**Machine Learning:** Integrates a pre-trained RF model for stress prediction, running periodically to process aggregated data.

### Prerequisites

To set up and run the Stress Monitoring System locally, ensure you have the following installed;

### Software

    ```python
    Python 3.10+: Backend runtime.
    Node.js 18+: Frontend runtime (includes npm).
    PostgreSQL 15+: Database server.
    Git: Version control for cloning the repository.
    ```

#### Python Dependencies

Install via requirements.txt

    ```bash
    $ pip install -r requirements.txt
    ```
    ```python
        fastapi
        sqlalchemy[asyncio]
        psycopg2-binary
        uvicorn
        pyjwt
        passlib[bcrypt]
        apscheduler
        websockets
    ```

#### Node.js Dependencies

Install via package.json

    ```python
    next
    react
    react-dom
    framer-motion
    tailwindcss
    ws (WebSocket client)
    ```

### Hardware (Optional)

A Wearable Sensor Device, compatible device (e.g., ESP8266-based) to send heart rate, temperature, and GSR data via HTTP or WebSocket. Simulated data can be used for testing.

## Setup

Follow these steps to set up and run the Stress Monitoring System locally.

    1. Clone the Repository

    2. Backend Setup
        a. Configure Environment

        Create a .env file in the backend directory

        ```bash
            DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/stress_db
            SECRET_KEY=your-secret-key-here
            ALGORITHM=HS256
            ACCESS_TOKEN_EXPIRE_MINUTES=15
        ```
        Replace user, password, and stress_db with your PostgreSQL credentials and database name.
        Generate a secure SECRET_KEY (e.g., using openssl rand -hex 32).

        b. Install Dependencies

        ```bash
            cd backend
            python -m venv venv
            source venv/bin/activate  # On Windows: venv\Scripts\activate
            pip install -r requirements.txt
        ```

        c. Initialize the DB, ensure it's running, apply migrations and run the backend

        ```bash
            uvicorn main:app --host 0.0.0.0 --port 8000 --reload
        ```

    3. Frontend Setup

        a. Install Dependencies and Run the application

        ```bash
            npm install
            node server.js
        ```

If choosing to simulate your own sensor data, ensure to send it in the format below;

    ```bash
        {
    "gsr": 2.5,
    "heart_rate": 75.0,
    "temperature": 36.8
    }
    ```




    