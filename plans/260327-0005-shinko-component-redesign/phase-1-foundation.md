# Phase 1: Foundation -- AppLayout + Shared Hooks + Router Shell

**Priority:** P0 (blocks all other phases)
**Estimated effort:** 1-2 days

## Context
- [plan.md](./plan.md) | [scout-01](./scout/scout-01-page-dependencies.md) | [scout-02](./scout/scout-02-prop-migration-analysis.md)
- Current: `App.tsx` (980 LOC) = providers + AppInner + AppContentWrapper + AppContent
- Target: `App.tsx` (~30 LOC) = providers + `<RouterProvider />`

## Overview

Extract the foundation layer that all future page migrations depend on:
1. Expand `AppLayout` from stub to full provider+chrome wrapper
2. Extract `useLessonFiltering` hook from App.tsx (used by 4 pages)
3. Move all lazy imports + routes to `router.tsx`
4. Reduce `App.tsx` to minimal routing shell

## Key Insights

- `AppLayout` already exists at `src/components/layout/app-layout.tsx` (17 LOC stub, only wraps UserDataProvider)
- `useAppNavigation` already extracted to `src/hooks/use-app-navigation.ts` (135 LOC)
- `routes.tsx` already maps all 30+ pages to URL paths
- Provider nesting order matters: `UserData -> FlashcardData(levelFilter) -> JLPTData(userId, levelFilter) -> Achievement -> ReadingSettings -> ListeningSettings`
- `FlashcardDataProvider` and `JLPTDataProvider` need `currentUser` for `levelFilter` -- they must be inside a component that reads UserData context

## Requirements

1. **useLessonFiltering hook** -- extract filtered lesson logic
2. **AppLayout** -- full provider tree + sidebar + floating panels + offline indicator
3. **router.tsx** -- all routes defined as children of AppLayout layout route
4. **App.tsx** -- reduced to `<RouterProvider router={router} />`
5. **Center routing** -- preserve `/center/:slug` handling

## Architecture

```
// New structure
App.tsx
  └── <RouterProvider router={router} />

router.tsx
  └── AppLayout (layout route)
        ├── / -> HomePage
        ├── /cards -> CardsPage
        ├── /study -> StudyPage
        ├── ... (all 30+ routes)
        └── /center/:slug/* -> CenterRouter

AppLayout
  └── UserDataProvider
        └── AuthGate (login check)
              └── FlashcardDataProvider(levelFilter)
                    └── JLPTDataProvider(userId, levelFilter)
                          └── AchievementProvider
                                └── ReadingSettingsProvider
                                      └── ListeningSettingsProvider
                                            └── AppChrome (sidebar, floating panels, offline)
                                                  └── <Outlet />
```

## Related Code Files

| File | Role | Action |
|------|------|--------|
| `src/App.tsx` | God component (980 LOC) | Reduce to ~30 LOC |
| `src/router.tsx` | 5 routes only | Expand to all 30+ routes |
| `src/components/layout/app-layout.tsx` | Stub (17 LOC) | Expand to full layout |
| `src/hooks/use-app-navigation.ts` | Nav state (135 LOC) | Keep, used by AppLayout |
| `src/hooks/use-url-router.ts` | Center URL parsing | Move to center route loader |
| `src/routes.tsx` | URL<->Page mapping (42 LOC) | Keep as reference |
| `src/contexts/user-data-context.tsx` | Auth + user data | No change |
| `src/contexts/flashcard-data-context.tsx` | Flashcard data | No change |
| `src/contexts/jlpt-data-context.tsx` | JLPT data | No change |
| `src/contexts/achievement-context.tsx` | Achievements | No change |

## Implementation Steps

### Step 1: Create `useLessonFiltering` hook
**File:** `src/hooks/use-lesson-filtering.ts` (NEW, ~50 LOC)

Extract from App.tsx lines 398-428:
- `filteredGetLessonsByLevel(level)` -- filters hidden/locked lessons
- `filteredGetChildLessons(parentId)` -- same filtering for child lessons
- Inputs: `getLessonsByLevel`, `getChildLessons`, `canAccessLocked`, `isSuperAdmin`, `currentUserId`
- Returns: `{ filteredGetLessonsByLevel, filteredGetChildLessons }`

### Step 2: Create `AuthGate` component
**File:** `src/components/layout/auth-gate.tsx` (NEW, ~60 LOC)

