# Scout Report 02: Prop Migration Analysis for Heaviest-Receiving Pages

**Date:** 2026-03-27  
**Scope:** Analyze the 7 heaviest prop-receiving pages to understand migration requirements from prop-drilling to direct context consumption

**Goal:** Pages should consume contexts directly INSTEAD of receiving props from App.tsx

---

## Executive Summary

All 7 analyzed pages receive data in one of four categories:

1. **Available in existing context** (50-70%): Data already exists in UserDataContext, FlashcardDataContext, JLPTDataContext, or AchievementContext. These props can be eliminated immediately via `useContext()` hooks.

2. **Derived/computed** (15-25%): Props computed in App.tsx (e.g., `filteredGetLessonsByLevel`, `progress`, `dailyWords`). These require custom hooks to be extracted from context data.

3. **Navigation callback** (5-10%): Props like `setCurrentPage`, `onGoHome`, `onNavigate`. These should move to a dedicated NavigationContext or be injected via a hook.

4. **Needs new hook/context** (5-15%): Data not currently in any context. Requires new context creation or hook extraction.

**Migration Complexity Ranking (easiest → hardest):**
1. **NotificationsPage** (7 props, 100% available in context)
2. **GrammarStudyPage** (8 props, 75% available)
3. **HomePage** (24 props, 62% available)
4. **KaiwaPage** (13 props, 69% available)
5. **SettingsPage** (62 props, 56% available) ← HARDEST, props scattered across 4+ contexts
6. **GameHubPage** (11 props, 55% available)
7. **CardsPage** (90+ props) ← HEAVIEST, requires most refactoring

---

## Page-by-Page Analysis

### 1. CardsPage (src/components/pages/cards-page.tsx)

**Total Props:** 90+ (destructured from interface starting line 47)

#### Prop Breakdown by Category

**Available in existing context (50):**
- `cards` → FlashcardDataContext
- `lessons` → FlashcardDataContext
- `currentUser` → UserDataContext
- `users` → UserDataContext
- `jlptQuestions`, `jlptFolders` → JLPTDataContext
- `kaiwaQuestions`, `kaiwaFolders` → JLPTDataContext
- `advancedKaiwaTopics`, `advancedKaiwaQuestions` → JLPTDataContext
- All CRUD callbacks: `onAddCard`, `onUpdateCard`, `onDeleteCard`, `onAddLesson`, `onUpdateLesson`, `onDeleteLesson`, etc. → FlashcardDataContext/JLPTDataContext
- `canAccessPage`, `canAccessLocked` → UserDataContext

**Derived/computed (20):**
- `getLessonsByLevel` → Derived from `lessons` + level filter
- `getChildLessons` → Derived from `lessons` + parent ID
- `getFoldersByLevelAndCategory` → Derived from `jlptFolders` + filters
- `getQuestionsByFolder` → Derived from `jlptQuestions` + folder ID
- `getFoldersByLevelAndTopic`, `getQuestionsByKaiwaFolder` → Similar derived computations
- `getAdvancedKaiwaQuestionsByTopic` → Derived from `advancedKaiwaQuestions`
- `getCustomTopicQuestionsByTopic` → Derived from `customTopicQuestions`

**Navigation callbacks (3):**
- `onNavigateToLectureEditor` → SetCurrentPage with extra params (needs NavigationContext with state)

**Needs new hook/context (15):**
- `useLectures()` hook exists internally but relies on props
- `useTestTemplates()` hook exists internally but relies on props
- `useCustomTopics()` hook exists internally but relies on props
- `useGrammarCards()`, `useGrammarLessons()`, `useKanjiCards()`, `useKanjiLessons()` exist internally
- These should be consolidated into a single "CardManagementContext" or kept as individual hooks

