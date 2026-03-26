// Hooks for branch CRUD, member management, and stats

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Branch, BranchFormData, BranchMember, BranchMemberFormData, BranchMemberRole, BranchStats } from '../../types/branch';
import type { User } from '../../types/user';
import * as branchService from '../../services/branch-firestore';
import { handleError } from '../../utils/error-handler';

export function useBranches(userId: string | null, isDirector: boolean) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setBranches([]); setLoading(false); return; }
    setLoading(true);
    if (isDirector) {
      const unsubscribe = branchService.subscribeToBranches(userId, (data) => { setBranches(data); setLoading(false); });
      return () => unsubscribe();
    } else {
      branchService.getUserBranches(userId).then((data) => { setBranches(data); setLoading(false); });
    }
  }, [userId, isDirector]);

  const createBranch = useCallback(async (data: BranchFormData): Promise<Branch | null> => {
    if (!userId) return null;
    try { return await branchService.createBranch(data, userId); }
    catch (err) { handleError(err, { context: 'useBranches/create' }); return null; }
  }, [userId]);

  const updateBranch = useCallback(async (id: string, data: Partial<Branch>): Promise<boolean> => {
    try { await branchService.updateBranch(id, data); return true; }
    catch (err) { handleError(err, { context: 'useBranches/update' }); return false; }
  }, []);

  const deleteBranch = useCallback(async (id: string): Promise<boolean> => {
    try { await branchService.deleteBranch(id); return true; }
    catch (err) { handleError(err, { context: 'useBranches/delete' }); return false; }
  }, []);

  const activeBranches = useMemo(() => branches.filter(b => b.status === 'active'), [branches]);

  return { branches, activeBranches, loading, createBranch, updateBranch, deleteBranch };
}

export function useBranchMembers(branchId: string | null, users: User[]) {
  const [members, setMembers] = useState<BranchMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!branchId) { setMembers([]); setLoading(false); return; }
    setLoading(true); setError(null);
    const unsubscribe = branchService.subscribeToBranchMembers(branchId, (data) => { setMembers(data); setLoading(false); });
    return () => unsubscribe();
  }, [branchId]);

  const membersWithUsers = useMemo(() => {
    return members.map(member => ({ ...member, user: users.find(u => u.id === member.userId) }));
  }, [members, users]);

  const addMember = useCallback(async (userId: string, role: BranchMemberRole, salary?: { type: 'monthly' | 'hourly'; amount: number }): Promise<BranchMember | null> => {
    if (!branchId) return null;
    try { setError(null); const data: BranchMemberFormData = { userId, role, salary }; return await branchService.addBranchMember(branchId, data, userId); }
    catch (err) { const m = handleError(err, { context: 'useBranchMembers/add' }); setError(m); return null; }
  }, [branchId]);

  const updateMember = useCallback(async (memberId: string, updates: { role?: BranchMemberRole; salary?: { type: 'monthly' | 'hourly'; amount: number }; status?: 'active' | 'inactive' }): Promise<boolean> => {
    try { setError(null); await branchService.updateBranchMember(memberId, updates); return true; }
    catch (err) { const m = handleError(err, { context: 'useBranchMembers/update' }); setError(m); return false; }
  }, []);

  const removeMember = useCallback(async (memberId: string): Promise<boolean> => {
    try { setError(null); await branchService.removeBranchMember(memberId); return true; }
    catch (err) { const m = handleError(err, { context: 'useBranchMembers/remove' }); setError(m); return false; }
  }, []);

  const isMember = useCallback((userId: string): boolean => members.some(m => m.userId === userId), [members]);
  const getMembersByRole = useCallback((role: BranchMemberRole) => membersWithUsers.filter(m => m.role === role), [membersWithUsers]);
  const admins = useMemo(() => membersWithUsers.filter(m => m.role === 'branch_admin'), [membersWithUsers]);
  const mainTeachers = useMemo(() => membersWithUsers.filter(m => m.role === 'main_teacher'), [membersWithUsers]);
  const partTimeTeachers = useMemo(() => membersWithUsers.filter(m => m.role === 'part_time_teacher'), [membersWithUsers]);
  const assistants = useMemo(() => membersWithUsers.filter(m => m.role === 'assistant'), [membersWithUsers]);
  const teachers = useMemo(() => membersWithUsers.filter(m => ['main_teacher', 'part_time_teacher', 'assistant'].includes(m.role)), [membersWithUsers]);
  const activeMembers = useMemo(() => membersWithUsers.filter(m => m.status === 'active'), [membersWithUsers]);

  return { members, membersWithUsers, admins, mainTeachers, partTimeTeachers, assistants, teachers, activeMembers, loading, error, addMember, updateMember, removeMember, isMember, getMembersByRole };
}

export function useBranchStats(branchId: string | null) {
  const [stats, setStats] = useState<BranchStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!branchId) { setStats(null); setLoading(false); return; }
    setLoading(true);
    branchService.getBranchStats(branchId).then(setStats).catch(err => handleError(err, { context: 'useBranchStats' })).finally(() => setLoading(false));
  }, [branchId]);

  const refreshStats = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try { setStats(await branchService.getBranchStats(branchId)); } catch (err) { handleError(err, { context: 'useBranchStats/refresh' }); }
    setLoading(false);
  }, [branchId]);

  return { stats, loading, refreshStats };
}
