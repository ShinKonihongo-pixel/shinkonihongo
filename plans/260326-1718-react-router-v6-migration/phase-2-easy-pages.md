# Phase 2: Migrate Easy Pages (10 pages, 0-3 props)

## Context

Phase 1 established RouterProvider + AppLayout. All routes still fall through to App.tsx catch-all. Now we extract 10 simple pages that need zero or minimal props into direct route elements.

## Overview

Move 10 pages from App.tsx conditional rendering into router config as direct route elements. These pages either take no props or only consume contexts directly. Remove their `{currentPage === 'x' && ...}` blocks from App.tsx.

## Key Insights

- These 10 pages need 0-3 props, most of which come from contexts
- Pages that take `currentUser` can call `useUserData()` directly
- Pages that take `users` can call `useUserData().users`
- `canAccessPage` guards move to `ProtectedRoute` wrapper in router config
- Game join query params (?join, ?racing, ?golden-bell, ?picture-guess) need a route loader or component-level parsing

## Requirements

1. Each page renders as a route element in router config
2. Protected pages wrapped in ProtectedRoute
3. Pages consume contexts directly (no prop drilling)
4. Removed pages no longer render from App.tsx
5. Game join QR codes still redirect to game-hub

## Architecture

### Pages to Migrate

| Page | Current Props | Migration Notes |
|------|--------------|-----------------|
| ConjugationTrainerPage | 0 | Direct route, no changes |
| PronunciationPracticePage | 0 | Direct route, no changes |
| ListeningPracticePage | 0 | Direct route, no changes |
| MyTeachingPage | 0 | ProtectedRoute('my-teaching') |
| RolePermissionsPage | 0 | ProtectedRoute('permissions') |
| ChatPage | currentUser | useUserData() inside component |
| ClassroomPage | users | useUserData() inside component |
| CenterMembersPage | users | useUserData() inside component |
| CenterDashboardPage | currentUser, users, onNavigate | useUserData() + useNavigate() |
| PricingPage | isVip, onUpgrade | useUserData().canAccessLocked + useNavigate() |

### Router Config Update

```tsx
// In src/router.tsx children array:
{ path: '/conjugation', lazy: () => import('./components/pages/conjugation-trainer-page') },
{ path: '/pronunciation', lazy: () => import('./components/pages/pronunciation-practice-page') },
{ path: '/listening', lazy: () => import('./components/pages/audio-player-page/index') },
{ path: '/chat', lazy: () => import('./components/pages/chat-page') },
{ path: '/classroom', lazy: () => import('./components/pages/classroom-page') },
{ path: '/center-app/members', lazy: () => import('./components/pages/center-members-page') },
{ path: '/center-app/dashboard', lazy: () => import('./components/pages/center-dashboard-page') },
{ path: '/pricing', lazy: () => import('./components/pages/pricing-page') },
{
  element: <ProtectedRoute page="my-teaching" />,
  children: [
    { path: '/my-teaching', lazy: () => import('./components/pages/my-teaching-page') },
  ],
},
{
  element: <ProtectedRoute page="permissions" />,
  children: [
    { path: '/admin/permissions', lazy: () => import('./components/pages/role-permissions-page') },
  ],
},
```

## Related Files

- `src/router.tsx` -- add route entries
- `src/App.tsx` -- remove 10 conditional blocks (~60 LOC removed)
- `src/components/pages/chat-page.tsx` -- remove currentUser prop, use context
- `src/components/pages/classroom-page.tsx` -- remove users prop, use context
- `src/components/pages/center-members-page.tsx` -- remove users prop, use context
- `src/components/pages/center-dashboard-page.tsx` -- remove props, use context + useNavigate
- `src/components/pages/pricing-page.tsx` -- remove props, use context + useNavigate

## Implementation Steps

### Step 1: Update router.tsx with 10 route entries

Add lazy route entries for all 10 pages. Use ProtectedRoute for my-teaching and permissions.

### Step 2: Modify 5 page components to consume contexts

Pages that currently receive props need refactoring:

**ChatPage:** Remove `currentUser` prop, add `const { currentUser } = useUserData()` inside.

**ClassroomPage:** Remove `users` prop, add `const { users } = useUserData()` inside.

**CenterMembersPage:** Remove `users` prop, add `const { users } = useUserData()` inside.

**CenterDashboardPage:** Remove `currentUser, users, onNavigate` props. Use `useUserData()` + `useNavigate()`. Replace `onNavigate('page')` with `navigate(ROUTES['page'])`.

**PricingPage:** Remove `isVip, onUpgrade` props. Use `useUserData().canAccessLocked` for isVip. Use `useNavigate()` + `navigate('/settings')` for onUpgrade.

### Step 3: Remove 10 conditional blocks from App.tsx

Delete the `{currentPage === 'x' && (...)}` blocks for all 10 pages. Keep lazy imports temporarily (tree-shaking will remove unused ones).

### Step 4: Handle game join query params

Add a route for the root path that checks query params:

```tsx
// In router.tsx - index route with loader
{
  path: '/',
  loader: ({ request }) => {
    const url = new URL(request.url);
    const join = url.searchParams.get('join');
    const racing = url.searchParams.get('racing');
    // ... redirect to /games with state if join code present
    return null;
  },
  // Falls through to AppContent catch-all
}
```

### Step 5: Test all 10 pages

Verify each page loads via direct URL navigation and via sidebar clicks.

## Todo

- [ ] Add 10 route entries to router.tsx
- [ ] Refactor ChatPage -- remove currentUser prop
- [ ] Refactor ClassroomPage -- remove users prop
- [ ] Refactor CenterMembersPage -- remove users prop
- [ ] Refactor CenterDashboardPage -- remove 3 props
- [ ] Refactor PricingPage -- remove 2 props
- [ ] Remove 10 conditional blocks from App.tsx
- [ ] Handle game join QR param redirect
- [ ] Verify sidebar navigation works for migrated pages
- [ ] Verify direct URL access works for all 10 pages
- [ ] Verify ProtectedRoute blocks unauthorized access

## Success Criteria

- [ ] 10 pages render via router (not App.tsx conditionals)
- [ ] App.tsx reduced by ~60 LOC
- [ ] Protected pages (my-teaching, permissions) redirect unauthorized users
- [ ] No prop drilling for migrated pages
- [ ] Game join QR codes still work
- [ ] Sidebar navigation works for both migrated and non-migrated pages

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Sidebar uses setCurrentPage, not navigate() | High | High | Update Sidebar to use useNavigate() for migrated pages, keep setCurrentPage for others |
| CenterDashboard onNavigate breaks | Medium | Medium | Replace with useNavigate + ROUTES map |
| Dual routing (router + currentPage) causes confusion | Medium | Medium | Clear comments marking temporary dual system |

## Security

- ProtectedRoute enforces role checks for my-teaching and permissions
- All other pages require authentication (enforced by AppLayout login gate)
- No new auth surfaces introduced

## Next Steps

Phase 3: Migrate 8 medium-complexity pages that need minor refactoring (replace onGoHome/onNavigate with useNavigate).