**Migration Path:**
```tsx
// BEFORE (90+ prop drilling)
<CardsPage
  cards={cards}
  onAddCard={addCard}
  lessons={lessons}
  getLessonsByLevel={filteredGetLessonsByLevel}
  // ... 86 more props
/>

// AFTER (direct context consumption)
function CardsPage() {
  const { cards, lessons, addCard, updateCard, deleteCard, ... } = useFlashcardData();
  const { currentUser } = useUserData();
  const { jlptQuestions, jlptFolders, ... } = useJLPTData();
  const derivedComputations = useLessonFiltering(lessons);
  // ... no props needed
}
```

**Complexity:** ⚠️ **EXTREME** — 90+ props, deeply nested within App.tsx render chain, uses 8+ internal hooks. Requires context hook consolidation + custom derived hook creation.

---

### 2. SettingsPage (src/components/pages/settings-page-refactored.tsx)

**Total Props:** 62 (from SettingsPageProps interface, lines 36-76 in settings-types.ts)

#### Prop Breakdown by Category

**Available in existing context (35):**
- `currentUser` → UserDataContext (line 43)
- `settings` → useSettings hook (already extracted)
- `studySessions`, `gameSessions`, `jlptSessions` → UserDataContext (lines 50-52)
- `stats` (userStats) → UserDataContext (line 53)
- `friends`, `pendingRequests` → UserDataContext (lines 66-67)
- `badgeStats`, `receivedBadges` → UserDataContext (lines 68-69)
- `allUsers` → UserDataContext (line 65)
- All callbacks: `onUpdateDisplayName`, `onChangePassword`, `onUpdateAvatar`, `onUpdateProfileBackground`, `onUpdateJlptLevel` → UserDataContext (lines 44-48)
- `onSendFriendRequest`, `onRespondFriendRequest`, `onRemoveFriend`, `onSendBadge` → UserDataContext (lines 71-74)
- `isFriend` → UserDataContext (line 75)

**Derived/computed (15):**
- `onUpdateSetting` → Wrapper around AppSettings state mutation
- `onReset` → Derived state reset logic
- Theme mutations: `onApplyThemePreset`, `onResetTheme` → Derived from `useGlobalTheme()` hook
- Settings tab state: `initialTab` → Navigation state, needs NavigationContext
- All sub-tab component state selectors: these are internal to SettingsPage and useSettingsState hook

**Navigation callbacks (2):**
- `initialTab` → NavigationContext or query param
- (Already fully internal via `useSettingsState` hook)

**Needs new hook/context (10):**
- `historyLoading` → Could be UserDataContext.loading flag
- `themePresets` → THEME_PRESETS constant (currently from App.tsx)
- `theme` (GlobalTheme) → Already has `useGlobalTheme()` hook, should be exposed as context hook
- `flashcards`, `lessons` → For import/export, already in FlashcardDataContext
- `onImportData` → Callback that requires transaction logic (complex computation)

**Migration Path:**
```tsx
// BEFORE
<SettingsPage
  settings={settings}
  onUpdateSetting={updateSetting}
  currentUser={currentUser}
  studySessions={studySessions}
  // ... 58 more props
/>

// AFTER
function SettingsPage({ initialTab }: { initialTab?: 'profile' | 'friends' }) {
  const { currentUser, studySessions, gameSessions, jlptSessions, stats, friends, ... } = useUserData();
  const { settings, onUpdateSetting, onReset } = useSettings();
  const { theme, applyPreset, resetTheme } = useGlobalTheme();
  // ... minimal props (only initialTab for nav)
}
```

**Complexity:** ⚠️ **HIGH** — 62 props but 56% already in context. Main challenge is extracting theme/settings management logic from App.tsx into composable hooks. Relatively straightforward refactor given modular internal structure (flashcard-settings, study-settings, etc. as separate components).

---

### 3. HomePage (src/components/pages/home-page.tsx)

**Total Props:** 24 (from HomePageProps interface, lines 56-82)

#### Prop Breakdown by Category

