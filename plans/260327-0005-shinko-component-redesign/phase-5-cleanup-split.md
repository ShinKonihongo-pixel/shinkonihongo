# Phase 5: Large File Splitting + Performance Review

**Priority:** P2
**Estimated effort:** 3-4 days
**Depends on:** Phase 2 complete (can run in parallel with Phase 3-4)

## Context
- [plan.md](./plan.md) | [Phase 4](./phase-4-heavy-migrations.md)
- 16 components >200 LOC, 5 hooks >200 LOC need splitting
- Target: every file < 200 LOC

## Overview

Split large components and hooks into smaller, focused modules. No behavioral changes -- pure refactoring for maintainability. Also review bundle splitting and verify no performance regressions from the architectural changes.

## Files to Split

### Components (>200 LOC)

| File | LOC | Split Strategy |
|------|-----|----------------|
| `svg-charts-extended.tsx` | 1161 | Extract each chart type into own file |
| `game-create.tsx` | 849 | Extract per-game-type setup forms |
| `svg-charts.tsx` | 736 | Extract individual chart components |
| `kaiwa-setup-view.tsx` | 702 | Extract mode cards, topic selector, settings panel |
| `vocabulary-tab.tsx` | 632 | Extract form, list, bulk-import sections |
| `kaiwa-session-view.tsx` | 627 | Extract message display, input area, controls |
| `kanji-tab.tsx` | 609 | Extract form, list, search sections |
| `slide-editor-canvas.tsx` | 600 | Extract element renderers, toolbar, property panel |
| `sidebar.tsx` | 568 | Extract nav sections, user info, daily words widget |
| `kaiwa-start-screen.tsx` | 568 | Extract mode cards, topic browser |
| `flashcard-form.tsx` | 558 | Extract field groups, example editor |
| `flashcards-tab.tsx` | 554 | Extract list view, card form, bulk operations |
| `image-word-management.tsx` | 551 | Extract form, gallery, word mapping |
| `game-hub-page.tsx` | 544 | Extract game grid, setup modal, active game view |
| `home-page.tsx` | 528 | Extract sections: hero, activities, stats, leaderboard |
| `jlpt/index.tsx` | 531 | Extract setup view, practice view, results view |

### Hooks (>200 LOC)

| File | LOC | Split Strategy |
|------|-----|----------------|
| `use-speaking-practice.ts` | 512 | Extract speech recognition, evaluation, state mgmt |
| `use-quiz-game.ts` | 439 | Extract game state, scoring, timer, power-ups |
| `use-kaiwa-session-history.ts` | 418 | Extract session storage, replay, statistics |
| `use-speech.ts` | 394 | Extract TTS, STT, voice selection |
| `use-daily-words.ts` | 389 | Extract word selection, progress tracking, streak |

## Requirements

1. Every resulting file < 200 LOC
2. No behavioral changes -- pure structural refactoring
3. Preserve all exports (use barrel files where needed)
4. Split hooks use composition pattern (smaller hooks composed into parent)
5. Split components use render delegation pattern (parent orchestrates, children render)

## Architecture

### Component Split Pattern
```
// BEFORE: game-hub-page.tsx (544 LOC)
export function GameHubPage() { /* everything */ }

// AFTER:
// game-hub-page.tsx (~80 LOC) - orchestrator
// game-hub-grid.tsx (~100 LOC) - game card grid
// game-hub-setup-modal.tsx (~100 LOC) - setup/config modal
// game-hub-active-game.tsx (~80 LOC) - active game wrapper
// game-hub-leaderboard.tsx (~80 LOC) - leaderboard panel
```

### Hook Split Pattern
```
// BEFORE: use-quiz-game.ts (439 LOC)
export function useQuizGame() { /* everything */ }

// AFTER:
// use-quiz-game.ts (~80 LOC) - composes sub-hooks
// use-quiz-game-state.ts (~100 LOC) - game state machine
// use-quiz-game-scoring.ts (~80 LOC) - scoring logic
// use-quiz-game-timer.ts (~60 LOC) - countdown timer
// use-quiz-game-powerups.ts (~80 LOC) - power-up effects
```

## Implementation Steps

### Step 1: Split chart components (highest LOC reduction)
- `svg-charts-extended.tsx` (1161) -> 6-8 individual chart files
- `svg-charts.tsx` (736) -> 4-5 chart files
- Combined: ~1900 LOC -> 10-12 files averaging 150 LOC each

