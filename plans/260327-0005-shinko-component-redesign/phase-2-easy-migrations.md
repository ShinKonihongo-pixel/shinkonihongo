# Phase 2: Easy Page Migrations (Existing Contexts Only)

**Priority:** P1
**Estimated effort:** 2-3 days
**Depends on:** Phase 1 complete

## Context
- [plan.md](./plan.md) | [Phase 1](./phase-1-foundation.md)
- These pages need ONLY existing context hooks (no new hooks to create)
- Pattern: remove props from page component, add `useXxxData()` calls inside page

## Overview

Migrate 12 pages that can consume all their data from existing contexts. Each page becomes a standalone route in router.tsx with zero props.

## Pages to Migrate (ordered by complexity)

| # | Page | Current Props | Context Needed | Complexity |
|---|------|---------------|----------------|------------|
| 1 | NotificationsPage | 7 | useUserData | EASY |
| 2 | GrammarStudyPage | 7 | useFlashcardData + useSettings | EASY |
| 3 | KanjiStudyPage | 6 | useFlashcardData | EASY |
| 4 | ReadingPracticePage | 5 | useFlashcardData | EASY |
| 5 | ExercisePage | 3 | useFlashcardData | EASY |
| 6 | JLPTPage | 2 | useJLPTData + useUserData | EASY |
| 7 | ProgressPage | 3 | useUserData + useProgress | EASY |
| 8 | StudyPage | 7 | useFlashcardData + useSettings + useUserData | EASY |
| 9 | LecturePage | 1 | useAppNavigation | EASY |
| 10 | AnalyticsDashboardPage | 7 | useUserData + useFlashcardData | EASY |
| 11 | PricingPage | 2 | useUserData + useAppNavigation | EASY |
| 12 | BranchManagementPage | 1 (users) | useUserData | EASY |

## Key Insights

- All 12 pages already have the data available in contexts; App.tsx just extracts and passes it as props
- `onGoHome` / `onNavigate` callbacks replaced with `useNavigate()` from react-router-dom
- `settings` prop replaced with `useSettings()` hook call inside page
- `onSaveStudySession` etc. replaced with direct `useUserData()` call
- `filteredGetLessonsByLevel` needs `useLessonFiltering()` hook (created in Phase 1)

## Requirements

1. Each page becomes zero-prop (or minimal internal-only props)
2. Each page gets its own route in router.tsx
3. Remove page from AppContent conditional rendering
4. Navigation uses `useNavigate()` instead of `setCurrentPage()`
5. Role-based access preserved via route guard or page-level check

## Architecture

Per-page migration pattern:
```tsx
// BEFORE (in App.tsx AppContent)
{currentPage === 'grammar-study' && (
  <GrammarStudyPage
    grammarCards={grammarCards}
    lessons={grammarLessons}
    getLessonsByLevel={getGrammarLessonsByLevel}
    getChildLessons={getGrammarChildLessons}
    onGoHome={() => setCurrentPage('home')}
    settings={settings}
    onUpdateGrammarCard={updateGrammarCard}
  />
)}

// AFTER (inside grammar-study-page.tsx)
export function GrammarStudyPage() {
  const { grammarCards, grammarLessons, getGrammarLessonsByLevel, getGrammarChildLessons, updateGrammarCard } = useFlashcardData();
  const { settings } = useSettings();
  const navigate = useNavigate();
  // ... rest of component unchanged
}
```

## Related Code Files

| File | Action |
|------|--------|
| `src/components/pages/notifications-page.tsx` | Remove props, add useUserData() |
| `src/components/pages/grammar-study-page.tsx` | Remove props, add useFlashcardData() + useSettings() |
| `src/components/pages/kanji-study-page.tsx` | Remove props, add useFlashcardData() |
| `src/components/pages/reading-practice/index.tsx` | Remove props, add useFlashcardData() |
| `src/components/pages/exercise/index.tsx` | Remove props, add useFlashcardData() |
| `src/components/pages/jlpt/index.tsx` | Remove props, add useJLPTData() + useUserData() |
| `src/components/pages/progress-page.tsx` | Remove props, add useUserData() + useProgress() |
| `src/components/pages/study-page.tsx` | Remove props, add useFlashcardData() + useSettings() + useUserData() |
| `src/components/pages/lecture-page.tsx` | Remove prop, use useNavigate() |
| `src/components/pages/analytics-dashboard-page.tsx` | Remove props, add useUserData() + useFlashcardData() |
| `src/components/pages/pricing-page.tsx` | Remove props, use useUserData() + useNavigate() |
| `src/components/pages/branch-management-page.tsx` | Remove props, add useUserData() |
| `src/router.tsx` | Add 12 new routes |
| `src/App.tsx` (or AppContent) | Remove 12 conditional blocks |