**Available in existing context (15):**
- `cards` → FlashcardDataContext
- `statsByLevel` → FlashcardDataContext (via getStatsByLevel())
- `currentUserId` → UserDataContext
- `getLessonsByLevel`, `getChildLessons` → FlashcardDataContext
- `userName` → UserDataContext (currentUser.displayName)
- `studySessions`, `gameSessions`, `jlptSessions` → UserDataContext
- `userJlptLevel` → UserDataContext (currentUser.jlptLevel)
- `onStartStudy`, `onStudyByLevel` → Navigation callbacks (setCurrentPage)
- `missions` (DailyMission[]) → AchievementContext
- `onShowAchievements` → AchievementContext callback

**Derived/computed (7):**
- `progress` (ProgressSummary) → Computed from studySessions + gameSessions + cards (requires useProgress hook)
- `dailyWords` → Computed from cards + user JLPT level (requires useDailyWords hook)
- `canAccessLocked` → Derived from UserDataContext
- `onNavigate` → Wrapper around setCurrentPage
- `onSpeak` → Audio synthesis callback (can stay as prop or move to custom hook)
- `onShowTour` → Navigation to onboarding state

**Navigation callbacks (2):**
- `onNavigate` → setCurrentPage
- `onShowTour` → setShowOnboarding state

**Needs new hook/context (0):**
- All required data already exists or is computed from existing contexts

**Migration Path:**
```tsx
// BEFORE
<HomePage
  statsByLevel={statsByLevel}
  cards={cards}
  onStartStudy={() => setCurrentPage('study')}
  getLessonsByLevel={filteredGetLessonsByLevel}
  userName={currentUser?.displayName}
  progress={progress}
  dailyWords={dailyWords}
  missions={missions}
  // ... 24 props total
/>

// AFTER
function HomePage() {
  const { cards, statsByLevel, getLessonsByLevel, getChildLessons } = useFlashcardData();
  const { currentUser } = useUserData();
  const { missions, openShowcase } = useAchievementContextOptional();
  const { setCurrentPage, setShowOnboarding } = useNavigation();
  const progress = useProgress(...);
  const dailyWords = useDailyWords(...);
}
```

**Complexity:** ✅ **MODERATE** — 24 props, but 62% already in context. Progress and dailyWords require hook extraction. Straightforward refactor with clear dependency map. Can be migrated independently.

---

### 4. GameHubPage (src/components/pages/game-hub-page.tsx)

**Total Props:** 11 (from GameHubPageProps interface, lines 116-134)

#### Prop Breakdown by Category

**Available in existing context (6):**
- `currentUser` → UserDataContext
- `flashcards` → FlashcardDataContext
- `kanjiCards` → FlashcardDataContext
- `jlptQuestions` → JLPTDataContext
- `settings` → useSettings hook
- `friends` → UserDataContext

**Derived/computed (3):**
- `getLessonsByLevel` → Derived from lessons (uses filteredGetLessonsByLevel in App.tsx)
- `getChildLessons` → Derived from lessons
- `onInviteFriend` → UserDataContext.sendGameInvitation

**Navigation callbacks (2):**
- `onCollapseSidebar`, `onExpandSidebar` → setSidebarCollapsed state (needs NavigationContext)
- `initialGame`, `initialJoinCode` → URL params from useUrlRouter

**Needs new hook/context (0):**
- `onSaveGameSession` → UserDataContext.addGameSession

