from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage
import bcrypt
import jwt


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'golden-hooves-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# AI Hint Models
class HintRequest(BaseModel):
    prompt: str
    max_tokens: int = 100
    user_id: Optional[str] = None

class HintResponse(BaseModel):
    text: str
    character: str = "Leif Pryor"

# Game State Models
class GameState(BaseModel):
    karma: int = 0
    clues: int = 0
    activities: int = 0
    level: int = 0
    discount_percent: int = 0

class SaveStateRequest(BaseModel):
    state: Dict[str, Any]

# Discount Models
class DiscountResponse(BaseModel):
    code: str
    discount: int

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# AI Hint Endpoint
@api_router.post("/hint", response_model=HintResponse)
async def get_ai_hint(request: HintRequest):
    """Get an AI-powered hint from Leif Pryor, the ranch manager"""
    try:
        # Get Emergent LLM key from environment
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        # Create a unique session ID for each request
        session_id = f"hint_{request.user_id or 'anonymous'}_{uuid.uuid4().hex[:8]}"
        
        # Initialize LlmChat with Leif Pryor's personality
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=(
                "You are Leif Pryor, the friendly and witty ranch manager at Back of Beyond Ranch "
                "in California's Gold Country. You give helpful hints to adventurers playing the "
                "Golden Hooves Quest game. Your hints are warm, encouraging, and sprinkled with "
                "ranch humor and Gold Country history. Keep responses under 100 words and make "
                "them fun and engaging!"
            )
        ).with_model("openai", "gpt-4o")
        
        # Create user message
        user_message = UserMessage(text=request.prompt)
        
        # Get AI response
        response_text = await chat.send_message(user_message)
        
        return HintResponse(text=response_text, character="Leif Pryor")
        
    except Exception as e:
        logger.error(f"Error generating AI hint: {str(e)}")
        # Fallback to a generic hint if AI fails
        return HintResponse(
            text="Well partner, sometimes the best hints come from exploring! Try talking to folks around the ranch and checking those clue spots. 🤠",
            character="Leif Pryor"
        )

# Game State Endpoints
@api_router.get("/game-state/{user_id}", response_model=GameState)
async def get_game_state(user_id: str):
    """Get user's game progress"""
    state = await db.game_progress.find_one({"user_id": user_id})
    if state:
        # Remove MongoDB's _id field
        state.pop('_id', None)
        state.pop('user_id', None)
        return GameState(**state)
    return GameState()

@api_router.post("/save-state/{user_id}")
async def save_game_state(user_id: str, request: SaveStateRequest):
    """Save user's game progress"""
    state_data = request.state.copy()
    state_data['user_id'] = user_id
    state_data['updated_at'] = datetime.utcnow()
    
    await db.game_progress.update_one(
        {"user_id": user_id},
        {"$set": state_data},
        upsert=True
    )
    return {"status": "saved", "message": "Game state saved successfully"}

@api_router.post("/generate-discount/{user_id}", response_model=DiscountResponse)
async def generate_discount(user_id: str):
    """Generate discount code based on game progress"""
    state = await db.game_progress.find_one({"user_id": user_id})
    
    if not state:
        raise HTTPException(status_code=404, detail="Game progress not found")
    
    clues_solved = state.get("clues", 0)
    
    # Check if user has solved enough clues (minimum 6)
    if clues_solved < 6:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient progress. Solve at least 6 clues (current: {clues_solved})"
        )
    
    # Check if user already has an active discount code
    existing_code = await db.discount_codes.find_one({
        "user_id": user_id,
        "used": False
    })
    
    if existing_code:
        return DiscountResponse(
            code=existing_code["code"],
            discount=existing_code["percent"]
        )
    
    # Calculate discount: 7% base + 5% per level, max 27%
    level = state.get("level", 0)
    discount = min(7 + (level * 5), 27)
    
    # Generate unique code
    code = f"GOLDFROG{os.urandom(4).hex().upper()}"
    
    # Save discount code
    discount_data = {
        "user_id": user_id,
        "code": code,
        "percent": discount,
        "used": False,
        "created_at": datetime.utcnow(),
        "clues_solved": clues_solved,
        "level": level
    }
    
    await db.discount_codes.insert_one(discount_data)
    
    return DiscountResponse(code=code, discount=discount)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
