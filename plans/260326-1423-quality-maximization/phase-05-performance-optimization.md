# Phase 5: Performance Optimization

## Context
- [Main Plan](./plan.md)
- **Date:** 2026-03-26
- **Priority:** MEDIUM | **Risk:** LOW | **Status:** NOT STARTED

## Overview
Replace inline styles with CSS classes in top offenders, add React.memo to heavy leaf components, memoize expensive computations. Target: 290+ inline styles reduced to <50 in hot paths.

## Key Insights
- Top inline style files: salary-slip.tsx (61), teacher-schedule.tsx (60), teacher-add-modal.tsx (50), teaching-log.tsx (49), detail-view.tsx (33)
- React.memo used in 72 files but NOT on HomePage, CardsPage, StudyPage (heaviest components)
- svg-charts.tsx has 13 inline styles (render-heavy SVG elements)
- teacher-list.tsx has 22 inline styles
- Sidebar NavItem arrays likely recreated every render

## Requirements
1. Replace inline styles with CSS classes in top 5 files (salary-slip, teacher-schedule, teacher-add-modal, teaching-log, detail-view)
2. Add React.memo to heavy leaf components (post Phase 4 splits)
3. Add useMemo to sidebar NavItem arrays
4. Memoize filter/sort functions in card management tabs
5. No visual changes whatsoever

## Architecture

### New CSS files needed
```
src/components/salary/salary-slip.css          # Extract from inline
src/components/teacher/teacher-schedule.css     # Extract from inline
src/components/teacher/teacher-add-modal.css    # Extract from inline
src/components/teacher/teaching-log.css         # Extract from inline
src/components/salary/report/detail-view.css    # Extract from inline (if not exists)
```

### Memoization targets
```
# React.memo candidates (after Phase 4 splits)
- NavSection (sidebar)
- Each chart component (svg-charts split)
- Student detail tab components
- Lesson navigator items

# useMemo candidates
- Sidebar: navItems arrays
- Card tabs: filtered/sorted card lists
- App.tsx: filteredGetLessonsByLevel, filteredGetChildLessons (already done - verify)
- HomePage: statsByLevel computations
```

## Related Code Files
- `src/components/salary/salary-slip.tsx` (61 inline styles)
- `src/components/teacher/teacher-schedule.tsx` (60 inline styles)
- `src/components/teacher/teacher-add-modal.tsx` (50 inline styles)
- `src/components/teacher/teaching-log.tsx` (49 inline styles)
- `src/components/salary/report/detail-view.tsx` (33 inline styles)
- `src/components/analytics/svg-charts.tsx` (13 inline styles)
- `src/components/teacher/teacher-list.tsx` (22 inline styles)
- `src/components/layout/sidebar.tsx`

## Implementation Steps

### Step 1: Extract salary-slip.tsx inline styles to CSS
- Map each inline style to a CSS class
- Use BEM-like naming: `.salary-slip__header`, `.salary-slip__cell--highlight`
- Remove all `style={{}}` props
- Verify print layout unchanged (salary slips likely printed)

### Step 2: Extract teacher-schedule.tsx inline styles
- Similar approach; schedule grids need careful CSS grid translation
- Dynamic styles (conditional colors) use CSS classes with data-attributes or class toggles

### Step 3: Extract teacher-add-modal.tsx and teaching-log.tsx
- Form layouts with many inline margins/paddings
- Replace with utility-like CSS classes

### Step 4: Extract detail-view.tsx and remaining high-count files
- Complete the top 5 offenders

### Step 5: Add React.memo to leaf components
- Only after Phase 4 splits create proper leaf components
- Focus on: chart components, sidebar sections, card list items
- Use React DevTools Profiler to verify improvement

### Step 6: Add useMemo/useCallback where measurable
- Sidebar nav items (recreated every render)
- Card tab filter results
- Only where profiler shows re-render impact

## Todo
- [ ] Extract salary-slip.tsx inline styles to CSS (61 styles)
- [ ] Extract teacher-schedule.tsx inline styles (60 styles)
- [ ] Extract teacher-add-modal.tsx inline styles (50 styles)
- [ ] Extract teaching-log.tsx inline styles (49 styles)
- [ ] Extract detail-view.tsx inline styles (33 styles)
- [ ] Extract svg-charts.tsx inline styles (13 styles, SVG-specific)
- [ ] Add React.memo to Phase 4 leaf components
- [ ] Add useMemo to sidebar NavItem arrays
- [ ] Profile and verify measurable improvement
- [ ] Handle dynamic inline styles (conditional colors) via CSS class toggles

## Success Criteria
- Top 5 inline-style files reduced to <5 inline styles each (dynamic-only remain)
- React.memo on all leaf components from Phase 4 splits
- No visual regressions; print layouts preserved
- Profiler shows reduced re-renders in sidebar and card lists

## Risk Assessment
- **LOW**: CSS extraction is mechanical; inline-to-class is straightforward
- Dynamic styles (e.g., `color: isActive ? 'green' : 'red'`) need careful handling via CSS classes
- Print stylesheets for salary-slip must be tested separately
- React.memo: wrong dependency can cause stale renders; test thoroughly

## Security Considerations
- None specific to this phase

## Next Steps
Phase 6 (CSS architecture) complements this by fixing specificity issues that may surface when replacing inline styles with classes.
