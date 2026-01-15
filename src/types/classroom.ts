// Classroom feature types

// Classroom levels (Vietnamese labels)
export type ClassroomLevel = 'basic' | 'intermediate' | 'advanced';

export const CLASSROOM_LEVELS: { value: ClassroomLevel; label: string }[] = [
  { value: 'basic', label: 'Cơ bản' },
  { value: 'intermediate', label: 'Trung cấp' },
  { value: 'advanced', label: 'Nâng cao' },
];

export const CLASSROOM_LEVEL_LABELS: Record<ClassroomLevel, string> = {
  basic: 'Cơ bản',
  intermediate: 'Trung cấp',
  advanced: 'Nâng cao',
};

export const CLASSROOM_LEVEL_COLORS: Record<ClassroomLevel, string> = {
  basic: '#27ae60',
  intermediate: '#3498db',
  advanced: '#e74c3c',
};

// Day of week labels (Vietnamese)
export const DAY_OF_WEEK_LABELS: Record<number, string> = {
  0: 'Chủ nhật',
  1: 'Thứ 2',
  2: 'Thứ 3',
  3: 'Thứ 4',
  4: 'Thứ 5',
  5: 'Thứ 6',
  6: 'Thứ 7',
};

// Schedule structure (calendar-style)
export interface ClassSchedule {
  dayOfWeek: number;  // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string;  // HH:MM format
  endTime: string;    // HH:MM format
}

// Main classroom entity
export interface Classroom {
  id: string;
  code: string;              // 6-char unique join code
  name: string;
  level: ClassroomLevel;
  description?: string;
  createdBy: string;         // Admin userId who created
  createdAt: string;         // ISO date
  updatedAt: string;         // ISO date
  schedule: ClassSchedule[];
  studentCount: number;
  isActive: boolean;
}

// Form data for creating/editing classroom
export interface ClassroomFormData {
  name: string;
  level: ClassroomLevel;
  description?: string;
  schedule: ClassSchedule[];
}

// Member role and invite method types
export type MemberRole = 'admin' | 'student';
export type InviteMethod = 'direct' | 'code';

// Classroom member
export interface ClassroomMember {
  id: string;
  classroomId: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;          // ISO date
  invitedBy: string;         // userId who invited
  inviteMethod: InviteMethod;
}

// Test/Assignment types
export type TestType = 'test' | 'assignment';
export type QuestionType = 'multiple_choice' | 'text' | 'true_false';

// Test question
export interface TestQuestion {
  id: string;
  question: string;
  questionType: QuestionType;
  options?: string[];        // For multiple_choice
  correctAnswer: string | number;  // Index for multiple_choice, string for text, boolean for true_false
  points: number;
  explanation?: string;      // Show after grading
}

// Classroom test/assignment
export interface ClassroomTest {
  id: string;
  classroomId: string;
  title: string;
  description?: string;
  type: TestType;
  questions: TestQuestion[];
  timeLimit?: number;        // Minutes (null for assignments)
  deadline?: string;         // ISO date (for assignments)
  totalPoints: number;
  createdBy: string;
  createdAt: string;
  isPublished: boolean;
}

// Form data for creating/editing test
export interface TestFormData {
  title: string;
  description?: string;
  type: TestType;
  questions: TestQuestion[];
  timeLimit?: number;
  deadline?: string;
}

// Submission answer
export interface SubmissionAnswer {
  questionId: string;
  answer: string | number;
  isCorrect?: boolean;       // Set after grading
  pointsEarned?: number;     // Set after grading
}

// Student submission
export interface ClassroomSubmission {
  id: string;
  testId: string;
  classroomId: string;
  userId: string;
  answers: SubmissionAnswer[];
  score: number;
  totalPoints: number;
  startedAt: string;         // ISO date
  submittedAt?: string;      // ISO date (null if in progress)
  timeSpent: number;         // Seconds
  feedback?: string;         // Teacher feedback
  gradedBy?: string;         // userId who graded
  gradedAt?: string;         // ISO date
}

// Notification types
export type NotificationType =
  | 'test_assigned'
  | 'assignment_assigned'
  | 'submission_graded'
  | 'deadline_reminder'
  | 'class_invitation'
  | 'announcement';

