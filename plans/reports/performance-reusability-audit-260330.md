# Shinko Performance & Code Reusability Audit
**Date:** 2026-03-30 | **Baseline:** 2026-03-27 audit | **Scope:** Full codebase

---

## IMPLEMENTATION LOG (same session)

### Completed Fixes

| # | Fix | Files Changed |
|---|-----|---------------|
| 1 | **floating-chat-panel**: replaced 2s localStorage polling with `storage` event listener | 1 |
| 2 | **console.log leaks**: removed from `use-auth.ts:309` (username leak) and `quiz-battle-lobby.tsx:80` (debug) | 2 |
| 3 | **user-data-context**: removed redundant `isSuperAdmin`/`isVip`/`canAccessLocked` vars, computed inside useMemo | 1 |
| 4 | **JLPTLevel consolidation**: 7+ definitions → 1 canonical in `types/flashcard.ts`, others re-export | 8 |
| 5 | **KaiwaCharacter**: deleted local redefinition in `use-listening-audio-handlers.ts`, imports canonical type | 1 |
| 6 | **TabBar migration**: 6 components migrated (export-import-modal, friends-panel, kaiwa-stats-dashboard, notifications-page, cards-page, student-detail-modal) | 6 |
| 7 | **LevelBadge migration**: 8 components migrated (lecture-card, flashcard-list, daily-words-task, learning-path-widget, assign-test-modal, questions-view, topic-detail-view, grammar-card-list) | 8 |
| 8 | **AuthContext split**: Created `auth-context.tsx`, split from UserDataContext; 14 auth-only consumers migrated to `useAuthData()` | 16 |
| 9 | **quiz-battle-service**: Fixed `Partial<Record>` undefined access with proper defaults | 1 |
| 10 | **StatCard component**: Created shared `StatCard` + migrated 8 files (bingo results/manager, dictation, word-match results, kanji-battle results, pptx-import, export-import, attendance-panel) | 10 |
| 11 | **React.memo**: Wrapped 7 leaf components (FlashcardItem, EvaluationItem, KaiwaMessageItem, RankingsTable, PlayerListGrid, RacePlayerStats, SessionItem) — total now 9 (was 2) | 7 |

**Total files modified: ~61** | **tsc --noEmit: 0 errors** | **Pre-existing tsc -b errors: unchanged**

---

## Executive Summary

Since March 27: **2 issues fixed, 6 partially fixed, 5 still open, 8 new issues found.**

Key wins: NavigationContext memoized, Firebase chunk-separated, ModalShell adopted (50 consumers), `as any` lobby casts eliminated.
Key gaps: backdrop-filter (221), React.memo (2), god-context not split, TabBar/LevelBadge created but barely adopted (3 consumers each), JLPTLevel proliferation worsened (4 → 7+ defs).

---

## A. PERFORMANCE — Status Update

| ID | Issue | Status | Detail |
|----|-------|--------|--------|
| H1 | NavigationContext not memoized | **FIXED** | `useAppNavigation` returns `useMemo(...)` |
| H2 | UserDataContext unstable `auth` dep | **FIXED** | `useAuth()` now returns memoized object |
| H3 | 221 backdrop-filter (66 CSS files) | **OPEN** | Unchanged — GPU compositing concern on mobile |
| M1 | React.memo: only 2 components | **OPEN** | Still 2 — no new memoized components added |
| M3 | Inline array computations | **PARTIAL** | SmartDashboard fixed; sort/filter in render paths remain |
| M4 | 1,021 inline onClick arrows | **OPEN** | Unchanged |
| Bundle | Firebase 443KB in critical path | **FIXED** | Separated via vite.config.ts manualChunks |
| Bundle | index chunk 527KB | **LIKELY FIXED** | Firebase extracted; needs build to confirm |

### New Performance Issues

