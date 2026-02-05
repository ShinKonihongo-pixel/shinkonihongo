// Collection names and utilities for classroom services

export const COLLECTIONS = {
  CLASSROOMS: 'classrooms',
  MEMBERS: 'classroom_members',
  TESTS: 'classroom_tests',
  TEST_TEMPLATES: 'test_templates',
  TEST_FOLDERS: 'test_folders',
  SUBMISSIONS: 'classroom_submissions',
  NOTIFICATIONS: 'classroom_notifications',
  ATTENDANCE_SESSIONS: 'classroom_attendance_sessions',
  ATTENDANCE_RECORDS: 'classroom_attendance_records',
  EVALUATIONS: 'classroom_evaluations',
} as const;

export function getNowISO(): string {
  return new Date().toISOString();
}

// Generate 6-char unique classroom code
export function generateClassroomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
