# Code Review: Quiz Game Result Screens

**Date:** 2026-03-25
**Files reviewed:** 4 (3 TSX + CSS new classes)

---

## Scope

- `src/components/quiz-game/play/game-answer-reveal.tsx` (183 lines)
- `src/components/quiz-game/play/game-leaderboard.tsx` (119 lines)
- `src/components/quiz-game/game-results.tsx` (183 lines)
- `src/components/quiz-game/quiz-game.css` — new classes: `gr-distribution`, `gr-my-wrong`, `gl-pod-avatar`, `gl-my-rank`, `results-personal`, `results-confetti`, `results-rank-avatar`, `results-podium-avatar`

**Review focus:** Recent changes only
**TypeScript compile:** Clean (0 errors)
**Updated plans:** none (no plan file provided)

---

## Overall Assessment

Solid refactor overall. New classes are all defined and used correctly. TypeScript is clean. The main issues are a division-by-zero on the stats bar, an icon-index inconsistency between the two podium implementations, and an orphan CSS class.

---

## Critical Issues

None.

---

## High Priority Findings

### 1. Division by zero — `gr-stats-bar` (game-answer-reveal.tsx:113)

```tsx
// sortedPlayers.length could be 0 (spectator-only scenario or edge case)
style={{ width: `${(correctCount / sortedPlayers.length) * 100}%` }}
```

The `distribution` calculation at line 48 guards for this (`sortedPlayers.length > 0 ? ... : 0`) but the stats bar at line 113 does not. Result: `NaN%` width, causing the fill bar to disappear silently.

**Fix:**
```tsx
style={{ width: `${sortedPlayers.length > 0 ? (correctCount / sortedPlayers.length) * 100 : 0}%` }}
```

### 2. Icon index inconsistency between podium components

`game-leaderboard.tsx` line 54 uses `PODIUM_ICONS[actualRank]` (correct: rank-based index).
`game-results.tsx` line 65 uses `podiumIcons[displayIdx]` (incorrect: display-order index).

`podiumOrder` is `[top3[1], top3[0], top3[2]]` — display order is `[2nd, 1st, 3rd]`.
`podiumIcons` is `[Medal, Crown, Award]`.

So `displayIdx=0` → Medal for the 2nd-place player, `displayIdx=1` → Crown for 1st-place. This happens to produce the correct visual, BUT it's semantically wrong and will break if `podiumOrder` or `podiumIcons` order ever changes. The leaderboard's approach (using `actualRank`) is the correct pattern.

**Fix in `game-results.tsx`:**
```tsx
const Icon = podiumIcons[actualRank]; // not [displayIdx]
const iconSize = podiumSizes[actualRank]; // not [displayIdx]
```

---

## Medium Priority Improvements

### 3. `medalClass` targets a legacy CSS context (game-results.tsx:68, 73)

```tsx
const medalClass = actualRank === 0 ? 'crown' : actualRank === 1 ? 'medal silver' : 'medal bronze';
// Applied as: <Icon ... className={medalClass} />
```

The CSS rules `.medal.silver` and `.medal.bronze` are defined inside `.podium-player` scope (line 1307–1322), which is a **different/older podium component**, not `.results-podium-place`. The new `.results-podium-avatar` and `.results-podium-player` CSS have no `.crown`, `.medal`, `.medal.silver`, or `.medal.bronze` rules.

Result: `medalClass` is applied to the Lucide SVG icon but has no effect in the new `results-*` CSS context. The icon color/style comes only from the `gl-pod.first/second/third` color inheritance, which works, but `medalClass` is dead weight here.

**Options:** Either remove `medalClass` entirely (colors already work via parent class), or add explicit rules to `.results-podium-place .crown`, `.results-podium-place .medal` in the new CSS block.

### 4. Orphan CSS class: `.results-my-rank` (quiz-game.css:4181–4190)

`.results-my-rank` is defined in the CSS but not used anywhere in `game-results.tsx`. The component uses `.results-personal` with a `#{myRank}` badge for this purpose. The old `.results-my-rank` block (10 lines) is dead CSS.

