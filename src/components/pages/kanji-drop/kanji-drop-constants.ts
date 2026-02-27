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

// Level configurations (levels 1-20+)
export const LEVEL_CONFIGS: LevelConfig[] = [
  // Levels 1-3: 12 tiles, 4 kanji x3
  { level: 1, totalTiles: 12, kanjiVariety: 4, multiplicities: [3, 3, 3, 3], lockedSlots: [8, 9], powerUpReward: 1 },
  { level: 2, totalTiles: 12, kanjiVariety: 4, multiplicities: [3, 3, 3, 3], lockedSlots: [8, 9], powerUpReward: 1 },
  { level: 3, totalTiles: 12, kanjiVariety: 4, multiplicities: [3, 3, 3, 3], lockedSlots: [8, 9], powerUpReward: 1 },
  // Levels 4-8: 18 tiles, mixed multiplicities
  { level: 4, totalTiles: 18, kanjiVariety: 5, multiplicities: [4, 4, 4, 3, 3], lockedSlots: [8, 9], powerUpReward: 1 },
  { level: 5, totalTiles: 18, kanjiVariety: 5, multiplicities: [4, 4, 3, 4, 3], lockedSlots: [8, 9], powerUpReward: 1 },
  { level: 6, totalTiles: 18, kanjiVariety: 6, multiplicities: [3, 3, 3, 3, 3, 3], lockedSlots: [8, 9], powerUpReward: 1 },
  { level: 7, totalTiles: 18, kanjiVariety: 5, multiplicities: [4, 4, 4, 3, 3], lockedSlots: [8, 9], powerUpReward: 1 },
  { level: 8, totalTiles: 18, kanjiVariety: 6, multiplicities: [3, 3, 3, 3, 3, 3], lockedSlots: [8, 9], powerUpReward: 1 },
  // Levels 9-15: 24-30 tiles, occasional extra locks
  { level: 9, totalTiles: 24, kanjiVariety: 7, multiplicities: [4, 4, 4, 3, 3, 3, 3], lockedSlots: [8, 9], powerUpReward: 1 },
  { level: 10, totalTiles: 24, kanjiVariety: 8, multiplicities: [3, 3, 3, 3, 3, 3, 3, 3], lockedSlots: [7, 8, 9], powerUpReward: 1 },
  { level: 11, totalTiles: 27, kanjiVariety: 9, multiplicities: [3, 3, 3, 3, 3, 3, 3, 3, 3], lockedSlots: [8, 9], powerUpReward: 1 },
  { level: 12, totalTiles: 27, kanjiVariety: 8, multiplicities: [4, 4, 4, 3, 3, 3, 3, 3], lockedSlots: [7, 8, 9], powerUpReward: 1 },
  { level: 13, totalTiles: 30, kanjiVariety: 9, multiplicities: [4, 4, 3, 3, 4, 3, 3, 3, 3], lockedSlots: [8, 9], powerUpReward: 1 },
  { level: 14, totalTiles: 30, kanjiVariety: 10, multiplicities: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3], lockedSlots: [7, 8, 9], powerUpReward: 1 },
  { level: 15, totalTiles: 30, kanjiVariety: 9, multiplicities: [4, 4, 4, 3, 3, 3, 3, 3, 3], lockedSlots: [8, 9], powerUpReward: 1 },
  // Level 16+: 40+ tiles
  { level: 16, totalTiles: 40, kanjiVariety: 12, multiplicities: [4, 4, 4, 4, 3, 3, 3, 3, 3, 3, 3, 3], lockedSlots: [7, 8, 9], powerUpReward: 1 },
  { level: 17, totalTiles: 40, kanjiVariety: 12, multiplicities: [4, 4, 3, 3, 4, 3, 3, 3, 3, 4, 3, 3], lockedSlots: [7, 8, 9], powerUpReward: 1 },
  { level: 18, totalTiles: 42, kanjiVariety: 13, multiplicities: [4, 4, 4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3], lockedSlots: [7, 8, 9], powerUpReward: 1 },
  { level: 19, totalTiles: 45, kanjiVariety: 13, multiplicities: [4, 4, 4, 4, 4, 3, 3, 3, 3, 3, 3, 4, 3], lockedSlots: [7, 8, 9], powerUpReward: 1 },
  { level: 20, totalTiles: 48, kanjiVariety: 14, multiplicities: [4, 4, 4, 4, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4], lockedSlots: [7, 8, 9], powerUpReward: 1 },
];

// Get config for level (clamp to last defined level for 21+)
export function getLevelConfig(level: number, isVip: boolean): LevelConfig {
  const idx = Math.min(level - 1, LEVEL_CONFIGS.length - 1);
  const base = LEVEL_CONFIGS[idx];
  return {
    ...base,
    level,
    lockedSlots: isVip ? [] : base.lockedSlots,
    powerUpReward: isVip ? DEFAULT_POWERUP_REWARD_VIP : DEFAULT_POWERUP_REWARD_REGULAR,
  };
}

// Scoring
export const SCORE_PER_CLEAR = 10;       // per tile cleared
export const SCORE_CASCADE_BONUS = 25;   // bonus per cascade after first
export const SCORE_LEVEL_COMPLETE = 100; // bonus for completing level

// localStorage key for progress
export const STORAGE_KEY = 'kanji-drop-progress';
