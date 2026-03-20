# Code Review Summary — Quiz Battle (Đấu Trí)

## Scope
- Files reviewed: 16 (types, utils ×2, service, hooks ×6, components ×4, CSS, page)
- Lines analyzed: ~950
- Review focus: Type safety, hook patterns, Firestore data flow, game logic, security, CSS
- Updated plans: none (no plan provided)

---

## Overall Assessment

Solid implementation overall. Clean separation of concerns, TypeScript compiles with zero errors, CSS matches the dark glassmorphism theme. Critical issues are concentrated in **security** (correctAnswer exposed to clients) and **game-flow correctness** (first-round timer, finishMatch idempotency, race condition in getOrCreateRating). Several medium-priority bugs around ELO draw results and streaks.

---

## Critical Issues

### C1 — `correctIndex` fully exposed to the client (CHEATING VECTOR)
**File:** `src/hooks/quiz-battle/use-game-creation.ts:54–68`
**File:** `src/components/pages/quiz-battle/quiz-battle-types.ts:28–35`

All `QuizBattleQuestion` objects, including `correctIndex`, are stored in the Firestore game document and streamed to every client via `subscribeToGameRoom`. A player can read `correctIndex` from the Firestore document before answering.

```ts
// QuizBattleQuestion stored in game doc
export interface QuizBattleQuestion {
  correctIndex: number;  // <-- visible to both players in real-time
  ...
}
```

**Fix options (choose one):**
1. **Backend validation (recommended):** Move scoring to a Cloud Function triggered on `answer_reveal`. Strip `correctIndex` from the document before writing; store it in a private subcollection or in a server-side only field.
2. **Minimal client-side mitigation:** Store questions without `correctIndex` in the game doc; keep a separate `answers` subcollection readable only by the host after reveal (still weaker than option 1).

### C2 — `getOrCreateRating` has a TOCTOU race condition
**File:** `src/services/quiz-battle/quiz-battle-service.ts:54–64`

```ts
const snap = await getDoc(ref);
if (snap.exists()) return snap.data() as QuizBattleRating;
// ← another client could have written here concurrently
const rating = defaultRating(userId, displayName, avatar);
await setDoc(ref, rating);   // overwrites concurrent write
return rating;
```

Two players joining simultaneously could each create their rating, with the second `setDoc` overwriting the first. Should use `setDoc` with `merge: true` or a transaction.

```ts
// Fix
await setDoc(ref, defaultRating(userId, displayName, avatar), { merge: true });
const snap = await getDoc(ref);
return snap.data() as QuizBattleRating;
```

---

## High Priority Findings

### H1 — `processingRef` is declared but never set to `true` — no idempotency guard
**File:** `src/hooks/quiz-battle/use-match-flow.ts:27, 98`

```ts
const processingRef = useRef(false);
// ...
if (!game || !isHost || processingRef.current) return;  // always false
```

`processingRef.current` is never set to `true`. This means the guard against double-processing is non-functional. If the effect re-runs quickly (e.g., React StrictMode double-invoke, or a Firestore snapshot arriving mid-transition), `revealAnswer` or `finishMatch` can fire multiple times, causing duplicate Firestore writes and double ELO updates.

**Fix:** Set `processingRef.current = true` at the start of each transition and reset it after async completion.

### H2 — `finishMatch` can be called multiple times, triggering duplicate ELO writes
**File:** `src/hooks/quiz-battle/use-match-flow.ts:113–117`

```ts
revealTimerRef.current = setTimeout(() => {
  setGame(prev => {
    if (prev.currentRound >= 19) finishMatch(prev).catch(console.error);
    // ← if setGame callback fires twice, ELO applied twice
    ...
  });
}, REVEAL_DELAY_MS);
```

`finishMatch` is called inside a `setGame` updater. React may invoke state updaters more than once (StrictMode). There's no guard (no `finishedRef`, no status check before calling `updateRatingAfterMatch`). A second ELO application would corrupt both players' ratings.

