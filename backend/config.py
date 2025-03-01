import os
from dotenv import load_dotenv

load_dotenv()


SECRET_KEY:str = os.getenv("SECRET_KEY")
ALGORITHM:str = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES:int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

DATABASE_URL = os.getenv("DATABASE_URL")
WEBSOCKET_URL = os.getenv("WEBSOCKET_URL")

# openssl rand -hex 32 
