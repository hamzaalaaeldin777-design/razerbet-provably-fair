# Discord Bot Integration Guide for RazerBet Provably Fair

## Overview
This guide explains how to integrate the RazerBet Provably Fair API into your Discord gambling bot.

---

## Setup

### 1. Get Your API Key
Your API key is stored in the backend environment:
```
BOT_API_KEY=razerbet_api_key_change_this_in_production
```
**IMPORTANT:** Change this to a secure random key in production!

### 2. API Base URL
```
https://razerbet.xyz/api
```

---

## Integration Flow

### Step 1: Initialize User Seeds
When a user first plays or requests new seeds:

```javascript
// JavaScript/Node.js Example
const axios = require('axios');

const API_URL = 'https://razerbet.xyz/api';
const API_KEY = 'your_api_key';

async function initUserSeeds(userId, clientSeed = null) {
    const params = clientSeed 
        ? `?user_id=${userId}&client_seed=${clientSeed}`
        : `?user_id=${userId}`;
        
    const response = await axios.post(
        `${API_URL}/bot/seeds/create${params}`,
        {},
        { headers: { 'X-API-KEY': API_KEY } }
    );
    
    return response.data;
    // Returns: { id, server_seed_hash, client_seed, nonce }
}

// Show user their seed info
const seeds = await initUserSeeds('123456789');
message.reply(`🔒 Your seeds are set!\n` +
    `Server Seed Hash: \`${seeds.server_seed_hash}\`\n` +
    `Client Seed: \`${seeds.client_seed}\`\n` +
    `Nonce: ${seeds.nonce}`);
```

### Step 2: Get Current Seeds Before Game
```javascript
async function getUserSeeds(userId) {
    const response = await axios.get(
        `${API_URL}/bot/seeds/${userId}`,
        { headers: { 'X-API-KEY': API_KEY } }
    );
    return response.data;
    // Returns: { server_seed_hash, client_seed, nonce }
}
```

### Step 3: Generate Game Result (Your Bot Logic)
Your bot should calculate the game result locally using the SAME algorithm:

```javascript
const crypto = require('crypto');

function generateHMACResult(serverSeed, clientSeed, nonce) {
    const message = `${clientSeed}:${nonce}`;
    return crypto
        .createHmac('sha256', serverSeed)
        .update(message)
        .digest('hex');
}

function hexToFloat(hexString) {
    const intValue = parseInt(hexString.slice(0, 8), 16);
    return intValue / Math.pow(16, 8);
}

function getCoinflipResult(serverSeed, clientSeed, nonce) {
    const hmac = generateHMACResult(serverSeed, clientSeed, nonce);
    const rawResult = hexToFloat(hmac);
    return {
        outcome: rawResult < 0.5 ? 'heads' : 'tails',
        roll: Math.round(rawResult * 10000) / 100
    };
}

function getCrashResult(serverSeed, clientSeed, nonce) {
    const hmac = generateHMACResult(serverSeed, clientSeed, nonce);
    const rawResult = hexToFloat(hmac);
    const houseEdge = 0.01;
    let crashPoint = Math.max(1.0, (1 - houseEdge) / (1 - rawResult));
    if (rawResult > 0.99) crashPoint = 100.0;
    return {
        crash_point: Math.round(crashPoint * 100) / 100,
        raw_value: Math.round(rawResult * 10000) / 10000
    };
}

function getMinesResult(serverSeed, clientSeed, nonce) {
    const hmac = generateHMACResult(serverSeed, clientSeed, nonce);
    let rawResult = hexToFloat(hmac);
    const positions = [];
    
    for (let i = 0; i < 5; i++) {
        let pos = Math.floor(rawResult * 25) % 25;
        while (positions.includes(pos)) {
            pos = (pos + 1) % 25;
        }
        positions.push(pos);
        rawResult = (rawResult * 1000) % 1;
    }
    
    return {
        mine_positions: positions.sort((a, b) => a - b),
        safe_tiles: Array.from({length: 25}, (_, i) => i)
            .filter(i => !positions.includes(i))
    };
}
```

### Step 4: Record Game Result
After the game completes:

```javascript
async function recordGame(gameData) {
    const response = await axios.post(
        `${API_URL}/bot/game`,
        gameData,
        { headers: { 'X-API-KEY': API_KEY } }
    );
    return response.data;
}