| ID | Severity | Issue | File |
|----|----------|-------|------|
| P-N1 | HIGH | `floating-chat-panel.tsx` polls localStorage every 2s, triggers re-render unconditionally | `src/components/common/floating-chat-panel.tsx:52-62` |
| P-N2 | MEDIUM | `isSuperAdmin`/`isVip`/`canAccessLocked` computed redundantly outside useMemo | `src/contexts/user-data-context.tsx:112` |
| P-N3 | MEDIUM | `useUserData()` consumed by 48 components (was 23) — any subscription update re-renders all | `src/contexts/user-data-context.tsx` |
| P-N4 | MEDIUM | Inline `.sort()` in render: waiting-room, player-leaderboard, submission-tracker, tests-tab | Multiple files |
| P-N5 | LOW | `console.log` in prod: `use-auth.ts:309` (leaks username), `quiz-battle-lobby.tsx:80` (debug) | 2 files |
| P-N6 | LOW | Router catch-all `path: '*'` → all pages through `AppContent`, no route-level splitting | `src/router.tsx` |
| P-N7 | LOW | VIP expiry check iterates all users on every `users` change | `src/hooks/use-auth.ts:295-321` |

### Current Performance Metrics

| Metric | Mar 27 | Mar 30 | Change |
|--------|--------|--------|--------|
| React.memo components | 2 | 2 | — |
| backdrop-filter | 221 | 221 | — |
| Inline onClick arrows | 1,021 | 1,021 | — |
| useMemo calls | — | 436 | +new |
| useCallback calls | — | 1,119 | +new |
| CSS !important | 129 | 129 | — |
| useUserData consumers | 23 | 48 | +108% |
| Firebase chunk-split | NO | YES | Fixed |
| NavigationContext memoized | NO | YES | Fixed |

---

## B. CODE REUSABILITY — Status Update

| ID | Issue | Status | Detail |
|----|-------|--------|--------|
| H1 | JLPTLevel 4 defs | **WORSE** | Now 7+ definitions |
| H2 | Tab pattern 14x duplicated | **PARTIAL** | TabBar created, 3/22 sites migrated |
| H3 | KaiwaCharacter local 3x | **PARTIAL** | 2/3 fixed; 1 remains + new TS2339 error |
| H4 | role-permissions save mock | **OPEN** | Unchanged |
| M1 | Stat widgets 374x | **OPEN** | 308 instances, no StatCard component |
| M2 | Level badge 15x | **PARTIAL** | LevelBadge created, 3/45 sites migrated |
| M3 | Game creation hooks 6 types | **WORSE** | Grew to 9 hooks (1,242 LOC total) |
| M4 | useUserData god-context | **PARTIAL** | Memo fixed; split not done |
| M5 | `as any` 7 lobby components | **FIXED** | role added to BasePlayer |
| #10 | Modal shell 35+ files | **FIXED** | ModalShell at 50 consumers |
| #11 | EmptyState 36x | **PARTIAL** | 39 consumers; 27 raw patterns remain |
| #12 | Search 80+ | **PARTIAL** | SearchInput at 9 consumers; ~70 raw remain |
| #13 | Button CSS 20+ files | **OPEN** | No Button component; 115 CSS files |

### Shared Component Adoption

| Component | Consumers | Coverage |
|-----------|-----------|----------|
| ModalShell | 50 | Strong |
| EmptyState | 39 | Good (58% migrated) |
| SearchInput | 9 | Low (~11%) |
| TabBar | 3 | Very low (14%) |
| LevelBadge | 3 | Very low (7%) |
| StatCard | 0 | Not created |
| Button | 0 | Not created |

### New Reusability Issues

| ID | Severity | Issue | Impact |
|----|----------|-------|--------|
| R-N1 | HIGH | JLPTLevel proliferated to 7+ defs + JLPTLevelOption/Key aliases | Blocks type safety across domains |
| R-N2 | HIGH | 94 instances of paired `loading/error useState` — no `useAsync<T>` hook | ~300 LOC extractable |
| R-N3 | MEDIUM | KaiwaCharacter fix incomplete: `use-listening-audio-handlers.ts:9` + new TS2339 | 4 active TS errors |
| R-N4 | MEDIUM | Tab patterns grew 14 → 22 sites (TabBar not adopted) | 180 LOC wasted |
| R-N5 | LOW | Game creation hooks grew 6 → 9 (no generic `useCreateGame<T>`) | 1,242 LOC of near-identical code |

