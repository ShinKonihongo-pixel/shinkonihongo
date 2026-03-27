# Phase 3: Migrate Medium Pages (8 pages, 4-8 props)

## Context

Phase 2 moved 10 easy pages to router. App.tsx still renders 18 pages via conditionals. This phase tackles 8 pages that need minor refactoring -- primarily replacing navigation callback props with `useNavigate()`.

## Overview

Migrate 8 medium-complexity pages. Main pattern: replace `onGoHome`, `onNavigate`, `onStartStudy` callback props with `useNavigate()` inside each component. Data props come from existing contexts.

## Key Insights

- Most "medium" props are navigation callbacks: `onGoHome`, `onNavigate`, `onStartStudy`
- Data props like `cards`, `grammarCards`, `settings` come from FlashcardDataContext or useSettings
- `useSettings` hook already available, no need for prop drilling
- `filteredGetLessonsByLevel` and `filteredGetChildLessons` are computed in AppContent -- need to move this filtering logic

### Filtering Logic Extraction

AppContent creates `filteredGetLessonsByLevel` and `filteredGetChildLessons` which filter hidden/locked lessons. This logic needs to move somewhere shared. Options:
- **Option A:** Move to FlashcardDataContext (recommended -- it owns lesson data)
- **Option B:** Create a `useLessonFiltering()` hook
- **Option C:** Put in each consuming page

Recommend **Option A**: add `getFilteredLessonsByLevel(level, { canAccessLocked, canSeeHidden, userId })` to FlashcardDataContext.

## Requirements

1. Replace navigation callback props with useNavigate() in each page
2. Replace data props with context consumption
3. Extract lesson filtering into FlashcardDataContext
4. Remove 8 conditional blocks from App.tsx
5. Wire pages as route elements

## Architecture

### Pages to Migrate

| Page | Current Props | Key Changes |
|------|--------------|-------------|
| StudyPage | cards, getLessonsByLevel, getChildLessons, updateCard, onGoHome, settings, onUpdateSetting, onSaveStudySession | useFlashcardData(), useSettings(), useUserData(), useNavigate() |
| GrammarStudyPage | grammarCards, lessons, getLessonsByLevel, getChildLessons, onGoHome, settings, onUpdateGrammarCard | useFlashcardData(), useSettings(), useNavigate() |
| KanjiStudyPage | kanjiCards, lessons, getLessonsByLevel, getChildLessons, onGoHome, onUpdateKanjiCard | useFlashcardData(), useNavigate() |
| ReadingPracticePage | passages, folders, getFoldersByLevel, getPassagesByFolder, onGoHome | useFlashcardData(), useNavigate() |
| ExercisePage | exercises, flashcards, onGoHome | useFlashcardData(), useNavigate() |
| ProgressPage | progress, stats, onStartStudy | useProgress() (needs extraction), useUserData(), useNavigate() |
| GameHubPage | currentUser, flashcards, kanjiCards, jlptQuestions, getLessonsByLevel, getChildLessons, settings, friends, onInviteFriend, initialGame, initialJoinCode, onCollapseSidebar, onExpandSidebar, onSaveGameSession | Multiple contexts + useNavigate(). initialGame/joinCode from route state or URL params |
| NotificationsPage | classroomNotifications, friendNotifications, onMark*, onNavigate | useUserData(), useNavigate() |

### Sidebar Navigation Update

Sidebar must use `useNavigate()` for all migrated pages. Two approaches:
- **Approach A:** Sidebar always uses useNavigate(), looks up path from ROUTES map
- **Approach B:** Sidebar uses both setCurrentPage (remaining) and navigate (migrated)

Recommend **Approach A** -- simpler, prepares for full migration. Sidebar calls `navigate(ROUTES[page])` for all pages.

## Related Files

- `src/router.tsx` -- add 8 route entries
- `src/App.tsx` -- remove 8 conditional blocks (~180 LOC)
- `src/contexts/flashcard-data-context.tsx` -- add filtered lesson getters
- `src/hooks/use-settings.ts` -- already a hook, no changes needed
- `src/components/layout/sidebar.tsx` -- switch to useNavigate()
- 8 page component files -- refactor props to context consumption
- `src/hooks/use-progress.ts` -- may need to become standalone (currently receives params from AppContent)

## Implementation Steps

### Step 1: Extract lesson filtering to FlashcardDataContext

Move `filteredGetLessonsByLevel` and `filteredGetChildLessons` logic into the context. The context already has `getLessonsByLevel` and `getChildLessons`. Add filtered versions that accept user permissions.