// Example usage
const gameResult = await recordGame({
    game_type: 'coinflip',
    server_seed: currentServerSeed,  // Your stored server seed
    client_seed: userSeeds.client_seed,
    nonce: userSeeds.nonce,
    user_id: '123456789',
    username: 'PlayerName',
    bet_amount: 0.01,
    multiplier: 2.0,
    won: result.outcome === userChoice,
    payout: won ? betAmount * 2 : 0,
    currency: 'ETH'
});
```

### Step 5: Increment Nonce After Each Game
```javascript
async function incrementNonce(userId) {
    const response = await axios.post(
        `${API_URL}/bot/seeds/${userId}/increment-nonce`,
        {},
        { headers: { 'X-API-KEY': API_KEY } }
    );
    return response.data.nonce;
}
```

### Step 6: Reveal Seeds (On User Request)
When a user wants to verify their past games:

```javascript
async function revealSeeds(userId) {
    const response = await axios.post(
        `${API_URL}/bot/seeds/${userId}/reveal`,
        {},
        { headers: { 'X-API-KEY': API_KEY } }
    );
    
    return response.data;
    // Returns: { 
    //   revealed_server_seed,
    //   revealed_server_seed_hash, 
    //   new_server_seed_hash,
    //   client_seed 
    // }
}

// Show user their revealed seed
const revealed = await revealSeeds('123456789');
message.reply(`🔓 Seeds Revealed!\n` +
    `Server Seed: \`${revealed.revealed_server_seed}\`\n` +
    `Hash (verify it matches): \`${revealed.revealed_server_seed_hash}\`\n\n` +
    `🔒 New seed hash for future games: \`${revealed.new_server_seed_hash}\`\n\n` +
    `✅ Verify at: https://razerbet.xyz`);
