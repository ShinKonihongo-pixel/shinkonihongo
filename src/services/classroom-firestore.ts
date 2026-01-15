// Firestore service for Classroom operations

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
  increment,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type {
  Classroom,
  ClassroomFormData,
  ClassroomMember,
  ClassroomTest,
  TestFormData,
  ClassroomSubmission,
  SubmissionAnswer,
  ClassroomNotification,
  NotificationType,
  MemberRole,
  InviteMethod,
  AttendanceRecord,
  AttendanceSession,
  AttendanceStatus,
  StudentEvaluation,
  EvaluationFormData,
} from '../types/classroom';

// Collection names
const COLLECTIONS = {
  CLASSROOMS: 'classrooms',
  MEMBERS: 'classroom_members',
  TESTS: 'classroom_tests',
  SUBMISSIONS: 'classroom_submissions',
  NOTIFICATIONS: 'classroom_notifications',
  ATTENDANCE_SESSIONS: 'classroom_attendance_sessions',
  ATTENDANCE_RECORDS: 'classroom_attendance_records',
  EVALUATIONS: 'classroom_evaluations',
} as const;

function getNowISO(): string {
  return new Date().toISOString();
}

// Generate 6-char unique classroom code
function generateClassroomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ============ CLASSROOM CRUD ============

export async function createClassroom(
  data: ClassroomFormData,
  createdBy: string
): Promise<Classroom> {
  // Generate unique code
  let code = generateClassroomCode();
  let codeExists = true;
  while (codeExists) {
    const existing = await getClassroomByCode(code);
    if (!existing) {
      codeExists = false;
    } else {
      code = generateClassroomCode();
    }
  }

  const now = getNowISO();
  const newClassroom: Omit<Classroom, 'id'> = {
    ...data,
    code,
    createdBy,
    createdAt: now,
    updatedAt: now,
    studentCount: 0,
    isActive: true,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.CLASSROOMS), newClassroom);
  const classroom = { id: docRef.id, ...newClassroom };

  // Add creator as admin member
  await addMember(classroom.id, createdBy, 'admin', createdBy, 'direct');

  return classroom;
}

export async function getClassroom(id: string): Promise<Classroom | null> {
  const docRef = doc(db, COLLECTIONS.CLASSROOMS, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Classroom;
}

export async function getClassroomByCode(code: string): Promise<Classroom | null> {
  const q = query(
    collection(db, COLLECTIONS.CLASSROOMS),
    where('code', '==', code.toUpperCase()),
    where('isActive', '==', true)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Classroom;
}

export async function updateClassroom(id: string, data: Partial<Classroom>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.CLASSROOMS, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: getNowISO(),
  });
}

export async function deleteClassroom(id: string): Promise<void> {
  // Delete all members
  const membersQ = query(collection(db, COLLECTIONS.MEMBERS), where('classroomId', '==', id));
  const membersSnapshot = await getDocs(membersQ);
  for (const memberDoc of membersSnapshot.docs) {
    await deleteDoc(memberDoc.ref);
  }

  // Delete all tests
  const testsQ = query(collection(db, COLLECTIONS.TESTS), where('classroomId', '==', id));
  const testsSnapshot = await getDocs(testsQ);
  for (const testDoc of testsSnapshot.docs) {
    await deleteDoc(testDoc.ref);
  }

  // Delete all submissions
  const subsQ = query(collection(db, COLLECTIONS.SUBMISSIONS), where('classroomId', '==', id));
  const subsSnapshot = await getDocs(subsQ);
  for (const subDoc of subsSnapshot.docs) {
    await deleteDoc(subDoc.ref);
  }

  // Delete all notifications
  const notifsQ = query(collection(db, COLLECTIONS.NOTIFICATIONS), where('classroomId', '==', id));
  const notifsSnapshot = await getDocs(notifsQ);
  for (const notifDoc of notifsSnapshot.docs) {
    await deleteDoc(notifDoc.ref);
  }

  // Delete classroom
  const docRef = doc(db, COLLECTIONS.CLASSROOMS, id);
  await deleteDoc(docRef);
}

