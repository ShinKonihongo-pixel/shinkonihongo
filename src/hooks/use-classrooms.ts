// Hooks for classroom management

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  Classroom,
  ClassroomFormData,
  ClassroomMember,
  ClassroomTest,
  TestFormData,
  ClassroomSubmission,
  SubmissionAnswer,
  ClassroomNotification,
  ClassroomLevel,
  StudentGrade,
  ClassProgress,
  AttendanceSession,
  AttendanceRecord,
  AttendanceStatus,
  StudentAttendanceSummary,
  StudentEvaluation,
  EvaluationFormData,
  StudentOverallSummary,
} from '../types/classroom';
import type { User } from '../types/user';
import * as classroomService from '../services/classroom-firestore';

// ============ MAIN CLASSROOMS HOOK ============

export function useClassrooms(userId: string | null, isAdmin: boolean) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setClassrooms([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Admin sees classrooms they created, users see classrooms they're members of
    const unsubscribe = isAdmin
      ? classroomService.subscribeToAdminClassrooms(userId, (data) => {
          setClassrooms(data);
          setLoading(false);
        })
      : classroomService.subscribeToUserClassrooms(userId, (data) => {
          setClassrooms(data);
          setLoading(false);
        });

    return () => unsubscribe();
  }, [userId, isAdmin]);

  const createClassroom = useCallback(async (data: ClassroomFormData): Promise<Classroom | null> => {
    if (!userId) return null;
    try {
      return await classroomService.createClassroom(data, userId);
    } catch (err) {
      console.error('Error creating classroom:', err);
      return null;
    }
  }, [userId]);

  const updateClassroom = useCallback(async (id: string, data: Partial<Classroom>): Promise<boolean> => {
    try {
      await classroomService.updateClassroom(id, data);
      return true;
    } catch (err) {
      console.error('Error updating classroom:', err);
      return false;
    }
  }, []);

  const deleteClassroom = useCallback(async (id: string): Promise<boolean> => {
    try {
      await classroomService.deleteClassroom(id);
      return true;
    } catch (err) {
      console.error('Error deleting classroom:', err);
      return false;
    }
  }, []);

  const joinByCode = useCallback(async (code: string): Promise<{ success: boolean; error?: string; classroom?: Classroom }> => {
    if (!userId) return { success: false, error: 'Chưa đăng nhập' };
    try {
      return await classroomService.joinByCode(code, userId);
    } catch (err) {
      console.error('Error joining classroom:', err);
      return { success: false, error: 'Lỗi khi tham gia lớp học' };
    }
  }, [userId]);

  // Helper to filter by level
  const getClassroomsByLevel = useCallback((level: ClassroomLevel): Classroom[] => {
    return classrooms.filter(c => c.level === level);
  }, [classrooms]);

  return {
    classrooms,
    loading,
    createClassroom,
    updateClassroom,
    deleteClassroom,
    joinByCode,
    getClassroomsByLevel,
  };
}

// ============ CLASSROOM MEMBERS HOOK ============

