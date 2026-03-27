# Phase 3: App.tsx Decomposition

## Context
- [Main Plan](./plan.md)
- **Date:** 2026-03-26
- **Priority:** HIGH | **Risk:** MEDIUM | **Status:** NOT STARTED

## Overview
Decompose App.tsx (1058 LOC) into focused modules. Target: App.tsx < 200 LOC. Extract state management, provider tree, and page router into separate files.

## Key Insights
- AppContent has 11 useState + 4 context hooks destructuring 110+ properties
- Lines 294-404: pure context destructuring (110 lines of boilerplate)
- Lines 455-516: derived state, hooks, computed values
- Lines 518-1054: JSX render with 30+ conditional page renders
- HomePage receives 21+ props because App acts as prop-drilling hub
- Pages like ListeningPracticePage, ConjugationTrainerPage already take zero props (context-based)
- Pattern: pages that consume context directly need zero App-level wiring

## Requirements
1. Extract `use-app-navigation.ts` - all navigation state + URL sync effects
2. Extract `app-providers.tsx` - the 6-level deep provider nesting tree
3. Extract `app-router.tsx` - the 30+ conditional page renders
4. Extract `app-global-ui.tsx` - floating buttons, achievement overlays, search, modals
5. App.tsx becomes thin orchestrator < 200 LOC
6. Zero prop signature changes on any page component

## Architecture

### New files
```
src/hooks/use-app-navigation.ts    # Navigation state, URL sync, game join params
src/components/app-providers.tsx    # Provider nesting tree
src/components/app-router.tsx       # Page switch/render logic
src/components/app-global-ui.tsx    # Floating chat, achievements, search, JLPT modal
```

### use-app-navigation hook
```ts
export function useAppNavigation() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [initialGameType, setInitialGameType] = useState<GameType | null>(null);
  const [initialGameJoinCode, setInitialGameJoinCode] = useState<string | null>(null);
  const [editingLectureId, setEditingLectureId] = useState<string | undefined>();
  const [editingLectureFolderId, setEditingLectureFolderId] = useState<string | undefined>();
  const [editingLectureLevel, setEditingLectureLevel] = useState<JLPTLevel | undefined>();
  // URL sync effects (lines 232-287)
  // Analytics tracking (line 290-292)
  // Returns: { currentPage, setCurrentPage, navigateTo, editLecture, ... }
}
```

### app-providers.tsx
Wraps children in: FlashcardDataProvider -> JLPTDataProvider -> AchievementProvider -> ReadingSettingsProvider -> ListeningSettingsProvider

### app-router.tsx
Takes navigation state + context data, renders correct page. This is where the 30+ `{currentPage === 'x' && <Page />}` blocks live.

### app-global-ui.tsx
Floating chat buttons, AI tutor panel, achievement toasts, JLPT level modal, GlobalSearch.

## Related Code Files
- `src/App.tsx` (1058 LOC - the target)
- `src/hooks/use-url-router.ts` (existing URL router)
- `src/routes.ts` (ROUTES, URL_TO_PAGE constants)
- `src/components/layout/sidebar.tsx`
- `src/components/layout/header.ts` (Page type)

## Implementation Steps

### Step 1: Extract use-app-navigation.ts
- Move 6 navigation-related useState from AppContent
- Move 4 useEffect blocks (URL sync, game join params, page reset on login)
- Move analytics tracking effect
- Keep same state names to avoid churn in router

### Step 2: Extract app-providers.tsx
- Move the provider nesting from AppInner (lines 169-184)
- Accept `levelFilter` and `currentUserId` as props
- Keep CenterProvider logic in AppContentWrapper (it's conditional)

### Step 3: Extract app-router.tsx
- Move all `{currentPage === 'x' && ...}` blocks (lines 550-958)
- Component receives navigation state + context data as props
- Wrap in ErrorBoundary + Suspense (already there)

### Step 4: Extract app-global-ui.tsx
- Move floating chat buttons (lines 964-1013)
- Move achievement system UI (lines 1016-1027)
- Move JLPT level modal (lines 1029-1041)
- Move GlobalSearch (lines 1043-1053)

### Step 5: Simplify AppContent
- AppContent becomes: call hooks -> render Sidebar + AppRouter + AppGlobalUI
- Target: ~150-200 LOC max
- Context destructuring stays in app-router.tsx (where it's used)

### Step 6: Consider migrating more pages to direct context consumption
- Pages already using zero props (ListeningPracticePage, ConjugationTrainerPage) are the model
- Long-term: HomePage, CardsPage, SettingsPage should consume contexts directly
- This phase: only extract, don't change page interfaces

## Todo
- [ ] Create `src/hooks/use-app-navigation.ts` with navigation state + effects
- [ ] Create `src/components/app-providers.tsx` with provider tree
- [ ] Create `src/components/app-router.tsx` with page switch logic
- [ ] Create `src/components/app-global-ui.tsx` with overlays/modals
- [ ] Refactor App.tsx to use extracted modules
- [ ] Verify App.tsx < 200 LOC
- [ ] Run full app test - every page must render correctly
- [ ] Verify URL navigation (back/forward) still works
- [ ] Verify QR code game join flow still works

## Success Criteria
- App.tsx < 200 LOC
- Each extracted file has single responsibility
- All 30+ pages render identically
- URL sync (browser back/forward) works
- QR code game join works
- No prop signature changes on any page component

## Risk Assessment
- **MEDIUM**: Touching central routing logic; any bug breaks all navigation
- Mitigation: extract one piece at a time, test after each extraction
- Keep old code commented until verified, then delete
- URL sync effects are timing-sensitive; preserve exact hook ordering

## Security Considerations
- canAccessPage checks must remain in router (not accidentally removed during extraction)
- Role-gated pages (branches, salary, permissions) must keep guards

## Next Steps
After App.tsx is clean, Phase 4 (component decomposition) tackles individual large components. Pages that still receive 20+ props from App are candidates for context migration in a future iteration.
