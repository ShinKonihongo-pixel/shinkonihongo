# Phase 1: Types & Data Model

**Parent**: [plan.md](./plan.md)
**Dependencies**: None
**Date**: 2026-02-27 | **Priority**: High | **Status**: Pending

## Overview

Define all TypeScript types, interfaces, and constants for the Kanji Drop game. Two files: `kanji-drop-types.ts` (types) and `kanji-drop-constants.ts` (level configs, defaults).

## Key Insights

- Follow word-scramble pattern: types file + constants file, both re-exported via `index.ts`
- KanjiCard from `src/types/kanji.ts` provides `character`, `jlptLevel`, `meaning`, `sinoVietnamese`
- VIP check via `isVipRole()` from `src/utils/vip-styling.ts` -- role string passed as prop
- GameSession tracking follows existing pattern: `{ date, gameTitle, rank, totalPlayers, score, correctAnswers, totalQuestions }`

## Requirements

1. Tile type: id, kanjiChar, kanjiId (ref to KanjiCard), selected status
2. BottomSlot: index, tile or null, locked boolean
3. GameState: phase (setup|playing|result), level, pool tiles, bottom slots, power-ups, score, moves count
4. PowerUp: type (shuffle|restore|undo), available count, used boolean per instance
5. LevelConfig: level number, total tiles, kanji variety, multiplicity distribution, locked slot indices, power-up reward count
6. UndoSnapshot: pool state + bottom slots state for undo power-up
7. GamePhase: `'setup' | 'playing' | 'result'`
8. PageProps: mirrors WordScramblePageProps pattern (onClose, kanjiCards, currentUser, onSaveGameSession)

## Architecture

### File: `src/components/pages/kanji-drop/kanji-drop-types.ts`

```typescript
import type { KanjiCard } from '../../../types/kanji';
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

// --- Page Props (matches word-scramble pattern) ---

export interface KanjiDropPageProps {
  onClose: () => void;
  kanjiCards: KanjiCard[];
  currentUser?: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  onSaveGameSession?: (data: {
    date: string;
    gameTitle: string;
    rank: number;
    totalPlayers: number;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
  }) => void;
}
```

### File: `src/components/pages/kanji-drop/kanji-drop-constants.ts`

