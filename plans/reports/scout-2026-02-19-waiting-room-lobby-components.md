# Waiting Room & Lobby Components Scout Report
**Date:** 2026-02-19 | **Task:** Find UI components and CSS for Bingo and Japanese Battle (Game Hub) waiting rooms/lobbies

---

## Summary

Found all files related to waiting room/lobby UIs across two game systems:
- **Bingo Game**: Self-contained lobby component + shared reusable lobby components
- **Japanese Battle / Game Hub**: Multi-game waiting room with filtering and admin controls
- **Golden Bell**: Premium immersive lobby with team mode support
- **Shared Components**: Reusable lobby UI patterns extracted for consistency

Total: 31 core files across components, pages, types, and styles.

---

## Component Hierarchy

```
Waiting Room / Lobby System
├── Game Hub (Multi-game Waiting Room)
│   ├── WaitingRoom Component (Browse & Join)
│   ├── Game Room Setup (Create & Configure)
│   └── Game Hub CSS
├── Bingo Game
│   ├── BingoGameLobby (Single-game Lobby)
│   ├── BingoGameSetup (Room Configuration)
│   └── Bingo Game CSS
├── Golden Bell Game
│   ├── GoldenBellLobby (Immersive Lobby)
│   ├── GoldenBellTeamLobby (Team Mode)
│   └── Golden Bell CSS
└── Shared Lobby Components (Reusable across all games)
    ├── GameCodeDisplay
    ├── PlayerListGrid
    └── LobbyActionBar
```

---

## Core Files

### Game Hub (Japanese Battle - "Đại chiến Tiếng Nhật")

#### Main Components
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/waiting-room.tsx`**
  - Multi-game waiting room listing all available game rooms
  - Real-time Firestore subscription for room updates
  - Search & filter by game type, room name, host, code
  - Admin controls: delete single/all rooms (super_admin role)
  - Shows room capacity, host info, creation time
  - Statistics bar: room count, player count
  - Empty state with "Create Room" call-to-action

- **`/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/game-selector.tsx`**
  - Initial game selection UI for Game Hub
  - Displays all available games with descriptions, difficulty, features

- **`/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/game-room-setup.tsx`**
  - Legacy room setup component (may be deprecated; see room-setup/)

#### Room Setup (Game Configuration)
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/room-setup/game-room-setup.tsx`**
  - Main room creation orchestrator for all games
  - Routes to game-specific config components based on gameType

- **`/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/room-setup/game-configs.tsx`**
  - Dynamic config form builder for all game types

- **`/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/room-setup/game-configs-basic.tsx`**
  - Common fields: room title, max players, min players, difficulty

- **`/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/room-setup/game-configs-advanced.tsx`**
  - Advanced settings: bot count, bot intelligence, time limits

- **`/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/room-setup/game-configs-extra.tsx`**
  - Game-specific extra configs (categories, question counts, etc.)

- **`/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/room-setup/rules-section.tsx`**
  - Displays game rules and descriptions

- **`/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/room-setup/game-mode-section.tsx`**
  - Game mode selection (solo, team, competitive, etc.)

- **`/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/room-setup/room-header.tsx`**
  - Header with back button and game info

- **`/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/room-setup/room-footer.tsx`**
  - Create/Cancel buttons for room setup

- **`/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/room-setup/room-preview.tsx`**
  - Preview of configured room before creation

#### Form Components
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/room-setup/form-fields.tsx`**
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/room-setup/toggle-switch.tsx`**
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/room-setup/slider-input.tsx`**
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/room-setup/select-buttons.tsx`**
  - Reusable form input components for room configuration

#### Music Player (Game Hub Feature)
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/floating-music-player.tsx`**
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/music-player/`** (full subdirectory)
  - Background music player overlay for game hub

#### Utilities
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/player-leaderboard.tsx`**

#### Styling
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/game-hub.css`**
  - Unified game room setup styles (`.grs-*` classes)
  - Waiting room v2 styles (`.wr-*` classes)
  - Modal overlays, buttons, forms, animations

