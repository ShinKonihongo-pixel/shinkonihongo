// Student Report types for PDF export feature

import type { StudentGrade, StudentAttendanceSummary, StudentEvaluation } from './classroom';

// Config for report generation
export interface StudentReportConfig {
  schoolName: string;
  schoolLogo?: string;  // base64 or URL
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  reportTitle: string;
  showAttendance: boolean;
  showGrades: boolean;
  showEvaluation: boolean;
  showSignatures: boolean;
  // Email settings
  emailServiceId?: string;
  emailTemplateId?: string;
  emailPublicKey?: string;
}

// Report data to be rendered
export interface StudentReportData {
  studentId: string;
  studentName: string;
  studentEmail?: string;
  classroomId: string;
  classroomName: string;
  level: string;
  levelLabel: string;
  periodStart: string;
  periodEnd: string;
  // Attendance data
  attendance?: StudentAttendanceSummary;
  // Grade data
  grades?: StudentGrade;
  // Evaluation data
  evaluation?: StudentEvaluation;
  // Teacher info
  teacherName: string;
  teacherId: string;
  // Metadata
  generatedAt: string;
  generatedBy: string;
}

// Report metadata for storage
export interface ReportMetadata {
  id: string;
  classroomId: string;
  studentId: string;
  studentName: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  generatedBy: string;
  downloadUrl: string;
  fileName: string;
}

// Email send request
export interface SendReportEmailRequest {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  schoolName: string;
  reportPeriod: string;
  message?: string;
  pdfBase64?: string;
  pdfUrl?: string;
}

// Default report config
export const DEFAULT_REPORT_CONFIG: StudentReportConfig = {
  schoolName: 'Trung tâm Nhật ngữ',
  reportTitle: 'PHIẾU ĐÁNH GIÁ HỌC VIÊN',
  showAttendance: true,
  showGrades: true,
  showEvaluation: true,
  showSignatures: true,
};

// Local storage key for report settings
export const REPORT_SETTINGS_STORAGE_KEY = 'student_report_settings';
