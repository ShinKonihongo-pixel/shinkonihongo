# Kanji Drop Game Codebase Scout Report

**Date**: 2026-02-28  
**Scope**: Complete architectural overview of Kanji Drop game system  
**Coverage**: Game engine, UI components, multiplayer system, room creation, AI integration

---

## Executive Summary

Kanji Drop is a sophisticated Mahjong-style matching puzzle game with 20+ levels, cascade mechanics, power-ups, and full multiplayer support. The codebase follows a modular architecture with clear separation between game logic (pure functions), React hooks (state management), and UI components.

**Key Architecture Patterns**:
- Pure functional game engine with seeded RNG
- React hooks for local single-player and multiplayer coordination
- Firestore-backed multiplayer with shared seed for deterministic puzzles
- Shared game lobby system (`PremiumLobbyShell`)
- Bot auto-join scheduling with configurable intelligence levels

---

## 1. Game Engine Architecture

**File**: `/src/components/pages/kanji-drop/kanji-drop-engine.ts`

### 1.1 Overlap Detection & Stacking Layout

**Key Concept**: Mahjong-style stacking with layered tiles where cards on top visually block cards below.

#### Position Generation
```
generateStackLayout(totalTiles, rng, level) -> StackPosition[]
```

- **Layers**: Level-based layer count (level 1-2: 2 layers, level 20+: 6-7 layers)
- **Layer Distribution**: Bottom-heavy distribution using weighted algorithm
- **Overlap Types** (difficulty scales by level):
  - **Half overlap**: 50% offset in one axis (easier, loosely blocked)
  - **Corner/Quarter overlap**: 50% offset in both X and Y (medium difficulty)
  - **Near-full overlap**: ~10% random offset (hardest to pick)

**Difficulty Progression**:
```
Level 1-3:   20% half + 80% corner = loose stacking (easy picking)
Level 4-9:   30% half + 70% corner = moderate
Level 10-19: 35% half + 65% corner = challenging
Level 20+:   35% half + 50% corner + 15% near-full = tight/hard
```

#### Blocker Computation
```
computeBlockedBy(positions) -> number[][]
```

- Returns per-position array of blocker POSITION INDICES (not tile IDs)
- Any overlap = blocking (no minimum threshold)
- Only cards with higher `zIndex` block lower cards
- Later resolved to tile IDs in `generatePool()`

### 1.2 Pool Generation with Solvability Guarantee

**Function**: `generatePool(kanjiCards, config, seed) -> PoolTile[]`

**Algorithm**:
1. Shuffle kanji with seeded RNG
2. Generate positions & compute position-based blockers
3. **Depth Group Distribution** (solvability mechanism):
   - Split position indices into 3 depth groups (bottom/middle/top)
   - Each kanji gets copies spread across all 3 depth groups
   - Ensures at least one copy per kanji is always reachable from upper layers
4. Map position blockers → actual tile IDs via `posToTile` map

**Result**: `PoolTile[]` with fields:
```typescript
{
  id: string,              // "tile-0", "tile-1", etc.
  kanjiChar: string,       // The display character
  kanjiId: string,         // Reference to KanjiCard.id
  meaning: string,         // Vietnamese meaning for tooltip
  selected: boolean,       // Whether picked from pool
  x, y, zIndex, rotation,  // Stacking position
  blockedBy: string[]      // IDs of tiles blocking this one
}
```

### 1.3 Bottom Row & Clearing Mechanics

#### Placement
```
placeTile(bottom: BottomSlot[], tile: PoolTile) -> BottomSlot[] | null
```
- Places tile in first available unlocked empty slot (left to right)
- Returns `null` if bottom row full → LOSE condition

#### Reflow
```
reflow(bottom: BottomSlot[]) -> BottomSlot[]
```
- Groups identical kanji by first-appearance order
- Packs tiles into unlocked slots left-to-right
- Compacts spacing between distinct kanji

#### Run Detection
```
scanRuns(bottom: BottomSlot[]) -> number[][]
```
- Finds contiguous runs of ≥3 same kanji
- Runs cannot span locked slots
- Returns array of slot index arrays

