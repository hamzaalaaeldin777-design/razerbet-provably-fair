from fastapi import FastAPI, APIRouter, HTTPException, Header, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import os
import hashlib
import hmac
import secrets
from urllib.parse import quote_plus
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime, timezone

def _fix_mongo_url(url):
    if not url or '://' not in url:
        return url
    scheme, rest = url.split('://', 1)
    if '@' not in rest:
        return url
    last_at = rest.rfind('@')
    credentials = rest[:last_at]
    host_part = rest[last_at + 1:]
    if ':' not in credentials:
        return url
    colon_idx = credentials.index(':')
    user = credentials[:colon_idx]
    password = credentials[colon_idx + 1:]
    return f"{scheme}://{quote_plus(user)}:{quote_plus(password)}@{host_part}"

# MongoDB connection - use environment variable
MONGO_URL = _fix_mongo_url(os.environ.get('MONGO_URL', ''))
DB_NAME = os.environ.get('DB_NAME', 'razerbet')
BOT_API_KEY = os.environ.get('BOT_API_KEY', 'rzrbt_a81bc6b34dc15aae0a8ca9e2a9d517064deecaca727675c1')

# Initialize MongoDB client (synchronous for serverless)
client = None
db = None

def get_db():
    global client, db
    if client is None and MONGO_URL:
        try:
            client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000, connectTimeoutMS=5000)
            db = client[DB_NAME]
            # Force a connection check
            client.admin.command('ping')
        except Exception as e:
            print(f"MongoDB connection error: {e}")
            client = None
            db = None
    return db

# Create FastAPI app
app = FastAPI(title="RazerBet Provably Fair API")
api_router = APIRouter(prefix="/api")

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

class ApiStats(BaseModel):
    total_games: int
    total_verified: int
    games_by_type: dict
    recent_games_count: int

# =============================================================================
# PROVABLY FAIR LOGIC
# =============================================================================

def generate_server_seed():
    return secrets.token_hex(32)

def hash_server_seed(server_seed: str) -> str:
    return hashlib.sha256(server_seed.encode()).hexdigest()

def generate_hmac_result(server_seed: str, client_seed: str, nonce: int) -> str:
    message = f"{client_seed}:{nonce}"
    return hmac.new(server_seed.encode(), message.encode(), hashlib.sha256).hexdigest()

def hex_to_float(hex_string: str) -> float:
    int_value = int(hex_string[:8], 16)
    return int_value / (16 ** 8)

def calculate_game_result(game_type: str, raw_result: float) -> dict:
    if game_type == "coinflip":
        return {"outcome": "heads" if raw_result < 0.5 else "tails", "roll": round(raw_result * 100, 2)}
    elif game_type == "dices_war":
        player_roll = int(raw_result * 6) + 1
        house_roll = int((raw_result * 100 % 1) * 6) + 1
        return {"player_roll": player_roll, "house_roll": house_roll, "winner": "player" if player_roll > house_roll else ("tie" if player_roll == house_roll else "house")}
    elif game_type == "mines":
        positions = []
        temp_result = raw_result
        for i in range(5):
            pos = int(temp_result * 25) % 25
            while pos in positions:
                pos = (pos + 1) % 25
            positions.append(pos)
            temp_result = (temp_result * 1000) % 1
        return {"mine_positions": sorted(positions), "safe_tiles": [i for i in range(25) if i not in positions]}
    elif game_type == "tower":
        correct_positions = []
        temp_result = raw_result
        for level in range(8):
            pos = int(temp_result * 3) % 3
            correct_positions.append(pos)
            temp_result = (temp_result * 1000) % 1
        return {"correct_path": correct_positions, "levels": 8, "positions_per_level": 3}
    elif game_type == "blackjack":
        return {"deck_seed": int(raw_result * 52), "shuffle_index": raw_result, "note": "Full deck shuffle determined by this seed"}
    elif game_type == "match":
        match_value = int(raw_result * 100)
        return {"match_value": match_value, "is_match": match_value < 20, "roll": round(raw_result * 100, 2)}
    elif game_type == "crash":
        house_edge = 0.01
        crash_point = max(1.0, (1 - house_edge) / (1 - raw_result))
        if raw_result > 0.99:
            crash_point = 100.0
        return {"crash_point": round(crash_point, 2), "raw_value": round(raw_result * 100, 4)}
    return {"raw": raw_result}

