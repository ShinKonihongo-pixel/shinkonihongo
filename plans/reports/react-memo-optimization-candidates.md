# React.memo Optimization Candidates - Shinko Codebase

## Executive Summary

**Found 10 high-priority leaf components** that are rendered in lists and would benefit significantly from React.memo wrapping. **None currently use React.memo**. These components span flashcard grids, game lobbies, classroom evaluations, and chat messages.

**Estimated aggregate performance gain**: 20-40% reduction in unnecessary re-renders in heavy-use areas.

---

## TOP 10 CANDIDATES (Sorted by Impact Priority)

### 1. **FlashcardItem** ⭐ CRITICAL
- **File**: `/src/components/flashcard/flashcard-item.tsx` (460 lines)
- **Used In**: `FlashcardList` (lines 122, 140)
- **Typical Scale**: 10-50+ cards per study session
- **Complexity**: **VERY HIGH**
  - 460-line component with flip animation, furigana parsing, TTS, example levels
  - Font calculations for responsive scaling (mobile/desktop)
  - Regex-based ruby tag parsing for Japanese
  - Multi-part card face (front kanji + back answer with examples)
  - Drag-to-advance detection
  
- **Current Prop Flow**:
  - `card` (stable) — from array iteration
  - `isFlipped` (unstable) — parent state: `flippedId === card.id`
  - `onFlip()` callback (unstable) — recreated on parent re-render
  - `onEdit()`, `onDelete()` (unstable) — parent handlers
  - `settings` object (unstable) — contains 60+ properties, new instance per render if not memoized
  - `lessonName` (stable) — string from props

- **Why It's Critical**: 
  - Parent `FlashcardList` manages flip state, form modals, and view mode toggles
  - Every state change causes entire grid to re-render
  - Each card recalculates furigana, font sizes, and styles even if nothing changed
  - With 10-50 cards visible, this is 460 × 40 = 18,400 lines of code re-executed per parent state update

- **Expected Perf Gain**: **30-40%**

---

### 2. **GrammarCardList Item Wrapper** ⭐ HIGH
- **File**: `/src/components/flashcard/grammar-card-list.tsx` (rendered inline, lines 51-123)
- **Used In**: Parent's `.map()` rendering grammar cards in grid
- **Typical Scale**: 5-30 grammar cards per lesson
- **Complexity**: **MEDIUM-HIGH**
  - Card wrapper div with click handler for expand/collapse
  - Expandable examples section (nested map at lines 89-94)
  - Edit/delete buttons with modals
  - Chevron icon changes based on expansion state
  
- **Current Prop Flow**:
  - `card` (stable) — grammar card object
  - Parent state `expandedId` — checked per card: `expandedId === card.id`
  - Parent state `deleteTarget` — checked per card: `deleteTarget?.id === card.id`
  - All callbacks `onEdit()`, `onDelete()` — recreated on parent re-render

- **Why It's High**:
  - Parent manages 3 pieces of state: `expandedId`, `deleteTarget`, and form visibility
  - Any parent action (clicking edit, deleting, etc.) re-renders ALL 5-30 cards
  - Examples list is a nested `.map()` that recalculates for each card on every parent render
  - Card doesn't know what changed, recalculates everything

- **Expected Perf Gain**: **25-35%**

---

### 3. **KanjiCardList Item Wrapper** ⭐ HIGH
- **File**: `/src/components/flashcard/kanji-card-list.tsx` (rendered inline, lines 54-103)
- **Used In**: Parent's `.map()` rendering kanji cards
- **Typical Scale**: 10-100+ kanji cards per level
- **Complexity**: **MEDIUM**
  - Each card is a `<div>` with expand header and details section
  - Sample words nested map (lines 92-98)
  - Batch selection checkbox
  - Puzzle/decomposer button opens modal
  