### TypeScript Health

| Metric | Mar 27 | Mar 30 | Change |
|--------|--------|--------|--------|
| `tsc -b` errors | 103 | 96 | -7 |
| Files with errors | 40 | ~37 | -3 |

---

## C. PRIORITIZED ACTION PLAN

### Immediate (bug fixes, < 1 hour each)

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 1 | Fix `use-listening-audio-handlers.ts` — delete local KaiwaCharacter, fix `useKaiwaCharacters` API | Eliminates 4 TS errors | 30m |
| 2 | Remove `console.log` from `use-auth.ts:309` and `quiz-battle-lobby.tsx:80` | Security (username leak) | 10m |
| 3 | Fix `floating-chat-panel.tsx` — replace 2s polling with `storage` event listener | Stops unnecessary re-renders | 30m |
| 4 | Remove duplicate `isSuperAdmin`/`isVip`/`canAccessLocked` vars in `user-data-context.tsx` | Cleaner code, minor perf | 15m |

### Short-term (1-2 weeks, high ROI)

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 5 | **Consolidate JLPTLevel** to single canonical `src/types/shared.ts` | Fixes 3+ TS errors, blocks divergence | 1h |
| 6 | **Complete TabBar migration** (19 remaining sites) | ~180 LOC reduction, CSS consolidation | 3h |
| 7 | **Complete LevelBadge migration** (42 remaining sites) | ~150 LOC reduction, 9 CSS class names → 1 | 3h |
| 8 | **Complete SearchInput migration** (~70 remaining sites) | ~500 LOC reduction | 4h |
| 9 | **Extract `useAsync<T>` hook** for loading/error patterns | ~300 LOC reduction across 94 sites | 2h |
| 10 | **Split UserDataContext** → AuthContext + SocialContext | Halves re-render surface for 48 consumers | 4h |

### Medium-term (sprint)

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 11 | Extract `<StatCard>` component | ~400 LOC reduction (308 instances) | 3h |
| 12 | Extract `<Button>` component + consolidate CSS | ~2,000 LOC CSS reduction | 8h |
| 13 | Generic `useCreateGame<T>` hook | ~800 LOC reduction (9 hooks → 1 + wrappers) | 6h |
| 14 | Reduce backdrop-filter: replace on non-overlay elements with solid bg | GPU perf on mobile | 8h |
| 15 | Add `React.memo` to list item leaf components | Prevents cascade re-renders | 4h |
| 16 | Migrate to direct React Router routes (Phase 2-4) | Route-level code splitting | 16h |

### Estimated Total Impact

| Category | Metric |
|----------|--------|
| LOC reduction | ~4,500+ (shared components + hooks) |
| TS errors fixed | ~10-15 (type consolidation + interface fixes) |
| CSS class consolidation | ~25 class names → 3 components |
| Re-render reduction | ~50% for auth-only consumers (context split) |
| GPU perf improvement | Significant on mobile (backdrop-filter audit) |

---

## D. POSITIVE OBSERVATIONS

- ModalShell adoption is excellent (50 consumers) — proves shared component strategy works
- Firebase properly chunk-separated — initial load significantly improved
- Navigation context memoization fixed — sidebar no longer cascades 9 page re-renders
- `useAuth()` correctly memoized now — stable reference chain
- Zero `console.log` policy mostly enforced (only 2 leaks found)
- All Firebase onSnapshot subscriptions properly cleaned up — no listener leaks
- All setInterval/addEventListener calls have proper cleanup in useEffect returns
- Kanji data correctly lazy-loaded (523KB only on kanji page visit)

---

## E. UNRESOLVED QUESTIONS

1. Actual built chunk sizes post-Firebase extraction? Need `npm run build` output to confirm
2. `floating-chat-panel` localStorage polling — is cross-tab sync intentional? Determines fix approach
3. `role-permissions-page` save mock — known deferred feature or regression?
4. Phase 2-4 Router migration — is there an active plan?
5. `react-hooks/set-state-in-effect` ESLint rule in 20+ suppressions — does this rule actually exist?
