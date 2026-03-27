# Phase 2: Shared Hooks

**Date:** 2026-03-26 | **Priority:** P1 | **Status:** NOT_STARTED
**Estimated effort:** 1 hour | **Risk:** Low

---

## Overview
Extract shared card management form state pattern from 4 tabs into reusable hook.

## Key Insights
- vocabulary-tab, grammar-tab, kanji-tab, exercises-tab all repeat identical state patterns
- Pattern: showForm + editingCard + showAddLesson + newLessonName + editingLesson + isExporting + isImporting + fileInputRef
- ~60 LOC per file = ~240 LOC total duplicate

## Related Files
- `src/components/cards-management/vocabulary-tab.tsx`
- `src/components/cards-management/grammar-tab.tsx`
- `src/components/cards-management/kanji-tab.tsx`
- `src/components/cards-management/exercises-tab.tsx`

## Implementation Steps
1. Read all 4 files, identify exact shared state pattern
2. Create `src/hooks/use-card-management-form.ts` with generic type param
3. Replace inline state in each tab with hook call
4. Verify no behavior change

## Todo
- [ ] 2.1 Analyze shared state pattern across 4 tabs
- [ ] 2.2 Create use-card-management-form.ts
- [ ] 2.3 Refactor 4 tabs to use shared hook

## Success Criteria
- Single hook file under 80 LOC
- 4 tabs using shared hook
- ~200 LOC net reduction
