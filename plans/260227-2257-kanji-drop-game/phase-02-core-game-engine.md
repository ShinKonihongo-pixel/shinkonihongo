# Phase 2: Core Game Engine

**Parent**: [plan.md](./plan.md)
**Dependencies**: Phase 1 (types + constants)
**Date**: 2026-02-27 | **Priority**: High | **Status**: Pending

## Overview

Implement pure game logic functions in `kanji-drop-engine.ts`. All functions are deterministic, side-effect-free, and unit-testable. Covers: pool generation, tile placement, reflow, run scanning, cascade clearing, win/lose detection, and power-up execution.

## Key Insights

- **Reflow algorithm**: sort occupied bottom tiles by first-appearance order of their kanjiChar, pack left-to-right into unlocked slots. "First-appearance" = the kanjiChar whose tile first entered the bottom row earliest gets grouped leftmost.
- **Cascade**: after clearing runs >= 3, reflow remaining tiles, scan again. Repeat until no runs found.
- **Seed-based RNG**: use simple mulberry32 PRNG from seed for deterministic pool generation (replay support).
- **Solvability guarantee**: >= 60% of tiles come from kanji with 3+ copies. Remaining can be 2-copy "trap" tiles at higher levels.

## Requirements

1. `generatePool(kanjiCards, levelConfig, seed)` -> PoolTile[]
2. `placeTile(bottom, tile)` -> BottomSlot[] (place into first unlocked empty slot L->R)
3. `reflow(bottom)` -> BottomSlot[] (group identical kanji by first-appearance, pack into unlocked slots)
4. `scanRuns(bottom)` -> number[][] (find all contiguous runs of >= 3 same kanji, respecting locked barriers)
5. `clearRuns(bottom, runs)` -> { newBottom, clearedCount }
6. `cascadeClear(bottom)` -> { finalBottom, totalCleared, cascadeCount }
7. `checkWin(pool, bottom)` -> boolean (all pool selected + all bottom empty after clears)
8. `checkLose(bottom)` -> boolean (no unlocked empty slots)
9. `shufflePool(pool, seed)` -> PoolTile[] (Fisher-Yates on unselected tiles)
10. `restoreBottom(pool, bottom)` -> { newPool, newBottom } (return bottom tiles to pool + shuffle)
11. `createUndoSnapshot(state)` -> UndoSnapshot
12. `applyUndo(snapshot)` -> partial GameState

## Architecture

### File: `src/components/pages/kanji-drop/kanji-drop-engine.ts`

