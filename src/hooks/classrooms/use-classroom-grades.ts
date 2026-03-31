// Classroom grades and progress tracking hook

import { useState, useEffect, useMemo } from 'react';
import type {
  ClassroomMember,
  ClassroomTest,
  ClassroomSubmission,
  StudentGrade,
  ClassProgress,
} from '../../types/classroom';
import type { User } from '../../types/user';
import * as classroomService from '../../services/classroom-firestore';

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
