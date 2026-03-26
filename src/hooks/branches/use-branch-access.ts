// Hooks for branch role/access checking and current branch selection

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Branch, BranchMemberRole } from '../../types/branch';
import * as branchService from '../../services/branch-firestore';
import { handleError } from '../../utils/error-handler';

// Current branch selection (localStorage-based)
export function useCurrentBranch() {
  const [currentBranch, setCurrentBranchState] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedBranchData = localStorage.getItem('currentBranchData');
    if (savedBranchData) {
      try { setCurrentBranchState(JSON.parse(savedBranchData) as Branch); }
      catch { localStorage.removeItem('currentBranchId'); localStorage.removeItem('currentBranchData'); }
    }
    setLoading(false);
  }, []);

  const setCurrentBranch = useCallback((branch: Branch | null) => {
    setCurrentBranchState(branch);
    if (branch) {
      localStorage.setItem('currentBranchId', branch.id);
      localStorage.setItem('currentBranchData', JSON.stringify(branch));
    } else {
      localStorage.removeItem('currentBranchId');
      localStorage.removeItem('currentBranchData');
    }
  }, []);

  const clearBranch = useCallback(() => {
    setCurrentBranchState(null);
    localStorage.removeItem('currentBranchId');
    localStorage.removeItem('currentBranchData');
  }, []);

  return { currentBranch, setCurrentBranch, clearBranch, loading };
}

// Extended hook with role checking for permission-based features
export function useBranchWithRole(userId: string | null) {
  const { currentBranch, setCurrentBranch, clearBranch, loading: branchLoading } = useCurrentBranch();
  const [userRole, setUserRole] = useState<BranchMemberRole | 'director' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !currentBranch) { setUserRole(null); setLoading(false); return; }
    setLoading(true);
    branchService.getUserBranchRole(userId, currentBranch.id)
      .then(role => { setUserRole(role); setLoading(false); })
      .catch(() => { setUserRole(null); setLoading(false); });
  }, [userId, currentBranch]);

  const canManageBranch = useMemo(() => userRole === 'director' || userRole === 'branch_admin', [userRole]);
  const canManageTeachers = useMemo(() => userRole === 'director' || userRole === 'branch_admin', [userRole]);
  const canViewSalary = useMemo(() => userRole === 'director' || userRole === 'branch_admin', [userRole]);
  const isTeacher = useMemo(() => userRole === 'main_teacher' || userRole === 'part_time_teacher' || userRole === 'assistant', [userRole]);

  return { currentBranch, setCurrentBranch, clearBranch, userRole, loading: branchLoading || loading, canManageBranch, canManageTeachers, canViewSalary, isTeacher };
}

// Simple access check for a specific branch
export function useBranchAccess(userId: string | null, branchId: string | null) {
  const [hasAccess, setHasAccess] = useState(false);
  const [role, setRole] = useState<BranchMemberRole | 'director' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !branchId) { setHasAccess(false); setRole(null); setLoading(false); return; }
    setLoading(true);
    Promise.all([
      branchService.userHasBranchAccess(userId, branchId),
      branchService.getUserBranchRole(userId, branchId),
    ]).then(([access, userRole]) => { setHasAccess(access); setRole(userRole); setLoading(false); })
      .catch((err) => { handleError(err, { context: 'useBranchAccess' }); setHasAccess(false); setRole(null); setLoading(false); });
  }, [userId, branchId]);

  return { hasAccess, role, loading };
}
