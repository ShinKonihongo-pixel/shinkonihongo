# Phase 4: Polish

**Date:** 2026-03-26 | **Priority:** P3 | **Status:** NOT_STARTED
**Estimated effort:** 2-3 days | **Risk:** Low
**Depends on:** Phases 1-3 (cleanups are safer after structural changes settle)

---

## Context

- [Game Hooks & CSS Scout](./scout/scout-01-games-css-types.md)
- [Service Layer Research](./research/researcher-01-service-patterns.md)

## Overview

Fix remaining type safety issues, decompose oversized components, remove dead code. Lowest priority because impact is incremental, not structural.

## Key Insights

- Only 13 `as any` assertions total (2 in shared hooks, 11 in game-specific code)
- 6 components exceed 200 LOC limit: svg-charts-extended (1161), student-detail-modal (851), game-create (849), sidebar (688), vocabulary-tab (662), kaiwa-setup-view (702)
- Student report services (academic 806, infographic 762) also exceed limit
- Racing game may have v1/v2 remnants

---

## 4.1 Fix `as any` Assertions

### Requirements
- Eliminate all 13 `as any` usages with proper types
- Priority: 2 in shared hooks first (affect all games)

### Related Files
- `src/hooks/shared/use-game-room-state.ts:125` -- `(b as any).score`
- `src/hooks/shared/use-lobby-state.ts:46` -- `(p as any).isBot`
- 11 other occurrences across game-specific hooks

### Implementation Steps

**Step 1: Fix shared hook assertions**
- `use-game-room-state.ts`: Add `score?: number` to BasePlayer type or create ScoredPlayer union
- `use-lobby-state.ts`: Add `isBot?: boolean` to BasePlayer or create BotPlayer type
- Update `src/hooks/shared/game-types.ts` with proper type extensions

**Step 2: Fix game-specific assertions**
- Grep all `as any` occurrences
- For each: determine correct type and apply union/intersection/generic
- Most are likely optional property access -- add to interface

**Step 3: Verify**
- Run `npx tsc --noEmit` -- zero errors
- Run existing tests

---

## 4.2 Decompose Oversized Components

### Requirements
- Split 6 components exceeding 200 LOC limit
- Follow existing composition pattern (sub-components in same directory)
- No API changes to parent consumers

### Target Components

| Component | LOC | Proposed Split |
|-----------|-----|---------------|
| svg-charts-extended.tsx | 1161 | Split by chart type (bar, line, radar, pie) |
| student-detail-modal.tsx | 851 | Split by tab/section (overview, progress, sessions) |
| game-create.tsx | 849 | Split by step (settings, question select, preview) |
| kaiwa-setup-view.tsx | 702 | Split by setup stage (topic, mode, config) |
| sidebar.tsx | 688 | Split by section (nav items, user panel, footer) |
| vocabulary-tab.tsx | 662 | Split by mode (list view, card view, bulk edit) |

### Implementation Steps

**Step 1: svg-charts-extended.tsx (1161 LOC)**
- Create `src/components/analytics/charts/` directory
- Extract each chart type into own file: bar-chart, line-chart, radar-chart, pie-chart
- Main file re-exports all + shared utilities (axes, legends, tooltips)

**Step 2: student-detail-modal.tsx (851 LOC)**
- Create sub-components in `src/components/classroom/student-detail/`
- Extract: overview-section, progress-section, session-history, action-buttons
- Modal wrapper remains thin orchestrator

**Step 3: game-create.tsx (849 LOC)**
- Create sub-components in `src/components/quiz-game/game-create/`
- Extract: settings-panel, question-selector, preview-panel
- Step wizard logic stays in main component

**Step 4: Remaining 3 components**
- kaiwa-setup-view: split by setup stages
- sidebar: extract nav-items, user-panel, sidebar-footer
- vocabulary-tab: extract list-view, card-view, bulk-edit-panel

**Step 5: Also split report services**
- `src/services/student-report/academic-report.ts` (806 LOC)
- `src/services/student-report/infographic-report.ts` (762 LOC)
- Split by section generation functions

---

## 4.3 Dead Code Cleanup

### Requirements
- Identify and remove unused code
- Verify racing-game v1/v2 situation
- Audit unused service exports

### Implementation Steps

**Step 1: Racing game audit**
- Check for v1/v2 files or deprecated versions
- If v1 exists and unused, remove after confirming with git history

**Step 2: Unused exports audit**
- Run TypeScript compiler with `--noUnusedLocals` flag (report only)
- Check service barrel for exports not imported anywhere
- Check hooks for exported functions not consumed

**Step 3: Remove dead CSS**
- Cross-reference CSS class names with TSX usage
- Focus on recently refactored files (current git status shows CSS splits)
- Use grep: classes defined in CSS but not in any TSX

**Step 4: Clean up**
- Remove identified dead code
- Verify build passes
- Run all tests

---

## Todo

- [ ] 4.1a Fix 2 `as any` in shared hooks
- [ ] 4.1b Fix 11 `as any` in game-specific hooks
- [ ] 4.2a Decompose svg-charts-extended.tsx
- [ ] 4.2b Decompose student-detail-modal.tsx
- [ ] 4.2c Decompose game-create.tsx
- [ ] 4.2d Decompose kaiwa-setup-view, sidebar, vocabulary-tab
- [ ] 4.2e Split report services
- [ ] 4.3a Racing game v1/v2 audit
- [ ] 4.3b Unused exports audit
- [ ] 4.3c Dead CSS cleanup

## Success Criteria

- Zero `as any` in codebase
- No component file >200 LOC
- No service file >200 LOC
- Zero unused exports in service barrel
- All tests pass, build succeeds

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Type changes break generic game logic | Medium | Run full game test suite after each type fix |
| Component split breaks layout/styling | Medium | Visual regression check per component |
| Dead code removal breaks obscure feature | Low | Grep thoroughly; check git blame for recent usage |
| SVG chart split breaks data flow | Medium | Charts are pure render -- props interface stays same |

## Security Considerations

- No security impact. Type safety, component structure, dead code only.

## Unresolved Questions

- Does racing-game have v1/v2 split or was it fully migrated?
- Are academic-report.ts and infographic-report.ts generated code or hand-written? (affects split strategy)
- Should dead CSS audit include the new split CSS files from current uncommitted changes?
