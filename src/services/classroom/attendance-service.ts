// Attendance management operations

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { AttendanceRecord, AttendanceSession, AttendanceStatus } from '../../types/classroom';
import { COLLECTIONS, getNowISO } from './collections';

export async function createAttendanceSession(
  classroomId: string,
  sessionDate: string,
  createdBy: string
): Promise<AttendanceSession> {
  // Check if session already exists for this date
  const existing = await getAttendanceSession(classroomId, sessionDate);
  if (existing) {
    return existing;
  }

  const newSession: Omit<AttendanceSession, 'id'> = {
    classroomId,
    sessionDate,
    createdBy,
    createdAt: getNowISO(),
    totalPresent: 0,
    totalLate: 0,
    totalAbsent: 0,
    totalExcused: 0,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.ATTENDANCE_SESSIONS), newSession);
  return { id: docRef.id, ...newSession };
}

export async function getAttendanceSession(
  classroomId: string,
  sessionDate: string
): Promise<AttendanceSession | null> {
  const q = query(
    collection(db, COLLECTIONS.ATTENDANCE_SESSIONS),
    where('classroomId', '==', classroomId),
    where('sessionDate', '==', sessionDate)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as AttendanceSession;
}

export async function getAttendanceSessions(classroomId: string): Promise<AttendanceSession[]> {
  const q = query(
    collection(db, COLLECTIONS.ATTENDANCE_SESSIONS),
    where('classroomId', '==', classroomId)
  );
  const snapshot = await getDocs(q);
  const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceSession));
  return sessions.sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
}

export function subscribeToAttendanceSessions(
  classroomId: string,
  callback: (sessions: AttendanceSession[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.ATTENDANCE_SESSIONS),
    where('classroomId', '==', classroomId)
  );
  return onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceSession));
    sessions.sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
    callback(sessions);
  });
}

export async function markAttendance(
  classroomId: string,
  sessionDate: string,
  userId: string,
  status: AttendanceStatus,
  checkedBy: string,
  note?: string
): Promise<AttendanceRecord> {
  // Ensure session exists
  await createAttendanceSession(classroomId, sessionDate, checkedBy);

  // Check if record exists
  const existing = await getAttendanceRecord(classroomId, sessionDate, userId);

  if (existing) {
    // Update existing record
    const docRef = doc(db, COLLECTIONS.ATTENDANCE_RECORDS, existing.id);
    await updateDoc(docRef, {
      status,
      note,
      checkedBy,
      checkedAt: getNowISO(),
    });
    return { ...existing, status, note, checkedBy, checkedAt: getNowISO() };
  }

  // Create new record
  const newRecord: Omit<AttendanceRecord, 'id'> = {
    classroomId,
    sessionDate,
    userId,
    status,
    note,
    checkedBy,
    checkedAt: getNowISO(),
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.ATTENDANCE_RECORDS), newRecord);

  // Update session counts
  await updateAttendanceSessionCounts(classroomId, sessionDate);

  return { id: docRef.id, ...newRecord };
}

export async function bulkMarkAttendance(
  classroomId: string,
  sessionDate: string,
  records: { userId: string; status: AttendanceStatus; note?: string }[],
  checkedBy: string
): Promise<void> {
  // Ensure session exists
  await createAttendanceSession(classroomId, sessionDate, checkedBy);

  for (const record of records) {
    await markAttendance(classroomId, sessionDate, record.userId, record.status, checkedBy, record.note);
  }

  // Update session counts
  await updateAttendanceSessionCounts(classroomId, sessionDate);
}

async function updateAttendanceSessionCounts(classroomId: string, sessionDate: string): Promise<void> {
  const records = await getAttendanceRecordsBySession(classroomId, sessionDate);

  const counts = {
    totalPresent: records.filter(r => r.status === 'present').length,
    totalLate: records.filter(r => r.status === 'late').length,
    totalAbsent: records.filter(r => r.status === 'absent').length,
    totalExcused: records.filter(r => r.status === 'excused').length,
  };

  const session = await getAttendanceSession(classroomId, sessionDate);
  if (session) {
    const sessionRef = doc(db, COLLECTIONS.ATTENDANCE_SESSIONS, session.id);
    await updateDoc(sessionRef, counts);
  }
}

export async function getAttendanceRecord(
  classroomId: string,
  sessionDate: string,
  userId: string
): Promise<AttendanceRecord | null> {
  const q = query(
    collection(db, COLLECTIONS.ATTENDANCE_RECORDS),
    where('classroomId', '==', classroomId),
    where('sessionDate', '==', sessionDate),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as AttendanceRecord;
}

export async function getAttendanceRecordsBySession(
  classroomId: string,
  sessionDate: string
): Promise<AttendanceRecord[]> {
  const q = query(
    collection(db, COLLECTIONS.ATTENDANCE_RECORDS),
    where('classroomId', '==', classroomId),
    where('sessionDate', '==', sessionDate)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
}

export async function getAttendanceRecordsByUser(
  classroomId: string,
  userId: string
): Promise<AttendanceRecord[]> {
  const q = query(
    collection(db, COLLECTIONS.ATTENDANCE_RECORDS),
    where('classroomId', '==', classroomId),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
}

export function subscribeToAttendanceRecords(
  classroomId: string,
  sessionDate: string,
  callback: (records: AttendanceRecord[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.ATTENDANCE_RECORDS),
    where('classroomId', '==', classroomId),
    where('sessionDate', '==', sessionDate)
  );
  return onSnapshot(q, (snapshot) => {
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
    callback(records);
  });
}