```

---

## Complete Bot Command Examples

### !coinflip command
```javascript
bot.on('message', async (message) => {
    if (message.content.startsWith('!coinflip')) {
        const args = message.content.split(' ');
        const choice = args[1]; // heads or tails
        const betAmount = parseFloat(args[2]);
        const userId = message.author.id;
        
        // Get user's current seeds
        let seeds;
        try {
            seeds = await getUserSeeds(userId);
        } catch (e) {
            seeds = await initUserSeeds(userId);
        }
        
        // Get stored server seed for this user (from your DB)
        const serverSeed = await getServerSeedFromDB(userId);
        
        // Calculate result
        const result = getCoinflipResult(
            serverSeed, 
            seeds.client_seed, 
            seeds.nonce
        );
        
        const won = result.outcome === choice;
        const payout = won ? betAmount * 2 : 0;
        
        // Record the game
        await recordGame({
            game_type: 'coinflip',
            server_seed: serverSeed,
            client_seed: seeds.client_seed,
            nonce: seeds.nonce,
            user_id: userId,
            username: message.author.username,
            bet_amount: betAmount,
            multiplier: 2.0,
            won: won,
            payout: payout,
            currency: 'ETH'
        });
        
        // Increment nonce for next game
        await incrementNonce(userId);
        
        // Send result
        message.reply(
            `🎰 **Coinflip Result**\n` +
            `Choice: ${choice}\n` +
            `Result: **${result.outcome}**\n` +
            `${won ? '✅ You WON!' : '❌ You lost'}\n` +
            `Payout: ${payout} ETH\n\n` +
            `🔐 Verify: Server Hash: \`${crypto.createHash('sha256').update(serverSeed).digest('hex').slice(0,16)}...\``
        );
    }
});
```

### !seeds command
```javascript
bot.on('message', async (message) => {
    if (message.content === '!seeds') {
        const userId = message.author.id;
        
        try {
            const seeds = await getUserSeeds(userId);
            message.reply(
                `🔒 **Your Current Seeds**\n` +
                `Server Seed Hash: \`${seeds.server_seed_hash}\`\n` +
                `Client Seed: \`${seeds.client_seed}\`\n` +
                `Nonce: ${seeds.nonce}\n\n` +
                `Use \`!reveal\` to see your server seed and rotate to new seeds.`
            );
        } catch (e) {
            const seeds = await initUserSeeds(userId);
            message.reply(
                `🆕 **Seeds Created!**\n` +
                `Server Seed Hash: \`${seeds.server_seed_hash}\`\n` +
                `Client Seed: \`${seeds.client_seed}\`\n` +
                `Nonce: 0`
            );
        }
    }
});
```

### !reveal command
```javascript
bot.on('message', async (message) => {
    if (message.content === '!reveal') {
        const userId = message.author.id;
        
        try {
            const revealed = await revealSeeds(userId);
            message.reply(
                `🔓 **Seeds Revealed!**\n\n` +
                `**Previous Server Seed:**\n\`${revealed.revealed_server_seed}\`\n\n` +
                `**Hash (should match what was shown):**\n\`${revealed.revealed_server_seed_hash}\`\n\n` +
                `✅ **Verify your games at:** https://razerbet.xyz\n\n` +
                `🔒 **New seed hash for future games:**\n\`${revealed.new_server_seed_hash}\``
            );
        } catch (e) {
            message.reply('❌ No seeds found. Play a game first!');
        }
    }
});
```

### !setseed command (custom client seed)
```javascript
bot.on('message', async (message) => {
    if (message.content.startsWith('!setseed')) {
        const clientSeed = message.content.split(' ')[1];
        const userId = message.author.id;
        
        if (!clientSeed) {
            message.reply('Usage: `!setseed your_custom_seed`');
            return;
        }
        
        const seeds = await initUserSeeds(userId, clientSeed);
        message.reply(
            `✅ **Custom seed set!**\n` +
            `Client Seed: \`${seeds.client_seed}\`\n` +
            `Server Seed Hash: \`${seeds.server_seed_hash}\`\n` +
            `Nonce reset to: 0`
        );
    }
});
```

---

## AI Prompt for Your Coding AI

Here's a prompt you can give to your coding AI to implement provably fair in your existing bot:

```
Implement provably fair gambling for my Discord bot using the RazerBet API.

API Base URL: https://razerbet.xyz/api
API Key Header: X-API-KEY: [your_key]

Key endpoints:
- POST /bot/seeds/create?user_id={id} - Create seeds for user
- GET /bot/seeds/{user_id} - Get user's current seeds
- POST /bot/seeds/{user_id}/reveal - Reveal and rotate seeds
- POST /bot/seeds/{user_id}/increment-nonce - Increment after game
- POST /bot/game - Record game result

Game calculation (must match server):
1. HMAC = HMAC-SHA256(server_seed, "client_seed:nonce")
2. raw_result = parseInt(HMAC.slice(0,8), 16) / (16^8)
3. Apply game-specific formula to raw_result

For each game command:
1. Get/create user seeds
2. Calculate result using HMAC-SHA256
3. Process bet
4. Call POST /bot/game to record
5. Call increment-nonce
6. Show result with hash preview

Commands needed:
- !seeds - Show current seed info
- !reveal - Reveal server seed and rotate
- !setseed [seed] - Set custom client seed
- [game commands] - Each should record to API

Verify at: https://razerbet.xyz
```

---

## Security Notes

1. **Never expose your API key** in client-side code
2. **Store server seeds securely** - they should only be revealed after rotation
3. **Always validate bets** before processing
4. **Use HTTPS** for all API calls
5. **Change the default API key** in production

---

## Support

- Website: https://razerbet.xyz
- Discord: https://discord.gg/razerbet
