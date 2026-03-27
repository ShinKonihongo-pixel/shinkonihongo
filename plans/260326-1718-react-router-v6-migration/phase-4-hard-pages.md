# Phase 4: Migrate Hard Pages (3 pages, 20-29 props)

## Context

18 of 28 pages migrated. App.tsx still renders HomePage (21 props), SettingsPage (~20 props), CardsPage (29 props) plus a few ancillary pages (JLPTPage, KaiwaPage, LecturePage, LectureEditorPage, AnalyticsDashboardPage). This phase migrates all remaining pages.

## Overview

Extract inline closures and data assembly into dedicated hooks. Each hard page gets a companion hook that encapsulates all the prop logic. Then wire as route elements.

## Key Insights

### HomePage (21 props)
- `statsByLevel`, `cards`, `getLessonsByLevel`, `getChildLessons` -- from FlashcardDataContext
- `canAccessLocked` -- from UserDataContext
- Navigation callbacks (`onStartStudy`, `onStudyByLevel`, `onCustomStudy`, `onNavigate`) -- useNavigate()
- `userName`, `currentUserId` -- from UserDataContext
- `progress` -- from useProgress() (standalone after Phase 3)
- `dailyWords` -- from useDailyWords() (needs cards + settings)
- `studySessions`, `gameSessions`, `jlptSessions` -- from UserDataContext
- `missions` -- from AchievementContext
- `onShowAchievements` -- from AchievementContext
- `userJlptLevel` -- from UserDataContext
- `onSpeak` -- inline SpeechSynthesis closure (move inside HomePage)
- `onShowTour` -- onboarding state (small state, keep local or URL param)

### SettingsPage (~20 props)
- `settings`, `onUpdateSetting`, `onReset` -- from useSettings()
- `currentUser` -- from UserDataContext
- 5 inline closures wrapping `currentUser.id`:
  - `onUpdateDisplayName`, `onChangePassword`, `onUpdateAvatar`, `onUpdateProfileBackground`, `onUpdateJlptLevel`
- `studySessions`, `gameSessions`, `jlptSessions`, `stats`, `historyLoading` -- from UserDataContext
- Theme: `theme`, `themePresets`, `onApplyThemePreset`, `onResetTheme` -- from useGlobalTheme()
- Export: `flashcards`, `lessons` -- from FlashcardDataContext
- `onImportData` -- inline closure using addCard (from FlashcardDataContext)
- Friends: `allUsers`, `friends`, `pendingRequests`, `badgeStats`, `receivedBadges`, `friendsLoading`, `onSend*`, `onRespond*`, `onRemove*`, `onSendBadge`, `isFriend` -- from UserDataContext

### CardsPage (29 props)
- Cards/lessons CRUD -- from FlashcardDataContext
- JLPT question CRUD -- from JLPTDataContext
- Kaiwa question CRUD -- from JLPTDataContext
- Advanced kaiwa CRUD -- from JLPTDataContext
- User management -- from UserDataContext
- 5+ inline closures capturing `currentUser.id`:
  - `onAddLesson`, `onAddJLPTQuestion`, `onAddJLPTFolder`, `onAddKaiwaQuestion`, `onAddKaiwaFolder`
- `onNavigateToLectureEditor` -- navigation + state (use URL params instead)

## Requirements

1. Create `useHomeData()` hook for HomePage
2. Create `useSettingsActions()` hook for SettingsPage
3. CardsPage consumes contexts directly (no new hook needed -- just remove wrapper closures)
4. Move `onSpeak` TTS utility into HomePage or a shared `useSpeech()` hook
5. Replace `onNavigateToLectureEditor` with URL params: `/lectures/editor?id=X&folder=Y&level=Z`
6. Migrate remaining ancillary pages (JLPT, Kaiwa, Lectures, LectureEditor, Analytics)
7. Remove ALL conditional page rendering from App.tsx

## Architecture

### New Hooks

```
src/hooks/use-home-data.ts       -- assembles HomePage props from contexts
src/hooks/use-settings-actions.ts -- wraps currentUser.id into settings callbacks
```

### Ancillary Pages (also migrated in this phase)

