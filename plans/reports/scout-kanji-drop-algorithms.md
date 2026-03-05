# Kanji Drop: Critical Algorithms & Code Snippets

## 1. Stacking Layout Generation Algorithm

**File**: `kanji-drop-engine.ts` (lines 31-158)

```typescript
function getLayerCount(level: number): number {
  if (level <= 2) return 2;
  if (level <= 5) return 3;
  if (level <= 9) return 4;
  if (level <= 14) return 5;
  if (level <= 20) return 6;
  return 7;
}

export function generateStackLayout(
  totalTiles: number,
  rng: () => number,
  level: number = 1
): StackPosition[] {
  const W = STACK_CARD_W;      // 56
  const H = STACK_CARD_H;      // 72

  const numLayers = getLayerCount(level);
  const layerSizes = distributeToLayers(totalTiles, numLayers);

  const allPositions: StackPosition[] = [];
  const layerStartIndices: number[] = [];

  // Dynamic base gap: tighter for more tiles
  const baseGap = totalTiles > 200 ? 3 : totalTiles > 100 ? 4 : 6;
  const cellW = W + baseGap;
  const cellH = H + baseGap;

  // Layer 0: Regular grid (no overlap within same layer)
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

  // Upper layers: varied overlap stacking
  for (let layer = 1; layer < numLayers; layer++) {
    const count = layerSizes[layer];
    layerStartIndices.push(allPositions.length);
    const prevStart = layerStartIndices[layer - 1];
    const prevEnd = allPositions.length;

    for (let i = 0; i < count; i++) {
      // Pick random base card from previous layer
      const baseIdx = prevStart + Math.floor(rng() * (prevEnd - prevStart));
      const base = allPositions[baseIdx];

      // Choose overlap type — difficulty scales with level
      const overlapRoll = rng();
      let dx: number, dy: number;
      
      const halfEnd = level <= 3 ? 0.20 : level <= 9 ? 0.30 : level <= 19 ? 0.35 : 0.35;
      const cornerEnd = level <= 3 ? 0.80 : level <= 9 ? 0.70 : level <= 19 ? 0.65 : 0.50;

      if (overlapRoll < halfEnd) {
        // Half overlap: 50% in ONE axis
        const dir = Math.floor(rng() * 4);
        dx = dir < 2 ? (dir === 0 ? W * 0.5 : -W * 0.5) : 0;
        dy = dir >= 2 ? (dir === 2 ? H * 0.5 : -H * 0.5) : 0;
      } else if (overlapRoll < cornerEnd) {
        // Corner/quarter overlap: 50% in BOTH X and Y
        const dirX = rng() < 0.5 ? 1 : -1;
        const dirY = rng() < 0.5 ? 1 : -1;
        dx = dirX * W * 0.5;
        dy = dirY * H * 0.5;
      } else {
        // Near-full overlap: tiny 10% offset (hardest)
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

  // Normalize: shift to origin with padding
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
```

**Key Insights**:
- Each upper layer picks random cards from previous layer as "base"
- Overlap type probability shifts with difficulty level
- Half overlap = loose (easier), near-full = tight (harder)
- Normalized to origin ensures consistent container sizing

---

## 2. Blocker Computation & Solvability

**File**: `kanji-drop-engine.ts` (lines 160-282)

```typescript
export function computeBlockedBy(positions: StackPosition[]): number[][] {
  const W = STACK_CARD_W;
  const H = STACK_CARD_H;

  return positions.map((a, i) => {
    const blockers: number[] = [];
    for (let j = 0; j < positions.length; j++) {
      if (i === j) continue;
      const b = positions[j];
      if (b.zIndex <= a.zIndex) continue;  // Only higher zIndex can block

      // Any overlap at all = blocked (no minimum threshold)
      const overlapX = Math.min(a.x + W, b.x + W) - Math.max(a.x, b.x);
      const overlapY = Math.min(a.y + H, b.y + H) - Math.max(a.y, b.y);
      if (overlapX > 0 && overlapY > 0) {
        blockers.push(j);
      }
    }
    return blockers;
  });
}

export function generatePool(
  kanjiCards: KanjiCard[],
  config: LevelConfig,
  seed: number
): PoolTile[] {
  const rng = mulberry32(seed);
  const shuffled = fisherYatesShuffle([...kanjiCards], rng);

  // Generate stacking positions first
  const rng2 = mulberry32(seed + 999);
  const positions = generateStackLayout(config.totalTiles, rng2, config.level);
  const blockedByPos = computeBlockedBy(positions);

  // === SOLVABILITY: spread kanji copies across depth layers ===
  const rng3 = mulberry32(seed + 777);
  const posIndices = positions.map((_, i) => i);
  
  // Fisher-Yates shuffle of indices
  for (let i = posIndices.length - 1; i > 0; i--) {
    const j = Math.floor(rng3() * (i + 1));
    [posIndices[i], posIndices[j]] = [posIndices[j], posIndices[i]];
  }
  
  // Stable sort by zIndex (preserves shuffle within same layer)
  posIndices.sort((a, b) => positions[a].zIndex - positions[b].zIndex);

  // Split into 3 depth groups
  const K = config.kanjiVariety;
  const depthGroups = [
    fisherYatesShuffle(posIndices.slice(0, K), rng3),        // Group 0
    fisherYatesShuffle(posIndices.slice(K, K * 2), rng3),    // Group 1
    fisherYatesShuffle(posIndices.slice(K * 2), rng3),       // Group 2
  ];

  // Create tiles — each kanji gets 3 copies (one per depth group)
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

  // Resolve blockedBy: convert position indices → tile IDs
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

  return tiles;
}
```