**Migration Path:**
```tsx
// BEFORE
<GameHubPage
  currentUser={currentUser}
  flashcards={cards}
  kanjiCards={kanjiCards}
  jlptQuestions={jlptQuestions}
  getLessonsByLevel={filteredGetLessonsByLevel}
  getChildLessons={filteredGetChildLessons}
  settings={settings}
  friends={friendsWithUsers}
  onInviteFriend={sendGameInvitation}
  initialGame={initialGameType}
  initialJoinCode={initialGameJoinCode}
  onCollapseSidebar={() => setSidebarCollapsed(true)}
  onExpandSidebar={() => setSidebarCollapsed(false)}
  onSaveGameSession={addGameSession}
/>

// AFTER
function GameHubPage() {
  const { currentUser, sendGameInvitation, friendsWithUsers, addGameSession } = useUserData();
  const { flashcards: cards, kanjiCards, jlptQuestions, getLessonsByLevel, getChildLessons } = useFlashcardData();
  const { settings } = useSettings();
  const { initialGame, initialJoinCode } = useUrlRouter();
  const { setSidebarCollapsed } = useNavigation();
}
```

**Complexity:** ✅ **LOW** — Only 11 props, 55% already in context. Clear mapping to existing hooks. Can be migrated with no new context creation needed.

---

### 5. KaiwaPage (src/components/pages/kaiwa/index.tsx)

**Total Props:** 13 (from KaiwaPageProps interface in kaiwa-page-types.ts, lines 11-26)

#### Prop Breakdown by Category

**Available in existing context (9):**
- `settings` → useSettings hook
- `defaultQuestions` (KaiwaDefaultQuestion[]) → JLPTDataContext.kaiwaQuestions
- `kaiwaFolders` → JLPTDataContext.kaiwaFolders
- `advancedTopics`, `advancedQuestions` → JLPTDataContext
- `customTopics`, `customTopicQuestions` → JLPTDataContext

**Derived/computed (4):**
- `getFoldersByLevelAndTopic` → Derived from kaiwaFolders
- `getQuestionsByFolder` → Derived from defaultQuestions
- `getQuestionsByLevelAndTopic` → Derived from defaultQuestions + filters
- `getAdvancedQuestionsByTopic`, `getCustomTopicQuestionsByTopic` → Derived computations

**Navigation callbacks (0):**
- (None in props interface — page manages internal state via useKaiwaState)

**Needs new hook/context (0):**
- All data available in JLPTDataContext

**Migration Path:**
```tsx
// BEFORE
<KaiwaPage
  settings={settings}
  defaultQuestions={kaiwaQuestions}
  kaiwaFolders={kaiwaFolders}
  getFoldersByLevelAndTopic={getFoldersByLevelAndTopic}
  getQuestionsByFolder={getQuestionsByKaiwaFolder}
  getQuestionsByLevelAndTopic={getQuestionsByLevelAndTopic}
  advancedTopics={advancedKaiwaTopics}
  advancedQuestions={advancedKaiwaQuestions}
  getAdvancedQuestionsByTopic={getAdvancedKaiwaQuestionsByTopic}
  customTopics={customTopics}
  customTopicQuestions={customTopicQuestions}
  getCustomTopicQuestionsByTopic={getCustomTopicQuestionsByTopic}
/>

// AFTER
function KaiwaPage() {
  const { settings } = useSettings();
  const {
    kaiwaQuestions,
    kaiwaFolders,
    advancedKaiwaTopics,
    advancedKaiwaQuestions,
    customTopics,
    customTopicQuestions,
    getQuestionsByKaiwaFolder,
    getAdvancedKaiwaQuestionsByTopic,
    getCustomTopicQuestionsByTopic
  } = useJLPTData();
  
  const state = useKaiwaState(); // Already decoupled
}
```

**Complexity:** ✅ **LOW** — Only 13 props, 69% in context, already uses decoupled useKaiwaState hook. Page is well-structured for migration. Only requires exporting helper functions from JLPTDataContext.

---

### 6. GrammarStudyPage (src/components/pages/grammar-study-page.tsx)

**Total Props:** 8 (from GrammarStudyPageProps interface, lines 11-19)

#### Prop Breakdown by Category

