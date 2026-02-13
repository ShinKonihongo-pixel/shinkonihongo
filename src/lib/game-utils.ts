// Shared game utility functions
// Extracted from duplicate implementations across hooks and services

/** Generate a 6-character uppercase game code */
export function generateGameCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/** Generate a unique ID combining random string and timestamp */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

/** Shuffle array using Fisher-Yates algorithm (returns new array) */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