#### Cascade System
```
cascadeClear(bottom) -> { finalBottom, totalCleared, cascadeCount }
```
- Single-step: `reflowAndScan()` returns runs after reflow
- Full cascade: iterates reflow+scan up to 50 times
- Animation: `clearingIndices` set in state, timeout triggers actual clear
- Score: `SCORE_PER_CLEAR * tiles` + `SCORE_CASCADE_BONUS * cascadeCount`

### 1.4 Win/Lose Checks

```typescript
checkWin(pool, bottom): boolean  // All pool selected + bottom empty
checkLose(bottom): boolean       // No unlocked empty slots in bottom
```

### 1.5 Power-up System

**Types**: `shuffle`, `restore`, `undo`

#### Shuffle
```
shufflePool(pool, seed) -> PoolTile[]
```
- Preserves position data, swaps kanji content only
- Uses new seed for different shuffle

#### Restore
```
restoreBottom(pool, bottom, seed) -> { newPool, newBottom }
```
- Returns all unselected tiles from bottom to pool
- Shuffles remaining pool

#### Undo
```
createUndoSnapshot(state) -> UndoSnapshot
```
- Stores last 1 move state
- Restores on `usePowerUp('undo')`

---

## 2. Game State & Hook System

**File**: `/src/components/pages/kanji-drop/use-kanji-drop-game.ts`

### 2.1 Hook Props & Configuration

```typescript
useKanjiDropGame({
  kanjiCards: KanjiCard[],
  currentUser?: { id, displayName, avatar, role },
  multiplayerConfig?: {
    seed: number,
    levelStart: number,
    levelEnd: number,
    jlptLevels: JLPTLevel[]
  }
})
```

### 2.2 Setup Configuration

```typescript
interface SetupConfig {
  selectedLevels: JLPTLevel[],      // N5, N4, N3, N2, N1
  startLevel: number,                // Resume from level
  selectedLessonIds: string[]         // Filter kanji by lessons
}
```

**Available Kanji Memo**:
- Filters by JLPT levels AND selected lesson IDs
- Memoized to avoid recalculation
- Used to validate min kanji count before starting

### 2.3 Game State Structure

```typescript
interface GameState {
  phase: 'setup' | 'playing' | 'result',
  result: 'win' | 'lose' | null,
  level: number,
  seed: number,                    // For reproducibility
  pool: PoolTile[],
  bottom: BottomSlot[],
  powerUps: PowerUp[],            // Max count varies
  undoStack: UndoSnapshot[],       // Max 1 (last move)
  score: number,
  moves: number,
  cascadeCount: number,            // Per level
  clearedCount: number,            // Tiles cleared this level
  isVip: boolean,
  selectedJlptLevels: JLPTLevel[],
  clearingIndices: number[],       // Bottom slots being cleared
  mode?: 'single' | 'multi',
  levelStart?: number,
  levelEnd?: number,
  levelsCompleted?: number         // MP tracking
}
```

### 2.4 Level Configuration

**File**: `/src/components/pages/kanji-drop/kanji-drop-constants.ts`

```typescript
function getLevelConfig(level: number, isVip: boolean): LevelConfig
```

**Progression**:
- **Base Tiles**: 30 + (level - 1) × 15, capped at 300
- **Kanji Variety**: totalTiles / 3 (always 3 copies per kanji)
- **Locked Slots**:
  - Level 1-9: [8, 9] (2 locked)
  - Level 10-19: [7, 8, 9] (3 locked)
  - Level 20+: [6, 7, 8, 9] (4 locked)
  - VIP: No locked slots
- **Power-ups per Level**:
  - Regular: 1 (distributed among shuffle/restore/undo)
  - VIP: 2

**Scoring**:
- Per tile cleared: 10 points
- Per cascade bonus: 25 points
- Level complete bonus: 100 points

### 2.5 Single-Player Flow

