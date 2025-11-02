from __future__ import annotations

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

# Map and Location Models
class Location(BaseModel):
    id: str
    name: str
    coordinates: List[int]  # [x, y] position on map
    icon: str
    unlocked: bool
    description: str
    npc_name: Optional[str] = None
    interactions: List[str] = []  # Available actions: 'enter', 'talk', 'search'

class MapOverview(BaseModel):
    locations: List[Location]
    karma_coins: int
    visited_locations: List[str]
    fog_of_war: List[str]  # List of hidden location IDs

class InteractionReward(BaseModel):
    karma_coins: int = 0
    items: List[str] = []
    experience: int = 0

class InteractionResponse(BaseModel):
    dialogue: str
    rewards: InteractionReward
    quest_update: Optional[Dict[str, Any]] = None
    location_unlocked: Optional[str] = None
    shop_menu: Optional[ShopMenu] = None

class RedeemKarmaRequest(BaseModel):
    coins_to_redeem: int

# Shop Models
class ShopItem(BaseModel):
    id: str
    name: str
    cost: int
    description: str
    effect: str
    available: bool = True
    coming_soon: bool = False
    icon: str = "🎁"

class ShopMenu(BaseModel):
    shop_type: str
    items: List[ShopItem]

class PurchaseRequest(BaseModel):
    item_id: str

class PurchaseResponse(BaseModel):
    success: bool
    message: str
    item: Optional[ShopItem] = None
    new_karma_balance: int

# RPG Progression Models
class Trait(BaseModel):
    id: str
    name: str
    description: str
    effect: str
    modifier: float  # e.g., 1.2 for 20% boost

class ProgressionUpdate(BaseModel):
    xp_gained: int
    new_xp: int
    level: int
    leveled_up: bool
    available_traits: List[Trait] = []

class SelectTraitRequest(BaseModel):
    trait_id: str

# XP Thresholds for leveling
XP_THRESHOLDS = [0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500]  # Levels 1-10

# Available Traits (Shining Force II inspired promotions)
AVAILABLE_TRAITS = {
    "farmer": {
        "id": "farmer",
        "name": "Master Farmer",
        "description": "Your green thumb increases crop yields and farming XP",
        "effect": "farming_boost",
        "modifier": 1.20  # 20% boost to farming rewards
    },
    "herbalist": {
        "id": "herbalist",
        "name": "Herbalist",
        "description": "Knowledge of plants enhances treat effectiveness",
        "effect": "treat_boost",
        "modifier": 1.25  # 25% boost to treat effects
    },
    "rancher": {
        "id": "rancher",
        "name": "Expert Rancher",
        "description": "Animal handling skills speed up grazing and increase affinity",
        "effect": "animal_boost",
        "modifier": 1.30  # 30% boost to animal interactions
    },
    "lucky": {
        "id": "lucky",
        "name": "Lucky Finder",
        "description": "Increased chance of finding treasure and rare items",
        "effect": "treasure_boost",
        "modifier": 1.50  # 50% increased treasure chance
    },
    "bargainer": {
        "id": "bargainer",
        "name": "Master Bargainer",
        "description": "Shop prices reduced and discounts increased",
        "effect": "shop_discount",
        "modifier": 0.85  # 15% discount on all shop items
    },
    "explorer": {
        "id": "explorer",
        "name": "Keen Explorer",
        "description": "Discover hidden locations and secrets faster",
        "effect": "exploration_boost",
        "modifier": 1.40  # 40% boost to exploration rewards
    }
}

