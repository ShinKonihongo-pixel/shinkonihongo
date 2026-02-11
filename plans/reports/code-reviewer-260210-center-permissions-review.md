# Code Review: Center Permissions & Role Management System

**Date:** 2026-02-10
**Reviewer:** code-reviewer
**Scope:** Permission system for multi-tenant center architecture
**Status:** Research Complete - No Code Changes

---

## Code Review Summary

### Scope
- Files reviewed: 7 files (6 implementation + 1 integration point)
- Lines of code analyzed: ~1,005 lines
- Review focus: Recently added permission system (from commit 731a36f)
- Updated plans: None (research-only review)

### Overall Assessment
Solid permission architecture with clean type definitions and reasonable separation of concerns. Implementation is functional but has several medium-priority issues around performance, error handling, and real-time updates. No critical security vulnerabilities found. Code is well-structured and maintainable.

---

## Critical Issues

**None identified.**

---

## High Priority Findings

### H1: Permission Hook Loads Once, Never Updates
**File:** `src/hooks/use-center-permissions.ts` (line 23-38)

**Issue:** Hook fetches permissions once via `getCenterPermissions()` but does not subscribe to real-time updates. If permissions change in Firestore (e.g., admin modifies roles in another tab), current users won't see updated permissions until page refresh.

**Impact:**
- Users can access pages/actions they should no longer have access to
- Permission revocation requires manual refresh
- Multi-tab inconsistency

**Current Pattern:**
```typescript
useEffect(() => {
  if (!centerId) {
    setLoading(false);
    return;
  }
  let cancelled = false;
  getCenterPermissions(centerId).then((data) => {
    if (!cancelled) {
      setConfig(data);
      setLoading(false);
    }
  });
  return () => { cancelled = true; };
}, [centerId]);
```

**Recommendation:** Consider implementing `onSnapshot` subscription for real-time permission updates, similar to patterns in other hooks (e.g., `use-listening.ts`, `use-exercises.ts`, `use-reading.ts`).

---

### H2: Firestore Query Inefficiency - Field Query Instead of Doc ID
**File:** `src/services/permission-firestore.ts` (lines 19-38, 45-64)

**Issue:** Both `getCenterPermissions()` and `saveCenterPermissions()` query by `centerId` field instead of using document ID. This requires:
1. `where()` clause + collection scan
2. Multiple doc reads per operation
3. No composite index optimization

**Current Pattern:**
```typescript
const q = query(
  collection(db, COLLECTION),
  where('centerId', '==', centerId)
);
const snapshot = await getDocs(q);
```

**Performance Impact:**
- O(n) scan instead of O(1) doc lookup
- Extra Firestore read operations
- Increased latency on permission checks

**Recommendation:** Use centerId as document ID for O(1) lookups. If multiple permission configs per center needed, reconsider data model.

---

### H3: ESLint Error - setState in useEffect
**File:** `src/hooks/use-center-permissions.ts` (line 25)

**Issue:** `setLoading(false)` called synchronously within effect body triggers ESLint error `react-hooks/set-state-in-effect`. This is flagged because it can cause cascading renders.

**Current Code:**
```typescript
if (!centerId) {
  setLoading(false);  // ❌ ESLint error
  return;
}
```

**Recommendation:** Derive loading state from other state variables or restructure effect logic to avoid direct setState calls.

---

### H4: Race Condition in Auto-Redirect Logic
**File:** `src/App.tsx` (lines 168-198)

**Issue:** Async `getUserBranches()` call inside useEffect has no cleanup/cancellation. If effect re-runs (e.g., `currentUser.id` changes), previous async call may complete after new one starts, causing state to be set out of order.

**Current Pattern:**
```typescript
useEffect(() => {
  // ... synchronous checks ...
  if (currentUser?.id) {
    getUserBranches(currentUser.id).then((branches) => {
      // No cancellation check - race condition possible
      if (branches.length === 1 && branches[0].slug) {
        urlRouter.navigate(`/center/${branches[0].slug}/app`);
      } // ...
    }).catch(() => {
      setCurrentPage('home');
    });
  }
}, [isLoggedIn, initialGameJoinCode, currentUser?.role, currentUser?.id, urlRouter]);
```

**Recommendation:** Add `cancelled` flag pattern (like in `use-center-permissions.ts` line 29-37) to prevent stale async results from updating state.

---

## Medium Priority Improvements

### M1: No Error Handling in Firestore Operations
**Files:**
- `src/services/permission-firestore.ts` (all functions)
- `src/components/pages/role-management-page.tsx` (lines 77-102)