// Get classrooms created by admin
export async function getClassroomsByAdmin(adminId: string): Promise<Classroom[]> {
  const q = query(
    collection(db, COLLECTIONS.CLASSROOMS),
    where('createdBy', '==', adminId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Classroom));
}

// Subscribe to admin's classrooms
export function subscribeToAdminClassrooms(
  adminId: string,
  callback: (classrooms: Classroom[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.CLASSROOMS),
    where('createdBy', '==', adminId)
  );
  return onSnapshot(q, (snapshot) => {
    const classrooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Classroom));
    callback(classrooms);
  });
}

// Get classrooms user is a member of (for students)
export async function getClassroomsByUser(userId: string): Promise<Classroom[]> {
  // First get user's memberships
  const membersQ = query(
    collection(db, COLLECTIONS.MEMBERS),
    where('userId', '==', userId)
  );
  const membersSnapshot = await getDocs(membersQ);
  const classroomIds = membersSnapshot.docs.map(doc => doc.data().classroomId as string);

  if (classroomIds.length === 0) return [];

  // Get all classrooms user is member of
  const classrooms: Classroom[] = [];
  for (const classroomId of classroomIds) {
    const classroom = await getClassroom(classroomId);
    if (classroom && classroom.isActive) {
      classrooms.push(classroom);
    }
  }

  return classrooms;
}

// Subscribe to user's classrooms (through membership)
export function subscribeToUserClassrooms(
  userId: string,
  callback: (classrooms: Classroom[]) => void
): Unsubscribe {
  // Subscribe to user's memberships
  const membersQ = query(
    collection(db, COLLECTIONS.MEMBERS),
    where('userId', '==', userId)
  );

  return onSnapshot(membersQ, async (snapshot) => {
    const classroomIds = snapshot.docs.map(doc => doc.data().classroomId as string);

    if (classroomIds.length === 0) {
      callback([]);
      return;
    }

    // Fetch all classrooms
    const classrooms: Classroom[] = [];
    for (const classroomId of classroomIds) {
      const classroom = await getClassroom(classroomId);
      if (classroom && classroom.isActive) {
        classrooms.push(classroom);
      }
    }

    callback(classrooms);
  });
}

// ============ MEMBER MANAGEMENT ============

export async function addMember(
  classroomId: string,
  userId: string,
  role: MemberRole,
  invitedBy: string,
  inviteMethod: InviteMethod
): Promise<ClassroomMember> {
  // Check if already a member
  const existing = await getMemberByUserAndClassroom(classroomId, userId);
  if (existing) {
    return existing;
  }

  const newMember: Omit<ClassroomMember, 'id'> = {
    classroomId,
    userId,
    role,
    joinedAt: getNowISO(),
    invitedBy,
    inviteMethod,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.MEMBERS), newMember);

  // Update student count (only for students)
  if (role === 'student') {
    const classroomRef = doc(db, COLLECTIONS.CLASSROOMS, classroomId);
    await updateDoc(classroomRef, {
      studentCount: increment(1),
    });
  }

  return { id: docRef.id, ...newMember };
}

export async function removeMember(memberId: string, classroomId: string): Promise<void> {
  const memberDoc = doc(db, COLLECTIONS.MEMBERS, memberId);
  const memberSnapshot = await getDoc(memberDoc);

  if (memberSnapshot.exists()) {
    const memberData = memberSnapshot.data() as ClassroomMember;

    // Decrement count if student
    if (memberData.role === 'student') {
      const classroomRef = doc(db, COLLECTIONS.CLASSROOMS, classroomId);
      await updateDoc(classroomRef, {
        studentCount: increment(-1),
      });
    }
  }

  await deleteDoc(memberDoc);
}

export async function getMembersByClassroom(classroomId: string): Promise<ClassroomMember[]> {
  const q = query(
    collection(db, COLLECTIONS.MEMBERS),
    where('classroomId', '==', classroomId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassroomMember));
}