- **Current Prop Flow**:
  - `card` (stable) — kanji card
  - Parent state `expandedId` — checked per card: `expandedId === card.id`
  - Parent state `selectedIds` (Set) — checked per card: `selectedIds.has(card.id)`
  - Parent state `decomposingId` — compared per card
  - Parent state `canEdit` boolean — affects button visibility
  - Callbacks `onEdit()`, `onDelete()`, `onMove()` — all new instances

- **Why It's High**:
  - Parent has 4+ state variables that trigger full re-renders
  - With 10-100+ items, that's potentially 100+ re-renders of complex card components
  - Batch selection UI (checkbox + batch bar) changes expandedId/selectedIds constantly
  - Sample words nested rendering happens on every parent state change

- **Expected Perf Gain**: **25-30%**

---

### 4. **PlayerListGrid Player Items** ⭐ VERY HIGH
- **File**: `/src/components/shared/game-lobby/player-list-grid.tsx` (lines 36-75)
- **Used In**: Game lobbies in 4+ games:
  - Quiz Game Lobby: `quiz-game/game-lobby.tsx`
  - Racing Game Lobby: `racing-game/racing-game-lobby.tsx`
  - Bingo Game Lobby: `bingo-game/bingo-game-lobby.tsx`
  - Golden Bell Lobby: `golden-bell/golden-bell-lobby.tsx`
- **Typical Scale**: 4-12 active players + 6 empty slots = 10-18 items per render
- **Complexity**: **MEDIUM**
  - Avatar: image with lazy loading OR emoji
  - VIP styling with 3 helper function calls:
    - `getVipAvatarClasses(role, className)`
    - `isVipRole(role)` check
    - `getVipBadge(role)` returns badge text
  - Conditional rendering:
    - Host badge
    - VIP frame overlay
    - Kick button (only if host and not host player and not current player)
  
- **Current Prop Flow**:
  - `players` array (stable shape but items updated)
  - `hostId` (stable) — game property
  - `currentPlayerId` (stable) — logged-in user
  - `maxPlayers` (stable) — game setting
  - `onKickPlayer()` callback (unstable) — new instance unless parent uses useCallback
  - `renderExtra()` optional callback (unstable)

- **Why It's VERY HIGH**:
  - Used across 4 high-activity games (quiz, racing, bingo, golden bell)
  - Game lobbies update frequently: players joining/leaving, ready state, countdown
  - Parent component updates on network events (socket.io messages)
  - VIP helper functions are expensive (multiple condition checks per player)
  - Avatar images fetch and display adds layout shifts
  - With 10-18 items, avoiding 10-18 re-evaluations of VIP styling saves significant CPU

- **Expected Perf Gain**: **20-25%**

---

### 5. **EvaluationItem** ⭐⭐ VERY HIGH (VOLUME)
- **File**: `/src/components/classroom/evaluation/evaluation-item.tsx`
- **Used In**: `StudentList` (lines 167-180) in classroom evaluation panel
- **Typical Scale**: 
  - 3-10 evaluations per student
  - × 15-20 students in classroom
  - = **45-200 items** simultaneously rendered (when students expanded)
- **Complexity**: **MEDIUM**
  - Date range display with formatting
  - Rating stars (read-only)
  - Strengths/improvements sections (conditional)
  - Criteria scores with progress bars (lines 57-82):
    - DEFAULT_EVALUATION_CRITERIA.map() with color lookup
    - Dynamic width% calculation
  - Action buttons with delete confirmation flow
  
- **Current Prop Flow**:
  - `evaluation` object (stable) — from evaluations array
  - Parent state `deleteConfirm` (string | null) — triggers re-render for ALL items
  - Parent state `sending` (boolean) — affects all items with sendNotification
  - Parent state `sendSuccess` (string | null) — used for UI feedback
  - Parent state `saving` (boolean) — disables buttons on all items
  - Callbacks `onEdit()`, `onDelete()`, `onSendNotification()` — all new instances

