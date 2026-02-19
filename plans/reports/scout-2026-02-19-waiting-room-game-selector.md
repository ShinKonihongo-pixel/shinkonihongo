# Scout Report: Waiting Room & Game Selector Components
**Date:** 2026-02-19
**Task:** Locate all files related to waiting room (phòng chờ) and game selector components in game hub

---

## Summary
Located 10+ key files spanning React components, CSS styling, TypeScript types, and Firestore services. All files related to the waiting room grid, room cards, game selector, and game room management are documented below.

---

## Component Files

### 1. WaitingRoom Component (Main Grid)
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/waiting-room.tsx` (322 lines)

**Purpose:** Primary component that renders the waiting room lobby with real-time Firestore subscription.

**Key Features:**
- Real-time room list updates via `subscribeToAllWaitingRooms()`
- Room filtering by game type
- Search functionality (by room title, host name, code, game name)
- Displays room cards in grid layout
- Admin controls for deleting single/all rooms
- Confirmation modals for delete actions
- Stats bar showing room count and player count

**Key Props:**
```typescript
interface WaitingRoomProps {
  onJoinGame: (gameType: GameType, code: string) => void;
  onBack: () => void;
  onCreateRoom?: () => void;
  filterGameType?: GameType | null;
  userRole?: UserRole;
}
```

**Key Functions:**
- `formatTimeAgo()` - Converts createdAt to human-readable format (e.g., "Vừa tạo", "5 phút")
- `handleDeleteRoom()` - Admin function to delete single room
- `handleDeleteAllRooms()` - Admin function to delete all waiting rooms

**State Management:**
- `rooms`: WaitingRoomGame[] - All available rooms
- `searchQuery`: string - Current search filter
- `selectedGameFilter`: GameType | 'all' - Game type filter
- `hiddenGames`: GameType[] - Games hidden by admin
- `deleteConfirm`: Delete confirmation state
- `showBackConfirm`: Back button confirmation

---

### 2. GameSelector Component
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/game-selector.tsx` (253 lines)

**Purpose:** Top-level game selection interface with hero section and 3-column game grid.

**Key Features:**
- Two-view system: games grid view and waiting room view
- Hero section with game stats (game count, multiplayer, realtime)
- Search functionality across game names/descriptions
- 3-column responsive grid layout
- Game visibility management (hides games from admin setting)
- Minimal game cards with "Create Room" and "Join Waiting Room" buttons
- Difficulty labels (Easy, Medium, Hard)
- Badge system for new/popular games

**Key Props:**
```typescript
interface GameSelectorProps {
  onSelectGame: (game: GameType) => void;
  onQuickJoin: (gameType: GameType, code: string) => void;
  onSetupGame: (game: GameType) => void;
  userRole?: UserRole;
  initialView?: SelectorView; // 'games' | 'waiting-room'
}
```

**State Management:**
- `currentView`: 'games' | 'waiting-room' - Current displayed view
- `searchQuery`: string - Game search filter
- `filterGameType`: GameType | null - Filter for waiting room
- `hiddenGames`: GameType[] - Games hidden by admin

**Sub-Component: GameCardMinimal**
- Renders individual game cards
- Shows game icon, name, player range, difficulty
- Two action buttons (create room / join waiting room)
- AI Challenge games have single "Choi ngay" button
- Badges for NEW and HOT status

---