### 5. Hardcoded `revealTimer / 5` magic number

Both `game-answer-reveal.tsx:169` and `game-leaderboard.tsx:105` use `revealTimer / 5` to compute progress bar fill. The `5` is the reveal duration in seconds, but it's a magic number with no constant or comment. If the reveal duration ever changes, both occurrences need updating.

**Minor suggestion:** Extract as a prop (e.g. `revealDuration`) or at minimum add a comment.

---

## Low Priority Suggestions

### 6. Non-null assertion without guard (game-answer-reveal.tsx:79–83)

```tsx
{isCorrect && myResult!.scoreChange > 0 && (
{isCorrect && myResult!.answerTime && (
```

`isCorrect` is `myResult?.answeredCorrectly`, so if `myResult` is `undefined`, `isCorrect` is `undefined` (falsy). The `!` assertions are therefore safe at runtime, but are confusing — the reader has to reason through optional chaining + truthiness. More readable:

```tsx
{isCorrect && myResult && myResult.scoreChange > 0 && (
```

### 7. `podiumOrder` can include `undefined` slots with <3 players

`top3[1]` or `top3[2]` are `undefined` when fewer than 3 players exist. Both components handle this with `if (!player) return null` — correct. But `podiumOrder` is typed as `GamePlayer[]` implicitly, which TypeScript accepts because array indexing returns `T`, not `T | undefined` without `noUncheckedIndexedAccess`. No current crash risk, but worth noting.

### 8. `game-results-screen` has `overflow-y: auto` but `game-fullscreen` has `overflow: hidden`

`game-fullscreen` sets `overflow: hidden` at line 79. `game-results-screen` overrides with `overflow-y: auto` at line 4046. This works, but the override pattern is implicit. Worth a comment like `/* overrides game-fullscreen overflow: hidden — results screen needs scroll */`.

---

## Positive Observations

- All 8 requested CSS classes are properly defined and used — no missing definitions.
- New `.gr-distribution` section with animated bars is clean and well-structured.
- `gr-my-wrong` / `gr-my-wrong-box` properly guarded with `showMyWrongAnswer` null check (lines 52–53).
- `gl-my-rank` callout for players outside top-3 is a UX improvement, correctly gated on `myRank > 3 && currentPlayer`.
- `results-confetti` CSS-only animation with `--i` CSS custom property is a lightweight, no-JS approach — good.
- `results-personal` card degrades gracefully: shows reduced stats when `gameResults` is null (lines 119–127).
- No unused imports in any of the 3 files.
- Consistent use of `aria-hidden="true"` on confetti decorative element.
- `gl-rest` rows reuse `gr-rank-row` shared CSS correctly — DRY.
- TypeScript compiles clean.

---

## Recommended Actions

1. **(High)** Fix division-by-zero on `gr-stats-bar` fill — add `sortedPlayers.length > 0` guard.
2. **(High)** Fix `game-results.tsx` podium icon/size lookup to use `actualRank` not `displayIdx` — align with leaderboard's pattern.
3. **(Medium)** Remove dead `.results-my-rank` CSS block (10 lines).
4. **(Medium)** Resolve `medalClass` in `game-results.tsx` — either remove it or add matching CSS rules in the `results-podium-*` context.
5. **(Low)** Replace `/ 5` magic numbers with a named constant or comment.
6. **(Low)** Replace `myResult!` non-null assertions with `myResult &&` guards for readability.

---

## Metrics

- Type Coverage: TypeScript compiles clean, no errors
- Linting Issues: 0 (tsc clean)
- Orphan CSS classes: 1 (`.results-my-rank`)
- Dead code: `medalClass` variable — applied but has no effect in new CSS context
- Division-by-zero risk: 1 location

---

## Unresolved Questions

- Is there a game scenario where `sortedPlayers` is empty during answer reveal? (spectator-only games, bot games?) — determines urgency of issue #1.
- Is `revealTimer` always 5s or can it be configured? — determines whether the hardcoded `/ 5` is a real issue.
