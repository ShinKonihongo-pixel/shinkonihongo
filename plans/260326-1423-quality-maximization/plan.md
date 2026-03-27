# Quality Maximization Plan - Shinko Japanese Learning Platform

**Date:** 2026-03-26 | **Constraint:** Zero user-facing behavior changes

## Target Scores
| Metric | Current | Target |
|--------|---------|--------|
| Maintainability | 7 | 9+ |
| Performance | 8 | 9+ |
| Consistency | 6.5 | 9+ |
| Reusability | 6.5 | 9+ |

## Phase Overview (ordered by risk ASC, impact DESC)

| # | Phase | Risk | Primary Impact | Est. Effort |
|---|-------|------|---------------|-------------|
| 1 | [UI Consistency Foundation](./phase-01-ui-consistency.md) | LOW | Consistency, Reusability | DONE |
| 2 | [Error Handling Standardization](./phase-02-error-handling.md) | LOW | Consistency, Maintainability | DONE (139/139 catches migrated, 100%) |
| 3 | [App.tsx Decomposition](./phase-03-app-decomposition.md) | MED | Maintainability | PARTIAL (nav extracted, 1054→989) |
| 4 | [Component Decomposition](./phase-04-component-decomposition.md) | MED | Maintainability, Reusability | PARTIAL (sidebar -120 LOC) |
| 5 | [Performance Optimization](./phase-05-performance-optimization.md) | LOW | Performance | PARTIAL (AI btn CSS extracted) |
| 6 | [CSS Architecture Cleanup](./phase-06-css-architecture.md) | MED | Consistency | DEFERRED (needs visual testing) |

## Key Metrics (baseline)
- App.tsx: 1058 LOC, 11+ useState, 110+ destructured context properties
- 129 `!important` across 29 CSS files
- 290+ inline `style={}` across 20+ component files
- ~200 catch blocks across 60+ files; many silent
- Top file: svg-charts-extended.tsx (1161 LOC), student-detail-modal.tsx (851), sidebar.tsx (688)

## Dependencies Between Phases
- Phase 1 -> Phase 6 (shared CSS constants used in cleanup)
- Phase 2 standalone
- Phase 3 standalone (but benefits from Phase 1 LoadingIndicator)
- Phase 4 standalone
- Phase 5 depends on Phase 6 partially (CSS class replacements)

## Completion Criteria
All phases done when: no silent catches, App.tsx <200 LOC, 0 `!important` in top files, shared UI primitives adopted across all pages, inline styles reduced by 80%+ in target files.
