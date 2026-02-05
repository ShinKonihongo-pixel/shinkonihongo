// Bingo Game Utilities

// Generate random 6-digit code
export function generateGameCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Bot auto-join settings
export const BOT_FIRST_JOIN_DELAY = 10000; // 10 seconds - add 1 bot
export const BOT_SECOND_JOIN_DELAY = 20000; // 20 seconds - add 2 more bots
