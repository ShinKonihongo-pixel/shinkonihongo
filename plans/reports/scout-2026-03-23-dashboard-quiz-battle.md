# Scout Report: Dashboard & Quiz Battle Architecture

**Date:** 2026-03-23  
**Scope:** Home page (center dashboard), quiz battle system, ELO scoring, leaderboard components

---

## Files Found

### 1. Center Dashboard Page
**`/Users/admin/Documents/名称未設定フォルダ/src/components/pages/center-dashboard-page.tsx`** (560 lines)
- Ultra-premium management dashboard for center administrators
- Four tabs: Overview, Classes, Students, Settings
- Features: Activity rings (SVG), stats grids, class/member filtering with search
- Shows class count, active classes, student count, teacher count
- Quick actions: Jump to classroom, study, member management
- Supports invite management (CenterInviteManager) and branding editor (CenterBrandingEditor)
- Styling via `/src/components/pages/center-dashboard-page.css`

**Props:**
- `currentUser: { id, role }`
- `users: User[]`
- `onNavigate?: (page: Page) => void`

---

### 2. Quiz Battle Core Types
**`/Users/admin/Documents/名称未設定フォルダ/src/components/pages/quiz-battle/quiz-battle-types.ts`** (120 lines)

**Key Types:**
- `QuizBattleStatus`: `'waiting' | 'starting' | 'playing' | 'answer_reveal' | 'finished'`
- `QuizBattlePlayer`: extends BasePlayer
  - `score: number` (cumulative in-match)
  - `correctCount: number`
  - `rating: number` (pre-match ELO rating for level)
  - `answerTime: number | null` (ms)
- `QuizBattleGame`: room data with players record, questions array, currentRound (0-19)
- `QuizBattleQuestion`: id, sourceId, question, options[], correctIndex, timeLimit
- `QuizBattleResults`: game outcome with winner/loser participant results + isDraw
- `QuizBattleRating`: player ratings per level with stats (wins, losses, winRate, streaks)

**Settings:** maxPlayers=2, minPlayers=2, totalRounds=20, timePerQuestion=15s

---

### 3. ELO Rating Calculation
**`/Users/admin/Documents/名称未設定フォルダ/src/utils/elo-rating.ts`** (67 lines)

**Constants:**
- BASE_K = 40, MAX_K = 80
- RATING_FLOOR = 100 (minimum rating)

**Functions:**
- `getKFactor(ratingGap: number)`: Dynamic K scales with gap (0-400+)
- `calculateExpectedScore(myRating, opponentRating)`: Returns 0-1 probability
- `calculateNewRating(myRating, opponentRating, result)`: Returns new rating (floored at 100)
- `calculateRatingChanges(winnerRating, loserRating, isDraw)`: Returns both players' rating deltas + new ratings

**Formula:** S = 1 (win) | 0.5 (draw) | 0 (loss); E = 1/(1+10^((opp-my)/400))

---

### 4. Question Scoring
**`/Users/admin/Documents/名称未設定フォルダ/src/utils/quiz-battle-scoring.ts`** (31 lines)

**Constants:**
- BASE_POINTS = 100
- MAX_TIME_BONUS = 50

**Scoring:**
- Correct + quick = 100-150 points per question
- Wrong or timeout = 0 points
- Max per match (20 questions) = 3000 points
- Time bonus: `floor(((timeLimit - answerTime) / timeLimit) * 50)`

---

### 5. Firestore Service
**`/Users/admin/Documents/名称未設定フォルダ/src/services/quiz-battle/quiz-battle-service.ts`** (129 lines)

**Collection:** `quiz_battle_ratings`

**Functions:**
- `getOrCreateRating(userId, displayName, avatar)`: Auto-init at 1000 for all 5 levels
- `updateRatingAfterMatch(winnerId, loserId, level, winnerChange, loserChange, isDraw)`: Transactional update
- `getLeaderboard(level, limit=50)`: Fetch & sort by rating
- `subscribeToLeaderboard(level, limit, callback)`: Real-time listener returns sorted players

**Firestore Doc Structure:**
```
{
  odinhId, displayName, avatar,
  ratings: { N5, N4, N3, N2, N1 },
  stats: { [level]: { totalMatches, wins, losses, draws, winRate, currentStreak, bestStreak } },
  createdAt, updatedAt
}
```

---

### 6. Quiz Battle Leaderboard Component
**`/Users/admin/Documents/名称未設定フォルダ/src/components/quiz-battle/quiz-battle-leaderboard.tsx`** (103 lines)

**Features:**
- Level tabs (N5, N4, N3, N2, N1) with live Firestore subscription
- Table: Rank (#/medal), Player (avatar+name), ELO, W/L, Win%
- Highlights current user row with "(Bạn)" suffix
- Medal emojis: 🥇 1st, 🥈 2nd, 🥉 3rd
- Max 50 entries per level

---

### 7. Generic Player Leaderboard Component
**`/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/player-leaderboard.tsx`** (195 lines)

**Features:**
- Shared leaderboard for all games (shows avatar, name, score, rank, answer status)
- Supports: VIP styling, bot badges, eliminated markers, streaks
- Answer indicators: ✓ (correct), ✗ (wrong), ... (pending)
- VIP roles: vip_user, super_admin, director, admin (special frame effect)
- Conversion helper: `toLeaderboardPlayer()` adapts game-specific player types

---

### 8. Quiz Battle Page Orchestrator
**`/Users/admin/Documents/名称未設定フォルダ/src/components/pages/quiz-battle-page.tsx`** (213 lines)

**View States:** `'lobby' | 'playing' | 'results'`

**Features:**
- Auto-create room from Game Hub modal
- Auto-join from join code
- Syncs view from game status
- Saves game session on results (rank, score, correctAnswers)
- Toggle leaderboard visibility in lobby
- Error/loading fallbacks

**Child Components:**
- `QuizBattleLobby`: Player waiting room
- `QuizBattlePlaying`: Active game with answer submission
- `QuizBattleResults`: Final score display

---

## Architecture Summary

### Data Flow
1. **Player joins Quiz Battle** → Creates/joins room (QuizBattlePage)
2. **Game starts** → Questions streamed, answers submitted
3. **Match ends** → Score calculated + ELO applied
4. **Service updates Firestore** → Triggers leaderboard refresh
5. **Real-time subscription** → Leaderboard updates for all viewers

### Key Integrations
- **Center Dashboard:** Stats from `getBranchStats()`, member management
- **Quiz Battle:** Uses `useQuizBattle()` hook (not shown here)
- **Firestore:** Decoupled service for ratings/leaderboard
- **Avatar Handling:** `isImageAvatar()` utility for emoji vs image

### Styling
- Dashboard: `center-dashboard-page.css` (dark glassmorphism)
- Quiz Battle: `quiz-battle-common.css` (shared styling)
- Player Leaderboard: Inline + CSS classes (VIP frames, rank colors)

---

## Unresolved Questions
1. Where is `useQuizBattle()` hook defined? (Not found in provided search scope)
2. How are questions shuffled/selected from `jlptQuestions` array?
3. Real-time game state sync mechanism (Firestore, Socket, Polling)?
4. Answer reveal animation timing (answer_reveal status)?
