// Firestore service for Teacher schedule and session operations

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type {
  TeacherSchedule,
  TeacherScheduleFormData,
  TeachingSession,
  TeachingSessionFormData,
} from '../types/teacher';

// Collection names
const COLLECTIONS = {
  TEACHER_SCHEDULES: 'teacher_schedules',
  TEACHING_SESSIONS: 'teaching_sessions',
} as const;

function getNowISO(): string {
  return new Date().toISOString();
}

// ============ TEACHER SCHEDULE CRUD ============

export async function createTeacherSchedule(
  branchId: string,
  data: TeacherScheduleFormData
): Promise<TeacherSchedule> {
  const now = getNowISO();
  const newSchedule: Omit<TeacherSchedule, 'id'> = {
    branchId,
    teacherId: data.teacherId,
    classroomId: data.classroomId,
    dayOfWeek: data.dayOfWeek,
    startTime: data.startTime,
    endTime: data.endTime,
    role: data.role,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.TEACHER_SCHEDULES), newSchedule);
  return { id: docRef.id, ...newSchedule };
}

export async function getTeacherSchedule(id: string): Promise<TeacherSchedule | null> {
  const docRef = doc(db, COLLECTIONS.TEACHER_SCHEDULES, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as TeacherSchedule;
}

export async function updateTeacherSchedule(
  id: string,
  data: Partial<TeacherSchedule>
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.TEACHER_SCHEDULES, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: getNowISO(),
  });
}

export async function deleteTeacherSchedule(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.TEACHER_SCHEDULES, id);
  await deleteDoc(docRef);
}

// Get schedules by branch
export async function getSchedulesByBranch(branchId: string): Promise<TeacherSchedule[]> {
  const q = query(
    collection(db, COLLECTIONS.TEACHER_SCHEDULES),
    where('branchId', '==', branchId),
    where('isActive', '==', true)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeacherSchedule));
}

// Get schedules by teacher
export async function getSchedulesByTeacher(teacherId: string): Promise<TeacherSchedule[]> {
  const q = query(
    collection(db, COLLECTIONS.TEACHER_SCHEDULES),
    where('teacherId', '==', teacherId),
    where('isActive', '==', true)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeacherSchedule));
}

// Get schedules by classroom
export async function getSchedulesByClassroom(classroomId: string): Promise<TeacherSchedule[]> {
  const q = query(
    collection(db, COLLECTIONS.TEACHER_SCHEDULES),
    where('classroomId', '==', classroomId),
    where('isActive', '==', true)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeacherSchedule));
}

// Subscribe to teacher's schedules
export function subscribeToTeacherSchedules(
  teacherId: string,
  callback: (schedules: TeacherSchedule[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.TEACHER_SCHEDULES),
    where('teacherId', '==', teacherId),
    where('isActive', '==', true)
  );
  return onSnapshot(q, (snapshot) => {
    const schedules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeacherSchedule));
    callback(schedules);
  });
}

// ============ TEACHING SESSION CRUD ============

export async function createTeachingSession(
  branchId: string,
  teacherId: string,
  data: TeachingSessionFormData,
  scheduleId?: string
): Promise<TeachingSession> {
  const now = getNowISO();
  const duration = calculateSessionDuration(data.startTime, data.endTime);

  const newSession: Omit<TeachingSession, 'id'> = {
    branchId,
    teacherId,
    classroomId: data.classroomId,
    scheduleId,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    duration,
    status: 'scheduled',
    note: data.note,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.TEACHING_SESSIONS), newSession);
  return { id: docRef.id, ...newSession };
}

export async function getTeachingSession(id: string): Promise<TeachingSession | null> {
  const docRef = doc(db, COLLECTIONS.TEACHING_SESSIONS, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as TeachingSession;
}

export async function updateTeachingSession(
  id: string,
  data: Partial<TeachingSession>
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.TEACHING_SESSIONS, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: getNowISO(),
  });
}

export async function deleteTeachingSession(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.TEACHING_SESSIONS, id);
  await deleteDoc(docRef);
}

// Mark session as completed
export async function completeTeachingSession(
  sessionId: string,
  actualEndTime?: string
): Promise<void> {
  const session = await getTeachingSession(sessionId);
  if (!session) return;

  const endTime = actualEndTime || session.endTime;
  const duration = calculateSessionDuration(session.startTime, endTime);

  await updateTeachingSession(sessionId, {
    status: 'completed',
    endTime,
    duration,
  });
}