#### Type Definitions
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/room-setup/types.ts`**
  - GameRoomConfig interface for room creation data
- **`/Users/admin/Documents/名称未設定フォルダ/src/types/game-hub.ts`**
  - GameType union (quiz, golden-bell, picture-guess, bingo, kanji-battle, word-match, ai-challenge, image-word, word-scramble)
  - GameInfo interface (name, icon, color, gradient, features)
  - WaitingRoomGame interface (for room listings)
  - BotIntelligence enum, bot name generation utilities

---

### Bingo Game

#### Lobby Component
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/bingo-game/bingo-game-lobby.tsx`**
  - Waiting room before Bingo game starts
  - Shows game code, player count, settings
  - Uses shared GameCodeDisplay, PlayerListGrid, LobbyActionBar components
  - Host can kick players and start game when min players reached

#### Game Flow Components
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/bingo-game/bingo-game-setup.tsx`**
  - Room configuration for Bingo (title, max/min players, skills enabled)

- **`/Users/admin/Documents/名称未設定フォルダ/src/components/bingo-game/bingo-game-menu.tsx`**
  - Initial menu screen (create game, browse rooms, guide)

- **`/Users/admin/Documents/名称未設定フォルダ/src/components/bingo-game/bingo-game-play.tsx`**
  - Active gameplay with bingo card, number drawing, skill phase

- **`/Users/admin/Documents/名称未設定フォルダ/src/components/bingo-game/bingo-game-results.tsx`**
  - Game results/leaderboard screen

- **`/Users/admin/Documents/名称未設定フォルダ/src/components/bingo-game/bingo-game-guide.tsx`**
  - Rules and how-to-play guide

- **`/Users/admin/Documents/名称未設定フォルダ/src/components/bingo-game/bingo-game-manager.tsx`**
  - Game orchestration/state management component

#### Styling
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/bingo-game/bingo-game.css`**
  - Bingo-specific styles (`.bingo-*` classes)
  - Lobby, card, skill UI styles

#### Type Definitions
- **`/Users/admin/Documents/名称未設定フォルダ/src/types/bingo-game.ts`**
  - BingoGame interface (game state, settings, players, results)
  - BingoPlayer interface (rows, marked count, skills, blocking, luck bonus)
  - BingoSkillType enum (remove_mark, auto_add, increase_luck, block_turn, fifty_fifty)
  - BingoSkill interface with emoji, descriptions, target info

#### Page Entry Point
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/pages/bingo-page.tsx`**
  - Main page component orchestrating: Menu → Setup → Lobby → Play → Results
  - Uses `useBingoGame` hook for state management
  - Handles initial join code, countdown, view transitions

---

### Golden Bell Game

#### Lobby Components
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/golden-bell/golden-bell-lobby.tsx`**
  - Premium full-screen immersive lobby design
  - 2-column layout on PC (host+QR | players), stacked on mobile
  - QR code generation for room joining
  - Host VIP badge styling
  - Player grid with capacity visualization
  - Animated background with orbs and grid pattern
  - Rules section
  - Routes to GoldenBellTeamLobby when in team mode

- **`/Users/admin/Documents/名称未設定フォルダ/src/components/golden-bell/golden-bell-team-lobby.tsx`**
  - Team mode specific lobby with team selection UI
  - Shuffle teams button for host
  - Join team functionality

#### Game Flow Components
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/golden-bell/golden-bell-setup.tsx`**
  - Room configuration (JLPT level, question count, categories, time limits)

- **`/Users/admin/Documents/名称未設定フォルダ/src/components/golden-bell/golden-bell-menu.tsx`**
  - Initial menu screen

- **`/Users/admin/Documents/名称未設定フォルダ/src/components/golden-bell/golden-bell-play.tsx`**
  - Active gameplay screen

- **`/Users/admin/Documents/名称未設定フォルダ/src/components/golden-bell/golden-bell-results.tsx`**
  - Results/leaderboard screen

- **`/Users/admin/Documents/名称未設定フォルダ/src/components/golden-bell/skill-spin-wheel.tsx`**
  - Skill selection wheel UI

#### Styling
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/golden-bell/golden-bell.css`**
  - Golden Bell styles (`.gb-*` classes)
  - Lobby background animation, orbs, grid pattern
  - Header, body (2-column), footer layouts
  - VIP styling integration
  - Live tag animations

