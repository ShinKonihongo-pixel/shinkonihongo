# Research Report: App.tsx Monolith & Component Pattern Analysis

**Date:** 2026-03-26
**Focus:** Structural complexity, prop drilling, state proliferation, memo optimization gaps

---

## 1. AppContent Function State Complexity

**Location:** App.tsx lines 207-340

### State Calls (useState): 11
- `currentPage`: Page type
- `initialFilterLevel`: JLPTLevel | 'all'
- `initialGameType`: GameType | null
- `initialGameJoinCode`: string | null
- `editingLectureId`: string | undefined
- `editingLectureFolderId`: string | undefined
- `editingLectureLevel`: JLPTLevel | undefined
- `isChatOpen`: boolean
- `isAiChatOpen`: boolean
- `sidebarCollapsed`: boolean
- `isSearchOpen`: boolean

### Context Destructures: 4 hooks
- `useUserData()` → userData (36+ properties: currentUser, users, logout, etc.)
- `useFlashcardData()` → flashcardData (continues at line 338+)
- `useJLPTData()` → jlptData
- `useAchievementContextOptional()` → achievementCtx

**Finding:** AppContent destructures 36+ userData properties at lines 295-336, indicating massive prop cascade surface. Each destructured property becomes a potential prop passed downward.

---

## 2. HomePage Prop Injection (lines 550-593)

**Total Props to HomePage: 21**

| Source | Props |
|--------|-------|
| State | `statsByLevel`, `cards`, callbacks (5) |
| Destructured `userData` | `canAccessLocked`, `currentUser?.displayName/username/id/jlptLevel` (5) |
| Destructured `achievementCtx` | `missions` object + callbacks (3) |
| Closures | `onSpeak` (SpeechSynthesis inline) (1) |
| Other | `getLessonsByLevel`, `getChildLessons`, `progress`, `dailyWords`, `studySessions`, `gameSessions`, `jlptSessions` (6) |

**Critical Issue:** HomePage directly receives mission data from achievementCtx via object destructuring (`missions: { missions, allCompleted, bonusClaimed, onClaimBonus }`). This creates tight coupling.

---

## 3. VocabularyTab vs GrammarTab: State Pattern Comparison

### VocabularyTab (lines 1-70)
**useState Count: 13**
- `navState`: FlashcardNavState ({ type: 'root' | ... })
- Form state: `showForm`, `editingCard`, `editingLessonId`, `editingLessonName`, `addingLesson`, `newLessonName`, `deleteLessonTarget`
- Data ops: `seeding`, `isExporting`, `isImporting`, `importStatus`
- Drag-drop: `draggedLesson`, `dragOverLesson`
- Form sub-tabs: `formSubTab`, `formKanjiText`

### GrammarTab (lines 1-70)
**useState Count: 12**
- `navState`: NavState (discriminated union: 'root' | 'level' | 'parent' | 'child')
- Form state: `showForm`, `editingCard`, `showAddLesson`, `newLessonName`, `editingLesson`
- Data ops: `isSeeding`, `isExporting`, `isImporting`
- Drag-drop: `draggedLesson`, `dragOverLesson`

**Difference:** VocabularyTab has extra form sub-tab state (`formSubTab`, `formKanjiText`) for kanji analysis integration. Both use identical drag-drop pattern but GrammarTab uses discriminated union for navState (better type safety).

---

## 4. React.memo Adoption

**Files Using React.memo: 72 found**

**Primary Pattern Locations:**
- grammar-card.tsx, image-word-game-play.tsx, word-match-play.tsx, kanji-battle-play.tsx
- Type definition files (mostly empty)
- Game state managers (quiz-battle-types, kanji-drop-types)

**Gap:** memo() usage is scattered across game components but **NOT systematically applied to high-frequency render targets** (HomePage, CardsPage, StudyPage). Grammar-card.tsx has memo but likely receives non-memoized callbacks from parent.

---

## 5. Inline style={{}} Patterns

**Top 10 Files by Count:**
1. salary-slip.tsx: 61
2. teacher-schedule.tsx: 60
3. report-settings-modal.tsx: 55
4. teacher-add-modal.tsx: 50
5. teaching-log.tsx: 49
6. detail-view.tsx (salary): 33
7. salary-view.tsx: 29
8. listening-settings-modal.tsx: 28
9. salary-edit-modal.tsx: 27
10. branch-create-modal.tsx: 23

**Critical Issue:** salary-slip.tsx (61 instances) and teacher-schedule.tsx (60 instances) are **NOT study-related** but indicate system-wide anti-pattern. These create new object references on every render, breaking React.memo effectiveness.

---

## Architecture Debt Summary

| Issue | Severity | Impact |
|-------|----------|--------|
| AppContent state explosion (11 useState) | **HIGH** | Page-level rerenders cascade to all children |
| Destructuring >36 userData props | **HIGH** | Prop drilling; tight coupling to userData shape |
| HomePage receives 21 props | **HIGH** | Refactor candidate for custom hook |
| Inline style={{}} (60+ in salary/teacher) | **MEDIUM** | Breaks React.memo; wastes renders |
| Discriminated union NavState only in GrammarTab | **MEDIUM** | Type safety inconsistency; VocabularyTab uses weaker pattern |
| memo() applied sporadically (72 files) | **MEDIUM** | Gaps in high-freq components (HomePage, CardsPage) |

---

## Unresolved Questions

1. How many renders occur per page navigation due to AppContent state spread?
2. Does HomePage actually use all 21 props or are some dead code?
3. Are salary/teacher components actively used or legacy?
4. Which components re-render unnecessarily when `canAccessLocked` changes?