export async function getMemberByUserAndClassroom(
  classroomId: string,
  userId: string
): Promise<ClassroomMember | null> {
  const q = query(
    collection(db, COLLECTIONS.MEMBERS),
    where('classroomId', '==', classroomId),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ClassroomMember;
}

export function subscribeToMembers(
  classroomId: string,
  callback: (members: ClassroomMember[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.MEMBERS),
    where('classroomId', '==', classroomId)
  );
  return onSnapshot(q, (snapshot) => {
    const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassroomMember));
    callback(members);
  });
}

// Join classroom by code
export async function joinByCode(
  code: string,
  userId: string
): Promise<{ success: boolean; error?: string; classroom?: Classroom }> {
  const classroom = await getClassroomByCode(code);

  if (!classroom) {
    return { success: false, error: 'Mã lớp học không hợp lệ' };
  }

  if (!classroom.isActive) {
    return { success: false, error: 'Lớp học đã bị đóng' };
  }

  // Check if already a member
  const existing = await getMemberByUserAndClassroom(classroom.id, userId);
  if (existing) {
    return { success: true, classroom }; // Already a member
  }

  // Add as student
  await addMember(classroom.id, userId, 'student', classroom.createdBy, 'code');

  return { success: true, classroom };
}

// ============ TEST/ASSIGNMENT CRUD ============

export async function createTest(
  data: TestFormData,
  classroomId: string,
  createdBy: string
): Promise<ClassroomTest> {
  const totalPoints = data.questions.reduce((sum, q) => sum + q.points, 0);

  const newTest: Omit<ClassroomTest, 'id'> = {
    ...data,
    classroomId,
    createdBy,
    totalPoints,
    createdAt: getNowISO(),
    isPublished: false,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.TESTS), newTest);
  return { id: docRef.id, ...newTest };
}

export async function getTest(testId: string): Promise<ClassroomTest | null> {
  const docRef = doc(db, COLLECTIONS.TESTS, testId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as ClassroomTest;
}

export async function updateTest(testId: string, data: Partial<ClassroomTest>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.TESTS, testId);
  await updateDoc(docRef, data);
}

export async function deleteTest(testId: string): Promise<void> {
  // Delete all submissions for this test
  const subsQ = query(collection(db, COLLECTIONS.SUBMISSIONS), where('testId', '==', testId));
  const subsSnapshot = await getDocs(subsQ);
  for (const subDoc of subsSnapshot.docs) {
    await deleteDoc(subDoc.ref);
  }

  // Delete test
  const docRef = doc(db, COLLECTIONS.TESTS, testId);
  await deleteDoc(docRef);
}

export async function getTestsByClassroom(classroomId: string): Promise<ClassroomTest[]> {
  const q = query(
    collection(db, COLLECTIONS.TESTS),
    where('classroomId', '==', classroomId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassroomTest));
}

export function subscribeToTests(
  classroomId: string,
  callback: (tests: ClassroomTest[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.TESTS),
    where('classroomId', '==', classroomId)
  );
  return onSnapshot(q, (snapshot) => {
    const tests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassroomTest));
    callback(tests);
  });
}

export async function publishTest(testId: string, classroomId: string): Promise<void> {
  await updateTest(testId, { isPublished: true });

  // Get test info
  const test = await getTest(testId);
  if (!test) return;

  // Send notification to all students
  await sendBulkNotifications(
    classroomId,
    test.type === 'test' ? 'test_assigned' : 'assignment_assigned',
    test.type === 'test' ? 'Bài kiểm tra mới' : 'Bài tập mới',
    test.title,
    testId
  );
}

// ============ SUBMISSION MANAGEMENT ============

export async function startSubmission(
  testId: string,
  classroomId: string,
  userId: string
): Promise<ClassroomSubmission> {
  // Check if already has submission
  const existing = await getSubmissionByUserAndTest(testId, userId);
  if (existing) {
    return existing;
  }

  const test = await getTest(testId);
  if (!test) {
    throw new Error('Bài kiểm tra không tồn tại');
  }

  const newSubmission: Omit<ClassroomSubmission, 'id'> = {
    testId,
    classroomId,
    userId,
    answers: [],
    score: 0,
    totalPoints: test.totalPoints,
    startedAt: getNowISO(),
    timeSpent: 0,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.SUBMISSIONS), newSubmission);
  return { id: docRef.id, ...newSubmission };
}