# Shop Inventory Data (Shining Force II inspired)
SHOP_ITEMS = {
    "farmhouse": {
        "shop_type": "Ranch Supply",
        "items": [
            {
                "id": "hint_token",
                "name": "Hint Token",
                "cost": 20,
                "description": "Request an extra hint from Leif Pryor",
                "effect": "grants_hint",
                "available": True,
                "coming_soon": False,
                "icon": "💡"
            },
            # Animal Treats (Research-based)
            {
                "id": "emu_berries",
                "name": "Assorted Berries (Emus)",
                "cost": 15,
                "description": "Fresh berries loved by emus, boosts emu affinity +10%",
                "effect": "emu_affinity",
                "available": True,
                "coming_soon": False,
                "icon": "🫐"
            },
            {
                "id": "apples",
                "name": "Fresh Apples",
                "cost": 10,
                "description": "Crisp apples for donkeys, pigs, horses, sheep & cattle. +5 XP on use",
                "effect": "general_treat",
                "available": True,
                "coming_soon": False,
                "icon": "🍎"
            },
            {
                "id": "carrots",
                "name": "Garden Carrots",
                "cost": 10,
                "description": "Training treat for all ranch animals. +10 karma on interaction",
                "effect": "training_treat",
                "available": True,
                "coming_soon": False,
                "icon": "🥕"
            },
            {
                "id": "alfalfa_hay",
                "name": "Alfalfa Hay Bale",
                "cost": 20,
                "description": "Premium herbivore feed, unlocks grazing bonus in pasture",
                "effect": "grazing_unlock",
                "available": True,
                "coming_soon": False,
                "icon": "🌾"
            },
            {
                "id": "orchard_hay",
                "name": "Orchard Hay Bale",
                "cost": 20,
                "description": "High-quality hay for all herbivores. Grants +15 XP",
                "effect": "premium_feed",
                "available": True,
                "coming_soon": False,
                "icon": "🌿"
            },
            {
                "id": "feed_barrel",
                "name": "Barrel of Feed",
                "cost": 25,
                "description": "Specialized feed mix for enhanced animal care. +20 affinity",
                "effect": "special_feed",
                "available": True,
                "coming_soon": False,
                "icon": "🛢️"
            },
            {
                "id": "energy_boost",
                "name": "Energy Boost",
                "cost": 50,
                "description": "Double karma coin earnings for your next interaction",
                "effect": "double_coins_next",
                "available": False,
                "coming_soon": True,
                "icon": "⚡"
            },
            {
                "id": "quest_guide",
                "name": "Quest Guide",
                "cost": 100,
                "description": "Comprehensive guide to all ranch mysteries",
                "effect": "reveals_clues",
                "available": False,
                "coming_soon": True,
                "icon": "📖"
            }
        ]
    },
    "barn": {
        "shop_type": "Wearables Shop",
        "items": [
            {
                "id": "ranch_hat",
                "name": "Ranch Hat",
                "cost": 30,
                "description": "Classic cowboy hat for the stylish rancher",
                "effect": "cosmetic",
                "available": True,
                "coming_soon": False,
                "icon": "🤠"
            },
            {
                "id": "golden_horseshoe",
                "name": "Golden Horseshoe",
                "cost": 75,
                "description": "Lucky charm that boosts treasure finding",
                "effect": "treasure_boost",
                "available": False,
                "coming_soon": True,
                "icon": "🧲"
            },
            {
                "id": "mystery_box",
                "name": "Mystery Box",
                "cost": 150,
                "description": "Contains a rare surprise item",
                "effect": "random_reward",
                "available": False,
                "coming_soon": True,
                "icon": "🎁"
            }
        ]
    },
    "secret_grove": {
        "shop_type": "Ancient Deals",
        "items": [
            {
                "id": "discount_booster",
                "name": "Discount Booster",
                "cost": 200,
                "description": "Adds +5% to your next discount redemption",
                "effect": "discount_boost",
                "available": True,
                "coming_soon": False,
                "icon": "🎫"
            },
            {
                "id": "ancient_artifact",
                "name": "Ancient Artifact",
                "cost": 500,
                "description": "Mysterious relic with unknown powers",
                "effect": "special",
                "available": False,
                "coming_soon": True,
                "icon": "🗿"
            }
        ]
    }
}

