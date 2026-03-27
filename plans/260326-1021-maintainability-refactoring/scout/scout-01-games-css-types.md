# Scout Report: Game Hook Patterns & CSS Architecture
**Date:** 2026-03-26  
**Scope:** `/src/hooks/` + CSS variable system

---

## 1. Shared Game Hooks (`src/hooks/shared/`)

Found **8 files** providing reusable game infrastructure:
- `use-game-room-state.ts` — Generic Firestore-synced state (replaces identical boilerplate across 6 games)
- `use-lobby-state.ts` — Shared lobby UI state + player normalization
- `use-game-session-save.ts` — Firestore session persistence
- `use-game-room-actions.ts` — Room creation/joining/leaving
- `use-bot-auto-join.ts` — Bot player logic
- `use-notification.ts` — Toast/event notifications
- `use-game-timers.ts` — Shared timer utilities
- `game-types.ts` — Base types: `BaseGame`, `BasePlayer`, `SetGame`

**Key:** Hooks are composable and generic—new games inherit via composition, not copy-paste.

---

## 2. Hook Composition Patterns

### Bingo Game (`src/hooks/bingo-game/index.ts`)
Main hook **composes 6+ sub-hooks**:
- `useGameComputed()` — Derived state (isHost, currentPlayer, sortedPlayers, etc.)
- `useGameCreate()` — Game initialization
- `useGameManagement()` — Player join/leave/kick, start game
- `useGameDraw()` — Question-draw logic
- `useGameBingo()` — Bingo claim/win logic
- `useGameSkills()` — Special skill mechanics
- `useBotAutoplay()` — Bot automation

**Firestore sync:** 500ms debounce, prevents excessive writes.

### Racing Game (`src/hooks/racing-game/index.ts`)
Composes **11 sub-hooks** (more complex):
- `useGameState()` — Core state management
- `useTimers()` — Timer refs (question, bot, answer)
- `useBotLogic()` — Bot behavior
- `useGameCreation()`, `usePlayerActions()`, `useHostActions()`
- `useSpecialFeatures()` — Mystery boxes, special powers
- `useTrapSystem()` — Trap placement/collision
- `useInventory()` — Item system
- `useTeamActions()` — Team scoring
- `useVehicleSelection()` — Vehicle picker

**Pattern:** Similar to Bingo but with more specialized features. Composability enables code reuse.

---

## 3. CSS Variables in Use (215 occurrences)

**Top files using CSS vars:**
- `App.css` — **110 vars** (color system: shu, ai, sakura, matcha, washi, kinari, sumi)
- `game-modals.css` — **40 vars** (game-specific theming)
- `jlpt-base.css` — **8 vars**
- `center-dashboard-page.css` — **16 vars**

### Current Color Palette (App.css)
```
--jp-shu: #E34234 (red) + light/dark variants
--jp-ai: #264E73 (blue) + variants
--jp-sakura: #FFB7C5 (pink) + variants
--jp-matcha: #7B9E6B (green) + variants
--jp-washi: #FAF8F5 (warm white)
--jp-kinari: #F5F1EB (neutral)
--jp-sumi: #1C1C1C (dark)
```

### Premium Lobby CSS Vars
`premium-lobby.css` uses dynamic accent system:
```css
--pl-accent: #a78bfa (default purple)
--pl-accent-dark: #7c3aed
--pl-accent-rgb: 167, 139, 250  /* for rgba() fallback */
```
Set inline per game to customize theme (kanji-battle uses red `#EF4444`).

---

## 4. Kanji Seed Data (`src/data/kanji-seed/`)

**10 files found** (no lazy-load yet):
- `index.ts` — Main export
- `n1.ts`, `n2.ts`, `n3.ts`, `n4.ts`, `n5.ts` — JLPT levels
- `n1-part1.ts`, `n1-part2.ts`, `n1-part3.ts` — N1 split
- `bt.ts` — Basic/test set

**Decomposition:** `krad-decomposition.ts` (~10K+ entries) uses static object—currently not lazy-loaded.  
**Feasibility:** Suitable for tree-shaking or dynamic import by level. No structural blocker.

---

## 5. Type Safety: `as any` Usage

**13 occurrences total** across 9 files. Shared hooks:
- `use-game-room-state.ts:125` — `(b as any).score ?? 0` (sort fallback)
- `use-lobby-state.ts:46` — `(p as any).isBot` (property check)

**Impact:** Low—only 2 in shared hooks, used defensively for optional properties.  
**Refactor path:** Could type union `BasePlayer | { isBot?: boolean }` to eliminate.

---

## 6. Premium Lobby Shell Architecture

**File:** `src/components/shared/game-lobby/premium-lobby-shell.tsx`  
**Lines 1-50:** Props interface shows **theming abstraction**:

```typescript
interface PremiumLobbyAccent {
  accent: string;           // e.g. '#E040FB'
  accentDark: string;      // e.g. '#9C27B0'
  accentRgb: string;       // e.g. '224, 64, 251'
}

interface PremiumLobbyShellProps {
  title: string;
  metaTags?: ReactNode;
  leftContent: ReactNode;   // host card, QR, rules
  rightContent: ReactNode;  // players grid
  footerContent: ReactNode; // start button
  accent: PremiumLobbyAccent;
  onLeave: () => void;
  qrHidden?: boolean;
}
```

**CSS structure:** Dynamic accent injected via inline `style={{ '--pl-accent': ... }}`.  
**Reuse:** Portal-based, shared across ≥5 game lobbies. Highly maintainable.

---

## Summary

| Category | Finding |
|----------|---------|
| **Shared Hooks** | 8 files; excellent composability. Reduces duplication. |
| **Game-Specific Hooks** | Bingo: 6+ sub-hooks. Racing: 11 sub-hooks. Pattern scalable. |
| **CSS Vars** | 215 total. 110 in App.css (color system). Dynamic per-game themes via inline styles. |
| **Type Safety** | 13 `as any` usage; only 2 in shared hooks. Low risk, refactorable. |
| **Kanji Data** | 10 files, no lazy-load. Feasible for dynamic import by level. |
| **Lobby Reuse** | Premium shell: highly abstracted, portal-based. 5+ games reuse. |

**Conclusion:** Codebase follows **composition over duplication** for game logic. CSS vars system is in place but unevenly distributed. Type safety is good with minor edge cases.

---

## Unresolved Questions
- Should kanji-seed be lazy-loaded per JLPT level? (Current: all loaded at startup)
- Plan for consolidating CSS vars across game-modals + app-level system?