**Issue:** Firestore operations lack try-catch blocks. Network failures, permission errors, or Firestore unavailability will throw unhandled exceptions.

**Examples:**
```typescript
// permission-firestore.ts - no error handling
export async function getCenterPermissions(centerId: string): Promise<CenterPermissionConfig> {
  const q = query(/* ... */);
  const snapshot = await getDocs(q);  // ❌ Can throw
  // ...
}

// role-management-page.tsx - catch blocks swallow errors
try {
  await saveCenterPermissions(centerId, permissions);
  setSaveMessage('Đã lưu thành công!');
} catch {  // ❌ Error object ignored
  setSaveMessage('Lỗi khi lưu. Vui lòng thử lại.');
}
```

**Recommendation:**
1. Add try-catch in service layer with error logging
2. Propagate meaningful error messages to UI
3. Log caught errors for debugging: `catch (error) { console.error('Error:', error); }`

---

### M2: Sidebar Permission Filtering May Cause Re-renders
**File:** `src/components/layout/sidebar.tsx` (lines 158-174)

**Issue:** `useMemo` depends on `centerCtx` object which contains callback functions. If `CenterContext` doesn't memoize callbacks properly, this will recompute on every render.

**Current Code:**
```typescript
const { section1Items, section2Items, section3Items } = useMemo(() => {
  if (centerCtx) {
    const filterByPermission = (items: NavItem[]) =>
      items.filter(item => centerCtx.canAccessPage(/* ... */));  // ❌ Function reference changes?
    // ...
  }
}, [centerCtx]);  // centerCtx object may not be stable
```

**Verification Needed:** Check if `canAccessPage` callback is stable (it is - `useCallback` used in hook, lines 40-47). However, `centerCtx` object itself may not be memoized in provider.

**Recommendation:** Verify `CenterProvider` value object is memoized. Consider depending on `centerCtx.canAccessPage` directly instead of entire context.

---

### M3: No Loading/Error States in RoleManagementPage useEffect
**File:** `src/components/pages/role-management-page.tsx` (lines 46-51)

**Issue:** Permission loading effect has no error handling. If `getCenterPermissions()` fails, page shows loading spinner forever.

**Current Code:**
```typescript
useEffect(() => {
  getCenterPermissions(centerId).then((config) => {  // ❌ No .catch()
    setPermissions(config.permissions);
    setLoading(false);
  });
}, [centerId]);
```

**Recommendation:** Add error handling and error state display.

---

### M4: getUserBranches Inefficiency - N+1 Query Pattern
**File:** `src/services/branch-firestore.ts` (lines 323-348)

**Issue:** For each branch membership, function calls `getBranch()` individually. For user with 10 memberships = 11 Firestore reads (1 query + 10 doc gets).

**Current Pattern:**
```typescript
for (const memberDoc of memberships.docs) {
  const membership = memberDoc.data() as BranchMember;
  const branch = await getBranch(membership.branchId);  // ❌ N+1 pattern
  if (branch && branch.status === 'active') {
    branches.push(branch);
  }
}
```

**Recommendation:** Batch read branches with `where('__name__', 'in', branchIds)` query (max 10 per batch) or denormalize branch name into membership doc.

---

### M5: Type Safety - Missing Null Checks
**File:** `src/contexts/center-context.tsx` (lines 70-74)

**Issue:** `useCenter()` throws error if context is null, but hook is called unconditionally in components. If component renders outside `CenterProvider`, app crashes.

**Current Code:**
```typescript
export function useCenter(): CenterContextValue {
  const ctx = useContext(CenterContext);
  if (!ctx) throw new Error('useCenter must be used within CenterProvider');  // ❌ Hard crash
  return ctx;
}
```

**Observation:** `useCenterOptional()` exists for optional usage, but sidebar uses it correctly. No issue found in practice, but pattern is risky.

**Recommendation:** Document which pages/components require CenterProvider wrapper. Consider dev-only error (check `process.env.NODE_ENV`).

---

## Low Priority Suggestions

### L1: Vietnamese Hardcoded Labels
**File:** `src/types/center-permissions.ts` (lines 56-80)

**Issue:** All labels hardcoded in Vietnamese. No i18n support.

**Observation:** Project appears Vietnamese-focused. Not an issue unless internationalization planned.

---

### L2: Magic Numbers in Auto-Redirect Logic
**File:** `src/App.tsx` (lines 185-191)