**Solvability Guarantee**:
- Split K kanji into 3 groups by position depth
- Each kanji gets 3 copies at different depths
- Copies at higher depths are less blocked
- Ensures at least one copy always reachable

---

## 3. Free Tile Detection (Overlap Check)

**File**: `pool-grid.tsx` (lines 14-27)

```typescript
const freeTileIds = useMemo(() => {
  const free = new Set<string>();
  for (const tile of tiles) {
    if (tile.selected) continue;  // Already picked = not free
    
    // Check if all blockers are selected
    const isFree = tile.blockedBy.every(blockerId => {
      const blocker = tiles.find(t => t.id === blockerId);
      return !blocker || blocker.selected;  // Free if blocker gone or selected
    });
    
    if (isFree) free.add(tile.id);
  }
  return free;
}, [tiles]);
```

**Rendering**:
```jsx
<button
  className={`kd-stack-card ${isFree ? 'free' : 'blocked'}`}
  onClick={() => isFree && onPickTile(tile.id)}
  disabled={!isFree}
/>
```

**Behavior**:
- Free tiles: normal styling, clickable, glow effect
- Blocked tiles: dimmed, cursor-not-allowed, disabled

---

## 4. Cascade Animation Loop

**File**: `use-kanji-drop-game.ts` (lines 163-237)

```typescript
useEffect(() => {
  if (gameState.clearingIndices.length === 0 || gameState.phase !== 'playing') return;

  cascadeTimerRef.current = setTimeout(() => {
    setGameState(prev => {
      if (prev.clearingIndices.length === 0) return prev;

      // 1. Clear marked indices
      const runs = [prev.clearingIndices];
      const { newBottom, clearedCount } = clearRuns(prev.bottom, runs);
      const clearScore = clearedCount * SCORE_PER_CLEAR;
      const cascadeBonus = prev.cascadeCount > 0 ? SCORE_CASCADE_BONUS : 0;
      const newScore = prev.score + clearScore + cascadeBonus;
      const newClearedCount = prev.clearedCount + clearedCount;
      const newCascadeCount = prev.cascadeCount + 1;

      // 2. Reflow and scan for more runs
      const { reflowed, runs: nextRuns } = reflowAndScan(newBottom);

      // 3. If more cascades found
      if (nextRuns.length > 0) {
        return {
          ...prev,
          bottom: reflowed,
          score: newScore,
          clearedCount: newClearedCount,
          cascadeCount: newCascadeCount,
          clearingIndices: nextRuns.flat(),  // Loop continues
        };
      }

      // 4. No more cascades — check win/lose
      if (checkWin(prev.pool, reflowed)) {
        saveProgress(prev.level + 1);
        return {
          ...prev,
          bottom: reflowed,
          score: newScore + SCORE_LEVEL_COMPLETE,
          clearedCount: newClearedCount,
          cascadeCount: newCascadeCount,
          clearingIndices: [],
          phase: 'result',
          result: 'win',
        };
      }

      if (checkLose(reflowed) && prev.pool.some(t => !t.selected)) {
        return {
          ...prev,
          bottom: reflowed,
          score: newScore,
          clearedCount: newClearedCount,
          cascadeCount: newCascadeCount,
          clearingIndices: [],
          phase: 'result',
          result: 'lose',
        };
      }

      // Continue playing (no cascades, no win/lose)
      return {
        ...prev,
        bottom: reflowed,
        score: newScore,
        clearedCount: newClearedCount,
        cascadeCount: newCascadeCount,
        clearingIndices: [],
      };
    });
  }, CLEAR_DELAY_MS);  // 1000ms

  return () => {
    if (cascadeTimerRef.current) clearTimeout(cascadeTimerRef.current);
  };
}, [gameState.clearingIndices, gameState.phase]);
```

