# Phase 5: Cleanup

## Context

All 28 pages migrated to router. App.tsx no longer renders pages conditionally. Dead code remains: `use-app-navigation.ts`, `use-url-router.ts`, and `currentPage` state management. Center routes still use pushState-based router.

## Overview

Delete dead code, integrate center routes into createBrowserRouter config, slim App.tsx to <200 LOC (providers + layout shell only), and clean up ROUTES map.

## Key Insights

- `use-app-navigation.ts` manages `currentPage` state + URL bridge -- completely replaced by router
- `use-url-router.ts` parses `/center/:slug/*` paths via pushState -- replaceable by nested route
- `Page` type in header.tsx still used by sidebar/header for active state -- replace with `useLocation()` + ROUTES reverse lookup
- `ROUTES` and `URL_TO_PAGE` in routes.tsx can become the single source of truth for route paths
- Sidebar active state detection: `URL_TO_PAGE[location.pathname]` instead of `currentPage` prop

## Requirements

1. Delete `src/hooks/use-app-navigation.ts`
2. Delete `src/hooks/use-url-router.ts`
3. Integrate center routes (`/center/:slug`, `/center/:slug/join`, `/center/:slug/app/*`) into router
4. App.tsx becomes providers + layout shell (<200 LOC)
5. Sidebar/Header detect active page from URL, not prop
6. Remove `Page` type from header.tsx (or keep as derived from ROUTES keys)
7. Clean up unused imports across all files

## Architecture

### Final App Structure

```
main.tsx
  RouterProvider(router)

router.tsx
  createBrowserRouter([
    // Center routes (public)
    { path: '/center/:slug', element: <CenterLandingPage /> },
    { path: '/center/:slug/join', element: <CenterJoinPage /> },
    { path: '/center/:slug/join/:code', element: <CenterJoinPage /> },

    // Auth gate
    {
      element: <AuthGate />,  // redirects to /login if not authenticated
      children: [
        // Center app routes
        {
          path: '/center/:slug/app',
          element: <CenterAppLayout />,
          children: [
            { path: 'members', lazy: () => ... },
            { path: 'dashboard', lazy: () => ... },
          ],
        },

        // Main app layout
        {
          element: <AppLayout />,  // sidebar + providers + outlet
          children: [
            { path: '/', lazy: () => ... },
            { path: '/cards', element: <ProtectedRoute page="cards" />, children: [...] },
            // ... all 28 routes
          ],
        },
      ],
    },

    // Public routes
    { path: '/login', element: <LoginPage /> },
  ])
```

### Files to Delete

```
src/hooks/use-app-navigation.ts
src/hooks/use-url-router.ts
```

### Files to Significantly Modify

```
src/App.tsx              -- reduce to <200 LOC, just providers + Outlet
src/router.tsx           -- final route config with center routes
src/components/layout/sidebar.tsx -- active page from useLocation()
src/components/layout/header.tsx  -- active page from useLocation()
src/routes.tsx           -- possibly simplify (router.tsx is source of truth for structure)
```

## Related Files

- `src/components/center/center-router.tsx` -- currently handles center public/join pages, integrate into router
- `src/contexts/*` -- providers may move into AppLayout
- `src/components/common/global-search.tsx` -- receives `onNavigate`, switch to useNavigate()
- `src/components/common/floating-chat-panel.tsx` -- no changes needed
- `src/components/achievements/*` -- global UI, stays in AppLayout

## Implementation Steps

### Step 1: Integrate center routes into router

Replace `use-url-router.ts` + CenterRouter with proper nested routes:

```tsx
// Center public routes
{ path: '/center/:slug', lazy: () => import('./components/center/center-landing') },
{ path: '/center/:slug/join/:code?', lazy: () => import('./components/center/center-join') },

// Center app routes (nested inside auth gate)
{
  path: '/center/:slug/app',
  element: <CenterAppLayout />,
  children: [
    { index: true, lazy: () => import('./components/pages/center-dashboard-page') },
    { path: 'members', lazy: () => import('./components/pages/center-members-page') },
  ],
}
```

