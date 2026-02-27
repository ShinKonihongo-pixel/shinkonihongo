// Kanji Drop game engine — pure functions for game logic
// All functions are deterministic, side-effect-free, and unit-testable

import type { PoolTile, BottomSlot, LevelConfig, UndoSnapshot, PowerUp } from './kanji-drop-types';
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
// Selects kanji based on level config multiplicities, shuffles into pool

export function generatePool(
  kanjiCards: KanjiCard[],
  config: LevelConfig,
  seed: number
): PoolTile[] {
  const rng = mulberry32(seed);
  const shuffled = fisherYatesShuffle([...kanjiCards], rng);

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
// Places tile into first available unlocked empty slot (left to right)

export function placeTile(bottom: BottomSlot[], tile: PoolTile): BottomSlot[] | null {
  const targetIdx = bottom.findIndex(s => !s.locked && s.tile === null);
  if (targetIdx === -1) return null; // row full

  return bottom.map((s, i) =>
    i === targetIdx ? { ...s, tile: { ...tile, selected: true } } : s
  );
}

// --- Reflow ---
// Groups identical kanji by first-appearance order, packs into unlocked slots L->R

export function reflow(bottom: BottomSlot[]): BottomSlot[] {
  // First pass: determine first-appearance index for each kanjiChar among unlocked tiles
  const firstSeen = new Map<string, number>();
  bottom.forEach((slot, idx) => {
    if (slot.tile && !slot.locked && !firstSeen.has(slot.tile.kanjiChar)) {
      firstSeen.set(slot.tile.kanjiChar, idx);
    }
  });

  // Collect non-locked tiles with their grouping order
  const tilesWithOrder: Array<{ tile: PoolTile; order: number }> = [];
  bottom.forEach(slot => {
    if (slot.tile && !slot.locked) {
      tilesWithOrder.push({
        tile: slot.tile,
        order: firstSeen.get(slot.tile.kanjiChar) ?? 999,
      });
    }
  });

  // Sort: group by kanjiChar ordered by first-appearance
  tilesWithOrder.sort((a, b) => a.order - b.order);

  // Rebuild bottom: fill sorted tiles into unlocked slots L->R
  const newBottom = bottom.map(s => ({ ...s }));
  const unlockedIndices = newBottom.filter(s => !s.locked).map(s => s.index);

  // Clear all unlocked slots
  for (const idx of unlockedIndices) {
    newBottom[idx] = { ...newBottom[idx], tile: null };
  }

  // Fill sorted tiles
  tilesWithOrder.forEach((item, i) => {
    if (i < unlockedIndices.length) {
      newBottom[unlockedIndices[i]] = { ...newBottom[unlockedIndices[i]], tile: item.tile };
    }
  });

  return newBottom;
}

// --- Scan Runs ---
// Finds contiguous runs of >= MIN_CLEAR_RUN same kanji in unlocked slots
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

const MAX_CASCADE = 50; // safety cap to prevent infinite loops

export function cascadeClear(bottom: BottomSlot[]): {
  finalBottom: BottomSlot[];
  totalCleared: number;
  cascadeCount: number;
} {
  let current = bottom;
  let totalCleared = 0;
  let cascadeCount = 0;

  while (cascadeCount < MAX_CASCADE) {
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

  return { finalBottom: reflow(current), totalCleared, cascadeCount };
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
  const shuffled = fisherYatesShuffle(unselected, rng);

  // Rebuild pool preserving selected tiles in-place
  let uIdx = 0;
  return pool.map(t => {
    if (t.selected) return t;
    return { ...shuffled[uIdx++], id: t.id };
  });
}

export function restoreBottom(
  pool: PoolTile[],
  bottom: BottomSlot[],
  seed: number
): { newPool: PoolTile[]; newBottom: BottomSlot[] } {
  // Collect tiles from bottom unlocked slots
  const returnedTileIds = new Set<string>();
  const newBottom = bottom.map(s => {
    if (s.tile && !s.locked) {
      returnedTileIds.add(s.tile.id);
      return { ...s, tile: null };
    }
    return s;
  });

  // Mark returned tiles as unselected in pool
  let newPool = pool.map(t =>
    returnedTileIds.has(t.id) ? { ...t, selected: false } : t
  );

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