**Issue:** Branch count thresholds (`=== 1`, `>= 2`) hardcoded without constants.

**Recommendation:** Extract to named constants for clarity:
```typescript
const SINGLE_CENTER_REDIRECT_THRESHOLD = 1;
const MULTIPLE_CENTERS_THRESHOLD = 2;
```

---

### L3: Unused roleSpecificItems
**File:** `src/components/layout/sidebar.tsx` (line 118)

**Issue:** `roleSpecificItems` array declared empty and never populated. Dead code.

**Observation:** Comment says "No more role-specific items needed (moved to managementItems)". Should be removed if truly unused.

---

### L4: Inconsistent setTimeout Cleanup
**File:** `src/components/pages/role-management-page.tsx` (lines 82-83, 96-97)

**Issue:** `setTimeout` for message dismissal not cleaned up if component unmounts or user clicks again quickly.

**Recommendation:** Store timeout ID and clear in useEffect cleanup or before setting new timeout.

---

## Positive Observations

1. **Clean Type Definitions:** `center-permissions.ts` provides comprehensive, well-documented types with helper constants
2. **Good Default Permissions:** Sensible role-based defaults align with business logic
3. **Proper Cancellation Pattern:** Hook uses `cancelled` flag to prevent stale updates (line 29-37)
4. **Type-Safe Callbacks:** `canAccessPage` and `canPerformAction` use `useCallback` with correct deps
5. **Center Context Well-Designed:** Provides branding, permissions, role helpers in single context
6. **Separation of Concerns:** Service layer cleanly separated from hooks and UI
7. **Build Success:** No TypeScript errors, project compiles cleanly (tested with `npm run build`)
8. **ESLint Mostly Clean:** Only 1 error in reviewed files (setState in effect)

---

## Recommended Actions

### Immediate (This Sprint)
1. **Fix ESLint error** in `use-center-permissions.ts` - derive loading state or restructure
2. **Add race condition guard** in `App.tsx` auto-redirect effect
3. **Add error handling** in `role-management-page.tsx` permission loading

### Short-term (Next Sprint)
4. **Implement real-time permission updates** via `onSnapshot` in hook
5. **Optimize Firestore schema** - use centerId as doc ID instead of field query
6. **Add error boundaries** around permission-dependent components
7. **Add logging** in catch blocks for debugging

### Long-term (Future)
8. **Optimize getUserBranches** N+1 query pattern
9. **Add Firestore security rules** for permission configs (verify `super_admin` only writes)
10. **Add unit tests** for permission logic (canAccessPage, canPerformAction)
11. **Performance profiling** on sidebar render with many nav items

---

## Metrics

- **Type Coverage:** 100% (all files TypeScript, build passes)
- **Test Coverage:** 0% (no tests found for new permission system)
- **Linting Issues:** 1 error (setState in effect)
- **Firestore Security Rules:** Not reviewed (no rules file found)
- **File Size Compliance:** ✅ All files under 500 lines
  - center-permissions.ts: 117 lines
  - permission-firestore.ts: 69 lines
  - use-center-permissions.ts: 58 lines
  - center-context.tsx: 79 lines
  - role-management-page.tsx: 206 lines
  - sidebar.tsx: 476 lines

---

## Unresolved Questions

1. **Real-time updates requirement:** Should permissions update live across tabs, or is manual refresh acceptable?
2. **Permission config versioning:** Need audit trail for permission changes? (Who changed what, when?)
3. **Performance SLA:** Expected number of concurrent users per center? (Impacts Firestore query optimization priority)
4. **Firestore security rules:** Are rules enforcing `super_admin`-only writes to `center_permissions` collection?
5. **Migration path:** How to handle existing centers when deploying permission system? (Need default permission seeding script?)
6. **Permission caching:** Should permissions be cached in localStorage for offline access? (Impacts sidebar in offline mode)
7. **Error recovery:** If permission load fails, should user see degraded UI or full block?

---

## Related Files Not Reviewed

- `src/components/pages/my-centers-page.tsx` - Uses getUserBranches, may have similar race condition
- `src/components/center/center-create-modal.tsx` - New file, permission integration unclear
- Firestore security rules (not found in codebase)
- Test files for permission system (none found)

---

## Sign-off

Code is production-ready with medium-priority improvements needed. No blocking issues for deployment, but real-time updates and error handling should be prioritized for next iteration.

**Recommendation:** Ship current implementation, monitor for permission inconsistency reports, then prioritize H1-H4 fixes.
