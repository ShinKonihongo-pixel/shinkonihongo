# Shinko Component Redesign Plan

**Goal:** Eliminate App.tsx God Component (980 LOC) by migrating to React Router v6 with direct context consumption per page.

**Current:** App.tsx -> providers -> AppContent (consumes ALL contexts) -> conditional page rendering + prop drilling
**Target:** App.tsx -> providers -> React Router `<Outlet />` -> each page consumes contexts directly

## Phase Summary

| Phase | Focus | Pages | Priority | Est. Effort | Status |
|-------|-------|-------|----------|-------------|--------|
| [1](./phase-1-foundation.md) | Foundation: AppLayout + shared hooks + router shell | 0 | P0 | 1-2 days | **Done** |
| [2](./phase-2-easy-migrations.md) | Easy pages: existing contexts only | 12 | P1 | 2-3 days | **Done** |
| [3](./phase-3-medium-migrations.md) | Medium pages: minor hook extraction | 8 | P1 | 2-3 days | **Done** |
| [4](./phase-4-heavy-migrations.md) | Heavy pages: CardsPage + SettingsPage | 2 | P2 | 3-4 days | **Done** |
| [5](./phase-5-cleanup-split.md) | Large file splitting + perf review | ~16 files | P2 | 3-4 days | **Done** |

## Key Constraints
- Incremental: app works after each phase
- Files < 200 LOC, kebab-case, plain CSS imports
- YAGNI / KISS / DRY
- No functional regressions

## Architecture Decisions
- **Invert the pattern**: pages consume contexts directly (hooks) instead of receiving props
- **AppLayout** wraps all providers + sidebar + floating panels
- **router.tsx** becomes single source of truth for all routes
- **useLessonFiltering** extracted from App.tsx for shared use by 4+ pages

## Dependencies
- Phase 1 blocks all others
- Phase 2-3 can partially overlap once AppLayout is stable
- Phase 4 depends on Phase 2-3 patterns being proven
- Phase 5 independent (can run anytime after Phase 2)

## Success Metric
- App.tsx < 50 LOC (just providers + `<RouterProvider />`)
- Zero prop drilling from App to pages
- All 30+ pages route-based via router.tsx

## Scout Reports
- [Page Dependencies](./scout/scout-01-page-dependencies.md)
- [Prop Migration Analysis](./scout/scout-02-prop-migration-analysis.md)