export async function submitAnswers(
  submissionId: string,
  answers: SubmissionAnswer[],
  timeSpent: number
): Promise<void> {
  // Get submission and test
  const subRef = doc(db, COLLECTIONS.SUBMISSIONS, submissionId);
  const subSnapshot = await getDoc(subRef);
  if (!subSnapshot.exists()) return;

  const submission = subSnapshot.data() as ClassroomSubmission;
  const test = await getTest(submission.testId);
  if (!test) return;

  // Auto-grade multiple choice and true/false
  let score = 0;
  const gradedAnswers: SubmissionAnswer[] = answers.map(answer => {
    const question = test.questions.find(q => q.id === answer.questionId);
    if (!question) {
      return { ...answer, isCorrect: false, pointsEarned: 0 };
    }

    let isCorrect = false;
    if (question.questionType === 'multiple_choice' || question.questionType === 'true_false') {
      isCorrect = answer.answer === question.correctAnswer;
    }
    // Text questions need manual grading

    const pointsEarned = isCorrect ? question.points : 0;
    score += pointsEarned;

    return { ...answer, isCorrect, pointsEarned };
  });

  await updateDoc(subRef, {
    answers: gradedAnswers,
    score,
    submittedAt: getNowISO(),
    timeSpent,
  });
}

export async function gradeSubmission(
  submissionId: string,
  answers: SubmissionAnswer[],
  feedback: string,
  gradedBy: string
): Promise<void> {
  const score = answers.reduce((sum, a) => sum + (a.pointsEarned || 0), 0);

  const subRef = doc(db, COLLECTIONS.SUBMISSIONS, submissionId);
  await updateDoc(subRef, {
    answers,
    score,
    feedback,
    gradedBy,
    gradedAt: getNowISO(),
  });

  // Get submission to send notification
  const subSnapshot = await getDoc(subRef);
  if (subSnapshot.exists()) {
    const submission = subSnapshot.data() as ClassroomSubmission;
    await createNotification({
      classroomId: submission.classroomId,
      recipientId: submission.userId,
      type: 'submission_graded',
      title: 'Bài làm đã được chấm điểm',
      message: `Điểm của bạn: ${score}/${submission.totalPoints}`,
      relatedId: submissionId,
    });
  }
}

export async function getSubmissionByUserAndTest(
  testId: string,
  userId: string
): Promise<ClassroomSubmission | null> {
  const q = query(
    collection(db, COLLECTIONS.SUBMISSIONS),
    where('testId', '==', testId),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ClassroomSubmission;
}

export async function getSubmissionsByTest(testId: string): Promise<ClassroomSubmission[]> {
  const q = query(
    collection(db, COLLECTIONS.SUBMISSIONS),
    where('testId', '==', testId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassroomSubmission));
}

export async function getSubmissionsByUser(
  classroomId: string,
  userId: string
): Promise<ClassroomSubmission[]> {
  const q = query(
    collection(db, COLLECTIONS.SUBMISSIONS),
    where('classroomId', '==', classroomId),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassroomSubmission));
}

export function subscribeToSubmissions(
  testId: string,
  callback: (submissions: ClassroomSubmission[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.SUBMISSIONS),
    where('testId', '==', testId)
  );
  return onSnapshot(q, (snapshot) => {
    const submissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassroomSubmission));
    callback(submissions);
  });
}

// ============ NOTIFICATION MANAGEMENT ============

interface CreateNotificationData {
  classroomId: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
}

export async function createNotification(data: CreateNotificationData): Promise<ClassroomNotification> {
  const newNotification: Omit<ClassroomNotification, 'id'> = {
    ...data,
    isRead: false,
    createdAt: getNowISO(),
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), newNotification);
  return { id: docRef.id, ...newNotification };
}

