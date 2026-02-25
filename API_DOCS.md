# RazerBet Provably Fair API Documentation

## Base URL
```
https://razerbet.xyz/api
```

## Authentication
Bot endpoints require an API key in the `X-API-KEY` header.
```
X-API-KEY: your_api_key_here
```

---

## Public Endpoints

### 1. Get Supported Games
```http
GET /api/games
```

**Response:**
```json
{
  "games": ["blackjack", "tower", "dices_war", "mines", "coinflip", "match", "crash"]
}
```

---

### 2. Verify Game Result
```http
POST /api/verify
Content-Type: application/json
```

**Request Body:**
```json
{
  "server_seed": "abc123...",
  "client_seed": "player_seed_123",
  "nonce": 5,
  "game_type": "coinflip"
}
```

**Response:**
```json
{
  "is_valid": true,
  "server_seed_hash": "sha256_hash_of_server_seed",
  "combined_seed": "player_seed_123:5",
  "result": {
    "outcome": "heads",
    "roll": 42.35
  },
  "raw_result": 0.4235,
  "game_type": "coinflip",
  "calculation_steps": [
    "1. Server Seed Hash: SHA256(abc123...) = ...",
    "2. HMAC Result: HMAC-SHA256(...) = ...",
    "3. Raw Result: hex_to_float(...) = 0.42350000",
    "4. Game Result (coinflip): {\"outcome\": \"heads\", \"roll\": 42.35}"
  ]
}
```

---

### 3. Get Game History
```http
GET /api/history?limit=50&game_type=coinflip&user_id=123
```

**Query Parameters:**
- `limit` (optional): Max 100, default 50
- `game_type` (optional): Filter by game type
- `user_id` (optional): Filter by user

**Response:**
```json
{
  "games": [
    {
      "id": "uuid",
      "game_type": "coinflip",
      "server_seed_hash": "...",
      "result": {...},
      "username": "pl***er",
      "bet_amount": 0.01,
      "multiplier": 2.0,
      "won": true,
      "payout": 0.02,
      "currency": "ETH",
      "timestamp": "2024-01-01T12:00:00Z"
    }
  ],
  "count": 1
}
```

---

### 4. Get Stats
```http
GET /api/stats
```

**Response:**
```json
{
  "total_games": 1000,
  "total_verified": 1000,
  "games_by_type": {
    "coinflip": 500,
    "crash": 300,
    "mines": 200
  },
  "recent_games_count": 100
}
```

---

### 5. Verify Hash
```http
POST /api/verify-hash?server_seed=abc123&expected_hash=sha256hash
```

**Response:**
```json
{
  "matches": true,
  "server_seed": "abc123",
  "expected_hash": "sha256hash",
  "actual_hash": "sha256hash"
}
```

---

## Bot-Only Endpoints (Require API Key)

### 6. Record Game Result
```http
POST /api/bot/game
X-API-KEY: your_api_key
Content-Type: application/json
```

**Request Body:**
```json
{
  "game_type": "coinflip",
  "server_seed": "your_generated_server_seed",
  "client_seed": "player_client_seed",
  "nonce": 0,
  "user_id": "discord_user_id",
  "username": "PlayerName",
  "bet_amount": 0.01,
  "multiplier": 2.0,
  "won": true,
  "payout": 0.02,
  "currency": "ETH"
}
```

**Response:**
```json
{
  "success": true,
  "game_id": "uuid",
  "server_seed_hash": "sha256_hash"
}
```

---

### 7. Create Seeds for User
```http
POST /api/bot/seeds/create?user_id=123&client_seed=optional_custom_seed
X-API-KEY: your_api_key
```

**Response:**
```json
{
  "id": "seed_pair_id",
  "server_seed_hash": "hash_shown_to_user_before_game",
  "client_seed": "generated_or_custom",
  "nonce": 0
}
```

---

### 8. Get User's Active Seeds
```http
GET /api/bot/seeds/{user_id}
X-API-KEY: your_api_key
```

**Response:**
```json
{
  "server_seed_hash": "hash_to_show_user",
  "client_seed": "current_client_seed",
  "nonce": 5
}
```

---

### 9. Reveal Seeds (Rotate to New)
```http
POST /api/bot/seeds/{user_id}/reveal
X-API-KEY: your_api_key
```

**Response:**
```json
{
  "revealed_server_seed": "the_actual_server_seed",
  "revealed_server_seed_hash": "matches_what_was_shown",
  "new_server_seed_hash": "new_hash_for_next_games",
  "client_seed": "unchanged_client_seed"
}
```

---

### 10. Increment Nonce (After Each Game)
```http
POST /api/bot/seeds/{user_id}/increment-nonce
X-API-KEY: your_api_key
```

**Response:**
```json
{
  "nonce": 6
}
```

---

## Game Result Formats

### Coinflip
```json
{
  "outcome": "heads" | "tails",
  "roll": 42.35
}
```

### Crash
```json
{
  "crash_point": 2.54,
  "raw_value": 60.5432
}
```

### Mines (5 mines out of 25 tiles)
```json
{
  "mine_positions": [3, 7, 12, 18, 22],
  "safe_tiles": [0, 1, 2, 4, 5, ...]
}
```

### Tower (8 levels, 3 positions each)
```json
{
  "correct_path": [1, 0, 2, 1, 0, 2, 1, 0],
  "levels": 8,
  "positions_per_level": 3
}
```

### Dices War
```json
{
  "player_roll": 5,
  "house_roll": 3,
  "winner": "player" | "house" | "tie"
}
```

### Blackjack
```json
{
  "deck_seed": 42,
  "shuffle_index": 0.8234,
  "note": "Full deck shuffle determined by this seed"
}
```

### Match
```json
{
  "match_value": 15,
  "is_match": true,
  "roll": 15.23
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Invalid request (bad game type, negative nonce, etc.) |
| 401 | Invalid or missing API key |
| 404 | Resource not found (user seeds, etc.) |
| 500 | Server error |
