# Page Component Prop Dependencies Analysis
**React Router v6 Migration Research**

## Summary
Props flow shows **2 migration tiers**: easy (minimal props) vs complex (dense prop threading). No pages currently use dedicated hooks for data fetching; all receive props from App.tsx. Major inline callback closures at App.tsx render require special handling post-migration.

---

## 1. HomePage (21 props) — Moderate Complexity

**Props Source Breakdown:**
- Data: `statsByLevel`, `cards`, `getLessonsByLevel`, `getChildLessons` → flashcard context
- Callbacks: `onStartStudy`, `onStudyByLevel`, `onCustomStudy` → state setters (setCurrentPage)
- Sub-component: DailyWords gets 10+ additional props (progress, streak, modal handlers)

**Migration Path:** Extract to `useHomeData()` hook + navigation via router.

---

## 2. CardsPage (29 props) — HIGH COMPLEXITY

**Props Grouped:**
1. **Flashcard ops** (4): cards, onAdd/Update/Delete
2. **Lesson ops** (6): lessons, getLessonsByLevel, getChildLessons, onAdd/Update/Delete
3. **JLPT mgmt** (14): questions, folders, onAdd/Update/Delete, getFolders, getQuestions
4. **Kaiwa mgmt** (14): questions, folders, onAdd/Update/Delete, getFolders, getQuestions
5. **Advanced Kaiwa** (8): topics, questions, onAdd/Update/Delete
6. **User mgmt** (4): users, onUpdateRole, onDeleteUser, onUpdateVipExpiration
7. **Lesson control** (3): onToggleLock, onToggleHide, onReorderLessons
8. **Lecture nav** (1): onNavigateToLectureEditor

**Critical Inline Closures Found (App.tsx 544-566):**
```
onAddJLPTQuestion: async (data) => { await addJLPTQuestion(data, currentUser.id); }
onAddKaiwaQuestion: async (data) => { const result = await addKaiwaQuestion(data, currentUser.id); }
onAddJLPTFolder: async (name, level, category) => { await addJLPTFolder(name, level, category, currentUser.id); }
onAddKaiwaFolder: async (name, level, topic) => { await addKaiwaFolder(name, level as any, topic, currentUser.id); }
onNavigateToLectureEditor: (lectureId, folderId, level) => { setEditingLectureId(lectureId); ... setCurrentPage('lecture-editor'); }
```

**Migration Challenge:** These closures capture `currentUser.id` and `setCurrentPage`. Post-migration, must either:
- A. Pass currentUser via context + use `useNavigate()` hook, OR
- B. Refactor to pass raw data + handle IDs inside component using `useUserData()` hook

**Recommendation:** DEFER CardsPage migration—refactor to accept `userId` param separately + remove closure dependency.

---

## 3. Light Pages (0-3 props) — EASY MIGRATION

**Immediate candidates:**
- `ConjugationTrainerPage()` → **0 props** (fully self-contained)
- `ListeningPracticePage()` → **0 props**
- `BranchManagementPage({ users })` → **1 prop** (single data source)
- `CenterMembersPage({ users })` → **1 prop**
- `ChatPage({ currentUser })` → **1 prop** (user context available)
- `ClassroomPage({ users })` → **1 prop**
- `CenterDashboardPage({ currentUser, users, onNavigate })` → **3 props** (user + navigate via hook)
- `CenterLandingPage({ center, navigate, isLoggedIn, isMember })` → **4 props** (mostly derived)
- `ProgressPage({ progress, stats, onStartStudy })` → **3 props** (data + 1 callback)
- `LoginPage({ onLogin, onRegister })` → **2 props** (can become custom hook)

---

## 4. Medium Pages (6-10 props) — CONDITIONAL MIGRATION

**Study Pages (mostly stateless):**
- `GrammarStudyPage`: 6 props (cards, lessons, getters, settings, onUpdate) ✅ Safe
- `KanjiStudyPage`: 5 props (similar) ✅ Safe
- `ReadingPracticePage`: 5 props ✅ Safe
- `StudyPage`: 8 props (cards, settings, onUpdate, onSaveStudy) ✅ Safe
- `ExercisePage`: 3 props (exercises, flashcards, onGoHome) ✅ Safe

**Game Pages (lazy-loaded):**
- `QuizGamePage`, `BingoPage`, `GoldenBellPage` → passed 3-5 props from GameHubPage
- Can remain self-contained OR pull from context

---

## 5. Inline Callback Closure Dependencies

**Critical Pattern (App.tsx 544-566):**
App wraps callbacks with `currentUser.id`:
```tsx
onAddJLPTQuestion={(data) => addJLPTQuestion(data, currentUser.id)}
onAddKaiwaFolder={(name, level, topic) => addKaiwaFolder(name, level, topic, currentUser.id)}
```

**Impact:** CardsPage + AdminPage cannot migrate until closures removed.

**Post-Migration Options:**
1. Move closures into component (requires `useUserData()` hook)
2. Separate `createdBy` as parameter in form submission
3. Use custom hook wrapper: `useJLPTQuestion()` encapsulates closure

---

## Migration Roadmap

### Phase 1 (No Dependencies)
- ConjugationTrainerPage, ListeningPracticePage, BranchManagementPage, CenterMembersPage
- ChatPage (upgrade: drop currentUser prop, use context hook)

### Phase 2 (Single Data Source)
- Study pages (Grammar, Kanji, Reading, Study)
- Game pages (already lazy-loaded)
- ProgressPage, PricingPage

### Phase 3 (Closure Refactoring Required)
- **CardsPage** — MUST refactor closures first
- **AdminPage** — similar callback wrapping issues
- Depends on hook extraction pattern finalization

---

## Key Findings

✅ **No pages use custom data hooks** — all receive props from App.tsx (monolithic threading)

❌ **Closure closures at App.tsx render** — 5+ callbacks capture `currentUser.id`; blocking migration

⚠️ **CardsPage is migration bottleneck** — 29 props, complex callback wrapping, 8 sub-tabs

✅ **Study pages are migration-ready** — stateless, minimal prop threading

---

## Unresolved Questions

1. Which routing strategy post-migration: file-based (Vite/TanStack Router) vs dynamic route registration?
2. Will closures move into component hooks or remain in layout wrapper?
3. Timeline for CardsPage refactoring vs. parallel study-page rollout?