1. **startGame()**
   - Load setup config (selected levels, lessons, start level)
   - Generate pool with seeded RNG
   - Init bottom row
   - Assign power-ups
   - Transition to 'playing' phase

2. **pickTile(tileId)**
   - Validate phase is 'playing' (not cascading)
   - Create undo snapshot
   - Mark tile as selected in pool
   - Place tile in bottom row
   - Reflow & scan for runs
   - If runs: set `clearingIndices`, wait for cascade animation
   - If no runs: immediately check win/lose
   - Play appropriate sound effect

3. **Cascade Animation**
   - On `clearingIndices` change: timeout waits `CLEAR_DELAY_MS` (1000ms)
   - Actually clears marked indices
   - Reflowed & scans for more runs
   - Repeats until no runs found
   - Then checks win/lose condition

4. **Result Phase**
   - Win: Save progress to localStorage, show result screen
   - Lose: Show result screen with retry option
   - Victory sound plays on win

### 2.6 Multiplayer Flow

1. **startMultiplayerGame()**
   - Uses shared `multiplayerConfig` seed
   - Uses filtered kanji (by jlptLevels from settings)
   - Same cascade/win/lose logic as single-player
   - Mode set to 'multi'

2. **Progress Sync**
   - Hooked by page component
   - Debounced (max 1 sync per 500ms, always sync on finish)
   - Updates player's current level, score, clearedCount
   - When all players finished: game marked 'finished'

3. **nextLevel()**
   - Increments level
   - MP: checks if level > levelEnd (game over)
   - Generates new pool with new level seed
   - Resets moves/cascades/clearingIndices

---

## 3. Multiplayer Architecture

### 3.1 Multiplayer Types

**File**: `/src/components/pages/kanji-drop/kanji-drop-multiplayer-types.ts`

```typescript
interface KanjiDropMultiplayerPlayer {
  odinhId: string,
  displayName: string,
  avatar: string,
  role?: string,
  score: number,
  currentLevel: number,
  clearedCount: number,
  levelsCompleted: number,
  finishedAt?: string,    // ISO string — first to finish wins
  isBot?: boolean
}

interface KanjiDropMultiplayerSettings {
  maxPlayers: number,
  minPlayers: number,
  levelStart: number,
  levelEnd: number,
  jlptLevels: JLPTLevel[],
  seed: number            // Shared seed for identical puzzle generation
}

interface KanjiDropMultiplayerGame {
  id: string,
  code: string,
  hostId: string,
  title: string,
  settings: KanjiDropMultiplayerSettings,
  status: 'waiting' | 'starting' | 'playing' | 'finished',
  players: Record<string, KanjiDropMultiplayerPlayer>,
  createdAt: string,
  startedAt?: string
}
```

**Default Settings**:
```typescript
{
  maxPlayers: 4,
  minPlayers: 2,
  levelStart: 1,
  levelEnd: 10,
  jlptLevels: ['N5'],
  seed: 0
}
```

### 3.2 Room Creation Flow

**File**: `/src/hooks/kanji-drop/use-game-creation.ts`

**Entry Point**: `createGame(data: CreateKanjiDropRoomData)`

```typescript
interface CreateKanjiDropRoomData {
  title: string,
  maxPlayers: number,
  levelStart: number,
  levelEnd: number,
  jlptLevels: JLPTLevel[]
}
```

**Process**:
1. Generate random seed = `Date.now()`
2. Build settings object
3. Create initial player object (host)
4. Generate game code (4-5 chars)
5. Write to Firestore `createGameRoom('kanji-drop', gameData)`
6. Store Firestore ID locally
7. Schedule bot auto-join

**Bot Auto-Join**:
- Configured: `[{ delay: 5000, count: 1 }]`
- First bot joins 5 seconds after room creation
- Uses `generateBots(count)` from `/src/types/game-hub.ts`
- Creates realistic Japanese names & avatars

### 3.3 Game Actions

**File**: `/src/hooks/kanji-drop/use-game-actions.ts`

#### Join Game
- Creates new player object from `currentUser`
- Adds to `game.players[userId]`
- Sets current level = `settings.levelStart`

