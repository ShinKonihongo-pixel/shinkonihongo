# Phase 4: Component Decomposition

## Context
- [Main Plan](./plan.md)
- **Date:** 2026-03-26
- **Priority:** HIGH | **Risk:** MEDIUM | **Status:** NOT STARTED

## Overview
Split the 5 largest non-data files into focused sub-components. Extract shared patterns (lesson navigator, drag-drop list) into reusable components.

## Key Insights
- svg-charts-extended.tsx (1161 LOC): multiple chart types in one file
- student-detail-modal.tsx (851 LOC): multiple tab sections
- game-create.tsx (849 LOC): game configuration wizard
- sidebar.tsx (688 LOC): navigation sections + user menu + collapse logic
- vocabulary-tab.tsx (632), kanji-tab.tsx (609): identical lesson navigator + drag-drop pattern
- kaiwa-setup-view.tsx (702 LOC): topic selection + settings in one file

## Requirements
1. Split svg-charts-extended.tsx into per-chart-type files
2. Split student-detail-modal.tsx into tab section files
3. Split sidebar.tsx into section components
4. Extract shared LessonNavigator from vocabulary/grammar/kanji tabs
5. Extract shared DragDropLessonList from same 3 tabs
6. No exported API changes on parent components

## Architecture

### svg-charts-extended.tsx split
```
src/components/analytics/charts/
  area-chart.tsx
  bar-chart.tsx
  pie-chart.tsx
  radar-chart.tsx
  scatter-chart.tsx
  heatmap-chart.tsx
  index.ts              # Re-exports all
```

### student-detail-modal.tsx split
```
src/components/classroom/student-detail/
  student-detail-modal.tsx   # Shell with tab switching
  overview-tab.tsx
  attendance-tab.tsx
  grades-tab.tsx
  progress-tab.tsx
  notes-tab.tsx
  index.ts
```

### sidebar.tsx split
```
src/components/layout/sidebar/
  sidebar.tsx           # Shell with collapse logic
  nav-section.tsx       # Reusable nav section component
  user-menu.tsx         # User avatar + dropdown
  sidebar-footer.tsx    # Version/logout area
  index.ts
```

### Shared lesson components
```
src/components/shared/
  lesson-navigator.tsx      # Level tabs + lesson tree (used by vocab/grammar/kanji)
  drag-drop-lesson-list.tsx # Drag-drop reorder (used by same 3 tabs)
```

## Related Code Files
- `src/components/analytics/svg-charts-extended.tsx` (1161 LOC)
- `src/components/analytics/svg-charts.tsx` (736 LOC) - may share types
- `src/components/classroom/student-detail-modal.tsx` (851 LOC)
- `src/components/quiz-game/game-create.tsx` (849 LOC)
- `src/components/layout/sidebar.tsx` (688 LOC)
- `src/components/cards-management/vocabulary-tab.tsx` (632 LOC)
- `src/components/cards-management/kanji-tab.tsx` (609 LOC)
- `src/components/cards-management/grammar-tab.tsx` (likely similar pattern)
- `src/components/pages/kaiwa/kaiwa-setup-view.tsx` (702 LOC)

## Implementation Steps

### Step 1: Extract shared LessonNavigator
- Compare vocabulary-tab.tsx, grammar-tab.tsx, kanji-tab.tsx
- Identify common lesson tree navigation UI
- Extract as generic `LessonNavigator<T>` with render props for custom content
- Replace in all 3 tabs

### Step 2: Extract shared DragDropLessonList
- Same 3 tabs share drag-drop reorder logic
- Extract as reusable component
- Wire to existing onReorderLessons callbacks

### Step 3: Split svg-charts-extended.tsx
- Each chart type becomes its own file
- Shared chart utilities (axes, legends, tooltips) stay in `chart-utils.ts`
- Re-export from index.ts to avoid import path changes

### Step 4: Split student-detail-modal.tsx
- Modal shell handles tab switching
- Each tab becomes its own component
- Pass student data via props (not context - modal is leaf)

### Step 5: Split sidebar.tsx
- NavSection: receives items array, renders nav links
- UserMenu: avatar dropdown with profile/settings/logout
- SidebarFooter: version info, collapse toggle
- Shell: layout + collapse state

### Step 6: Split game-create.tsx (if time permits)
- Lower priority; complex wizard state
- Split by wizard step/section

## Todo
- [ ] Diff vocabulary-tab vs grammar-tab vs kanji-tab to identify shared pattern
- [ ] Create `src/components/shared/lesson-navigator.tsx`
- [ ] Create `src/components/shared/drag-drop-lesson-list.tsx`
- [ ] Refactor vocabulary-tab to use shared components
- [ ] Refactor grammar-tab to use shared components
- [ ] Refactor kanji-tab to use shared components
- [ ] Split svg-charts-extended.tsx into per-chart files
- [ ] Split student-detail-modal.tsx into tab files
- [ ] Split sidebar.tsx into section files
- [ ] Verify all pages render correctly after each split

## Success Criteria
- No file > 400 LOC (except data files)
- LessonNavigator reused by 3+ tabs
- DragDropLessonList reused by 3+ tabs
- Each chart type independently importable
- All component exports unchanged (barrel files)

## Risk Assessment
- **MEDIUM**: Splitting components can break internal state wiring
- Mitigation: one component at a time; verify after each
- Shared components need careful generic typing to avoid regressions
- Sidebar is high-risk (used globally) - test navigation after split

## Security Considerations
- Sidebar nav items must preserve role-based visibility guards
- Student detail modal must not expose data across student boundaries

## Next Steps
After splitting, Phase 5 (performance) can add React.memo to the newly created leaf components for measurable gains.
