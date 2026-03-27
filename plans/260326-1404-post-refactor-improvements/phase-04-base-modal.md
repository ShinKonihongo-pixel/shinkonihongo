# Phase 4: Base Modal

**Date:** 2026-03-26 | **Priority:** P3 | **Status:** NOT_STARTED
**Estimated effort:** 2 hours | **Risk:** Medium

---

## Overview
Create shared BaseModal wrapper for consistent overlay/portal/close behavior. Migrate top 5 most-used modals.

## Key Insights
- 58 modal files each implement own overlay, portal, close button
- No consistent modal API (some use createPortal, some don't)
- ConfirmModal already shared but has its own overlay

## Implementation Steps
1. Audit top 5 modal patterns (overlay class, portal usage, close handler)
2. Create `src/components/ui/base-modal.tsx` (<100 LOC)
3. Props: isOpen, onClose, title?, size?, children
4. Migrate ConfirmModal + 4 high-traffic modals to use BaseModal
5. Keep backward-compat for non-migrated modals

## Todo
- [ ] 4.1 Create BaseModal component
- [ ] 4.2 Migrate ConfirmModal to use BaseModal
- [ ] 4.3 Migrate 4 more modals
- [ ] 4.4 Verify no visual regression

## Success Criteria
- BaseModal component under 100 LOC
- Top 5 modals using it
- Consistent overlay/close behavior
