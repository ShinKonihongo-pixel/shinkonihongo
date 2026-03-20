# Quiz Battle (Đấu Trí) — Implementation Plan

## Overview
1v1 competitive quiz game with ELO-like rating system. Players create/join rooms by JLPT level, answer 20 random questions, faster+correct answers = more points. Winner gains rating, loser loses rating based on rating differential.

## Requirements Summary
- 1000 starting rating points per player
- Room-based matchmaking (2 players only)
- JLPT levels N5/N4/N3/N2/N1 — 20 random questions per match
- Speed-based scoring (faster correct = more points)
- ELO-like rating adjustment post-match
- Per-level leaderboards
- Win rate & match count tracking
- Level restriction: user's settings level = only level they can create/join

---

## Phase 1: Types & Data Model

### 1.1 Firestore Collections

**`quiz_battle_ratings/{userId}`**
```typescript
{
  odinhId: string;
  displayName: string;
  avatar: string;
  ratings: Record<JLPTLevel, number>;    // { N5: 1000, N4: 1000, ... }
  stats: Record<JLPTLevel, {
    totalMatches: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;                      // 0-100
    currentStreak: number;               // +N win streak, -N loss streak
    bestStreak: number;
  }>;
  createdAt: string;
  updatedAt: string;
}
```

**`game_rooms` collection** (reuse existing, gameType: `'quiz-battle'`)
```typescript
{
  gameType: 'quiz-battle',
  code: string;                          // 6-digit join code
  hostId: string;
  title: string;
  status: 'waiting' | 'starting' | 'playing' | 'answer_reveal' | 'finished';
  jlptLevel: JLPTLevel;                 // Single level per room
  players: Record<string, QuizBattlePlayer>;
  questions: QuizBattleQuestion[];       // 20 pre-generated questions
  currentRound: number;                  // 0-19
  roundStartTime: number | null;         // Timestamp for speed calc
  settings: QuizBattleSettings;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}
```

### 1.2 TypeScript Types

**File: `src/components/pages/quiz-battle/quiz-battle-types.ts`**

```typescript
export interface QuizBattlePlayer extends BasePlayer {
  odinhId: string;
  displayName: string;
  avatar: string;
  role?: string;
  score: number;                         // In-match score
  correctCount: number;
  currentAnswer: number | null;          // Selected option index
  answerTime: number | null;             // ms from question shown
  isReady: boolean;
  rating: number;                        // Pre-match rating for this level
}

export interface QuizBattleQuestion {
  id: string;
  sourceId: string;                      // JLPTQuestion.id
  question: string;
  options: string[];                     // 4 shuffled options
  correctIndex: number;
  timeLimit: number;                     // 15 seconds default
}

export interface QuizBattleSettings {
  maxPlayers: 2;
  minPlayers: 2;
  jlptLevel: JLPTLevel;
  totalRounds: 20;
  timePerQuestion: 15;                   // seconds
}

export interface QuizBattleResults {
  gameId: string;
  jlptLevel: JLPTLevel;
  winner: { odinhId: string; displayName: string; score: number; ratingChange: number; newRating: number } | null;
  loser: { odinhId: string; displayName: string; score: number; ratingChange: number; newRating: number } | null;
  isDraw: boolean;
}

export type QuizBattleStatus = 'waiting' | 'starting' | 'playing' | 'answer_reveal' | 'finished';
```

---

## Phase 2: ELO Rating System

**File: `src/utils/elo-rating.ts`** (~40 lines)

### Algorithm
- K-factor: 32 (standard for casual competitive)
- Expected score: `E = 1 / (1 + 10^((opponentRating - myRating) / 400))`
- New rating: `R' = R + K * (S - E)` where S = 1 (win), 0.5 (draw), 0 (loss)
- Floor: rating cannot go below 100

### Behavior
| Scenario | Rating Change (approx) |
|----------|----------------------|
| 1000 beats 1000 | +16 / -16 |
| 1000 beats 1200 | +24 / -24 |
| 1200 beats 1000 | +8 / -8 |
| Draw 1000 vs 1000 | 0 / 0 |

---

## Phase 3: Score Calculation (In-Match)

**File: `src/utils/quiz-battle-scoring.ts`** (~30 lines)