# Location Data (Shining Force II inspired)
RANCH_LOCATIONS = [
    {
        "id": "barn",
        "name": "Old Barn",
        "coordinates": [300, 200],
        "icon": "🏚️",
        "description": "A weathered barn that holds secrets of the Golden Hooves mystery",
        "npc_name": "Old Ranch Hand",
        "interactions": ["enter", "talk", "search", "browse_goods"],
        "base_unlocked": True,
        "has_shop": True
    },
    {
        "id": "stable",
        "name": "Horse Stable",
        "coordinates": [500, 250],
        "icon": "🐴",
        "description": "Home to Jumanji the stubborn donkey and other ranch animals",
        "npc_name": "Stable Keeper",
        "interactions": ["enter", "talk", "search"],
        "base_unlocked": True
    },
    {
        "id": "farmhouse",
        "name": "Farmhouse",
        "coordinates": [400, 100],
        "icon": "🏡",
        "description": "Leif Pryor's headquarters for ranch management",
        "npc_name": "Leif Pryor",
        "interactions": ["enter", "talk", "browse_goods"],
        "base_unlocked": True,
        "has_shop": True
    },
    {
        "id": "pasture",
        "name": "Open Pasture",
        "coordinates": [200, 350],
        "icon": "🌾",
        "description": "Rolling fields where animals graze under the Sierra Nevada sky",
        "npc_name": "Wandering Prospector",
        "interactions": ["talk", "search", "furrow_fields", "grow_crops", "graze_animals"],
        "base_unlocked": True
    },
    {
        "id": "secret_grove",
        "name": "Hidden Grove",
        "coordinates": [600, 350],
        "icon": "🌲",
        "description": "A mysterious grove that appears after solving clues...",
        "npc_name": "Ancient Spirit",
        "interactions": ["enter", "talk", "search", "browse_goods"],
        "base_unlocked": False,  # Unlocked after 3 clues
        "has_shop": True
    }
]

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

# Map Interaction Endpoints
@api_router.get("/map-overview/{user_id}", response_model=MapOverview)
async def get_map_overview(user_id: str):
    """Get full map state for user"""
    # Get user's game state
    state = await db.game_progress.find_one({"user_id": user_id})
    
    if not state:
        # Initialize default state
        state = {
            "visited_locations": [],
            "karma_coins": 0,
            "clues": 0
        }
    
    visited = state.get("visited_locations", [])
    karma_coins = state.get("karma_coins", 0)
    clues_solved = state.get("clues", 0)
    
    # Build locations with unlock status
    locations = []
    fog_of_war = []
    
    for loc_data in RANCH_LOCATIONS:
        # Check if location should be unlocked
        unlocked = loc_data["base_unlocked"]
        if not unlocked and clues_solved >= 3:  # Secret grove unlocks at 3 clues
            unlocked = True
        
        if not unlocked:
            fog_of_war.append(loc_data["id"])
        
        locations.append(Location(
            id=loc_data["id"],
            name=loc_data["name"],
            coordinates=loc_data["coordinates"],
            icon=loc_data["icon"],
            unlocked=unlocked,
            description=loc_data["description"],
            npc_name=loc_data.get("npc_name"),
            interactions=loc_data["interactions"]
        ))
    
    return MapOverview(
        locations=locations,
        karma_coins=karma_coins,
        visited_locations=visited,
        fog_of_war=fog_of_war
    )

