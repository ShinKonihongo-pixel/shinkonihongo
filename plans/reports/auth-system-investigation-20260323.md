# Authentication System Investigation Report
Date: 2026-03-23

## Executive Summary

The application currently uses a **custom Firestore-based authentication system** with plaintext password storage. Firebase Auth is initialized but only used for anonymous authentication. A migration to Firebase Auth is recommended for security.

---

## 1. Current System Architecture

### User Interface (src/types/user.ts)
- **User** interface: Contains `password: string` field (line 72) with comment "In real app, this would be hashed"
- **CurrentUser** interface: Does NOT contain password (by design - only exposed for auth checks)
- Password is stored as plaintext in Firestore `users` collection

### Authentication Flow

#### Login (src/hooks/use-auth.ts, lines 77-94)
```
user input (username + password)
  ↓
login() function finds user by: users.find(u => u.username === username && u.password === password)
  ↓
If match: create CurrentUser state (without password), store in localStorage
If no match: return error "Tên đăng nhập hoặc mật khẩu không đúng"
```

#### Registration (src/hooks/use-auth.ts, lines 102-134)
```
Validation:
  - Username must be ≥3 chars
  - Password must be ≥4 chars
  - Username must not exist
  ↓
Create new User with plaintext password in Firestore
```

#### Password Change (src/hooks/use-auth.ts, lines 182-193)
```
Validation: newPassword must be ≥4 chars
  ↓
Call: firestoreService.updateUser(userId, { password: newPassword })
  ↓
Password updated directly in Firestore (plaintext)
```

---

## 2. Firebase Setup Status

### Firebase Auth is Initialized (src/lib/firebase.ts)
- ✅ Firebase app initialized
- ✅ Firestore initialized with offline persistence
- ✅ Firebase Auth initialized (line 28: `export const auth = getAuth(app)`)
- ✅ Anonymous auth used for Firestore rule security (lines 30-42)

**However:** Firebase Auth functions are NOT used for user authentication
- No `signInWithEmailAndPassword()` calls found
- No `createUserWithEmailAndPassword()` calls found
- Auth object exists but unused for login/registration

---

## 3. Data Storage

### User Collection (Firestore)
```
Collection: "users"
Fields per document:
  id: auto-generated (Firestore docId)
  username: string (indexed for queries)
  password: string (PLAINTEXT - SECURITY RISK)
  role: UserRole (super_admin, director, admin, user, etc.)
  displayName?: string
  email?: string
  avatar?: string
  profileBackground?: string
  jlptLevel?: UserJLPTLevel (N5-N1)
  vipExpirationDate?: string
  createdBy?: string
  createdAt: string (ISO date)
  branchId?: string
  branchIds?: string[]
```

### Service Layer (src/services/firestore/user-service.ts)
- `subscribeToUsers()`: Real-time subscription to all users
- `getUserByUsername(username)`: Query users by username
- `updateUser(id, data)`: Update any user field (including password)
- `addUser()`, `deleteUser()`: Create/delete users
- No password hashing/validation logic

---

## 4. Files Affected by Current System

### Core Authentication Files
1. **src/hooks/use-auth.ts** - Password comparison, register, changePassword logic
2. **src/services/firestore/user-service.ts** - Direct DB access
3. **src/contexts/user-data-context.tsx** - Exposes auth methods to app
4. **src/components/pages/login-page.tsx** - Login/register UI
5. **src/components/pages/settings/hooks/use-profile-handlers.ts** - Password change UI hook
6. **src/lib/firebase.ts** - Firebase configuration

### Files Using Auth Hook (12 imports)
- src/contexts/user-data-context.tsx
- src/components/study/session/study-header.tsx
- src/components/flashcard/detail-notes-buttons.tsx
- src/components/pages/salary-page.tsx
- src/components/pages/my-teaching/index.tsx
- src/components/pages/lecture-editor/index.tsx
- src/components/pages/classroom-page.tsx
- src/components/pages/study-page.tsx
- src/components/pages/lecture-page.tsx
- src/components/pages/teacher-management-page.tsx
- src/components/pages/branch-management-page.tsx

---

## 5. Security Issues

### 🔴 Critical Issues
1. **Plaintext Passwords**: Passwords stored as-is in Firestore (no hashing)
2. **No password history**: Can't verify old passwords when changing
3. **No password validation**: Min 4 chars is insufficient
4. **No rate limiting**: No protection against brute force attempts
5. **Client-side only**: No server-side auth verification
6. **localStorage exposure**: CurrentUser stored in localStorage (though password not included)

### ⚠️ Medium Issues
1. **No email verification**: Passwords stored by username only
2. **No password reset flow**: User must admin to change password
3. **Default superadmin**: Hardcoded credentials in use-auth.ts (lines 11-16)
4. **No audit logging**: No track of who changed passwords when

---

## 6. Migration to Firebase Auth - Requirements

### Changes Needed

#### A. Firestore User Document Changes
Current: Store password as plaintext
Required: Remove password field entirely

New User document (post-migration):
```
{
  id: string (matches Firebase Auth UID)
  username: string
  role: UserRole
  displayName?: string
  email?: string
  avatar?: string
  profileBackground?: string
  jlptLevel?: UserJLPTLevel
  vipExpirationDate?: string
  createdBy?: string
  createdAt: string
  branchId?: string
  branchIds?: string[]
  // password field REMOVED - managed by Firebase Auth
}
```