def verify_game(server_seed: str, client_seed: str, nonce: int, game_type: str) -> VerificationResponse:
    steps = []
    server_seed_hash = hash_server_seed(server_seed)
    steps.append(f"1. Server Seed Hash: SHA256({server_seed[:8]}...) = {server_seed_hash[:16]}...")
    hmac_result = generate_hmac_result(server_seed, client_seed, nonce)
    steps.append(f"2. HMAC Result: HMAC-SHA256(server_seed, '{client_seed}:{nonce}') = {hmac_result[:16]}...")
    raw_result = hex_to_float(hmac_result)
    steps.append(f"3. Raw Result: hex_to_float({hmac_result[:8]}) = {raw_result:.8f}")
    result = calculate_game_result(game_type, raw_result)
    steps.append(f"4. Game Result ({game_type}): {result}")
    return VerificationResponse(is_valid=True, server_seed_hash=server_seed_hash, combined_seed=f"{client_seed}:{nonce}", result=result, raw_result=raw_result, game_type=game_type, calculation_steps=steps)

# =============================================================================
# API ROUTES
# =============================================================================

@api_router.get("/")
def root():
    return {"message": "RazerBet Provably Fair API", "version": "1.0.0"}

@api_router.get("/games")
def get_game_types():
    return {"games": GAME_TYPES}

@api_router.post("/verify", response_model=VerificationResponse)
def verify_game_result(request: VerificationRequest):
    if request.game_type not in GAME_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid game type. Must be one of: {GAME_TYPES}")
    if request.nonce < 0:
        raise HTTPException(status_code=400, detail="Nonce must be non-negative")
    return verify_game(request.server_seed, request.client_seed, request.nonce, request.game_type)

@api_router.post("/seeds/generate")
def generate_seed_pair(client_seed: Optional[str] = None):
    server_seed = generate_server_seed()
    server_seed_hash = hash_server_seed(server_seed)
    client_seed = client_seed or secrets.token_hex(16)
    return {"server_seed_hash": server_seed_hash, "client_seed": client_seed, "nonce": 0, "message": "Server seed is hidden until game completion"}

@api_router.post("/verify-hash")
def verify_hash(server_seed: str = Query(...), expected_hash: str = Query(...)):
    actual_hash = hash_server_seed(server_seed)
    return {"matches": actual_hash == expected_hash, "server_seed": server_seed, "expected_hash": expected_hash, "actual_hash": actual_hash}

# Bot API helper
def verify_bot_api_key(x_api_key: str):
    if x_api_key != BOT_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

@api_router.post("/bot/game")
def record_game(game: GameRecordCreate, x_api_key: str = Header(None)):
    verify_bot_api_key(x_api_key)
    if game.game_type not in GAME_TYPES:
        raise HTTPException(status_code=400, detail="Invalid game type")
    
    database = get_db()
    verification = verify_game(game.server_seed, game.client_seed, game.nonce, game.game_type)
    
    record = {
        "id": str(uuid.uuid4()),
        "game_type": game.game_type,
        "server_seed": game.server_seed,
        "server_seed_hash": verification.server_seed_hash,
        "client_seed": game.client_seed,
        "nonce": game.nonce,
        "result": verification.result,
        "raw_result": verification.raw_result,
        "user_id": game.user_id,
        "username": game.username,
        "bet_amount": game.bet_amount,
        "multiplier": game.multiplier,
        "won": game.won,
        "payout": game.payout,
        "currency": game.currency,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "verified": True
    }
    
    if database:
        database.game_history.insert_one(record)
    return {"success": True, "game_id": record["id"], "server_seed_hash": verification.server_seed_hash}

@api_router.get("/history")
def get_game_history(limit: int = Query(50, le=100), game_type: Optional[str] = None, user_id: Optional[str] = None):
    database = get_db()
    if not database:
        return {"games": [], "count": 0}
    
    query = {}
    if game_type:
        query["game_type"] = game_type
    if user_id:
        query["user_id"] = user_id
    
    games = list(database.game_history.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit))
    
    for game in games:
        if 'username' in game:
            name = game['username']
            if len(name) > 4:
                game['username'] = name[:2] + '*' * (len(name) - 4) + name[-2:]
    
    return {"games": games, "count": len(games)}

@api_router.get("/stats")
def get_stats():
    database = get_db()
    if not database:
        return ApiStats(total_games=0, total_verified=0, games_by_type={}, recent_games_count=0)
    
    total_games = database.game_history.count_documents({})
    pipeline = [{"$group": {"_id": "$game_type", "count": {"$sum": 1}}}]
    games_by_type = {}
    for doc in database.game_history.aggregate(pipeline):
        games_by_type[doc["_id"]] = doc["count"]
    return ApiStats(total_games=total_games, total_verified=total_games, games_by_type=games_by_type, recent_games_count=min(total_games, 100))