// Mark session as cancelled
export async function cancelTeachingSession(
  sessionId: string,
  note?: string
): Promise<void> {
  await updateTeachingSession(sessionId, {
    status: 'cancelled',
    duration: 0,
    note,
  });
}

// Approve session (by admin)
export async function approveTeachingSession(
  sessionId: string,
  approvedBy: string
): Promise<void> {
  await updateTeachingSession(sessionId, {
    approvedBy,
    approvedAt: getNowISO(),
  });
}

// Get sessions by branch and date range
export async function getSessionsByBranchAndDateRange(
  branchId: string,
  startDate: string,
  endDate: string
): Promise<TeachingSession[]> {
  const q = query(
    collection(db, COLLECTIONS.TEACHING_SESSIONS),
    where('branchId', '==', branchId)
  );
  const snapshot = await getDocs(q);
  const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeachingSession));

  // Filter by date range
  return sessions.filter(s => s.date >= startDate && s.date <= endDate);
}

// Get sessions by teacher and month
export async function getSessionsByTeacherAndMonth(
  teacherId: string,
  month: string // YYYY-MM
): Promise<TeachingSession[]> {
  const q = query(
    collection(db, COLLECTIONS.TEACHING_SESSIONS),
    where('teacherId', '==', teacherId)
  );
  const snapshot = await getDocs(q);
  const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeachingSession));

  // Filter by month
  return sessions.filter(s => s.date.startsWith(month));
}

// Get sessions by branch and month
export async function getSessionsByBranchAndMonth(
  branchId: string,
  month: string // YYYY-MM
): Promise<TeachingSession[]> {
  const q = query(
    collection(db, COLLECTIONS.TEACHING_SESSIONS),
    where('branchId', '==', branchId)
  );
  const snapshot = await getDocs(q);
  const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeachingSession));

  // Filter by month
  return sessions.filter(s => s.date.startsWith(month));
}

// Subscribe to teacher's sessions
export function subscribeToTeacherSessions(
  teacherId: string,
  callback: (sessions: TeachingSession[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.TEACHING_SESSIONS),
    where('teacherId', '==', teacherId)
  );
  return onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeachingSession));
    // Sort by date descending
    sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(sessions);
  });
}

// Subscribe to branch's sessions
export function subscribeToBranchSessions(
  branchId: string,
  callback: (sessions: TeachingSession[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.TEACHING_SESSIONS),
    where('branchId', '==', branchId)
  );
  return onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeachingSession));
    // Sort by date descending
    sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(sessions);
  });
}

// ============ HELPER FUNCTIONS ============

function calculateSessionDuration(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  return (endH * 60 + endM) - (startH * 60 + startM);
}

// Generate sessions from schedule for a date range
export async function generateSessionsFromSchedule(
  branchId: string,
  startDate: Date,
  endDate: Date
): Promise<TeachingSession[]> {
  const schedules = await getSchedulesByBranch(branchId);
  const sessions: TeachingSession[] = [];

  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const dateStr = currentDate.toISOString().split('T')[0];

    // Find schedules for this day
    const daySchedules = schedules.filter(s => s.dayOfWeek === dayOfWeek);

    for (const schedule of daySchedules) {
      // Check if session already exists
      const existingQ = query(
        collection(db, COLLECTIONS.TEACHING_SESSIONS),
        where('scheduleId', '==', schedule.id),
        where('date', '==', dateStr)
      );
      const existing = await getDocs(existingQ);

      if (existing.empty) {
        const session = await createTeachingSession(
          branchId,
          schedule.teacherId,
          {
            classroomId: schedule.classroomId,
            date: dateStr,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
          },
          schedule.id
        );
        sessions.push(session);
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return sessions;
}

// Calculate total hours for a teacher in a month
export async function calculateTeacherMonthlyHours(
  teacherId: string,
  month: string
): Promise<{ totalHours: number; totalSessions: number; completedSessions: number }> {
  const sessions = await getSessionsByTeacherAndMonth(teacherId, month);

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const totalMinutes = completedSessions.reduce((sum, s) => sum + s.duration, 0);

  return {
    totalHours: totalMinutes / 60,
    totalSessions: sessions.length,
    completedSessions: completedSessions.length,
  };
}
