# Phase 1: Quick Wins

**Date:** 2026-03-26 | **Priority:** P0 | **Status:** DONE
**Completed:** 2026-03-26 | **Estimated effort:** 2-3 days | **Risk:** Low

---

## Context

- [Service Layer Research](./research/researcher-01-service-patterns.md)
- [Context & App.tsx Research](./research/researcher-02-contexts-app-structure.md)

## Overview

Eliminate highest-impact code smells with minimal structural change. Three independent workstreams that can be done in parallel.

## Key Insights

- `use-flashcards.ts` is the golden standard: delegates ALL Firebase ops to service layer
- 3 hooks import Firebase directly, violating architecture: exercises (93), reading (144), listening (306)
- `use-settings.ts` (602 LOC) mixes 40+ fields, localStorage, AI profiles in one hook
- App.tsx has 7 repeated role-check guards with hardcoded strings; `hasPermission()` exists but unused

---

## 1.1 Fix Firebase-Leaking Hooks

### Requirements
- Create dedicated service files for exercises, reading, listening
- Refactor hooks to delegate to service layer (match use-flashcards pattern)
- No changes to component API (hooks return same interface)

### Architecture
```
BEFORE: use-exercises.ts → firebase/firestore (direct)
AFTER:  use-exercises.ts → exercise-service.ts → firebase/firestore
```

### Related Files
- `src/hooks/use-exercises.ts` (93 LOC) -- imports firebase directly
- `src/hooks/use-reading.ts` (144 LOC) -- imports firebase directly
- `src/hooks/use-listening.ts` (306 LOC) -- imports firebase directly
- `src/services/firestore/index.ts` -- barrel export, add new services here
- `src/hooks/use-flashcards.ts` -- reference pattern

### Implementation Steps

**Step 1: Create `src/services/firestore/exercise-service.ts`**
- Extract: `addDoc`, `updateDoc`, `deleteDoc`, `onSnapshot` calls from use-exercises.ts
- Export: `subscribeToExercises()`, `addExercise()`, `updateExercise()`, `deleteExercise()`
- Follow naming conventions in existing services

**Step 2: Create `src/services/firestore/reading-service.ts`**
- Same pattern. Extract CRUD + subscription from use-reading.ts
- Export: `subscribeToReadings()`, `addReading()`, `updateReading()`, `deleteReading()`

**Step 3: Create `src/services/firestore/listening-service.ts`**
- Largest of the three (306 LOC source hook). Extract all Firestore ops
- Export: `subscribeToListeningItems()`, `addListeningItem()`, `updateListeningItem()`, `deleteListeningItem()`
- Note: may have additional query patterns (orderBy, where) to extract

**Step 4: Register in barrel export**
- Add all 3 services to `src/services/firestore/index.ts`

**Step 5: Refactor hooks**
- Replace direct firebase imports with service calls
- Preserve hook return types exactly (no breaking changes)
- Add try-catch error handling matching use-flashcards pattern

---

## 1.2 Extract Permission Checks

### Requirements
- Centralize all role-based permission logic
- Replace 7 inline guards in App.tsx
- Use existing `hasPermission()` from `src/types/user.ts` where possible

### Related Files
- `src/App.tsx` (lines ~750-957) -- inline permission guards
- `src/types/user.ts` -- existing hasPermission(), isTeacher(), isAdminLevel()

### Implementation Steps

**Step 1: Create `src/utils/role-permissions.ts`**
- Define `PagePermission` map: page name -> required role check
- Use existing functions from user.ts (hasPermission, isTeacher, isAdminLevel)
- Export `canAccessPage(page, role): boolean`

**Step 2: Refactor App.tsx guards**
- Import canAccessPage
- Replace each inline role check with: `canAccessPage(currentPage, currentUser?.role)`
- Verify all 7 guards produce identical boolean results (write unit test)

**Step 3: Add unit tests**
- Test all role combinations against all protected pages
- File: `src/utils/__tests__/role-permissions.test.ts`

---

## 1.3 Split use-settings.ts (602 LOC)

### Requirements
- Split into 3-4 focused hooks, each <200 LOC
- Maintain backward-compat re-export from original file during transition
- No changes to component API

### Related Files
- `src/hooks/use-settings.ts` (602 LOC)
- Components importing use-settings (grep for consumers)

### Implementation Steps

**Step 1: Audit setting categories**
- Read use-settings.ts, categorize all 40+ fields into groups
- Proposed splits: core app settings, flashcard display, AI profiles, game config

**Step 2: Create sub-hooks**
- `src/hooks/settings/use-app-settings.ts` -- localStorage sync, app-level toggles, theme
- `src/hooks/settings/use-flashcard-settings.ts` -- frame styles, font sizes, colors
- `src/hooks/settings/use-ai-settings.ts` -- AI profile configs (27 profiles)
- `src/hooks/settings/use-game-settings.ts` -- game-specific config (if applicable)

**Step 3: Create barrel + backward-compat**
- `src/hooks/settings/index.ts` -- exports all sub-hooks
- Update original `use-settings.ts` to re-export from settings/ (temporary bridge)

**Step 4: Migrate consumers**
- Update imports in consuming components to use specific sub-hooks
- Remove bridge file once all consumers migrated

---

## Todo

- [x] 1.1a Create exercise-service.ts
- [x] 1.1b Create reading-service.ts
- [x] 1.1c Create listening-service.ts
- [x] 1.1d Register services in barrel export
- [x] 1.1e Refactor use-exercises.ts
- [x] 1.1f Refactor use-reading.ts
- [x] 1.1g Refactor use-listening.ts
- [x] 1.2a Create role-permissions.ts utility
- [x] 1.2b Refactor App.tsx permission guards
- [x] 1.2c Add unit tests for permissions
- [x] 1.3a Audit use-settings.ts field categories
- [x] 1.3b Create settings sub-hooks (use-app-settings, use-global-theme)
- [x] 1.3c Create barrel + backward-compat bridge
- [ ] 1.3d Migrate consumers to specific sub-hooks (DEFERRED — bridge pattern handles until Phase 2)

## Known Issues (from code review)

- `use-exercises.ts:22` uses `return unsubscribe` (direct fn ref) vs `return () => unsubscribe()` wrapper in other hooks — functionally equivalent for Firestore's `Unsubscribe = () => void`, but inconsistent style
- `normalizeLessonType` duplicated: private copy in `listening-service.ts` + exported copy in `use-listening.ts` — no consumers use the hook's export, safe to remove the duplicate in listening-service.ts
- `use-reading.ts` and `use-listening.ts` mutations have no try-catch; `use-exercises.ts` does — inconsistent error handling (lower priority: matches original pre-refactor behavior)
- `storagePath` not in `ListeningAudio` type; `use-listening.ts:102` uses intersection type cast — pre-existing issue carried forward

## Success Criteria

- `grep "from 'firebase/firestore'" src/hooks/` returns 0 results
- All hooks <200 LOC
- All existing tests pass
- Permission logic covered by unit tests
- No change to user-facing behavior

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Hook API change breaks consumers | Medium | Keep return types identical; backward-compat re-exports |
| Firestore subscription leak during refactor | High | Match exact onSnapshot/unsubscribe pattern from use-flashcards |
| Settings split misses a field | Low | Diff original vs sum of splits; CI type check catches missing exports |

## Security Considerations

- Permission utility must be exact equivalent of inline checks (no relaxation)
- Firestore rules unchanged (client-side checks only)

## Next Steps

After Phase 1 complete, proceed to [Phase 2: Foundation](./phase-02-foundation.md) for context consolidation and App.tsx extraction.