CenterAppLayout wraps CenterProvider (loads center data, checks membership).

### Step 2: Create AuthGate layout route

```tsx
function AuthGate() {
  const { isLoggedIn } = useUserData();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <Outlet />;
}
```

### Step 3: Move LoginPage to its own route

Currently rendered inline in AppInner when `!isLoggedIn`. Move to `/login` route.

### Step 4: Slim App.tsx

App.tsx becomes:
```tsx
// App.tsx - Provider shell only
function App() {
  return (
    <UserDataProvider>
      <Outlet />
    </UserDataProvider>
  );
}
```

Or even simpler: providers move into AppLayout, and `App` component is eliminated entirely (router.tsx defines everything).

### Step 5: Update Sidebar active page detection

```tsx
const location = useLocation();
const activePage = URL_TO_PAGE[location.pathname] || 'home';
```

Remove `currentPage` and `onNavigate` props from Sidebar.

### Step 6: Update Header active page detection

Same pattern as Sidebar. Remove `currentPage` prop.

### Step 7: Update GlobalSearch onNavigate

Replace `onNavigate` prop with `useNavigate()` inside GlobalSearch:
```tsx
const navigate = useNavigate();
// ... navigate(ROUTES[page])
```

### Step 8: Delete dead files

```bash
rm src/hooks/use-app-navigation.ts
rm src/hooks/use-url-router.ts
```

### Step 9: Clean up routes.tsx

ROUTES map still useful as path constants. URL_TO_PAGE still useful for reverse lookup. Keep both but ensure they're derived from router config or kept in sync.

### Step 10: Remove unused imports from all modified files

Run `npx tsc --noEmit` and fix any import errors.

## Todo

- [ ] Integrate center routes into router.tsx
- [ ] Create AuthGate layout route
- [ ] Move LoginPage to /login route
- [ ] Slim App.tsx to <200 LOC
- [ ] Update Sidebar -- remove currentPage/onNavigate props, use useLocation()
- [ ] Update Header -- remove currentPage prop, use useLocation()
- [ ] Update GlobalSearch -- remove onNavigate prop, use useNavigate()
- [ ] Delete use-app-navigation.ts
- [ ] Delete use-url-router.ts
- [ ] Clean up unused imports (tsc --noEmit)
- [ ] Verify center public landing page works
- [ ] Verify center join flow works
- [ ] Verify center app member/dashboard routes work
- [ ] Verify login redirect works
- [ ] Full regression test of all 28 pages
- [ ] Test deep linking for all routes
- [ ] Test browser back/forward across all transitions

## Success Criteria

- [ ] App.tsx < 200 LOC
- [ ] use-app-navigation.ts deleted
- [ ] use-url-router.ts deleted
- [ ] Zero `currentPage` state anywhere
- [ ] Center routes in router config (no pushState)
- [ ] Sidebar/Header use useLocation() for active page
- [ ] GlobalSearch uses useNavigate()
- [ ] `npx tsc --noEmit` passes
- [ ] All 28 routes + center routes work via direct URL
- [ ] Login redirect works for unauthenticated users

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Center route integration breaks center features | High | Medium | Test center landing, join, app flows carefully |
| LoginPage as route breaks auth flow | High | Low | AuthGate redirects to /login, login redirects back to / |
| Sidebar active detection breaks for nested routes | Medium | Medium | Use startsWith() for nested paths like /center/:slug/app/* |
| ROUTES map out of sync with router config | Low | Medium | Consider generating ROUTES from router config |

## Security

- AuthGate enforces authentication at route level (stronger than current inline check)
- ProtectedRoute enforces role-based access (already established in Phase 1)
- Login page accessible without auth (public route)
- Center public routes accessible without auth (public routes)
- Center app routes require auth (nested under AuthGate)

## Next Steps

Migration complete. Post-migration improvements (optional, not in scope):
- Route-level error boundaries
- Route loaders for data prefetching
- Breadcrumb generation from route config
- Route-based analytics (replace manual trackPageView)
- Route transition animations
