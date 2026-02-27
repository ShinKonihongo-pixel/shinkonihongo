# Code Review: Kanji Drop Game

**Date:** 2026-02-27
**Reviewer:** code-reviewer subagent

---

## Scope

- **Files reviewed:** 14 new files + 3 modified files
- **LoC:** ~1,100 (new) + ~30 (modifications)
- **TypeScript check:** PASS (0 errors)
- **Review focus:** New kanji-drop module

---

## Overall Assessment

Solid, clean implementation. Architecture is well-separated (pure engine, stateful hook, dumb UI components). No security vulnerabilities. One high-priority infinite-loop risk in `cascadeClear`, several medium issues, no critical issues.

---

## Critical Issues

None.

---

## High Priority Findings

### H1 — `cascadeClear` infinite loop is theoretically unbounded

**File:** `kanji-drop-engine.ts` lines 196–207

```ts
while (true) {
  const reflowed = reflow(current);
  const runs = scanRuns(reflowed);
  if (runs.length === 0) {
    return { finalBottom: reflowed, totalCleared, cascadeCount };
  }
  const { newBottom, clearedCount } = clearRuns(reflowed, runs);
  ...
  current = newBottom;
}
```

With pure deterministic functions, once `runs.length === 0` is reached the loop terminates. However, if a future bug in `reflow` or `scanRuns` causes the state to oscillate (never converge), the UI thread freezes permanently with no escape. Add a safety cap:

```ts
const MAX_CASCADE = 50;
let safetyCount = 0;
while (safetyCount++ < MAX_CASCADE) {
  ...
}
// fallback: return current state
return { finalBottom: reflow(current), totalCleared, cascadeCount };
```

### H2 — `nextLevel` reads stale `gameState` via closure

**File:** `use-kanji-drop-game.ts` lines 265–289

```ts
const nextLevel = useCallback(() => {
  const newLevel = gameState.level + 1;  // stale closure read
  ...
  setGameState(prev => ({ ...prev, ... }));
}, [gameState.level, isVip, availableKanji, kanjiCards]);
```

`gameState.level` is read directly (not from the `prev` setter), so the dep array must change on every level transition to stay correct — which forces re-creation of the callback. This is fine functionally, but the pattern is fragile. Better: read level inside the setter:

```ts
const nextLevel = useCallback(() => {
  setGameState(prev => {
    const newLevel = prev.level + 1;
    const seed = Date.now();
    const config = getLevelConfig(newLevel, isVip);
    const kanji = availableKanji.length >= config.kanjiVariety ? availableKanji : kanjiCards;
    const pool = generatePool(kanji, config, seed);
    const bottom = initBottomRow(config.lockedSlots);
    const powerUps = assignPowerUps(config.powerUpReward, seed + 1);
    return { ...prev, phase: 'playing', result: null, level: newLevel, seed, pool, bottom, powerUps, undoStack: [], moves: 0, cascadeCount: 0, clearedCount: 0 };
  });
}, [isVip, availableKanji, kanjiCards]);
```

Note: `assignPowerUps` is a plain function inside the hook body, not memoized — moving it to be a stable helper or module-level function would also help.

---

## Medium Priority Improvements

### M1 — Duplicate `KanjiDropPageProps` interface

`kanji-drop-types.ts` (lines 84–102) and `kanji-drop-page.tsx` (lines 12–30) both define an identical `KanjiDropPageProps` interface. The one in `kanji-drop-types.ts` is never imported from `index.ts`. Either remove the type-file copy or re-export it and use it in the page.

### M2 — `index.ts` over-exports engine internals

```ts
export * from './kanji-drop-engine';
```

This exposes `mulberry32`, `fisherYatesShuffle`, `createUndoSnapshot`, etc. as public API. Nothing outside the module needs them; restrict index to types + page component only, or don't barrel-export implementation functions.

### M3 — `TutorialOverlay` ESLint suppression comment

```ts
// eslint-disable-next-line react-hooks/set-state-in-effect
if (!seen) setShow(true);
```

This is not a real ESLint rule name (`react-hooks/set-state-in-effect` does not exist). The suppression is a no-op and indicates the author was confused. `setState` inside `useEffect` with `[]` deps is perfectly valid for this pattern — just remove the comment.

### M4 — `saveProgress` calls `loadProgress` on every win

**File:** `use-kanji-drop-game.ts` lines 45–52

```ts
function saveProgress(level: number) {
  const existing = loadProgress();   // reads localStorage again
  if (level > existing) { ... }
}
```

`loadProgress()` was already called once during hook init and stored as `setupConfig.startLevel`. Reading localStorage twice is redundant. Pass the current known highestLevel as a parameter or compare against `gameState.level` directly.

### M5 — `assignPowerUps` defined inside hook, recreated every render

`assignPowerUps` is a plain function with no closures over hook state — it only takes explicit parameters. Move it to module scope or into the engine file to avoid garbage per render.