### Step 2: Split kaiwa components
- `kaiwa-setup-view.tsx` (702) -> setup sections
- `kaiwa-session-view.tsx` (627) -> message display + input + controls
- `kaiwa-start-screen.tsx` (568) -> mode cards + topic browser

### Step 3: Split management tabs
- `vocabulary-tab.tsx` (632) -> form + list + bulk ops
- `kanji-tab.tsx` (609) -> form + list + search
- `flashcards-tab.tsx` (554) -> list + form + bulk
- `image-word-management.tsx` (551) -> form + gallery + mapping
- `flashcard-form.tsx` (558) -> field groups

### Step 4: Split page components
- `game-hub-page.tsx` (544) -> grid + setup + active game
- `home-page.tsx` (528) -> hero + activities + stats + leaderboard
- `jlpt/index.tsx` (531) -> setup + practice + results

### Step 5: Split remaining components
- `game-create.tsx` (849) -> per-game forms
- `slide-editor-canvas.tsx` (600) -> renderers + toolbar
- `sidebar.tsx` (568) -> nav sections

### Step 6: Split hooks
- `use-speaking-practice.ts` (512) -> recognition + evaluation + state
- `use-quiz-game.ts` (439) -> state + scoring + timer + powerups
- `use-kaiwa-session-history.ts` (418) -> storage + replay + stats
- `use-speech.ts` (394) -> TTS + STT + voice
- `use-daily-words.ts` (389) -> selection + progress + streak

### Step 7: Performance review
- Run `npm run analyze` (ANALYZE=1 vite build)
- Compare chunk sizes with pre-migration baseline
- Verify lazy loading works for all routes
- Check no duplicate context provider renders
- Test page transition performance

### Step 8: Bundle verification
- Ensure vendor chunks unchanged (firebase, react, lucide)
- Verify new route-based code splitting works
- Check no accidental eager imports of lazy pages

## Todo

- [ ] Split svg-charts-extended.tsx (1161 LOC)
- [ ] Split svg-charts.tsx (736 LOC)
- [ ] Split game-create.tsx (849 LOC)
- [ ] Split kaiwa-setup-view.tsx (702 LOC)
- [ ] Split vocabulary-tab.tsx (632 LOC)
- [ ] Split kaiwa-session-view.tsx (627 LOC)
- [ ] Split kanji-tab.tsx (609 LOC)
- [ ] Split slide-editor-canvas.tsx (600 LOC)
- [ ] Split sidebar.tsx (568 LOC)
- [ ] Split kaiwa-start-screen.tsx (568 LOC)
- [ ] Split flashcard-form.tsx (558 LOC)
- [ ] Split flashcards-tab.tsx (554 LOC)
- [ ] Split image-word-management.tsx (551 LOC)
- [ ] Split game-hub-page.tsx (544 LOC)
- [ ] Split home-page.tsx (528 LOC)
- [ ] Split jlpt/index.tsx (531 LOC)
- [ ] Split use-speaking-practice.ts (512 LOC)
- [ ] Split use-quiz-game.ts (439 LOC)
- [ ] Split use-kaiwa-session-history.ts (418 LOC)
- [ ] Split use-speech.ts (394 LOC)
- [ ] Split use-daily-words.ts (389 LOC)
- [ ] Run bundle analysis
- [ ] Verify lazy loading
- [ ] Performance smoke test
- [ ] Lint + test

## Success Criteria

- [ ] All files < 200 LOC
- [ ] No behavioral changes (all tests pass)
- [ ] Bundle size same or smaller
- [ ] Lazy loading verified for all routes
- [ ] No duplicate renders from provider changes

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Circular imports from splitting | MEDIUM | Use barrel files, careful dependency direction |
| Performance regression from more files | LOW | Vite handles tree-shaking well |
| State leaks between split hook parts | MEDIUM | Test each hook split independently |
| CSS specificity issues after split | LOW | CSS is per-file, follows component |

## Security Considerations
- No security changes -- pure refactoring
- Ensure no accidental exposure of admin-only components in wrong chunks

## Next Steps
After Phase 5, the architectural redesign is complete. Future work:
- Remove remaining CSS `!important` declarations (116 instances)
- Add route-level error boundaries
- Add route-level loading states
- Consider React Server Components if/when applicable
