# Phase 3: Medium Page Migrations (Minor Hook Extraction Needed)

**Priority:** P1
**Estimated effort:** 2-3 days
**Depends on:** Phase 1 + Phase 2 pattern proven

## Context
- [plan.md](./plan.md) | [Phase 2](./phase-2-easy-migrations.md)
- These pages need small hook extractions or wrapper callbacks that don't exist yet

## Overview

Migrate 8 pages that need minor additional work beyond what existing contexts provide. Typically: computed props, navigation callbacks with state, or user-specific wrappers.

## Pages to Migrate

| # | Page | Current Props | Extra Work Needed | Complexity |
|---|------|---------------|-------------------|------------|
| 1 | HomePage | 24 | useDailyWords, useProgress called internally; achievement ctx bridge | MODERATE |
| 2 | GameHubPage | 11 | useLessonFiltering + useAppNavigation for sidebar + join codes | MODERATE |
| 3 | KaiwaPage | 13 | useJLPTData + useSettings + useCustomTopics (already hooks) | LOW |
| 4 | LectureEditorPage | 4 | useNavigate + URL params for lectureId/folderId/level | LOW |
| 5 | TeacherManagementPage | 1 (users) | useUserData | EASY |
| 6 | SalaryPage | 1 (users) | useUserData | EASY |
| 7 | CenterMembersPage | 1 (users) | useUserData + useCenter | EASY |
| 8 | CenterDashboardPage | 3 | useUserData + useCenter + useNavigate | EASY |

## Key Insights

### HomePage (most complex in this phase)
Current props from App.tsx (lines 481-524):
- `statsByLevel`, `cards` -> `useFlashcardData()`
- `getLessonsByLevel`, `getChildLessons` -> `useFlashcardData()` (unfiltered OK for home)
- `canAccessLocked` -> `useUserData()`
- `onNavigate`, `onStartStudy`, `onStudyByLevel`, `onCustomStudy` -> `useNavigate()`
- `userName`, `currentUserId`, `userJlptLevel` -> `useUserData().currentUser`
- `progress` -> call `useProgress()` internally
- `dailyWords` -> call `useDailyWords()` internally
- `studySessions`, `gameSessions`, `jlptSessions` -> `useUserData()`
- `missions`, `onShowAchievements` -> `useAchievementContextOptional()`
- `onSpeak` -> inline `speechSynthesis.speak()` (3 lines)

**Strategy:** HomePage calls all hooks directly. ~24 props eliminated.

### GameHubPage
Current props (lines 741-757):
- `currentUser` -> `useUserData()`
- `flashcards`, `kanjiCards` -> `useFlashcardData()`
- `jlptQuestions` -> `useJLPTData()`
- `getLessonsByLevel`, `getChildLessons` -> `useLessonFiltering()`
- `settings` -> `useSettings()`
- `friends`, `onInviteFriend` -> `useUserData()`
- `initialGame`, `initialJoinCode` -> URL search params via `useSearchParams()`
- `onCollapseSidebar`, `onExpandSidebar` -> need shared sidebar state (from AppChrome context or a small hook)
- `onSaveGameSession` -> `useUserData().addGameSession`

**Strategy:** Most props from contexts. Sidebar collapse: either expose via a small `useAppLayout()` hook or use CSS class toggle via ref.

### KaiwaPage
All 13 props come from `useJLPTData()` + `useSettings()` + `useCustomTopics()`. Already hook-based data. Straightforward migration.

## Requirements

1. Create `useAppLayout` hook or context for sidebar state sharing (GameHubPage needs it)
2. Convert `initialGame`/`initialJoinCode` to URL search params
3. Convert `editingLectureId`/`folderId`/`level` to URL route params
4. Each page becomes zero-prop
5. Role guards preserved

## Architecture

### Sidebar State Sharing
```tsx
// Option A: Small context (recommended)
// src/contexts/app-layout-context.tsx
const AppLayoutContext = createContext<{
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
}>(...);

// Used in AppChrome (provider) and GameHubPage (consumer)
```

### URL-Based State (replacing prop state)
```
// Game join: /games?join=ABC123&type=quiz
// Lecture editor: /lectures/editor/:lectureId?folderId=xxx&level=N3
```

## Related Code Files