@api_router.post("/map-interact/{user_id}/{location_id}/{action}", response_model=InteractionResponse)
async def map_interaction(user_id: str, location_id: str, action: str):
    """Handle map location interactions"""
    # Validate location exists
    location = next((loc for loc in RANCH_LOCATIONS if loc["id"] == location_id), None)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Validate action
    if action not in location["interactions"]:
        raise HTTPException(status_code=400, detail=f"Action '{action}' not available for this location")
    
    # Get user's current state
    state = await db.game_progress.find_one({"user_id": user_id})
    if not state:
        # Initialize state for guest users or create new state
        state = {
            "user_id": user_id,
            "karma_coins": 0,
            "visited_locations": [],
            "clues": 0,
            "activities": 0,
            "level": 0,
            "inventory": [],
            "created_at": datetime.utcnow()
        }
        # Insert initial state for this user
        await db.game_progress.insert_one(state.copy())
    
    visited = state.get("visited_locations", [])
    karma_coins = state.get("karma_coins", 0)
    
    # Determine if first visit
    is_first_visit = location_id not in visited
    
    # Generate interaction response based on location and action
    dialogue = ""
    rewards = InteractionReward()
    location_unlocked = None
    shop_menu = None
    
    # Handle browse_goods action (shop system)
    if action == "browse_goods":
        if location_id in SHOP_ITEMS:
            shop_data = SHOP_ITEMS[location_id]
            shop_items = []
            
            for item_data in shop_data["items"]:
                shop_items.append(ShopItem(**item_data))
            
            shop_menu = ShopMenu(
                shop_type=shop_data["shop_type"],
                items=shop_items
            )
            
            dialogue = f"{location['npc_name']}: 'Welcome to my {shop_data['shop_type']}! Take a look at what I have available. Some items are still being prepared...'"
        else:
            dialogue = f"{location['npc_name']}: 'No shop here, but feel free to explore!'"
        
        # Don't give rewards for browsing
        return InteractionResponse(
            dialogue=dialogue,
            rewards=rewards,
            shop_menu=shop_menu
        )
    
    # Static dialogues (cost-efficient - no AI)
    dialogues = {
        "barn": {
            "enter": "You step into the old barn. Dust motes dance in shafts of sunlight. Something glitters in the corner...",
            "talk": f"{location['npc_name']}: 'Been workin' this ranch for 40 years. Seen some strange things, especially around that golden frog statue...'",
            "search": "You search through hay bales and find an old ranch journal with cryptic notes!"
        },
        "stable": {
            "enter": "Jumanji the donkey eyes you suspiciously. The stable smells of hay and leather.",
            "talk": f"{location['npc_name']}: 'Jumanji's been acting strange lately. Keeps braying at the old oak tree by the creek.'",
            "search": "Behind a feed bucket, you discover a tarnished horseshoe with mysterious engravings."
        },
        "farmhouse": {
            "enter": "Leif Pryor's office is filled with maps and ranch records. A portrait of a golden frog hangs on the wall.",
            "talk": f"{location['npc_name']}: 'Welcome! Need any hints about the mystery? I've been tracking these clues for years.'"
        },
        "pasture": {
            "talk": f"{location['npc_name']}: 'I prospected these hills during the Gold Rush. Found more than gold... found legends.'",
            "search": "You spot an unusual rock formation that resembles a frog. A hidden compartment contains a golden coin!"
        },
        "secret_grove": {
            "enter": "Ancient trees surround you. The air tingles with magic. A stone altar bears frog carvings.",
            "talk": f"{location['npc_name']}: 'You have proven worthy by solving the clues. The Golden Hooves secret awaits...'",
            "search": "Beneath moss-covered stones, you find the legendary Golden Frog Medallion!"
        }
    }
    
    # Get dialogue for this interaction
    location_dialogues = dialogues.get(location_id, {})
    dialogue = location_dialogues.get(action, "You interact with the location.")
    
    # Reward karma coins
    base_reward = 10 if is_first_visit else 5
    
    # Random treasure event (20% chance)
    import random
    if random.random() < 0.2:
        treasure_bonus = random.randint(5, 15)
        rewards.karma_coins = base_reward + treasure_bonus
        dialogue += f"\n\n✨ You found hidden treasure! +{treasure_bonus} bonus karma coins!"
    else:
        rewards.karma_coins = base_reward
    
    # Special rewards for searching
    if action == "search":
        rewards.items.append(f"{location['name']} Artifact")
        rewards.experience = 20
    
    # Farming actions for Open Pasture
    if location_id == "pasture" and action in ["furrow_fields", "grow_crops", "graze_animals"]:
        pasture_state = state.get("pasture_state", {
            "furrowed": False,
            "crop_progress": 0,
            "grazed": False,
            "last_action": None
        })
        
        if action == "furrow_fields":
            if pasture_state.get("furrowed"):
                dialogue = "The fields are already furrowed and ready for planting!"
                rewards.karma_coins = 0
            else:
                pasture_state["furrowed"] = True
                pasture_state["last_action"] = datetime.utcnow()
                dialogue = "🚜 You furrow the fields, creating neat rows for planting. The soil is rich and ready! +20 XP earned."
                rewards.experience = 20
                rewards.karma_coins = base_reward
                
                # Award XP via progression system
                await db.game_progress.update_one(
                    {"user_id": user_id},
                    {
                        "$set": {
                            "pasture_state": pasture_state
                        },
                        "$inc": {
                            "progression.xp": 20
                        }
                    }
                )
        
        elif action == "grow_crops":
            if not pasture_state.get("furrowed"):
                dialogue = "❌ You need to furrow the fields first before planting!"
                rewards.karma_coins = 0
            elif pasture_state.get("crop_progress", 0) >= 3:
                # Harvest time!
                harvest_bonus = 50
                traits = state.get("progression", {}).get("traits", [])
                if "farmer" in traits:
                    harvest_bonus = int(harvest_bonus * 1.20)  # 20% boost
                
                pasture_state["crop_progress"] = 0
                pasture_state["furrowed"] = False
                dialogue = f"🌾 Harvest time! Your crops have matured beautifully. +{harvest_bonus} karma coins, +30 XP!"
                rewards.karma_coins = harvest_bonus
                rewards.experience = 30
                rewards.items.append("Fresh Harvest")
                
                # Award XP
                await db.game_progress.update_one(
                    {"user_id": user_id},
                    {
                        "$set": {
                            "pasture_state": pasture_state
                        },
                        "$inc": {
                            "progression.xp": 30
                        }
                    }
                )
            else:
                # Growing stage
                pasture_state["crop_progress"] = pasture_state.get("crop_progress", 0) + 1
                progress = pasture_state["crop_progress"]
                stage_names = ["Sprouting 🌱", "Growing 🌿", "Maturing 🌾"]
                dialogue = f"🌱 You tend to the crops. They're {stage_names[progress-1]}! (Progress: {progress}/3)"
                rewards.karma_coins = 5
                rewards.experience = 10
                
                await db.game_progress.update_one(
                    {"user_id": user_id},
                    {
                        "$set": {
                            "pasture_state": pasture_state
                        },
                        "$inc": {
                            "progression.xp": 10
                        }
                    }
                )
        
        elif action == "graze_animals":
            if pasture_state.get("grazed"):
                dialogue = "🐴 The animals are already resting peacefully in the pasture."
                rewards.karma_coins = 0
            else:
                base_graze_xp = 25
                traits = state.get("progression", {}).get("traits", [])
                
                # Check for trait bonuses
                if "rancher" in traits:
                    base_graze_xp = int(base_graze_xp * 1.30)  # 30% boost
                
                pasture_state["grazed"] = True
                pasture_state["last_action"] = datetime.utcnow()
                dialogue = f"🐴 You lead the animals to graze. They munch contentedly on fresh grass. +{base_graze_xp} XP, +15 karma!"
                rewards.karma_coins = 15
                rewards.experience = base_graze_xp
                
                # Check for treats in inventory to boost affinity
                inventory = state.get("inventory", [])
                has_treats = any(item.get("effect") in ["general_treat", "training_treat", "grazing_unlock"] for item in inventory)
                if has_treats:
                    dialogue += "\n\n💚 Your animal treats make the herd extra happy! +10 affinity bonus."
                
                await db.game_progress.update_one(
                    {"user_id": user_id},
                    {
                        "$set": {
                            "pasture_state": pasture_state
                        },
                        "$inc": {
                            "progression.xp": base_graze_xp
                        }
                    }
                )
        
        # Don't run the normal karma coin logic for farming actions
        new_karma = karma_coins + rewards.karma_coins
    else:
        # Normal interaction karma rewards
        # Update user state
        new_karma = karma_coins + rewards.karma_coins
    
    if location_id not in visited and action not in ["furrow_fields", "grow_crops", "graze_animals"]:
        visited.append(location_id)
    
    # Check for secret grove unlock
    clues_solved = state.get("clues", 0)
    if clues_solved >= 3 and "secret_grove" not in visited:
        location_unlocked = "secret_grove"
        dialogue += "\n\n🌟 A hidden path has revealed itself! The Secret Grove is now accessible!"
    
    # Update MongoDB
    await db.game_progress.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "visited_locations": visited,
                "karma_coins": new_karma,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Auto-trigger discount at 50 coins
    if new_karma >= 50 and karma_coins < 50:
        dialogue += "\n\n🎁 You've earned 50 karma coins! A special discount is now available!"
    
    return InteractionResponse(
        dialogue=dialogue,
        rewards=rewards,
        location_unlocked=location_unlocked
    )

