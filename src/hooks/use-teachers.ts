// Hooks for teacher schedule, sessions and salary management

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  TeacherSchedule,
  TeacherScheduleFormData,
  TeachingSession,
  TeachingSessionFormData,
  Salary,
  SalaryFormData,
  MonthlySalarySummary,
  TeacherMonthlySummary,
} from '../types/teacher';
import type { User } from '../types/user';
import * as teacherService from '../services/teacher-firestore';
import * as salaryService from '../services/salary-firestore';

// ============ TEACHER SCHEDULES HOOK ============

export function useTeacherSchedules(branchId: string | null, teacherId?: string) {
  const [schedules, setSchedules] = useState<TeacherSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!branchId && !teacherId) {
      setSchedules([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (teacherId) {
      // Subscribe to specific teacher's schedules
      const unsubscribe = teacherService.subscribeToTeacherSchedules(teacherId, (data) => {
        setSchedules(data);
        setLoading(false);
      });
      return () => unsubscribe();
    } else if (branchId) {
      // Get all schedules for branch
      teacherService.getSchedulesByBranch(branchId).then((data) => {
        setSchedules(data);
        setLoading(false);
      });
    }
  }, [branchId, teacherId]);

  const createSchedule = useCallback(async (
    data: TeacherScheduleFormData
  ): Promise<TeacherSchedule | null> => {
    if (!branchId) return null;
    try {
      return await teacherService.createTeacherSchedule(branchId, data);
    } catch (err) {
      console.error('Error creating schedule:', err);
      return null;
    }
  }, [branchId]);

  const updateSchedule = useCallback(async (
    id: string,
    data: Partial<TeacherSchedule>
  ): Promise<boolean> => {
    try {
      await teacherService.updateTeacherSchedule(id, data);
      return true;
    } catch (err) {
      console.error('Error updating schedule:', err);
      return false;
    }
  }, []);

  const deleteSchedule = useCallback(async (id: string): Promise<boolean> => {
    try {
      await teacherService.deleteTeacherSchedule(id);
      return true;
    } catch (err) {
      console.error('Error deleting schedule:', err);
      return false;
    }
  }, []);

  // Group schedules by day of week
  const schedulesByDay = useMemo(() => {
    const grouped = new Map<number, TeacherSchedule[]>();
    for (let i = 0; i < 7; i++) {
      grouped.set(i, schedules.filter(s => s.dayOfWeek === i));
    }
    return grouped;
  }, [schedules]);

  // Group schedules by teacher
  const schedulesByTeacher = useMemo(() => {
    const grouped = new Map<string, TeacherSchedule[]>();
    schedules.forEach(s => {
      const existing = grouped.get(s.teacherId) || [];
      grouped.set(s.teacherId, [...existing, s]);
    });
    return grouped;
  }, [schedules]);

  return {
    schedules,
    schedulesWithDetails: schedules, // Alias for consistency
    schedulesByDay,
    schedulesByTeacher,
    loading,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  };
}

// ============ TEACHING SESSIONS HOOK ============