export async function markAsRead(notificationId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
  await updateDoc(docRef, { isRead: true });
}

export async function markAllAsRead(userId: string): Promise<void> {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('recipientId', '==', userId),
    where('isRead', '==', false)
  );
  const snapshot = await getDocs(q);
  for (const notifDoc of snapshot.docs) {
    await updateDoc(notifDoc.ref, { isRead: true });
  }
}

export async function getUnreadNotifications(userId: string): Promise<ClassroomNotification[]> {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('recipientId', '==', userId),
    where('isRead', '==', false)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassroomNotification));
}

export async function getAllNotifications(userId: string): Promise<ClassroomNotification[]> {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('recipientId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassroomNotification));
  // Sort by createdAt descending
  return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function subscribeToNotifications(
  userId: string,
  callback: (notifications: ClassroomNotification[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('recipientId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassroomNotification));
    // Sort by createdAt descending
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(notifications);
  });
}

// Send notification to all students in a classroom
export async function sendBulkNotifications(
  classroomId: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedId?: string
): Promise<void> {
  // Get all student members
  const members = await getMembersByClassroom(classroomId);
  const studentMembers = members.filter(m => m.role === 'student');

  for (const member of studentMembers) {
    await createNotification({
      classroomId,
      recipientId: member.userId,
      type,
      title,
      message,
      relatedId,
    });
  }
}

// ============ ATTENDANCE MANAGEMENT ============

function getDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

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

// ============ STUDENT EVALUATION MANAGEMENT ============

export async function createEvaluation(
  classroomId: string,
  data: EvaluationFormData,
  evaluatorId: string
): Promise<StudentEvaluation> {
  const newEvaluation: Omit<StudentEvaluation, 'id'> = {
    classroomId,
    userId: data.userId,
    evaluatorId,
    evaluatedAt: getNowISO(),
    periodStart: data.periodStart,
    periodEnd: data.periodEnd,
    ratings: data.ratings,
    overallRating: data.overallRating,
    comment: data.comment,
    strengths: data.strengths,
    improvements: data.improvements,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.EVALUATIONS), newEvaluation);

  // Send notification to student
  await createNotification({
    classroomId,
    recipientId: data.userId,
    type: 'announcement',
    title: 'Đánh giá mới',
    message: `Bạn đã nhận được đánh giá từ giáo viên`,
    relatedId: docRef.id,
  });

  return { id: docRef.id, ...newEvaluation };
}

export async function updateEvaluation(
  evaluationId: string,
  data: Partial<EvaluationFormData>
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.EVALUATIONS, evaluationId);
  await updateDoc(docRef, {
    ...data,
    evaluatedAt: getNowISO(),
  });
}

export async function deleteEvaluation(evaluationId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.EVALUATIONS, evaluationId);
  await deleteDoc(docRef);
}

export async function getEvaluation(evaluationId: string): Promise<StudentEvaluation | null> {
  const docRef = doc(db, COLLECTIONS.EVALUATIONS, evaluationId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as StudentEvaluation;
}

export async function getEvaluationsByClassroom(classroomId: string): Promise<StudentEvaluation[]> {
  const q = query(
    collection(db, COLLECTIONS.EVALUATIONS),
    where('classroomId', '==', classroomId)
  );
  const snapshot = await getDocs(q);
  const evals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentEvaluation));
  return evals.sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());
}

export async function getEvaluationsByUser(
  classroomId: string,
  userId: string
): Promise<StudentEvaluation[]> {
  const q = query(
    collection(db, COLLECTIONS.EVALUATIONS),
    where('classroomId', '==', classroomId),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const evals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentEvaluation));
  return evals.sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());
}

export function subscribeToEvaluations(
  classroomId: string,
  callback: (evaluations: StudentEvaluation[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.EVALUATIONS),
    where('classroomId', '==', classroomId)
  );
  return onSnapshot(q, (snapshot) => {
    const evals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentEvaluation));
    evals.sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());
    callback(evals);
  });
}
