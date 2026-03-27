# React Router v6 Migration Plan - Shinko

## Status: PLANNED
## Created: 2026-03-26
## Estimated effort: 5 phases, ~3-4 days

---

## Problem Statement

App.tsx is a 980-line monolith that acts as a manual router via `currentPage` state + conditional rendering. A custom URL bridge (`use-app-navigation.ts`) syncs state<->URL with 5 useEffects. Center routes use a separate pushState-based router (`use-url-router.ts`). This creates:

- Prop drilling hell (CardsPage: 29 props, SettingsPage: ~20, HomePage: 21)
- No code-level route protection (all pages rendered inside single component)
- URL state is second-class citizen, synced after the fact
- No route-level code splitting benefit (all lazy imports in one file)
- ~50 inline closures capturing `currentUser.id` in App.tsx

## Key Constraint

**react-router-dom v7.13.2 is already installed.** This is v7 (backward-compatible with v6 API). We use `createBrowserRouter` + `RouterProvider` which are stable in v7.

## Architecture Decision

**createBrowserRouter + RouterProvider** pattern (data router) because:
1. Supports route-level loaders/actions (future benefit)
2. Route guards via layout routes
3. Eliminates manual URL<->state bridge entirely
4. Each page component owns its data via context hooks

## Migration Strategy

Incremental, 5 phases. Each phase produces a working app. No big-bang rewrite.

### Phase Overview

| Phase | Scope | Risk | Files Changed |
|-------|-------|------|---------------|
| 1 | Route config + layout foundation | Low | DONE (edc4c15) |
| 2 | Migrate 10 easy pages (0-3 props) | Low | 12 modified |
| 3 | Migrate 8 medium pages (4-8 props) | Medium | 10 modified |
| 4 | Migrate 3 hard pages (21-29 props) | High | 6 modified, 3 new hooks |
| 5 | Cleanup dead code + center route integration | Low | 5 deleted, 3 modified |

### Page Classification

**Easy (Phase 2):** ConjugationTrainer, PronunciationPractice, ListeningPractice, ChatPage, ClassroomPage, CenterMembers, CenterDashboard, Pricing, RolePermissions, MyTeaching

**Medium (Phase 3):** StudyPage, GrammarStudyPage, KanjiStudyPage, ReadingPracticePage, ExercisePage, ProgressPage, GameHubPage, NotificationsPage

**Hard (Phase 4):** HomePage (21 props), SettingsPage (~20 props), CardsPage (29 props)

### Dual-System Coexistence

During phases 1-4, both systems run simultaneously:
- Router handles migrated pages
- App.tsx conditional rendering handles remaining pages
- `currentPage` state still exists but shrinks each phase

## Detailed Phase Plans

See individual phase files:
- [Phase 1: Route Configuration Foundation](./phase-1-route-config.md)
- [Phase 2: Migrate Easy Pages](./phase-2-easy-pages.md)
- [Phase 3: Migrate Medium Pages](./phase-3-medium-pages.md)
- [Phase 4: Migrate Hard Pages](./phase-4-hard-pages.md)
- [Phase 5: Cleanup](./phase-5-cleanup.md)

## Success Criteria (Overall)

- [ ] App.tsx reduced from 980 LOC to <200 LOC (providers + layout only)
- [ ] All 28 routes defined in createBrowserRouter config
- [ ] Zero `currentPage` state or conditional page rendering
- [ ] use-app-navigation.ts deleted
- [ ] use-url-router.ts deleted (center routes in router config)
- [ ] All existing URLs still work (no breaking changes)
- [ ] Game join QR codes (?join, ?racing, etc.) still work
- [ ] Role-based access enforced at route level
- [ ] All pages lazy-loaded at route level
- [ ] No prop drilling through App.tsx for navigation callbacks

## Unresolved Questions

1. **Analytics tracking** -- currently `trackPageView(currentPage)` fires on state change. With router, should we use a `<RouteChangeTracker>` component or route loader? Recommend: layout route effect.
2. **Center app routing** -- `use-url-router.ts` uses raw pushState. Should center routes be nested under `/center/:slug/*` in the router, or kept separate? Recommend: integrate into router as nested route.
3. **Onboarding tour** -- `setShowOnboarding(true)` is passed as prop to HomePage. Where does this state live post-migration? Recommend: dedicated context or URL search param.
4. **JLPT level modal** -- triggered globally on first login. Should remain in layout route or move to a route-level component? Recommend: keep in layout (it's truly global).