**Available in existing context (6):**
- `grammarCards` → FlashcardDataContext
- `lessons` → FlashcardDataContext (grammar-specific)
- `onGoHome` → Navigation callback (setCurrentPage)
- `onUpdateGrammarCard` → FlashcardDataContext
- `settings` → useSettings hook (optional)

**Derived/computed (2):**
- `getLessonsByLevel` → Derived from grammar lessons
- `getChildLessons` → Derived from grammar lessons hierarchy

**Navigation callbacks (1):**
- `onGoHome` → setCurrentPage('home')

**Needs new hook/context (0):**
- All needed in FlashcardDataContext or useSettings

**Migration Path:**
```tsx
// BEFORE
<GrammarStudyPage
  grammarCards={grammarCards}
  lessons={grammarLessons}
  getLessonsByLevel={getGrammarLessonsByLevel}
  getChildLessons={getGrammarChildLessons}
  onGoHome={() => setCurrentPage('home')}
  settings={settings}
  onUpdateGrammarCard={updateGrammarCard}
/>

// AFTER
function GrammarStudyPage() {
  const { grammarCards, grammarLessons, getGrammarLessonsByLevel, getGrammarChildLessons, updateGrammarCard } = useFlashcardData();
  const { settings } = useSettings();
  const { setCurrentPage } = useNavigation();
}
```

**Complexity:** ✅ **VERY LOW** — Only 8 props, 75% in context, straightforward derivations. Can be migrated in under 10 lines of code. No new context needed.

---

### 7. NotificationsPage (src/components/pages/notifications-page.tsx)

**Total Props:** 7 (from NotificationsPageProps interface, lines 39-47)

#### Prop Breakdown by Category

**Available in existing context (7):**
- `classroomNotifications` → UserDataContext
- `friendNotifications` → UserDataContext
- `onMarkClassroomRead` → UserDataContext.markClassroomRead
- `onMarkAllClassroomRead` → UserDataContext.markAllClassroomRead
- `onMarkFriendRead` → UserDataContext.markFriendRead
- `onMarkAllFriendRead` → UserDataContext.markAllFriendRead
- `onNavigate` → Navigation callback (setCurrentPage)

**Derived/computed (0):**
- (None — all data is direct)

**Navigation callbacks (1):**
- `onNavigate` → setCurrentPage

**Needs new hook/context (0):**
- All in UserDataContext

**Migration Path:**
```tsx
// BEFORE
<NotificationsPage
  classroomNotifications={classroomNotifications}
  friendNotifications={friendNotifications}
  onMarkClassroomRead={markClassroomRead}
  onMarkAllClassroomRead={markAllClassroomRead}
  onMarkFriendRead={markFriendRead}
  onMarkAllFriendRead={markAllFriendRead}
  onNavigate={setCurrentPage}
/>

// AFTER
function NotificationsPage() {
  const {
    classroomNotifications,
    friendNotifications,
    markClassroomRead,
    markAllClassroomRead,
    markFriendRead,
    markAllFriendRead
  } = useUserData();
  const { setCurrentPage } = useNavigation();
}
```

**Complexity:** ✅ **TRIVIAL** — Only 7 props, 100% available in existing contexts. Can be migrated in < 5 minutes. Serves as proof-of-concept for the refactoring approach.

---

## Summary Table: Migration Complexity & Impact

| Page | Props | In Context | Derived | Callbacks | New Context | Complexity | Effort |
|------|-------|-----------|---------|-----------|------------|-----------|--------|
| NotificationsPage | 7 | 100% | 0% | 1 | None | Trivial | ⭐ |
| GrammarStudyPage | 8 | 75% | 25% | 1 | None | Very Low | ⭐⭐ |
| HomePage | 24 | 62% | 29% | 2 | None | Moderate | ⭐⭐⭐ |
| KaiwaPage | 13 | 69% | 31% | 0 | None | Low | ⭐⭐ |
| GameHubPage | 11 | 55% | 27% | 2 | None | Low | ⭐⭐ |
| SettingsPage | 62 | 56% | 24% | 2 | useGlobalTheme | High | ⭐⭐⭐⭐ |
| CardsPage | 90+ | 55% | 22% | 1 | CardManagementContext? | Extreme | ⭐⭐⭐⭐⭐ |

