// Kanji Drop game constants and level configurations

import type { LevelConfig } from './kanji-drop-types';

// Bottom row size
export const BOTTOM_ROW_SIZE = 10;

// Default locked slots for non-VIP (indices 8, 9)
export const DEFAULT_LOCKED_SLOTS = [8, 9];

// Minimum contiguous tiles to clear
export const MIN_CLEAR_RUN = 3;

// Power-up defaults per level
export const DEFAULT_POWERUP_REWARD_REGULAR = 1;
export const DEFAULT_POWERUP_REWARD_VIP = 2;

// Stacking card dimensions (px)
export const STACK_CARD_W = 56;
export const STACK_CARD_H = 72;

// Base tile count for level 1, increment per level
export const BASE_TILES = 30;
export const TILES_PER_LEVEL = 15;
export const MAX_TILES = 300;

// Clearing animation delay (ms)
export const CLEAR_DELAY_MS = 1000;

// Generate level config: 30 tiles at level 1, +15 per level, cap 300
export function getLevelConfig(level: number, isVip: boolean): LevelConfig {
  const rawTiles = BASE_TILES + (level - 1) * TILES_PER_LEVEL;
  // Round to nearest multiple of 3 for solvability
  const totalTiles = Math.round(Math.min(rawTiles, MAX_TILES) / 3) * 3;
  const kanjiVariety = totalTiles / 3;
  const multiplicities = Array(kanjiVariety).fill(3) as number[];

  // Locked slots: progressively harder
  let lockedSlots: number[];
  if (level >= 20) lockedSlots = [6, 7, 8, 9];
  else if (level >= 10) lockedSlots = [7, 8, 9];
  else lockedSlots = [8, 9];

  return {
    level,
    totalTiles,
    kanjiVariety,
    multiplicities,
    lockedSlots: isVip ? [] : lockedSlots,
    powerUpReward: isVip ? DEFAULT_POWERUP_REWARD_VIP : DEFAULT_POWERUP_REWARD_REGULAR,
  };
}

// Scoring
export const SCORE_PER_CLEAR = 10;       // per tile cleared
export const SCORE_CASCADE_BONUS = 25;   // bonus per cascade after first
export const SCORE_LEVEL_COMPLETE = 100; // bonus for completing level

// localStorage key for progress
export const STORAGE_KEY = 'kanji-drop-progress';