| File | Action |
|------|--------|
| `src/components/pages/home-page.tsx` | Remove 24 props, add 6 hook calls |
| `src/components/pages/game-hub-page.tsx` | Remove 11 props, add context + URL params |
| `src/components/pages/kaiwa/index.tsx` | Remove 13 props, add useJLPTData + useSettings |
| `src/components/pages/lecture-editor.tsx` | Remove 4 props, use URL params |
| `src/components/pages/teacher-management-page.tsx` | Remove 1 prop, add useUserData |
| `src/components/pages/salary-page.tsx` | Remove 1 prop, add useUserData |
| `src/components/pages/center-members-page.tsx` | Remove 1 prop, add useUserData |
| `src/components/pages/center-dashboard-page.tsx` | Remove 3 props, add hooks |
| `src/contexts/app-layout-context.tsx` | NEW: sidebar state context |
| `src/router.tsx` | Add 8 routes, update lecture-editor route with params |

## Implementation Steps

### Step 1: Create AppLayoutContext
**File:** `src/contexts/app-layout-context.tsx` (NEW, ~30 LOC)
- Provides `sidebarCollapsed`, `setSidebarCollapsed`
- Provider lives in AppChrome
- Consumed by GameHubPage for sidebar auto-collapse during games

### Step 2: Migrate easy pages first (Teacher, Salary, Center pages)
These only need `useUserData()` -- quick wins to build momentum.

### Step 3: Migrate KaiwaPage
Replace 13 props:
- `settings` -> `useSettings()`
- `defaultQuestions`, `kaiwaFolders`, `getFoldersByLevelAndTopic`, `getQuestionsByFolder`, `getQuestionsByLevelAndTopic` -> `useJLPTData()`
- `advancedTopics`, `advancedQuestions`, `getAdvancedQuestionsByTopic` -> `useJLPTData()`
- `customTopics`, `customTopicQuestions`, `getCustomTopicQuestionsByTopic` -> `useCustomTopics()` (hook already exists)

### Step 4: Migrate LectureEditorPage
Convert navigation state to URL params:
- Route: `/lectures/editor/:lectureId?` with optional query params
- `onBack` -> `navigate('/cards')` or `navigate(-1)`

### Step 5: Migrate GameHubPage
Replace 11 props with hooks + URL params:
- Game join codes via `useSearchParams()`: `/games?join=CODE&type=quiz`
- Sidebar via `useAppLayout().setSidebarCollapsed`
- Update QR code generation to use new URL format

### Step 6: Migrate HomePage (most complex)
Replace 24 props:
- Call `useProgress()`, `useDailyWords()`, `useAchievementContextOptional()` internally
- `useDailyWords` needs `cards` and `settings` -- both available from hooks inside HomePage
- Navigation: all `onStartStudy`, `onStudyByLevel`, `onCustomStudy` become `navigate('/study?level=N3')` etc.

### Step 7: Update router.tsx + clean AppContent
Add 8 routes. Remove 8 blocks from AppContent. AppContent should now only have: CardsPage, SettingsPage (Phase 4 targets).

## Todo

- [x] ~~Create `src/contexts/app-layout-context.tsx`~~ — NOT needed, `useNavigation()` already has sidebar state
- [x] Migrate TeacherManagementPage
- [x] Migrate SalaryPage
- [x] Migrate CenterMembersPage
- [x] Migrate CenterDashboardPage
- [x] Migrate KaiwaPage (useKaiwaState now calls hooks directly)
- [x] Migrate LectureEditorPage (uses useNavigation for editing state)
- [x] Migrate GameHubPage (uses useNavigation for sidebar + join codes)
- [x] Migrate HomePage (24 props → 7 hooks internally)
- [x] Remove props from 8 AppContent call sites
- [x] tsc --noEmit: 0 errors
- [x] vite build: success
- [ ] Smoke test all 8 pages (manual)

## Success Criteria

- [ ] 8 pages migrated to zero-prop
- [ ] AppLayoutContext provides sidebar state
- [ ] Game join uses URL search params instead of state
- [ ] Lecture editor uses URL route params
- [ ] AppContent reduced to only CardsPage + SettingsPage
- [ ] No regressions

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| HomePage has 528 LOC + many sub-components | MEDIUM | Sub-components unchanged; only top-level props removed |
| GameHubPage sidebar collapse timing | LOW | Test game enter/exit flow |
| useDailyWords computed inside HomePage increases renders | LOW | Already memoized in hook |
| QR code URLs change format | MEDIUM | Update QR generation + test scanning flow |
| Lecture editor back navigation | LOW | Use navigate(-1) or explicit path |

## Security Considerations
- KaiwaPage: `canAccessLocked` check preserved (currently in App.tsx conditional)
- Teacher/Salary pages: `canAccessPage()` check must be added to page or route guard
- Center pages: center role validation stays in `useCenter()` context

## Next Steps
After Phase 3, begin [Phase 4](./phase-4-heavy-migrations.md) -- migrate CardsPage (90+ props) and SettingsPage (62 props).
