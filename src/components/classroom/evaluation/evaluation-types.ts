// Shared types and utilities for evaluation components

import type { User } from '../../../types/user';
import type {
  Classroom,
  StudentEvaluation,
  EvaluationFormData,
  EvaluationRating,
  EvaluationLevel,
  StudentGrade,
  StudentAttendanceSummary,
  AttendanceRecord,
  ClassroomSubmission,
  ClassroomTest,
} from '../../../types/classroom';
import {
  EVALUATION_RATING_LABELS,
  EVALUATION_LEVEL_INFO,
  DEFAULT_EVALUATION_CRITERIA,
  EVALUATION_COMMENT_SUGGESTIONS,
} from '../../../types/classroom';

export interface EvaluationPanelProps {
  evaluations: StudentEvaluation[];
  students: { userId: string; user?: User }[];
  loading: boolean;
  onCreate: (data: EvaluationFormData) => Promise<StudentEvaluation | null>;
  onUpdate: (id: string, data: Partial<StudentEvaluation>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  getAverageRating: (userId: string) => number;
  latestEvaluationByUser: Map<string, StudentEvaluation>;
  classroom?: Classroom;
  studentGrades?: StudentGrade[];
  attendanceSummaries?: StudentAttendanceSummary[];
  submissions?: ClassroomSubmission[];
  tests?: ClassroomTest[];
  attendanceRecords?: AttendanceRecord[];
}

export interface EvaluationState {
  showForm: boolean;
  editingId: string | null;
  expandedUser: string | null;
  saving: boolean;
  deleteConfirm: string | null;
  showSuggestions: string | null;
  exporting: boolean;
  sending: boolean;
  sendSuccess: string | null;
}

// Utility functions
export function getPointsLevel(points: number, maxPoints: number): EvaluationLevel {
  const percentage = (points / maxPoints) * 10;
  if (percentage >= 9) return 'excellent';
  if (percentage >= 7) return 'good';
  if (percentage >= 5) return 'average';
  return 'weak';
}

export function getLevelPoints(level: EvaluationLevel, maxPoints: number): number {
  const range = EVALUATION_LEVEL_INFO[level].pointRange;
  return Math.round((range[0] + range[1]) / 2 * maxPoints / 10);
}

export function getLevelFromPercent(percent: number): EvaluationLevel {
  if (percent >= 90) return 'excellent';
  if (percent >= 70) return 'good';
  if (percent >= 50) return 'average';
  return 'weak';
}

export function calculateOverallRating(ratings: Record<string, number>): EvaluationRating {
  const values = Object.values(ratings);
  if (values.length === 0) return 3;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  if (avg >= 9) return 5;
  if (avg >= 7) return 4;
  if (avg >= 5) return 3;
  if (avg >= 3) return 2;
  return 1;
}

export function autoCalculateRatings(
  userId: string,
  studentGrades: StudentGrade[],
  attendanceSummaries: StudentAttendanceSummary[]
): Record<string, number> {
  const grade = studentGrades.find(g => g.userId === userId);
  const attendance = attendanceSummaries.find(a => a.userId === userId);
  const ratings: Record<string, number> = {};

  const avgPercent = grade?.averagePercent || 0;
  const attendanceRate = attendance?.attendanceRate || 0;
  const testsCompleted = (grade?.testsCompleted || 0) + (grade?.assignmentsCompleted || 0);

  // Language skills based on test scores
  const languageLevel = getLevelFromPercent(avgPercent);
  const languagePoints = getLevelPoints(languageLevel, 10);
  ['vocabulary', 'grammar', 'kanji', 'speaking', 'reading', 'listening'].forEach(id => {
    ratings[id] = languagePoints;
  });

  // Participation based on attendance + tests completed
  const participationScore = Math.min(10, Math.round((attendanceRate / 10) * 0.6 + (testsCompleted > 5 ? 4 : testsCompleted * 0.8)));
  ratings['participation'] = participationScore;

  // Homework based on assignments completed
  const homeworkScore = Math.min(10, Math.round((grade?.assignmentsCompleted || 0) * 2));
  ratings['homework'] = Math.max(homeworkScore, languagePoints);

  // Attitude based on attendance
  const attitudeLevel = getLevelFromPercent(attendanceRate);
  ratings['attitude'] = getLevelPoints(attitudeLevel, 10);

  // Progress average of all
  const totalScores = Object.values(ratings);
  const avgScore = totalScores.length > 0 ? totalScores.reduce((a, b) => a + b, 0) / totalScores.length : 5;
  ratings['progress'] = Math.round(avgScore);

  return ratings;
}

export function generateAutoComment(
  userId: string,
  studentGrades: StudentGrade[],
  attendanceSummaries: StudentAttendanceSummary[]
): { comment: string; strengths: string; improvements: string } {
  const grade = studentGrades.find(g => g.userId === userId);
  const attendance = attendanceSummaries.find(a => a.userId === userId);
  const overallLevel = getLevelFromPercent((grade?.averagePercent || 0 + (attendance?.attendanceRate || 0)) / 2);

  const comments = EVALUATION_COMMENT_SUGGESTIONS.overall[overallLevel];
  const comment = comments[Math.floor(Math.random() * comments.length)];

  const strengths: string[] = [];
  if ((grade?.averagePercent || 0) >= 70) strengths.push('Ket qua hoc tap tot');
  if ((attendance?.attendanceRate || 0) >= 90) strengths.push('Chuyen can cao');
  if ((grade?.testsCompleted || 0) >= 3) strengths.push('Tich cuc lam bai kiem tra');

  const improvements: string[] = [];
  if ((grade?.averagePercent || 0) < 50) improvements.push('Can cai thien diem so');
  if ((attendance?.attendanceRate || 0) < 80) improvements.push('Can di hoc day du hon');
  if ((grade?.assignmentsCompleted || 0) < 2) improvements.push('Can lam bai tap ve nha');

  return {
    comment,
    strengths: strengths.join(', '),
    improvements: improvements.join(', '),
  };
}

// Re-export constants
export {
  EVALUATION_RATING_LABELS,
  EVALUATION_LEVEL_INFO,
  DEFAULT_EVALUATION_CRITERIA,
  EVALUATION_COMMENT_SUGGESTIONS,
};
