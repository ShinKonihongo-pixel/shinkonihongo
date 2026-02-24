# Word Match Game ("Nối Từ Thách Đấu") File Inventory

## Overview
Complete file structure for the Word Match (Nối Từ Thách Đấu) game. Players match word pairs (Japanese vocabulary with Vietnamese meanings) across multiple rounds with special effects and competitive scoring.

---

## Core Files

### 1. Main Page Component
**File**: `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/word-match-page.tsx`
- Main orchestrator for all Word Match game views
- Manages state transitions between: menu → setup → lobby → play → results → guide
- Props interface includes: onClose, currentUser, flashcards, initialView, onSaveGameSession, initialRoomConfig, initialJoinCode
- Uses `useWordMatch` hook for game logic
- Auto-creates room from initialRoomConfig
- Auto-joins game from join code
- Saves game sessions for XP tracking
- Imports all components from word-match folder

### 2. Type Definitions
**File**: `/Users/admin/Documents/名称未設定フォルダ/src/types/word-match.ts`
- Complete TypeScript interfaces for game state and logic
- Key types:
  - `WordMatchStatus`: waiting, starting, playing, result, wheel_spin, finished
  - `WordMatchEffectType`: challenge (⚔️), disconnect (🔌), shield (🛡️)
  - `WordPair`: id, left (Japanese), right (Vietnamese), difficulty
  - `WordMatchRound`: id, pairs, isSpecial, timeLimit
  - `WordMatchGame`: Full game state with players, rounds, current state
  - `WordMatchResults`: Rankings and final scores
  - `WordMatchPlayer`: Player stats (score, perfectRounds, streak, etc.)
- Helper functions: shuffleForDisplay(), checkMatches(), calculateRoundPoints()
- Default settings: 10 max players, 15 rounds, 30s per round

---

## Component Files

### 3. Menu Component
**File**: `/Users/admin/Documents/名称未設定フォルダ/src/components/word-match/word-match-menu.tsx`
- Main menu entry point
- Buttons: Create Game, Join Game, Show Guide, Close/Exit
- Props: onCreateGame(), onJoinGame(code), onShowGuide(), onClose()

### 4. Setup Component
**File**: `/Users/admin/Documents/名称未設定フォルダ/src/components/word-match/word-match-setup.tsx`
- Game creation form
- Configures: title, totalRounds, timePerRound, maxPlayers
- Props: onCreateGame(data), onBack()
- Returns `CreateWordMatchData`

### 5. Lobby Component
**File**: `/Users/admin/Documents/名称未設定フォルダ/src/components/word-match/word-match-lobby.tsx`
- Waiting room before game starts
- Shows: player list, game settings, ready status
- Props: game, currentPlayerId, onStartGame(), onAddBot(), onLeave(), onKickPlayer()
- Displays game code for joining

### 6. Play Component
**File**: `/Users/admin/Documents/名称未設定フォルダ/src/components/word-match/word-match-play.tsx`
- Main gameplay view
- Renders word matching interface with 5 pairs per round
- Shows: timer, current scores, player submissions
- Props: game, currentPlayerId, onSubmitMatches(), onApplyEffect(), onNextRound()
- Handles special wheel spin rounds

### 7. Results Component
**File**: `/Users/admin/Documents/名称未設定フォルダ/src/components/word-match/word-match-results.tsx`
- End-of-game results screen
- Displays: rankings, scores, accuracy, perfect rounds
- Props: results, currentPlayerId, onPlayAgain(), onExit()

### 8. Guide Component
**File**: `/Users/admin/Documents/名称未設定フォルダ/src/components/word-match/word-match-guide.tsx`
- Game rules and instructions
- Explains word matching mechanics
- Lists special effects (Challenge, Disconnect, Shield)
- Props: onClose()

### 9. Manager Component
**File**: `/Users/admin/Documents/名称未設定フォルダ/src/components/word-match/word-match-manager.tsx`
- Game state management
- Likely handles bot logic, effect application, round transitions
- Used internally by useWordMatch hook

### 10. Component Exports
**File**: `/Users/admin/Documents/名称未設定フォルダ/src/components/word-match/index.ts`
- Central export barrel for all components:
  - WordMatchMenu, WordMatchSetup, WordMatchLobby, WordMatchPlay
  - WordMatchResults, WordMatchGuide, WordMatchManager

---

## Styling

**File**: `/Users/admin/Documents/名称未設定フォルダ/src/components/word-match/word-match.css`
- Stylesheet imported in word-match-page.tsx (line 15)
- Dark glassmorphism theme consistent with other study pages

---

## Game Hub Integration

### Referenced in Game Hub Page
**File**: `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/game-hub-page.tsx`

**Key Integration Points**:
- Line 92: Lazy-loaded import: `const WordMatchPage = lazy(() => import('./word-match-page').then(m => ({ default: m.WordMatchPage })));`
- Lines 253-261: Setup modal configuration using `WORD_MATCH_SETUP_CONFIG`
- Lines 418-433: Conditional render when selectedGame === 'word-match'
  - Props passed: onClose, currentUser, flashcards, initialView, initialJoinCode, onSaveGameSession, initialRoomConfig
  - Avatar fallback: '🔗' (link emoji)

**Setup Configuration** (imported from game-configs):
- `WORD_MATCH_SETUP_CONFIG` used with `GameRoomSetup` component
- Handles room creation through `handleStandardRoomCreate` callback

---

## Hook

**Hook File**: `/Users/admin/Documents/名称未設定フォルダ/src/hooks/word-match.ts` (referenced, not yet provided)
- `useWordMatch` hook provides game logic
- Methods: createGame, joinGame, leaveGame, kickPlayer, startGame, addBot, submitMatches, applyEffect, continueGame, resetGame
- Returns: game state, gameResults, and all methods

---

## Summary

**Total Files**: 10 source files
- 1 Main page (word-match-page.tsx)
- 1 Type definitions (word-match.ts)
- 6 Components (menu, setup, lobby, play, results, guide)
- 1 Manager (word-match-manager.tsx)
- 1 Stylesheet (word-match.css)
- 1 Export barrel (index.ts)

**Integration**: Fully integrated in game-hub-page.tsx as lazy-loaded route with room setup modal support.

