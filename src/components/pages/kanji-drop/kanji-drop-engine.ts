// Kanji Drop game engine — pure functions for game logic
// All functions are deterministic, side-effect-free, and unit-testable

import type { PoolTile, BottomSlot, LevelConfig, UndoSnapshot, PowerUp } from './kanji-drop-types';
import type { KanjiCard } from '../../../types/kanji';
import { BOTTOM_ROW_SIZE, MIN_CLEAR_RUN, STACK_CARD_W, STACK_CARD_H } from './kanji-drop-constants';

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

// --- Stacking Layout Generation ---
// Creates Mahjong-style stacking with varied overlap: half, quarter, near-full
// Cards are always straight (no rotation). Higher levels = more stacking layers.

interface StackPosition {
  x: number;
  y: number;
  zIndex: number;
  rotation: number;
}

// Determine layer count based on level — gradually increases
function getLayerCount(level: number): number {
  if (level <= 2) return 2;
  if (level <= 5) return 3;
  if (level <= 9) return 4;
  if (level <= 14) return 5;
  if (level <= 20) return 6;
  return 7;
}

// Distribute tiles across layers (bottom-heavy: layer 0 gets most)
function distributeToLayers(total: number, numLayers: number): number[] {
  const weights = Array.from({ length: numLayers }, (_, i) => numLayers - i);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const sizes: number[] = [];
  let remaining = total;

  for (let i = 0; i < numLayers; i++) {
    if (i === numLayers - 1) {
      sizes.push(Math.max(1, remaining));
    } else {
      const count = Math.max(1, Math.round(total * weights[i] / totalWeight));
      sizes.push(Math.min(count, remaining));
      remaining -= sizes[i];
    }
  }
  return sizes;
}

export function generateStackLayout(totalTiles: number, rng: () => number, level: number = 1): StackPosition[] {
  const W = STACK_CARD_W;
  const H = STACK_CARD_H;

  const numLayers = getLayerCount(level);
  const layerSizes = distributeToLayers(totalTiles, numLayers);

  const allPositions: StackPosition[] = [];
  const layerStartIndices: number[] = [];

  // Dynamic base gap: tighter for more tiles to keep area manageable
  const baseGap = totalTiles > 200 ? 3 : totalTiles > 100 ? 4 : 6;
  const cellW = W + baseGap;
  const cellH = H + baseGap;

  // === Layer 0: Regular grid (no overlap within same layer) ===
  const cols0 = Math.ceil(Math.sqrt(layerSizes[0] * 1.3));
  layerStartIndices.push(0);

  for (let i = 0; i < layerSizes[0]; i++) {
    allPositions.push({
      x: (i % cols0) * cellW,
      y: Math.floor(i / cols0) * cellH,
      zIndex: 0,
      rotation: 0,
    });
  }

  // === Upper layers: varied overlap stacking ===
  for (let layer = 1; layer < numLayers; layer++) {
    const count = layerSizes[layer];
    layerStartIndices.push(allPositions.length);
    const prevStart = layerStartIndices[layer - 1];
    const prevEnd = allPositions.length;

    for (let i = 0; i < count; i++) {
      // Pick random base card from previous layer
      const baseIdx = prevStart + Math.floor(rng() * (prevEnd - prevStart));
      const base = allPositions[baseIdx];

      // Choose overlap type — difficulty scales with level:
      // Easy (1-3): mostly corner overlap (loose, easy to pick)
      // Hard (20+): mostly near-full overlap (tight, hard to pick)
      const overlapRoll = rng();
      let dx: number, dy: number;
      const halfEnd = level <= 3 ? 0.20 : level <= 9 ? 0.30 : level <= 19 ? 0.35 : 0.35;
      const cornerEnd = level <= 3 ? 0.80 : level <= 9 ? 0.70 : level <= 19 ? 0.65 : 0.50;

      if (overlapRoll < halfEnd) {
        // Half overlap: offset by 50% in ONE axis (covers half the card)
        const dir = Math.floor(rng() * 4);
        dx = dir < 2 ? (dir === 0 ? W * 0.5 : -W * 0.5) : 0;
        dy = dir >= 2 ? (dir === 2 ? H * 0.5 : -H * 0.5) : 0;
      } else if (overlapRoll < cornerEnd) {
        // Corner/quarter overlap: offset in BOTH X and Y (covers 1/4 at a corner)
        const dirX = rng() < 0.5 ? 1 : -1;
        const dirY = rng() < 0.5 ? 1 : -1;
        dx = dirX * W * 0.5;
        dy = dirY * H * 0.5;
      } else {
        // Near-full overlap: tiny offset ~10% (hardest to pick)
        dx = (rng() - 0.5) * W * 0.2;
        dy = (rng() - 0.5) * H * 0.2;
      }

      allPositions.push({
        x: base.x + dx,
        y: base.y + dy,
        zIndex: layer,
        rotation: 0,
      });
    }
  }

  // Normalize: shift so min x/y = padding
  const PAD = 12;
  let minX = Infinity, minY = Infinity;
  for (const p of allPositions) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
  }
  for (const p of allPositions) {
    p.x = Math.round(p.x - minX + PAD);
    p.y = Math.round(p.y - minY + PAD);
  }

  return allPositions;
}

