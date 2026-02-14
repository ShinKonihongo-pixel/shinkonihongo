# Quiz Game Spectator Implementation — File Scout Report

## Overview
Complete file inventory for implementing spectator gameplay logic in quiz game. All files are organized by category with descriptions of their primary responsibilities.

---

## 1. CORE GAME STATE MANAGEMENT

### `/src/hooks/use-quiz-game.ts`
**Purpose:** Main hook for managing entire quiz game state and actions
- Game lifecycle: create, join, leave, start
- Real-time subscriptions to game and room updates
- Player actions: submit answers, reveal answers, power-ups
- State: game object, results, available rooms, loading/error states
- Returns: isHost flag, currentPlayer, currentQuestion, sortedPlayers computed values
- **Key for spectator:** Already supports roles via playerRole parameter

---

## 2. GAMEPLAY COMPONENT ARCHITECTURE

### `/src/components/quiz-game/play/index.tsx`
**Purpose:** Main GamePlay component orchestrating all game states
- Routes to different screens based on game.status
- Manages timers via useGameTimers hook
- Manages sound effects
- Handles previous scores for reveal animation
- **Screens rendered:**
  - GameStarting (status: 'starting')
  - GameQuestion (status: 'question')
  - GameAnswerReveal (status: 'answer_reveal')
  - GamePowerUp (status: 'power_up')
  - GameLeaderboard (status: 'leaderboard')

### `/src/components/quiz-game/play/game-question.tsx`
**Purpose:** Question display screen with answers and timers
- Shows current question text (size-configurable)
- Displays 4 answer options with color-coded styling
- Shows round counter, timer circle, current score
- Shows streak badge when >= 2
- Displays answered count and power-up indicators (isBlocked, hasTimeFreeze)
- **Spectator consideration:** Displays all players' real-time answers

### `/src/components/quiz-game/play/game-answer-reveal.tsx`
**Purpose:** Shows correct answer and score changes for all players
- Displays correct answer with visual indicator
- Shows percentage of players who answered correctly
- Lists all players sorted by score change
- Shows individual correctness status (✓, ✗, —)
- Displays score gains and streak bonuses
- **Spectator feature:** Spectators can see all answers revealed

### `/src/components/quiz-game/play/game-starting.tsx`
**Purpose:** 3-second countdown screen before first question
- Cinematic battle intro with animated rings and particles
- Battle icons (Swords, Shield, Zap)
- Animated countdown number display
- **Spectator:** Same for all players including spectators

### `/src/components/quiz-game/play/game-power-up.tsx`
**Purpose:** Special round power-up selection screen
- Shows 5 power-up types: steal_points, block_player, double_points, shield, time_freeze
- State: selectedPowerUp, selectedTarget, powerUpConfirmed
- Eligibility check: only eligible if answered correctly
- Target selection for offensive/theft power-ups
- **Spectator:** Can only view, cannot select power-ups (requires eligibility)

