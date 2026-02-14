# Scout Report: Đại Chiến Tiếng Nhật Game Files

**Date**: 2026-02-14  
**Search Focus**: Japanese Battle Game ("Đại Chiến Tiếng Nhật") - Finding waiting room, countdown, game play, and special skills screens.

---

## Summary

Found comprehensive file structure for the "Đại Chiến Tiếng Nhật" (Japanese Battle/Quiz Game). This is a multiplayer competitive quiz game with power-ups, leaderboards, and special rounds. The game is integrated into a unified Game Hub system supporting multiple game types.

---

## 1. WAITING ROOM SCREEN

### Main File
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/waiting-room.tsx`**
  - Displays list of available game rooms for joining
  - Supports real-time Firestore subscription for room updates
  - Features search, filtering by game type, and stats display
  - Shows host info, player count, room creation time
  - Join functionality with disabled button when room is full

### Supporting Services
- **`/Users/admin/Documents/名称未設定フォルダ/src/services/game-rooms`**
  - Handles Firestore subscriptions to available rooms
  - Function: `subscribeToAllWaitingRooms()`

### Related Type Definitions
- **`/Users/admin/Documents/名称未設定フォルダ/src/types/game-hub.ts`** (lines 29-41)
  - `WaitingRoomGame` interface
  - Room code, game type, host info, player count, status

---

## 2. COUNTDOWN SCREEN

### Main File
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/quiz-game/play/game-starting.tsx`**
  - Simple fullscreen component showing 3-second countdown
  - Displays "Chuẩn bị!" (Get ready!) with countdown number
  - Leave game button available
  - Used in `GamePlay` component when `game.status === 'starting'`

### Timer Management
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/quiz-game/play/use-game-timers.ts`**
  - Custom hook: `useGameTimers()`
  - Manages countdown state (line 26): `const [countdown, setCountdown] = useState(3);`
  - Countdown logic (lines 33-50):
    - Runs during 'starting' status
    - Updates every 1000ms
    - Plays countdown sound at each tick
    - Auto-transitions to 'question' status after 3 seconds

### Game Flow Integration
- **`/Users/admin/Documents/名称未設定フォルダ/src/services/quiz-game/game-flow.ts`** (lines 7-29)
  - `startGame()` function sets status to 'starting'
  - After 3 second countdown, transitions to 'question' state with `currentRound: 0`

---

## 3. GAME PLAYING SCREEN (Question & Answer)

### Main Components

#### Play Container
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/quiz-game/play/index.tsx`**
  - Main orchestrator component
  - Handles all game states: starting → question → answer_reveal → power_up → leaderboard → finished
  - Props include game data, current player, sorted players, callbacks
  - Renders appropriate sub-component based on `game.status`

#### Question Display
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/quiz-game/play/game-question.tsx`**
  - Fullscreen question screen with question text and 4 answer options
  - Features:
    - Top bar: Round counter (e.g., "1/10"), special round badge, timer circle, player score
    - Question card with customizable font size
    - Answer grid (A, B, C, D buttons)
    - Handles blocked player state
    - Shows answered count (live feedback)
    - Timer with progress circle (red warning when ≤5 seconds)
    - Special effects: Shield indicator, time freeze badge

#### Answer Reveal
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/quiz-game/play/game-answer-reveal.tsx`**
  - Reveals correct answer with visual feedback
  - Shows player results (correct/incorrect)
  - Displays points earned with breakdown (base + time bonus + streak bonus + power-ups)
  - Auto-advances after 5 seconds

#### Leaderboard
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/quiz-game/play/game-leaderboard.tsx`**
  - Displays current player rankings
  - Shows score changes with animations
  - Shown every N questions (configurable: `showLeaderboardEvery`)
  - Auto-advances after 5 seconds

### Type Definitions
- **`/Users/admin/Documents/名称未設定フォルダ/src/types/quiz-game.ts`** (lines 44-54)
  - `GameQuestion` interface with: id, question, options, correctIndex, timeLimit, isSpecialRound
  - `GameStatus` enum: 'waiting', 'starting', 'question', 'answer_reveal', 'power_up', 'leaderboard', 'finished'
  - `QuizGame` interface: full game session data with players, questions, round tracking

---

## 4. SPECIAL SKILLS SELECTION SCREEN

### Main File
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/quiz-game/play/game-power-up.tsx`**
  - Fullscreen special round screen for players who answered correctly
  - Shows 5 power-up cards with name, emoji icon, and description
  - Target selection for power-ups that affect other players
  - Confirmation state before applying power-up
  - Auto-resets/skips after 10 seconds if no selection
  - Timer display (10s countdown)

