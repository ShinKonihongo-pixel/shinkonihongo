# Phase 5: Styling & Animations

**Parent**: [plan.md](./plan.md)
**Dependencies**: Phase 4 (UI components)
**Date**: 2026-02-27 | **Priority**: Medium | **Status**: Pending

## Overview

Create `kanji-drop.css` with dark glassmorphism theme matching existing games. Includes drop/reflow/clear animations, responsive mobile layout, and VIP styling.

## Key Insights

- All classes prefixed `kd-` to avoid collisions
- Dark gaming theme: `#0F0F23` bg, `#7C3AED` primary purple accent
- Glass elements: `backdrop-filter: blur(12px)`, `rgba(124, 58, 237, 0.08)` backgrounds
- Text: `#E2E8F0` primary, `#94A3B8` muted
- Mobile breakpoint: `< 640px`
- Reference: word-scramble.css for layout patterns, design-guidelines.md for color palette

## Requirements

1. Page layout: full-height dark background
2. Setup card: glassmorphism card centered
3. Pool grid: CSS grid auto-fit, tile hover/selected states
4. Bottom row: flex row, slot borders, locked visual, filled glow
5. Power-up bar: horizontal flex, button with icon + count
6. Result card: centered glassmorphism with stats grid
7. Animations: tile drop (translateY), reflow slide (translateX), clear pop+fade, cascade glow
8. Mobile: pool grid collapses to 4-5 columns, bottom row scales or scrolls
9. Tutorial overlay: backdrop blur, stepped card

## Architecture

### File: `src/components/pages/kanji-drop/kanji-drop.css`

Key sections (abbreviated -- full file during implementation):

