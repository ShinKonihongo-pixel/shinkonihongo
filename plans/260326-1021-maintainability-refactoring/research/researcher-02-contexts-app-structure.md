# Context Provider & App.tsx Structure Analysis

**Date:** 2026-03-26
**Scope:** Maintainability refactoring of context providers and App.tsx nesting patterns

---

## App.tsx Structure (Imports, State, Providers, Routing)

**File size:** ~960 LOC. Dual responsibilities:
- Outer `App()`: Wraps only UserDataProvider → AppInner()
- Inner `AppInner()`: Calls urlRouter, centerData, then conditional renders (login/center/app)
- `AppContent()`: Main app UI logic — 800+ LOC of page routing + permission checks

**State management (AppContent):**
- 10 useState hooks: currentPage, initialFilterLevel, initialGameType, initialGameJoinCode, editingLectureId, editingLectureFolderId, editingLectureLevel, isChatOpen, isAiChatOpen, sidebarCollapsed, isSearchOpen
- 3 useEffect hooks: game join params (mount), URL→state bridge, state→URL bridge

**Key structural issues:**
- AppContent destructures from 4 contexts (userData, flashcardData, jlptData, achievementCtx) but only flashcardData & jlptData are wrapped at parent level
- Game join parameter routing hardcoded in useEffect (lines 231–264) — 4 game types handled inline
- Permission checks scattered throughout 80+ page render blocks (lines 750–957)
- Floating chat/AI buttons + AchievementToast/Showcase/Celebration all lazy-loaded at bottom

---

## Context Provider Inventory

| Name | LOC | Key Concerns |
|------|-----|--------------|
| **user-data-context.tsx** | 202 | **Bloated:** 8 sub-hooks (useAuth, useUserHistory, useFriendships, useBadges, useGameInvitations, useClassroomNotifications, useFriendNotifications). Aggregates auth + user history + social + notifications. Props drilling to 80+ pages. |
| **flashcard-data-context.tsx** | 110 | Cards CRUD + study progress. Tightly coupled to grammar/kanji/vocab data. |
| **jlpt-data-context.tsx** | 101 | JLPT questions/results. Depends on flashcard context. |
| **achievement-context.tsx** | 219 | **Second bloat:** Achievements + daily missions + celebration logic. 5 sub-hooks aggregated. |
| **listening-settings-context.tsx** | 158 | Audio playback prefs + vocab state. Large due to playback controls. |
| **reading-settings-context.tsx** | 100 | Reading UI state (font size, line height, furigana toggle). |
| **kaiwa-data-context.tsx** | 106 | Conversation practice. Duplicate flashcard structure. |
| **grammar-data-context.tsx** | 49 | Grammar card CRUD. Minimal. |
| **vocab-data-context.tsx** | 74 | Vocabulary aggregation. Minimal. |
| **kanji-data-context.tsx** | 50 | Kanji card CRUD. Minimal. |
| **jlpt-question-context.tsx** | 70 | JLPT question structure. Minimal. |
| **reading-data-context.tsx** | 43 | Reading article data. Minimal. |
| **custom-topic-context.tsx** | 43 | Custom topic creation. Minimal. |
| **exercise-data-context.tsx** | 32 | Exercise mode state. Minimal. |
| **center-context.tsx** | 71 | Center membership + roles. Used conditionally. |

**Total: 15 contexts, 1428 LOC**

---

## Provider Nesting Order (App.tsx lines 81–199)

```
App()
  ↓ UserDataProvider
AppInner()
  [Login guard → CenterRouter → AppContent wrapping]
  ↓ FlashcardDataProvider (levelFilter)
    ↓ JLPTDataProvider (currentUserId, levelFilter)
      ↓ AchievementProvider
        ↓ ReadingSettingsProvider
          ↓ ListeningSettingsProvider
            [Conditional CenterProvider wrapping]
AppContent()
```

**Issues:**
- FlashcardDataProvider + JLPTDataProvider always created even for non-study pages (game hub, pricing, analytics)
- AchievementProvider not passed props — created at nesting but used deep in AppContent
- CenterProvider wraps conditionally inside the nesting pyramid (lines 197–199)
- Settings contexts (reading/listening) wrap all pages despite only used on 2 pages

---

## Permission Check Patterns in App.tsx

**Lines 750–957: ~200 lines of repeated guards**

