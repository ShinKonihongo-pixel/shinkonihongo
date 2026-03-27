# Maintainability Refactoring Plan

**Project:** Shinko Japanese Learning Platform
**Created:** 2026-03-26 | **Codebase:** 283K LOC (164K TS, 119K CSS)
**Principle:** No breaking changes. Follow existing patterns. YAGNI/KISS/DRY.

---

## Phases

| # | Phase | Priority | Status | Est. Effort | Details |
|---|-------|----------|--------|-------------|---------|
| 1 | [Quick Wins](./phase-01-quick-wins.md) | P0 | DONE | 2-3 days | Fix 3 leaking hooks, extract permissions, split settings god hook |
| 2 | [Foundation](./phase-02-foundation.md) | P1 | PARTIAL | 3-5 days | Hook splits done. Context move cancelled (global consumers). App.tsx deferred. |
| 3 | [Scale](./phase-03-scale.md) | P2 | DONE | 3-4 days | Kanji chunk split (main -52%), lazy loaders, game audit, CSS tokens exist |
| 4 | [Polish](./phase-04-polish.md) | P3 | DONE | 2-3 days | Zero `as any` in hooks, dead v2 removed. Component decomp deferred. |

---

## Architecture Before/After

**Before:** App.tsx (1057 LOC) = routing + providers + state + permissions. 3 hooks bypass service layer. Settings = 602 LOC god hook.

**After:** App.tsx delegates to app-router, app-providers, use-app-state. All hooks use service layer. Settings split into 3-4 focused hooks. Contexts scoped to pages that need them.

---

## Research Reports

- [Service Layer Patterns](./research/researcher-01-service-patterns.md)
- [Context & App.tsx Structure](./research/researcher-02-contexts-app-structure.md)
- [Game Hooks & CSS](./scout/scout-01-games-css-types.md)

---

## Key Constraints

- Files must stay under 200 lines (per dev rules)
- Backward-compat re-exports during transition
- No React Router migration (out of scope)
- Existing CSS var system in App.css (110 vars) to be extended, not replaced
- Game hooks already well-structured; optimize, don't rewrite

---

## Success Metrics

- Zero files >200 LOC in hooks/ (currently 4 violate)
- Zero direct Firebase imports in hooks/ (currently 3)
- App.tsx <300 LOC (currently 1057)
- All permission checks use centralized utility
- No `as any` in shared hooks (currently 2)