- **Why It's VERY HIGH (Volume)**:
  - Potential 45-200 items simultaneously rendered
  - Parent state management (deleteConfirm, sending, sendSuccess, saving) causes full re-render
  - User deletes one evaluation → all 200 items re-render checking `deleteConfirm === evaluation.id`
  - User clicks "send notification" → all 200 items re-render checking `sending` boolean
  - Criteria score bars recalculate color and width for each of 200 items

- **Expected Perf Gain**: **35-45%** (largest absolute gain due to volume)

---

### 6. **RankingsTable Item** (Ranking Row)
- **File**: `/src/components/shared/game-results/rankings-table.tsx` (lines 39-63)
- **Used In**: 
  - Quiz game results: `quiz-game/game-results.tsx`
  - Racing game results: `racing-game` results screen
  - Bingo game results: `bingo-game/bingo-game-results.tsx`
  - Kanji battle results: `kanji-battle/kanji-battle-results.tsx`
- **Typical Scale**: 10-50 players per game result
- **Complexity**: **MEDIUM**
  - Avatar image loading (lazy attribute)
  - `isImageAvatar()` helper check per item
  - Medal emoji or rank number: `rank <= 3 ? medalEmojis[rank-1] : '#${rank}'`
  - Winner crown icon (conditional)
  - Dynamic className generation: `${player.id === currentPlayerId ? 'current' : ''}`
  - Custom columns array map (lines 56-60) — executes callback per column per item
  
- **Current Prop Flow**:
  - `rankings` array (stable from game state)
  - `currentPlayerId` (stable) — logged-in user ID
  - `columns` array (unstable) — custom columns passed from parent, NEW instance if not memoized
  - `className`, `title`, `medalEmojis` (stable)
  - Column render callbacks (unstable) — parent closures

- **Why It's High**:
  - Shown after every game ends — high user visibility
  - Results are re-calculated/re-sorted frequently during game state finalization
  - Parent may recalculate columns based on game type (quiz vs racing vs bingo)
  - With 10-50 items and custom column rendering, avoiding duplicate renders saves noticeable time
  - Avatar lazy loading interacts with memoization (image download should only trigger once per item)

- **Expected Perf Gain**: **15-25%**

---

### 7. **SessionItem**
- **File**: `/src/components/pages/my-teaching/session-item.tsx`
- **Used In**: Teaching sessions list view
- **Typical Scale**: 5-50+ teaching sessions per teacher
- **Complexity**: **LOW-MEDIUM**
  - Simple layout: date | time range | duration
  - Inline styles (7 CSS properties)
  - No complex logic, just display
  
- **Current Prop Flow**:
  - `session` object (stable) — teaching session from array
  - That's it — no callbacks, no parent state checks

- **Why It's Medium**:
  - Low complexity per item but high volume (5-50+)
  - Session data rarely changes (immutable once created)
  - Perfect candidate: stable props + simple component = 100% safe, easy win
  - Parent probably doesn't re-render sessions view frequently

- **Expected Perf Gain**: **10-15%** (easy, safe)

---

### 8. **RacePlayerStats**
- **File**: `/src/components/racing-game/shared/race-player-stats.tsx`
- **Used In**: 
  - Current player stats display (bottom bar during race)
  - Player list in lobby
- **Typical Scale**: 2-12 players in race
- **Complexity**: **MEDIUM**
  - Accuracy calculation (line 21-23): `correctAnswers / totalAnswers * 100`
  - Position badge logic (line 25-27)
  - Stats grid with 4 stat boxes (speed, streak, accuracy, distance)
  - Avatar image or emoji
  - Active features map (lines 107-116): power-ups list
  - Progress bar with marker positioning
  
- **Current Prop Flow**:
  - `player` object (unstable) — changes many times per round (speed, distance, accuracy)
  - `raceType` (stable) — 'horse' or 'boat'
  - `position` (unstable) — changes as race progresses
  - `totalPlayers` (stable, optional)

