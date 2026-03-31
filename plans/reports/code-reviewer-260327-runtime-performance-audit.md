# Runtime Performance Audit

**Date:** 2026-03-27
**Scope:** Context re-renders, memoization, Firebase queries, CSS performance
**Files analyzed:** ~15 context/hook files, ~40 service files, CSS corpus

---

## Overall Assessment

The app has good architectural bones but contains one real re-render cascade (NavigationContext), a useMemo dependency bug in UserDataContext that may silently defeat memoization, near-zero React.memo coverage, and 221 backdrop-filter declarations which will strain compositing on mid-range devices. Firebase subscription cleanup is solid. There are no N+1 query patterns detected.

---

## Critical Issues

None — no data loss or security issues.

---

## High Priority Findings

### H1 — NavigationContext value is never memoized
**File:** `src/contexts/navigation-context.tsx`
**Impact:** Every consumer re-renders on every `sidebarCollapsed`, `isChatOpen`, `isAiChatOpen`, `isSearchOpen`, `currentPage`, etc. state change. Consumers include: `app-chrome.tsx`, `app-content.tsx`, `home-page.tsx`, `game-hub-page.tsx`, `settings-page-refactored.tsx`, `lecture-editor/index.tsx`, `center-dashboard-page.tsx`, `lecture-page.tsx`, `cards-page.tsx`.

```tsx
// Current — returns raw hook object every render
export function NavigationProvider({ children }) {
  const nav = useAppNavigation();
  return <NavigationContext.Provider value={nav}>{children}</NavigationContext.Provider>;
}
```

`useAppNavigation` returns a plain object literal at line 123 — new reference every render. Opening/closing the sidebar causes all 9 page consumers to re-render.

**Fix — two options:**

Option A (preferred): Memoize in provider
```tsx
import { useMemo } from 'react';

export function NavigationProvider({ children }) {
  const nav = useAppNavigation();
  const value = useMemo(() => nav, [
    nav.currentPage, nav.sidebarCollapsed, nav.isChatOpen,
    nav.isAiChatOpen, nav.isSearchOpen, nav.initialGameType,
    nav.initialGameJoinCode, nav.editingLectureId,
    nav.editingLectureFolderId, nav.editingLectureLevel,
  ]);
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}
```

Option B (scalable): Split into two contexts — `NavigationStateContext` (read values) and `NavigationActionsContext` (stable setters). Setters from `useState` are already stable, so the actions context never re-renders consumers.

---

### H2 — UserDataContext useMemo dep on `auth` is an unstable object reference
**File:** `src/contexts/user-data-context.tsx` lines 174–185
**File:** `src/hooks/use-auth.ts` line 323

`useAuth()` returns a plain `{ currentUser, users, ... }` object literal — new reference every render. The `useMemo` at line 116 lists `auth` as a dependency:

```tsx
const value = useMemo<UserDataContextValue>(() => ({ ... }), [
  auth,          // ← new object every render → useMemo never hits cache
  userHistory,
  friendships,
  ...
]);
```

This means `useMemo` recalculates on every render of `UserDataProvider`, defeating its purpose entirely and re-rendering all `useUserData()` consumers on any state update anywhere in the provider tree.

**Fix:** Destructure stable primitives/callbacks from each hook and list those as deps, or memoize the return of each sub-hook.

```tsx
// In use-auth.ts — wrap return in useMemo
return useMemo(() => ({
  currentUser, users, loading, ...stableCallbacks
}), [currentUser, users, loading]);
```

Same issue likely exists for `userHistory`, `friendships`, `badges`, etc. — all return plain object literals.

---

### H3 — 221 backdrop-filter declarations across 66 CSS files
**Measurement:** 221 occurrences in 66 files

`backdrop-filter: blur()` triggers a new GPU compositing layer per element. Having this on cards, modals, sidebars, dropdowns simultaneously means dozens of compositing layers active at once. On iOS Safari and mid-range Android this causes jank and high GPU memory.

**Specific concern:** If quiz-game lobby or JLPT practice screens stack multiple `.glass`-style elements with backdrop-filter simultaneously, this will be perceptible.

**Fix:** Audit active simultaneous elements — not total count. Replace backdrop-filter on non-overlay elements (list cards, tab bars) with `background: rgba(...)` solid fallback. Reserve backdrop-filter for true overlay modals/drawers only.

---

## Medium Priority Findings

### M1 — React.memo usage: 2 out of entire codebase
**Measurement:** Only 2 components use `React.memo` or `memo()`
**Files:** `src/components/home/daily-words-task.tsx`, `src/components/pages/grammar-study/grammar-card.tsx`

Heavy list-rendering components with no memo protection:
- Quiz game player grid (re-renders on every player state change during live game)
- `game-lobby.tsx` — has good `useMemo`/`useCallback` internally but the component itself isn't memoized
- JLPT question lists
- Flashcard card components in study views

