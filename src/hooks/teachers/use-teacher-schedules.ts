// Hook for teacher schedule management (CRUD + grouping)

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { TeacherSchedule, TeacherScheduleFormData } from '../../types/teacher';
import * as teacherService from '../../services/teacher-firestore';
import { handleError } from '../../utils/error-handler';

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
      const unsubscribe = teacherService.subscribeToTeacherSchedules(teacherId, (data) => {
        setSchedules(data);
        setLoading(false);
      });
      return () => unsubscribe();
    } else if (branchId) {
      teacherService.getSchedulesByBranch(branchId).then((data) => {
        setSchedules(data);
        setLoading(false);
      });
    }
  }, [branchId, teacherId]);

  const createSchedule = useCallback(async (data: TeacherScheduleFormData): Promise<TeacherSchedule | null> => {
    if (!branchId) return null;
    try {
      return await teacherService.createTeacherSchedule(branchId, data);
    } catch (err) {
      handleError(err, { context: 'useTeacherSchedules/create' });
      return null;
    }
  }, [branchId]);

  const updateSchedule = useCallback(async (id: string, data: Partial<TeacherSchedule>): Promise<boolean> => {
    try {
      await teacherService.updateTeacherSchedule(id, data);
      return true;
    } catch (err) {
      handleError(err, { context: 'useTeacherSchedules/update' });
      return false;
    }
  }, []);

  const deleteSchedule = useCallback(async (id: string): Promise<boolean> => {
    try {
      await teacherService.deleteTeacherSchedule(id);
      return true;
    } catch (err) {
      handleError(err, { context: 'useTeacherSchedules/delete' });
      return false;
    }
  }, []);

  const schedulesByDay = useMemo(() => {
    const grouped = new Map<number, TeacherSchedule[]>();
    for (let i = 0; i < 7; i++) {
      grouped.set(i, schedules.filter(s => s.dayOfWeek === i));
    }
    return grouped;
  }, [schedules]);

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
    schedulesWithDetails: schedules,
    schedulesByDay,
    schedulesByTeacher,
    loading,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  };
}