// --- Compute BlockedBy Relationships ---
// Returns blocker POSITION INDICES (not tile IDs) for each position.
// A position is blocked if another position overlaps it from above:
// 1. Higher zIndex (different layer), OR
// 2. Same zIndex but higher position index (same layer, rendered on top in DOM)

export function computeBlockedBy(positions: StackPosition[]): number[][] {
  const W = STACK_CARD_W;
  const H = STACK_CARD_H;

  return positions.map((a, i) => {
    const blockers: number[] = [];
    for (let j = 0; j < positions.length; j++) {
      if (i === j) continue;
      const b = positions[j];
      // Skip if b is below a (lower layer)
      if (b.zIndex < a.zIndex) continue;
      // Same layer: only later-indexed positions block earlier ones (DOM render order)
      if (b.zIndex === a.zIndex && j <= i) continue;

      // Any overlap at all means blocked — no minimum threshold
      const overlapX = Math.min(a.x + W, b.x + W) - Math.max(a.x, b.x);
      const overlapY = Math.min(a.y + H, b.y + H) - Math.max(a.y, b.y);
      if (overlapX > 0 && overlapY > 0) {
        blockers.push(j);
      }
    }
    return blockers;
  });
}

// --- Check if tile is free (no unselected blocker) ---

export function isTileFree(tile: PoolTile, allTiles: PoolTile[]): boolean {
  if (tile.selected) return false;
  return tile.blockedBy.every(blockerId => {
    const blocker = allTiles.find(t => t.id === blockerId);
    return !blocker || blocker.selected;
  });
}

// --- Pool Generation ---
// Generates tiles with solvability guarantee:
// 1. Positions generated first, then sorted by depth (zIndex)
// 2. Kanji copies spread across 3 depth groups (bottom/mid/top)
//    so at least one copy per kanji is always reachable from upper layers
// 3. blockedBy correctly maps position indices → actual tile IDs

export function generatePool(
  kanjiCards: KanjiCard[],
  config: LevelConfig,
  seed: number
): PoolTile[] {
  const rng = mulberry32(seed);
  const shuffled = fisherYatesShuffle([...kanjiCards], rng);

  // Generate stacking positions first (level determines layer count + difficulty)
  const rng2 = mulberry32(seed + 999);
  const positions = generateStackLayout(config.totalTiles, rng2, config.level);
  const blockedByPos = computeBlockedBy(positions);

  // --- Solvability: spread kanji copies across depth layers ---
  // Shuffle position indices, then stable-sort by zIndex → random within same layer
  const rng3 = mulberry32(seed + 777);
  const posIndices = positions.map((_, i) => i);
  for (let i = posIndices.length - 1; i > 0; i--) {
    const j = Math.floor(rng3() * (i + 1));
    [posIndices[i], posIndices[j]] = [posIndices[j], posIndices[i]];
  }
  posIndices.sort((a, b) => positions[a].zIndex - positions[b].zIndex);

  // Split into 3 depth groups (bottom / middle / top), each with kanjiVariety entries
  const K = config.kanjiVariety;
  const depthGroups = [
    fisherYatesShuffle(posIndices.slice(0, K), rng3),
    fisherYatesShuffle(posIndices.slice(K, K * 2), rng3),
    fisherYatesShuffle(posIndices.slice(K * 2), rng3),
  ];

  // Create tiles — each kanji gets one copy per depth group
  const tiles: PoolTile[] = [];
  const posToTile = new Map<number, number>();

  for (let i = 0; i < config.kanjiVariety; i++) {
    const kanji = shuffled[i % shuffled.length];
    const copies = config.multiplicities[i] || 3;

    for (let c = 0; c < copies; c++) {
      const posIdx = depthGroups[c]?.[i];
      if (posIdx === undefined) continue;
      const pos = positions[posIdx];
      const tileIdx = tiles.length;

      posToTile.set(posIdx, tileIdx);
      tiles.push({
        id: `tile-${tileIdx}`,
        kanjiChar: kanji.character,
        kanjiId: kanji.id,
        meaning: kanji.meaning,
        selected: false,
        x: pos.x,
        y: pos.y,
        zIndex: pos.zIndex,
        rotation: pos.rotation,
        blockedBy: [],
      });
    }
  }

  // Resolve blockedBy: convert position indices → actual tile IDs
  const tileToPos = new Map<number, number>();
  for (const [posIdx, tileIdx] of posToTile) {
    tileToPos.set(tileIdx, posIdx);
  }

  for (let t = 0; t < tiles.length; t++) {
    const posIdx = tileToPos.get(t);
    if (posIdx === undefined) continue;
    tiles[t].blockedBy = blockedByPos[posIdx]
      .map(blockerPosIdx => {
        const blockerTileIdx = posToTile.get(blockerPosIdx);
        return blockerTileIdx !== undefined ? `tile-${blockerTileIdx}` : null;
      })
      .filter((id): id is string => id !== null);
  }

  // Post-process: add same-layer blocking based on tile render order
  // Tiles are rendered in array order; same-zIndex tiles with higher index appear on top.
  // If a later tile overlaps an earlier one at the same zIndex, the earlier is blocked.
  addSameLayerBlocking(tiles);

  return tiles;
}