@api_router.get("/user/{identifier}/stats")
def get_user_stats(identifier: str):
    database = get_db()
    if not database:
        raise HTTPException(status_code=404, detail="Database not configured")
    
    query = {"$or": [{"user_id": identifier}, {"username": {"$regex": f"^{identifier}$", "$options": "i"}}]}
    
    total_games = database.game_history.count_documents(query)
    if total_games == 0:
        raise HTTPException(status_code=404, detail="User not found or has no games")
    
    wins = database.game_history.count_documents({**query, "won": True})
    losses = total_games - wins
    
    pipeline = [{"$match": query}, {"$group": {"_id": None, "total_wagered": {"$sum": "$bet_amount"}, "total_payout": {"$sum": "$payout"}, "games_by_type": {"$push": "$game_type"}}}]
    agg_result = list(database.game_history.aggregate(pipeline))
    
    total_wagered = agg_result[0].get("total_wagered", 0) if agg_result else 0
    total_payout = agg_result[0].get("total_payout", 0) if agg_result else 0
    games_by_type = {}
    if agg_result:
        for gt in agg_result[0].get("games_by_type", []):
            games_by_type[gt] = games_by_type.get(gt, 0) + 1
    
    profit = total_payout - total_wagered
    win_rate = round((wins / total_games) * 100, 2) if total_games > 0 else 0
    
    recent_games = list(database.game_history.find(query, {"_id": 0, "server_seed": 0}).sort("timestamp", -1).limit(10))
    
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

# Seed management endpoints
@api_router.post("/bot/seeds/create")
def create_seeds_for_user(user_id: str, client_seed: Optional[str] = None, x_api_key: str = Header(None)):
    verify_bot_api_key(x_api_key)
    database = get_db()
    
    server_seed = generate_server_seed()
    server_seed_hash = hash_server_seed(server_seed)
    client_seed = client_seed or secrets.token_hex(16)
    
    doc = {"id": str(uuid.uuid4()), "user_id": user_id, "server_seed": server_seed, "server_seed_hash": server_seed_hash, "client_seed": client_seed, "nonce": 0, "active": True, "created_at": datetime.now(timezone.utc).isoformat()}
    
    if database:
        database.user_seeds.update_many({"user_id": user_id, "active": True}, {"$set": {"active": False}})
        database.user_seeds.insert_one(doc)
    
    return {"id": doc["id"], "server_seed_hash": server_seed_hash, "client_seed": client_seed, "nonce": 0}

@api_router.get("/bot/seeds/{user_id}")
def get_user_seeds(user_id: str, x_api_key: str = Header(None)):
    verify_bot_api_key(x_api_key)
    database = get_db()
    if not database:
        raise HTTPException(status_code=503, detail="Database unavailable — add MONGO_URL to Vercel environment variables")
    try:
        seeds = database.user_seeds.find_one({"user_id": user_id, "active": True}, {"_id": 0})
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {str(e)}")
    if not seeds:
        raise HTTPException(status_code=404, detail="No active seeds for user")
    return {"server_seed_hash": seeds["server_seed_hash"], "client_seed": seeds["client_seed"], "nonce": seeds["nonce"]}

@api_router.post("/bot/seeds/{user_id}/reveal")
def reveal_user_seeds(user_id: str, x_api_key: str = Header(None)):
    verify_bot_api_key(x_api_key)
    database = get_db()
    if not database:
        raise HTTPException(status_code=503, detail="Database unavailable — add MONGO_URL to Vercel environment variables")
    try:
        seeds = database.user_seeds.find_one({"user_id": user_id, "active": True}, {"_id": 0})
        if not seeds:
            raise HTTPException(status_code=404, detail="No active seeds for user")
        database.user_seeds.update_one({"id": seeds["id"]}, {"$set": {"active": False, "revealed_at": datetime.now(timezone.utc).isoformat()}})
        new_server_seed = generate_server_seed()
        new_server_seed_hash = hash_server_seed(new_server_seed)
        new_doc = {"id": str(uuid.uuid4()), "user_id": user_id, "server_seed": new_server_seed, "server_seed_hash": new_server_seed_hash, "client_seed": seeds["client_seed"], "nonce": 0, "active": True, "created_at": datetime.now(timezone.utc).isoformat()}
        database.user_seeds.insert_one(new_doc)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {str(e)}")
    return {"revealed_server_seed": seeds["server_seed"], "revealed_server_seed_hash": seeds["server_seed_hash"], "new_server_seed_hash": new_server_seed_hash, "client_seed": seeds["client_seed"]}

@api_router.post("/bot/seeds/{user_id}/increment-nonce")
def increment_nonce(user_id: str, x_api_key: str = Header(None)):
    verify_bot_api_key(x_api_key)
    database = get_db()
    if not database:
        raise HTTPException(status_code=503, detail="Database unavailable — add MONGO_URL to Vercel environment variables")
    try:
        result = database.user_seeds.find_one_and_update({"user_id": user_id, "active": True}, {"$inc": {"nonce": 1}}, return_document=True)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {str(e)}")
    if not result:
        raise HTTPException(status_code=404, detail="No active seeds for user")
    return {"nonce": result["nonce"]}

# Include router and add CORS
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