### `/src/components/quiz-game/play/game-leaderboard.tsx`
**Purpose:** Mid-game leaderboard after each round
- Displays podium (1st, 2nd, 3rd) with icons (Crown, Medal, Award)
- Lists remaining players (#4+) below podium
- Shows streak badges for top 3
- Displays round progress
- Auto-advances after 5 seconds
- **Spectator:** Full visibility, cannot interact

---

## 3. TIMER & TIMING HOOK

### `/src/components/quiz-game/play/use-game-timers.ts`
**Purpose:** Custom hook managing all game phase timers
- **Countdown timer** (3s): Starting phase
- **Question timer** (dynamic): Subtracts from timeLimit, auto-reveals when 0
- **Reveal timer** (5s): Answer reveal screen, auto-advances to next round
- **Power-up timer** (10s): Special round screen
- Manages background music start/stop
- Plays sound effects (start, countdown, correct, wrong)
- **Spectator:** Same timers visible for all (no special handling needed)

---

## 4. GAME FLOW SERVICES

### `/src/services/quiz-game/game-flow.ts`
**Purpose:** Core game progression logic and answer handling
- **startGame():** Initiates 3-second countdown, moves to first question
- **submitAnswer():** Records player answer, prevents blocked players from answering
- **revealAnswer():** Calculates scores for all players based on correctness
  - Time bonus: Faster answers get up to 50% bonus points
  - Streak bonus: Consecutive correct answers add multiplier
  - Double points power-up: Multiplies earned points by 2
- **nextRound():** Clears answered state, loads next question or ends game
- **continueFromSpecial():** Moves from power-up selection to next question
- **continueFromLeaderboard():** Moves from leaderboard to next question
- **Spectator impact:** Spectators don't submit answers but see all calculations

### `/src/services/quiz-game/player-service.ts`
**Purpose:** Player join/leave/kick operations
- **joinGame():** Adds new player or allows rejoin
- **leaveGame():** Removes player, transfers host if needed, deletes game if empty
- **kickPlayer():** Host can remove other players
- Creates initial GamePlayer object with all properties
- **Spectator feature:** Join with isSpectator flag in player role

### `/src/services/quiz-game/power-ups.ts`
**Purpose:** Power-up mechanics implementation
- **usePowerUp():** Applies power-up effects
  - steal_points: Takes 50 points from target (shield blocks)
  - block_player: Blocks target from answering next round (shield blocks)
  - double_points: Doubles points for using player
  - shield: Protects from theft/block
  - time_freeze: Adds 5s to time remaining
- Shield mechanic: Blocks offensive power-ups but is consumed
- **Spectator:** Cannot use power-ups but sees effects applied

### `/src/services/quiz-game/game-results.ts`
**Purpose:** Final results and game completion
- **endGame():** Marks game as finished, calculates statistics
- **getGameResults():** Fetches final leaderboard and stats
- Queries Firestore for game results

---

## 5. SUPPORTING SERVICES

### `/src/services/quiz-game/game-crud.ts`
**Purpose:** Firestore CRUD operations
- **createGame():** Creates new game document with initial state
- **getGame():** Fetches current game state
- **updateGame():** Updates game document (state, players, round, etc.)
- **deleteGame():** Removes game from Firestore
- **subscribeToGame():** Real-time listener for game updates
- Games stored with id, code, status, players, questions, currentRound, settings

### `/src/services/quiz-game/room-service.ts`
**Purpose:** Available rooms listing
- **getAvailableRooms():** Queries games with status='waiting'
- **subscribeToAvailableRooms():** Real-time listener for lobby rooms
- **Spectator:** Can browse and join waiting rooms

### `/src/services/quiz-game/question-generator.ts`
**Purpose:** Question generation from data sources
- **generateQuestionsFromFlashcards():** Creates questions from flashcard deck
- **generateQuestionsFromJLPT():** Creates questions from JLPT question pool
- Shuffles options, ensures correct answer varies position
- **Spectator:** Sees generated questions same as players

### `/src/services/quiz-game/constants.ts`
**Purpose:** Game configuration constants
- Collection names, settings, game phases

---

## 6. UI COMPONENT ECOSYSTEM

### `/src/components/quiz-game/game-create.tsx`
**Purpose:** Game creation UI
- Set game title, difficulty, question source
- Player limits, timing settings
- **Spectator:** Spectators cannot create games (host role)

### `/src/components/quiz-game/game-lobby.tsx`
**Purpose:** Waiting room before game starts
- Displays joined players list
- Host-only start button
- Display spectators list (if spectator mode enabled)
- **Spectator:** Shown here with isSpectator flag visible

### `/src/components/quiz-game/game-results.tsx`
**Purpose:** Final results screen
- Podium display (1st, 2nd, 3rd)
- Full player rankings with scores and streaks
- Highlights current player's rank/score
- Play again / Go home buttons
- **Spectator:** Can see all results, play again would return to lobby

### `/src/components/quiz-game/game-avatar-picker.tsx`
**Purpose:** Avatar selection before joining game

### `/src/components/quiz-game/game-friend-invite.tsx`
**Purpose:** Send game invitations to friends

---

## 7. TYPES & CONSTANTS

### Key type definitions (from `/src/types/quiz-game`)
- **GamePlayer:** id, name, avatar, role, score, isHost, isSpectator (add), isBlocked, hasDoublePoints, hasShield, hasTimeFreeze, currentAnswer, answerTime, streak
- **QuizGame:** id, code, title, status (waiting|starting|question|answer_reveal|power_up|leaderboard|finished), players, questions, currentRound, totalRounds, hostId, hostName, settings
- **GameQuestion:** question, options, correctIndex, timeLimit, isSpecialRound
- **GameStatus:** Type union of all valid game phases
- **PowerUpType:** 'steal_points' | 'block_player' | 'double_points' | 'shield' | 'time_freeze'

### `/src/constants/answer-options.ts`
- Visual styling for 4 answer options (colors, icons, backgrounds)
- Used in GameQuestion, GameAnswerReveal for consistent display

---

## SPECTATOR INTEGRATION POINTS

### What Spectators Can Do:
1. Browse and join games with spectator role
2. View all gameplay screens (questions, answers, timers)
3. See all player scores and leaderboards
4. Watch power-up selections and effects
5. View final results

### What Spectators Cannot Do:
1. Submit answers (no currentAnswer state)
2. Use power-ups (no power-up selection)
3. Be hosts (hostId won't be spectator)
4. Be blocked or affected by offensive power-ups

### Files Needing Spectator Logic:
1. **game-question.tsx** — Disable answer submission for spectators
2. **game-power-up.tsx** — Hide power-up selection if not eligible
3. **player-service.ts** — Add isSpectator flag when creating GamePlayer
4. **game-flow.ts** — Skip answer submission/reveal calculation for spectators
5. **use-quiz-game.ts** — May need spectator-specific role handling

---

## FILE DEPENDENCY GRAPH

```
use-quiz-game.ts (main hook)
├── gameService calls → game-crud.ts
│                    → player-service.ts
│                    → game-flow.ts
│                    → power-ups.ts
│                    → game-results.ts
├── useQuizGame returns game object
└── Consumed by game-play.tsx

game-play.tsx (orchestrator)
├── Imports useGameTimers
├── Renders based on game.status
├── Uses GameQuestion, GameAnswerReveal, etc.
└── Calls onSubmitAnswer, onRevealAnswer, etc.

game-question.tsx
├── Receives currentPlayer, sortedPlayers
├── Calls onSubmitAnswer (disabled for spectators)
└── Shows timer from parent

game-answer-reveal.tsx
├── Receives sortedPlayers with scores
└── Renders result summary

game-power-up.tsx
├── Receives currentQuestion for eligibility
├── Calls onUsePowerUp (disabled for spectators)
└── Shows timer

game-leaderboard.tsx
├── Receives sortedPlayers
└── Shows timer countdown

use-game-timers.ts
├── Manages all timers
├── Calls parent callbacks (onRevealAnswer, onNextRound, etc.)
└── Uses useGameSounds
```

---

## SUMMARY

**Total gameplay files:** 13 core components/services
**Key entry point:** `use-quiz-game.ts` hook + `game-play.tsx` component
**Spectator changes needed:** ~5 files with conditional logic
**State management:** Firestore real-time with React hooks
**Styling:** Pre-existing CSS with animations (premium Kahoot-like experience)