---

## Blocked Dependencies & Integration Requirements

### Required New/Enhanced Contexts & Hooks

1. **NavigationContext** (new)
   - Replaces scattered callbacks like `onNavigate`, `setCurrentPage`, `onGoHome`
   - Should expose: `setCurrentPage()`, `setSidebarCollapsed()`, `setShowOnboarding()`
   - Usage impact: HomePage, SettingsPage, GrammarStudyPage, GameHubPage, NotificationsPage (5 pages)

2. **useProgress()** hook (extract from App.tsx)
   - Currently computed in App.tsx lines 433-441
   - Required for: HomePage
   - Can be added to FlashcardDataContext or left as standalone

3. **useDailyWords()** hook (extract from App.tsx)
   - Currently computed in App.tsx lines 390-395
   - Required for: HomePage
   - Can be added to FlashcardDataContext or left as standalone

4. **useGlobalTheme()** hook (already exists)
   - Already exposed from useGlobalTheme in app
   - Required for: SettingsPage
   - Just needs to be called directly in SettingsPage instead of receiving props

5. **CardManagementContext** (optional)
   - Consolidates `useLectures()`, `useTestTemplates()`, `useCustomTopics()`, etc.
   - Required for: CardsPage (if consolidating 8+ internal hooks)
   - Alternative: Leave as internal hooks, just eliminate prop drilling for context-available data

### Derived Computation Functions

These need to become reusable hooks or context methods:

1. **useLessonFiltering()** (new)
   - Takes: lessons, canAccessLocked, currentUser.id
   - Returns: getLessonsByLevel, getChildLessons (with hidden/locked filtering)
   - Usage: HomePage, GrammarStudyPage, KaiwaPage, GameHubPage (4 pages)
   - Current location: App.tsx lines 404-428

2. **useKaiwaHelpers()** (new)
   - Takes: kaiwaQuestions, kaiwaFolders, advancedKaiwaQuestions, customTopics, customTopicQuestions
   - Returns: getFoldersByLevelAndTopic, getQuestionsByFolder, etc.
   - Usage: KaiwaPage (1 page, but heavily used)

---

## Recommended Migration Strategy

### Phase 1: Foundation (Weeks 1-2)

1. **Create NavigationContext** to centralize all page routing state
   - Move `currentPage`, `setSidebarCollapsed`, `showOnboarding` from App.tsx
   - Expose via `useNavigation()` hook
   - Impact: 6 pages can eliminate callback props

2. **Extract useProgress() and useDailyWords() hooks** from App.tsx
   - Move computation logic into separate modules
   - Import directly into HomePage
   - Impact: HomePage eliminates 2 derived props

3. **Extract useLessonFiltering()** from App.tsx
   - Consolidates lesson filtering logic (currently lines 404-428)
   - Used by 4+ pages
   - Impact: HomePage, GrammarStudyPage, GameHubPage, KaiwaPage

### Phase 2: Easy Wins (Weeks 2-3)

1. **Migrate NotificationsPage** (7 props → 0 props)
   - Reference implementation: Direct context consumption
   - PR size: ~20 lines changed

2. **Migrate GrammarStudyPage** (8 props → 0 props)
   - Reference implementation: Derived hooks
   - PR size: ~25 lines changed

3. **Migrate KaiwaPage** (13 props → 0 props)
   - Reference implementation: Complex context access
   - PR size: ~30 lines changed

### Phase 3: Moderate Complexity (Weeks 3-4)

4. **Migrate GameHubPage** (11 props → 0 props)
   - Requires NavigationContext from Phase 1
   - PR size: ~35 lines changed

