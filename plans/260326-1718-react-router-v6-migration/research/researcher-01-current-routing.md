# Current Routing Architecture Analysis
**Date:** 2026-03-26 | **Version:** React Router v7.13.2

## Executive Summary
App uses **v7.13.2** (already v6+) with **manual URL↔state bridges** instead of native routing. Two distinct routing subsystems: main app (Page-based) + center paths (custom pushState). Migration opportunity: migrate to declarative route config.

## Current State
### Routes Count
**28 main routes** mapped in `src/routes.tsx`:
- Home, cards, study, settings, jlpt, chat, kaiwa, lectures, lecture-editor, progress, classroom
- Admin: branches, teachers, salary, permissions, analytics
- Teaching: my-teaching, notifications
- Games: game-hub
- Study pages: listening, grammar-study, reading, exercises, kanji-study
- Center app: center-members, center-dashboard
- Other: pricing, conjugation, pronunciation

### Current Architecture

#### BrowserRouter Setup (main.tsx)
```tsx
<BrowserRouter>
  <App />
</BrowserRouter>
```
- Standard React Router wrapper
- No custom history or route config
- **Gap:** No native `<Routes>`, `<Route>` elements

#### URL↔State Bridge (use-app-navigation.ts)
**Problem:** Routing is manual state management, not declarative:
- **State → URL:** `useEffect([currentPage])` calls `navigate(ROUTES[currentPage])`
- **URL → State:** `useEffect([location.pathname])` calls `setCurrentPage(URL_TO_PAGE[path])`
- **Query params:** Parsed manually (`new URLSearchParams`) for game joins (join, racing, golden-bell, picture-guess)

**Issues:**
- Extra re-render cycles (state change → effect → navigate → location change → effect → setCurrentPage)
- Type safety via `Page` union type, but no validation
- No deep linking safeguards

#### Center Routes (use-url-router.ts)
**Parallel custom router** for `/center/:slug` patterns:
- Direct `window.history.pushState()` (bypasses React Router)
- Parses paths: `/center/:slug` (landing), `/center/:slug/join/:code` (invite), `/center/:slug/app` (app)
- Returns parsed state object (centerSlug, isPublicLanding, isJoinPage, inviteCode, isCenterApp)
- Intentionally separate from main app routing

**Problem:** Two routing systems = harder to maintain, no shared layer.

## Migration Strategy (Outline)

### Phase 1: Route Config Declaration
Replace manual ROUTES/URL_TO_PAGE maps with declarative config:
```tsx
const routes = [
  { path: '/', element: <HomePage />, handle: { page: 'home' } },
  { path: '/cards', element: <CardsPage />, handle: { page: 'cards' } },
  // ... 28 total
];
```

### Phase 2: Remove Manual Bridges
- Delete `useAppNavigation` URL↔state effects
- Use `useParams()`, `useSearchParams()` directly in pages
- Replace `setCurrentPage()` with `navigate()`

### Phase 3: Center Routes Integration
Option A: Merge into main `<Routes>` config with dynamic segment matching
Option B: Keep separate, but use React Router's `<BrowserRouter>` events

### Phase 4: Type Safety
- Use `RouteHandle` interface for page metadata
- Leverage TypeScript union types for path params

## Current Dependencies
- **react-router-dom:** ^7.13.2 ✅ (v7 is v6+ compatible, already modern)
- **React:** ^19.2.0
- **TypeScript:** ~5.9.3

## Key Metrics
- **Total routes:** 28
- **Layers:** 2 (main app + center)
- **Manual state bridges:** 2 (use-app-navigation effects)
- **Query param parsing:** 4 game types (hardcoded in effect)

## Unresolved Questions
1. Is center routing intentionally separate, or should it merge into main `<Routes>`?
2. Should game join codes be moved to route params or stay as query strings?
3. Is `currentPage` state used elsewhere beyond navigation, or can it be fully replaced?
