# Kanji Drop Game - Implementation Plan

**Date**: 2026-02-27
**Status**: DONE (2026-02-27)
**Category**: Game Hub - Single-player Puzzle/Casual
**Priority**: Medium

## Summary

Add "Kanji Drop" single-player puzzle game to Game Hub. Player picks kanji tiles from pool grid, tiles drop into bottom row, reflow groups identical kanji, 3+ contiguous clears. Win = all cleared; lose = row full.

## Architecture

```
src/components/pages/kanji-drop/
  index.ts                    # Module exports
  kanji-drop-types.ts         # All type definitions
  kanji-drop-engine.ts        # Pure game logic (reflow, clear, cascade, pool gen)
  kanji-drop-constants.ts     # Level configs, defaults
  use-kanji-drop-game.ts      # Main game hook (state machine)
  setup-screen.tsx            # Level/JLPT selection
  pool-grid.tsx               # Selectable kanji tile pool
  bottom-row.tsx              # 10-slot drop target row
  power-up-bar.tsx            # 3 power-up buttons
  playing-screen.tsx          # Game play layout
  result-screen.tsx           # Win/lose + stats
  tutorial-overlay.tsx        # First-time tutorial
  kanji-drop.css              # All styles
src/components/pages/kanji-drop-page.tsx  # Top-level page (matches word-scramble pattern)
```

**Integration points** (3 files modified):
1. `src/types/game-hub.ts` - add `'kanji-drop'` to GameType + GAMES entry
2. `src/components/pages/game-hub-page.tsx` - lazy import + render case + kanjiCards prop
3. `src/App.tsx` (optional) - pass `kanjiCards` via GameHubPage props

## Phases

| # | Phase | File | Status |
|---|-------|------|--------|
| 1 | [Types & Data Model](./phase-01-types-and-data-model.md) | kanji-drop-types.ts, kanji-drop-constants.ts | DONE (2026-02-27) |
| 2 | [Core Game Engine](./phase-02-core-game-engine.md) | kanji-drop-engine.ts | DONE (2026-02-27) |
| 3 | [Game Hook](./phase-03-game-hook.md) | use-kanji-drop-game.ts | DONE (2026-02-27) |
| 4 | [UI Components](./phase-04-ui-components.md) | 7 .tsx files | DONE (2026-02-27) |
| 5 | [Styling & Animations](./phase-05-styling-and-animations.md) | kanji-drop.css | DONE (2026-02-27) |
| 6 | [Integration](./phase-06-integration.md) | 3 existing files modified | DONE (2026-02-27) |

## Dependencies

- Phase 1 blocks all others
- Phase 2 depends on Phase 1
- Phase 3 depends on Phases 1 + 2
- Phase 4 depends on Phases 1 + 3
- Phase 5 depends on Phase 4
- Phase 6 depends on Phases 4 + 5

## Key Decisions

- **Single-player only** - no Firebase room management, no multiplayer
- **kanjiCards** flow: add optional `kanjiCards` prop to GameHubPage, pass from App.tsx
- **CSS prefix**: `kd-` (kanji drop) to avoid collisions
- **No timer** - puzzle-paced, not speed-based
- **Seed-based RNG** for pool generation (replayable levels)
- **localStorage** for level progression persistence

## Risks

- Pool generation solvability: mitigated by >= 60% tiles having 3+ copies
- KanjiCard data insufficiency per JLPT level: mitigated by falling back to mixed levels
- Bottom row UX on mobile: mitigated by horizontal scroll or scaled tiles