#### B. Authentication Methods to Implement
1. **signInWithEmailAndPassword(email, password)** - Replace manual login
2. **createUserWithEmailAndPassword(email, password)** - Replace manual register
3. **updatePassword(newPassword)** - Replace custom changePassword
4. **sendPasswordResetEmail(email)** - NEW: Password reset flow
5. **onAuthStateChanged()** - Already imported but unused

#### C. Code Files to Modify

**Priority 1 - Core Auth**
1. src/hooks/use-auth.ts - Rewrite login(), register(), changePassword()
2. src/services/firestore/user-service.ts - Remove password field from schema
3. src/types/user.ts - Remove `password: string` from User interface

**Priority 2 - UI Components**
4. src/components/pages/login-page.tsx - Update to use email instead of username (or both)
5. src/components/pages/settings/hooks/use-profile-handlers.ts - Update changePassword signature
6. src/contexts/user-data-context.tsx - Update auth method signatures

**Priority 3 - Configuration**
7. src/lib/firebase.ts - Already has Firebase Auth, may need onAuthStateChanged listener

**Priority 4 - Dependent Components** (12 files listed above)
8. All files importing useAuth - May need minor updates to error handling

---

## 7. Migration Risk Assessment

### Risk Level: **MEDIUM-HIGH**

### Why?
1. **Breaking change**: Password field removal requires data migration
2. **Wide integration**: 12+ files use useAuth hook
3. **Existing users**: Need to migrate stored passwords or force password reset
4. **Default admin**: Current superadmin/superadmin in use must be recreated

### Mitigation Strategy
1. **Phase 1**: Deploy Firebase Auth alongside Firestore auth (dual mode)
2. **Phase 2**: Migrate users gradually, offer password reset via email
3. **Phase 3**: Deprecate old system, clean up plaintext passwords
4. **Rollback plan**: Keep Firestore user docs, can revert if Firebase Auth fails

### Data Migration Needed
- Existing users have plaintext passwords - cannot migrate to Firebase Auth
- Solution: Force password reset email for all users on first login
- Or: One-time batch create Firebase Auth users with temp passwords, send reset emails

---

## 8. Implementation Effort Estimate

| Component | Files | Effort | Risk |
|-----------|-------|--------|------|
| Core auth logic | 3 | 4-6 hrs | High |
| UI components | 4 | 2-3 hrs | Medium |
| Settings/password change | 2 | 1-2 hrs | Low |
| Dependent files | 12 | 1-2 hrs | Low |
| Data migration | 1 | 2-4 hrs | High |
| Testing | - | 4-6 hrs | High |
| **Total** | **22** | **14-23 hrs** | **Medium-High** |

---

## 9. Recommendations

### Immediate Actions (Before Migration)
1. ✅ Use Firebase Auth instead of custom auth
2. ✅ Hash passwords during this transition (bcryptjs)
3. ✅ Remove hardcoded default super admin
4. ✅ Implement password reset email flow
5. ✅ Add stronger password validation rules

### Short-term (This Sprint)
1. Implement Firebase Auth methods in use-auth.ts
2. Update login/register/password change flows
3. Test with new Firebase Auth system
4. Gradual user migration with email notifications

### Long-term
1. Archive old Firestore password documents
2. Deprecate plaintext password handling
3. Implement OAuth (Google, GitHub) for easier auth
4. Add 2FA for admin/teacher accounts
5. Implement audit logging for security events

---

## 10. Alternative Approaches

### Option A: Firebase Auth (Recommended)
- Pros: Industry standard, secure, scalable, free tier covers most use cases
- Cons: Requires code changes, data migration, learning curve
- Timeline: 2-3 weeks including testing

### Option B: Hashed Passwords (Quick Fix)
- Pros: Immediate security improvement, minimal changes
- Cons: Still client-side auth, no password reset, no proper auth flow
- Timeline: 2-3 days
- Risk: Not a long-term solution

### Option C: Third-party Auth Service (Supabase, Auth0)
- Pros: Fully managed, additional features, quick setup
- Cons: Additional cost, vendor lock-in, complexity
- Timeline: 1-2 weeks

---

## Files to Reference

1. **Login flow**: /Users/admin/Documents/名称未設定フォルダ/src/components/pages/login-page.tsx (lines 28-47)
2. **Auth hook**: /Users/admin/Documents/名称未設定フォルダ/src/hooks/use-auth.ts (lines 77-94, 102-134, 182-193)
3. **User type**: /Users/admin/Documents/名称未設定フォルダ/src/types/user.ts (lines 69-85)
4. **Firestore setup**: /Users/admin/Documents/名称未設定フォルダ/src/lib/firebase.ts (lines 1-42)
5. **User service**: /Users/admin/Documents/名称未設定フォルダ/src/services/firestore/user-service.ts (lines 36-51)
6. **Password change UI**: /Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/hooks/use-profile-handlers.ts (lines 36-53)

---

## Unresolved Questions

1. Should email be required for Firebase Auth migration, or keep username-based?
2. How to handle existing users' passwords during migration (reset vs. one-time crypto)?
3. Should OAuth (Google, GitHub) be added alongside Firebase Auth?
4. What password complexity requirements should be enforced post-migration?
5. Timeline constraint for migration - can app go in "password reset mode" during transition?