**Fix:** Add a `ratingAppliedRef = useRef(false)` guard inside `finishMatch`.

### H3 — First round `roundStartTime` is never set
**File:** `src/hooks/shared/use-game-room-actions.ts:157–165` (startGame)
**File:** `src/hooks/quiz-battle/use-match-flow.ts:105`

`startGame` transitions: `waiting → starting → playing` (after 3s setTimeout). It does **not** set `roundStartTime`. The timer calculation for round 0:

```ts
const elapsed = game.roundStartTime ? Date.now() - game.roundStartTime : 0;
```

When `roundStartTime` is `null`, `elapsed` is 0, so the full 15s is given. But the 3s `starting` countdown is not subtracted. Players effectively get 18s on the first question.

`startNextRound` correctly sets `roundStartTime`, so rounds 1–19 are fine.

**Fix:** Set `roundStartTime: Date.now()` inside the `setGame` call when transitioning from `starting` to `playing`.

### H4 — `leaveGame` does not remove non-host player from Firestore
**File:** `src/hooks/shared/use-game-room-actions.ts:120–126`

```ts
if (leaveStrategy === 'remove-self' && !isHost) {
  if (onRemoveSelf && roomId) {
    onRemoveSelf(game, currentUser.id, roomId);
  }
  clearLocalGameState?.();
}
```

Quiz Battle uses `leaveStrategy: 'remove-self'` but does **not** provide `onRemoveSelf`. When the non-host leaves, only local state is cleared — the player is never removed from Firestore. The host continues to see the departed player and the game can start in a broken 1-player state.

**Fix:** Either provide `onRemoveSelf` that calls `updateGameRoom` to remove the player, or default-handle the remove-self case inside the shared hook when `onRemoveSelf` is absent.

### H5 — Double Firestore write on every state transition (host)
**File:** `src/hooks/quiz-battle/use-match-flow.ts:51–52, 63–64`
**File:** `src/hooks/shared/use-game-room-state.ts:52–68`

`setGame` in `useGameRoomState` **already writes to Firestore** after every call. But `revealAnswer` and `startNextRound` also call `updateGameRoom` directly **before** calling `setGame`. This creates two Firestore writes per transition — a race between the direct write and the `setGame`-triggered write.

```ts
// revealAnswer — writes twice
updateGameRoom(g.id, { status: 'answer_reveal', players: scored.players });  // write 1
setGame(() => ({ ...scored, status: 'answer_reveal' }));  // triggers write 2 via useGameRoomState
```

The second write (from `setGame`) will overwrite the first with potentially stale data if React batches the state update. Consolidate to one path.

### H6 — Leaderboard reads entire collection (no server-side ordering/limit)
**File:** `src/services/quiz-battle/quiz-battle-service.ts:108–127`

Both `getLeaderboard` and `subscribeToLeaderboard` fetch **all documents** from `quiz_battle_ratings`, sort client-side, then slice. This will degrade badly at scale and incurs unnecessary Firestore read costs. Firestore doesn't support dynamic field queries easily for rating-per-level, but a dedicated per-level subcollection or composite indexes would address this.

---

## Medium Priority Improvements

### M1 — ELO draw: `results.winner` and `results.loser` are both `null`, so opponent's rating change is not shown
**File:** `src/hooks/quiz-battle/use-match-flow.ts:78–81`
**File:** `src/components/quiz-battle/quiz-battle-results.tsx:21–22`

On draw, `winner = null` and `loser = null`. In the results component:
```ts
const myResult = meIsWinner ? winner : loser;  // both null on draw
const opResult = meIsWinner ? loser : winner;   // both null on draw
```
Rating changes display `±0` for both players instead of the actual ELO change.

**Fix:** Always populate both `winner` and `loser` in `QuizBattleResults`, using a discriminated union or always-present participant fields for draw.