### Per-Question Scoring
- Correct answer: **100 base points**
- Time bonus: `max(0, floor((timeLimit - answerTime) / timeLimit * 50))` → 0-50 bonus
- Wrong/no answer: **0 points**
- Max per question: **150 points**
- Max per match (20 questions): **3000 points**

### Speed Advantage
- 1 second answer on 15s limit → 100 + 46 = 146 pts
- 7 second answer → 100 + 26 = 126 pts
- 14 second answer → 100 + 3 = 103 pts
- No answer → 0 pts

---

## Phase 4: Game Flow & Hooks

### 4.1 Hook Architecture

**`src/hooks/quiz-battle/index.ts`** — Main orchestrator
- Composes: useGameState, useGameCreation, useGameActions, useMatchFlow, useRatingSync

**`src/hooks/quiz-battle/use-game-state.ts`**
- Wraps shared `useGameRoomState<QuizBattleGame, QuizBattleResults>`

**`src/hooks/quiz-battle/use-game-creation.ts`**
- Creates room with jlptLevel from user settings
- Pre-generates 20 shuffled questions from `jlptQuestions` filtered by level
- Stores questions in Firestore room (both players see same questions)

**`src/hooks/quiz-battle/use-game-actions.ts`**
- Wraps shared `useGameRoomActions`
- Join validates: user's jlptLevel must match room's jlptLevel
- Start triggers countdown → 'playing'

**`src/hooks/quiz-battle/use-match-flow.ts`** — Core game loop
- Host drives the flow (question timer, round transitions)
- State machine: `playing` → show question → wait answers/timeout → `answer_reveal` → next round or `finished`
- Each round: start timer → both answer → reveal → 3s pause → next
- On finish: calculate ELO changes, write results

**`src/hooks/quiz-battle/use-rating-sync.ts`**
- Reads/writes `quiz_battle_ratings/{userId}`
- Initializes new players with 1000 rating per level
- Updates ratings + stats after match ends

### 4.2 Game Flow Sequence

```
1. Host creates room (jlptLevel locked to settings)
2. Opponent joins (jlptLevel validated)
3. Host starts → 3s countdown
4. For each of 20 rounds:
   a. Show question + start timer (15s)
   b. Both players select answer (synced to Firestore)
   c. Timer expires OR both answered → reveal correct answer
   d. Show points earned + running total
   e. 3s pause → next round
5. After round 20:
   a. Calculate winner (higher total score)
   b. Calculate ELO changes
   c. Update ratings in Firestore
   d. Show results screen
```

---

## Phase 5: UI Components

### 5.1 Page Orchestrator
**File: `src/components/pages/quiz-battle-page.tsx`** (~150 lines)
- Views: lobby | playing | results
- Props: currentUser, jlptQuestions, onClose, onSaveGameSession, initialRoomConfig?, initialJoinCode?
- Follows kanji-drop-page.tsx dual-mode pattern

### 5.2 Lobby
**File: `src/components/quiz-battle/quiz-battle-lobby.tsx`** (~120 lines)
- Reuse `PremiumLobbyShell` with battle theme (red/orange accent)
- Show both player slots (host + challenger)
- Display each player's rating for this level
- Show "waiting for opponent..." if only 1 player
- Start button when 2 players present

### 5.3 Playing Screen
**File: `src/components/quiz-battle/quiz-battle-playing.tsx`** (~150 lines)
- Top: Player 1 score | Round X/20 | Player 2 score
- Center: Question text + 4 answer options (grid)
- Timer bar (animated countdown)
- Answer selection → lock in immediately (no submit button, speed matters)
- Answer reveal: highlight correct (green), wrong (red), show both players' answers

### 5.4 Results Screen
**File: `src/components/quiz-battle/quiz-battle-results.tsx`** (~120 lines)
- Winner/Loser display with animation
- Score comparison
- Rating change: ▲+16 / ▼-16 with color
- Stats: correct answers, avg answer time
- Buttons: Play Again (create new room) | Back to Hub

### 5.5 Leaderboard
**File: `src/components/quiz-battle/quiz-battle-leaderboard.tsx`** (~100 lines)
- Per-level tabs (N5, N4, N3, N2, N1)
- Table: Rank | Avatar+Name | Rating | W/L | Win Rate
- Top 3 highlighted (gold/silver/bronze)
- Current user always visible (scroll to or pinned)
- Accessible from Game Hub