### Power-Up Types
From `/Users/admin/Documents/名称未設定フォルダ/src/types/quiz-game.ts` (lines 3-25):
1. **steal_points** (💰) - Reduce 50 points from target player
2. **block_player** (🚫) - Block target player from answering next question
3. **double_points** (✨) - Double points for next question
4. **shield** (🛡️) - Protect from other players' power-ups
5. **time_freeze** (❄️) - Add 5 seconds to next question timer

### Power-Up Logic
- **`/Users/admin/Documents/名称未設定フォルダ/src/services/quiz-game/power-ups.ts`**
  - Handles power-up application and state management
  - Updates player attributes: `hasShield`, `hasDoublePoints`, `hasTimeFreeze`, `isBlocked`

---

## 5. SPECIAL QUESTIONS ORDERING LOGIC

### Question Generation & Ordering

#### Main Generator
- **`/Users/admin/Documents/名称未設定フォルダ/src/services/quiz-game/question-generator.ts`**

**Key Logic:**
```typescript
// Line 41: Shuffle flashcards
const shuffled = shuffleArray(flashcards);
const selectedCards = shuffled.slice(0, Math.min(totalRounds, shuffled.length));

// Lines 44-72: Map to questions
selectedCards.map((card, index) => {
  // ... question construction ...
  // Line 60: Mark every N-th question as special round
  const isSpecialRound = (index + 1) % specialRoundEvery === 0;
  return { ... isSpecialRound };
});
```

**Process:**
1. **Shuffle Phase**: All source questions/cards are shuffled randomly
2. **Selection Phase**: Pick first N cards (where N = totalRounds)
3. **Special Round Marking**: Every Nth question gets `isSpecialRound = true`
   - Default: every 5th question (configurable via `specialRoundEvery`)
4. **Option Shuffling**: For each question, wrong answers also shuffled before adding to options

#### Question Sources
From `/Users/admin/Documents/名称未設定フォルダ/src/services/quiz-game/question-generator.ts`:

**From Flashcards:**
- `generateQuestionsFromFlashcards()` - generates from selected lesson flashcards
- Question content options: kanji, vocabulary
- Answer content options: vocabulary_meaning, meaning

**From JLPT:**
- `generateQuestionsFromJLPT()` - generates from filtered JLPT question pool
- Filters by: level (N1-N5) and category
- Also shuffles question order

#### Game Creation
- **`/Users/admin/Documents/名称未設定フォルダ/src/services/quiz-game/game-crud.ts`** (lines 28-138)
  - `createGame()` function:
    - Creates game with title, settings, and generated questions
    - Generates unique 6-character game code
    - Initializes host as first player
    - Stores question count in `totalRounds`
    - Special round frequency stored in `settings.specialRoundEvery` (default: 5)

### Special Round Configuration
From `/Users/admin/Documents/名称未設定フォルダ/src/types/quiz-game.ts` (lines 88-96):
```typescript
export interface GameSettings {
  showLeaderboardEvery: number;    // Show leaderboard every N questions
  specialRoundEvery: number;       // Special round every N questions
  basePoints: number;              // Base points for correct answer
  streakBonus: number;             // Bonus per consecutive correct
  timeBonus: boolean;              // Enable time-based bonus
}
```

---

## 6. GAME FLOW STATES

State machine from `/Users/admin/Documents/名称未設定フォルダ/src/types/quiz-game.ts` line 57:

```
waiting 
  ↓ (startGame)
starting (3s countdown)
  ↓ (auto-transition)
question (player answers)
  ↓ (time runs out OR all answered)
answer_reveal (show correct answer - 5s)
  ↓ (auto-advance)
[IF special round] power_up (choose power-up - 10s) → question
[ELSE IF leaderboard time] leaderboard (show rankings - 5s) → question
[ELSE] → question (next round)
  ↓ (repeat until last round)
finished (show game results)
```

### Flow Management
- **`/Users/admin/Documents/名称未設定フォルダ/src/services/quiz-game/game-flow.ts`**
  - `startGame()` - initiates countdown
  - `submitAnswer()` - record player answer
  - `revealAnswer()` - calculate scores and move to reveal state
  - `nextRound()` - determine next state (power_up/leaderboard/question) and advance

---

## 7. GAME HUB INTEGRATION

### Game Hub Entry Point
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/game-selector.tsx`**
  - Main game selection screen showing all available games
  - Routes to waiting room or setup screens

### Game Configuration
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/room-setup/`** (directory)
  - Per-game setup modals for configuring game options
  - `game-room-setup.tsx` - main setup container
  - `game-configs.tsx` - configuration UI components
  - Settings include: rounds, time per question, player count, etc.

### Game Hub Types
- **`/Users/admin/Documents/名称未設定フォルダ/src/types/game-hub.ts`** (lines 1-220)
  - Defines all available games (quiz = "Đại Chiến Tiếng Nhật")
  - Game info: name, description, difficulty, features
  - Bot generation for filling empty slots
  - Visibility/filtering system

---

## 8. HOOKS & STATE MANAGEMENT

### Main Game Hook
- **`/Users/admin/Documents/名称未設定フォルダ/src/hooks/use-quiz-game.ts`**
  - `useQuizGame()` - manages game state and actions
  - Methods: createGame, joinGame, leaveGame, startGame, submitAnswer, revealAnswer, usePowerUp, etc.
  - Subscribes to Firestore real-time updates
  - Handles game results fetching

### Timer Hook
- **`/Users/admin/Documents/名称未設定フォルダ/src/components/quiz-game/play/use-game-timers.ts`**
  - `useGameTimers()` - manages all timing: countdown, question timer, reveal timer, power-up timer

### Sound Management
- **`/Users/admin/Documents/名称未設定フォルダ/src/hooks/use-game-sounds.ts`**
  - Audio effects: start, countdown, correct, wrong
  - Background music for gameplay
  - Settings-aware (can be disabled)

---

## 9. RELATED SERVICES & UTILITIES

### Service Modules
- **`/Users/admin/Documents/名称未設定フォルダ/src/services/quiz-game/`** (directory)
  - `game-crud.ts` - database operations
  - `game-flow.ts` - game state transitions
  - `game-results.ts` - end-game calculations and rankings
  - `player-service.ts` - player management and power-up application
  - `room-service.ts` - room/lobby management
  - `question-generator.ts` - question generation with shuffling
  - `power-ups.ts` - power-up effect logic
  - `utils.ts` - helpers (shuffle, ID generation, code generation)
  - `constants.ts` - collection names and constants
  - `index.ts` - exported API

### Firestore Collections
From `/Users/admin/Documents/名称未設定フォルダ/src/services/quiz-game/constants.ts`:
- `games` - active game sessions
- `gameResults` - historical game results and player rankings

---

## 10. RELEVANT TYPE FILES

### Core Types
- **`/Users/admin/Documents/名称未設定フォルダ/src/types/quiz-game.ts`** - Complete quiz game types
- **`/Users/admin/Documents/名称未設定フォルダ/src/types/game-hub.ts`** - Game hub and room types
- **`/Users/admin/Documents/名称未設定フォルダ/src/types/flashcard.ts`** - Question source data

---

## 11. CSS/STYLING

Main game CSS:
- **`/Users/admin/Documents/名称未設定フォルダ/src/App.css`** - Contains all game-related styles:
  - `.game-fullscreen` - fullscreen container
  - `.game-question-screen` - question layout
  - `.game-powerup-screen` - power-up selection
  - `.waiting-room-v2` - waiting room layout
  - `.wr-*` - waiting room component styles
  - `.powerup-*` - power-up component styles

---

## File Directory Structure