## Implementation Steps

### Step 1: Migrate NotificationsPage (simplest, proves the pattern)
1. Open `notifications-page.tsx`
2. Replace `NotificationsPageProps` with zero props
3. Add `const { classroomNotifications, friendNotifications, markClassroomRead, markAllClassroomRead, markFriendRead, markAllFriendRead } = useUserData();`
4. Replace `onNavigate` prop with `const navigate = useNavigate();`
5. Add route to router.tsx: `{ path: '/notifications', element: <LazyPage><NotificationsPage /></LazyPage> }`
6. Remove from AppContent conditional rendering
7. Test: navigate to notifications, verify all functionality

### Step 2: Migrate study-related pages (GrammarStudy, KanjiStudy, Reading, Exercise)
Same pattern per page:
- Replace props with context hooks
- Replace `onGoHome` with `navigate('/')`
- GrammarStudyPage also needs `useLessonFiltering()` for filtered lessons
- StudyPage needs `useLessonFiltering()` + `useSettings()` + `useUserData().addStudySession`

### Step 3: Migrate data-display pages (JLPTPage, ProgressPage, AnalyticsDashboard)
- JLPTPage: `useJLPTData()` for questions, `useUserData().addJLPTSession` for saving
- ProgressPage: `useProgress()` hook already exists, `useUserData()` for stats
- AnalyticsDashboard: `useUserData()` for sessions/stats, `useFlashcardData()` for cards

### Step 4: Migrate simple pages (LecturePage, PricingPage, BranchManagement)
- LecturePage: only needs `useNavigate()` for editor navigation
- PricingPage: `useUserData().canAccessLocked` + `useNavigate()`
- BranchManagement: `useUserData().users`

### Step 5: Update router.tsx
Add all 12 routes as children of AppLayout.

### Step 6: Clean AppContent
Remove all 12 migrated page blocks from conditional rendering. AppContent should shrink by ~200 LOC.

## Todo

- [x] Migrate NotificationsPage (pattern validation)
- [x] Migrate GrammarStudyPage
- [x] Migrate KanjiStudyPage
- [x] Migrate ReadingPracticePage
- [x] Migrate ExercisePage
- [x] Migrate JLPTPage
- [x] Migrate ProgressPage
- [x] Migrate StudyPage
- [x] Migrate LecturePage
- [x] Migrate AnalyticsDashboardPage
- [x] Migrate PricingPage
- [x] Migrate BranchManagementPage
- [x] Remove props from 12 AppContent call sites
- [x] tsc --noEmit: 0 errors
- [x] vite build: success
- [ ] Smoke test all 12 pages (manual)

**Note:** Routes NOT added to router.tsx yet — `useAppNavigation` already bridges `currentPage` ↔ URL bidirectionally. Adding direct routes would cause double-rendering with AppContent catch-all. Route extraction deferred to when pages are fully removed from AppContent.

## Success Criteria

- [ ] 12 pages migrated to zero-prop with direct context consumption
- [ ] 12 new routes in router.tsx
- [ ] AppContent reduced by ~200 LOC
- [ ] All pages render correctly at their URLs
- [ ] Browser back/forward works
- [ ] No TypeScript errors

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Context not available (provider missing) | HIGH | AppLayout wraps all providers from Phase 1 |
| `useSettings` not returning same data shape | LOW | useSettings already exists and is stable |
| Lesson filtering differs from App.tsx | MEDIUM | useLessonFiltering extracted in Phase 1, same logic |
| Navigation callbacks break | LOW | useNavigate is standard React Router |

## Security Considerations
- Role-based page access: add `canAccessPage()` check at top of each page or as route guard
- NotificationsPage: ensure user-specific notifications only (already enforced by context)

## Next Steps
After Phase 2, begin [Phase 3](./phase-3-medium-migrations.md) -- migrate pages needing minor hook extraction (HomePage, GameHubPage, etc.)
