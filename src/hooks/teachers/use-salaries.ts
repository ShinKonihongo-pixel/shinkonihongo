// Hooks for salary management — branch salaries + individual teacher salary + monthly summaries

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Salary, SalaryFormData, MonthlySalarySummary, TeacherMonthlySummary } from '../../types/teacher';
import type { User } from '../../types/user';
import * as salaryService from '../../services/salary-firestore';
import { handleError } from '../../utils/error-handler';

export function useSalaries(branchId: string | null, month: string, users?: User[]) {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [summary, setSummary] = useState<MonthlySalarySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!branchId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSalaries([]); setSummary(null); setLoading(false);
      return;
    }
    setLoading(true); setError(null);
    const unsubscribe = salaryService.subscribeToSalariesByBranch(branchId, month, (data) => {
      setSalaries(data);
      salaryService.getBranchMonthlySummary(branchId, month).then(setSummary);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [branchId, month]);

  const salariesWithUsers = useMemo(() => {
    if (!users) return salaries.map(s => ({ ...s, teacher: undefined }));
    return salaries.map(salary => ({ ...salary, teacher: users.find(u => u.id === salary.teacherId) }));
  }, [salaries, users]);

  const createSalary = useCallback(async (data: SalaryFormData, createdBy: string): Promise<Salary | null> => {
    if (!branchId) return null;
    try { setError(null); return await salaryService.createSalary(branchId, data, createdBy); }
    catch (err) { const m = handleError(err, { context: 'useSalaries/create' }); setError(m); return null; }
  }, [branchId]);

  const updateSalary = useCallback(async (salaryId: string, data: Partial<Salary>): Promise<boolean> => {
    try { setError(null); await salaryService.updateSalary(salaryId, data); return true; }
    catch (err) { const m = handleError(err, { context: 'useSalaries/update' }); setError(m); return false; }
  }, []);

  const approveSalary = useCallback(async (salaryId: string, approvedBy: string): Promise<boolean> => {
    try { setError(null); await salaryService.approveSalary(salaryId, approvedBy); return true; }
    catch (err) { const m = handleError(err, { context: 'useSalaries/approve' }); setError(m); return false; }
  }, []);

  const markAsPaid = useCallback(async (salaryId: string, paidBy: string): Promise<boolean> => {
    try { setError(null); await salaryService.markSalaryAsPaid(salaryId, paidBy); return true; }
    catch (err) { const m = handleError(err, { context: 'useSalaries/markPaid' }); setError(m); return false; }
  }, []);

  const recalculateSalary = useCallback(async (salaryId: string): Promise<Salary | null> => {
    try { setError(null); return await salaryService.recalculateSalary(salaryId); }
    catch (err) { const m = handleError(err, { context: 'useSalaries/recalculate' }); setError(m); return null; }
  }, []);

  const generateAllSalaries = useCallback(async (createdBy: string): Promise<Salary[]> => {
    if (!branchId) return [];
    try { setError(null); return await salaryService.generateBranchSalaries(branchId, month, createdBy); }
    catch (err) { const m = handleError(err, { context: 'useSalaries/generateAll' }); setError(m); return []; }
  }, [branchId, month]);

  const paidSalaries = useMemo(() => salaries.filter(s => s.status === 'paid'), [salaries]);
  const pendingSalaries = useMemo(() => salaries.filter(s => s.status !== 'paid'), [salaries]);
  const totalPaid = useMemo(() => paidSalaries.reduce((sum, s) => sum + s.totalAmount, 0), [paidSalaries]);
  const totalPending = useMemo(() => pendingSalaries.reduce((sum, s) => sum + s.totalAmount, 0), [pendingSalaries]);

  return {
    salaries, salariesWithUsers, summary, paidSalaries, pendingSalaries, totalPaid, totalPending,
    loading, error, createSalary, updateSalary, approveSalary, markAsPaid, recalculateSalary, generateAllSalaries,
  };
}

export function useTeacherSalary(teacherId: string | null) {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) { setSalaries([]); setLoading(false); return; }
    setLoading(true);
    const unsubscribe = salaryService.subscribeToTeacherSalaries(teacherId, (data) => { setSalaries(data); setLoading(false); });
    return () => unsubscribe();
  }, [teacherId]);

  const getSalaryByMonth = useCallback((month: string): Salary | undefined => salaries.find(s => s.month === month), [salaries]);
  const totalEarned = useMemo(() => salaries.filter(s => s.status === 'paid').reduce((sum, s) => sum + s.totalAmount, 0), [salaries]);
  const totalPending = useMemo(() => salaries.filter(s => s.status !== 'paid').reduce((sum, s) => sum + s.totalAmount, 0), [salaries]);

  return { salaries, loading, getSalaryByMonth, totalEarned, totalPending };
}

export function useTeacherMonthlySummaries(
  branchId: string | null, month: string, teachers: { userId: string; userName: string }[]
) {
  const [summaries, setSummaries] = useState<TeacherMonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!branchId || teachers.length === 0) { setSummaries([]); setLoading(false); return; }
    setLoading(true);
    Promise.all(teachers.map(t => salaryService.getTeacherMonthlySummary(t.userId, t.userName, month)))
      .then(setSummaries)
      .catch(err => handleError(err, { context: 'useTeacherMonthlySummaries' }))
      .finally(() => setLoading(false));
  }, [branchId, month, teachers]);

  return { summaries, loading };
}