```tsx
// In flashcard-data-context.tsx, add:
getFilteredLessonsByLevel: (level: JLPTLevel, opts: { canAccessLocked: boolean, isSuperAdmin: boolean, userId?: string }) => Lesson[]
getFilteredChildLessons: (parentId: string, opts: { canAccessLocked: boolean, isSuperAdmin: boolean, userId?: string }) => Lesson[]
```

### Step 2: Extract useProgress as standalone hook

Currently `useProgress()` receives `studySessions, gameSessions, jlptSessions, userStats, cards, weeklyCardsTarget, weeklyMinutesTarget` as params from AppContent. Refactor to consume contexts directly:

```tsx
export function useProgress() {
  const { studySessions, gameSessions, jlptSessions, userStats } = useUserData();
  const { cards } = useFlashcardData();
  const { settings } = useSettings();
  // ... compute progress
}
```

### Step 3: Update Sidebar to use useNavigate()

```tsx
// In sidebar.tsx
const navigate = useNavigate();
const handleNavigate = (page: Page) => {
  const path = ROUTES[page];
  if (path) navigate(path);
};
```

Remove `onNavigate` prop dependency.

### Step 4: Refactor 8 page components

For each page:
1. Remove props that come from contexts
2. Add context hook calls
3. Replace `onGoHome()` with `navigate('/')`
4. Replace `onNavigate(page)` with `navigate(ROUTES[page])`
5. Replace `onStartStudy()` with `navigate('/study')`

### Step 5: Add 8 route entries to router.tsx

```tsx
{ path: '/study', lazy: () => import('./components/pages/study-page') },
{ path: '/grammar', lazy: () => import('./components/pages/grammar-study-page') },
{ path: '/kanji', lazy: () => import('./components/pages/kanji-study-page') },
{ path: '/reading', lazy: () => import('./components/pages/reading-practice/index') },
{ path: '/exercise', lazy: () => import('./components/pages/exercise/index') },
{ path: '/progress', lazy: () => import('./components/pages/progress-page') },
{ path: '/games', lazy: () => import('./components/pages/game-hub-page') },
{ path: '/notifications', lazy: () => import('./components/pages/notifications-page') },
```

### Step 6: Handle GameHubPage special cases

- `initialGame` and `initialJoinCode`: pass via route location state from game join redirect (Phase 2 loader)
- `onCollapseSidebar/onExpandSidebar`: create a SidebarContext or use a simple ref-based approach
- `onSaveGameSession`: use useUserData().addGameSession directly

### Step 7: Remove 8 conditional blocks from App.tsx

Delete the blocks. App.tsx now renders only ~10 pages (3 hard + a few edge cases).

## Todo

- [ ] Extract lesson filtering to FlashcardDataContext
- [ ] Refactor useProgress to be standalone (context-consuming)
- [ ] Update Sidebar to use useNavigate()
- [ ] Refactor StudyPage -- remove 8 props
- [ ] Refactor GrammarStudyPage -- remove 7 props
- [ ] Refactor KanjiStudyPage -- remove 6 props
- [ ] Refactor ReadingPracticePage -- remove 5 props
- [ ] Refactor ExercisePage -- remove 3 props
- [ ] Refactor ProgressPage -- remove 3 props
- [ ] Refactor GameHubPage -- remove 13 props (biggest effort in this phase)
- [ ] Refactor NotificationsPage -- remove 6 props
- [ ] Add 8 route entries to router.tsx
- [ ] Remove 8 conditional blocks from App.tsx
- [ ] Create SidebarContext for collapse state (GameHub needs it)
- [ ] Test sidebar navigation for all pages
- [ ] Test browser back/forward
- [ ] Test game join flow end-to-end

## Success Criteria

- [ ] 18 of 28 pages now route-based (10 easy + 8 medium)
- [ ] App.tsx reduced to ~500 LOC (from 980)
- [ ] Sidebar uses useNavigate() exclusively
- [ ] No navigation callback props in migrated pages
- [ ] useProgress() standalone
- [ ] Lesson filtering in FlashcardDataContext

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| GameHubPage has 13 props -- complex migration | High | Medium | Migrate last in this phase, careful testing |
| Sidebar dual-nav (setCurrentPage + navigate) during transition | Medium | High | Switch Sidebar fully to navigate in this phase |
| useProgress refactor breaks progress tracking | Medium | Low | Unit test useProgress before/after |
| Lesson filtering in context changes behavior | High | Low | Test filtered results match exactly |

## Security

- No new auth surfaces
- Route guards from Phase 1 ProtectedRoute already cover protected pages
- GameHubPage access control unchanged (open to all authenticated users)

## Next Steps

Phase 4: Migrate 3 hard pages (HomePage, SettingsPage, CardsPage) that require hooks extraction for their 20+ props.