Pattern 1 — Admin pages (director/branch_admin/super_admin):
```tsx
{currentPage === 'branches' && currentUser &&
  (currentUser.role === 'director' || currentUser.role === 'branch_admin' || currentUser.role === 'super_admin') && (
    <BranchManagementPage users={users} />
  )}
```
**Found 3 instances** (branches, teachers, salary)

Pattern 2 — Teacher pages (main_teacher/part_time_teacher/assistant):
```tsx
{currentPage === 'my-teaching' && currentUser &&
  (currentUser.role === 'main_teacher' || currentUser.role === 'part_time_teacher' || currentUser.role === 'assistant') && (
    <MyTeachingPage />
  )}
```
**Found 1 instance**

Pattern 3 — Super admin only:
```tsx
{currentPage === 'permissions' && currentUser && currentUser.role === 'super_admin' && (
  <RolePermissionsPage />
)}
```
**Found 1 instance**

**Anti-pattern:** No guard helper function. No role-based route protection. Logic embedded in render blocks.

---

## Context Dependencies & Data Flow

**Critical dependency chain:**
1. UserDataProvider → users[], currentUser, auth state
2. FlashcardDataProvider → depends on currentUser ID from UserDataProvider
3. JLPTDataProvider → depends on currentUser ID & levelFilter
4. AchievementProvider → reads from jlptData & flashcardData
5. ReadingSettingsProvider → reads currentUser.displayName for UI state

**Unused properties passed deep:**
- `users` array passed to 7+ pages but only used in 4 (classroom, branches, teachers, salary, center-members, center-dashboard, notifications)
- `levelFilter` derived in AppContent but contexts don't expose filter mutation — creates stale state risk

---

## Recommendations for Consolidation

### 1. Split UserDataContext (202 LOC → 2 contexts)
- **AuthContext:** currentUser, isLoggedIn, login, logout, register, updateUserRole, deleteUser, etc. (60 LOC)
- **SocialContext:** friendships, badges, notifications (130 LOC)
  - Rationale: 80% of pages need auth only; social = optional feature for subset of pages
  - Dependency: SocialContext wraps inside AuthContext

### 2. Split AchievementContext (219 LOC → 2 contexts)
- **AchievementDataContext:** achievements CRUD (80 LOC)
- **DailyMissionsContext:** daily missions + celebration overlay (100 LOC)
  - Rationale: Missions are engagement feature, not core UX; avoid blanket re-renders

### 3. Lazy-load optional contexts
- Move ReadingSettingsProvider, ListeningSettingsProvider into respective page components
- Move CenterProvider into center route handler (already conditional, but nested deep)
- Rationale: Reduce bundle weight for non-reading users

### 4. Extract permission checks into utility function
```tsx
const canAccessPage = (page: Page, role: UserRole | undefined): boolean => {
  const roleChecks: Record<Page, (role: UserRole) => boolean> = {
    branches: r => ['director', 'branch_admin', 'super_admin'].includes(r),
    teachers: r => ['director', 'branch_admin', 'super_admin'].includes(r),
    salary: r => ['director', 'branch_admin', 'super_admin'].includes(r),
    'my-teaching': r => ['main_teacher', 'part_time_teacher', 'assistant'].includes(r),
    permissions: r => r === 'super_admin',
    // ... etc
  };
  return !roleChecks[page] || roleChecks[page](role);
};
```
- Replace 7 inline guards with single conditional: `{currentPage === 'branches' && currentUser && canAccessPage('branches', currentUser.role) && <Page />}`

### 5. Consolidate game join routing
- Extract lines 231–264 into custom hook: `useGameJoinParams()` returning `{ gameType, joinCode }`
- Rationale: URL parameter parsing is orthogonal to AppContent logic

### 6. Props consolidation
- Instead of passing `users`, `studySessions`, `gameSessions`, `jlptSessions`, `userStats` deep, expose via hooks in each page component
- Pages that need users: export `useUsersData()` from UserDataContext
- Rationale: Reduce prop drilling, enable page-level tree-shaking

---

## Unresolved Questions

1. **CenterProvider conditional nesting (line 197):** Why wrap conditionally at pyramid center instead of at AppContent root? Does it need access to parent contexts or can it be a sibling?
2. **levelFilter statefulness:** AppContent derives levelFilter but contexts don't expose setter. Is this intentional? Should contexts pull from URL params?
3. **Achievement re-renders:** AchievementProvider uses useMemo but depends on 3+ contexts. Measure actual re-render impact before splitting.