#### Leave Game
- Removes player from room
- If host leaves: promotes next player or deletes room

#### Kick Player
- Host only
- Removes player from `game.players`

#### Start Game
- Host only
- Transitions status: 'waiting' → 'starting' → 'playing'
- All players receive identical seed for same puzzles

#### Add Bot (Manual)
```typescript
const addBot = useCallback(() => {
  if (currentCount >= maxPlayers) return;
  const bot = generateBots(1)[0];
  const botId = `bot-${generateId()}`;
  newPlayers[botId] = {
    odinhId: botId,
    displayName: bot.name,
    avatar: bot.avatar,
    score: 0,
    currentLevel: settings.levelStart,
    clearedCount: 0,
    levelsCompleted: 0,
    isBot: true
  };
})
```

### 3.4 Progress Synchronization

**File**: `/src/hooks/kanji-drop/use-progress-sync.ts`

**Function**: `syncProgress(data: ProgressData)`

```typescript
interface ProgressData {
  currentLevel: number,
  score: number,
  clearedCount: number,
  levelsCompleted: number,
  finished?: boolean
}
```

**Behavior**:
- Debounced: max 1 sync per 500ms (except on finish)
- Updates player object in game state
- On finish: sets `finishedAt = ISO string`
- **Ranking Logic**: (in `use-game-state.ts`)
  - First: Players with `finishedAt` (earliest wins)
  - Second: By `levelsCompleted` descending
  - Third: By `score` descending

---

## 4. UI Components

### 4.1 Main Page Component

**File**: `/src/components/pages/kanji-drop-page.tsx`

**Props**:
```typescript
interface KanjiDropPageProps {
  onClose: () => void,
  kanjiCards: KanjiCard[],
  currentUser?: { id, displayName, avatar, role },
  onSaveGameSession?: (data: Omit<GameSession, 'id' | 'userId'>) => void,
  initialRoomConfig?: Record<string, unknown>,    // Auto-create from Game Hub
  initialJoinCode?: string                        // Auto-join from QR/code
}
```

**View Modes**:
```
Single-player: setup → play → results
Multiplayer: lobby → play → results
```

**State Management**:
- `useKanjiDropGame()` for local game logic
- `useKanjiDropMultiplayer()` for room/player management
- Auto-bridge: when MP game transitions to 'playing', calls `startMultiplayerGame()`

**Auto-Creation from Game Hub**:
```typescript
useEffect(() => {
  if (initialRoomConfig && !mp.game && !createOnceRef.current) {
    createOnceRef.current = true;
    mp.createGame({
      title: cfg.title || 'Kanji Drop',
      maxPlayers: cfg.maxPlayers || 4,
      levelStart: cfg.levelStart || 1,
      levelEnd: cfg.levelEnd || cfg.totalRounds || 10,
      jlptLevels: cfg.jlptLevel ? [cfg.jlptLevel] : ['N5']
    });
  }
}, []);
```

### 4.2 Pool Grid Component

**File**: `/src/components/pages/kanji-drop/pool-grid.tsx`

