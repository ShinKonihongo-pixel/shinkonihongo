# Phase 4: Heavy Page Migrations (CardsPage + SettingsPage)

**Priority:** P2
**Estimated effort:** 3-4 days
**Depends on:** Phase 2-3 patterns proven

## Context
- [plan.md](./plan.md) | [Phase 3](./phase-3-medium-migrations.md)
- CardsPage: 90+ props, 519 LOC -- the admin management hub
- SettingsPage: 62 props, settings-types.ts (153 LOC) defines full interface

## Overview

Migrate the two heaviest pages. Both are "kitchen sink" components that receive massive prop sets because they manage many sub-tabs. Strategy: each page consumes contexts directly and passes data to its internal tab components.

## Key Insights

### CardsPage (src/components/pages/cards-page.tsx, 519 LOC)
**Current prop categories:**
1. Flashcard CRUD: `cards, onAddCard, onUpdateCard, onDeleteCard` -> `useFlashcardData()`
2. Lesson CRUD: `lessons, getLessonsByLevel, getChildLessons, onAddLesson, ...` -> `useFlashcardData()` + `useLessonFiltering()`
3. JLPT CRUD: `jlptQuestions, jlptFolders, onAdd/Update/Delete...` -> `useJLPTData()`
4. Kaiwa CRUD: `kaiwaQuestions, kaiwaFolders, ...` -> `useJLPTData()`
5. Advanced Kaiwa: `advancedKaiwaTopics, ...` -> `useJLPTData()`
6. User management: `users, onUpdateUserRole, onDeleteUser, ...` -> `useUserData()`
7. Lesson locking: `onToggleLock, onToggleHide, onReorderLessons` -> `useFlashcardData()`
8. Navigation: `onNavigateToLectureEditor` -> `useNavigate()`

**Observation:** CardsPage already calls several hooks internally:
- `useLectures()`, `useTestTemplates()`, `useCustomTopics()`
- `useGrammarCards()`, `useGrammarLessons()`, `useKanjiCards()`, `useKanjiLessons()`
- `useExercises()`, `useReading()`, `useListening()`

So it's already partially self-sufficient. Only the props from the 3 major contexts (UserData, FlashcardData, JLPTData) need replacement.

### SettingsPage (settings-page-refactored.tsx + settings/ directory)
**Current prop categories (from settings-types.ts):**
1. Settings CRUD: `settings, onUpdateSetting, onReset` -> `useSettings()`
2. Profile: `currentUser, onUpdateDisplayName, onChangePassword, onUpdateAvatar, ...` -> `useUserData()` with wrappers
3. History: `studySessions, gameSessions, jlptSessions, stats, historyLoading` -> `useUserData()`
4. Theme: `theme, themePresets, onApplyThemePreset, onResetTheme` -> `useGlobalTheme()`
5. Export/Import: `flashcards, lessons, onImportData` -> `useFlashcardData()`
6. Friends: `allUsers, friends, pendingRequests, badgeStats, ...` -> `useUserData()`

**Password change wrapper (App.tsx lines 677-685):** Verifies old password against users list. This logic moves into SettingsPage or a `useProfileActions()` hook.

## Requirements

1. CardsPage becomes zero-prop, consuming 3 contexts + existing internal hooks
2. SettingsPage becomes zero-prop, consuming useSettings + useGlobalTheme + useUserData + useFlashcardData
3. Create `useProfileActions()` hook for password/avatar/display name changes
4. `onAddLesson` wrapper (adds `currentUser.id` as `createdBy`) moves inside CardsPage
5. `onImportData` logic (loop adding cards) moves inside SettingsPage or a `useDataImport()` hook
6. After this phase, AppContent is EMPTY -- can be deleted

## Architecture

### CardsPage After Migration
```tsx
export function CardsPage() {
  const { currentUser, users, isAdmin, updateUserRole, deleteUser, register, updateVipExpiration } = useUserData();
  const { cards, addCard, updateCard, deleteCard, lessons, getLessonsByLevel, getChildLessons, addLesson, updateLesson, deleteLesson, toggleLock, toggleLessonHide, reorderLessons, getPublishedExercises, readingPassages, readingFolders, ... } = useFlashcardData();
  const { jlptQuestions, jlptFolders, addJLPTQuestion, ... kaiwaQuestions, kaiwaFolders, ... advancedKaiwaTopics, ... } = useJLPTData();
  const { filteredGetLessonsByLevel, filteredGetChildLessons } = useLessonFiltering();
  const navigate = useNavigate();

  // Internal hooks (already present, no change)
  const lectures = useLectures();
  const grammarCards = useGrammarCards();
  // ...

  // Wrappers that were in App.tsx
  const handleAddLesson = async (name, level, parentId) => {
    await addLesson(name, level, parentId ?? null, currentUser!.id);
  };

  // ... rest of component unchanged, passes data to tab components
}
```

