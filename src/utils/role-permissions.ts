// Centralized page access control
// Mirrors the inline permission guards previously scattered across App.tsx
// IMPORTANT: Behavior must match use-auth.ts isAdmin and the inline role checks exactly

import type { UserRole } from '../types/user';
import { isTeacher } from '../types/user';

// Pages with role-restricted access
type ProtectedPage =
  | 'branches'
  | 'teachers'
  | 'salary'
  | 'my-teaching'
  | 'permissions'
  | 'lecture-editor'
  | 'cards';

// isAdmin from use-auth.ts: 'admin' (legacy) or 'super_admin' only
// NOT isAdminLevel — kept narrow to preserve existing behavior for cards/lecture-editor
function isLegacyAdmin(role: UserRole): boolean {
  return role === 'admin' || role === 'super_admin';
}

// director, branch_admin, super_admin — matches the 3 inline OR checks in App.tsx
function isBranchManager(role: UserRole): boolean {
  return role === 'director' || role === 'branch_admin' || role === 'super_admin';
}

// Per-page access rules; each must produce identical results to the removed inline checks
const PAGE_ACCESS: Record<ProtectedPage, (role: UserRole) => boolean> = {
  // {currentPage === 'branches' && currentUser && (role === 'director' || role === 'branch_admin' || role === 'super_admin')}
  branches: isBranchManager,
  // {currentPage === 'teachers' && currentUser && (role === 'director' || role === 'branch_admin' || role === 'super_admin')}
  teachers: isBranchManager,
  // {currentPage === 'salary' && currentUser && (role === 'director' || role === 'branch_admin' || role === 'super_admin')}
  salary: isBranchManager,
  // {currentPage === 'my-teaching' && currentUser && (role === 'main_teacher' || role === 'part_time_teacher' || role === 'assistant')}
  'my-teaching': isTeacher,
  // {currentPage === 'permissions' && currentUser && role === 'super_admin'}
  permissions: (r) => r === 'super_admin',
  // {currentPage === 'lecture-editor' && isAdmin} where isAdmin = role === 'admin' || role === 'super_admin'
  'lecture-editor': isLegacyAdmin,
  // {currentPage === 'cards' && isAdmin && currentUser} where isAdmin = role === 'admin' || role === 'super_admin'
  cards: isLegacyAdmin,
};

/**
 * Check whether a user role may access a given page.
 *
 * Returns true for pages not in ProtectedPage (open to all authenticated users).
 * Returns false when role is undefined.
 */
export function canAccessPage(page: string, role?: UserRole): boolean {
  if (!role) return false;

  const check = PAGE_ACCESS[page as ProtectedPage];
  // Pages not in the protected list are open to any authenticated user
  return check ? check(role) : true;
}