### 3. CSS Styling
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/game-hub.css` (80k+ lines)

**Waiting Room V2 Classes (lines 2650-3150+):**

**Header & Controls:**
- `.waiting-room-v2` - Main container
- `.wr-header` - Header with back button, title, refresh button
- `.wr-back-btn` - Back button styling
- `.wr-title` - Title with gradient text (purple/pink)
- `.wr-filter-badge` - Game type filter badge
- `.wr-refresh-btn` - Refresh button with loading state animation

**Search & Filters:**
- `.wr-controls` - Container for search and filter controls
- `.wr-search` - Search input wrapper with icon
- `.wr-search input` - Search field styling
- `.wr-search-clear` - Clear button for search
- `.wr-filter-select-wrap` - Filter dropdown wrapper
- `.wr-filter-select` - Game type filter select

**Stats Section:**
- `.wr-stats-bar` - Bar showing room count, player count, admin delete button
- `.wr-stat` - Individual stat item
- `.wr-admin-delete-all` - Admin "Delete All" button

**Content Area:**
- `.wr-games-container` - Main content container
- `.wr-loading` - Loading state with spinner
- `.wr-empty` - Empty state message

**Room Grid & Cards:**
- `.wr-games-grid` - Multi-column grid layout
- `.wr-room-card` - Individual room card styling
- `.wr-room-card:hover` - Hover effect
- `.wr-room-card.full` - Styling when room is full
- `.wr-room-type` - Game type badge with gradient background
- `.wr-room-code` - Room code display
- `.wr-room-info` - Container for host info and metadata
- `.wr-room-host` - Host display (avatar + name)
- `.wr-room-meta` - Metadata (player count, created time)
- `.wr-room-actions` - Action buttons (Join, Admin Delete)
- `.wr-join-btn` - Join button styling
- `.wr-admin-delete-btn` - Admin delete button for single room

**Game Selector Classes (lines 1257-2500+):**
- `.game-selector` - Main container
- `.game-hub-hero` - Hero section with title and stats
- `.hero-btn.browse-rooms` - Browse rooms button
- `.games-grid-3col` - 3-column responsive grid
- `.game-card-minimal` - Minimal game card styling
- `.card-badge` - NEW/HOT badge
- `.card-icon-area` - Game icon container with gradient
- `.card-info` - Card info section
- `.card-meta-row` - Meta info row
- `.meta-difficulty` - Difficulty badge
- `.card-actions-row` - Action buttons row
- `.btn-create-room` - Create room button
- `.btn-join-waiting` - Join waiting room button
- `.game-search-section` - Search section styling
- `.game-no-results` - No results state
- `.game-empty-state` - All games hidden state

**Color Variables Used:**
- `--primary` - Orange (#E34234)
- `--jp-ai-light` - Light blue (#4A7A9E)
- `--jp-ai-dark` - Dark blue
- Gradient backgrounds from GAMES configuration

---

## Type Definitions

### 1. Game Hub Types
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/types/game-hub.ts` (300+ lines)

**Key Interfaces:**

```typescript
export type GameType = 'quiz' | 'golden-bell' | 'picture-guess' | 'bingo' | 
                       'kanji-battle' | 'word-match' | 'ai-challenge' | 
                       'image-word' | 'word-scramble';

export interface GameInfo {
  id: GameType;
  name: string;
  description: string;
  icon: string;
  iconImage?: string; // Optional custom icon URL
  color: string;
  gradient: string;
  playerRange: string;
  features: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  isNew?: boolean;
  isPopular?: boolean;
  category?: 'racing' | 'quiz' | 'elimination' | 'puzzle';
}

export interface WaitingRoomGame {
  id: string;
  code: string;
  gameType: GameType;
  title: string;
  hostName: string;
  hostAvatar: string;
  playerCount: number;
  maxPlayers: number;
  createdAt: string;
  status: 'waiting' | 'starting';
}

export interface GameHubState {
  selectedGame: GameType | null;
  joinCode: string | null;
}

export type BotIntelligence = 'weak' | 'average' | 'smart' | 'genius';
```

**Helper Functions:**
- `generateBot()` - Creates random bot with Japanese name and avatar
- `generateBots(count)` - Creates multiple unique bots
- `getVisibleGames(hiddenGames)` - Filters games by visibility
- `GAMES` constant - Record<GameType, GameInfo> with all game configs

---