export function useTeachingSessions(
  branchId: string | null,
  teacherId?: string,
  month?: string
) {
  const [sessions, setSessions] = useState<TeachingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!branchId && !teacherId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (teacherId) {
      // Subscribe to specific teacher's sessions
      const unsubscribe = teacherService.subscribeToTeacherSessions(teacherId, (data) => {
        // Filter by month if specified
        const filtered = month
          ? data.filter(s => s.date.startsWith(month))
          : data;
        setSessions(filtered);
        setLoading(false);
      });
      return () => unsubscribe();
    } else if (branchId) {
      // Subscribe to branch sessions
      const unsubscribe = teacherService.subscribeToBranchSessions(branchId, (data) => {
        const filtered = month
          ? data.filter(s => s.date.startsWith(month))
          : data;
        setSessions(filtered);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [branchId, teacherId, month]);

  const createSession = useCallback(async (
    teacherId: string,
    data: TeachingSessionFormData,
    scheduleId?: string
  ): Promise<TeachingSession | null> => {
    if (!branchId) return null;
    try {
      return await teacherService.createTeachingSession(branchId, teacherId, data, scheduleId);
    } catch (err) {
      console.error('Error creating session:', err);
      return null;
    }
  }, [branchId]);

  const completeSession = useCallback(async (
    sessionId: string,
    actualEndTime?: string
  ): Promise<boolean> => {
    try {
      await teacherService.completeTeachingSession(sessionId, actualEndTime);
      return true;
    } catch (err) {
      console.error('Error completing session:', err);
      return false;
    }
  }, []);

  const cancelSession = useCallback(async (
    sessionId: string,
    note?: string
  ): Promise<boolean> => {
    try {
      await teacherService.cancelTeachingSession(sessionId, note);
      return true;
    } catch (err) {
      console.error('Error cancelling session:', err);
      return false;
    }
  }, []);

  const approveSession = useCallback(async (
    sessionId: string,
    approvedBy: string
  ): Promise<boolean> => {
    try {
      await teacherService.approveTeachingSession(sessionId, approvedBy);
      return true;
    } catch (err) {
      console.error('Error approving session:', err);
      return false;
    }
  }, []);

  // Generate sessions from schedule
  const generateFromSchedule = useCallback(async (
    startDate: Date,
    endDate: Date
  ): Promise<TeachingSession[]> => {
    if (!branchId) return [];
    try {
      return await teacherService.generateSessionsFromSchedule(branchId, startDate, endDate);
    } catch (err) {
      console.error('Error generating sessions:', err);
      return [];
    }
  }, [branchId]);

  // Stats
  const completedSessions = useMemo(() => {
    return sessions.filter(s => s.status === 'completed');
  }, [sessions]);

  const scheduledSessions = useMemo(() => {
    return sessions.filter(s => s.status === 'scheduled');
  }, [sessions]);

  const totalHours = useMemo(() => {
    return completedSessions.reduce((sum, s) => sum + s.duration, 0) / 60;
  }, [completedSessions]);

  // Group by date
  const sessionsByDate = useMemo(() => {
    const grouped = new Map<string, TeachingSession[]>();
    sessions.forEach(s => {
      const existing = grouped.get(s.date) || [];
      grouped.set(s.date, [...existing, s]);
    });
    return grouped;
  }, [sessions]);

  return {
    sessions,
    sessionsWithDetails: sessions, // Alias for consistency
    completedSessions,
    scheduledSessions,
    sessionsByDate,
    totalHours,
    loading,
    createSession,
    completeSession,
    cancelSession,
    approveSession,
    generateFromSchedule,
  };
}

// ============ SALARY HOOK ============

export function useSalaries(branchId: string | null, month: string, users?: User[]) {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [summary, setSummary] = useState<MonthlySalarySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!branchId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSalaries([]);
      setSummary(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const unsubscribe = salaryService.subscribeToSalariesByBranch(branchId, month, (data) => {
      setSalaries(data);
      // Also fetch summary
      salaryService.getBranchMonthlySummary(branchId, month).then(setSummary);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [branchId, month]);

  // Salaries with user details
  const salariesWithUsers = useMemo(() => {
    if (!users) return salaries.map(s => ({ ...s, teacher: undefined }));
    return salaries.map(salary => ({
      ...salary,
      teacher: users.find(u => u.id === salary.teacherId),
    }));
  }, [salaries, users]);

  const createSalary = useCallback(async (
    data: SalaryFormData,
    createdBy: string
  ): Promise<Salary | null> => {
    if (!branchId) return null;
    try {
      setError(null);
      return await salaryService.createSalary(branchId, data, createdBy);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi tạo lương';
      setError(message);
      console.error('Error creating salary:', err);
      return null;
    }
  }, [branchId]);

  const updateSalary = useCallback(async (
    salaryId: string,
    data: Partial<Salary>
  ): Promise<boolean> => {
    try {
      setError(null);
      await salaryService.updateSalary(salaryId, data);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi cập nhật lương';
      setError(message);
      console.error('Error updating salary:', err);
      return false;
    }
  }, []);

  const approveSalary = useCallback(async (
    salaryId: string,
    approvedBy: string
  ): Promise<boolean> => {
    try {
      setError(null);
      await salaryService.approveSalary(salaryId, approvedBy);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi duyệt lương';
      setError(message);
      console.error('Error approving salary:', err);
      return false;
    }
  }, []);

  const markAsPaid = useCallback(async (
    salaryId: string,
    paidBy: string
  ): Promise<boolean> => {
    try {
      setError(null);
      await salaryService.markSalaryAsPaid(salaryId, paidBy);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi đánh dấu đã trả';
      setError(message);
      console.error('Error marking salary as paid:', err);
      return false;
    }
  }, []);

  const recalculateSalary = useCallback(async (salaryId: string): Promise<Salary | null> => {
    try {
      setError(null);
      return await salaryService.recalculateSalary(salaryId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi tính lại lương';
      setError(message);
      console.error('Error recalculating salary:', err);
      return null;
    }
  }, []);

  // Generate salaries for all teachers in branch
  const generateAllSalaries = useCallback(async (
    createdBy: string
  ): Promise<Salary[]> => {
    if (!branchId) return [];
    try {
      setError(null);
      return await salaryService.generateBranchSalaries(branchId, month, createdBy);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi tạo lương hàng loạt';
      setError(message);
      console.error('Error generating salaries:', err);
      return [];
    }
  }, [branchId, month]);

  // Stats
  const paidSalaries = useMemo(() => {
    return salaries.filter(s => s.status === 'paid');
  }, [salaries]);

  const pendingSalaries = useMemo(() => {
    return salaries.filter(s => s.status !== 'paid');
  }, [salaries]);

  const totalPaid = useMemo(() => {
    return paidSalaries.reduce((sum, s) => sum + s.totalAmount, 0);
  }, [paidSalaries]);

  const totalPending = useMemo(() => {
    return pendingSalaries.reduce((sum, s) => sum + s.totalAmount, 0);
  }, [pendingSalaries]);

  return {
    salaries,
    salariesWithUsers,
    summary,
    paidSalaries,
    pendingSalaries,
    totalPaid,
    totalPending,
    loading,
    error,
    createSalary,
    updateSalary,
    approveSalary,
    markAsPaid,
    recalculateSalary,
    generateAllSalaries,
  };
}

// ============ TEACHER SALARY HOOK (for individual teacher) ============

export function useTeacherSalary(teacherId: string | null) {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSalaries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = salaryService.subscribeToTeacherSalaries(teacherId, (data) => {
      setSalaries(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [teacherId]);

  // Get salary by month
  const getSalaryByMonth = useCallback((month: string): Salary | undefined => {
    return salaries.find(s => s.month === month);
  }, [salaries]);

  // Stats
  const totalEarned = useMemo(() => {
    return salaries
      .filter(s => s.status === 'paid')
      .reduce((sum, s) => sum + s.totalAmount, 0);
  }, [salaries]);

  const totalPending = useMemo(() => {
    return salaries
      .filter(s => s.status !== 'paid')
      .reduce((sum, s) => sum + s.totalAmount, 0);
  }, [salaries]);

  return {
    salaries,
    loading,
    getSalaryByMonth,
    totalEarned,
    totalPending,
  };
}

// ============ TEACHER MONTHLY SUMMARY HOOK ============

export function useTeacherMonthlySummaries(
  branchId: string | null,
  month: string,
  teachers: { userId: string; userName: string }[]
) {
  const [summaries, setSummaries] = useState<TeacherMonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!branchId || teachers.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSummaries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all(
      teachers.map(t =>
        salaryService.getTeacherMonthlySummary(t.userId, t.userName, month)
      )
    ).then((data) => {
      setSummaries(data);
      setLoading(false);
    }).catch((err) => {
      console.error('Error fetching teacher summaries:', err);
      setLoading(false);
    });
  }, [branchId, month, teachers]);

  return {
    summaries,
    loading,
  };
}