| Page | Props | Migration Notes |
|------|-------|-----------------|
| JLPTPage | questions, onSaveJLPTSession | useJLPTData(), useUserData() |
| KaiwaPage | settings, defaultQuestions, kaiwaFolders, getFolders*, getQuestions*, advanced*, custom* | useJLPTData(), useSettings(). VIP gate via ProtectedRoute |
| LecturePage | onNavigateToEditor | useNavigate() with URL params |
| LectureEditorPage | lectureId, initialFolderId, initialLevel, onBack | useSearchParams() for params, useNavigate() for back |
| AnalyticsDashboardPage | studySessions, gameSessions, jlptSessions, userStats, cards, grammarCards, kanjiCards | useUserData(), useFlashcardData() |

## Related Files

- `src/App.tsx` -- remove ALL remaining conditional page blocks
- `src/router.tsx` -- add remaining route entries
- `src/components/pages/home-page.tsx` -- consume useHomeData()
- `src/components/pages/settings-page.tsx` -- consume useSettingsActions()
- `src/components/pages/cards-page.tsx` -- consume 3 contexts directly
- `src/components/pages/jlpt/index.tsx` -- consume contexts
- `src/components/pages/kaiwa/index.tsx` -- consume contexts
- `src/components/pages/lecture-page.tsx` -- use useNavigate()
- `src/components/pages/lecture-editor.tsx` -- use useSearchParams()
- `src/components/pages/analytics-dashboard-page.tsx` -- consume contexts

## Implementation Steps

### Step 1: Create useHomeData() hook

```tsx
export function useHomeData() {
  const { currentUser, canAccessLocked, studySessions, gameSessions, jlptSessions } = useUserData();
  const { cards, getStatsByLevel, getLessonsByLevel, getChildLessons } = useFlashcardData();
  const { settings } = useSettings();
  const progress = useProgress();
  const achievementCtx = useAchievementContextOptional();
  const navigate = useNavigate();
  const dailyWords = useDailyWords({ allCards: cards, targetCount: settings.dailyWordsTarget, enabled: settings.dailyWordsEnabled, userJlptLevel: currentUser?.jlptLevel });

  return {
    statsByLevel: getStatsByLevel(),
    cards,
    onStartStudy: () => navigate('/study'),
    onStudyByLevel: (level: JLPTLevel) => navigate('/study', { state: { level } }),
    onCustomStudy: (selection: any) => navigate('/study', { state: { selection } }),
    getLessonsByLevel,
    getChildLessons,
    canAccessLocked,
    onNavigate: (page: string) => navigate(ROUTES[page] || '/'),
    userName: currentUser?.displayName || currentUser?.username,
    progress,
    dailyWords,
    currentUserId: currentUser?.id,
    studySessions, gameSessions, jlptSessions,
    missions: achievementCtx ? { missions: achievementCtx.missions, allCompleted: achievementCtx.allMissionsCompleted, bonusClaimed: achievementCtx.bonusXpClaimed, onClaimBonus: achievementCtx.claimMissionBonus } : undefined,
    onShowAchievements: achievementCtx?.openShowcase,
    userJlptLevel: currentUser?.jlptLevel,
  };
}
```

### Step 2: Create useSettingsActions() hook

Wraps the 5 inline closures that capture `currentUser.id`:

```tsx
export function useSettingsActions() {
  const { currentUser, users, updateDisplayName, changePassword, updateAvatar, updateProfileBackground, updateJlptLevel } = useUserData();
  const uid = currentUser?.id;

  return {
    onUpdateDisplayName: async (name: string) => {
      if (!uid) return { success: false, error: 'Not logged in' };
      return updateDisplayName(uid, name);
    },
    onChangePassword: async (oldPwd: string, newPwd: string) => {
      if (!uid) return { success: false, error: 'Not logged in' };
      const user = users.find(u => u.id === uid);
      if (!user || user.password !== oldPwd) return { success: false, error: 'Wrong password' };
      return changePassword(uid, newPwd);
    },
    onUpdateAvatar: async (avatar: string) => {
      if (!uid) return { success: false, error: 'Not logged in' };
      return updateAvatar(uid, avatar);
    },
    onUpdateProfileBackground: async (bg: string) => {
      if (!uid) return { success: false, error: 'Not logged in' };
      return updateProfileBackground(uid, bg);
    },
    onUpdateJlptLevel: async (level: any) => {
      if (!uid) return { success: false, error: 'Not logged in' };
      return updateJlptLevel(uid, level);
    },
  };
}
```

### Step 3: Refactor CardsPage to consume contexts

CardsPage has 29 props but they map cleanly to 3 contexts + some closures:
- FlashcardDataContext: cards, addCard, updateCard, deleteCard, lessons, getLessonsByLevel, etc.
- JLPTDataContext: jlptQuestions, jlptFolders, addJLPTQuestion, etc., kaiwa*, advanced*
- UserDataContext: currentUser, users, updateUserRole, deleteUser, register, updateVipExpiration

