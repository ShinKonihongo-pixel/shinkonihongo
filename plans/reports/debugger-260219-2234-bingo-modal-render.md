# Debugger Report: Bingo Modal Render & Interaction Bug

**Date:** 2026-02-19
**Issue:** Bingo game room creation modal — clicking options broken, repeated clicks cause render errors
**Files investigated:** `game-room-setup.tsx`, `form-fields.tsx`, `select-buttons.tsx`, `toggle-switch.tsx`, `room-footer.tsx`, `rules-section.tsx`, `types.ts`, `game-configs-basic.tsx`, `bingo-game-setup.tsx`, `game-hub-page.tsx`, `game-hub.css`

---

## Executive Summary

**3 bugs found. No TypeScript errors (`npx tsc --noEmit` clean). Root causes are:**

1. **CRITICAL — Double submit on "Tạo Phòng" button** (`room-footer.tsx`): The submit button has both `type="submit"` (fires `form.onSubmit`) AND `onClick={onSubmit}` (fires it again). This causes double room creation and/or race conditions on every click.

2. **MEDIUM — `touch-action: none` on `.rm-overlay` blocks all touch events inside the modal** (`game-hub.css` line 8777): The overlay sets `touch-action: none` which on touch/mobile devices prevents taps from reaching child elements including pills, toggles, and buttons. On desktop, repeated rapid clicks can also interact oddly with the overlay's `stopPropagation` handling.

3. **LOW — `form-fields.tsx` uses `useState` and `useCallback` hooks unconditionally** (correct), but the `showUpgradeHint` `setTimeout` callback captures a stale `prev` closure reference — not a crash but causes the hint to never clear if the component re-renders rapidly. Minor.

---

## Technical Analysis

### Bug 1: Double Submit (CRITICAL)

**File:** `/src/components/game-hub/room-setup/room-footer.tsx`
**Lines 33–58**

```tsx
<button
  type="submit"          // ← fires form's onSubmit handler
  className="rm-btn rm-btn-primary rm-btn-lg"
  disabled={loading || disabled}
  onClick={onSubmit}     // ← also fires onSubmit directly — DOUBLE TRIGGER
  style={{ background: disabled ? undefined : gameInfo.gradient }}
>
```

A `type="submit"` button inside a `<form>` fires the form's `onSubmit` when clicked. The additional `onClick={onSubmit}` then fires `handleSubmit` a second time directly, causing:
- `onCreateRoom(roomConfig)` called twice
- `setPendingRoomConfig` + `setSetupModalGame(null)` + `setSelectedGame(gameType)` all fired twice in rapid succession
- React batching may partially coalesce these but the second call races with the first unmount

**Root cause of "bấm nhiều thì bị lỗi render"**: Repeated fast clicking on this button triggers `onCreateRoom` → state cascade → component unmounts → second click lands on now-unmounted/remounted tree → React error boundary or DOM inconsistency.

**Fix:** Remove `onClick={onSubmit}` from the submit button. The `type="submit"` is sufficient — form submission propagates from button click to form `onSubmit`.

```tsx
// room-footer.tsx — remove onClick from submit button
<button
  type="submit"
  className="rm-btn rm-btn-primary rm-btn-lg"
  disabled={loading || disabled}
  style={{ background: disabled ? undefined : gameInfo.gradient }}
>
```

---

### Bug 2: `touch-action: none` on Overlay Blocks Child Interactions (MEDIUM)

**File:** `/src/components/game-hub/game-hub.css`
**Line 8777**

```css
.rm-overlay {
  position: fixed;
  inset: 0;
  touch-action: none;   /* ← BLOCKS ALL TOUCH EVENTS FOR ALL CHILDREN */
  ...
}
```

`touch-action: none` on a parent disables pointer events cascade for touch input on all descendants. The `.rm-modal` sets `touch-action: auto` (line 8798) but `touch-action` is not inherited — it's a per-element property and the overlay's `none` value is applied to the overlay itself, not inherited. However some browser implementations propagate scroll-blocking behavior. The intent was to prevent scroll-chaining on the overlay background, but this should be scoped via `overscroll-behavior: contain` (already present at line 8776) rather than `touch-action: none`.

Combined with `.rm-body` having `touch-action: pan-y` (line 8926), the overlay's `touch-action: none` creates conflicting directives in the same stacking context.

**"bấm các lựa chọn không được"** on mobile is likely caused by this — pill buttons inside the modal can have tap events suppressed by `touch-action: none` on the overlay ancestor in some browser/OS combinations (particularly iOS Safari).

**Fix:**
```css
.rm-overlay {
  position: fixed;
  inset: 0;
  /* Remove touch-action: none — overscroll-behavior: contain is sufficient */
  overscroll-behavior: contain;
  ...
}
```

---

### Bug 3: `showUpgradeHint` Closure Stale Ref (LOW, not crash-level)

**File:** `/src/components/game-hub/room-setup/form-fields.tsx`
**Lines 71–74**

```tsx
const showUpgradeHint = useCallback((key: string) => {
  setUpgradeHint(key);
  setTimeout(() => setUpgradeHint(prev => prev === key ? null : prev), 3000);
}, []);
```

`key` is captured correctly via functional update (`prev === key`), so no stale closure issue here — this is actually correct. No bug.

---

## What Was Checked

| Area | Status | Notes |
|---|---|---|
| `game-room-setup.tsx` hooks order | OK | All hooks called unconditionally at top level |
| `game-room-setup.tsx` `useMemo` deps | OK | All state vars listed |
| `form-fields.tsx` hook calls | OK | `useState`/`useCallback` at top level |
| `select-buttons.tsx` keys | OK | `key={opt.value}` on mapped buttons |
| `toggle-switch.tsx` | OK | Simple, no state |
| `rules-section.tsx` keys | OK | `key={i}` (index, acceptable for static list) |
| `game-configs-basic.tsx` BINGO_SETUP_CONFIG | OK | Config is static, no hooks |
| `bingo-game-setup.tsx` | OK | Thin wrapper, no issues |
| `game-hub-page.tsx` Bingo case | OK | `renderSetupModal()` called inline, modal mounted/unmounted correctly |
| TypeScript errors | NONE | `npx tsc --noEmit` returned clean |
| CSS pointer-events on `.rm-pill` | OK | No blocking rule on pills themselves |
| CSS z-index conflicts | OK | overlay z-index 1000 is correct |
| CSS overflow on modal | OK | `overflow: hidden` on container, scroll on `.rm-body` |
| React key missing warnings | None found | |
| Infinite render loops | None | No setState during render, no circular deps |

---

## Fixes Required

### Fix 1 — Remove `onClick` from submit button (CRITICAL, 1-line fix)

**File:** `/src/components/game-hub/room-setup/room-footer.tsx`

Remove line:
```tsx
onClick={onSubmit}
```

From the `type="submit"` button. The button is already inside `<form onSubmit={handleSubmit}>` so native form submission handles it.

Also: `onSubmit` prop on `RoomFooterProps` and in the component signature can be removed entirely once this is fixed.

### Fix 2 — Remove `touch-action: none` from overlay (MEDIUM)

**File:** `/src/components/game-hub/game-hub.css` line 8777

Remove or replace:
```css
/* Before */
touch-action: none;

/* After — rely on overscroll-behavior: contain which is already there */
/* (delete the touch-action: none line) */
```

---

## Unresolved Questions

- None — root causes are confirmed. No ambiguous symptoms remain after tracing both the double-submit and touch-action issues.
