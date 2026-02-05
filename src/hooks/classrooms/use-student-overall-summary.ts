// Student overall summary aggregation hook

import { useMemo } from 'react';
import type {
  ClassroomMember,
  StudentGrade,
  StudentAttendanceSummary,
  StudentEvaluation,
  StudentOverallSummary,
} from '../../types/classroom';
import type { User } from '../../types/user';

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