The 5 inline closures that wrap `currentUser.id` become internal to CardsPage:
```tsx
const handleAddLesson = async (name, level, parentId) => {
  await addLesson(name, level, parentId ?? null, currentUser.id);
};
```

### Step 4: Replace lecture editor navigation with URL params

Currently: `setEditingLectureId(id); setEditingLectureFolderId(folderId); setCurrentPage('lecture-editor')`

After: `navigate('/lectures/editor?' + new URLSearchParams({ id, folder, level }).toString())`

LectureEditorPage reads params via `useSearchParams()`.

### Step 5: Migrate remaining 5 ancillary pages

JLPTPage, KaiwaPage, LecturePage, LectureEditorPage, AnalyticsDashboardPage -- each consumes contexts directly.

KaiwaPage VIP gate: wrap in ProtectedRoute or check `canAccessLocked` inside component.

### Step 6: Add all remaining routes to router.tsx

```tsx
{ path: '/', lazy: () => import('./components/pages/home-page') },
{ path: '/settings', lazy: () => import('./components/pages/settings-page') },
{ path: '/cards', element: <ProtectedRoute page="cards" />, children: [{ index: true, lazy: () => import('./components/pages/cards-page') }] },
{ path: '/jlpt', lazy: () => import('./components/pages/jlpt/index') },
{ path: '/kaiwa', lazy: () => import('./components/pages/kaiwa/index') },
{ path: '/lectures', lazy: () => import('./components/pages/lecture-page') },
{ path: '/lectures/editor', element: <ProtectedRoute page="lecture-editor" />, children: [{ index: true, lazy: () => import('./components/pages/lecture-editor') }] },
{ path: '/analytics', lazy: () => import('./components/pages/analytics-dashboard-page') },
```

### Step 7: Strip App.tsx of all page rendering

AppContent becomes just: providers + sidebar + floating panels + achievement UI + JLPT modal + global search. All page content renders via `<Outlet />`.

## Todo

- [ ] Create `src/hooks/use-home-data.ts`
- [ ] Create `src/hooks/use-settings-actions.ts`
- [ ] Refactor HomePage -- consume useHomeData(), move onSpeak inside
- [ ] Refactor SettingsPage -- consume useSettingsActions() + contexts
- [ ] Refactor CardsPage -- consume 3 contexts, inline closures
- [ ] Refactor JLPTPage -- consume contexts
- [ ] Refactor KaiwaPage -- consume contexts, add VIP check
- [ ] Refactor LecturePage -- use useNavigate()
- [ ] Refactor LectureEditorPage -- use useSearchParams()
- [ ] Refactor AnalyticsDashboardPage -- consume contexts
- [ ] Add all remaining route entries
- [ ] Strip all page conditionals from App.tsx
- [ ] Move floating panels, achievement UI, JLPT modal, global search into AppLayout
- [ ] Test all 28 pages via direct URL
- [ ] Test all 28 pages via sidebar navigation
- [ ] Test lecture editor URL params flow

## Success Criteria

- [ ] ALL 28 pages route-based
- [ ] App.tsx has zero conditional page rendering
- [ ] HomePage uses useHomeData() hook
- [ ] SettingsPage uses useSettingsActions() hook
- [ ] CardsPage consumes 3 contexts directly
- [ ] Lecture editor uses URL params instead of state
- [ ] No navigation callback props remain

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| CardsPage refactor breaks CRUD operations | High | Medium | Test every CRUD operation individually |
| SettingsPage password check accesses users array | Medium | Low | Verify user lookup still works from context |
| HomePage missions prop shape changes | Medium | Low | Keep exact same shape in useHomeData |
| Lecture editor URL params lost on refresh | Medium | Medium | useSearchParams persists in URL |
| onShowTour orphaned (no owner after migration) | Low | High | Move to URL param `?tour=1` or local state in HomePage |

## Security

- CardsPage ProtectedRoute enforces admin-only access
- LectureEditorPage ProtectedRoute enforces admin-only access
- KaiwaPage VIP access check preserved
- Password verification logic moved from App.tsx inline closure to useSettingsActions -- same behavior

## Next Steps

Phase 5: Delete dead code (use-app-navigation.ts, use-url-router.ts), integrate center routes into router, final App.tsx slimdown.