// Detect same-layer visual overlaps and add blockedBy entries
// In DOM, tiles rendered later (higher array index) appear on top at same CSS z-index
function addSameLayerBlocking(tiles: PoolTile[]): void {
  const W = STACK_CARD_W;
  const H = STACK_CARD_H;

  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[i].zIndex !== tiles[j].zIndex) continue;

      const a = tiles[i], b = tiles[j];
      const overlapX = Math.min(a.x + W, b.x + W) - Math.max(a.x, b.x);
      const overlapY = Math.min(a.y + H, b.y + H) - Math.max(a.y, b.y);

      if (overlapX > 0 && overlapY > 0) {
        // j is on top of i (later in DOM) → i blocked by j
        if (!a.blockedBy.includes(b.id)) {
          a.blockedBy.push(b.id);
        }
      }
    }
  }
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
  const firstSeen = new Map<string, number>();
  bottom.forEach((slot, idx) => {
    if (slot.tile && !slot.locked && !firstSeen.has(slot.tile.kanjiChar)) {
      firstSeen.set(slot.tile.kanjiChar, idx);
    }
  });

  const tilesWithOrder: Array<{ tile: PoolTile; order: number }> = [];
  bottom.forEach(slot => {
    if (slot.tile && !slot.locked) {
      tilesWithOrder.push({
        tile: slot.tile,
        order: firstSeen.get(slot.tile.kanjiChar) ?? 999,
      });
    }
  });

  tilesWithOrder.sort((a, b) => a.order - b.order);

  const newBottom = bottom.map(s => ({ ...s }));
  const unlockedIndices = newBottom.filter(s => !s.locked).map(s => s.index);

  for (const idx of unlockedIndices) {
    newBottom[idx] = { ...newBottom[idx], tile: null };
  }

  tilesWithOrder.forEach((item, i) => {
    if (i < unlockedIndices.length) {
      newBottom[unlockedIndices[i]] = { ...newBottom[unlockedIndices[i]], tile: item.tile };
    }
  });

  return newBottom;
}

// --- Scan Runs ---
// Finds contiguous runs of >= MIN_CLEAR_RUN same kanji in unlocked slots

export function scanRuns(bottom: BottomSlot[]): number[][] {
  const runs: number[][] = [];
  let currentRun: number[] = [];
  let currentChar: string | null = null;

  for (let i = 0; i < bottom.length; i++) {
    const slot = bottom[i];

    if (slot.locked || !slot.tile) {
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

// --- Single-step cascade (reflow + scan) without clearing ---
// Returns runs found after reflow, or empty if none

export function reflowAndScan(bottom: BottomSlot[]): {
  reflowed: BottomSlot[];
  runs: number[][];
} {
  const reflowed = reflow(bottom);
  const runs = scanRuns(reflowed);
  return { reflowed, runs };
}

// --- Full cascade (for non-animated contexts like undo/restore) ---

const MAX_CASCADE = 50;

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

  // Rebuild pool: preserve position data, swap kanji content only
  let uIdx = 0;
  return pool.map(t => {
    if (t.selected) return t;
    const src = shuffled[uIdx++];
    return {
      ...t, // keep id, x, y, zIndex, rotation, blockedBy
      kanjiChar: src.kanjiChar,
      kanjiId: src.kanjiId,
      meaning: src.meaning,
    };
  });
}

export function restoreBottom(
  pool: PoolTile[],
  bottom: BottomSlot[],
  seed: number
): { newPool: PoolTile[]; newBottom: BottomSlot[] } {
  const returnedTileIds = new Set<string>();
  const newBottom = bottom.map(s => {
    if (s.tile && !s.locked) {
      returnedTileIds.add(s.tile.id);
      return { ...s, tile: null };
    }
    return s;
  });

  let newPool = pool.map(t =>
    returnedTileIds.has(t.id) ? { ...t, selected: false } : t
  );

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
    pool: state.pool.map(t => ({ ...t, blockedBy: [...t.blockedBy] })),
    bottom: state.bottom.map(s => ({
      ...s,
      tile: s.tile ? { ...s.tile, blockedBy: [...s.tile.blockedBy] } : null,
    })),
    powerUps: state.powerUps.map(p => ({ ...p })),
    score: state.score,
    moves: state.moves,
  };
}