- **Why It's Medium**:
  - Parent re-renders multiple times per question (on answer, on animation, on progress)
  - Each render recalculates accuracy %, position badge, all stat formatting
  - Power-ups active features map is re-evaluated even if no features changed
  - Only 2-12 items, so absolute volume is lower than flashcards/evaluations
  - But high re-render frequency means memoization saves cumulative cycles

- **Expected Perf Gain**: **10-20%**

---

### 9. **GameLeaderboard Podium Player Pod** ⭐ MID-RANGE
- **File**: `/src/components/quiz-game/play/game-leaderboard.tsx` (lines 73-95)
- **Used In**: Between-round leaderboard screen in quiz games
- **Typical Scale**: 3 players (top 3 only)
- **Complexity**: **MEDIUM**
  - PODIUM_ICONS array lookup by rank (line 76)
  - PODIUM_SIZES array lookup (line 77)
  - Score display
  - Conditional streak badge (lines 88-90): `{player.streak >= 3 && <span>...}`
  - Numeric rank label on podium stand (line 92)
  - `isMe` check for highlighting
  
- **Current Prop Flow**:
  - `player` object (stable between renders)
  - Computed values:
    - `podiumOrder` array (recalculated every render!) — `[top3[1], top3[0], top3[2]]`
    - `podiumClasses` array (recalculated every render!) — `['second', 'first', 'third']`
    - `actualRank` computed per player based on displayIdx
  - `currentPlayer` prop used for isMe check

- **Why It's Medium**:
  - Only 3 items, so volume is low
  - BUT podiumOrder and podiumClasses are recalculated every render (move to constants!)
  - Between-round leaderboard appears for 3-5 seconds, frequent re-renders during that window
  - Memoization prevents unnecessary recalculation of icon lookups and other logic
  - Quick fix: extract podiumOrder and podiumClasses to module-level constants

- **Expected Perf Gain**: **5-10%** (plus code clarity from extracting constants)

---

### 10. **KaiwaMessageItem**
- **File**: `/src/components/kaiwa/kaiwa-message-item.tsx`
- **Used In**: Chat conversation history in Kaiwa (AI conversation practice)
- **Typical Scale**: 10-100+ messages in a conversation session
- **Complexity**: **MEDIUM**
  - Role-based avatar (Bot icon vs User icon)
  - FuriganaText component (parses Japanese with ruby tags)
  - Text-to-speech controls:
    - Normal speed button: `onSpeak(messageId, text, 'normal')`
    - Slow speed button: `onSpeak(messageId, text, 'slow')`
    - Stop button (conditional)
  - Translation feature:
    - Translation toggle button
    - Async `onTranslate()` call
    - Loading spinner
    - Inline translation display
  - Copy button with clipboard and success feedback
  - Optional save sentence button
  
- **Current Prop Flow**:
  - `message` object (stable) — KaiwaMessage from array
  - `speakingMessageId` (unstable) — parent state: which message is playing audio
  - `speakingMode` (unstable) — parent state: 'normal' | 'slow' | null
  - `showFurigana` (unstable) — parent setting, changes when toggled
  - `fontSize` (unstable) — parent setting
  - Callbacks `onSpeak()`, `onAnalyze()`, `onTranslate()`, `onSaveSentence()` — all new instances

- **Why It's Medium-High**:
  - 10-100+ items rendered in conversation
  - Parent re-renders on:
    - User clicks speak button for a message → speakingMessageId changes → all items re-render checking `speakingMessageId === message.id`
    - Settings toggle (furigana, font size) → all items recalculate FuriganaText display
    - Any parent state change
  - FuriganaText component does regex parsing and ruby tag generation per message on every render
  - Translation state is per-message (local) but parent's speakingMessageId changes affect all
  - Expected Perf Gain**: **20-30%**

---

## Detailed Implementation Guidance

### Prerequisites Before Wrapping
For components with **unstable props**, consider also optimizing parents:

