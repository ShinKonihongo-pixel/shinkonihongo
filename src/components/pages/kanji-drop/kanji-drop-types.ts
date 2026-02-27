// Kanji Drop game type definitions

import type { JLPTLevel } from '../../../types/flashcard';

// --- Tile & Slot ---

export interface PoolTile {
  id: string;           // unique tile ID (e.g., "tile-0")
  kanjiChar: string;    // the kanji character displayed
  kanjiId: string;      // reference to KanjiCard.id
  meaning: string;      // Vietnamese meaning (tooltip)
  selected: boolean;    // already picked from pool?
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
}

// --- Setup Config ---

export interface SetupConfig {
  selectedLevels: JLPTLevel[];
  startLevel: number;
}

