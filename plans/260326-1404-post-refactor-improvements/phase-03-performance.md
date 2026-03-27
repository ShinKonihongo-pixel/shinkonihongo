# Phase 3: Performance

**Date:** 2026-03-26 | **Priority:** P2 | **Status:** NOT_STARTED
**Estimated effort:** 2 hours | **Risk:** Medium

---

## Overview
Consolidate JLPTPage 18 useState into grouped state objects. Add memoization to sidebar.

## Key Insights
- JLPTPage (src/components/pages/jlpt/index.tsx) has 18 useState — any single state change re-renders entire tree
- Sidebar creates NavItem array on every render (20+ items)
- VocabularyTab filter functions not memoized

## Implementation Steps
1. Read JLPTPage, group useState into 3 objects: setupState, practiceState, uiState
2. Replace individual setters with updater functions
3. Memoize sidebar NavItem arrays
4. Test no visual regression

## Todo
- [ ] 3.1 Consolidate JLPTPage useState
- [ ] 3.2 Memoize sidebar static arrays
- [ ] 3.3 Verify no regressions

## Success Criteria
- JLPTPage: 18 useState → 3-4 state groups
- Sidebar: NavItems memoized
- All tests pass