@api_router.post("/redeem-karma/{user_id}", response_model=DiscountResponse)
async def redeem_karma_coins(user_id: str, request: RedeemKarmaRequest):
    """Redeem karma coins for discount codes"""
    state = await db.game_progress.find_one({"user_id": user_id})
    
    if not state:
        raise HTTPException(status_code=404, detail="Game progress not found")
    
    karma_coins = state.get("karma_coins", 0)
    
    # Check if user has enough coins (50 minimum for 7% discount)
    if karma_coins < 50:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient karma coins. Need 50, have {karma_coins}"
        )
    
    # Calculate discount based on coins (7% base at 50, up to 27% at 200+)
    if karma_coins >= 200:
        discount = 27
    elif karma_coins >= 150:
        discount = 22
    elif karma_coins >= 100:
        discount = 17
    elif karma_coins >= 75:
        discount = 12
    else:  # 50-74
        discount = 7
    
    # Check for existing unused discount
    existing_code = await db.discount_codes.find_one({
        "user_id": user_id,
        "used": False
    })
    
    if existing_code:
        return DiscountResponse(
            code=existing_code["code"],
            discount=existing_code["percent"]
        )
    
    # Generate new code
    code = f"KARMA{os.urandom(4).hex().upper()}"
    
    # Save discount code
    discount_data = {
        "user_id": user_id,
        "code": code,
        "percent": discount,
        "used": False,
        "created_at": datetime.utcnow(),
        "karma_coins_used": karma_coins,
        "source": "karma_redemption"
    }
    
    await db.discount_codes.insert_one(discount_data)
    
    return DiscountResponse(code=code, discount=discount)