**Key Functionality**:
- Renders tiles in absolute positions
- Computes free tiles (no unselected blocker)
- Free tiles: highlighted, clickable, glow effect
- Blocked tiles: dimmed, disabled (can't click)
- Displays remaining tile count

**Layout Calculation**:
```typescript
const containerW = max(tile.x + STACK_CARD_W)
const containerH = max(tile.y + STACK_CARD_H)
```

**Tile Rendering**:
```jsx
<button
  className={`kd-stack-card ${isFree ? 'free' : 'blocked'}`}
  style={{ left, top, zIndex: zIndex * 10 }}
  onClick={() => onPickTile(tile.id)}
  disabled={!isFree}
  title={`${kanjiChar} — ${meaning}`}
>
  <span className="kd-card-char">{kanjiChar}</span>
  <span className="kd-card-meaning">{meaning}</span>
</button>
```

### 4.3 Bottom Row Component

**File**: `/src/components/pages/kanji-drop/bottom-row.tsx`

**Features**:
- 10 slots displayed in sequence
- Locked slots: show lock icon
- Filled slots: show kanji character
- Empty slots: outline only
- Clearing slots: fade/dissolve animation class

```jsx
<div className={`kd-bottom-slot ${slot.locked ? 'locked' : ''} ${slot.tile ? 'filled' : 'empty'} ${isClearing ? 'clearing' : ''}`}>
  {slot.locked && !slot.tile && <Lock />}
  {slot.tile && <span className="kd-slot-char">{slot.tile.kanjiChar}</span>}
</div>
```

### 4.4 Setup Screen Component

**File**: `/src/components/pages/kanji-drop/setup-screen.tsx`

**Sections**:
1. **JLPT Level Selector** (N5, N4, N3, N2, N1)
   - Shows count of kanji per level
   - Multi-select chips
   - Disabled if count = 0

2. **Lesson Picker** (optional)
   - Auto-derived from kanji cards
   - Groups by lesson ID
   - Shows count per lesson

3. **Start Level Selector**
   - Quick buttons: 1, 5, 10, 15, 20
   - Defaults to previous progress

4. **Info Box**
   - Available kanji count
   - VIP status & benefits

**Validation**:
- Start button disabled if: `availableKanjiCount < 4` OR no levels selected

### 4.5 Playing Screen Component

**File**: `/src/components/pages/kanji-drop/playing-screen.tsx`

**Layout**:
```
┌─────────────────────────────────┐
│ Home | Level X | Score | Moves  │
├─────────────────────────────────┤
│                                 │
│    Pool Grid (Stacked Cards)    │
│                                 │
├─────────────────────────────────┤
│  Bottom Row (10 slots)          │
├─────────────────────────────────┤
│  Power-ups (3 buttons)          │
└─────────────────────────────────┘
```

**Features**:
- Disables pool grid during cascade animation
- Shows level badge, score, move counter

### 4.6 Lobby Component

**File**: `/src/components/kanji-drop/kanji-drop-lobby.tsx`

**Uses**: Shared `PremiumLobbyShell` from `/src/components/shared/game-lobby`

**Theme**: Purple accent `#8B5CF6` (Kanji Drop brand color)

**Metadata Tags**:
- Level range (Màn X → Y)
- Total levels count
- JLPT levels
- Live indicator

**Sections**:
- Host card display
- Join code + QR toggle
- Add Bot button (host only)
- Game rules (hardcoded)
- Level range info
- Players panel (right side)

**Rule Text**:
```
- Xếp kanji vào hàng, gom 3+ giống nhau để tiêu diệt
- Tất cả người chơi nhận bài giống nhau (cùng seed)
- Ai hoàn thành X màn trước → thắng!
- Power-ups: Xáo trộn, Hoàn tác, Thu hồi
```

---

## 5. Game Hub Integration

**File**: `/src/types/game-hub.ts`

### 5.1 Game Registration

```typescript
GAMES['kanji-drop'] = {
  id: 'kanji-drop',
  name: 'Kanji Drop',
  description: 'Xếp kanji vào hàng, gom nhóm và tiêu diệt!',
  icon: '🀄',
  color: '#8B5CF6',
  gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 50%, #C4B5FD 100%)',
  playerRange: '1-10',
  features: ['100 màn chơi', 'Power-ups', 'Multiplayer Race'],
  difficulty: 'medium',
  isNew: true,
  category: 'puzzle'
}
```

### 5.2 Room Setup Configuration

**File**: `/src/components/game-hub/room-setup/game-configs-kanji-drop.tsx`

```typescript
const KANJI_DROP_SETUP_CONFIG: GameSetupConfig = {
  showTitle: true,
  titlePlaceholder: 'Kanji Drop',
  showJLPTLevel: true,
  showMaxPlayers: true,
  maxPlayersSlider: { min: 2, max: 10, step: 1, defaultValue: 4 },
  showTotalRounds: true,
  roundsSlider: { min: 5, max: 100, step: 5, defaultValue: 10 },
  roundsLabel: 'Số màn tối đa',
  roundsSuffix: ' màn'
}
```

### 5.3 Custom Level Range Setup

**File**: `/src/components/game-hub/room-setup/kanji-drop-custom-setup.tsx`

**Level Presets**:
- Dễ (1-10)
- Trung bình (11-30)
- Khó (31-60)
- Siêu khó (61-100)

**Custom Input**:
- Dual number inputs: start → end
- Validation: 1-100 range, end ≥ start

---

## 6. Types & Constants

### 6.1 Core Types

**File**: `/src/components/pages/kanji-drop/kanji-drop-types.ts`

```typescript
interface PoolTile {
  id: string,
  kanjiChar: string,
  kanjiId: string,
  meaning: string,
  selected: boolean,
  x, y: number,
  zIndex: number,
  rotation: number,
  blockedBy: string[]
}

interface BottomSlot {
  index: number,
  tile: PoolTile | null,
  locked: boolean
}

interface PowerUp {
  type: 'shuffle' | 'restore' | 'undo',
  count: number
}

interface LevelConfig {
  level: number,
  totalTiles: number,
  kanjiVariety: number,
  multiplicities: number[],
  lockedSlots: number[],
  powerUpReward: number
}
```

### 6.2 Constants

**File**: `/src/components/pages/kanji-drop/kanji-drop-constants.ts`

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
```

---

## 7. Multiplayer Hooks System

### 7.1 Hook Composition

**File**: `/src/hooks/kanji-drop/index.ts`

Main hook: `useKanjiDropMultiplayer({ currentUser })`

**Composes**:
1. `useGameState()` - State + bot scheduling
2. `useGameCreation()` - Room creation
3. `useGameActions()` - Join, leave, kick, start, etc.
4. `useProgressSync()` - Player progress debouncing

**Return API**:
```typescript
{
  game,
  gameResults,
  loading, error,
  roomId,
  isHost,
  currentPlayer,
  sortedPlayers,
  createGame,
  joinGame,
  leaveGame,
  kickPlayer,
  startGame,
  addBot,
  resetGame,
  syncProgress,
  setError
}
```

### 7.2 Game State Management

**File**: `/src/hooks/kanji-drop/use-game-state.ts`

**Wraps**: `useGameRoomState()` (shared multiplayer hook)

**Player Sorting**:
```
1. Players with finishedAt (earliest first)
2. By levelsCompleted (highest first)
3. By score (highest first)
```

**Bot Auto-Join**:
- Schedule: `[{ delay: 5000, count: 1 }]`
- Generates bot with realistic name + avatar

---

## 8. CSS & Styling

**File**: `/src/components/pages/kanji-drop/kanji-drop.css`

**Key Classes**:
- `.kd-setup` - Setup screen container
- `.kd-pool` - Pool grid wrapper
- `.kd-stack-container` - Absolute positioned tiles
- `.kd-stack-card` - Individual tile button
  - `.free` - Selectable (glow effect)
  - `.blocked` - Dimmed/disabled
- `.kd-bottom` - Bottom row container
- `.kd-bottom-slot` - Individual slot
  - `.locked` - Lock icon visible
  - `.filled` - Contains kanji
  - `.clearing` - Fade out animation
- `.kd-playing` - Game layout container
- `.kd-game-header` - Top bar with level/score
- `.kd-mp-layout` - Multiplayer split layout with progress bar

---

## 9. File Inventory

### Game Engine & Logic
- `kanji-drop-engine.ts` (513 lines) - Pure game functions
- `kanji-drop-types.ts` (95 lines) - Type definitions
- `kanji-drop-constants.ts` (61 lines) - Game constants & level config
- `kanji-drop-multiplayer-types.ts` (85 lines) - MP type definitions

### Game Hooks
- `use-kanji-drop-game.ts` (534 lines) - Main single-player + MP game hook
- `use-game-state.ts` (69 lines) - MP state management
- `use-game-creation.ts` (104 lines) - Room creation
- `use-game-actions.ts` (81 lines) - Join/leave/kick/start/bot
- `use-progress-sync.ts` (59 lines) - MP progress debouncing
- `index.ts` (66 lines) - Hook composition

### UI Components
- `kanji-drop-page.tsx` (324 lines) - Main page orchestrator
- `setup-screen.tsx` (145 lines) - Game setup
- `playing-screen.tsx` (59 lines) - Game layout
- `pool-grid.tsx` (80 lines) - Stacked tiles display
- `bottom-row.tsx` (36 lines) - Bottom row display
- `power-up-bar.tsx` - Power-up controls
- `result-screen.tsx` - Win/lose results
- `multiplayer-progress-bar.tsx` - MP progress display
- `multiplayer-result-screen.tsx` - MP final results
- `tutorial-overlay.tsx` - Game tutorial

### Multiplayer UI & Management
- `kanji-drop-lobby.tsx` (109 lines) - Multiplayer lobby
- `kanji-drop-manager.tsx` (277 lines) - Admin game management interface

### Game Hub Integration
- `game-configs-kanji-drop.tsx` (32 lines) - Room setup config
- `kanji-drop-custom-setup.tsx` (84 lines) - Level range picker

---

## 10. Key Algorithms & Mechanics

### 10.1 Overlap Detection Algorithm

**Problem**: Determine which tiles can be selected (not blocked)

**Solution**:
```typescript
// In PoolGrid component
const freeTileIds = useMemo(() => {
  const free = new Set<string>();
  for (const tile of tiles) {
    if (tile.selected) continue;
    // Check if all blockers are selected
    const isFree = tile.blockedBy.every(blockerId => {
      const blocker = tiles.find(t => t.id === blockerId);
      return !blocker || blocker.selected;  // Free if blocker doesn't exist or is selected
    });
    if (isFree) free.add(tile.id);
  }
  return free;
}, [tiles]);
```

**Time Complexity**: O(n²) worst case, but typically O(n) with small blocker lists

### 10.2 Cascade Animation Loop

**Problem**: Animate clearing tiles, then reflow, scan for more clears

**Solution** (in `use-kanji-drop-game.ts`):
```typescript
useEffect(() => {
  if (gameState.clearingIndices.length === 0) return;
  
  cascadeTimerRef.current = setTimeout(() => {
    setGameState(prev => {
      // 1. Clear marked indices
      const { newBottom, clearedCount } = clearRuns(prev.bottom, [prev.clearingIndices]);
      
      // 2. Reflow and scan
      const { reflowed, runs: nextRuns } = reflowAndScan(newBottom);
      
      // 3. If more runs: set clearingIndices again (loop continues)
      // 4. If no runs: check win/lose
    });
  }, CLEAR_DELAY_MS);
  
  return () => clearTimeout(cascadeTimerRef.current);
}, [gameState.clearingIndices, gameState.phase]);
```

### 10.3 Seeded RNG for Multiplayer Determinism

**Problem**: All players must get identical puzzles

**Solution**:
```typescript
// Room creation
const seed = Date.now();
settings.seed = seed;

// Player side
const levelSeed = settings.seed + level;  // Different seed per level
const pool = generatePool(kanji, config, levelSeed);
```

Each player with same `levelSeed` gets identical puzzle from deterministic RNG.

### 10.4 Solvability Guarantee

**Problem**: Avoid unwinnable puzzles (tiles locked under cascading blockers)

**Solution** (depth group distribution):
```typescript
// Split position indices into 3 depth groups
const depthGroups = [
  posIndices.slice(0, K),        // Bottom layer positions
  posIndices.slice(K, K * 2),    // Middle layer positions
  posIndices.slice(K * 2)        // Top layer positions
];

// Each kanji gets 3 copies, one from each depth group
for (let i = 0; i < config.kanjiVariety; i++) {
  for (let c = 0; c < copies; c++) {
    const posIdx = depthGroups[c][i];  // Different depth per copy
    // ... create tile
  }
}
```

**Guarantee**: At least one copy of each kanji is in a reachable position (not permanently blocked).

---

## 11. State Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ Single-Player Setup                                      │
├─────────────────────────────────────────────────────────┤
│ phase='setup' → onStart() → startGame()                 │
│                                                          │
│ setGameState({                                           │
│   phase: 'playing',                                      │
│   pool: generatePool(),                                  │
│   bottom: initBottomRow(),                              │
│   powerUps: assignPowerUps()                            │
│ })                                                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Playing Phase                                            │
├─────────────────────────────────────────────────────────┤
│ User clicks tile → pickTile(tileId)                     │
│                                                          │
│ 1. Mark selected in pool                               │
│ 2. placeTile() → add to bottom row                      │
│ 3. reflowAndScan() → find runs                          │
│                                                          │
│ If runs found:                                           │
│   setGameState({ clearingIndices: [...] })             │
│     → useEffect fires timeout                            │
│     → clearRuns() + reflowAndScan()                     │
│     → repeat or end cascade                            │
│                                                          │
│ If no runs or bottom full:                              │
│   → Check checkWin() or checkLose()                     │
│   → Transition to 'result' phase                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Result Phase (Win/Lose)                                  │
├─────────────────────────────────────────────────────────┤
│ Show result screen                                       │
│ Options: Next Level, Replay, Home                       │
└─────────────────────────────────────────────────────────┘
```

---

## 12. Key Design Patterns

### 12.1 Pure Game Functions
- `kanji-drop-engine.ts` contains only pure functions
- No side effects, no React dependencies
- Easy to test and reason about
- Deterministic with seeded RNG

### 12.2 Custom Hooks Composition
- Small, focused hooks (use-game-state, use-game-actions, etc.)
- Each handles one concern
- Composed together in main hook
- Reusable across games

### 12.3 Shared Lobby System
- Reuses `PremiumLobbyShell` from `/components/shared/game-lobby`
- Theming via color props (purple for kanji-drop)
- Reduces code duplication across games

### 12.4 Firestore-Backed Multiplayer
- Rooms stored in Firestore
- Subscriptions push real-time updates
- Seeded puzzle generation ensures determinism
- Progress syncing debounced for performance

---

## 13. Performance Considerations

### Memoization
- `freeTileIds` memoized in PoolGrid
- `availableKanji` memoized in hook
- `containerW/H` memoized based on tiles

### Cascade Debouncing
- Progress syncing: max 500ms between writes
- Timeout-based: clear animation is 1000ms

### Pool Generation
- O(n) layout generation
- O(n²) blocker computation (but small in practice)
- One-time generation per level

---

## 14. Unresolved Questions

1. **AI Player Logic**: No AI-specific decision logic found. Are bots just players who automatically finish? Or do they have move delays/accuracy simulation?

2. **Audio Effects**: `useGameSounds()` referenced but not shown. What's the source of sound effects?

3. **Lesson ID Mapping**: How are lessons derived/populated? Is there a lesson management system?

4. **localStorage Scope**: `STORAGE_KEY = 'kanji-drop-progress'` — is this per-user or global? How does it interact with server-side progress?

5. **Result Screen Details**: `result-screen.tsx` and `multiplayer-result-screen.tsx` not fully read. What are the exact components?

6. **CSS Animations**: `.clearing` class animation details not shown. Need to check `.css` file for actual animation definitions.

7. **Bot Difficulty Simulation**: `BotIntelligence` types exist but where do they affect gameplay?

8. **Firestore Integration**: Exact Firestore paths/collections not documented. Inferred from `createGameRoom()` calls.

---

## Summary

Kanji Drop is a well-architected puzzle game with:
- **Robust game engine** using pure functions + seeded RNG
- **Sophisticated stacking/blocking logic** with solvability guarantees
- **Comprehensive multiplayer** using Firestore + shared seed determinism
- **Modular React hooks** for state management
- **Reusable shared components** (lobby, game types)
- **Strong game progression** (20 levels, scaling difficulty, power-ups)

The codebase demonstrates professional software engineering with clear separation of concerns, deterministic gameplay, and real-time multiplayer capabilities.