### M2 — Loss streak not tracked (only win streak)
**File:** `src/services/quiz-battle/quiz-battle-service.ts:88–90`

```ts
else if (outcome === 'loss') { stats.losses++; stats.currentStreak = 0; }
```

`currentStreak` resets to 0 on loss but doesn't go negative. The `QuizBattleLevelStats` type comments `positive = win streak, negative = loss streak`, which the implementation doesn't honour. Minor UI/data consistency issue.

### M3 — Score pop animation uses uncleared `setTimeout`
**File:** `src/components/quiz-battle/quiz-battle-playing.tsx:39–44`

```ts
setTimeout(() => setScorePopMe(false), 450);
setTimeout(() => setScorePopOpp(false), 450);
```

Timeout IDs are not stored; if the component unmounts before 450ms (unlikely but possible during quick round transitions), these will call `setState` on an unmounted component. Use `useRef` to store IDs and clear on unmount.

### M4 — Duplicate type definitions for service internals
**File:** `src/services/quiz-battle/quiz-battle-service.ts:13–33`

`QuizBattleRating`, `QuizBattleLevelStats`, and `JLPTLevel` are re-declared locally in the service instead of importing from `quiz-battle-types.ts`. If the canonical types diverge, the service silently uses the wrong shape.

**Fix:** Import from `../../components/pages/quiz-battle/quiz-battle-types` and `../../types/jlpt-question`.

### M5 — `opponentPlayer?.currentAnswer !== null` is truthy when player hasn't loaded yet
**File:** `src/components/quiz-battle/quiz-battle-playing.tsx:150`

When `opponentPlayer` is `undefined` (game just started), the expression `undefined?.currentAnswer !== null` evaluates to `undefined !== null` → `true`, showing "đã trả lời" before the opponent exists.

**Fix:** `opponentPlayer != null && opponentPlayer.currentAnswer !== null`

### M6 — `winRate` stored as 0–1 in service but typed as 0–100 in types
**File:** `src/services/quiz-battle/quiz-battle-service.ts:91`
**File:** `src/components/pages/quiz-battle/quiz-battle-types.ts:107`

```ts
// service writes:
stats.winRate = stats.wins / stats.totalMatches;  // 0–1

// type comment says:
winRate: number;  // 0–100
```

The leaderboard also recalculates win% from raw `wins/totalMatches`, so no display bug now, but the stored `winRate` field is misleading and inconsistent with its own type comment.

### M7 — `handleStart` / `handlePlayAgain` wrap stable callbacks unnecessarily
**File:** `src/components/pages/quiz-battle-page.tsx:103–116`

```ts
const handleStart = useCallback(() => game.startGame(), [game]);
const handlePlayAgain = useCallback(() => { game.resetGame(); onClose(); }, [game, onClose]);
```

`game` is a new object on every render (the entire hook return), making these `useCallback`s ineffective — deps change every render. Either spread stable refs from the hook or use `useRef` approach. Low perf impact for this use case but worth cleaning up.

### M8 — `eslint-disable-next-line react-hooks/exhaustive-deps` without explanation
**File:** `src/hooks/quiz-battle/use-match-flow.ts:96`

The suppressed dependency warning is because `game` (full object) is intentionally excluded to avoid re-running on every player state change, instead using derived `answerKey` and primitive game properties. This is a valid pattern but should be documented with a comment explaining *why*.

---

## Low Priority Suggestions

### L1 — CSS selector duplicate
**File:** `src/components/quiz-battle/quiz-battle.css:64`

```css
.qb-lobby-player-avatar img, .qb-lobby-player-avatar img { ... }
```

Selector is repeated twice; the second is a dead duplicate.

### L2 — `revealAnswer` callback captures stale `g` via `setGame` pattern
**File:** `src/hooks/quiz-battle/use-match-flow.ts:106–108`

