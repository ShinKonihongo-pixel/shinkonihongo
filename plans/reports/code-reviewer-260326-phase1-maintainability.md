# Code Review Summary — Phase 1 Maintainability Refactoring

**Date:** 2026-03-26
**Reviewer:** code-reviewer subagent
**Plan:** `plans/260326-1021-maintainability-refactoring/phase-01-quick-wins.md`

---

## Scope

- Files reviewed: 15 new/modified files
  - `src/services/firestore/{exercise,reading,listening}-service.ts` (new)
  - `src/services/firestore/{collections,index}.ts` (modified)
  - `src/hooks/{use-exercises,use-reading,use-listening}.ts` (refactored)
  - `src/utils/role-permissions.ts` (new)
  - `src/utils/__tests__/role-permissions.test.ts` (new)
  - `src/App.tsx` (7 guards replaced)
  - `src/hooks/settings/{index,settings-types,settings-defaults,settings-presets,use-app-settings,use-global-theme}.ts` (new)
  - `src/hooks/use-settings.ts` (replaced with bridge)
- Lines of code analyzed: ~900 new LOC
- Review focus: recent changes only (Phase 1 workstreams)
- Updated plans: `plans/260326-1021-maintainability-refactoring/phase-01-quick-wins.md`

---

## Overall Assessment

Phase 1 is largely well-executed. Architecture is correct, TypeScript is clean (0 errors), 360/360 tests pass. Three issues are worth fixing before proceeding to Phase 2, none are blocking.

---

## Critical Issues

None.

---

## High Priority Findings

### H1 — `normalizeLessonType` duplicated across two files (DRY violation)

`listening-service.ts:22` defines a **private** `normalizeLessonType` with identical logic to the exported `normalizeLessonType` in `use-listening.ts:32`. The service version is only used internally; no consumer imports the hook's export either.

**Fix:** Delete the private copy in `listening-service.ts` and import from `use-listening.ts`, or move the canonical copy to `listening-service.ts` and re-export it from the hook. Either way eliminates the duplication and the risk of the two diverging.

```ts
// listening-service.ts — replace private fn with:
import { normalizeLessonType } from '../../hooks/use-listening';
// OR move it to listening-service.ts and re-export from hook:
// export { normalizeLessonType } from '../services/firestore/listening-service';
```

---

## Medium Priority Improvements

### M1 — `return unsubscribe` vs `return () => unsubscribe()` inconsistency

`use-exercises.ts:22` returns the `Unsubscribe` function directly from `useEffect`. `use-reading.ts` and `use-listening.ts` wrap it in an arrow function. The golden-standard `use-flashcards.ts` uses the wrapper form.

Both are functionally equivalent (`Unsubscribe` is `() => void`), but the inconsistency is a minor friction for future readers. Fix by aligning to the established pattern:

```ts
// use-exercises.ts:22
return () => unsubscribe();  // was: return unsubscribe;
```

### M2 — Inconsistent error handling in hook mutations

`use-exercises.ts` wraps all mutations in try-catch (returns `null`/`false` on error). `use-reading.ts` and `use-listening.ts` have no try-catch in mutations (errors propagate to caller).

The plan says "Add try-catch error handling matching use-flashcards pattern" — this was only applied to use-exercises. Consumers of use-reading/use-listening may not be prepared to handle thrown rejections. Low risk if current consumers already handle it, but inconsistent.

### M3 — `storagePath` missing from `ListeningAudio` type (pre-existing, carried forward)

`use-listening.ts:102` uses `(audio as ListeningAudio & { storagePath?: string }).storagePath` to access a Firestore field not declared in the type. This is a pre-existing issue but Phase 1 is the right time to fix it cleanly since we're touching this code.

**Fix:** Add `storagePath?: string` to `ListeningAudio` in `src/types/listening.ts` and remove the type cast.

### M4 — Plan step 1.3b: 2 sub-hooks vs planned 3-4

Plan specified `use-app-settings`, `use-flashcard-settings`, `use-ai-settings`, `use-game-settings`. Implementation created `use-app-settings` (all settings in one hook, 48 LOC) + `use-global-theme`. The original 602 LOC is now split across 6 well-scoped files (all under 210 LOC each), which satisfies the spirit and the LOC criterion. YAGNI applies — 4 hooks was over-engineering if consumers only call `useSettings()` as a single unit. Marking 1.3b complete.

---

## Low Priority Suggestions

### L1 — Plan step 1.3d (consumer migration) is deferred

45 consumers still import from `hooks/use-settings` via the bridge re-export. The bridge is correct and safe. Recommend tracking this as Phase 2 cleanup rather than blocking Phase 1 completion.

---

## Positive Observations

- **Security:** `role-permissions.ts` comments document the exact original inline check for each page. `isLegacyAdmin` correctly narrows to `admin | super_admin` (not `isAdminLevel`) — preserves the original narrower check for `cards` and `lecture-editor`. Unit tests cover all 9 roles × 7 pages exhaustively.
- **Architecture:** All three new services follow the `flashcard-service.ts` pattern exactly. Barrel export (`services/firestore/index.ts`) updated correctly.
- **Type safety:** No `as any` introduced. One `as ListeningFolder` cast in `listening-service.ts:58` is acceptable (raw Firestore data spread with known shape).
- **onSnapshot unsubscribe:** All subscriptions properly return cleanup functions. `use-exercises` variant (`return unsubscribe`) is technically correct, just stylistically inconsistent.
- **Success criteria verified:**
  - `grep "from 'firebase/firestore'" src/hooks/` → 0 results ✓
  - All hooks < 200 LOC ✓
  - All 360 tests pass ✓
  - TypeScript: 0 errors ✓
  - 7 App.tsx guards replaced with `canAccessPage()` ✓

---

## Recommended Actions

1. **Fix H1 (DRY):** Remove private `normalizeLessonType` from `listening-service.ts`, import from hook (or consolidate in service and re-export).
2. **Fix M1 (style):** Change `use-exercises.ts:22` to `return () => unsubscribe()`.
3. **Fix M3 (type):** Add `storagePath?: string` to `ListeningAudio`, remove cast in `use-listening.ts:102`.
4. **Defer M2 / L1:** Error handling alignment and consumer migration are Phase 2 items.

---

## Metrics

- Type Coverage: TypeScript strict — 0 errors
- Test Coverage: 360/360 tests pass; role-permissions covered exhaustively (all roles × all pages)
- Linting Issues: 0 blocking; 2 style inconsistencies (M1, M2)
- `as any` introduced: 0
- Direct firebase imports in hooks: 0 (success criteria met)