#### Type Definitions
- **`/Users/admin/Documents/名称未設定フォルダ/src/types/golden-bell.ts`**
  - GoldenBellGame interface (game state, teams, category info)
  - GoldenBellPlayer interface with team assignment
  - Category enum and CATEGORY_INFO with emoji, Japanese names

#### Page Entry Point
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/pages/golden-bell-page.tsx`**
  - Main page component orchestrating game flow

---

### Shared Lobby Components

#### Player List Grid
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/shared/game-lobby/player-list-grid.tsx`**
  - Reusable grid component for displaying players in lobbies
  - Features:
    - VIP role styling (getVipAvatarClasses, getVipNameClasses, getVipBadge)
    - Host badge, current player highlight
    - Bot indicator
    - Kick button for host
    - Empty slots with placeholder labels
    - Image avatar support
    - maxEmptySlots customization (shows waiting slots)
    - Optional extra render function for custom content

#### Game Code Display
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/shared/game-lobby/game-code-display.tsx`**
  - Reusable component for showing game code
  - Copy to clipboard with feedback
  - Optional share button
  - Customizable label and CSS class

#### Lobby Action Bar
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/shared/game-lobby/lobby-action-bar.tsx`**
  - Reusable footer with Start/Leave buttons
  - Host vs. non-host UI different
  - Loading states
  - Customizable labels and icons
  - Disabled state with alt message

#### Types
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/shared/game-lobby/types.ts`**
  - BaseLobbyPlayer interface (normalized player data)
  - normalizePlayer function to standardize player data across game types

#### Barrel Export
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/shared/game-lobby/index.ts`**
  - Exports: GameCodeDisplay, PlayerListGrid, LobbyActionBar, normalizePlayer, BaseLobbyPlayer type

---

## Page Entry Points

- **`/Users/admin/Documents/名称未設定フォルダ/src/components/pages/game-hub-page.tsx`**
  - Game Hub orchestrator (game selection → room setup → specific game pages)
  - Lazy loads: QuizGamePage, GoldenBellPage, PictureGuessPage, BingoPage, etc.
  - Modal error boundary for game-specific errors

- **`/Users/admin/Documents/名称未設定フォルダ/src/components/pages/bingo-page.tsx`**
  - Bingo game entry point (menu → setup → lobby → play → results)

- **`/Users/admin/Documents/名称未設定フォルダ/src/components/pages/golden-bell-page.tsx`**
  - Golden Bell game entry point

---

## CSS Organization

### Game Hub Styles (`game-hub.css`)
- `.grs-*` - Unified Game Room Setup classes
- `.wr-*` - Waiting Room v2 classes (cards, grid, filters, search)
- `.rm-*` - Room modal classes
- Animations: spinning icons, fade transitions
- Responsive: mobile-first with breakpoints

### Bingo Styles (`bingo-game.css`)
- `.bingo-*` - Bingo lobby and card styles
- `.speed-quiz-*` - Button and common UI patterns
- Lobby layout, player grid, code display
- Card rendering (rows, cells, marks)
- Skill phase UI

### Golden Bell Styles (`golden-bell.css`)
- `.gb-*` - Golden Bell specific classes
- Animated background (orbs, grid pattern)
- Header/body/footer responsive layout
- 2-column on PC, stacked on mobile
- VIP styling hooks
- Live indicator animation
- QR code styling

---

## Key Features Across Lobbies

### Waiting Room / Room Browsing
- Real-time Firestore subscriptions
- Multi-game support (all game types in one list)
- Search by: room title, host name, game code, game name
- Filter by: game type, all games
- Sort by: newest first
- Admin controls: delete single room, delete all rooms
- Statistics: room count, player count
- Room capacity visualization (progress bar)
- Room age indicator (time ago)
- Game type badge with icon and color
- "Full" state disables join button

