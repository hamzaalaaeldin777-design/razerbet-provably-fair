export async function hmacSha256(key, message) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256(message) {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(message));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateRandomHex(length = 64) {
  return Array.from(crypto.getRandomValues(new Uint8Array(length / 2)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

export function calculateCrashPoint(hash) {
  const h = parseInt(hash.slice(0, 8), 16);
  const result = h / 0xFFFFFFFF;
  if (result >= 0.99) return 100.0;
  const crashPoint = (1 - 0.01) / (1 - result);
  return Math.max(1.0, Math.round(crashPoint * 100) / 100);
}

export function getMinePositions(hash, mineCount, totalTiles = 25) {
  const positions = [];
  let offset = 0;
  while (positions.length < mineCount && offset + 8 <= hash.length) {
    const hexSlice = hash.slice(offset, offset + 8);
    const val = parseInt(hexSlice, 16) % totalTiles;
    if (!positions.includes(val)) positions.push(val);
    offset += 2;
  }
  return positions.sort((a, b) => a - b);
}

export const TOWER_CONFIGS = {
  easy: { tiles: 4, bombs: 1, rows: 8, label: 'Easy (4 Tiles, 1 Bomb)' },
  medium: { tiles: 3, bombs: 1, rows: 8, label: 'Medium (3 Tiles, 1 Bomb)' },
  hard: { tiles: 2, bombs: 1, rows: 8, label: 'Hard (2 Tiles, 1 Bomb)' },
  extreme: { tiles: 3, bombs: 2, rows: 8, label: 'Extreme (3 Tiles, 2 Bombs)' },
};

export async function getTowerRows(serverSeed, clientSeed, difficulty) {
  const config = TOWER_CONFIGS[difficulty] || TOWER_CONFIGS.medium;
  const rows = [];
  for (let row = 0; row < config.rows; row++) {
    const hash = await hmacSha256(serverSeed, `${clientSeed}${row}`);
    const bombs = [];
    let offset = 0;
    while (bombs.length < config.bombs && offset + 4 <= hash.length) {
      const val = parseInt(hash.slice(offset, offset + 4), 16) % config.tiles;
      if (!bombs.includes(val)) bombs.push(val);
      offset += 2;
    }
    const safe = Array.from({ length: config.tiles }, (_, i) => i).filter(i => !bombs.includes(i));
    rows.push({ bombs, safe, tiles: config.tiles });
  }
  return rows;
}

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function getStandardDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

export function getSuitColor(suit) {
  return (suit === '♥' || suit === '♦') ? 'text-red-400' : 'text-white';
}

export function shuffleDeck(deck, hash) {
  const shuffled = [...deck];
  let seedHex = hash.slice(0, 16);
  let seed = parseInt(seedHex, 16);
  for (let i = shuffled.length - 1; i > 0; i--) {
    seed = Math.abs((seed * 1664525 + 1013904223) & 0x7fffffff);
    const j = seed % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const MATCH_MULTIPLIERS_BASE = [0.2, 0.5, 0.5, 1.5, 1.5, 2, 2, 3, 3, 5, 5, 10, 10, 25, 25, 50, 50, 100, 100, 0.2];

export function getMatchBoard(hash) {
  const board = [...MATCH_MULTIPLIERS_BASE];
  let seed = parseInt(hash.slice(0, 8), 16);
  for (let i = board.length - 1; i > 0; i--) {
    seed = Math.abs((seed * 1664525 + 1013904223) & 0x7fffffff);
    const j = seed % (i + 1);
    [board[i], board[j]] = [board[j], board[i]];
  }
  return board;
}

export function getDiceWarResult(messageId) {
  const reversed = messageId.split('').reverse().join('');
  const valid = [];
  for (const ch of reversed) {
    const n = parseInt(ch);
    if (n >= 1 && n <= 6) valid.push(n);
    if (valid.length === 2) break;
  }
  return {
    userDie: valid[0] || null,
    botDie: valid[1] || null,
    reversed,
    fallback: valid.length < 2,
    winner: valid.length === 2 ? (valid[0] > valid[1] ? 'user' : valid[0] < valid[1] ? 'bot' : 'tie') : null,
  };
}