export function useClassroomMembers(classroomId: string | null, users: User[]) {
  const [members, setMembers] = useState<ClassroomMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classroomId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = classroomService.subscribeToMembers(classroomId, (data) => {
      setMembers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [classroomId]);

  // Get member with user details
  const membersWithUsers = useMemo(() => {
    return members.map(member => ({
      ...member,
      user: users.find(u => u.id === member.userId),
    }));
  }, [members, users]);

  const inviteUser = useCallback(async (
    userId: string,
    invitedBy: string
  ): Promise<ClassroomMember | null> => {
    if (!classroomId) return null;
    try {
      return await classroomService.addMember(classroomId, userId, 'student', invitedBy, 'direct');
    } catch (err) {
      console.error('Error inviting user:', err);
      return null;
    }
  }, [classroomId]);

  const removeMember = useCallback(async (memberId: string): Promise<boolean> => {
    if (!classroomId) return false;
    try {
      await classroomService.removeMember(memberId, classroomId);
      return true;
    } catch (err) {
      console.error('Error removing member:', err);
      return false;
    }
  }, [classroomId]);

  // Check if user is already a member
  const isMember = useCallback((userId: string): boolean => {
    return members.some(m => m.userId === userId);
  }, [members]);

  // Get students only
  const students = useMemo(() => {
    return membersWithUsers.filter(m => m.role === 'student');
  }, [membersWithUsers]);

  // Get admins only
  const admins = useMemo(() => {
    return membersWithUsers.filter(m => m.role === 'admin');
  }, [membersWithUsers]);

  return {
    members,
    membersWithUsers,
    students,
    admins,
    loading,
    inviteUser,
    removeMember,
    isMember,
  };
}

// ============ CLASSROOM TESTS HOOK ============

export function useClassroomTests(classroomId: string | null) {
  const [tests, setTests] = useState<ClassroomTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classroomId) {
      setTests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = classroomService.subscribeToTests(classroomId, (data) => {
      // Sort by createdAt descending
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTests(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [classroomId]);

  const createTest = useCallback(async (
    data: TestFormData,
    createdBy: string
  ): Promise<ClassroomTest | null> => {
    if (!classroomId) return null;
    try {
      return await classroomService.createTest(data, classroomId, createdBy);
    } catch (err) {
      console.error('Error creating test:', err);
      return null;
    }
  }, [classroomId]);

  const updateTest = useCallback(async (testId: string, data: Partial<ClassroomTest>): Promise<boolean> => {
    try {
      await classroomService.updateTest(testId, data);
      return true;
    } catch (err) {
      console.error('Error updating test:', err);
      return false;
    }
  }, []);

  const deleteTest = useCallback(async (testId: string): Promise<boolean> => {
    try {
      await classroomService.deleteTest(testId);
      return true;
    } catch (err) {
      console.error('Error deleting test:', err);
      return false;
    }
  }, []);

  const publishTest = useCallback(async (testId: string): Promise<boolean> => {
    if (!classroomId) return false;
    try {
      await classroomService.publishTest(testId, classroomId);
      return true;
    } catch (err) {
      console.error('Error publishing test:', err);
      return false;
    }
  }, [classroomId]);

  // Separate tests and assignments
  const testsList = useMemo(() => tests.filter(t => t.type === 'test'), [tests]);
  const assignmentsList = useMemo(() => tests.filter(t => t.type === 'assignment'), [tests]);

  // Published only
  const publishedTests = useMemo(() => tests.filter(t => t.isPublished), [tests]);

  return {
    tests,
    testsList,
    assignmentsList,
    publishedTests,
    loading,
    createTest,
    updateTest,
    deleteTest,
    publishTest,
  };
}

// ============ CLASSROOM SUBMISSIONS HOOK ============

export function useClassroomSubmissions(testId: string | null, userId?: string) {
  const [submissions, setSubmissions] = useState<ClassroomSubmission[]>([]);
  const [mySubmission, setMySubmission] = useState<ClassroomSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!testId) {
      setSubmissions([]);
      setMySubmission(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = classroomService.subscribeToSubmissions(testId, (data) => {
      setSubmissions(data);
      if (userId) {
        setMySubmission(data.find(s => s.userId === userId) || null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [testId, userId]);

  const startSubmission = useCallback(async (
    classroomId: string,
    userId: string
  ): Promise<ClassroomSubmission | null> => {
    if (!testId) return null;
    try {
      return await classroomService.startSubmission(testId, classroomId, userId);
    } catch (err) {
      console.error('Error starting submission:', err);
      return null;
    }
  }, [testId]);

  const submitAnswers = useCallback(async (
    submissionId: string,
    answers: SubmissionAnswer[],
    timeSpent: number
  ): Promise<boolean> => {
    try {
      await classroomService.submitAnswers(submissionId, answers, timeSpent);
      return true;
    } catch (err) {
      console.error('Error submitting answers:', err);
      return false;
    }
  }, []);

  const gradeSubmission = useCallback(async (
    submissionId: string,
    answers: SubmissionAnswer[],
    feedback: string,
    gradedBy: string
  ): Promise<boolean> => {
    try {
      await classroomService.gradeSubmission(submissionId, answers, feedback, gradedBy);
      return true;
    } catch (err) {
      console.error('Error grading submission:', err);
      return false;
    }
  }, []);

  // Stats
  const submittedCount = useMemo(() => {
    return submissions.filter(s => s.submittedAt).length;
  }, [submissions]);

  const averageScore = useMemo(() => {
    const submitted = submissions.filter(s => s.submittedAt);
    if (submitted.length === 0) return 0;
    const totalScore = submitted.reduce((sum, s) => sum + s.score, 0);
    const totalPoints = submitted.reduce((sum, s) => sum + s.totalPoints, 0);
    return totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
  }, [submissions]);

  return {
    submissions,
    mySubmission,
    loading,
    startSubmission,
    submitAnswers,
    gradeSubmission,
    submittedCount,
    averageScore,
  };
}

// ============ CLASSROOM GRADES HOOK ============

export function useClassroomGrades(
  classroomId: string | null,
  tests: ClassroomTest[],
  members: ClassroomMember[],
  users: User[]
) {
  const [allSubmissions, setAllSubmissions] = useState<ClassroomSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classroomId) {
      setAllSubmissions([]);
      setLoading(false);
      return;
    }

    const fetchSubmissions = async () => {
      setLoading(true);
      const submissions: ClassroomSubmission[] = [];

      for (const test of tests) {
        const testSubs = await classroomService.getSubmissionsByTest(test.id);
        submissions.push(...testSubs);
      }

      setAllSubmissions(submissions);
      setLoading(false);
    };

    fetchSubmissions();
  }, [classroomId, tests]);

  // Calculate student grades
  const studentGrades = useMemo((): StudentGrade[] => {
    const studentMembers = members.filter(m => m.role === 'student');

    return studentMembers.map(member => {
      const user = users.find(u => u.id === member.userId);
      const userSubmissions = allSubmissions.filter(s => s.userId === member.userId && s.submittedAt);

      const testsCompleted = userSubmissions.filter(s => {
        const test = tests.find(t => t.id === s.testId);
        return test?.type === 'test';
      }).length;

      const assignmentsCompleted = userSubmissions.filter(s => {
        const test = tests.find(t => t.id === s.testId);
        return test?.type === 'assignment';
      }).length;

      const totalScore = userSubmissions.reduce((sum, s) => sum + s.score, 0);
      const totalPoints = userSubmissions.reduce((sum, s) => sum + s.totalPoints, 0);
      const averagePercent = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;

      return {
        userId: member.userId,
        userName: user?.displayName || user?.username || 'Unknown',
        testsCompleted,
        assignmentsCompleted,
        totalScore,
        totalPoints,
        averagePercent,
        submissions: userSubmissions,
      };
    });
  }, [members, users, allSubmissions, tests]);

  // Calculate class progress
  const classProgress = useMemo((): ClassProgress => {
    const testsCreated = tests.filter(t => t.type === 'test').length;
    const assignmentsCreated = tests.filter(t => t.type === 'assignment').length;

    const totalStudents = studentGrades.length;
    const classAverage = totalStudents > 0
      ? studentGrades.reduce((sum, s) => sum + s.averagePercent, 0) / totalStudents
      : 0;

    return {
      classroomId: classroomId || '',
      totalStudents,
      testsCreated,
      assignmentsCreated,
      averageClassScore: classAverage,
      studentGrades,
    };
  }, [classroomId, tests, studentGrades]);

  return {
    studentGrades,
    classProgress,
    allSubmissions,
    loading,
  };
}

// ============ CLASSROOM NOTIFICATIONS HOOK ============

export function useClassroomNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<ClassroomNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = classroomService.subscribeToNotifications(userId, (data) => {
      setNotifications(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      await classroomService.markAsRead(notificationId);
      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    try {
      await classroomService.markAllAsRead(userId);
      return true;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return false;
    }
  }, [userId]);

  // Unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  // Unread notifications
  const unreadNotifications = useMemo(() => {
    return notifications.filter(n => !n.isRead);
  }, [notifications]);

  return {
    notifications,
    unreadNotifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  };
}

// ============ CLASSROOM ATTENDANCE HOOK ============

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

// ============ STUDENT EVALUATIONS HOOK ============

export function useStudentEvaluations(classroomId: string | null, users: User[]) {
  const [evaluations, setEvaluations] = useState<StudentEvaluation[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to evaluations
  useEffect(() => {
    if (!classroomId) {
      setEvaluations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = classroomService.subscribeToEvaluations(classroomId, (data) => {
      // Sort by evaluatedAt descending
      data.sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());
      setEvaluations(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [classroomId]);

  // Create evaluation
  const createEvaluation = useCallback(async (
    data: EvaluationFormData,
    evaluatorId: string
  ): Promise<StudentEvaluation | null> => {
    if (!classroomId) return null;
    try {
      return await classroomService.createEvaluation(classroomId, data, evaluatorId);
    } catch (err) {
      console.error('Error creating evaluation:', err);
      return null;
    }
  }, [classroomId]);

  // Update evaluation
  const updateEvaluation = useCallback(async (
    evaluationId: string,
    data: Partial<StudentEvaluation>
  ): Promise<boolean> => {
    try {
      await classroomService.updateEvaluation(evaluationId, data);
      return true;
    } catch (err) {
      console.error('Error updating evaluation:', err);
      return false;
    }
  }, []);

  // Delete evaluation
  const deleteEvaluation = useCallback(async (evaluationId: string): Promise<boolean> => {
    try {
      await classroomService.deleteEvaluation(evaluationId);
      return true;
    } catch (err) {
      console.error('Error deleting evaluation:', err);
      return false;
    }
  }, []);

  // Get evaluations with user info
  const evaluationsWithUsers = useMemo(() => {
    return evaluations.map(evaluation => ({
      ...evaluation,
      user: users.find(u => u.id === evaluation.userId),
      evaluator: users.find(u => u.id === evaluation.evaluatorId),
    }));
  }, [evaluations, users]);

  // Get evaluations for a specific user
  const getEvaluationsByUser = useCallback((userId: string): StudentEvaluation[] => {
    return evaluations.filter(e => e.userId === userId);
  }, [evaluations]);

  // Get latest evaluation for each user
  const latestEvaluationByUser = useMemo(() => {
    const map = new Map<string, StudentEvaluation>();
    evaluations.forEach(e => {
      const existing = map.get(e.userId);
      if (!existing || new Date(e.evaluatedAt) > new Date(existing.evaluatedAt)) {
        map.set(e.userId, e);
      }
    });
    return map;
  }, [evaluations]);

  // Calculate average rating for a user
  const getAverageRating = useCallback((userId: string): number => {
    const userEvals = evaluations.filter(e => e.userId === userId);
    if (userEvals.length === 0) return 0;
    const sum = userEvals.reduce((acc, e) => acc + e.overallRating, 0);
    return sum / userEvals.length;
  }, [evaluations]);

  return {
    evaluations,
    evaluationsWithUsers,
    loading,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
    getEvaluationsByUser,
    latestEvaluationByUser,
    getAverageRating,
  };
}

// ============ STUDENT OVERALL SUMMARY HOOK ============

export function useStudentOverallSummary(
  classroomId: string | null,
  members: ClassroomMember[],
  users: User[],
  studentGrades: StudentGrade[],
  attendanceSummaries: StudentAttendanceSummary[],
  evaluations: StudentEvaluation[]
): StudentOverallSummary[] {
  return useMemo(() => {
    const studentMembers = members.filter(m => m.role === 'student');

    return studentMembers.map(member => {
      const user = users.find(u => u.id === member.userId);
      const grades = studentGrades.find(g => g.userId === member.userId);
      const attendance = attendanceSummaries.find(a => a.userId === member.userId);

      // Get latest evaluation and calculate average rating
      const userEvaluations = evaluations.filter(e => e.userId === member.userId);
      const latestEvaluation = userEvaluations.length > 0
        ? userEvaluations.reduce((latest, e) =>
            new Date(e.evaluatedAt) > new Date(latest.evaluatedAt) ? e : latest
          )
        : undefined;
      const avgRating = userEvaluations.length > 0
        ? userEvaluations.reduce((sum, e) => sum + e.overallRating, 0) / userEvaluations.length
        : 0;

      return {
        userId: member.userId,
        userName: user?.displayName || user?.username || 'Unknown',
        // Attendance
        attendanceRate: attendance?.attendanceRate || 0,
        totalSessions: attendance?.totalSessions || 0,
        // Grades
        averageScore: grades?.averagePercent || 0,
        testsCompleted: grades?.testsCompleted || 0,
        assignmentsCompleted: grades?.assignmentsCompleted || 0,
        // Evaluation
        latestEvaluation,
        averageRating: avgRating,
      };
    });
  }, [classroomId, members, users, studentGrades, attendanceSummaries, evaluations]);
}