```css
/* === Page === */
.kd-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
  color: #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

/* === Setup === */
.kd-setup { width: 100%; max-width: 480px; }
.kd-setup-card {
  background: rgba(15, 15, 35, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 2rem;
  animation: kd-slide-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.kd-setup-header { text-align: center; margin-bottom: 1.5rem; }
.kd-logo-icon { font-size: 3rem; }
.kd-setup-header h1 {
  font-size: 1.75rem;
  background: linear-gradient(135deg, #7C3AED, #A78BFA);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.kd-subtitle { color: #94A3B8; font-size: 0.875rem; }
.kd-vip-badge {
  display: inline-flex; align-items: center; gap: 4px;
  background: linear-gradient(135deg, #a855f7, #ec4899);
  color: white; padding: 2px 10px; border-radius: 12px;
  font-size: 0.75rem; font-weight: 600;
}

/* Level chips (same pattern as word-scramble) */
.kd-levels { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.kd-level-chip {
  padding: 0.5rem 1rem; border-radius: 10px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: #94A3B8; cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; gap: 0.5rem;
}
.kd-level-chip.selected {
  background: rgba(124, 58, 237, 0.2);
  border-color: #7C3AED; color: #A78BFA;
}
.kd-level-chip:disabled { opacity: 0.3; cursor: not-allowed; }

/* === Playing Screen === */
.kd-playing {
  width: 100%; max-width: 600px;
  display: flex; flex-direction: column; gap: 1rem;
}
.kd-game-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(15, 15, 35, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.06);
}
.kd-level-badge, .kd-score-display {
  display: inline-flex; align-items: center; gap: 4px;
  font-weight: 600; font-size: 0.875rem;
}
.kd-level-badge { color: #A78BFA; }
.kd-score-display { color: #fbbf24; }

/* === Pool Grid === */
.kd-pool {
  background: rgba(15, 15, 35, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 1rem;
  border: 1px solid rgba(255,255,255,0.06);
}
.kd-pool-header {
  display: flex; justify-content: space-between;
  margin-bottom: 0.75rem; font-size: 0.875rem;
  color: #94A3B8;
}
.kd-pool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(52px, 1fr));
  gap: 8px;
}
.kd-pool-tile {
  aspect-ratio: 1;
  display: flex; align-items: center; justify-content: center;
  background: rgba(124, 58, 237, 0.1);
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.5rem;
}
.kd-pool-tile:hover:not(:disabled) {
  background: rgba(124, 58, 237, 0.25);
  border-color: #7C3AED;
  transform: scale(1.05);
  box-shadow: 0 0 12px rgba(124, 58, 237, 0.3);
}
.kd-pool-tile.selected {
  opacity: 0.2;
  cursor: not-allowed;
  transform: scale(0.9);
  border-color: rgba(255,255,255,0.05);
  background: rgba(255,255,255,0.02);
}

/* === Bottom Row === */
.kd-bottom {
  background: rgba(15, 15, 35, 0.7);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 1rem;
  border: 1px solid rgba(255,255,255,0.06);
}
.kd-bottom-label { color: #94A3B8; font-size: 0.75rem; margin-bottom: 0.5rem; }
.kd-bottom-row {
  display: flex; gap: 4px;
  overflow-x: auto;
}
.kd-bottom-slot {
  width: 48px; height: 56px;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px;
  border: 2px dashed rgba(255,255,255,0.12);
  transition: all 0.3s;
  font-size: 1.25rem;
}
.kd-bottom-slot.locked {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.06);
}
.kd-lock-icon { color: rgba(255,255,255,0.15); }
.kd-bottom-slot.filled {
  border-style: solid;
  border-color: rgba(124, 58, 237, 0.4);
  background: rgba(124, 58, 237, 0.15);
  animation: kd-tile-drop 0.3s ease-out;
}
.kd-slot-char { font-weight: 600; }

/* === Power-ups === */
.kd-powerups {
  display: flex; gap: 0.5rem; justify-content: center;
}
.kd-powerup-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 0.5rem 1rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  color: #E2E8F0;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.8rem;
}
.kd-powerup-btn:hover:not(:disabled) {
  background: rgba(var(--pu-color-rgb, 124,58,237), 0.15);
  border-color: var(--pu-color, #7C3AED);
}
.kd-powerup-btn.disabled {
  opacity: 0.3; cursor: not-allowed;
}
.kd-pu-count {
  background: rgba(255,255,255,0.1);
  padding: 1px 6px; border-radius: 6px;
  font-size: 0.7rem; font-weight: 600;
}

/* === Buttons (shared) === */
.kd-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 0.625rem 1.25rem; border-radius: 10px;
  font-weight: 600; font-size: 0.875rem;
  cursor: pointer; border: none; transition: all 0.2s;
}
.kd-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.kd-btn-primary {
  background: linear-gradient(135deg, #7C3AED, #A78BFA);
  color: white;
}
.kd-btn-primary:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
.kd-btn-secondary {
  background: rgba(124, 58, 237, 0.15);
  border: 1px solid rgba(124, 58, 237, 0.3);
  color: #A78BFA;
}
.kd-btn-ghost {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.1);
  color: #94A3B8;
}
.kd-btn-icon {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: #94A3B8;
  padding: 0.5rem; border-radius: 8px; cursor: pointer;
}

/* === Result === */
.kd-result { width: 100%; max-width: 480px; }
.kd-result-card {
  background: rgba(15, 15, 35, 0.85);
  backdrop-filter: blur(16px);
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  border: 1px solid rgba(255,255,255,0.08);
  animation: kd-slide-up 0.4s ease-out;
}
.kd-result-emoji { font-size: 4rem; margin-bottom: 0.5rem; }
.kd-result-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin: 1.5rem 0;
}
.kd-stat {
  display: flex; flex-direction: column; align-items: center;
  padding: 0.75rem;
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.06);
}
.kd-stat-value { font-size: 1.5rem; font-weight: 700; color: white; }
.kd-stat-label { font-size: 0.75rem; color: #94A3B8; }
.kd-result-actions {
  display: flex; gap: 0.5rem; justify-content: center;
  flex-wrap: wrap;
}

/* === Tutorial === */
.kd-tutorial-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  animation: kd-fade-in 0.3s ease;
}
.kd-tutorial-card {
  background: rgba(15, 15, 35, 0.95);
  border-radius: 20px;
  padding: 2rem;
  max-width: 400px;
  border: 1px solid rgba(124, 58, 237, 0.3);
  position: relative;
}
.kd-tutorial-close {
  position: absolute; top: 0.75rem; right: 0.75rem;
  background: none; border: none; color: #94A3B8; cursor: pointer;
}
.kd-tutorial-steps { margin: 1.5rem 0; }
.kd-tutorial-step {
  display: flex; align-items: center; gap: 0.75rem;
  margin-bottom: 1rem; color: #E2E8F0;
}
.step-num {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #7C3AED, #A78BFA);
  border-radius: 50%; font-weight: 700; font-size: 0.8rem;
  flex-shrink: 0;
}

/* === Animations === */
@keyframes kd-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes kd-slide-up {
  from { opacity: 0; transform: translateY(30px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes kd-tile-drop {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes kd-tile-clear {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
  100% { transform: scale(0); opacity: 0; }
}
@keyframes kd-tile-slide {
  from { transform: translateX(var(--slide-from, 0)); }
  to { transform: translateX(0); }
}
@keyframes kd-cascade-glow {
  0% { box-shadow: 0 0 0 rgba(124, 58, 237, 0); }
  50% { box-shadow: 0 0 20px rgba(124, 58, 237, 0.5); }
  100% { box-shadow: 0 0 0 rgba(124, 58, 237, 0); }
}

/* Animation utility classes */
.kd-clearing { animation: kd-tile-clear 0.4s ease-out forwards; }
.kd-sliding { animation: kd-tile-slide 0.3s ease-in-out; }
.kd-cascading { animation: kd-cascade-glow 0.6s ease-in-out; }

/* === Mobile Responsive === */
@media (max-width: 640px) {
  .kd-page { padding: 0.5rem; align-items: flex-start; padding-top: 1rem; }
  .kd-setup-card, .kd-result-card { padding: 1.25rem; }
  .kd-pool-grid {
    grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
    gap: 6px;
  }
  .kd-pool-tile { font-size: 1.25rem; }
  .kd-bottom-slot { width: 40px; height: 48px; font-size: 1rem; }
  .kd-powerup-btn { padding: 0.4rem 0.75rem; font-size: 0.75rem; }
  .kd-pu-label { display: none; } /* Hide labels, show only icons on mobile */
  .kd-setup-footer, .kd-result-actions {
    flex-direction: column;
  }
  .kd-setup-footer .kd-btn, .kd-result-actions .kd-btn {
    width: 100%; justify-content: center;
  }
}
```

