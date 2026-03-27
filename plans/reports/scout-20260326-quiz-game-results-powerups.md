# Quiz Game Results Screen & Power-ups File Scout Report

## Summary
Found all files related to the quiz game results/end screen (showing "Kết thúc" with podium, stats), power-up selection logic (steal points, freeze opponents), and game state management.

---

## 1. Results Screen Component (Kết thúc / Game Over)

### `/src/components/quiz-game/game-results.tsx`
- Final immersive end-of-game results screen
- Shows confetti animation (12 CSS-animated pieces)
- Olympic-style podium for top 3 players (winner center, 2nd/3rd flanking)
- Medal icons: Crown (1st), Medal (2nd), Award (3rd)
- Personal performance card showing rank, score, accuracy %, correct/total counts, longest streak
- Full rankings list for all remaining players (4+ positions)
- Game stats: total questions, player count, highest score
- Actions: "Chơi lại" (Play Again) and "Về trang chủ" (Go Home) buttons
- Derives rankings from `game.players`, falls back to server-computed `gameResults` for richer stats
- Props: game, gameResults, currentPlayerId, onPlayAgain, onGoHome

**Key features:**
- Gold-border highlight for top-3 finishers
- "Bạn" tag on personal player row
- Flame icon shows streaks >= 3
- Confetti decorative elements with CSS animation staggering

---

## 2. Power-up Selection & Management

### `/src/components/quiz-game/play/game-power-up.tsx`
- Premium animated power-up selection screen shown after special rounds
- 4 UI states: selection, confirmed, ineligible (wrong answer), spectator
- Power-up grid with 5 interactive cards (steal_points, block_player, double_points, shield, time_freeze)
- Target selection UI for power-ups requiring a target (steal_points, block_player)
- Shows eligible/ineligible message based on whether player answered correctly
- Timer badge showing seconds remaining
- "Rời" (Leave) button for spectators/ineligible players
- Confirmation UI after power-up selection

**Power-up types:**
- `steal_points` 💰 - Deduct 50 points from target player
- `block_player` 🚫 - Prevent target from answering next question
- `double_points` ✨ - Double earned points on next correct answer
- `shield` 🛡️ - Negate next incoming power-up attack
- `time_freeze` ❄️ - Add 5 seconds to next question timer

**Props:** currentPlayer, currentQuestion, sortedPlayers, powerUpTimer, isSpectator, onUsePowerUp, onLeaveGame

---

## 3. Game Play Component (Game Flow Controller)

### `/src/components/quiz-game/play/index.tsx`
- Orchestrates all gameplay states (starting → question → answer_reveal → power_up → leaderboard → finished)
- Manages sound effects (correct/wrong) on answer reveal
- Tracks previous scores to show score animations
- Integrates with `useGameTimers` hook for countdown/timer logic
- Renders appropriate sub-component based on `game.status`
- Props flow: game state, current player, current question, sorted players, callbacks for all game actions

**Game state flow:**
1. starting → GameStarting (countdown)
2. question → GameQuestion (answer submission UI)
3. answer_reveal → GameAnswerReveal (show correct answer & score updates)
4. power_up → GamePowerUp (power-up selection for special rounds)
5. leaderboard → GameLeaderboard (inter-round leaderboard)
6. finished → handled by GameResults (in parent page component)

---

## 4. Game State Management Hook

### `/src/hooks/use-quiz-game.ts`
- Central hook managing all quiz game state and actions
- **State:** game, gameResults, availableRooms, loading, error
- **Computed values:** isHost, currentPlayer, currentQuestion, playerCount, sortedPlayers

**Key actions:**
- `createGame()` - Create new game with title, duration, num questions
- `joinGame(gameCode)` - Join existing game by code
- `leaveGame()` - Leave current game (suppress subscription errors on exit)
- `startGame()` - Host starts the game (requires min 2 players)
- `submitAnswer(answerIndex)` - Player submits answer to current question
- `revealAnswer()` - Host reveals correct answer (host-only action)
- `nextRound()` - Advance to next question (host-only)
- `usePowerUp(powerUpType, targetPlayerId?)` - Use power-up with optional target
- `continueFromPowerUp()` - Host continues after power-up selection phase
- `continueFromLeaderboard()` - Host continues after leaderboard display
- `updateHostMessage(message)` - Update lobby message (host-only)
- `fetchAvailableRooms()` / `subscribeToRooms()` - Get active games

**Special features:**
- Real-time subscription to game updates (Firestore)
- Auto-bot logic: adds AI bot after 15-60s if host is alone in lobby
- Bot auto-answer: bots answer questions after 1-6s with 80-100% accuracy
- Catches kicked/deleted game errors
- Power-up integration calls `gameService.usePowerUp()`