### Game Lobby (Waiting Before Play)
- Game code display with copy to clipboard
- Player list grid with VIP styling
- Host identification
- Kick player functionality (host only)
- Empty slot placeholders
- Player count vs. max players
- Ready state messaging
- Rules display
- Start button (host only, when min players reached)
- Leave button (all players)
- Loading states
- Confirm modals for leaving/kicking

### Shared UI Patterns
- Game code copying (fallback for non-HTTPS contexts)
- QR code generation for join links
- VIP role badge system
- Bot player indicators
- Current player highlighting
- Loading spinner animations
- Confirm dialogs for destructive actions

---

## Type System

### Game Hub Types (`game-hub.ts`)
```typescript
type GameType = 'quiz' | 'golden-bell' | 'picture-guess' | 'bingo' | 
                'kanji-battle' | 'word-match' | 'ai-challenge' | 'image-word' | 
                'word-scramble'

interface WaitingRoomGame {
  id, code, gameType, title, hostName, hostAvatar, playerCount, 
  maxPlayers, createdAt, status
}

type BotIntelligence = 'weak' | 'average' | 'smart' | 'genius'
```

### Bingo Types (`bingo-game.ts`)
```typescript
interface BingoGame {
  code, title, settings, players, drawnNumbers, ...
}

interface BingoPlayer {
  odinhId, displayName, avatar, rows, markedCount, completedRows, 
  canBingo, hasBingoed, isBlocked, luckBonus, hasSkillAvailable, ...
}

type BingoSkillType = 'remove_mark' | 'auto_add' | 'increase_luck' | 
                      'block_turn' | 'fifty_fifty'
```

### Golden Bell Types (`golden-bell.ts`)
```typescript
interface GoldenBellGame {
  code, title, settings, players, teams, ...
}

interface GoldenBellPlayer {
  odinhId, displayName, avatar, teamId, isEliminated, ...
}

enum Category {
  VOCABULARY, GRAMMAR, KANJI, LISTENING, READING, CULTURE, ...
}

const CATEGORY_INFO: Record<Category, { emoji, name, color, ... }>
```

---

## Dependencies & Utilities

### External Libraries
- `lucide-react` - Icons (Users, Clock, Copy, Check, Share2, QRCode, Bell, etc.)
- `qrcode.react` - QR code generation (GoldenBellLobby)

### Internal Utilities Used
- `isImageAvatar()` - Check if avatar is image URL vs. emoji
- `getVipNameClasses()`, `getVipAvatarClasses()`, `getVipBadge()`, `isVipRole()` - VIP styling
- `normalizePlayer()` - Standardize player data across games

### Services
- `subscribeToAllWaitingRooms()` - Firestore real-time rooms
- `deleteWaitingRoom()` - Admin delete room
- `deleteAllWaitingRooms()` - Admin delete all
- `getHiddenGames()` / `getVisibleGames()` - Game visibility storage

---

## Modified Files (In git status)

- `src/App.tsx`
- `src/components/game-hub/game-hub.css`
- `src/components/game-hub/room-setup/game-configs-advanced.tsx`
- `src/components/game-hub/room-setup/game-room-setup.tsx`
- `src/components/game-hub/room-setup/room-footer.tsx`
- `src/components/game-hub/room-setup/rules-section.tsx`
- `src/components/game-hub/room-setup/types.ts`
- `src/components/game-hub/waiting-room.tsx`
- `src/components/golden-bell/golden-bell-lobby.tsx`
- `src/components/golden-bell/golden-bell-setup.tsx`
- `src/components/golden-bell/golden-bell.css`
- `src/components/pages/game-hub-page.tsx`
- `src/components/pages/golden-bell-page.tsx`
- `src/hooks/golden-bell/index.ts`
- `src/hooks/golden-bell/use-game-actions.ts`
- `src/hooks/golden-bell/use-game-creation.ts`
- `src/hooks/golden-bell/use-game-state.ts`
- `src/hooks/shared/use-bot-auto-join.ts`
- `src/types/game-hub.ts`
- `src/types/golden-bell.ts`

---

## Unresolved Questions

None - complete inventory of waiting room/lobby components and CSS established.
