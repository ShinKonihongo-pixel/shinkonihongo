# Shinko Codebase - Duplicated Patterns Analysis Report

**Analysis Date:** 2026-03-27
**Scope:** 1,128 TypeScript/TSX files across src/components, src/hooks, src/contexts
**Status:** Thorough exploration covering 40+ key files and 300+ pattern matches

---

## EXECUTIVE SUMMARY

The codebase exhibits significant duplication across multiple domains:

- **249 files** contain modal/dialog patterns
- **165 files** contain loading indicators
- **115 files** contain confirmation/delete patterns
- **720+ class="card" declarations** across 163 files
- **144 CSS files** managing component-specific styles
- **26 Context files** for data management
- **1,128 total source files** with many game-specific duplicates

**Quick Win Opportunities:** 15+ patterns worth extracting into shared components/hooks

---

## 1. MODAL & DIALOG PATTERNS ⭐ HIGH PRIORITY

### Current Approach (Duplicated)

Each modal reimplements overlay behavior, animations, and styling:

- **Files affected:** 40+ modal files
- **Duplication instances:** 249 files reference "modal", "overlay", "backdrop"
- **Pattern repeats:** Overlay click-to-close, dialog centering, animations

### Key Modal Implementations Found

| Modal Type | Files | Issue |
|---|---|---|
| **ConfirmModal** | `ui/confirm-modal.tsx` (SHARED) | Only 1 reusable component - GOOD |
| **Form Modals** | assign-test, test-create, settings, etc. | Each has custom overlay styling |
| **Question Modals** | question-form-modal, custom-topics | Identical overlay patterns |
| **Settings Modals** | study/session, kanji-study, grammar-study | All use same overlay structure |

### CSS Duplication

**84 modal/overlay CSS files** found. Common patterns:
- Fixed positioning overlay (identical)
- Modal centering (flexbox - identical)
- Backdrop animation (nearly identical)
- z-index management (duplicated values)

### Recommendation

**Extract:** Generic `<ModalShell>` component

```tsx
interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  showHeader?: boolean;
  title?: string;
  className?: string;
}
```

**Impact:** ~35 modals could reduce ~200 LOC each = **~7,000 LOC reduction**

---

## 2. LOADING & SKELETON PATTERNS

### Current Approach (Partially Solved)

**Status:** Partially solved
- `ui/loading-indicator.tsx` exists and is GOOD (shared component)
- **165 files** still reference loading patterns independently

### Recommendation

**Extend:** `LoadingIndicator` hook + skeleton variant

**Impact:** Consolidate 165 loading patterns → 5 hook usages + 2 components

---

## 3. EMPTY STATE PATTERNS

### Current Approach (Duplicated)

**Files found:** 36 empty state implementations
**Pattern repeats:** 3-5 variations of same layout

### Recommendation

**Extract:** `<EmptyState>` component with configurable options

**Impact:** Consolidate 36 implementations → 1 component + variants = **~1,500 LOC reduction**

---

## 4. CONFIRMATION/DELETE DIALOG PATTERNS

### Current Approach (Partially Duplicated)

**Good:** `ConfirmModal` component exists
**Bad:** 115 files still implement their own confirmation logic

### Recommendation

**Audit & Migrate:** Replace 50+ custom confirmations with `<ConfirmModal>`

**Impact:** Remove ~40 custom confirmation implementations = **~2,000 LOC reduction**

---

## 5. CARD & PANEL LAYOUTS ⭐ HIGH PRIORITY

### Current Approach (Duplicated)

**Cards found:** 720+ instances of "className.*card" across 163 files
**Duplication:** Multiple card styling approaches

### Glassmorphism Pattern (Duplicated 326 times!)

**326 occurrences** of `backdrop-filter` across components found in 99+ CSS files

### Recommendation

**Extract:** Shared card system + CSS utilities

```tsx
// Component
<Card variant="glass" size="sm" onClick={...}>
  <Card.Header title="Lesson" />
  <Card.Content>...</Card.Content>
</Card>
```

**Impact:** Consolidate 100+ card implementations + 50+ CSS patterns = **~3,000 LOC reduction**

---

## 6. LEVEL SELECTOR PATTERNS

### Current Approach (Multiple Similar Implementations)

**Selector count:** 20 level-selector variants found

- `JLPTLevelSelector` (107 lines)
- `LevelGrid` (57 lines) - 80% identical to JLPTLevelSelector
- `JLPTLevelModal`, `level-lesson-selector`, game-selector variants

### Recommendation

**Consolidate:** Merge JLPTLevelSelector + LevelGrid into single configurable component

**Impact:** Merge 5 implementations → 1 component = **~400 LOC reduction**

---

## 7. FORM STATE MANAGEMENT PATTERNS

### Current Approach (Duplicated)

**Pattern:** Each form/modal manages state independently

**Files affected:** 25+ form files

### Recommendation

**Extract:** `useForm` hook

```tsx
export function useForm<T>(options: UseFormOptions<T>) {
  // Handle state, validation, submission loading/error states
}
```

**Impact:** Consolidate 25+ form implementations = **~1,200 LOC reduction**

---

## 8. SEARCH/FILTER PATTERNS

### Current Approach (Duplicated)