5. **Migrate HomePage** (24 props → 0 props)
   - Requires NavigationContext + extracted hooks from Phase 1
   - Most complex HomePage structure, heaviest child component tree
   - PR size: ~50 lines changed

### Phase 4: Heavy Refactoring (Weeks 4-6)

6. **Migrate SettingsPage** (62 props → 5 props)
   - May require extracting theme logic from useGlobalTheme
   - Consider breaking into separate context or theme hook
   - PR size: ~80 lines changed

7. **Migrate CardsPage** (90+ props → minimal)
   - Likely requires CardManagementContext consolidation
   - OR keep 8+ internal hooks but eliminate context prop drilling
   - Largest refactor, highest risk
   - PR size: ~150+ lines changed

### Phase 5: Integration & Testing (Week 6-7)

- Verify all context dependencies
- Remove redundant prop drilling from App.tsx
- Measure bundle size changes
- Performance testing (re-render impact)

---

## Risk Assessment & Mitigation

### Risk 1: Context Re-render Cascades
**Problem:** If NavigationContext or UserDataContext emit too frequently, all consuming pages re-render  
**Mitigation:**
- Use useMemo to memoize context value in context providers
- Split contexts by access pattern (see: UserDataContext decomposition from earlier report)
- Add React DevTools Profiler regression tests

### Risk 2: Circular Dependency: Navigation ← → Page State
**Problem:** Pages might need to coordinate navigation with their internal state  
**Mitigation:**
- NavigationContext should be "write-only" (pages can setCurrentPage)
- Pages maintain their own UI state (modals, tabs, etc.)
- Document clear separation between Navigation state and UI state

### Risk 3: Loss of Prop Validation
**Problem:** With prop drilling, TypeScript caught missing props. Hooks won't.  
**Mitigation:**
- Add JSDoc @returns types to all custom hooks
- Ensure each hook's return type is explicit (not `any`)
- Add linting rule for unused context values

### Risk 4: Bundle Size Impact
**Problem:** Extracting more hooks might increase code size  
**Mitigation:**
- Re-run bundle size analysis after Phase 1
- Tree-shake any unused context exports
- Consider lazy-loading contexts for non-core pages

---

## Unresolved Questions

1. **CardManagementContext consolidation:** Should CardsPage's 8+ internal hooks (useLectures, useTestTemplates, useCustomTopics, useGrammarCards, etc.) be consolidated into a single context, or kept as individual hooks with reduced prop drilling?
   - **Implication:** Affects complexity rating and migration path for CardsPage
   - **Decision needed:** Architecture → Recommend 1 consolidated context to reduce prop count from 90 → 30

2. **Theme management split:** Should useGlobalTheme be split into a separate ThemeContext or kept unified in App?
   - **Implication:** SettingsPage needs either theme props or direct hook access
   - **Decision needed:** If kept unified, SettingsPage must call useGlobalTheme directly (easy); if split, new context needed

3. **useProgress() location:** Should useProgress be in FlashcardDataContext, UserDataContext, or standalone hook?
   - **Implication:** Affects HomePage dependency structure
   - **Decision needed:** Recommend standalone hook in hooks/ directory (most flexible)

4. **Navigation context scope:** Should NavigationContext include URL state (via useUrlRouter), or keep them separate?
   - **Implication:** GameHubPage needs either NavigationContext.initialGame or to call useUrlRouter directly
   - **Decision needed:** Keep separate; NavigationContext = App-level routing only, useUrlRouter = URL param reading

---

## References

- **Context Inventory:** `/plans/260326-1021-maintainability-refactoring/research/researcher-02-contexts-app-structure.md`
- **App.tsx Page Rendering:** `/src/App.tsx` lines 500-890 (all page instantiations)
- **Page Type Definitions:** `/src/components/pages/settings/settings-types.ts`, `/src/components/pages/kaiwa/kaiwa-page-types.ts`, etc.

