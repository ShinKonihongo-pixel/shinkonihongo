# Phase 1: UI Consistency Foundation

## Context
- [Main Plan](./plan.md)
- **Date:** 2026-03-26
- **Priority:** HIGH | **Risk:** LOW | **Status:** NOT STARTED

## Overview
Create shared UI primitives to replace 6+ loading patterns, inconsistent error displays, and ad-hoc z-index values. Foundation for all subsequent phases.

## Key Insights
- 6+ different loading spinner implementations across pages (inline HTML in Suspense fallbacks, custom spinners per page, etc.)
- No shared ErrorDisplay; errors shown via `alert()`, inline text, or silently swallowed
- 96 createPortal/overlay usages with 5 class variants, no z-index strategy
- Missing primitives: LoadingIndicator, ErrorDisplay, Toast, FormField, Tooltip

## Requirements
1. Create `LoadingIndicator` component with size variants (sm/md/lg) and optional label
2. Create `ErrorDisplay` component with severity levels (info/warning/error)
3. Create `z-index.ts` constants file with documented stacking layers
4. All new components must match existing dark glassmorphism theme
5. Zero behavior changes - visual appearance must be pixel-identical where replacing existing UI

## Architecture

### New files
```
src/components/ui/
  loading-indicator.tsx    # Shared spinner with size/label props
  loading-indicator.css
  error-display.tsx        # Consistent error UI (inline/banner/toast)
  error-display.css
src/constants/
  z-index.ts              # Z_INDEX.MODAL, Z_INDEX.OVERLAY, Z_INDEX.TOAST, etc.
```

### LoadingIndicator API
```tsx
interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  fullScreen?: boolean;
  inline?: boolean;
}
```

### ErrorDisplay API
```tsx
interface ErrorDisplayProps {
  message: string;
  severity?: 'info' | 'warning' | 'error';
  onRetry?: () => void;
  compact?: boolean;
}
```

### Z-Index Constants
```ts
export const Z_INDEX = {
  SIDEBAR: 100,
  DROPDOWN: 200,
  OVERLAY: 500,
  MODAL: 600,
  TOAST: 700,
  FLOATING_BUTTON: 800,
  TOOLTIP: 900,
} as const;
```

## Related Code Files
- `src/App.tsx` lines 122-128, 549 (loading spinners)
- `src/components/common/offline-indicator.tsx`
- `src/components/common/error-boundary.tsx`
- All Suspense fallback inline JSX across lazy-loaded pages

## Implementation Steps

### Step 1: Create z-index constants
- Audit all current z-index values in CSS and inline styles
- Create `src/constants/z-index.ts` with documented layers
- Export both as CSS custom properties and TS constants

### Step 2: Build LoadingIndicator
- Extract common spinner markup from App.tsx loading screens
- Support fullScreen (login loading), inline (page loading), compact (button loading)
- CSS uses existing `.app-loading-spinner` keyframes

### Step 3: Build ErrorDisplay
- Survey existing error UI patterns
- Create component matching glassmorphism theme
- Support retry callback for network errors

### Step 4: Replace existing loading patterns
- Replace App.tsx inline loading JSX with `<LoadingIndicator>`
- Replace Suspense fallback inline HTML with `<LoadingIndicator inline />`
- Update each page one-by-one, verifying no visual change

### Step 5: Adopt ErrorDisplay in key pages
- Start with pages that already show error text
- Add to components currently using bare `<p>` error messages

## Todo
- [ ] Audit all z-index values across CSS files
- [ ] Create `src/constants/z-index.ts`
- [ ] Create `src/components/ui/loading-indicator.tsx` + CSS
- [ ] Create `src/components/ui/error-display.tsx` + CSS
- [ ] Replace 6 loading patterns in App.tsx and Suspense fallbacks
- [ ] Replace inline error text in top 10 most-used pages
- [ ] Verify no visual regression on each replaced instance

## Success Criteria
- Single `LoadingIndicator` used in all loading states
- Single `ErrorDisplay` used in all error states
- All z-index values reference constants (no magic numbers)
- No new CSS, only reuse of shared components

## Risk Assessment
- **LOW**: Pure additive changes; existing CSS classes preserved
- Replace one file at a time; easy rollback per file
- Visual-only changes with no logic impact

## Security Considerations
- ErrorDisplay must sanitize user-facing error messages (no stack traces)
- Never expose internal error details from Firebase/API

## Next Steps
After completion, Phase 3 (App.tsx decomposition) and Phase 6 (CSS cleanup) can reference these shared components and z-index constants.