## Related Code Files

| File | Role |
|------|------|
| `src/components/pages/word-scramble/word-scramble.css` | Reference: dark theme styling |
| `src/App.css` | CSS variables (rm- prefixed) |
| `docs/design-guidelines.md` | Color palette, spacing, animation patterns |

## Implementation Steps

1. Create `kanji-drop.css`
2. Style page layout (.kd-page)
3. Style setup screen (card, levels, buttons)
4. Style pool grid (tiles, hover, selected)
5. Style bottom row (slots, locked, filled, drop animation)
6. Style power-up bar
7. Style result screen (stats grid, actions)
8. Style tutorial overlay
9. Add animations (drop, clear, slide, cascade glow)
10. Add mobile responsive styles (< 640px)

## Todo

- [ ] Create kanji-drop.css
- [ ] Verify dark glassmorphism matches existing games
- [ ] Test pool grid responsiveness on 320px-414px widths
- [ ] Test bottom row with 10 slots on small screens
- [ ] Verify animations don't cause layout shift

## Success Criteria

- Visual consistency with word-scramble and other games
- Pool tiles have clear interactive states (hover, selected, disabled)
- Bottom row slots clearly distinguish empty/filled/locked
- Animations are smooth (60fps) and brief (< 500ms)
- Mobile layout is usable on 375px width screens
- No horizontal overflow on any screen size

## Risk Assessment

- **Bottom row overflow on mobile**: 10 x 40px = 400px; fits on 375px with `overflow-x: auto` as fallback
- **Backdrop-filter performance**: acceptable; same pattern used across all game pages
- **Animation jank during cascade**: mitigated by CSS-only transforms (GPU-accelerated)

## Security Considerations

- CSS only; no security implications

## Next Steps

Phase 6: Integration -- wire everything into Game Hub
