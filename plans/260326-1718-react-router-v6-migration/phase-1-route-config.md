# Phase 1: Route Configuration Foundation

## Context

App.tsx (980 LOC) renders all 28+ pages via conditional `{currentPage === 'x' && <Page />}`. Navigation is a useState + 5 useEffects bridge in `use-app-navigation.ts`. We need to establish the router infrastructure without breaking existing functionality.

## Overview

Create `createBrowserRouter` config, shared layout component, and route guard. Swap `BrowserRouter` for `RouterProvider` in main.tsx. App.tsx temporarily becomes a catch-all route to preserve all existing behavior.

## Key Insights

- react-router-dom v7.13.2 already installed, supports createBrowserRouter
- BrowserRouter in main.tsx wraps App -- we replace this with RouterProvider
- App.tsx has 3 layers: `App > AppInner > AppContentWrapper > AppContent`
- Provider nesting order matters: UserData > FlashcardData > JLPT > Achievement > ReadingSettings > ListeningSettings > CenterProvider
- `canAccessPage()` in `src/utils/role-permissions.ts` already implements per-page role checks

## Requirements

1. Create router config with all 28 routes defined
2. Create `AppLayout` that wraps providers + sidebar + main content area
3. Create `ProtectedRoute` component using `canAccessPage()`
4. Replace BrowserRouter with RouterProvider in main.tsx
5. App.tsx renders as fallback catch-all (zero behavior change initially)

## Architecture

```
main.tsx
  RouterProvider(router)
    AppLayout (providers + sidebar + offline indicator + floating panels)
      Outlet
        / -> HomePage (still rendered by AppContent initially)
        /cards -> CardsPage
        ...etc
```

### New Files

```
src/router.tsx           -- createBrowserRouter config
src/components/layout/app-layout.tsx    -- shared layout with providers
src/components/layout/protected-route.tsx -- role-based route guard
```

### Modified Files

```
src/main.tsx             -- RouterProvider replaces BrowserRouter
src/App.tsx              -- temporary: rendered as element in catch-all route
```

## Related Files

- `src/routes.tsx` -- ROUTES and URL_TO_PAGE maps (keep as source of truth for paths)
- `src/hooks/use-app-navigation.ts` -- will be consumed until Phase 5
- `src/hooks/use-url-router.ts` -- center route parsing (keep until Phase 5)
- `src/utils/role-permissions.ts` -- canAccessPage() used by ProtectedRoute
- `src/components/layout/sidebar.tsx` -- will move into AppLayout
- `src/components/layout/header.tsx` -- Page type definition

## Implementation Steps

### Step 1: Create `src/router.tsx`

```tsx
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './components/layout/app-layout';
import { ProtectedRoute } from './components/layout/protected-route';

// Lazy page imports (moved from App.tsx eventually, but for now just route config)
const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      // Phase 1: single catch-all that renders existing AppContent
      { path: '*', lazy: () => import('./App').then(m => ({ Component: m.default })) },
    ],
  },
  // Center routes (keep separate for now)
  { path: '/center/:slug/*', lazy: () => import('./App').then(m => ({ Component: m.default })) },
]);

export { router };
```

**Key:** In Phase 1, ALL routes fall through to App.tsx. This is intentional -- zero behavior change.

### Step 2: Create `src/components/layout/app-layout.tsx`

Extract provider wrapping from App.tsx `AppInner` into layout:
- UserDataProvider (outermost)
- FlashcardDataProvider
- JLPTDataProvider
- AchievementProvider
- ReadingSettingsProvider
- ListeningSettingsProvider
- CenterProvider (conditional)
- Renders `<Outlet />`

### Step 3: Create `src/components/layout/protected-route.tsx`

```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useUserData } from '../../contexts/user-data-context';
import { canAccessPage } from '../../utils/role-permissions';

interface Props {
  page: string;
  redirectTo?: string;
}

export function ProtectedRoute({ page, redirectTo = '/' }: Props) {
  const { currentUser } = useUserData();
  if (!currentUser || !canAccessPage(page, currentUser.role)) {
    return <Navigate to={redirectTo} replace />;
  }
  return <Outlet />;
}
```

### Step 4: Update main.tsx

```tsx
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
```

### Step 5: Verify App.tsx still works

App.tsx internal logic unchanged. It now receives navigation from react-router context instead of BrowserRouter wrapper. The `useNavigate` and `useLocation` calls in `use-app-navigation.ts` continue to work because RouterProvider provides the same context.

## Todo

- [ ] Create `src/router.tsx`
- [ ] Create `src/components/layout/app-layout.tsx` (minimal -- just providers + Outlet)
- [ ] Create `src/components/layout/protected-route.tsx`
- [ ] Update `src/main.tsx` to use RouterProvider
- [ ] Verify all 28 pages still render correctly
- [ ] Verify game join QR codes still work
- [ ] Verify center routes still work
- [ ] Verify browser back/forward still works

## Success Criteria

- [ ] App boots with RouterProvider (no BrowserRouter)
- [ ] All existing pages render identically
- [ ] All URLs resolve correctly
- [ ] Browser back/forward works
- [ ] No console errors or warnings
- [ ] use-app-navigation.ts still functions (temporary)

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| RouterProvider breaks useNavigate in use-app-navigation | High | Low | RouterProvider provides same context as BrowserRouter |
| Center routes break | High | Low | Catch-all route handles them initially |
| Provider ordering changes cause data issues | High | Low | Keep exact same nesting order |

## Security

- No auth changes in this phase
- ProtectedRoute created but not yet wired to actual routes
- Existing inline `canAccessPage()` checks remain in App.tsx

## Next Steps

Phase 2: Wire 10 easy pages as direct route elements, removing them from App.tsx conditional rendering.