```typescript
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
  { level: 1, totalTiles: 12, kanjiVariety: 4, multiplicities: [3,3,3,3], lockedSlots: [8,9], powerUpReward: 1 },
  { level: 2, totalTiles: 12, kanjiVariety: 4, multiplicities: [3,3,3,3], lockedSlots: [8,9], powerUpReward: 1 },
  { level: 3, totalTiles: 12, kanjiVariety: 4, multiplicities: [3,3,3,3], lockedSlots: [8,9], powerUpReward: 1 },
  // Levels 4-8: 18 tiles, mixed multiplicities
  { level: 4, totalTiles: 18, kanjiVariety: 5, multiplicities: [4,4,4,3,3], lockedSlots: [8,9], powerUpReward: 1 },
  { level: 5, totalTiles: 18, kanjiVariety: 5, multiplicities: [4,4,3,4,3], lockedSlots: [8,9], powerUpReward: 1 },
  { level: 6, totalTiles: 18, kanjiVariety: 6, multiplicities: [3,3,3,3,3,3], lockedSlots: [8,9], powerUpReward: 1 },
  { level: 7, totalTiles: 18, kanjiVariety: 5, multiplicities: [4,4,4,3,3], lockedSlots: [8,9], powerUpReward: 1 },
  { level: 8, totalTiles: 18, kanjiVariety: 6, multiplicities: [3,3,3,3,3,3], lockedSlots: [8,9], powerUpReward: 1 },
  // Levels 9-15: 24-30 tiles, occasional extra locks
  { level: 9, totalTiles: 24, kanjiVariety: 7, multiplicities: [4,4,4,3,3,3,3], lockedSlots: [8,9], powerUpReward: 1 },
  { level: 10, totalTiles: 24, kanjiVariety: 8, multiplicities: [3,3,3,3,3,3,3,3], lockedSlots: [7,8,9], powerUpReward: 1 },
  { level: 11, totalTiles: 27, kanjiVariety: 9, multiplicities: [3,3,3,3,3,3,3,3,3], lockedSlots: [8,9], powerUpReward: 1 },
  { level: 12, totalTiles: 27, kanjiVariety: 8, multiplicities: [4,4,4,3,3,3,3,3], lockedSlots: [7,8,9], powerUpReward: 1 },
  { level: 13, totalTiles: 30, kanjiVariety: 9, multiplicities: [4,4,3,3,4,3,3,3,3], lockedSlots: [8,9], powerUpReward: 1 },
  { level: 14, totalTiles: 30, kanjiVariety: 10, multiplicities: [3,3,3,3,3,3,3,3,3,3], lockedSlots: [7,8,9], powerUpReward: 1 },
  { level: 15, totalTiles: 30, kanjiVariety: 9, multiplicities: [4,4,4,3,3,3,3,3,3], lockedSlots: [8,9], powerUpReward: 1 },
  // Level 16+: 40+ tiles, fewer guaranteed triplets
  { level: 16, totalTiles: 40, kanjiVariety: 12, multiplicities: [4,4,4,4,3,3,3,3,3,3,2,2], lockedSlots: [7,8,9], powerUpReward: 1 },
  { level: 17, totalTiles: 40, kanjiVariety: 12, multiplicities: [4,4,3,3,4,3,3,3,3,4,3,3], lockedSlots: [7,8,9], powerUpReward: 1 },
  { level: 18, totalTiles: 42, kanjiVariety: 13, multiplicities: [4,4,4,3,3,3,3,3,3,3,3,3,3], lockedSlots: [7,8,9], powerUpReward: 1 },
  { level: 19, totalTiles: 45, kanjiVariety: 13, multiplicities: [4,4,4,4,4,3,3,3,3,3,3,4,3], lockedSlots: [7,8,9], powerUpReward: 1 },
  { level: 20, totalTiles: 48, kanjiVariety: 14, multiplicities: [4,4,4,4,3,3,3,3,3,3,3,3,4,4], lockedSlots: [7,8,9], powerUpReward: 1 },
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
```

### File: `src/components/pages/kanji-drop/index.ts`

```typescript
export * from './kanji-drop-types';
export * from './kanji-drop-constants';
```

## Related Code Files

| File | Role |
|------|------|
| `src/types/kanji.ts` | KanjiCard interface |
| `src/types/flashcard.ts` | JLPTLevel type |
| `src/utils/vip-styling.ts` | isVipRole() helper |
| `src/components/pages/word-scramble/word-scramble-types.ts` | Reference pattern |
| `src/components/pages/word-scramble/word-scramble-constants.ts` | Reference pattern |

## Implementation Steps

1. Create `src/components/pages/kanji-drop/` directory
2. Create `kanji-drop-types.ts` with all interfaces
3. Create `kanji-drop-constants.ts` with level configs + scoring constants
4. Create `index.ts` with re-exports
5. Verify TypeScript compilation passes

## Todo

- [ ] Create kanji-drop-types.ts
- [ ] Create kanji-drop-constants.ts
- [ ] Create index.ts
- [ ] Verify imports resolve correctly

## Success Criteria

- All types compile without errors
- Level configs cover levels 1-20+
- VIP/regular differentiation built into LevelConfig
- Types match patterns used in word-scramble for consistency

## Risk Assessment

- **Low**: Type definitions are isolated, no runtime risk
- Multiplicity arrays must sum to totalTiles -- validated at engine level (Phase 2)

## Security Considerations

- No user input in type definitions
- VIP gating is prop-driven, not client-side hackable (server validates role)

## Next Steps

Phase 2: Core Game Engine -- implements pure functions using these types