### 2. Room Setup Types
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/room-setup/types.ts` (73 lines)

```typescript
export interface GameRoomConfig {
  title: string;
  maxPlayers: number;
  timePerQuestion?: number;
  totalRounds?: number;
  skillsEnabled?: boolean;
  jlptLevel?: JLPTLevel;
  categories?: string[];
  difficultyProgression?: boolean;
  [key: string]: unknown;
}

export interface GameSetupConfig {
  showTitle?: boolean;
  titlePlaceholder?: string;
  maxTitleLength?: number;
  showMaxPlayers?: boolean;
  maxPlayersOptions?: number[];
  maxPlayersSlider?: SliderConfig;
  showTimePerQuestion?: boolean;
  timeSlider?: SliderConfig;
  showTotalRounds?: boolean;
  roundsSlider?: SliderConfig;
  showJLPTLevel?: boolean;
  showCategories?: boolean;
  categories?: SelectOption[];
  multiSelectCategories?: boolean;
  toggles?: ToggleOption[];
  customSections?: React.ReactNode;
  rules?: string[];
}

export interface GameRoomSetupProps {
  gameType: GameType;
  config: GameSetupConfig;
  onCreateRoom: (roomConfig: GameRoomConfig) => void;
  onBack: () => void;
  loading?: boolean;
  error?: string | null;
  inline?: boolean;
  getAvailableQuestionCount?: (level: JLPTLevel) => number;
}
```

---

## Firestore Service

### Game Rooms Service
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/services/game-rooms/index.ts` (219 lines)

**Collections:**
- `game_rooms` - Non-quiz games (bingo, golden-bell, word-match, etc.)
- `quiz_games` - Quiz game rooms

**Key Functions:**

```typescript
// Create game room
createGameRoom(gameType: GameType, gameData: Record<string, unknown>): Promise<string>

// Update existing room
updateGameRoom(roomId: string, data: Record<string, unknown>): Promise<void>

// Delete single room
deleteGameRoom(roomId: string): Promise<void>

// Find room by code (searches both collections)
findRoomByCode(code: string): Promise<{id, gameType, data} | null>

// Subscribe to specific room (real-time)
subscribeToGameRoom<T>(roomId: string, callback: (game: T & {id}) => void)

// Subscribe to ALL waiting rooms (real-time)
subscribeToAllWaitingRooms(callback: (rooms: WaitingRoomGame[]) => void): () => void

// Admin delete functions
deleteWaitingRoom(roomId: string, gameType: GameType): Promise<void>
deleteAllWaitingRooms(): Promise<number>
```

**Helper Functions:**
- `toWaitingRoomGame()` - Converts Firestore doc to WaitingRoomGame interface
- `autoCleanEmptyRooms()` - Auto-cleanup stale rooms with 0 players
- `cleanData()` - Strips undefined values before writing to Firestore

---

## Game Visibility Service

**File:** `/Users/admin/Documents/名称未設定フォルダ/src/services/game-visibility-storage.ts` (68 lines)

**Purpose:** Manages which games are hidden/visible in the game hub (localStorage-based).

```typescript
export interface GameVisibilitySettings {
  hiddenGames: GameType[];
  updatedAt: number;
}

// Get/save visibility settings
getGameVisibilitySettings(): GameVisibilitySettings
saveGameVisibilitySettings(settings: GameVisibilitySettings): void

// Visibility operations
toggleGameVisibility(gameId: GameType): boolean
isGameHidden(gameId: GameType): boolean
getHiddenGames(): GameType[]
showAllGames(): void
```

---

## Room Setup Components (Sub-Components)

**Directory:** `/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/room-setup/`

**Files:**
- `game-room-setup.tsx` - Main form component (5417 bytes)
- `game-configs.tsx` - Config index (311 bytes)
- `game-configs-basic.tsx` - Basic settings UI (1672 bytes)
- `game-configs-advanced.tsx` - Advanced settings UI (3314 bytes)
- `game-configs-extra.tsx` - Extra game-specific settings (1428 bytes)
- `room-header.tsx` - Header component (1055 bytes)
- `room-footer.tsx` - Footer with action buttons (1569 bytes)
- `room-preview.tsx` - Room preview section (1984 bytes)
- `form-fields.tsx` - Reusable form field components (4811 bytes)
- `types.ts` - TypeScript interfaces (73 lines)
- `index.ts` - Barrel export (362 bytes)