Given issues H1 and H2 above cause frequent parent re-renders, child components will cascade unless memoized.

**Fix:** Add `React.memo` to leaf components that receive stable props and render lists — flashcard items, player cards, question list items. This is high-leverage only after fixing H1/H2 first.

---

### M2 — 129 CSS `!important` declarations
**Measurement:** 129 occurrences

Not a runtime perf issue per se, but indicates specificity wars forcing browser to re-evaluate cascades. Concentrated from prior CSS-loading bug fixes (per project memory). No immediate action needed but should decrease over time.

---

### M3 — Inline array computations without useMemo in render path
**File examples:**
- `src/components/pages/lecture/levels-view.tsx` line 23–27: `.filter()` called in render function body for level counts
- `src/components/pages/settings/flashcard-settings-background.tsx` line 32: `.filter().map()` chain in JSX

These are low-frequency renders (settings pages, lecture level display) — not hot paths. Medium priority, not urgent.

---

### M4 — 1,021 inline `onClick={() =>}` arrow functions
**Measurement:** 1,021 occurrences in `src/components/`

This is only a real problem when these are passed as props to `React.memo`-wrapped children (new function reference breaks memo). Since memo usage is near-zero (H3), these cause no additional re-renders beyond normal. After adding memo coverage, these will need `useCallback` wrapping for memoized children.

---

## Low Priority Suggestions

### L1 — Image lazy loading: 43 images with `loading="lazy"`, no count of images without it
43 images use lazy loading. Unclear how many `<img>` tags exist without it. Not audited further.

### L2 — 12 base64 inline images
12 `data:image` references in TSX/CSS files. Acceptable unless they are large (>5KB each). No action needed unless bundle size analysis shows them as significant.

### L3 — filter and box-shadow: 1,924 declarations
High but spread across entire CSS corpus. Individual elements are fine; the concern is cumulative compositing (see H3 for backdrop-filter specifically).

---

## Positive Observations

- **FlashcardDataContext** and **JLPTDataContext**: Both use the correct composition pattern (nested sub-contexts with domain isolation). `useFlashcardData()` aggregate hook uses `useMemo` properly.
- **Firebase subscription cleanup**: All hooks using `subscribeToX()` functions properly return `() => unsubscribe()` from `useEffect`. No listener leaks detected.
- **No N+1 query patterns**: Service-layer Firestore queries are batch/collection queries, not per-document loops.
- **game-lobby.tsx**: Well-optimized internally — `useMemo`, `useCallback` used throughout, player data derived in single memoized block.
- **onSnapshot isolation**: All real-time listeners live in services layer returning `Unsubscribe`, consumed cleanly by hooks. Good separation.
- **Code splitting**: Routes are lazy-loaded (Vite + React.lazy). Good baseline load performance.

---

## Recommended Actions (Prioritized)

1. **Fix H2 first**: Memoize return values of `useAuth`, `useUserHistory`, `useFriendships`, `useBadges` etc. with `useMemo`. This fixes the UserDataContext memoization being silently broken and stops re-renders for all auth consumers.

2. **Fix H1**: Add `useMemo` to `NavigationProvider` value, or split into state/actions contexts. Prevents sidebar toggle from re-rendering 9 page-level components.

3. **Address H3 (backdrop-filter)**: Audit which elements use it simultaneously in the quiz game and JLPT screens. Remove from list/card items; keep only for modals and drawers.

4. **Add React.memo to list item leaf components** after fixing H1/H2 — player card, flashcard item, question list row. Wrapping children before fixing parent cascade is premature.

5. **Add `useCallback` to frequently-passed handlers** in components that will be memoized (step 4 dependency).

---

## Metrics

| Metric | Value |
|--------|-------|
| React.memo usage | 2 components |
| Inline onClick arrows | 1,021 |
| backdrop-filter declarations | 221 (in 66 files) |
| CSS !important | 129 |
| filter + box-shadow declarations | 1,924 |
| base64 images | 12 |
| lazy-loaded images | 43 |
| Firebase onSnapshot calls | 282 total (all in services layer) |
| Unsubscribed listener leaks | 0 detected |
| N+1 query patterns | 0 detected |

---

## Unresolved Questions

1. Does `useUserHistory`, `useBadges`, `useGameInvitations`, `useClassroomNotifications`, `useFriendNotifications` also return unstable plain object literals? If yes, H2 severity is higher — every one of those hook renders invalidates the entire UserDataContext memo.
2. How many `<img>` elements exist without `loading="lazy"`? Not counted.
3. Are backdrop-filter elements stacked simultaneously in quiz game lobby (e.g. player cards + modal + sidebar all at once)? Needs visual profiling to confirm H3 impact.