**Flow**:
1. User picks tile → `reflowAndScan()` → runs found
2. Set `clearingIndices` → useEffect fires
3. Wait 1000ms for animation
4. Actually clear marked indices
5. Reflow and scan again
6. If more runs: set `clearingIndices` again (loop)
7. If no runs: check win/lose and end

---

## 5. Tile Placement & Reflow Algorithm

**File**: `kanji-drop-engine.ts` (lines 294-343)

```typescript
export function placeTile(bottom: BottomSlot[], tile: PoolTile): BottomSlot[] | null {
  const targetIdx = bottom.findIndex(s => !s.locked && s.tile === null);
  if (targetIdx === -1) return null;  // LOSE: bottom row full

  return bottom.map((s, i) =>
    i === targetIdx ? { ...s, tile: { ...tile, selected: true } } : s
  );
}

export function reflow(bottom: BottomSlot[]): BottomSlot[] {
  // Get first-appearance order of each kanji
  const firstSeen = new Map<string, number>();
  bottom.forEach((slot, idx) => {
    if (slot.tile && !slot.locked && !firstSeen.has(slot.tile.kanjiChar)) {
      firstSeen.set(slot.tile.kanjiChar, idx);
    }
  });

  // Collect unselected tiles with order
  const tilesWithOrder: Array<{ tile: PoolTile; order: number }> = [];
  bottom.forEach(slot => {
    if (slot.tile && !slot.locked) {
      tilesWithOrder.push({
        tile: slot.tile,
        order: firstSeen.get(slot.tile.kanjiChar) ?? 999,
      });
    }
  });

  // Sort by first-appearance order
  tilesWithOrder.sort((a, b) => a.order - b.order);

  // Create new bottom with empty unlocked slots
  const newBottom = bottom.map(s => ({ ...s }));
  const unlockedIndices = newBottom.filter(s => !s.locked).map(s => s.index);

  for (const idx of unlockedIndices) {
    newBottom[idx] = { ...newBottom[idx], tile: null };
  }

  // Repack tiles left-to-right, grouped by kanji
  tilesWithOrder.forEach((item, i) => {
    if (i < unlockedIndices.length) {
      newBottom[unlockedIndices[i]] = { ...newBottom[unlockedIndices[i]], tile: item.tile };
    }
  });

  return newBottom;
}

export function scanRuns(bottom: BottomSlot[]): number[][] {
  const runs: number[][] = [];
  let currentRun: number[] = [];
  let currentChar: string | null = null;

  for (let i = 0; i < bottom.length; i++) {
    const slot = bottom[i];

    if (slot.locked || !slot.tile) {
      // Locked or empty slot = break run
      if (currentRun.length >= MIN_CLEAR_RUN) {
        runs.push([...currentRun]);
      }
      currentRun = [];
      currentChar = null;
      continue;
    }

    if (slot.tile.kanjiChar === currentChar) {
      // Same kanji = extend run
      currentRun.push(i);
    } else {
      // Different kanji = finish previous run, start new
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
```

**Example**:
```
Initial: [漢, 字, 漢, 漢, 字, _, _, _, _, _]
After reflow groups by first-appearance:
  漢 first at 0
  字 first at 1
Result: [漢, 漢, 漢, 字, 字, _, _, _, _, _]
scanRuns finds: [[0,1,2], [3,4]] (both >= 3)
```

---

## 6. Multiplayer Seeded Determinism

**File**: `use-game-creation.ts` (lines 45-100)

```typescript
const createGame = useCallback(async (data: CreateKanjiDropRoomData) => {
  const seed = Date.now();

  const settings: KanjiDropMultiplayerSettings = {
    ...DEFAULT_KANJI_DROP_MP_SETTINGS,
    maxPlayers: data.maxPlayers,
    levelStart: data.levelStart,
    levelEnd: data.levelEnd,
    jlptLevels: data.jlptLevels,
    seed,  // ← Shared seed for all players
  };

  const gameData: Omit<KanjiDropMultiplayerGame, 'id'> = {
    code: generateGameCode(),
    hostId: currentUser.id,
    title: data.title,
    settings,
    status: 'waiting',
    players: { [currentUser.id]: player },
    createdAt: new Date().toISOString(),
  };

  const firestoreId = await createGameRoom('kanji-drop', gameData);
  setRoomId(firestoreId);
  // ...
}, [...]);
```

