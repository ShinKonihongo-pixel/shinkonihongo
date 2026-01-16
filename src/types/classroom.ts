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
  branchId: string;          // Chi nhánh chứa lớp học
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
  branchId?: string;         // Optional for edit, required for create
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
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

// Default points per question
export const DEFAULT_QUESTION_POINTS = 20;

// Test question
export interface TestQuestion {
  id: string;
  question: string;
  questionType: QuestionType;
  options?: string[];        // For multiple_choice
  correctAnswer: string | number;  // Index for multiple_choice, string for text, boolean for true_false
  points: number;
  difficulty?: DifficultyLevel;   // Difficulty level: easy/medium/hard
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
  sourceTemplateId?: string; // Reference to original test template
}

// Folder for organizing tests/assignments in test bank
export interface TestFolder {
  id: string;
  name: string;
  level: string;             // N5, N4, N3, N2, N1, etc.
  type: TestType;            // 'test' or 'assignment'
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Test template for test bank (not tied to any classroom)
export interface TestTemplate {
  id: string;
  title: string;
  description?: string;
  type: TestType;
  folderId?: string;         // Optional folder for organization
  questions: TestQuestion[];
  timeLimit?: number;        // Minutes (null for assignments)
  totalPoints: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];           // Tags for categorization
  level?: string;            // N5, N4, N3, N2, N1, etc.
  isActive: boolean;         // Can be deactivated
  sourceType?: 'custom' | 'flashcard' | 'jlpt';  // Where questions came from
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

// Level suggestions for quick selection
export type EvaluationLevel = 'excellent' | 'good' | 'average' | 'weak';

export const EVALUATION_LEVEL_INFO: Record<EvaluationLevel, { label: string; color: string; pointRange: [number, number] }> = {
  excellent: { label: 'Xuất sắc', color: '#27ae60', pointRange: [9, 10] },
  good: { label: 'Tốt', color: '#3498db', pointRange: [7, 8] },
  average: { label: 'Trung bình', color: '#f39c12', pointRange: [5, 6] },
  weak: { label: 'Yếu', color: '#e74c3c', pointRange: [0, 4] },
};

// Evaluation criteria with suggestions for each level
export interface EvaluationCriteria {
  id: string;
  name: string;
  description?: string;
  maxPoints: number;
  icon?: string;
  suggestions: Record<EvaluationLevel, string>;
}

// Comprehensive evaluation criteria for Japanese language learning
export const DEFAULT_EVALUATION_CRITERIA: EvaluationCriteria[] = [
  // Language Skills
  {
    id: 'vocabulary',
    name: 'Từ vựng',
    description: 'Vốn từ vựng, khả năng ghi nhớ và sử dụng từ mới',
    maxPoints: 10,
    icon: '📚',
    suggestions: {
      excellent: 'Nắm vững từ vựng, sử dụng chính xác và phong phú, chủ động học từ mới',
      good: 'Từ vựng khá tốt, đôi khi còn nhầm lẫn nghĩa một số từ',
      average: 'Vốn từ còn hạn chế, cần ôn tập thường xuyên hơn',
      weak: 'Từ vựng yếu, hay quên, cần tập trung học từ cơ bản',
    },
  },
  {
    id: 'grammar',
    name: 'Ngữ pháp',
    description: 'Khả năng nắm bắt và áp dụng cấu trúc ngữ pháp',
    maxPoints: 10,
    icon: '📝',
    suggestions: {
      excellent: 'Ngữ pháp vững chắc, ít mắc lỗi, vận dụng linh hoạt nhiều mẫu câu',
      good: 'Nắm được các cấu trúc cơ bản, đôi khi còn nhầm lẫn mẫu câu phức tạp',
      average: 'Cần củng cố thêm ngữ pháp, hay mắc lỗi cơ bản',
      weak: 'Ngữ pháp yếu, chưa phân biệt được các cấu trúc, cần học lại từ đầu',
    },
  },
  {
    id: 'kanji',
    name: 'Hán tự (Kanji)',
    description: 'Khả năng đọc, viết và nhận diện Kanji',
    maxPoints: 10,
    icon: '漢',
    suggestions: {
      excellent: 'Nhớ Kanji tốt, viết đúng thứ tự nét, đọc chính xác cả âm On và Kun',
      good: 'Đọc Kanji khá tốt, đôi khi còn nhầm Kanji có hình dạng tương tự',
      average: 'Cần ôn tập Kanji thường xuyên hơn, khả năng viết còn hạn chế',
      weak: 'Kanji yếu, cần tập viết và đọc Kanji cơ bản mỗi ngày',
    },
  },
  {
    id: 'speaking',
    name: 'Giao tiếp',
    description: 'Khả năng nói, phát âm và phản xạ giao tiếp',
    maxPoints: 10,
    icon: '🗣️',
    suggestions: {
      excellent: 'Giao tiếp tự tin, phát âm chuẩn, phản xạ nhanh, diễn đạt mạch lạc',
      good: 'Giao tiếp khá tốt, đôi khi còn ngập ngừng khi gặp tình huống mới',
      average: 'Còn rụt rè khi nói, cần luyện tập giao tiếp nhiều hơn',
      weak: 'Ngại nói, phát âm chưa chuẩn, cần tập phản xạ giao tiếp cơ bản',
    },
  },
  {
    id: 'reading',
    name: 'Đọc hiểu',
    description: 'Khả năng đọc và hiểu văn bản tiếng Nhật',
    maxPoints: 10,
    icon: '📖',
    suggestions: {
      excellent: 'Đọc hiểu tốt, nắm được ý chính và chi tiết, hiểu ngữ cảnh',
      good: 'Đọc hiểu khá tốt các văn bản đơn giản, còn khó khăn với văn bản phức tạp',
      average: 'Cần cải thiện tốc độ đọc và khả năng suy luận ngữ cảnh',
      weak: 'Đọc hiểu yếu, cần luyện đọc nhiều hơn từ văn bản cơ bản',
    },
  },
  {
    id: 'listening',
    name: 'Nghe hiểu',
    description: 'Khả năng nghe và hiểu tiếng Nhật',
    maxPoints: 10,
    icon: '👂',
    suggestions: {
      excellent: 'Nghe hiểu tốt cả tốc độ nhanh, nắm được ý chính và chi tiết',
      good: 'Nghe hiểu khá, cần nghe lại một vài lần với tốc độ nhanh',
      average: 'Còn khó khăn khi nghe tốc độ bình thường, cần luyện nghe nhiều hơn',
      weak: 'Nghe hiểu yếu, cần bắt đầu từ các bài nghe chậm, rõ ràng',
    },
  },
  // Attitude & Participation
  {
    id: 'participation',
    name: 'Tham gia xây dựng bài',
    description: 'Mức độ tích cực phát biểu, đặt câu hỏi và tương tác trong lớp',
    maxPoints: 10,
    icon: '✋',
    suggestions: {
      excellent: 'Rất tích cực, thường xuyên phát biểu, đặt câu hỏi hay, giúp đỡ bạn học',
      good: 'Tham gia khá tốt, phát biểu khi được hỏi, đôi khi chủ động',
      average: 'Còn thụ động, ít phát biểu, cần chủ động hơn trong lớp',
      weak: 'Rất thụ động, không tham gia thảo luận, cần khuyến khích nhiều hơn',
    },
  },
  {
    id: 'homework',
    name: 'Bài tập về nhà',
    description: 'Nộp bài đúng hạn, chất lượng và sự cố gắng',
    maxPoints: 10,
    icon: '📋',
    suggestions: {
      excellent: 'Luôn nộp đúng hạn, bài làm cẩn thận, chất lượng cao, có tìm hiểu thêm',
      good: 'Nộp bài đúng hạn, chất lượng khá tốt, đôi khi còn sơ sài',
      average: 'Đôi khi nộp trễ, bài làm qua loa, cần chú tâm hơn',
      weak: 'Hay không nộp bài hoặc nộp trễ, chất lượng kém, cần cải thiện',
    },
  },
  {
    id: 'attitude',
    name: 'Thái độ học tập',
    description: 'Sự chăm chỉ, nghiêm túc và tinh thần học hỏi',
    maxPoints: 10,
    icon: '💪',
    suggestions: {
      excellent: 'Rất chăm chỉ, nghiêm túc, luôn chuẩn bị bài trước, tinh thần cầu tiến cao',
      good: 'Thái độ tốt, nghiêm túc trong lớp, đôi khi mất tập trung',
      average: 'Cần nghiêm túc hơn, hay mất tập trung, thiếu chuẩn bị',
      weak: 'Thái độ chưa tốt, hay lơ là, không tập trung, cần thay đổi',
    },
  },
  {
    id: 'progress',
    name: 'Tiến bộ',
    description: 'Sự tiến bộ so với thời gian trước',
    maxPoints: 10,
    icon: '📈',
    suggestions: {
      excellent: 'Tiến bộ vượt bậc, kết quả cải thiện rõ rệt, rất đáng khen ngợi',
      good: 'Có tiến bộ tốt, duy trì được phong độ học tập',
      average: 'Tiến bộ chưa rõ ràng, cần nỗ lực hơn để thấy kết quả',
      weak: 'Chưa thấy tiến bộ hoặc đi xuống, cần tìm hiểu nguyên nhân và hỗ trợ',
    },
  },
];

// Comment suggestions for strengths and improvements
export const EVALUATION_COMMENT_SUGGESTIONS = {
  strengths: [
    'Chăm chỉ, cố gắng trong học tập',
    'Tiếp thu nhanh, hiểu bài tốt',
    'Tích cực tham gia phát biểu trong lớp',
    'Có tinh thần cầu tiến, hay đặt câu hỏi',
    'Phát âm chuẩn, giọng nói tự nhiên',
    'Nhớ từ vựng tốt, vốn từ phong phú',
    'Ngữ pháp vững chắc',
    'Viết Kanji đẹp, nhớ Kanji tốt',
    'Giao tiếp tự tin, không ngại nói',
    'Hoàn thành bài tập đầy đủ, đúng hạn',
    'Có sự tiến bộ rõ rệt',
    'Giúp đỡ bạn học khác',
  ],
  improvements: [
    'Cần ôn tập từ vựng thường xuyên hơn',
    'Cần củng cố thêm ngữ pháp cơ bản',
    'Cần luyện viết Kanji nhiều hơn',
    'Cần tự tin hơn khi giao tiếp',
    'Cần chủ động hơn trong lớp học',
    'Cần nộp bài tập đúng hạn',
    'Cần tập trung hơn trong giờ học',
    'Cần luyện nghe nhiều hơn',
    'Cần đọc thêm văn bản tiếng Nhật',
    'Cần chuẩn bị bài trước khi đến lớp',
    'Cần tham gia thảo luận nhiều hơn',
    'Cần cải thiện phát âm',
  ],
  overall: {
    excellent: [
      'Học viên xuất sắc, tiến bộ vượt bậc. Tiếp tục phát huy!',
      'Kết quả học tập rất tốt, thái độ nghiêm túc. Rất đáng khen ngợi!',
      'Em là tấm gương học tập tốt cho cả lớp. Cố gắng duy trì nhé!',
    ],
    good: [
      'Học tập tốt, có nhiều tiến bộ. Cần duy trì và phát huy hơn nữa.',
      'Kết quả khá tốt, cần cố gắng thêm một chút để đạt kết quả cao hơn.',
      'Em học khá tốt, nếu chủ động hơn sẽ tiến bộ nhanh hơn nữa.',
    ],
    average: [
      'Kết quả ở mức trung bình, cần nỗ lực hơn trong thời gian tới.',
      'Cần cải thiện một số kỹ năng, tập trung ôn tập thường xuyên hơn.',
      'Em có khả năng tốt, cần chăm chỉ hơn để phát huy hết tiềm năng.',
    ],
    weak: [
      'Kết quả chưa đạt yêu cầu, cần nỗ lực nhiều hơn và liên hệ thầy/cô để được hỗ trợ.',
      'Em cần dành nhiều thời gian hơn cho việc học, đừng nản chí nhé!',
      'Cần cải thiện nhiều kỹ năng, thầy/cô sẵn sàng hỗ trợ em tiến bộ.',
    ],
  },
};

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