```typescript
import type { PoolTile, BottomSlot, LevelConfig, UndoSnapshot, PowerUp, GameState } from './kanji-drop-types';
import type { KanjiCard } from '../../../types/kanji';
import { BOTTOM_ROW_SIZE, MIN_CLEAR_RUN } from './kanji-drop-constants';

// --- Seeded RNG (mulberry32) ---

export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Fisher-Yates Shuffle ---

export function fisherYatesShuffle<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// --- Pool Generation ---

export function generatePool(
  kanjiCards: KanjiCard[],
  config: LevelConfig,
  seed: number
): PoolTile[] {
  const rng = mulberry32(seed);

  // Filter available kanji
  const available = [...kanjiCards];
  const shuffled = fisherYatesShuffle(available, rng);

  // Select kanji based on multiplicities
  const tiles: PoolTile[] = [];
  let tileId = 0;

  for (let i = 0; i < config.kanjiVariety; i++) {
    const kanji = shuffled[i % shuffled.length];
    const copies = config.multiplicities[i] || 3;

    for (let c = 0; c < copies; c++) {
      tiles.push({
        id: `tile-${tileId++}`,
        kanjiChar: kanji.character,
        kanjiId: kanji.id,
        meaning: kanji.meaning,
        selected: false,
      });
    }
  }

  // Shuffle the pool tiles
  return fisherYatesShuffle(tiles, rng);
}

// --- Bottom Row Initialization ---

export function initBottomRow(lockedSlots: number[]): BottomSlot[] {
  return Array.from({ length: BOTTOM_ROW_SIZE }, (_, i) => ({
    index: i,
    tile: null,
    locked: lockedSlots.includes(i),
  }));
}

// --- Place Tile ---

export function placeTile(bottom: BottomSlot[], tile: PoolTile): BottomSlot[] | null {
  const targetIdx = bottom.findIndex(s => !s.locked && s.tile === null);
  if (targetIdx === -1) return null; // row full

  return bottom.map((s, i) =>
    i === targetIdx ? { ...s, tile: { ...tile, selected: true } } : s
  );
}

// --- Reflow ---
// Group identical kanji by first-appearance order, pack into unlocked slots L->R

export function reflow(bottom: BottomSlot[]): BottomSlot[] {
  // Collect all tiles currently in bottom (with their original placement order)
  const tilesWithOrder: Array<{ tile: PoolTile; firstAppearanceOrder: number }> = [];
  const firstSeen = new Map<string, number>(); // kanjiChar -> earliest index

  // First pass: determine first-appearance index for each kanjiChar
  bottom.forEach((slot, idx) => {
    if (slot.tile && !slot.locked) {
      const char = slot.tile.kanjiChar;
      if (!firstSeen.has(char)) {
        firstSeen.set(char, idx);
      }
    }
  });

  // Collect non-locked tiles
  bottom.forEach(slot => {
    if (slot.tile && !slot.locked) {
      tilesWithOrder.push({
        tile: slot.tile,
        firstAppearanceOrder: firstSeen.get(slot.tile.kanjiChar) ?? 999,
      });
    }
  });

  // Sort: group by kanjiChar, ordered by first-appearance
  tilesWithOrder.sort((a, b) => {
    if (a.firstAppearanceOrder !== b.firstAppearanceOrder) {
      return a.firstAppearanceOrder - b.firstAppearanceOrder;
    }
    return 0; // stable sort preserves insertion order within same kanji
  });

  // Rebuild bottom: place sorted tiles into unlocked slots L->R
  const newBottom = bottom.map(s => ({ ...s }));
  const unlockedIndices = newBottom
    .filter(s => !s.locked)
    .map(s => s.index);

  // Clear all unlocked slots first
  unlockedIndices.forEach(idx => {
    newBottom[idx] = { ...newBottom[idx], tile: null };
  });

  // Fill sorted tiles into unlocked slots
  tilesWithOrder.forEach((item, i) => {
    if (i < unlockedIndices.length) {
      newBottom[unlockedIndices[i]] = {
        ...newBottom[unlockedIndices[i]],
        tile: item.tile,
      };
    }
  });

  return newBottom;
}

// --- Scan Runs ---
// Find contiguous runs of >= MIN_CLEAR_RUN same kanji in unlocked slots
// Locked slots act as barriers (runs can't cross them)

export function scanRuns(bottom: BottomSlot[]): number[][] {
  const runs: number[][] = [];
  let currentRun: number[] = [];
  let currentChar: string | null = null;

  for (let i = 0; i < bottom.length; i++) {
    const slot = bottom[i];

    if (slot.locked || !slot.tile) {
      // Barrier or empty: flush current run
      if (currentRun.length >= MIN_CLEAR_RUN) {
        runs.push([...currentRun]);
      }
      currentRun = [];
      currentChar = null;
      continue;
    }

    if (slot.tile.kanjiChar === currentChar) {
      currentRun.push(i);
    } else {
      if (currentRun.length >= MIN_CLEAR_RUN) {
        runs.push([...currentRun]);
      }
      currentRun = [i];
      currentChar = slot.tile.kanjiChar;
    }
  }

  // Flush last run
  if (currentRun.length >= MIN_CLEAR_RUN) {
    runs.push([...currentRun]);
  }

  return runs;
}

// --- Clear Runs ---

export function clearRuns(
  bottom: BottomSlot[],
  runs: number[][]
): { newBottom: BottomSlot[]; clearedCount: number } {
  const toClear = new Set(runs.flat());
  const newBottom = bottom.map((s, i) =>
    toClear.has(i) ? { ...s, tile: null } : s
  );
  return { newBottom, clearedCount: toClear.size };
}

// --- Cascade Clear ---
// Reflow -> scan -> clear -> repeat until no more runs

export function cascadeClear(bottom: BottomSlot[]): {
  finalBottom: BottomSlot[];
  totalCleared: number;
  cascadeCount: number;
} {
  let current = bottom;
  let totalCleared = 0;
  let cascadeCount = 0;

  while (true) {
    const reflowed = reflow(current);
    const runs = scanRuns(reflowed);
    if (runs.length === 0) {
      return { finalBottom: reflowed, totalCleared, cascadeCount };
    }

    const { newBottom, clearedCount } = clearRuns(reflowed, runs);
    totalCleared += clearedCount;
    cascadeCount++;
    current = newBottom;
  }
}

// --- Win/Lose Checks ---

export function checkWin(pool: PoolTile[], bottom: BottomSlot[]): boolean {
  const allPoolSelected = pool.every(t => t.selected);
  const allBottomEmpty = bottom.every(s => s.locked || s.tile === null);
  return allPoolSelected && allBottomEmpty;
}

export function checkLose(bottom: BottomSlot[]): boolean {
  return !bottom.some(s => !s.locked && s.tile === null);
}

// --- Power-ups ---

export function shufflePool(pool: PoolTile[], seed: number): PoolTile[] {
  const rng = mulberry32(seed);
  const unselected = pool.filter(t => !t.selected);
  const selected = pool.filter(t => t.selected);
  const shuffled = fisherYatesShuffle(unselected, rng);

  // Rebuild pool preserving selected tiles in-place
  let uIdx = 0;
  return pool.map(t => {
    if (t.selected) return t;
    return { ...shuffled[uIdx++], id: t.id }; // keep original slot ID
  });
}

export function restoreBottom(
  pool: PoolTile[],
  bottom: BottomSlot[],
  seed: number
): { newPool: PoolTile[]; newBottom: BottomSlot[] } {
  // Collect tiles from bottom
  const returnedTiles: PoolTile[] = [];
  const newBottom = bottom.map(s => {
    if (s.tile && !s.locked) {
      returnedTiles.push({ ...s.tile, selected: false });
      return { ...s, tile: null };
    }
    return s;
  });

  // Return tiles to pool (mark as unselected)
  let newPool = pool.map(t => {
    const returned = returnedTiles.find(rt => rt.id === t.id);
    if (returned) return { ...t, selected: false };
    return t;
  });

  // Shuffle unselected pool tiles
  newPool = shufflePool(newPool, seed);

  return { newPool, newBottom };
}

// --- Undo ---

export function createUndoSnapshot(state: {
  pool: PoolTile[];
  bottom: BottomSlot[];
  powerUps: PowerUp[];
  score: number;
  moves: number;
}): UndoSnapshot {
  return {
    pool: state.pool.map(t => ({ ...t })),
    bottom: state.bottom.map(s => ({ ...s, tile: s.tile ? { ...s.tile } : null })),
    powerUps: state.powerUps.map(p => ({ ...p })),
    score: state.score,
    moves: state.moves,
  };
}
```