@api_router.post("/shop-purchase/{user_id}/{location_id}", response_model=PurchaseResponse)
async def purchase_item(user_id: str, location_id: str, request: PurchaseRequest):
    """Purchase an item from a shop"""
    # Get user's current state
    state = await db.game_progress.find_one({"user_id": user_id})
    if not state:
        raise HTTPException(status_code=404, detail="User game state not found")
    
    karma_coins = state.get("karma_coins", 0)
    inventory = state.get("inventory", [])
    
    # Find the item
    if location_id not in SHOP_ITEMS:
        raise HTTPException(status_code=404, detail="No shop at this location")
    
    shop_data = SHOP_ITEMS[location_id]
    item_data = next((item for item in shop_data["items"] if item["id"] == request.item_id), None)
    
    if not item_data:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check if available
    if not item_data["available"] or item_data["coming_soon"]:
        raise HTTPException(status_code=400, detail="Item not available for purchase")
    
    # Check if user has enough coins
    if karma_coins < item_data["cost"]:
        return PurchaseResponse(
            success=False,
            message=f"Insufficient karma coins. Need {item_data['cost']}, have {karma_coins}",
            new_karma_balance=karma_coins
        )
    
    # Deduct coins
    new_karma = karma_coins - item_data["cost"]
    
    # Add to inventory
    existing_item = next((item for item in inventory if item.get("item_id") == request.item_id), None)
    if existing_item:
        existing_item["quantity"] += 1
    else:
        inventory.append({
            "item_id": request.item_id,
            "name": item_data["name"],
            "icon": item_data["icon"],
            "effect": item_data["effect"],
            "quantity": 1,
            "purchased_at": datetime.utcnow()
        })
    
    # Update MongoDB
    await db.game_progress.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "karma_coins": new_karma,
                "inventory": inventory,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return PurchaseResponse(
        success=True,
        message=f"Successfully purchased {item_data['name']}!",
        item=ShopItem(**item_data),
        new_karma_balance=new_karma
    )

