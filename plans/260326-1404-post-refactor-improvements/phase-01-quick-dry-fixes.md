# Phase 1: Quick DRY Fixes

**Date:** 2026-03-26 | **Priority:** P0 | **Status:** NOT_STARTED
**Estimated effort:** 30 minutes | **Risk:** Low

---

## Overview
Remove duplicate utility functions and duplicate component. Highest ROI — minimal effort, immediate code quality improvement.

## Key Insights
- `downloadAsJSON()` and `readJSONFile()` duplicated in 3 card-management tabs
- Canonical version exists in `src/utils/data-export-import.ts`
- `FuriganaText` exists in both `common/` (25 LOC, 8 importers) and `ui/` (85 LOC, 2 importers)
- `common/` version is wrapper, `ui/` version has full settings integration

## Related Files
- `src/components/cards-management/vocabulary-tab.tsx:15-37` — duplicate functions
- `src/components/cards-management/grammar-tab.tsx:29-54` — duplicate functions
- `src/components/cards-management/kanji-tab.tsx:36-58` — duplicate functions
- `src/utils/data-export-import.ts` — canonical source
- `src/components/common/furigana-text.tsx` (25 LOC) — 8 importers
- `src/components/ui/furigana-text.tsx` (85 LOC) — 2 importers

## Implementation Steps

### 1.1 Remove duplicate downloadAsJSON/readJSONFile
- In vocabulary-tab.tsx: delete local functions, add import from utils
- In grammar-tab.tsx: delete local functions, add import from utils
- In kanji-tab.tsx: delete local functions, add import from utils
- Check if function signatures match (data: unknown vs ExportData)

### 1.2 Consolidate FuriganaText
- Keep `common/furigana-text.tsx` as primary (8 importers)
- Update 2 importers of `ui/furigana-text.tsx` to import from `common/`
- If `ui/` version has extra features, merge into `common/` first
- Delete `ui/furigana-text.tsx`

## Todo
- [ ] 1.1a Delete duplicate from vocabulary-tab.tsx, add import
- [ ] 1.1b Delete duplicate from grammar-tab.tsx, add import
- [ ] 1.1c Delete duplicate from kanji-tab.tsx, add import
- [ ] 1.2a Analyze both FuriganaText versions
- [ ] 1.2b Merge if needed, update imports, delete duplicate

## Success Criteria
- Zero local downloadAsJSON/readJSONFile in card tabs
- Single FuriganaText file
- All tests pass, type check clean
