# Service Layer & Hooks Architecture Research
**Date:** 2026-03-26 | **Scope:** Firestore patterns & hook design

---

## Good Patterns (to replicate)

### use-flashcards.ts (110 LOC)
**Golden standard for hook architecture:**
- Delegates ALL Firebase ops to `firestoreService.*` functions
- Clean separation: UI logic (React state) vs data access (service layer)
- Real-time subscription via `firestoreService.subscribeToFlashcards()`
- Error handling with try-catch, user-facing error messages
- Background async work: Kanji analysis fire-and-forget pattern
- Helper methods: `getCard()`, `getCardsByLevel()`, `getStatsByLevel()`
- Testable: Service can be mocked without touching hook

### Firestore service barrel export (174 lines)
**Well-organized domain separation:**
- 15+ domain modules: flashcard, grammar, lesson, user, JLPT, kaiwa, custom-topic, kanji, etc.
- Each module exports only its CRUD functions
- No direct Firebase imports in hooks/components
- Centralized collection names via `collections.ts`
- Consistent naming: `getAllX()`, `subscribeToX()`, `addX()`, `updateX()`, `deleteX()`

---

## Bad Patterns (to fix)

### use-exercises.ts (93 LOC)
**Direct Firebase coupling—violates service layer:**
```typescript
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
```
- Firebase imports INSIDE hook (tight coupling)
- Query logic duplicated (can spread to other hooks)
- Hard to test: requires mock Firestore
- No dedicated `exercise-service.ts` to abstract Firestore
- Error handling returns booleans (silent failures)

**Action:** Create `src/services/firestore/exercise-service.ts` + refactor hook to delegate

### use-settings.ts (>300 LOC measured via first 100)
**God hook anti-pattern:**
- Manages localStorage persistence + state + validation
- 27 AI profiles with custom settings
- 40+ setting fields in AppSettings interface
- Frame styles, font sizes, visibility toggles, colors
- Mixing concerns: UI state + persistent config + validation

**Action:** Split into:
- `useSettings()` → localStorage sync + app-level toggles
- `useFlashcardSettings()` → frame/font/color UI logic
- `useAISettings()` → per-AI custom settings management
- `useGameSettings()` → game-specific config

---

## Role/Permission System

### Role Hierarchy (user.ts lines 2-39)
```
super_admin (100)
  ├─ director (90)
  ├─ branch_admin (70)
  │   ├─ main_teacher (50)
  │   ├─ part_time_teacher (40)
  │   └─ assistant (30)
  ├─ admin (60, legacy)
  ├─ vip_user (20)
  └─ user (10)
```

### Permission Functions
- `hasPermission(userRole, requiredRole)`: level-based check
- `isTeacher(role)`: returns true for {main_teacher, part_time_teacher, assistant}
- `isAdminLevel(role)`: requires branch_admin+

**Design note:** Level-based system allows for future granularity (e.g., feature flags)

---

## Key Interfaces

### User Model (lines 69-85)
- **Core:** id, username, role, createdAt
- **Profile:** displayName, email, avatar, profileBackground
- **Study:** jlptLevel (N5-N1)
- **Branch:** branchId, branchIds (for multi-branch directors)
- **VIP:** vipExpirationDate (auto-downgrade on expiration)

### CurrentUser (87-97)
Minimal auth token payload: id, username, role, displayName, avatar, jlptLevel, branch fields

### Statistics (100-148)
- **StudySession:** cardsStudied, correctCount, duration, lessonIds
- **GameSession:** rank, totalPlayers, score, medals
- **JLPTSession:** level, category, correctCount, duration
- **UserStats:** aggregates above + medal tracking
- **UserLevel:** calculated from XP (study sessions, games, medals, study time)

---

## Recommendations

### Priority 1: Eliminate Firebase imports from hooks
1. Create `exercise-service.ts` (model after flashcard-service)
2. Refactor `use-exercises.ts` to use service layer
3. Audit other hooks for direct Firebase imports (use Grep: `from 'firebase/firestore'`)

### Priority 2: Service cleanup
1. Ensure ALL hooks use `firestoreService.*` exclusively
2. Consolidate duplicated query logic (e.g., orderBy, where clauses)
3. Document collection naming convention in `collections.ts`

### Priority 3: Hook restructuring
1. Split `use-settings.ts` into focused sub-hooks
2. Extract localStorage sync into `useLocalStorage<T>(key)` utility
3. Move validation logic to `types/validators.ts`

### Priority 4: Testing enablement
1. Create service mocks in `__mocks__/services/firestore.ts`
2. Export service interfaces from each module
3. Document mock strategy in `/docs`

---

## Unresolved Questions

- Are there other hooks directly importing Firebase (besides use-exercises.ts)?
- Does `use-settings.ts` need localStorage or Firestore persistence?
- Should role hierarchy be stored in Firestore or remain constant in code?
- Are custom topic/kaiwa services complete or still WIP?
