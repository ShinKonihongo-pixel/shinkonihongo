# Phase 6: CSS Architecture Cleanup

## Context
- [Main Plan](./plan.md)
- **Date:** 2026-03-26
- **Priority:** MEDIUM | **Risk:** MEDIUM | **Status:** NOT STARTED

## Overview
Eliminate `!important` from top CSS files, standardize overlay/modal classes, document CSS conventions. Target: zero `!important` in top 5 files, unified modal/overlay pattern.

## Key Insights
- 129 `!important` across 29 CSS files (audit found 80 in top 15)
- Top offenders: cards-management.css (26), App.css (13), ai-challenge.css (10), golden-bell.css (6), quiz-game-lobby.css (5)
- 5 overlay/modal class variants with no consistency
- No CSS custom properties for spacing/colors (each file reinvents)
- Recent CSS split (commit 395ca01) created many small files but didn't fix specificity

## Requirements
1. Eliminate `!important` from cards-management.css (26), App.css (13), ai-challenge.css (10)
2. Reduce remaining `!important` by 80%+ across all files
3. Standardize modal/overlay CSS to single pattern
4. Create CSS custom properties file for shared values
5. Document CSS conventions for future development

## Architecture

### New/modified files
```
src/styles/
  variables.css          # CSS custom properties (colors, spacing, z-index, shadows)
  modal.css              # Unified modal/overlay pattern
  conventions.md         # CSS conventions documentation
```

### CSS Custom Properties
```css
:root {
  /* Z-index layers (mirrors z-index.ts from Phase 1) */
  --z-sidebar: 100;
  --z-dropdown: 200;
  --z-overlay: 500;
  --z-modal: 600;
  --z-toast: 700;

  /* Dark glassmorphism theme */
  --bg-primary: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
  --text-primary: rgba(255, 255, 255, 0.95);
  --text-secondary: rgba(255, 255, 255, 0.7);
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-medium: rgba(255, 255, 255, 0.12);
  --accent-purple: #8b5cf6;
  --accent-pink: #ec4899;
  --glass-blur: blur(12px);

  /* Spacing scale */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
}
```

### Unified Modal Pattern
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: var(--z-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: rgba(26, 26, 46, 0.95);
  border: 1px solid var(--border-medium);
  border-radius: 1rem;
  backdrop-filter: var(--glass-blur);
  z-index: var(--z-modal);
  max-height: 90vh;
  overflow-y: auto;
}
```

## Related Code Files
- `src/components/cards-management/cards-management.css` (26 !important)
- `src/App.css` (13 !important)
- `src/components/ai-challenge/ai-challenge.css` (10 !important)
- `src/components/golden-bell/golden-bell.css` (6 !important)
- `src/components/quiz-game/quiz-game-lobby.css` (5 !important)
- `src/components/game-hub/race-game-v2.css` (4 !important)
- `src/components/shared/game-lobby/premium-lobby.css` (4 !important)

## Implementation Steps

### Step 1: Create CSS variables file
- Define all shared custom properties
- Import at top of App.css (or main entry)
- No visual changes - just defining variables

### Step 2: Fix cards-management.css (26 !important)
- Audit each `!important` - determine why it was needed
- Common causes: specificity wars with App.css, overriding library styles
- Fix by increasing selector specificity naturally (e.g., `.cards-management .some-class`)
- Or by reordering CSS imports

### Step 3: Fix App.css (13 !important)
- App.css is loaded first; its styles should have lowest specificity
- Remove !important by ensuring app-level styles are base-level selectors
- Component CSS naturally overrides by load order

### Step 4: Fix ai-challenge.css (10 !important)
- Likely fighting with game-hub or quiz-game styles
- Scope all selectors under `.ai-challenge` container

### Step 5: Fix remaining files
- golden-bell.css (6), quiz-game-lobby.css (5), race-game-v2.css (4)
- Same pattern: scope under container class, remove !important

### Step 6: Standardize modal/overlay CSS
- Create unified `.modal-overlay` and `.modal-content` classes
- Audit all 96 createPortal/overlay usages
- Replace 5 class variants with single pattern
- Migrate one modal at a time

### Step 7: Document conventions
- Write `src/styles/conventions.md` covering: naming, specificity rules, z-index usage, theme variables, modal pattern

## Todo
- [ ] Create `src/styles/variables.css` with CSS custom properties
- [ ] Import variables.css in main entry point
- [ ] Fix cards-management.css: eliminate 26 `!important`
- [ ] Fix App.css: eliminate 13 `!important`
- [ ] Fix ai-challenge.css: eliminate 10 `!important`
- [ ] Fix golden-bell.css: eliminate 6 `!important`
- [ ] Fix quiz-game-lobby.css: eliminate 5 `!important`
- [ ] Fix remaining 4 files with `!important`
- [ ] Create unified modal/overlay CSS pattern
- [ ] Migrate top 10 modals to unified pattern
- [ ] Write CSS conventions documentation
- [ ] Final audit: `!important` count < 10 total (only for third-party overrides)

## Success Criteria
- Zero `!important` in top 5 CSS files
- Total `!important` count < 10 (only justified third-party overrides)
- Single modal/overlay CSS pattern used by all modals
- CSS custom properties used for all theme values
- Conventions documented

## Risk Assessment
- **MEDIUM**: Removing `!important` can cause unexpected style regressions
- Mitigation: fix one file at a time; visual diff each page that uses those styles
- Modal migration is high-risk for layout shifts; test each modal individually
- CSS load order changes can cascade unexpectedly

## Security Considerations
- None specific to CSS changes

## Unresolved Questions
- Should we adopt CSS Modules long-term? Current approach uses global CSS with BEM-like naming. CSS Modules would eliminate specificity issues entirely but require migrating all files.
- Are there third-party library styles that legitimately need `!important` overrides? Need to catalog during audit.
