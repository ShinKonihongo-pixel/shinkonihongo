# Phase 3: Scale

**Date:** 2026-03-26 | **Priority:** P2 | **Status:** NOT_STARTED
**Estimated effort:** 3-4 days | **Risk:** Medium
**Depends on:** Phase 2 (clean App.tsx needed for bundle analysis)

---

## Context

- [Game Hooks & CSS Scout](./scout/scout-01-games-css-types.md)

## Overview

Extend existing CSS variable system, audit game hook consistency, lazy-load static data. REVISED scope: game hooks and CSS vars already well-structured -- extend, don't rewrite.

## Key Insights (REVISED from initial audit)

- CSS variables ALREADY exist: 215 occurrences, 110 in App.css (Japanese color palette: shu, ai, sakura, matcha, etc.)
- Premium lobby shell already uses dynamic accent system via inline `--pl-accent`
- Shared game hooks (8 files in `src/hooks/shared/`) already composable
- Games use composition pattern: Bingo=6, Racing=11 sub-hooks
- Kanji seed data: 10 files totaling ~5K+ lines, all loaded at startup
- `krad-decomposition.ts` (~1640 lines) also not lazy-loaded

---

## 3.1 CSS Design Token Consolidation

### Requirements
- Consolidate scattered hex values in TSX files into CSS variables
- Extend existing App.css color system, don't replace
- Create `design-tokens.css` for spacing, typography, shadows, z-index
- No visual changes

### Related Files
- `src/App.css` -- 110 existing CSS vars (color palette)
- `src/components/shared/game-lobby/premium-lobby.css` -- dynamic accent pattern
- TSX files with inline hex values (audit needed)

### Implementation Steps

**Step 1: Audit hardcoded values**
- Grep TSX files for hex colors (`#[0-9a-fA-F]{3,8}`), rgba values
- Identify which map to existing vars (e.g., `#E34234` = `--jp-shu`)
- Identify gaps needing new vars (dark theme glassmorphism colors)

**Step 2: Create `src/styles/design-tokens.css`**
- Import in App.css (or main entry)
- Tokens: spacing scale (4/8/12/16/24/32/48), border-radius, shadows, z-index layers
- Typography: font-size scale, line-height, font-weight
- Dark glassmorphism tokens: background gradients, glass blur, border opacities

**Step 3: Replace hardcoded values**
- Prioritize TSX inline styles first (highest maintenance cost)
- Then CSS files with raw hex values matching existing palette
- Batch by page/component area

**Step 4: Document token system**
- Add token reference to `docs/design-guidelines.md` (update existing)

---

## 3.2 Game Hook Consistency Audit

### Requirements
- Verify all games consistently use shared hooks from `src/hooks/shared/`
- Identify remaining copy-paste patterns between game-specific hooks
- Extract any duplicated logic to shared hooks
- NOT a rewrite -- optimization only

### Related Files
- `src/hooks/shared/` -- 8 shared game hooks
- `src/hooks/bingo-game/` -- reference pattern (6 sub-hooks)
- `src/hooks/racing-game/` -- reference pattern (11 sub-hooks)
- Other game hook directories (kanji-battle, golden-bell, etc.)

### Implementation Steps

**Step 1: Inventory all game hook directories**
- List all `src/hooks/*-game/` directories
- For each: count sub-hooks, check if imports from shared/
- Build matrix: game x shared-hook usage

**Step 2: Identify duplication**
- Diff similar functions across games (lobby state, timer, session save)
- Any game NOT using shared hooks? Refactor to use them

**Step 3: Extract remaining shared logic**
- If >=2 games duplicate a pattern not in shared/, extract it
- Follow existing composable pattern

**Step 4: Ensure consistent error handling**
- All games should use try-catch + user-facing error messages
- Match use-flashcards error handling pattern

---

## 3.3 Lazy-Load Kanji Seed Data

### Requirements
- Dynamic import kanji-seed files by JLPT level
- Lazy-load krad-decomposition.ts
- Reduce initial bundle size

### Related Files
- `src/data/kanji-seed/index.ts` -- main export
- `src/data/kanji-seed/n1.ts` through `n5.ts` (+ n1-part1/2/3)
- `src/data/krad-decomposition.ts` (1640 LOC)

### Implementation Steps

**Step 1: Analyze current import chain**
- Find all consumers of kanji-seed data
- Determine which JLPT level(s) each consumer needs
- Check if data is needed at mount or can be deferred

**Step 2: Create lazy loader**
- `src/data/kanji-seed/loader.ts`
- Export: `loadKanjiByLevel(level: JLPTLevel): Promise<KanjiData[]>`
- Uses `import()` for each level file
- Cache loaded levels in module-scope Map

**Step 3: Lazy-load krad-decomposition**
- Only loaded when kanji decomposition UI is active
- `export const loadDecomposition = () => import('./krad-decomposition')`

**Step 4: Update consumers**
- Replace static imports with async loader calls
- Add loading states where needed (Suspense or local loading flag)
- Verify kanji study/game pages still work correctly

**Step 5: Measure impact**
- Run `ANALYZE=1 vite build` before and after
- Document bundle size reduction

---

## Todo

- [ ] 3.1a Audit hardcoded hex/rgba in TSX files
- [ ] 3.1b Create design-tokens.css
- [ ] 3.1c Replace hardcoded values with CSS vars
- [ ] 3.1d Update design-guidelines.md
- [ ] 3.2a Inventory all game hook directories
- [ ] 3.2b Identify duplication across games
- [ ] 3.2c Extract remaining shared patterns
- [ ] 3.3a Analyze kanji-seed import chain
- [ ] 3.3b Create lazy loader
- [ ] 3.3c Lazy-load krad-decomposition
- [ ] 3.3d Update consumers
- [ ] 3.3e Measure bundle size impact

## Success Criteria

- Zero raw hex values in TSX inline styles for colors in the palette
- All games import from shared/ for common patterns
- Kanji seed data loaded on-demand (not in initial bundle)
- Bundle size measurably reduced (target: kanji data ~50KB+ saved from initial load)
- No visual regression

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| CSS var replacement changes visual appearance | Medium | Screenshot comparison before/after per page |
| Lazy-load causes flash of empty content | Low | Add skeleton/loading states; preload on route hint |
| Game hook refactor breaks game state sync | High | Test each game's full lifecycle: create, join, play, end |
| Design token file grows too large | Low | Keep <200 lines; split by category if needed |

## Security Considerations

- No security impact. CSS/bundle changes only.

## Next Steps

After Phase 3 complete, proceed to [Phase 4: Polish](./phase-04-polish.md) for type safety and component decomposition.