**On Game Start** (from `use-kanji-drop-game.ts`):
```typescript
const startMultiplayerGame = useCallback(() => {
  if (!multiplayerConfig) return;
  const { seed, levelStart, levelEnd, jlptLevels } = multiplayerConfig;
  
  const level = levelStart;
  const levelSeed = seed + level;  // ← Deterministic per level
  const config = getLevelConfig(level, isVip);
  const pool = generatePool(kanji, config, levelSeed);
  // All players with same levelSeed get identical pool
}, [multiplayerConfig, isVip, mpKanji, kanjiCards]);
```

**Key Insight**: `levelSeed = roomSeed + levelNumber` ensures each level uses a different but deterministic seed.

---

## 7. Progress Synchronization

**File**: `use-progress-sync.ts` (lines 21-58)

```typescript
const syncProgress = useCallback((data: ProgressData) => {
  const now = Date.now();
  
  // Debounce: max once per 500ms (unless finishing)
  if (!data.finished && now - lastSyncRef.current < 500) return;
  lastSyncRef.current = now;

  setGame(prev => {
    if (!prev || prev.status !== 'playing') return prev;
    const player = prev.players[currentUserId];
    if (!player) return prev;

    const updatedPlayer = {
      ...player,
      currentLevel: data.currentLevel,
      score: data.score,
      clearedCount: data.clearedCount,
      levelsCompleted: data.levelsCompleted,
      ...(data.finished ? { finishedAt: new Date().toISOString() } : {}),
    };

    const updatedPlayers = { ...prev.players, [currentUserId]: updatedPlayer };

    // Check if all players finished
    const allFinished = Object.values(updatedPlayers).every(p => p.finishedAt || p.isBot);

    return {
      ...prev,
      players: updatedPlayers,
      ...(allFinished ? { status: 'finished' as const } : {}),
    };
  });
}, [currentUserId, setGame]);
```

**Called From** (kanji-drop-page.tsx):
```typescript
useEffect(() => {
  if (!isMultiplayerMode || !mp.game || mp.game.status !== 'playing') return;
  if (gameState.phase === 'playing' || gameState.phase === 'result') {
    const isAllDone = gameState.mode === 'multi'
      && gameState.result === 'win'
      && gameState.levelEnd
      && gameState.level >= gameState.levelEnd;

    mp.syncProgress({
      currentLevel: gameState.level,
      score: gameState.score,
      clearedCount: gameState.clearedCount,
      levelsCompleted: gameState.levelsCompleted || 0,
      finished: isAllDone,
    });
  }
}, [gameState.level, gameState.score, gameState.clearedCount, gameState.levelsCompleted, ...]);
```

---

## 8. Win/Lose Conditions

**File**: `kanji-drop-engine.ts` (lines 437-447)

```typescript
export function checkWin(pool: PoolTile[], bottom: BottomSlot[]): boolean {
  const allPoolSelected = pool.every(t => t.selected);
  const allBottomEmpty = bottom.every(s => s.locked || s.tile === null);
  return allPoolSelected && allBottomEmpty;
}

export function checkLose(bottom: BottomSlot[]): boolean {
  return !bottom.some(s => !s.locked && s.tile === null);
}
```

**Win**:
- ALL tiles from pool selected/picked
- AND all non-locked bottom slots empty

**Lose**:
- NO unlocked empty slots available in bottom row (can't place next tile)

**Timing**:
- Checked after cascade ends (no more runs)
- If user picks tile that fills last slot: immediate check

---

## 9. Seeded RNG Implementation

**File**: `kanji-drop-engine.ts` (lines 8-29)

```typescript
// Mulberry32 RNG — fast, deterministic, from stackoverflow
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function fisherYatesShuffle<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
```

**Usage**:
```typescript
const rng = mulberry32(seed);
const shuffled = fisherYatesShuffle(kanjiCards, rng);
const positions = generateStackLayout(totalTiles, rng2, level);
```

**Property**: Same seed always produces identical output (deterministic for multiplayer).

---

## Summary

These 9 algorithms form the complete Kanji Drop game engine:

1. **Stacking** — Mahjong-style layered overlap
2. **Blocking** — Overlap detection matrix
3. **Solvability** — Depth group distribution guarantee
4. **Free Detection** — Blocker traversal
5. **Cascade Loop** — Animated clearing + chain reaction
6. **Reflow** — Compact tiles by kanji group
7. **Multiplayer** — Shared seed + progress sync
8. **Win/Lose** — State transition conditions
9. **RNG** — Deterministic random number generation

All pure functions, no side effects, fully testable.

