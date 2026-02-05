// Classroom services - modular re-exports
// Each service handles a specific domain for maintainability

// Shared constants and utilities
export { COLLECTIONS, getNowISO, generateClassroomCode } from './collections';

// Classroom operations
export {
  createClassroom,
  getClassroom,
  getClassroomByCode,
  updateClassroom,
  deleteClassroom,
  getClassroomsByAdmin,
  subscribeToAdminClassrooms,
  getClassroomsByUser,
  subscribeToUserClassrooms,
} from './classroom-service';

// Member management
export {
  addMember,
  removeMember,
  getMembersByClassroom,
  getMemberByUserAndClassroom,
  subscribeToMembers,
  joinByCode,
} from './member-service';

// Test/assignment operations
export {
  createTest,
  getTest,
  updateTest,
  deleteTest,
  getTestsByClassroom,
  subscribeToTests,
  publishTest,
} from './test-service';

// Submission operations
export {
  startSubmission,
  submitAnswers,
  gradeSubmission,
  getSubmissionByUserAndTest,
  getSubmissionsByTest,
  getSubmissionsByUser,
  subscribeToSubmissions,
} from './submission-service';

// Notification operations
export {
  createNotification,
  markAsRead,
  markAllAsRead,
  getUnreadNotifications,
  getAllNotifications,
  subscribeToNotifications,
  sendBulkNotifications,
} from './notification-service';

// Attendance operations
export {
  createAttendanceSession,
  getAttendanceSession,
  getAttendanceSessions,
  subscribeToAttendanceSessions,
  markAttendance,
  bulkMarkAttendance,
  getAttendanceRecord,
  getAttendanceRecordsBySession,
  getAttendanceRecordsByUser,
  subscribeToAttendanceRecords,
} from './attendance-service';

// Evaluation operations
export {
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
  sendEvaluationNotification,
  sendBulkEvaluationNotifications,
  getEvaluation,
  getEvaluationsByClassroom,
  getEvaluationsByUser,
  subscribeToEvaluations,
} from './evaluation-service';

// Test folder operations
export {
  createTestFolder,
  updateTestFolder,
  deleteTestFolder,
  getAllTestFolders,
  subscribeToTestFolders,
  getTestFoldersByLevelAndType,
} from './test-folder-service';

// Test template operations
export {
  createTestTemplate,
  updateTestTemplate,
  deleteTestTemplate,
  getTestTemplate,
  getAllTestTemplates,
  subscribeToTestTemplates,
  assignTestToClassroom,
  type TestTemplateFormData,
} from './test-template-service';
