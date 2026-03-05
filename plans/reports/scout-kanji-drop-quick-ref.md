# Kanji Drop Quick Reference Guide

## Core Files Map

### Game Engine (Pure Functions)
```
kanji-drop-engine.ts
├── generateStackLayout()      ← Mahjong stacking with overlap
├── computeBlockedBy()         ← Position blocker matrix
├── generatePool()             ← Solvability + tile creation
├── placeTile()                ← Add to bottom row
├── reflow()                   ← Compact tiles left-to-right
├── scanRuns()                 ← Find 3+ contiguous matches
├── clearRuns()                ← Remove matched tiles
├── cascadeClear()             ← Full cascade loop
├── checkWin()                 ← All pool selected + bottom empty
├── checkLose()                ← No unlocked empty slots
├── shufflePool()              ← Power-up: shuffle
├── restoreBottom()            ← Power-up: restore
└── createUndoSnapshot()       ← Power-up: undo state
```

### Game Hook (State Management)
```
use-kanji-drop-game.ts
├── startGame()                ← Single-player init
├── startMultiplayerGame()     ← MP init with shared seed
├── pickTile()                 ← Core gameplay action
├── usePowerUp()               ← Power-up activation
├── nextLevel()                ← Level progression
├── resetGame()                ← Return to setup
└── Cascade animation logic    ← useEffect with timeout
```

### Multiplayer Hooks (Firestore Integration)
```
use-game-state.ts             ← Wrapper around useGameRoomState
use-game-creation.ts          ← createGame()
use-game-actions.ts           ← join, leave, kick, start, addBot
use-progress-sync.ts          ← syncProgress() debounced
index.ts                       ← Main useKanjiDropMultiplayer hook
```

### UI Components
```
kanji-drop-page.tsx           ← Main page (single + MP orchestrator)
setup-screen.tsx              ← JLPT/lesson/level selection
playing-screen.tsx            ← Game layout wrapper
pool-grid.tsx                 ← Stacked tile rendering
bottom-row.tsx                ← 10 slot display
kanji-drop-lobby.tsx          ← MP lobby (uses PremiumLobbyShell)
```

## Key Data Structures

### PoolTile
```typescript
{
  id: "tile-0",
  kanjiChar: "漢",
  kanjiId: "k123",
  meaning: "Kanji",
  selected: boolean,
  x, y: number,                // Absolute position
  zIndex: number,              // Layer depth
  rotation: number,            // (unused, always 0)
  blockedBy: ["tile-1", ...]   // IDs blocking this tile
}
```

### BottomSlot
```typescript
{
  index: 0-9,
  tile: PoolTile | null,
  locked: boolean              // VIP unlocks slots 8-9
}
```

### GameState
```typescript
{
  phase: 'setup' | 'playing' | 'result',
  result: 'win' | 'lose' | null,
  level: number,
  seed: number,                // For reproducibility
  pool: PoolTile[],
  bottom: BottomSlot[],
  powerUps: { type, count }[],
  undoStack: [UndoSnapshot],   // Max 1
  score: number,
  moves: number,
  cascadeCount: number,
  clearedCount: number,
  clearingIndices: number[],   // Bottom slots being cleared
  mode: 'single' | 'multi'
}
```

## Game Progression

### Level Configuration
```
Level 1:  30 tiles  = 10 kanji × 3 copies
Level 2:  45 tiles  = 15 kanji × 3 copies
Level 5:  90 tiles  = 30 kanji × 3 copies
Level 10: 165 tiles = 55 kanji × 3 copies
Level 20: 315 tiles = 105 kanji × 3 copies (capped at 300)

Locked Slots:
1-9:    [8, 9]     (2 locked)
10-19:  [7, 8, 9]  (3 locked)
20+:    [6-9]      (4 locked)
VIP:    []         (all unlocked)

Power-ups/Level:
Regular: 1 (distributed: shuffle/restore/undo)
VIP:     2
```

### Scoring
```
Per tile cleared:      10 pts
Per cascade bonus:     25 pts (after 1st cascade)
Level complete:        100 pts
```

## Overlap Detection

**Free Tile Requirement**:
```typescript
tile.blockedBy.every(blockerId => {
  const blocker = find by blockerId
  return !blocker || blocker.selected
})
```

**Overlap Type Ranges** (by level):
```
Level 1-3:   20% half + 80% corner          = easy
Level 4-9:   30% half + 70% corner          = medium
Level 10-19: 35% half + 65% corner          = hard
Level 20+:   35% half + 50% corner + 15% near-full = very hard
```

## Cascade Algorithm