```
src/
├── components/
│   ├── game-hub/
│   │   ├── waiting-room.tsx ✓
│   │   ├── game-selector.tsx
│   │   ├── room-setup/
│   │   │   ├── game-room-setup.tsx
│   │   │   ├── game-configs*.tsx
│   │   │   └── ...
│   │   ├── music-player/
│   │   └── player-leaderboard.tsx
│   ├── quiz-game/
│   │   ├── play/
│   │   │   ├── index.tsx ✓ (main play)
│   │   │   ├── game-starting.tsx ✓ (countdown)
│   │   │   ├── game-question.tsx ✓ (questions/answers)
│   │   │   ├── game-answer-reveal.tsx (answer reveal)
│   │   │   ├── game-power-up.tsx ✓ (power-ups)
│   │   │   ├── game-leaderboard.tsx (rankings)
│   │   │   ├── use-game-timers.ts ✓ (timer logic)
│   │   │   └── game-results.tsx
│   │   ├── game-lobby.tsx
│   │   ├── game-create.tsx
│   │   ├── game-play.tsx
│   │   └── ...
│   └── shared/game-lobby/
├── services/
│   ├── quiz-game/
│   │   ├── game-crud.ts ✓ (create/join/manage)
│   │   ├── game-flow.ts ✓ (state transitions)
│   │   ├── question-generator.ts ✓ (question ordering)
│   │   ├── game-results.ts
│   │   ├── player-service.ts
│   │   ├── power-ups.ts
│   │   ├── room-service.ts
│   │   ├── utils.ts
│   │   ├── constants.ts
│   │   └── index.ts
│   ├── game-rooms/ (Firestore subscriptions)
│   └── game-visibility-storage.ts
├── hooks/
│   ├── use-quiz-game.ts ✓
│   ├── use-game-sounds.ts
│   └── quiz-game/ (other quiz hooks)
├── types/
│   ├── game-hub.ts ✓
│   ├── quiz-game.ts ✓
│   └── flashcard.ts
└── App.tsx (main entry with game routing)
```

---

## Key Integration Points

1. **Game Start Flow**: GameHubPage → WaitingRoom → GameRoomSetup → QuizGameManager → GamePlay
2. **Real-time Sync**: Firestore subscriptions in `use-quiz-game.ts` keep game state updated
3. **Multi-game Support**: Game Hub handles routing for: quiz, golden-bell, kanji-battle, bingo, racing, word-match, etc.
4. **Sound & Timers**: Managed via hooks; integrated into GamePlay component
5. **Power-up System**: Player-to-player interactions managed in game-flow.ts and applied during answer reveal

---

## Summary of Screens

| Screen | Component File | Key Features |
|--------|----------------|--------------|
| Waiting Room | `waiting-room.tsx` | List rooms, filter, search, join |
| Countdown | `game-starting.tsx` | 3s countdown, leave button |
| Question & Answers | `game-question.tsx` | Q text, A options, timer, score, round indicator |
| Answer Reveal | `game-answer-reveal.tsx` | Show correct answer, points breakdown |
| Leaderboard | `game-leaderboard.tsx` | Rankings, score changes |
| Power-up Selection | `game-power-up.tsx` | 5 power-up cards, target selection |
| Game Results | `game-results.tsx` | Final rankings, stats |

---

## Implementation Notes

- **Questions Ordered By**: Shuffle → Select → Mark special rounds every Nth
- **Special Rounds Every**: 5 questions (configurable)
- **Countdown Duration**: 3 seconds
- **Question Timer**: Configurable per game (default 30s)
- **Power-up Timer**: 10 seconds
- **Reveal/Leaderboard Timers**: 5 seconds
- **Real-time**: Firestore listeners update all connected players simultaneously
- **Mobile-Friendly**: Fullscreen game interface with responsive design
- **Sound Effects**: Optional (player can disable in settings)
- **Max Players**: 20 (configurable)

---

## Unresolved Questions

1. Where are game results persisted after game ends?
2. What's the exact ELO/rating calculation for player rankings?
3. Are there daily/weekly leaderboards tracked separately?
4. How are bot players integrated into live games?
5. Is there a replay/recording system for games?

