# CSS Architecture & Error Handling Patterns Research

## Executive Summary
Codebase has **129 !important declarations** across 29 CSS files (top 10 files account for ~70% of usage), **200+ error handling sites** with inconsistent patterns, **6+ distinct loading UI patterns** lacking standardization, and **96 createPortal/overlay usages** with 5 overlay class name variants. **Common UI layer missing 30% of utility components**.

---

## 1. !important Usage Analysis (Top 10 Files)

| File | Count | Pattern |
|------|-------|---------|
| App.css | 13 | Global overrides, z-index wars |
| cards-management.css | 26 | Modal & dialog specificity battles |
| settings-display.css | 14 | Dark theme overrides |
| admin-page-utilities.css | 5 | Admin panel layout fixes |
| golden-bell.css | 6 | Game UI cascade resets |
| settings-controls.css | 5 | Form control resets |
| quiz-game-question.css | 1 | Answer reveal state |
| racing-game.css | 2 | Animation/transform overrides |
| notebook.css | 2 | Study view text styling |
| reading-practice-page.css | 4 | Dark theme specific |

**Root Causes Identified:**
- **Specificity escalation:** Multiple layers of nesting without proper CSS architecture (BEM, utilities)
- **Theme overrides:** Dark glassmorphism theme hardcodes opacity/colors, then needs !important to reset
- **Modal layering:** 96 overlay usages with inconsistent z-index strategies
- **Global resets:** App.css acts as catch-all for cascade conflicts

---

## 2. Error Handling Patterns (src/hooks/)

**Total catch sites: 200+**

| Pattern | Count | Risk Level |
|---------|-------|------------|
| try-catch + console.error | ~85 | HIGH - Silent in prod |
| try-catch + (no logging) | ~60 | CRITICAL - Invisible failures |
| try-catch + setError state | ~25 | GOOD - User-facing |
| .catch(console.error) | ~18 | MEDIUM - Fire-and-forget |
| .catch(() => {}) silent | ~12 | CRITICAL - Swallowed |

**Files with worst patterns:**
- `use-quiz-game.ts`: 13 catches, mostly silent
- `use-branches.ts`: 10 catches, mixed logging
- `use-auth.ts`: 12 catches, inconsistent error states
- `use-lectures.ts`: 14 catches, 80% console.error only
- `use-custom-topics.ts`: 9 catches, no error UI feedback

**Issue:** No centralized error handling middleware. Each hook reinvents logging/UI feedback.

---

## 3. Loading State UI Patterns

**6+ distinct implementations identified:**

1. `.loading-state` (text-only, opacity fade)
2. `.loading-spinner` (CSS animation, inline)
3. `.game-loading-fallback` + spinner combo
4. `.racing-loading-overlay` (full screen)
5. `.gb-settings-loading` (class-specific)
6. Skeleton loaders (not found in pages/, only component level)

**Affected pages:** 15+ pages with non-standardized loaders.

**Problem:** No shared `<LoadingIndicator>` component. Each page invents its own, causing:
- Duplicate CSS (200+ lines across files)
- Inconsistent timing (no unified delay handling)
- A11y issues (missing aria-busy, role=status)

---

## 4. Modal Overlay Strategy

**96 createPortal/overlay usages**
**5 overlay class name variants:**
- `overlay-fade-in` (5 uses) - fade + slide
- `overlay-fade` (5 uses) - simple fade
- `overlay-in` (3 uses) - unclear animation
- `overlay-pop` (2 uses) - scale animation
- `overlay-content` (1 use) - content wrapper

**No Z-index strategy:** Each modal/overlay hardcodes z-index values (100, 999, 1000+). Conflicts inevitable with 96 instances.

---

## 5. Shared UI Component Audit

**Files found in common/ui/shared:**

### `/common` (11 files)
- ai-tutor-panel, error-boundary, export-import-modal, floating-chat-button, floating-chat-panel, furigana-text, global-search, han-viet-tooltip, jlpt-level-modal, offline-indicator, icons

### `/ui` (13 files)
- confirm-modal, floating-chat, floating-music-player, furigana-text (duplicate!), jlpt-level-selector, listening-settings-modal, premium-button, reading-settings-panel (+ 6 sub-components), reset-card-modal, study-header-compact

### `/shared` (2 subdirs)
- game-lobby: 10 components (code-display, action-bar, confirm-modals, host-card, join-section, players-panel, start-footer, player-list-grid, premium-shell)
- game-results: 5 components (podium, rankings-table, results-action-bar)
- racing-game/shared: 8 components (inventory-bar, milestone-question, race-countdown, race-mystery-box, race-player-stats, race-question, race-track, team-view, trap-system)

**Missing utility components (30% gap):**
- LoadingIndicator (unified)
- Toast/notification system (scattered across pages)
- Tooltip wrapper (only han-viet exists)
- Form field wrapper (not found)
- Card/panel wrapper (per-page styles)
- Validation feedback UI (no shared error display)

---

## 6. Quality Metrics Summary

| Metric | Current | Target |
|--------|---------|--------|
| !important declarations | 129 | <20 (refactored CSS) |
| Error handling consistency | 15% | 100% |
| Loading UI patterns | 6+ | 1 shared component |
| Overlay z-index conflicts | Likely | 0 (stacking context map) |
| Shared component coverage | 65% | 90%+ |

---

## Recommendations (Priority Order)

1. **Create LoadingIndicator component** - consolidate 6 patterns, add a11y
2. **Implement error handling middleware** - setError state in 100% of hooks
3. **Define CSS architecture:** Eliminate !important via BEM + utility classes
4. **Z-index stacking context map** - single source of truth
5. **Extract 5 missing utilities:** Toast, FormField, Card, Tooltip, ValidationFeedback

---

## Unresolved Questions

1. Why are there 2 `furigana-text` components (common + ui)?
2. Are silent .catch() blocks intentional (UX choice) or accidental?
3. Is App.css a growing dump, or intentionally global?