## Related Code Files

| File | Role |
|------|------|
| `src/components/pages/kanji-drop/kanji-drop-types.ts` | Types consumed |
| `src/components/pages/kanji-drop/kanji-drop-constants.ts` | Constants consumed |
| `src/components/pages/word-scramble/word-scramble-utils.ts` | Reference: Fisher-Yates pattern |

## Implementation Steps

1. Create `kanji-drop-engine.ts`
2. Implement mulberry32 PRNG
3. Implement fisherYatesShuffle
4. Implement generatePool with kanji selection + multiplicity
5. Implement initBottomRow
6. Implement placeTile (first unlocked empty slot L->R)
7. Implement reflow (group by first-appearance, pack L->R)
8. Implement scanRuns (find >= 3 contiguous same, locked = barrier)
9. Implement clearRuns
10. Implement cascadeClear (loop: reflow -> scan -> clear until stable)
11. Implement checkWin and checkLose
12. Implement shufflePool, restoreBottom, createUndoSnapshot

## Todo

- [ ] kanji-drop-engine.ts with all pure functions
- [ ] Verify pool generation respects multiplicity distribution
- [ ] Verify reflow first-appearance ordering
- [ ] Verify cascade terminates (finite tiles guarantee)

## Success Criteria

- All functions are pure (no side effects, no mutations of inputs)
- generatePool produces exactly `config.totalTiles` tiles
- cascadeClear always terminates
- Locked slots are never modified by reflow/clear
- Runs cannot cross locked slot barriers

## Risk Assessment

- **Infinite cascade loop**: impossible because each cascade removes tiles, finite pool means finite cascades
- **Pool generation with insufficient kanji**: fallback -- cycle through available kanji with modulo. Alert in setup if < kanjiVariety kanji available.
- **Reflow edge case**: all slots locked except one -- degenerates to single-slot mode. Handled naturally.

## Security Considerations

- Seed-based RNG means levels are replayable but not server-validated (acceptable for single-player)
- No network calls in engine

## Next Steps

Phase 3: Game Hook -- wires engine functions into React state management