---

## 5. Quiz Game Page (Entry Point)

### `/src/components/pages/quiz-game-page.tsx`
- Main container managing overall quiz game flow
- Routes between: GameLobby (waiting) → GamePlay (in-progress) → GameResults (finished)
- Initializes game from `initialRoomConfig` (create) or `initialJoinCode` (QR/code join)
- Saves game sessions for XP tracking on completion
- Handles kicked/deleted notifications with 3s auto-dismiss
- Props: currentUserId, currentUserName, flashcards, jlptQuestions, settings, friends, callbacks

**Integrations:**
- Passes `usePowerUp` callback to GamePlay component
- Coordinates game creation/joining/results
- Manages friend invites modal

---

## 6. Timer Management

### `/src/components/quiz-game/play/use-game-timers.ts`
- Custom hook for all game timers (question countdown, reveal delay, power-up selection time)
- Returns: timeLeft, countdown, revealTimer, powerUpTimer
- Auto-advances game state on timer expiration
- Triggers host callbacks: onRevealAnswer, onNextRound, onContinueFromPowerUp, onContinueFromLeaderboard

---

## 7. Type Definitions

### `/src/types/quiz-game.ts`
- PowerUpType enum (steal_points, block_player, double_points, shield, time_freeze)
- POWER_UPS registry with names, descriptions, icons
- GamePlayer interface (score, isBot, isHost, isBlocked, hasDoublePoints, hasShield, hasTimeFreeze, streak)
- GameQuestion interface (question, options, correctIndex, isSpecialRound)
- GameStatus enum (waiting, starting, question, answer_reveal, power_up, leaderboard, finished)
- QuizGame interface (game state document)
- GameResults interface (server-computed final stats)

---

## 8. CSS Files

### `/src/components/quiz-game/quiz-game-results.css`
- Results screen styling (confetti animation, podium layout, personal card, rankings)

### `/src/components/quiz-game/quiz-game-powerups.css`
- Power-up selection UI styling (grid, cards, target section, confirmation state)

### `/src/components/quiz-game/quiz-game-base.css`
- Base styling for all quiz game screens

### Other quiz-game CSS files
- quiz-game-starting.css, quiz-game-question.css, quiz-game-reveal.css, quiz-game-leaderboard.css, quiz-game-lobby.css, quiz-game-mobile.css, quiz-game-premium.css

---

## File Structure Overview

```
src/
├── components/quiz-game/
│   ├── game-results.tsx                    ⭐ RESULTS SCREEN
│   ├── play/
│   │   ├── game-power-up.tsx              ⭐ POWER-UP SELECTION
│   │   ├── index.tsx                       ⭐ GAME PLAY FLOW
│   │   ├── use-game-timers.ts             Timer management
│   │   ├── game-question.tsx              Question UI
│   │   ├── game-answer-reveal.tsx         Answer reveal UI
│   │   ├── game-leaderboard.tsx           Leaderboard UI
│   │   └── game-starting.tsx              Starting countdown UI
│   ├── game-play.tsx                       Re-export wrapper
│   ├── quiz-game-results.css
│   ├── quiz-game-powerups.css
│   └── [other CSS files]
├── pages/
│   └── quiz-game-page.tsx                 ⭐ ENTRY POINT
├── hooks/
│   └── use-quiz-game.ts                   ⭐ GAME STATE HOOK
└── types/
    └── quiz-game.ts                        Power-up types & enums
```

---

## Power-up Flow Sequence

1. Player answers correctly in special round (isSpecialRound: true)
2. Game enters "power_up" status
3. GamePowerUp component renders 5 power-up cards
4. Player selects power-up (+ target if steal_points/block_player)
5. `usePowerUp(type, targetId?)` called → GameService
6. Power-up effect applied to target player:
   - steal_points: target.score -= 50
   - block_player: target.isBlocked = true (next round)
   - double_points: currentPlayer.hasDoublePoints = true
   - shield: currentPlayer.hasShield = true
   - time_freeze: currentPlayer.hasTimeFreeze = true
7. Host calls `continueFromPowerUp()` to advance
8. Next round begins with power-up effects active

---

## Results Screen Flow

1. Game reaches "finished" status
2. QuizGamePage routes to GameResults
3. Rankings computed from game.players (sorted by score)
4. Personal stats card shows live score + server-computed accuracy/streak
5. Podium displays top 3 with Olympic-style layout
6. Actions: Play Again (reset) or Go Home (exit)

Unresolved questions: None — all files located and documented.
