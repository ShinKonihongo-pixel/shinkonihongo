// Hooks for branch management

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  Branch,
  BranchFormData,
  BranchMember,
  BranchMemberFormData,
  BranchMemberRole,
  BranchStats,
} from '../types/branch';
import type { User } from '../types/user';
import * as branchService from '../services/branch-firestore';

// ============ MAIN BRANCHES HOOK ============

export function useBranches(userId: string | null, isDirector: boolean) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBranches([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (isDirector) {
      // Director sees branches they own
      const unsubscribe = branchService.subscribeToBranches(userId, (data) => {
        setBranches(data);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Other users see branches they have access to
      branchService.getUserBranches(userId).then((data) => {
        setBranches(data);
        setLoading(false);
      });
    }
  }, [userId, isDirector]);

  const createBranch = useCallback(async (data: BranchFormData): Promise<Branch | null> => {
    if (!userId) return null;
    try {
      return await branchService.createBranch(data, userId);
    } catch (err) {
      console.error('Error creating branch:', err);
      return null;
    }
  }, [userId]);

  const updateBranch = useCallback(async (id: string, data: Partial<Branch>): Promise<boolean> => {
    try {
      await branchService.updateBranch(id, data);
      return true;
    } catch (err) {
      console.error('Error updating branch:', err);
      return false;
    }
  }, []);

  const deleteBranch = useCallback(async (id: string): Promise<boolean> => {
    try {
      await branchService.deleteBranch(id);
      return true;
    } catch (err) {
      console.error('Error deleting branch:', err);
      return false;
    }
  }, []);

  // Get active branches
  const activeBranches = useMemo(() => {
    return branches.filter(b => b.status === 'active');
  }, [branches]);

  return {
    branches,
    activeBranches,
    loading,
    createBranch,
    updateBranch,
    deleteBranch,
  };
}

// ============ BRANCH MEMBERS HOOK ============

export function useBranchMembers(branchId: string | null, users: User[]) {
  const [members, setMembers] = useState<BranchMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!branchId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const unsubscribe = branchService.subscribeToBranchMembers(branchId, (data) => {
      setMembers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [branchId]);

  // Get members with user details
  const membersWithUsers = useMemo(() => {
    return members.map(member => ({
      ...member,
      user: users.find(u => u.id === member.userId),
    }));
  }, [members, users]);

  // Simplified addMember - accepts role and salary directly
  const addMember = useCallback(async (
    userId: string,
    role: BranchMemberRole,
    salary?: { type: 'monthly' | 'hourly'; amount: number }
  ): Promise<BranchMember | null> => {
    if (!branchId) return null;
    try {
      setError(null);
      const data: BranchMemberFormData = { userId, role, salary };
      return await branchService.addBranchMember(branchId, data, userId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi thêm thành viên';
      setError(message);
      console.error('Error adding member:', err);
      return null;
    }
  }, [branchId]);

  const updateMember = useCallback(async (
    memberId: string,
    updates: { role?: BranchMemberRole; salary?: { type: 'monthly' | 'hourly'; amount: number }; status?: 'active' | 'inactive' }
  ): Promise<boolean> => {
    try {
      setError(null);
      await branchService.updateBranchMember(memberId, updates);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi cập nhật thành viên';
      setError(message);
      console.error('Error updating member:', err);
      return false;
    }
  }, []);

  const removeMember = useCallback(async (memberId: string): Promise<boolean> => {
    try {
      setError(null);
      await branchService.removeBranchMember(memberId);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi xóa thành viên';
      setError(message);
      console.error('Error removing member:', err);
      return false;
    }
  }, []);

  // Check if user is already a member
  const isMember = useCallback((userId: string): boolean => {
    return members.some(m => m.userId === userId);
  }, [members]);

  // Get members by role
  const getMembersByRole = useCallback((role: BranchMemberRole) => {
    return membersWithUsers.filter(m => m.role === role);
  }, [membersWithUsers]);

  // Filtered by role
  const admins = useMemo(() => {
    return membersWithUsers.filter(m => m.role === 'branch_admin');
  }, [membersWithUsers]);

  const mainTeachers = useMemo(() => {
    return membersWithUsers.filter(m => m.role === 'main_teacher');
  }, [membersWithUsers]);

  const partTimeTeachers = useMemo(() => {
    return membersWithUsers.filter(m => m.role === 'part_time_teacher');
  }, [membersWithUsers]);

  const assistants = useMemo(() => {
    return membersWithUsers.filter(m => m.role === 'assistant');
  }, [membersWithUsers]);

  const teachers = useMemo(() => {
    return membersWithUsers.filter(m =>
      ['main_teacher', 'part_time_teacher', 'assistant'].includes(m.role)
    );
  }, [membersWithUsers]);

  const activeMembers = useMemo(() => {
    return membersWithUsers.filter(m => m.status === 'active');
  }, [membersWithUsers]);

  return {
    members,
    membersWithUsers,
    admins,
    mainTeachers,
    partTimeTeachers,
    assistants,
    teachers,
    activeMembers,
    loading,
    error,
    addMember,
    updateMember,
    removeMember,
    isMember,
    getMembersByRole,
  };
}

// ============ BRANCH STATS HOOK ============

export function useBranchStats(branchId: string | null) {
  const [stats, setStats] = useState<BranchStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!branchId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    branchService.getBranchStats(branchId).then((data) => {
      setStats(data);
      setLoading(false);
    }).catch((err) => {
      console.error('Error fetching branch stats:', err);
      setLoading(false);
    });
  }, [branchId]);

  const refreshStats = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const data = await branchService.getBranchStats(branchId);
      setStats(data);
    } catch (err) {
      console.error('Error refreshing branch stats:', err);
    }
    setLoading(false);
  }, [branchId]);

  return {
    stats,
    loading,
    refreshStats,
  };
}