```ts
roundTimerRef.current = setTimeout(() => {
  setGame(prev => { if (prev?.status === 'playing') revealAnswer(prev); return prev; });
}, ...);
```

`revealAnswer(prev)` then calls `setGame(() => ...)` inside a `setGame` updater — nested `setGame` calls. While React queues these, the pattern is fragile and hard to reason about.

### L3 — `createGame` double-resets `creatingRef.current = false`
**File:** `src/hooks/quiz-battle/use-game-creation.ts:117–120`

Both `catch` and `finally` blocks reset `creatingRef.current = false`. The `catch` reset is redundant since `finally` always runs.

### L4 — `sessionSaved.current = false` on every render when `view !== 'results'`
**File:** `src/components/pages/quiz-battle-page.tsx:100`

This executes during render, which is a side effect in render. Should be inside a `useEffect`.

### L5 — `QBLobby` renders `LobbyHostCard` (shows avatar+name header) *and* the custom player row below — host appears twice
**File:** `src/components/quiz-battle/quiz-battle-lobby.tsx:57–101`

`LobbyHostCard` and the `qb-lobby-player-card qb-lobby-host` div both render the host's info. Visually redundant.

---

## Positive Observations

- TypeScript compiles with **zero errors** across all 16 files
- `useGameCreation` uses `creatingRef` to prevent double-submit — good pattern
- `useRatingSync` correctly uses a `cancelled` flag for async cleanup
- `calculateRatingChanges` has correct ELO math with K=32 and floor=100
- `applyRoundScores` correctly uses `answerTime ?? timeLimitMs` for timed-out players
- CSS is consistent with the project's dark glassmorphism theme (correct gradient, border opacities, backdrop patterns)
- `runTransaction` used correctly in `updateRatingAfterMatch` — atomicity is preserved for ELO updates
- Clean hook decomposition: state / creation / actions / matchFlow / ratingSync are well-separated

---

## Recommended Actions (Priority Order)

1. **[Critical]** Strip `correctIndex` from the Firestore game document; move answer validation server-side (Cloud Function or at minimum a reveal-only subcollection)
2. **[Critical]** Fix `getOrCreateRating` race — use `setDoc` with `{ merge: true }` instead of read-then-write
3. **[High]** Add `ratingAppliedRef` guard in `finishMatch` to prevent duplicate ELO writes
4. **[High]** Set `processingRef.current = true` when a transition begins; reset after completion
5. **[High]** Fix first-round timer: set `roundStartTime: Date.now()` when transitioning `starting → playing`
6. **[High]** Fix non-host leave: provide `onRemoveSelf` or default removal logic so player is actually removed from Firestore
7. **[High]** Eliminate double Firestore write in `revealAnswer`/`startNextRound` — pick one path (either direct `updateGameRoom` or `setGame`, not both)
8. **[Medium]** Fix draw results: populate both participants in `QuizBattleResults` even for draws so rating changes display correctly
9. **[Medium]** Fix `opponentPlayer?.currentAnswer !== null` guard (M5)
10. **[Medium]** Import shared types in service instead of redeclaring them (M4)
11. **[Low]** Fix `sessionSaved.current = false` side-effect-in-render (L4)
12. **[Low]** Remove duplicate CSS selector (L1)

---

## Metrics
- Type Coverage: 100% (0 TypeScript errors)
- Test Coverage: 0% (no test files found for this module)
- Linting Issues: 1 suppressed (`react-hooks/exhaustive-deps` in use-match-flow.ts)
- Build: clean

---

## Unresolved Questions

1. Are Firestore Security Rules deployed? No `firestore.rules` file found — cannot verify if unauthenticated users can read `quiz_battle_ratings` or game rooms.
2. Is there a plan to move to Cloud Functions for scoring? The correctAnswer exposure (C1) cannot be fully fixed client-side.
3. `getLeaderboard` (async version, line 108) appears unused — is it a dead export or used elsewhere?