```
while (cascadeCount < 50) {
  1. reflowed = reflow(bottom)
  2. runs = scanRuns(reflowed)
  3. if (runs.length === 0) {
       → check win/lose
       → end cascade
     }
  4. newBottom = clearRuns(reflowed, runs)
  5. score += SCORE_PER_CLEAR + SCORE_CASCADE_BONUS
  6. cascadeCount++
  7. bottom = newBottom
}
```

## Multiplayer Flow

### Room Creation
```
createGame({
  title: "Game Name",
  maxPlayers: 4,
  levelStart: 1,
  levelEnd: 10,
  jlptLevels: ['N5']
})
  ↓
Generate seed = Date.now()
Firestore: createGameRoom('kanji-drop', gameData)
Schedule bot auto-join (delay: 5s, count: 1)
```

### Game Start
```
startGame() (host only)
  ↓
Transition: waiting → playing
All players use: seed + level for generatePool()
Result: identical puzzle for all players
```

### Win Condition
```
User finishes level N and N >= levelEnd
  ↓
syncProgress({ finished: true })
  ↓
Set finishedAt = ISO timestamp
First to finish wins
Ranking: finishedAt (earliest) → levelsCompleted → score
```

## Performance Notes

**Memoization**:
- `freeTileIds` in PoolGrid (depends on tiles)
- `availableKanji` in hook (depends on config)
- `containerW/H` in PoolGrid (depends on tiles)

**Cascade Timing**:
- Clear animation delay: 1000ms (`CLEAR_DELAY_MS`)
- Progress sync debounce: 500ms
- Bot auto-join delay: 5000ms

**Complexity**:
- Pool generation: O(n) layout + O(n²) blockers
- Free tile check: O(n²) worst case (usually O(n))
- Cascade loop: O(n) per iteration, max 50 iterations

## Constants Reference

```typescript
BOTTOM_ROW_SIZE = 10
MIN_CLEAR_RUN = 3
STACK_CARD_W = 56px
STACK_CARD_H = 72px
BASE_TILES = 30
TILES_PER_LEVEL = 15
MAX_TILES = 300
CLEAR_DELAY_MS = 1000
SCORE_PER_CLEAR = 10
SCORE_CASCADE_BONUS = 25
SCORE_LEVEL_COMPLETE = 100
MAX_LEVEL = 100
MAX_CASCADE = 50
```

## Integration Points

### Game Hub
```typescript
GAMES['kanji-drop'] = {
  id: 'kanji-drop',
  name: 'Kanji Drop',
  icon: '🀄',
  color: '#8B5CF6',
  difficulty: 'medium',
  category: 'puzzle',
  features: ['100 màn', 'Power-ups', 'Multiplayer'],
  playerRange: '1-10'
}
```

### Auto-Room Creation (from Game Hub Modal)
```
initialRoomConfig: {
  title: string,
  maxPlayers: number,
  levelStart: number,
  levelEnd: number,
  jlptLevel: JLPTLevel
}
  ↓
kanji-drop-page useEffect
  ↓
mp.createGame() with converted config
```

## Common Tasks

### Add a New Level
1. No action needed — levels auto-scale by formula
2. Just increase `MAX_LEVEL` in constants if needed

### Change Difficulty
1. Modify `overlapRoll` thresholds in `generateStackLayout()`
2. Adjust layer count ranges in `getLayerCount()`
3. Change multiplicity (currently always 3)

### Add Power-up Type
1. Add to `PowerUpType` in kanji-drop-types.ts
2. Add case in `assignPowerUps()` (use-kanji-drop-game.ts)
3. Add case in `usePowerUp()` switch statement
4. Implement logic in kanji-drop-engine.ts

### Customize Room Setup
1. Edit `KANJI_DROP_SETUP_CONFIG` in game-configs-kanji-drop.tsx
2. Adjust sliders, labels, rules text
3. Custom setup handled by kanji-drop-custom-setup.tsx

## Testing Priorities

1. **Pool Generation Solvability**: Ensure at least one copy per kanji is reachable
2. **Cascade Logic**: Test multi-level cascades with various tile arrangements
3. **Multiplayer Determinism**: Verify same seed produces identical puzzle
4. **Progress Sync**: Test debouncing and finish detection
5. **Overlap Detection**: Verify free tile computation with complex stacking

---

## File Statistics

| File | Lines | Purpose |
|------|-------|---------|
| kanji-drop-engine.ts | 513 | Core game logic |
| use-kanji-drop-game.ts | 534 | Game state hook |
| kanji-drop-page.tsx | 324 | Main page orchestrator |
| setup-screen.tsx | 145 | Setup UI |
| kanji-drop-manager.tsx | 277 | Admin interface |
| kanji-drop-lobby.tsx | 109 | MP lobby UI |
| pool-grid.tsx | 80 | Tile rendering |
| **Total** | **~2100** | **Complete Kanji Drop system** |