// ============ CURRENT BRANCH HOOK ============
// Simple hook to manage current branch selection (localStorage-based)

export function useCurrentBranch() {
  const [currentBranch, setCurrentBranchState] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const savedBranchId = localStorage.getItem('currentBranchId');
    const savedBranchData = localStorage.getItem('currentBranchData');

    if (savedBranchId && savedBranchData) {
      try {
        const branch = JSON.parse(savedBranchData) as Branch;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentBranchState(branch);
      } catch {
        localStorage.removeItem('currentBranchId');
        localStorage.removeItem('currentBranchData');
      }
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

  return {
    currentBranch,
    setCurrentBranch,
    clearBranch,
    loading,
  };
}

// ============ BRANCH WITH ROLE HOOK ============
// Extended hook with role checking for permission-based features

export function useBranchWithRole(userId: string | null) {
  const { currentBranch, setCurrentBranch, clearBranch, loading: branchLoading } = useCurrentBranch();
  const [userRole, setUserRole] = useState<BranchMemberRole | 'director' | null>(null);
  const [loading, setLoading] = useState(true);

  // Load role when branch changes
  useEffect(() => {
    if (!userId || !currentBranch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserRole(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    branchService.getUserBranchRole(userId, currentBranch.id)
      .then(role => {
        setUserRole(role);
        setLoading(false);
      })
      .catch(() => {
        setUserRole(null);
        setLoading(false);
      });
  }, [userId, currentBranch]);

  // Permission checks
  const canManageBranch = useMemo(() => {
    return userRole === 'director' || userRole === 'branch_admin';
  }, [userRole]);

  const canManageTeachers = useMemo(() => {
    return userRole === 'director' || userRole === 'branch_admin';
  }, [userRole]);

  const canViewSalary = useMemo(() => {
    return userRole === 'director' || userRole === 'branch_admin';
  }, [userRole]);

  const isTeacher = useMemo(() => {
    return userRole === 'main_teacher' ||
           userRole === 'part_time_teacher' ||
           userRole === 'assistant';
  }, [userRole]);

  return {
    currentBranch,
    setCurrentBranch,
    clearBranch,
    userRole,
    loading: branchLoading || loading,
    canManageBranch,
    canManageTeachers,
    canViewSalary,
    isTeacher,
  };
}

// ============ BRANCH ACCESS CHECK HOOK ============

export function useBranchAccess(userId: string | null, branchId: string | null) {
  const [hasAccess, setHasAccess] = useState(false);
  const [role, setRole] = useState<BranchMemberRole | 'director' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !branchId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasAccess(false);
      setRole(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      branchService.userHasBranchAccess(userId, branchId),
      branchService.getUserBranchRole(userId, branchId),
    ]).then(([access, userRole]) => {
      setHasAccess(access);
      setRole(userRole);
      setLoading(false);
    }).catch((err) => {
      console.error('Error checking branch access:', err);
      setHasAccess(false);
      setRole(null);
      setLoading(false);
    });
  }, [userId, branchId]);

  return {
    hasAccess,
    role,
    loading,
  };
}
