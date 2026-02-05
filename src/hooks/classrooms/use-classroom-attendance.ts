// Classroom attendance tracking hook

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  AttendanceSession,
  AttendanceRecord,
  AttendanceStatus,
  StudentAttendanceSummary,
} from '../../types/classroom';
import type { User } from '../../types/user';
import * as classroomService from '../../services/classroom-firestore';

export function useClassroomAttendance(classroomId: string | null, users: User[]) {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [currentRecords, setCurrentRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to attendance sessions
  useEffect(() => {
    if (!classroomId) {
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = classroomService.subscribeToAttendanceSessions(classroomId, (data) => {
      // Sort by date descending (newest first)
      data.sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
      setSessions(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [classroomId]);

  // Subscribe to records for selected date
  useEffect(() => {
    if (!classroomId || !selectedDate) {
      setCurrentRecords([]);
      return;
    }

    const unsubscribe = classroomService.subscribeToAttendanceRecords(classroomId, selectedDate, (data) => {
      setCurrentRecords(data);
    });

    return () => unsubscribe();
  }, [classroomId, selectedDate]);

  // Create a new attendance session for today
  const createSession = useCallback(async (
    sessionDate: string,
    createdBy: string
  ): Promise<AttendanceSession | null> => {
    if (!classroomId) return null;
    try {
      const session = await classroomService.createAttendanceSession(classroomId, sessionDate, createdBy);
      setSelectedDate(sessionDate);
      return session;
    } catch (err) {
      console.error('Error creating attendance session:', err);
      return null;
    }
  }, [classroomId]);

  // Mark single student attendance
  const markAttendance = useCallback(async (
    userId: string,
    status: AttendanceStatus,
    checkedBy: string,
    note?: string
  ): Promise<AttendanceRecord | null> => {
    if (!classroomId || !selectedDate) return null;
    try {
      return await classroomService.markAttendance(classroomId, selectedDate, userId, status, checkedBy, note);
    } catch (err) {
      console.error('Error marking attendance:', err);
      return null;
    }
  }, [classroomId, selectedDate]);

  // Bulk mark attendance for all students
  const bulkMarkAttendance = useCallback(async (
    records: { userId: string; status: AttendanceStatus; note?: string }[],
    checkedBy: string
  ): Promise<boolean> => {
    if (!classroomId || !selectedDate) return false;
    try {
      await classroomService.bulkMarkAttendance(classroomId, selectedDate, records, checkedBy);
      return true;
    } catch (err) {
      console.error('Error bulk marking attendance:', err);
      return false;
    }
  }, [classroomId, selectedDate]);

  // Get records with user info
  const recordsWithUsers = useMemo(() => {
    return currentRecords.map(record => ({
      ...record,
      user: users.find(u => u.id === record.userId),
    }));
  }, [currentRecords, users]);

  // Calculate student attendance summaries
  const studentSummaries = useMemo((): StudentAttendanceSummary[] => {
    // Get unique student IDs from all records
    const studentIds = new Set<string>();
    sessions.forEach(() => {
      currentRecords.forEach(r => studentIds.add(r.userId));
    });

    return Array.from(studentIds).map(userId => {
      const user = users.find(u => u.id === userId);
      const userRecords = currentRecords.filter(r => r.userId === userId);

      const present = userRecords.filter(r => r.status === 'present').length;
      const late = userRecords.filter(r => r.status === 'late').length;
      const absent = userRecords.filter(r => r.status === 'absent').length;
      const excused = userRecords.filter(r => r.status === 'excused').length;
      const total = sessions.length;

      return {
        userId,
        userName: user?.displayName || user?.username || 'Unknown',
        totalSessions: total,
        present,
        late,
        absent,
        excused,
        attendanceRate: total > 0 ? ((present + late) / total) * 100 : 0,
      };
    });
  }, [sessions, currentRecords, users]);

  // Get session by date
  const getSessionByDate = useCallback((date: string): AttendanceSession | undefined => {
    return sessions.find(s => s.sessionDate === date);
  }, [sessions]);

  // Check if session exists for date
  const hasSessionForDate = useCallback((date: string): boolean => {
    return sessions.some(s => s.sessionDate === date);
  }, [sessions]);

  return {
    sessions,
    currentRecords,
    recordsWithUsers,
    selectedDate,
    setSelectedDate,
    loading,
    createSession,
    markAttendance,
    bulkMarkAttendance,
    studentSummaries,
    getSessionByDate,
    hasSessionForDate,
  };
}