**Exported from `room-setup/index.ts`:**
- `GameRoomSetup` component
- Type interfaces: `GameRoomConfig`, `GameSetupConfig`, `GameRoomSetupProps`
- Game configs: `BINGO_SETUP_CONFIG`, `KANJI_BATTLE_SETUP_CONFIG`, `GOLDEN_BELL_SETUP_CONFIG`, `PICTURE_GUESS_SETUP_CONFIG`, `WORD_MATCH_SETUP_CONFIG`, `IMAGE_WORD_SETUP_CONFIG`, `WORD_SCRAMBLE_SETUP_CONFIG`

---

## Related Components in Game Hub

**Other Key Files in `/src/components/game-hub/`:**
- `game-room-setup.tsx` - Wrapper for room setup
- `floating-music-player.tsx` - Music player
- `player-leaderboard.tsx` - Leaderboard display
- `music-player/` - Music player subcomponents

**Game Type Specific Hooks (Reference):**
- `src/hooks/golden-bell/use-game-*.ts`
- `src/hooks/bingo-game/use-game-*.ts`
- `src/hooks/word-match/use-game-*.ts`
- `src/hooks/picture-guess/use-game-*.ts`
- `src/hooks/kanji-battle/use-game-*.ts`

---

## CSS Structure Overview

**Total CSS Lines:** ~80,000 characters across one unified file

**Key Sections:**
1. Game Room Setup styles (`.grs-*`) - ~350 lines
2. Game Selector styles (`.game-*`) - ~1200 lines
3. Waiting Room V1 styles (`.waiting-room-*`) - ~300 lines
4. Waiting Room V2 styles (`.wr-*`) - ~500 lines
5. Game Hub Hero (`.hero-*`) - ~150 lines
6. Games Grid (`.games-grid-*`) - ~50 lines

**Responsive Design:**
- Mobile-first approach
- 3-column grid reduces to 2 columns on tablets
- Single column on mobile (< 768px)

**Dark Theme Configuration:**
- Background: Dark gradients
- Text: White with opacity variations
- Borders: `rgba(255,255,255,0.08-0.12)`
- Buttons: Glassmorphism style with backdrop-filter blur

---

## Data Flow

### Waiting Room Real-Time Updates

```
subscribeToAllWaitingRooms()
    ↓
Query both game_rooms & quiz_games collections (status='waiting')
    ↓
Filter rooms with playerCount > 0 (auto-cleanup empty)
    ↓
Convert to WaitingRoomGame interface
    ↓
Merge gameRooms + quizRooms
    ↓
Callback with combined array
```

### Room Card Click Flow

```
User clicks "Tham gia" button on room card
    ↓
onJoinGame(gameType, roomCode) callback
    ↓
Parent component uses gameType + roomCode to join room
    ↓
findRoomByCode(roomCode) retrieves room details
    ↓
User joins via subscribeToGameRoom()
```

---

## Key Integration Points

1. **Game Selector → Waiting Room:** Pass `onJoinGame`, `onBack`, optional `filterGameType`
2. **Waiting Room → Game Service:** Subscribe via `subscribeToAllWaitingRooms()`, delete via `deleteWaitingRoom()`
3. **Game Visibility:** Both components call `getHiddenGames()` on mount
4. **Room Setup:** Separate flow from waiting room, used when creating new room

---

## Unresolved Questions

- [ ] How are room codes generated (6-digit format)?
- [ ] What is the default maxPlayers if not set in Firestore?
- [ ] Is there rate limiting on room creation/deletion?
- [ ] What cleanup policy exists for stale rooms beyond the 0-player auto-cleanup?
