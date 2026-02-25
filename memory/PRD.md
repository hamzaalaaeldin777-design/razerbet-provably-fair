# RazerBet Provably Fair - Product Requirements Document

## Original Problem Statement
Build a provably fair verification website for RazerBet Discord gambling bot. Features include verification tool using HMAC-SHA256, live game history feed, educational section. Games: Blackjack, Tower, Dices War, Mines, Coinflip, Match, Crash. Dark theme with red-yellow/orange accents. Discord invite: discord.gg/razerbet

## User Personas
1. **Discord Gamblers** - Users who play games on the RazerBet Discord bot and want to verify fairness
2. **Bot Operators** - The RazerBet team who needs API integration for recording games
3. **Skeptics** - Users who want to understand how provably fair works before trusting the platform

## Core Requirements
- [x] HMAC-SHA256 based provably fair verification
- [x] Support for 7 game types
- [x] Verification tool for users to manually verify games
- [x] Live game history feed from Discord bot
- [x] Educational section explaining provably fair
- [x] Dark theme with orange-red accents
- [x] Discord integration (invite link, branding)
- [x] API for Discord bot integration

## Architecture
- **Frontend**: React with Tailwind CSS, Shadcn UI components
- **Backend**: FastAPI with HMAC-SHA256 verification logic
- **Database**: MongoDB for game history and seed storage
- **Authentication**: API key for bot endpoints

## What's Been Implemented (Jan 2026)
1. ✅ Full verification API with HMAC-SHA256
2. ✅ 7 game type algorithms (Coinflip, Crash, Mines, Tower, Blackjack, Dices War, Match)
3. ✅ Bot API endpoints (record game, seed management, nonce tracking)
4. ✅ Game history feed with filtering
5. ✅ Statistics endpoint
6. ✅ Hero section with logo and Discord CTA
7. ✅ Verification Tool with terminal-style output
8. ✅ Live Feed section with real-time updates
9. ✅ How It Works educational accordion
10. ✅ Games section showing all 7 games
11. ✅ API documentation (API_DOCS.md)
12. ✅ Bot integration guide (BOT_INTEGRATION_GUIDE.md)

## API Endpoints
### Public
- GET /api/games - List supported games
- POST /api/verify - Verify game result
- GET /api/history - Get game history
- GET /api/stats - Get statistics
- POST /api/verify-hash - Verify server seed hash

### Bot (Protected)
- POST /api/bot/game - Record game
- POST /api/bot/seeds/create - Create seeds
- GET /api/bot/seeds/{user_id} - Get user seeds
- POST /api/bot/seeds/{user_id}/reveal - Reveal and rotate
- POST /api/bot/seeds/{user_id}/increment-nonce - Increment nonce

## Prioritized Backlog
### P0 (Done)
- Core verification functionality
- Game algorithms
- UI/UX

### P1 (Next)
- Add rate limiting
- Implement caching for frequently accessed data
- Add more detailed game history (individual moves for games like Mines/Tower)

### P2 (Future)
- WebSocket for real-time live feed
- User accounts for saving verification history
- Multi-language support
- Mobile app

## Next Tasks
1. User to integrate API with Discord bot using BOT_INTEGRATION_GUIDE.md
2. Change BOT_API_KEY in production
3. Add rate limiting if needed
4. Consider WebSocket for real-time feed
