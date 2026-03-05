// Kanji Drop game type definitions

import type { JLPTLevel } from '../../../types/flashcard';

export const MAX_LEVEL = 100;

// --- Tile & Slot ---

export interface PoolTile {
  id: string;           // unique tile ID (e.g., "tile-0")
  kanjiChar: string;    // the kanji character displayed
  kanjiId: string;      // reference to KanjiCard.id
  meaning: string;      // Vietnamese meaning (tooltip)
  selected: boolean;    // already picked from pool?
  // Stacking position (Mahjong-style layout)
  x: number;            // px offset from container left
  y: number;            // px offset from container top
  zIndex: number;       // stacking layer (higher = on top)
  rotation: number;     // slight random rotation in degrees
  blockedBy: string[];  // IDs of tiles overlapping from above
}

export interface BottomSlot {
  index: number;        // 0-9 position
  tile: PoolTile | null;
  locked: boolean;      // VIP unlocks slots 8-9
}

// --- Power-ups ---

export type PowerUpType = 'shuffle' | 'restore' | 'undo';

export interface PowerUp {
  type: PowerUpType;
  count: number;        // available uses remaining
}

// --- Undo ---

export interface UndoSnapshot {
  pool: PoolTile[];
  bottom: BottomSlot[];
  powerUps: PowerUp[];
  score: number;
  moves: number;
}

// --- Level Config ---

export interface LevelConfig {
  level: number;
  totalTiles: number;
  kanjiVariety: number;       // distinct kanji count
  multiplicities: number[];   // e.g., [3,3,3,3] = 4 kanji x3 each
  lockedSlots: number[];      // indices of locked bottom slots
  powerUpReward: number;      // 1 for regular, 2 for VIP
}

// --- Game State ---

export type GamePhase = 'setup' | 'playing' | 'result';

export type GameResult = 'win' | 'lose' | null;

export interface GameState {
  phase: GamePhase;
  result: GameResult;
  level: number;
  seed: number;
  pool: PoolTile[];
  bottom: BottomSlot[];
  powerUps: PowerUp[];
  undoStack: UndoSnapshot[];  // max 1 snapshot (last pick)
  score: number;
  moves: number;              // total tile picks
  cascadeCount: number;       // total cascades this level
  clearedCount: number;       // total tiles cleared
  isVip: boolean;
  selectedJlptLevels: JLPTLevel[];
  clearingIndices: number[];  // bottom slot indices being cleared (for dissolve animation)
  mode?: 'single' | 'multi';
  levelStart?: number;        // multiplayer level range start
  levelEnd?: number;          // multiplayer level range end
  levelsCompleted?: number;   // total levels cleared (for multiplayer tracking)
}

// --- Setup Config ---

export interface SetupConfig {
  selectedLevels: JLPTLevel[];
  startLevel: number;
  selectedLessonIds: string[];  // filter kanji by specific lessons
}