### SettingsPage After Migration
```tsx
export function SettingsPage() {
  const { settings, updateSetting, resetSettings } = useSettings();
  const { theme, applyPreset, resetTheme } = useGlobalTheme();
  const { currentUser, users, studySessions, gameSessions, jlptSessions, userStats, historyLoading, updateDisplayName, changePassword, updateAvatar, updateProfileBackground, updateJlptLevel, friendsWithUsers, pendingRequests, badgeStats, receivedBadges, friendsLoading, sendFriendRequest, respondFriendRequest, removeFriend, sendBadge, isFriend } = useUserData();
  const { cards: flashcards, lessons } = useFlashcardData();
  const navigate = useNavigate();
  const { search } = useLocation(); // for initialTab from URL

  // Password change wrapper (moved from App.tsx)
  const handleChangePassword = async (oldPwd, newPwd) => {
    const user = users.find(u => u.id === currentUser?.id);
    if (!user || user.password !== oldPwd) return { success: false, error: '...' };
    return changePassword(currentUser!.id, newPwd);
  };
  // ...
}
```

## Related Code Files

| File | Action |
|------|--------|
| `src/components/pages/cards-page.tsx` (519 LOC) | Remove ~90 props, add 4 context hooks |
| `src/components/pages/settings-page-refactored.tsx` | Remove ~62 props, add 4 hooks |
| `src/components/pages/settings/settings-types.ts` | Update SettingsPageProps to internal-only |
| `src/App.tsx` (or AppContent) | Remove last 2 page blocks; delete AppContent |
| `src/router.tsx` | Add /cards and /settings routes |
| `src/hooks/use-profile-actions.ts` | NEW: optional, wraps profile update logic |

## Implementation Steps

### Step 1: Migrate CardsPage
1. Replace `CardsPageProps` interface with zero-prop function
2. Add context hook calls at top of component
3. Move `onAddLesson` wrapper (adds createdBy) inside component
4. Move `onAddJLPTQuestion` wrapper (adds createdBy) inside component
5. Move `onAddKaiwaQuestion`/`onAddKaiwaFolder` wrappers inside component
6. Replace `onNavigateToLectureEditor` with `navigate('/lectures/editor/...')`
7. Internal tab components (`VocabularyTab`, `GrammarTab`, etc.) still receive props from CardsPage -- no change to sub-tabs
8. Add route to router.tsx
9. Remove from AppContent

### Step 2: Migrate SettingsPage
1. Update `settings-page-refactored.tsx` to zero-prop
2. Add context hooks
3. Move password change wrapper inside component
4. Move import data logic inside component
5. `initialTab` from `currentPage === 'profile'` -> URL param `/settings?tab=profile`
6. Sub-tab components still receive props from SettingsPage (their interfaces stay)
7. Add route to router.tsx
8. Remove from AppContent

### Step 3: Delete AppContent
After both pages migrated, `AppContent` function in App.tsx should be empty. Delete it entirely. App.tsx is now just the routing shell from Phase 1.

### Step 4: Clean up settings-types.ts
`SettingsPageProps` no longer needed externally. Can be removed or made internal. Sub-tab props interfaces (`FlashcardSettingsProps`, `StudySettingsProps`, etc.) stay unchanged -- they define the CardsPage->SubTab contract.

### Step 5: Verify + test
- CardsPage: test all 11 tabs (vocabulary, grammar, kanji, reading, listening, lectures, JLPT, kaiwa, game, users, exercises)
- SettingsPage: test all 3 main tabs (general, profile, friends) and all sub-tabs
- Test role-based access (admin-only pages)

## Todo

- [ ] Migrate CardsPage: remove props, add hooks
- [ ] Move createdBy wrappers inside CardsPage
- [ ] Migrate SettingsPage: remove props, add hooks
- [ ] Move password change wrapper inside SettingsPage
- [ ] Move import data logic inside SettingsPage
- [ ] Convert initialTab to URL param
- [ ] Add /cards and /settings routes
- [ ] Delete AppContent from App.tsx
- [ ] Update settings-types.ts
- [ ] Lint + test
- [ ] Smoke test all CardsPage tabs
- [ ] Smoke test all SettingsPage tabs/sub-tabs

## Success Criteria

- [ ] CardsPage: zero props, all 11 tabs functional
- [ ] SettingsPage: zero props, all tabs functional
- [ ] AppContent deleted from App.tsx
- [ ] App.tsx < 50 LOC
- [ ] No TypeScript errors
- [ ] All sub-tab components unchanged (still receive props from parent page)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| CardsPage sub-tabs break due to changed data shape | HIGH | Sub-tabs stay prop-based; only CardsPage top-level changes |
| Password verification logic moves incorrectly | MEDIUM | Unit test password change flow |
| SettingsPage import data handler async errors | LOW | Keep same try/catch pattern |
| createdBy not set correctly | MEDIUM | Test card/lesson creation as different roles |
| Settings profile/friends initialTab from URL | LOW | Test deep link `/settings?tab=profile` |

## Security Considerations
- CardsPage: `canAccessPage('cards', currentUser.role)` check at page top
- SettingsPage: no role restriction (all users can access)
- Password verification: ensure old password check preserved exactly
- User management: updateUserRole/deleteUser must remain admin-only (enforced by service layer)

## Next Steps
After Phase 4, AppContent is deleted and App.tsx is a clean routing shell. Begin [Phase 5](./phase-5-cleanup-split.md) for large file splitting and performance review.
