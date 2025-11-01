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

# Authentication Models
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    username: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    token: str
    user_id: str
    email: str
    username: Optional[str] = None

class UserProfile(BaseModel):
    user_id: str
    email: str
    username: Optional[str] = None
    created_at: datetime

# Auth Helper Functions
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str) -> str:
    """Create JWT token for user"""
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> Dict[str, Any]:
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Dependency to get current authenticated user"""
    token = credentials.credentials
    payload = decode_jwt_token(token)
    
    # Verify user exists in database
    user = await db.users.find_one({"user_id": payload['user_id']})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return {
        'user_id': user['user_id'],
        'email': user['email'],
        'username': user.get('username')
    }

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

# Authentication Endpoints
@api_router.post("/auth/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    """Register a new user"""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": request.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(request.password)
    
    user_data = {
        "user_id": user_id,
        "email": request.email,
        "password_hash": hashed_password,
        "username": request.username or request.email.split('@')[0],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_data)
    
    # Create JWT token
    token = create_jwt_token(user_id, request.email)
    
    # Initialize game state for new user
    initial_game_state = {
        "user_id": user_id,
        "karma": 0,
        "clues": 0,
        "activities": 0,
        "level": 0,
        "discount_percent": 0,
        "created_at": datetime.utcnow()
    }
    await db.game_progress.insert_one(initial_game_state)
    
    return AuthResponse(
        token=token,
        user_id=user_id,
        email=request.email,
        username=user_data['username']
    )

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """Login existing user"""
    # Find user
    user = await db.users.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(request.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create JWT token
    token = create_jwt_token(user['user_id'], user['email'])
    
    return AuthResponse(
        token=token,
        user_id=user['user_id'],
        email=user['email'],
        username=user.get('username')
    )

@api_router.get("/auth/verify", response_model=UserProfile)
async def verify_token(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Verify JWT token and return user profile"""
    user = await db.users.find_one({"user_id": current_user['user_id']})
    
    return UserProfile(
        user_id=user['user_id'],
        email=user['email'],
        username=user.get('username'),
        created_at=user['created_at']
    )

@api_router.post("/auth/logout")
async def logout():
    """Logout user (client should delete token)"""
    return {"message": "Logged out successfully"}

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