Handles pre-auth states currently in AppInner (lines 89-159):
- Login page if not logged in
- Center router for non-app center routes
- Center loading/error states
- JLPT level modal on first login

### Step 3: Create `AppChrome` component
**File:** `src/components/layout/app-chrome.tsx` (NEW, ~80 LOC)

Extract from AppContent (lines 449-976):
- Sidebar with nav
- OfflineIndicator
- Floating chat buttons/panels (AI tutor + user chat)
- Achievement system UI (toast, celebration, showcase)
- Global search (Cmd+K)
- JLPT level modal
- `<Outlet />` for page content

### Step 4: Expand `AppLayout`
**File:** `src/components/layout/app-layout.tsx` (MODIFY)

Wire up the full provider tree:
```tsx
export function AppLayout() {
  return (
    <UserDataProvider>
      <AuthGate>
        <DataProviders>
          <AppChrome>
            <Outlet />
          </AppChrome>
        </DataProviders>
      </AuthGate>
    </UserDataProvider>
  );
}
```

`DataProviders` component (~30 LOC): wraps FlashcardData + JLPTData + Achievement + ReadingSettings + ListeningSettings. Reads `currentUser` from UserDataContext to compute `levelFilter`.

### Step 5: Migrate all routes to `router.tsx`
**File:** `src/router.tsx` (MODIFY)

- Move all 30+ lazy imports from App.tsx
- Define all routes as children of AppLayout layout route
- **Critical:** Pages still receive props in Phase 1 via a bridge component
- Use `element: <BridgePage />` pattern where BridgePage reads contexts and passes props (temporary, removed in Phase 2-4)

Alternative (simpler): Keep AppContent's conditional rendering inside `<Outlet />` for Phase 1, just move the provider shell to AppLayout. Pages migrate to individual routes incrementally in Phase 2-4.

**Recommended approach:** The simpler alternative. Phase 1 focuses on:
- Moving providers to AppLayout
- Moving sidebar/chrome to AppChrome
- Keeping AppContent as a catch-all route that still does conditional rendering
- Each subsequent phase removes pages from AppContent and adds them as individual routes

### Step 6: Reduce `App.tsx`
**File:** `src/App.tsx` (MODIFY -> ~30 LOC)

```tsx
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

function App() {
  return <RouterProvider router={router} />;
}
export default App;
```

### Step 7: Verify & test
- All pages render correctly
- URL navigation works (forward, back, deep link)
- Center routes still work
- Floating panels still work
- Login/logout flow preserved
- Game join via QR code URL params preserved

## Todo

- [ ] Create `src/hooks/use-lesson-filtering.ts`
- [ ] Create `src/components/layout/auth-gate.tsx`
- [ ] Create `src/components/layout/app-chrome.tsx`
- [ ] Expand `src/components/layout/app-layout.tsx`
- [ ] Update `src/router.tsx` with layout route + catch-all
- [ ] Reduce `src/App.tsx` to routing shell
- [ ] Verify center routing works
- [ ] Verify game join URL params work
- [ ] Run `npm run lint` and `npm run test:run`
- [ ] Manual smoke test all major pages

## Success Criteria

- [ ] App.tsx < 50 LOC
- [ ] All providers in AppLayout, not App.tsx
- [ ] Sidebar/chrome in AppChrome, not AppContent
- [ ] `useLessonFiltering` hook extracted and reusable
- [ ] All existing pages still render (no regressions)
- [ ] URL navigation works both directions (URL->page, page->URL)
- [ ] Offline indicator, floating panels, achievement UI still work

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Provider ordering breaks data flow | HIGH | Test each provider removal from App.tsx individually |
| Center routing breaks | MEDIUM | Preserve useUrlRouter logic exactly |
| useAppNavigation breaks with Outlet | MEDIUM | Keep as-is in Phase 1; refactor in Phase 2+ |
| Game join URL params lost | LOW | Test QR code flow explicitly |

## Security Considerations
- `canAccessPage()` checks must be preserved in route guards or page-level checks
- No new auth surfaces introduced
- Center role checks must remain intact

## Next Steps
After Phase 1, begin [Phase 2](./phase-2-easy-migrations.md) -- migrate easy pages (zero-new-context) to individual routes with direct context consumption.