### 5.6 CSS
**File: `src/components/quiz-battle/quiz-battle.css`** (~200 lines)
- Dark glassmorphism theme (consistent with project)
- Battle-specific accent: `#ef4444` (red) / `#f59e0b` (orange)
- Timer animation, answer card transitions
- VS divider, score animations

---

## Phase 6: Game Hub Integration

### 6.1 Register Game Type
**File: `src/types/game-hub.ts`**
- Add `'quiz-battle'` to `GameType` union
- Add entry to `GAMES` object:
  ```
  icon: '⚔️', color: '#ef4444',
  gradient: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
  playerRange: '2', category: 'quiz',
  features: ['ELO Rating', '20 câu hỏi', 'Tốc độ = Điểm', 'Bảng xếp hạng']
  ```

### 6.2 Setup Config
**File: `src/components/game-hub/room-setup/game-configs-quiz-battle.tsx`**
- Minimal setup: title only (jlptLevel auto from settings, players fixed at 2, rounds fixed at 20)
- Show rules in setup modal
- Show user's current rating for their level

### 6.3 Lazy-load Page
**File: `src/components/pages/game-hub-page.tsx`**
- Add lazy import for QuizBattlePage
- Pass jlptQuestions prop
- Route to page when gameType === 'quiz-battle'

---

## Phase 7: Firestore Service

**File: `src/services/quiz-battle/quiz-battle-service.ts`** (~80 lines)

### Functions
- `getRating(userId)` → fetch or create default rating doc
- `updateRatingAfterMatch(winnerId, loserId, level, winnerRating, loserRating)` → atomic update
- `getLeaderboard(level, limit)` → query top N by rating for level
- `subscribeToLeaderboard(level, callback)` → real-time leaderboard

### Firestore Queries
- Leaderboard: `quiz_battle_ratings` ordered by `ratings.{level}` desc, limit 50

---

## File Structure Summary

```
src/
├── components/
│   ├── pages/
│   │   ├── quiz-battle-page.tsx              # Page orchestrator
│   │   └── quiz-battle/
│   │       └── quiz-battle-types.ts          # All type definitions
│   └── quiz-battle/
│       ├── quiz-battle-lobby.tsx             # Lobby (2 player slots)
│       ├── quiz-battle-playing.tsx           # Question + answers UI
│       ├── quiz-battle-results.tsx           # Win/lose + rating change
│       ├── quiz-battle-leaderboard.tsx       # Per-level rankings
│       └── quiz-battle.css                   # All styles
├── hooks/
│   └── quiz-battle/
│       ├── index.ts                          # Main orchestrator hook
│       ├── use-game-state.ts                 # Wraps shared useGameRoomState
│       ├── use-game-creation.ts              # Room creation + question gen
│       ├── use-game-actions.ts               # Join/leave/start
│       ├── use-match-flow.ts                 # Round timer + transitions
│       └── use-rating-sync.ts                # Rating CRUD
├── services/
│   └── quiz-battle/
│       └── quiz-battle-service.ts            # Firestore rating + leaderboard
├── utils/
│   ├── elo-rating.ts                         # ELO calculation
│   └── quiz-battle-scoring.ts                # Per-question scoring
└── game-hub/room-setup/
    └── game-configs-quiz-battle.tsx           # Setup config
```

**Total: ~16 files, ~1200 lines estimated**

---

## Implementation Order

| Step | Files | Dependency |
|------|-------|------------|
| 1 | `quiz-battle-types.ts`, `elo-rating.ts`, `quiz-battle-scoring.ts` | None |
| 2 | `quiz-battle-service.ts` | Types |
| 3 | `game-hub.ts` (register type), `game-configs-quiz-battle.tsx` | Types |
| 4 | `hooks/quiz-battle/*` (all 5 hooks + index) | Types, Service |
| 5 | `quiz-battle-lobby.tsx`, `quiz-battle-playing.tsx`, `quiz-battle-results.tsx` | Hooks |
| 6 | `quiz-battle-leaderboard.tsx` | Service |
| 7 | `quiz-battle.css` | All UI components |
| 8 | `quiz-battle-page.tsx` | All above |
| 9 | `game-hub-page.tsx` integration | Page |

---

## Unresolved Questions
1. Should draw (equal score after 20 rounds) have a tiebreaker (e.g., total answer time) or count as draw?
2. Should leaderboard be accessible from a separate nav menu or only from Game Hub?
3. Should there be a minimum number of matches before appearing on leaderboard?