### M6 — Setup screen start-level filter logic is confusing

```tsx
{[1, 5, 10, 15].filter(l => l <= config.startLevel || l === 1).map(...)}
```

This shows "1" always, plus any preset ≤ the saved high-level. That means a player at level 3 sees only "1". At level 14 they see "1, 5, 10". There's no way to input an arbitrary level. This is likely intentional gating, but the implicit filter is not self-documenting. Add a comment.

### M7 — `playWrong()` called in functional updater

**File:** `use-kanji-drop-game.ts` line 163

```ts
setGameState(prev => {
  ...
  playWrong();   // side effect inside React state updater
  return { ... };
});
```

Side effects (sound) inside `setGameState` updaters are called by React and may execute in StrictMode double-invocations. Use `useEffect` to react to phase transitions for sound, or ensure the sound library is idempotent. Same pattern at lines 174, 176, 196.

---

## Low Priority Suggestions

### L1 — `LEVEL_CONFIGS` `powerUpReward` always equals `1`

All 20 entries have `powerUpReward: 1`. The field exists in `LevelConfig` but is never varied. Either vary it or remove the field and use the constant directly — it's dead config surface area (YAGNI).

### L2 — `sessionSaved` ref guard resets on every non-result phase change

```ts
if (gameState.phase !== 'result') sessionSaved.current = false;
```

This is fine but subtle — the reset logic is co-located with the save logic in the same effect, which is easy to misread. Consider splitting into two effects or a comment.

### L3 — Pool tile `meaning` field is labeled "Vietnamese meaning (tooltip)" in comment but never rendered as a tooltip

`pool-grid.tsx` uses `title={tile.meaning}` which gives a browser native tooltip. Fine, but the comment in `kanji-drop-types.ts` says "tooltip" — consistent enough, just verify that's the intended UX on mobile (native tooltips don't appear on touch).

### L4 — CSS `kd-btn-icon` uses non-standard `border: none` then has `border: 1px solid` two lines later

```css
.kd-btn-icon {
  ...
  border: 1px solid rgba(255,255,255,0.1);
  ...
  padding: 0.5rem; border-radius: 8px; cursor: pointer;  /* border: none removed? */
}
```

No actual `border: none` in this rule — fine, just the shared `.kd-btn { border: none }` is overridden by `.kd-btn-icon`. Works correctly but the cascade is implicit.

---

## Positive Observations

- **Pure engine pattern** (`kanji-drop-engine.ts`) — all game logic is side-effect-free and unit-testable. Excellent separation.
- **Seeded RNG** (mulberry32 + Fisher-Yates) — reproducible seeds, correct implementation.
- **No XSS risk** — all kanji characters rendered as text content inside controlled React elements, no `dangerouslySetInnerHTML`.
- **Error boundaries** already exist at hub level — kanji-drop failures are contained.
- **localStorage wrapped in try/catch** — resilient to private browsing / quota errors.
- **Cascade termination is correct** under normal operation — `reflow` is idempotent when no runs remain, so convergence is guaranteed assuming `scanRuns` is correct (which it is).
- **TypeScript: 0 errors** — fully typed, no `any`, no casts.
- **CSS scoped with `kd-` prefix** — no global pollution.
- **Lazy import in game-hub** follows existing pattern exactly.
- **Consistent dark glassmorphism theme** matching project design guidelines.

---

## Recommended Actions

1. **(H1)** Add `MAX_CASCADE` guard in `cascadeClear` — 5-line fix, prevents freeze if engine regresses.
2. **(H2)** Move `nextLevel` game-state reads into the `setGameState(prev => ...)` setter to avoid stale closure dependency.
3. **(M7)** Move sound calls out of state updater function — call them via `useEffect` on phase/score transitions.
4. **(M1)** Remove duplicate `KanjiDropPageProps` from `kanji-drop-types.ts` or re-export from page; keep single source of truth.
5. **(M2)** Restrict `index.ts` barrel — don't re-export engine internals publicly.
6. **(M5)** Move `assignPowerUps` to module scope.
7. **(M3)** Remove the invalid eslint-disable comment in `tutorial-overlay.tsx`.
8. **(L1)** Remove `powerUpReward` from `LevelConfig` if it won't vary, or add variation.

---

## Metrics

- TypeScript errors: **0**
- Test coverage: N/A (no test files added — consistent with rest of codebase)
- Linting issues found manually: 2 (M3, M7)
- Security issues: **0**

---

## Unresolved Questions

- Is the level-gating in the start-level selector (M6) intentional product behavior or a placeholder? If players can unlock level 6 but can only jump to 1 or 5, that's a UX gap worth clarifying.
- Will `onSaveGameSession` ever be called on "next level" mid-run, or only on final result? Current impl saves only on first `result` phase entry, which may miss multi-level sessions if the host expects per-level data.
