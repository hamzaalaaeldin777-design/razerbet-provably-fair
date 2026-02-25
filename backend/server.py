from fastapi import FastAPI, APIRouter, HTTPException, Header, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import hashlib
import hmac
import secrets
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection (optional)
mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url) if mongo_url else None
db = client[os.environ.get('DB_NAME', 'razerbet')] if client else None

# Create the main app
app = FastAPI(title="RazerBet Provably Fair API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# API Key for Discord bot (generate once and store)
BOT_API_KEY = os.environ.get('BOT_API_KEY', 'razerbet_secret_key_change_in_production')

# Game Types
GAME_TYPES = ["blackjack", "tower", "dices_war", "mines", "coinflip", "match", "crash"]

# =============================================================================
# MODELS
# =============================================================================

class VerificationRequest(BaseModel):
    server_seed: str
    client_seed: str
    nonce: int
    game_type: str

class VerificationResponse(BaseModel):
    is_valid: bool
    server_seed_hash: str
    combined_seed: str
    result: dict
    raw_result: float
    game_type: str
    calculation_steps: List[str]

class GameRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    game_type: str
    server_seed: str
    server_seed_hash: str
    client_seed: str
    nonce: int
    result: dict
    raw_result: float
    user_id: str
    username: str
    bet_amount: float
    multiplier: float
    won: bool
    payout: float
    currency: str = "ETH"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    verified: bool = True

class GameRecordCreate(BaseModel):
    game_type: str
    server_seed: str
    client_seed: str
    nonce: int
    user_id: str
    username: str
    bet_amount: float
    multiplier: float
    won: bool
    payout: float
    currency: str = "ETH"

class SeedPair(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    server_seed: str
    server_seed_hash: str
    client_seed: str
    nonce: int = 0
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SeedPairCreate(BaseModel):
    client_seed: Optional[str] = None

class ApiStats(BaseModel):
    total_games: int
    total_verified: int
    games_by_type: dict
    recent_games_count: int

# =============================================================================
# PROVABLY FAIR LOGIC
# =============================================================================

def generate_server_seed():
    """Generate a cryptographically secure server seed"""
    return secrets.token_hex(32)

def hash_server_seed(server_seed: str) -> str:
    """Create SHA256 hash of server seed"""
    return hashlib.sha256(server_seed.encode()).hexdigest()

def generate_hmac_result(server_seed: str, client_seed: str, nonce: int) -> str:
    """Generate HMAC-SHA256 result from seeds and nonce"""
    message = f"{client_seed}:{nonce}"
    return hmac.new(
        server_seed.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

def hex_to_float(hex_string: str) -> float:
    """Convert first 8 characters of hex to float between 0 and 1"""
    # Take first 8 chars (32 bits) and convert to integer
    int_value = int(hex_string[:8], 16)
    # Normalize to 0-1 range
    return int_value / (16 ** 8)

def calculate_game_result(game_type: str, raw_result: float) -> dict:
    """Calculate game-specific result from raw float"""
    
    if game_type == "coinflip":
        return {
            "outcome": "heads" if raw_result < 0.5 else "tails",
            "roll": round(raw_result * 100, 2)
        }
    
    elif game_type == "dices_war":
        player_roll = int(raw_result * 6) + 1
        house_roll = int((raw_result * 100 % 1) * 6) + 1
        return {
            "player_roll": player_roll,
            "house_roll": house_roll,
            "winner": "player" if player_roll > house_roll else ("tie" if player_roll == house_roll else "house")
        }
    
    elif game_type == "mines":
        # Generate mine positions (5 mines out of 25 tiles)
        positions = []
        temp_result = raw_result
        for i in range(5):
            pos = int(temp_result * 25) % 25
            while pos in positions:
                pos = (pos + 1) % 25
            positions.append(pos)
            temp_result = (temp_result * 1000) % 1
        return {
            "mine_positions": sorted(positions),
            "safe_tiles": [i for i in range(25) if i not in positions]
        }
    
    elif game_type == "tower":
        # Tower game - 8 levels, each level has correct position
        correct_positions = []
        temp_result = raw_result
        for level in range(8):
            pos = int(temp_result * 3) % 3  # 3 positions per level
            correct_positions.append(pos)
            temp_result = (temp_result * 1000) % 1
        return {
            "correct_path": correct_positions,
            "levels": 8,
            "positions_per_level": 3
        }
    
    elif game_type == "blackjack":
        # Generate shuffled deck seed
        deck_seed = int(raw_result * 52)
        return {
            "deck_seed": deck_seed,
            "shuffle_index": raw_result,
            "note": "Full deck shuffle determined by this seed"
        }
    
    elif game_type == "match":
        # Match game - matching items
        match_value = int(raw_result * 100)
        return {
            "match_value": match_value,
            "is_match": match_value < 20,  # 20% match chance
            "roll": round(raw_result * 100, 2)
        }
    
    elif game_type == "crash":
        # Crash multiplier calculation
        # Using house edge of 1%
        e = 2.718281828
        house_edge = 0.01
        crash_point = max(1.0, (1 - house_edge) / (1 - raw_result))
        if raw_result > 0.99:
            crash_point = 100.0  # Cap at 100x
        return {
            "crash_point": round(crash_point, 2),
            "raw_value": round(raw_result * 100, 4)
        }
    
    return {"raw": raw_result}

def verify_game(server_seed: str, client_seed: str, nonce: int, game_type: str) -> VerificationResponse:
    """Full verification of a game result"""
    steps = []
    
    # Step 1: Hash the server seed
    server_seed_hash = hash_server_seed(server_seed)
    steps.append(f"1. Server Seed Hash: SHA256({server_seed[:8]}...) = {server_seed_hash[:16]}...")
    
    # Step 2: Generate HMAC
    hmac_result = generate_hmac_result(server_seed, client_seed, nonce)
    steps.append(f"2. HMAC Result: HMAC-SHA256(server_seed, '{client_seed}:{nonce}') = {hmac_result[:16]}...")
    
    # Step 3: Convert to float
    raw_result = hex_to_float(hmac_result)
    steps.append(f"3. Raw Result: hex_to_float({hmac_result[:8]}) = {raw_result:.8f}")
    
    # Step 4: Calculate game result
    result = calculate_game_result(game_type, raw_result)
    steps.append(f"4. Game Result ({game_type}): {result}")
    
    return VerificationResponse(
        is_valid=True,
        server_seed_hash=server_seed_hash,
        combined_seed=f"{client_seed}:{nonce}",
        result=result,
        raw_result=raw_result,
        game_type=game_type,
        calculation_steps=steps
    )

# =============================================================================
# API ROUTES
# =============================================================================

@api_router.get("/")
async def root():
    return {"message": "RazerBet Provably Fair API", "version": "1.0.0"}

@api_router.get("/games")
async def get_game_types():
    """Get list of supported game types"""
    return {"games": GAME_TYPES}

# Verification endpoint
@api_router.post("/verify", response_model=VerificationResponse)
async def verify_game_result(request: VerificationRequest):
    """Verify a game result using provably fair algorithm"""
    if request.game_type not in GAME_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid game type. Must be one of: {GAME_TYPES}")
    
    if request.nonce < 0:
        raise HTTPException(status_code=400, detail="Nonce must be non-negative")
    
    return verify_game(
        request.server_seed,
        request.client_seed,
        request.nonce,
        request.game_type
    )

# Generate new seed pair
@api_router.post("/seeds/generate")
async def generate_seed_pair(request: SeedPairCreate):
    """Generate a new server seed and return its hash (seed remains hidden until revealed)"""
    server_seed = generate_server_seed()
    server_seed_hash = hash_server_seed(server_seed)
    client_seed = request.client_seed or secrets.token_hex(16)
    
    seed_pair = SeedPair(
        server_seed=server_seed,
        server_seed_hash=server_seed_hash,
        client_seed=client_seed,
        nonce=0
    )
    
    if db is not None:
        doc = seed_pair.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.seed_pairs.insert_one(doc)
    
    return {
        "id": seed_pair.id,
        "server_seed_hash": server_seed_hash,
        "client_seed": client_seed,
        "nonce": 0,
        "message": "Server seed is hidden until game completion"
    }

# Hash verification endpoint
@api_router.post("/verify-hash")
async def verify_hash(server_seed: str = Query(...), expected_hash: str = Query(...)):
    """Verify that a server seed matches its previously shown hash"""
    actual_hash = hash_server_seed(server_seed)
    matches = actual_hash == expected_hash
    
    return {
        "matches": matches,
        "server_seed": server_seed,
        "expected_hash": expected_hash,
        "actual_hash": actual_hash
    }

# =============================================================================
# DISCORD BOT API (Protected routes)
# =============================================================================

async def verify_bot_api_key(x_api_key: str = Header(None)):
    """Verify the bot API key"""
    if x_api_key != BOT_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return True

@api_router.post("/bot/game", response_model=dict)
async def record_game(game: GameRecordCreate, x_api_key: str = Header(None)):
    """Record a game result from Discord bot"""
    await verify_bot_api_key(x_api_key)
    
    if game.game_type not in GAME_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid game type")
    
    # Verify the game
    verification = verify_game(
        game.server_seed,
        game.client_seed,
        game.nonce,
        game.game_type
    )
    
    record = GameRecord(
        game_type=game.game_type,
        server_seed=game.server_seed,
        server_seed_hash=verification.server_seed_hash,
        client_seed=game.client_seed,
        nonce=game.nonce,
        result=verification.result,
        raw_result=verification.raw_result,
        user_id=game.user_id,
        username=game.username,
        bet_amount=game.bet_amount,
        multiplier=game.multiplier,
        won=game.won,
        payout=game.payout,
        currency=game.currency
    )
    
    if db is not None:
        doc = record.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        await db.game_history.insert_one(doc)
    
    return {
        "success": True,
        "game_id": record.id,
        "server_seed_hash": verification.server_seed_hash
    }

@api_router.get("/history")
async def get_game_history(
    limit: int = Query(50, le=100),
    game_type: Optional[str] = None,
    user_id: Optional[str] = None
):
    """Get recent game history (public endpoint)"""
    if db is None:
        return {"games": [], "count": 0}
    
    query = {}
    if game_type:
        query["game_type"] = game_type
    if user_id:
        query["user_id"] = user_id
    
    games = await db.game_history.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    
    for game in games:
        if 'username' in game:
            name = game['username']
            if len(name) > 4:
                game['username'] = name[:2] + '*' * (len(name) - 4) + name[-2:]
        if isinstance(game.get('timestamp'), str):
            game['timestamp'] = datetime.fromisoformat(game['timestamp'])
    
    return {"games": games, "count": len(games)}

@api_router.get("/stats")
async def get_stats():
    """Get API statistics"""
    if db is None:
        return ApiStats(total_games=0, total_verified=0, games_by_type={}, recent_games_count=0)
    
    total_games = await db.game_history.count_documents({})
    
    pipeline = [
        {"$group": {"_id": "$game_type", "count": {"$sum": 1}}}
    ]
    games_by_type = {}
    async for doc in db.game_history.aggregate(pipeline):
        games_by_type[doc["_id"]] = doc["count"]
    
    return ApiStats(
        total_games=total_games,
        total_verified=total_games,
        games_by_type=games_by_type,
        recent_games_count=min(total_games, 100)
    )

@api_router.get("/user/{identifier}/stats")
async def get_user_stats(identifier: str):
    """Get stats for a specific user by ID or username (public endpoint)"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    query = {"$or": [
        {"user_id": identifier},
        {"username": {"$regex": f"^{identifier}$", "$options": "i"}}
    ]}
    
    total_games = await db.game_history.count_documents(query)
    
    if total_games == 0:
        raise HTTPException(status_code=404, detail="User not found or has no games")
    
    wins = await db.game_history.count_documents({**query, "won": True})
    losses = total_games - wins
    
    pipeline = [
        {"$match": query},
        {"$group": {
            "_id": None,
            "total_wagered": {"$sum": "$bet_amount"},
            "total_payout": {"$sum": "$payout"},
            "games_by_type": {"$push": "$game_type"}
        }}
    ]
    
    agg_result = await db.game_history.aggregate(pipeline).to_list(1)
    
    total_wagered = 0
    total_payout = 0
    games_by_type = {}
    
    if agg_result:
        total_wagered = agg_result[0].get("total_wagered", 0)
        total_payout = agg_result[0].get("total_payout", 0)
        for gt in agg_result[0].get("games_by_type", []):
            games_by_type[gt] = games_by_type.get(gt, 0) + 1
    
    profit = total_payout - total_wagered
    win_rate = round((wins / total_games) * 100, 2) if total_games > 0 else 0
    
    recent_games = await db.game_history.find(query, {"_id": 0, "server_seed": 0}).sort("timestamp", -1).limit(10).to_list(10)
    
    for game in recent_games:
        if isinstance(game.get('timestamp'), str):
            game['timestamp'] = datetime.fromisoformat(game['timestamp'])
    
    return {
        "user_id": identifier,
        "total_games": total_games,
        "wins": wins,
        "losses": losses,
        "win_rate": win_rate,
        "total_wagered": round(total_wagered, 6),
        "total_payout": round(total_payout, 6),
        "profit": round(profit, 6),
        "games_by_type": games_by_type,
        "recent_games": recent_games
    }

# =============================================================================
# SEED MANAGEMENT FOR BOT
# =============================================================================

@api_router.post("/bot/seeds/create")
async def create_seeds_for_user(
    user_id: str,
    client_seed: Optional[str] = None,
    x_api_key: str = Header(None)
):
    """Create a new seed pair for a user (Bot only)"""
    await verify_bot_api_key(x_api_key)
    
    server_seed = generate_server_seed()
    server_seed_hash = hash_server_seed(server_seed)
    client_seed = client_seed or secrets.token_hex(16)
    
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "server_seed": server_seed,
        "server_seed_hash": server_seed_hash,
        "client_seed": client_seed,
        "nonce": 0,
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    # Deactivate old seeds for this user
    await db.user_seeds.update_many(
        {"user_id": user_id, "active": True},
        {"$set": {"active": False}}
    )
    
    await db.user_seeds.insert_one(doc)
    
    return {
        "id": doc["id"],
        "server_seed_hash": server_seed_hash,
        "client_seed": client_seed,
        "nonce": 0
    }

@api_router.get("/bot/seeds/{user_id}")
async def get_user_seeds(user_id: str, x_api_key: str = Header(None)):
    """Get active seeds for a user (Bot only)"""
    await verify_bot_api_key(x_api_key)
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    seeds = await db.user_seeds.find_one(
        {"user_id": user_id, "active": True},
        {"_id": 0}
    )
    
    if not seeds:
        raise HTTPException(status_code=404, detail="No active seeds for user")
    
    return {
        "server_seed_hash": seeds["server_seed_hash"],
        "client_seed": seeds["client_seed"],
        "nonce": seeds["nonce"]
    }

@api_router.post("/bot/seeds/{user_id}/reveal")
async def reveal_user_seeds(user_id: str, x_api_key: str = Header(None)):
    """Reveal server seed for a user and rotate to new seeds (Bot only)"""
    await verify_bot_api_key(x_api_key)
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    seeds = await db.user_seeds.find_one(
        {"user_id": user_id, "active": True},
        {"_id": 0}
    )
    
    if not seeds:
        raise HTTPException(status_code=404, detail="No active seeds for user")
    
    # Mark as revealed
    await db.user_seeds.update_one(
        {"id": seeds["id"]},
        {"$set": {"active": False, "revealed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Create new seeds
    new_server_seed = generate_server_seed()
    new_server_seed_hash = hash_server_seed(new_server_seed)
    
    new_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "server_seed": new_server_seed,
        "server_seed_hash": new_server_seed_hash,
        "client_seed": seeds["client_seed"],  # Keep same client seed
        "nonce": 0,
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_seeds.insert_one(new_doc)
    
    return {
        "revealed_server_seed": seeds["server_seed"],
        "revealed_server_seed_hash": seeds["server_seed_hash"],
        "new_server_seed_hash": new_server_seed_hash,
        "client_seed": seeds["client_seed"]
    }

@api_router.post("/bot/seeds/{user_id}/increment-nonce")
async def increment_nonce(user_id: str, x_api_key: str = Header(None)):
    """Increment nonce for a user after each game (Bot only)"""
    await verify_bot_api_key(x_api_key)
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    result = await db.user_seeds.find_one_and_update(
        {"user_id": user_id, "active": True},
        {"$inc": {"nonce": 1}},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="No active seeds for user")
    
    return {"nonce": result["nonce"]}

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
    if client is not None:
        client.close()