Search input fields duplicated across 80+ components

### Recommendation

**Extract:** `useSearch` hook + `<SearchInput>` component

**Impact:** Extract 50+ search implementations = **~800 LOC reduction**

---

## 9. LIST/TABLE RENDERING PATTERNS

### Current Approach

Files: Rankings tables, player grids, flashcard lists (10+ implementations)

### Recommendation

**Extract:** Generic `<VirtualList>` component + card renderers

**Impact:** Consolidate 10+ list implementations = **~600 LOC reduction**

---

## 10. BUTTON & INTERACTIVE ELEMENT PATTERNS ⭐ QUICK WIN

### Current Approach (Highly Duplicated)

**Button class patterns:** 1,001 occurrences across 250 files

### CSS Duplication

Identical button styles appear in 20+ CSS files across the app

### Recommendation

**Extract:** Global button system

```tsx
// Component
<Button variant="primary" size="md" disabled={isLoading}>
  {isLoading ? <Spinner size="sm" /> : 'Submit'}
</Button>

// Create src/styles/buttons.css with all variants
```

**Impact:** Centralize button styles = **~2,000 LOC CSS reduction**

---

## 11. FIREBASE CRUD OPERATIONS

### Current Approach (Service-Based)

**Good:** Firebase operations are centralized in services (42 files)

### Recommendation

**Standardize:** Unified hook pattern for all services

**Impact:** Standardize 15+ CRUD hooks

---

## 12. ACHIEVEMENT & TOAST NOTIFICATION PATTERNS

### Current Approach

Toast/notification patterns scattered across layout

### Recommendation

**Extract:** Generic `<Toast>` component + notification system

**Impact:** Consolidate toast/notification patterns = **~800 LOC reduction**

---

## SUMMARY TABLE: EXTRACTION OPPORTUNITIES

| Pattern | Files | Duplication | Priority | LOC Saved | Effort |
|---|---|---|---|---|---|
| **Modal/Overlay Shell** | 35+ | High | HIGH | 7,000 | Medium |
| **Card System** | 100+ | High | HIGH | 3,000 | Medium |
| **Button Styles** | 20+ CSS | Very High | HIGH | 2,000 | Low |
| **Form Hook** | 25+ | High | MEDIUM | 1,200 | Low |
| **Empty State** | 36 | Medium | MEDIUM | 1,500 | Low |
| **Level Selector** | 5 | Very High | MEDIUM | 400 | Low |
| **Search Hook** | 50+ | Medium | MEDIUM | 800 | Low |
| **Loading Patterns** | 165 | Medium | LOW | 500 | Low |
| **List/Table** | 10+ | Medium | MEDIUM | 600 | Low |
| **Toast System** | 15+ | Medium | MEDIUM | 800 | Low |
| **Confirmation Modal** | 50+ | High | MEDIUM | 2,000 | Low |
| **CRUD Hooks** | 15+ | Medium | LOW | 300 | Low |

**Total Potential Reduction:** ~21,700 LOC

---

## IMPLEMENTATION ROADMAP

### Phase 1: High-Impact, Low Effort (Week 1)

1. **Button System** - Create `src/styles/buttons.css` + `src/components/ui/button.tsx`
2. **Form Hook** - Create `src/hooks/useForm.ts`
3. **Search Hook** - Create `src/hooks/useSearch.ts`

### Phase 2: Medium Effort (Weeks 2-3)

1. **Modal Shell** - Create `src/components/ui/modal-shell.tsx`
2. **Empty State** - Create `src/components/ui/empty-state.tsx`
3. **Card System** - Create `src/components/ui/card.tsx` + consolidate CSS

### Phase 3: Extended Patterns (Weeks 4-5)

1. **Level Selector** - Consolidate 5 implementations
2. **Toast System** - Centralize notification handling
3. **List/Table** - Create virtual list component
4. **Confirmation Modal** - Audit 50+ confirmations, migrate to `<ConfirmModal>`

---

## FILES REQUIRING PRIORITY ATTENTION

### High Duplication (>3 variations of same pattern)

1. `/src/components/ui/` - Modal shells, confirm modal, loading indicator
2. `/src/components/shared/game-lobby/` - 5+ confirmation modals
3. `/src/components/shared/game-results/` - Rankings and results tables
4. `/src/components/classroom/` - 15+ modals with custom overlays
5. `/src/components/cards-management/` - Form state across 10+ tabs
6. `/src/components/flashcard/` - Card list variants
7. `/src/components/kaiwa/topics-management/` - Question/Topic form modals

### CSS Files to Consolidate

1. `/src/components/ui/` - Centralize button, modal, loading CSS
2. `/src/components/shared/game-lobby/premium-lobby.css` - 21 glass patterns
3. `/src/components/quiz-game/quiz-game-premium.css` - 11 glass patterns
4. `/src/components/home/home.css` - Button definitions

---

## VALIDATION

Analysis based on:
- ✓ 1,128 source files scanned
- ✓ 40+ key components examined
- ✓ Pattern matching across 300+ file matches
- ✓ CSS duplication analysis (144 CSS files)
- ✓ Hook/context structure review (26 contexts)
- ✓ Service layer consistency check (42 services)