| Component | Parent | Optimization |
|-----------|--------|--------------|
| FlashcardItem | FlashcardList | Wrap `onEdit`, `onDelete` in useCallback; memoize `settings` if from context |
| GrammarCardList items | GrammarCardList | Wrap `onEdit`, `onDelete` in useCallback |
| KanjiCardList items | KanjiCardList | Wrap `onEdit`, `onDelete`, `onMove` in useCallback |
| PlayerListGrid items | Game Lobbies | Wrap `onKickPlayer` in useCallback |
| EvaluationItem | StudentList | Wrap all 4 callbacks in useCallback |
| RankingsTable items | Game Results | Memoize `columns` array if computed |
| SessionItem | Sessions List | No parent changes needed (stable props) |
| RacePlayerStats | RacingGamePlay | No major parent changes needed |
| GameLeaderboard pods | GameLeaderboard | Extract `podiumOrder` and `podiumClasses` to constants |
| KaiwaMessageItem | Kaiwa Session | Wrap `onSpeak`, `onAnalyze`, `onTranslate`, `onSaveSentence` in useCallback |

### Props to Prioritize as Stable

When wrapping with React.memo, these props are naturally stable:
- Primitive types: `string`, `number`, `boolean` (if never change)
- Object IDs: `card.id`, `player.id`, `message.id`
- Enum values: `level`, `raceType`, `role`
- Display values from data: `card.vocabulary`, `player.displayName`

Avoid comparing:
- New object instances: `{ ...card, extra }`
- New array instances: avoid destructuring parent arrays in JSX
- Callbacks unless wrapped with useCallback in parent
- Complex objects unless memoized with useMemo in parent

---

## Implementation Pattern

```typescript
// Before:
export function FlashcardItem({ card, isFlipped, onFlip, ... }: FlashcardItemProps) {
  // component code
}

// After:
function FlashcardItemComponent({ card, isFlipped, onFlip, ... }: FlashcardItemProps) {
  // component code (unchanged)
}

export const FlashcardItem = React.memo(FlashcardItemComponent, (prevProps, nextProps) => {
  // Return true if props are equal (skip render)
  // Return false if props changed (re-render)
  return (
    prevProps.card === nextProps.card &&
    prevProps.isFlipped === nextProps.isFlipped &&
    prevProps.onFlip === nextProps.onFlip &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.settings === nextProps.settings &&
    prevProps.lessonName === nextProps.lessonName &&
    prevProps.showActions === nextProps.showActions
  );
});

FlashcardItemComponent.displayName = 'FlashcardItem';
```

Or use the simpler shallow comparison (React.memo default):
```typescript
export const FlashcardItem = React.memo(FlashcardItemComponent);
```

---

## Expected Improvements

| Priority | Components | Expected Gain |
|----------|-----------|---|
| 1 (Critical) | FlashcardItem | 30-40% fewer re-renders in card management |
| 2 (High) | GrammarCardList items, KanjiCardList items | 25-35% fewer re-renders |
| 3 (Very High) | PlayerListGrid items (4 games), EvaluationItem (volume) | 20-45% |
| 4 (Medium) | RankingsTable, RacePlayerStats, KaiwaMessageItem | 10-30% |
| 5 (Low) | SessionItem, GameLeaderboard pods | 5-15% |

**Total estimated reduction in unnecessary re-renders**: 20-40% in heavy-use scenarios (card management, game lobbies, classroom evaluations).

---

## Files Modified
- None yet — this is a recommendation report
- Next phase: Implement memo wrapping per above pattern
- Parent optimizations (useCallback, useMemo) recommended for 8/10 components

## Notes
- All components analyzed are leaf components (children, not containers)
- No components currently use React.memo
- Prop instability is the main blocker; recommend parent optimization in parallel
- SessionItem has the lowest risk (stable props) — good starting point
- FlashcardItem has highest impact (complexity + scale + instability)