// Classroom notification
export interface ClassroomNotification {
  id: string;
  classroomId: string;
  recipientId: string;       // userId
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;        // testId, submissionId, etc.
  isRead: boolean;
  createdAt: string;         // ISO date
}

// Grade summary for a student
export interface StudentGrade {
  userId: string;
  userName: string;
  testsCompleted: number;
  assignmentsCompleted: number;
  totalScore: number;
  totalPoints: number;
  averagePercent: number;
  submissions: ClassroomSubmission[];
}

// Class progress summary (for admin)
export interface ClassProgress {
  classroomId: string;
  totalStudents: number;
  testsCreated: number;
  assignmentsCreated: number;
  averageClassScore: number;
  studentGrades: StudentGrade[];
}

// Extended classroom with member info (for display)
export interface ClassroomWithMember extends Classroom {
  memberRole?: MemberRole;
  memberJoinedAt?: string;
}

// ============ ATTENDANCE TRACKING ============

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Có mặt',
  late: 'Đi muộn',
  absent: 'Vắng',
  excused: 'Có phép',
};

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: '#27ae60',
  late: '#f39c12',
  absent: '#e74c3c',
  excused: '#3498db',
};

// Single attendance record
export interface AttendanceRecord {
  id: string;
  classroomId: string;
  sessionDate: string;        // ISO date (YYYY-MM-DD)
  userId: string;
  status: AttendanceStatus;
  note?: string;              // Teacher note
  checkedBy: string;          // Admin who marked
  checkedAt: string;          // ISO date
}

// Attendance session (a class day)
export interface AttendanceSession {
  id: string;
  classroomId: string;
  sessionDate: string;        // ISO date (YYYY-MM-DD)
  createdBy: string;
  createdAt: string;
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  totalExcused: number;
}

// Student attendance summary
export interface StudentAttendanceSummary {
  userId: string;
  userName: string;
  totalSessions: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
  attendanceRate: number;     // Percentage (present + late) / total
}

// ============ STUDENT EVALUATION ============

export type EvaluationRating = 1 | 2 | 3 | 4 | 5;

export const EVALUATION_RATING_LABELS: Record<EvaluationRating, string> = {
  1: 'Yếu',
  2: 'Trung bình',
  3: 'Khá',
  4: 'Tốt',
  5: 'Xuất sắc',
};

// Evaluation criteria
export interface EvaluationCriteria {
  id: string;
  name: string;
  description?: string;
  maxPoints: number;
}

// Default evaluation criteria
export const DEFAULT_EVALUATION_CRITERIA: EvaluationCriteria[] = [
  { id: 'participation', name: 'Tham gia lớp học', description: 'Phát biểu, tương tác', maxPoints: 10 },
  { id: 'homework', name: 'Bài tập về nhà', description: 'Nộp đúng hạn, chất lượng', maxPoints: 10 },
  { id: 'attitude', name: 'Thái độ học tập', description: 'Chăm chỉ, nghiêm túc', maxPoints: 10 },
  { id: 'progress', name: 'Tiến bộ', description: 'Sự tiến bộ qua thời gian', maxPoints: 10 },
];

// Single evaluation record
export interface StudentEvaluation {
  id: string;
  classroomId: string;
  userId: string;
  evaluatorId: string;        // Admin who evaluated
  evaluatedAt: string;        // ISO date
  periodStart: string;        // Evaluation period start (ISO)
  periodEnd: string;          // Evaluation period end (ISO)
  ratings: Record<string, number>;  // criteriaId -> points
  overallRating: EvaluationRating;
  comment: string;
  strengths?: string;
  improvements?: string;
}

// Form data for creating evaluation
export interface EvaluationFormData {
  userId: string;
  periodStart: string;
  periodEnd: string;
  ratings: Record<string, number>;
  overallRating: EvaluationRating;
  comment: string;
  strengths?: string;
  improvements?: string;
}

// Student overall summary (for dashboard)
export interface StudentOverallSummary {
  userId: string;
  userName: string;
  // Attendance
  attendanceRate: number;
  totalSessions: number;
  // Grades
  averageScore: number;
  testsCompleted: number;
  assignmentsCompleted: number;
  // Evaluation
  latestEvaluation?: StudentEvaluation;
  averageRating: number;
}