# RPG Progression Endpoints
@api_router.post("/progression-update/{user_id}/{event_type}/{value}", response_model=ProgressionUpdate)
async def update_progression(user_id: str, event_type: str, value: int):
    """Award XP and handle leveling"""
    # Get user's current state
    state = await db.game_progress.find_one({"user_id": user_id})
    if not state:
        raise HTTPException(status_code=404, detail="User game state not found")
    
    # Get current progression
    progression = state.get("progression", {"xp": 0, "level": 1, "traits": []})
    current_xp = progression.get("xp", 0)
    current_level = progression.get("level", 1)
    traits = progression.get("traits", [])
    
    # Apply trait modifiers to XP gain
    xp_modifier = 1.0
    for trait_id in traits:
        if trait_id in AVAILABLE_TRAITS:
            trait = AVAILABLE_TRAITS[trait_id]
            if trait["effect"] == "farming_boost" and event_type == "farming":
                xp_modifier = trait["modifier"]
            elif trait["effect"] == "exploration_boost" and event_type == "exploration":
                xp_modifier = trait["modifier"]
    
    # Calculate XP gain
    xp_gained = int(value * xp_modifier)
    new_xp = current_xp + xp_gained
    
    # Check for level up
    leveled_up = False
    new_level = current_level
    available_traits = []
    
    if new_level < len(XP_THRESHOLDS):
        # Find new level
        for level, threshold in enumerate(XP_THRESHOLDS[1:], start=1):
            if new_xp >= threshold and level > current_level:
                new_level = level
                leveled_up = True
        
        # If leveled up, offer 3 random traits
        if leveled_up:
            import random
            all_traits = list(AVAILABLE_TRAITS.values())
            # Exclude already selected traits
            available_trait_pool = [t for t in all_traits if t["id"] not in traits]
            # Offer up to 3 random traits
            num_to_offer = min(3, len(available_trait_pool))
            selected_traits = random.sample(available_trait_pool, num_to_offer)
            available_traits = [Trait(**t) for t in selected_traits]
    
    # Update MongoDB
    await db.game_progress.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "progression.xp": new_xp,
                "progression.level": new_level,
                "progression.pending_traits": [t["id"] for t in selected_traits] if leveled_up else [],
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return ProgressionUpdate(
        xp_gained=xp_gained,
        new_xp=new_xp,
        level=new_level,
        leveled_up=leveled_up,
        available_traits=available_traits
    )

@api_router.post("/select-trait/{user_id}/{trait_id}")
async def select_trait(user_id: str, trait_id: str):
    """Apply selected trait to user"""
    # Validate trait exists
    if trait_id not in AVAILABLE_TRAITS:
        raise HTTPException(status_code=404, detail="Trait not found")
    
    # Get user's current state
    state = await db.game_progress.find_one({"user_id": user_id})
    if not state:
        raise HTTPException(status_code=404, detail="User game state not found")
    
    # Get current progression
    progression = state.get("progression", {"xp": 0, "level": 1, "traits": []})
    traits = progression.get("traits", [])
    pending_traits = progression.get("pending_traits", [])
    
    # Validate trait is in pending list
    if trait_id not in pending_traits:
        raise HTTPException(status_code=400, detail="Trait not available for selection")
    
    # Check if already has this trait
    if trait_id in traits:
        raise HTTPException(status_code=400, detail="Trait already selected")
    
    # Add trait
    traits.append(trait_id)
    
    # Update MongoDB
    await db.game_progress.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "progression.traits": traits,
                "progression.pending_traits": [],
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    trait_info = AVAILABLE_TRAITS[trait_id]
    return {
        "success": True,
        "message": f"Trait '{trait_info['name']}' activated!",
        "trait": Trait(**trait_info),
        "all_traits": traits
    }

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
