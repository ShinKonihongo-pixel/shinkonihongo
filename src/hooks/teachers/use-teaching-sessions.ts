// Hook for teaching session management (CRUD + stats + generation)

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { TeachingSession, TeachingSessionFormData } from '../../types/teacher';
import * as teacherService from '../../services/teacher-firestore';
import { handleError } from '../../utils/error-handler';

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
      const unsubscribe = teacherService.subscribeToTeacherSessions(teacherId, (data) => {
        const filtered = month ? data.filter(s => s.date.startsWith(month)) : data;
        setSessions(filtered);
        setLoading(false);
      });
      return () => unsubscribe();
    } else if (branchId) {
      const unsubscribe = teacherService.subscribeToBranchSessions(branchId, (data) => {
        const filtered = month ? data.filter(s => s.date.startsWith(month)) : data;
        setSessions(filtered);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [branchId, teacherId, month]);

  const createSession = useCallback(async (
    teacherId: string, data: TeachingSessionFormData, scheduleId?: string
  ): Promise<TeachingSession | null> => {
    if (!branchId) return null;
    try {
      return await teacherService.createTeachingSession(branchId, teacherId, data, scheduleId);
    } catch (err) {
      handleError(err, { context: 'useTeachingSessions/create' });
      return null;
    }
  }, [branchId]);

  const completeSession = useCallback(async (sessionId: string, actualEndTime?: string): Promise<boolean> => {
    try {
      await teacherService.completeTeachingSession(sessionId, actualEndTime);
      return true;
    } catch (err) {
      handleError(err, { context: 'useTeachingSessions/complete' });
      return false;
    }
  }, []);

  const cancelSession = useCallback(async (sessionId: string, note?: string): Promise<boolean> => {
    try {
      await teacherService.cancelTeachingSession(sessionId, note);
      return true;
    } catch (err) {
      handleError(err, { context: 'useTeachingSessions/cancel' });
      return false;
    }
  }, []);

  const approveSession = useCallback(async (sessionId: string, approvedBy: string): Promise<boolean> => {
    try {
      await teacherService.approveTeachingSession(sessionId, approvedBy);
      return true;
    } catch (err) {
      handleError(err, { context: 'useTeachingSessions/approve' });
      return false;
    }
  }, []);

  const generateFromSchedule = useCallback(async (startDate: Date, endDate: Date): Promise<TeachingSession[]> => {
    if (!branchId) return [];
    try {
      return await teacherService.generateSessionsFromSchedule(branchId, startDate, endDate);
    } catch (err) {
      handleError(err, { context: 'useTeachingSessions/generate' });
      return [];
    }
  }, [branchId]);

  const completedSessions = useMemo(() => sessions.filter(s => s.status === 'completed'), [sessions]);
  const scheduledSessions = useMemo(() => sessions.filter(s => s.status === 'scheduled'), [sessions]);
  const totalHours = useMemo(() => completedSessions.reduce((sum, s) => sum + s.duration, 0) / 60, [completedSessions]);

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
    sessionsWithDetails: sessions,
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
