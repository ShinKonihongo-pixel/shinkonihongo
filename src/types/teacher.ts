// Teacher schedule and salary types

import type { BranchMemberRole } from './branch';

// Teaching session status
export type TeachingSessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'absent';

// Teacher schedule (recurring class assignment)
export interface TeacherSchedule {
  id: string;
  branchId: string;
  teacherId: string;               // userId of teacher
  classroomId: string;
  dayOfWeek: number;               // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string;               // HH:MM format
  endTime: string;                 // HH:MM format
  role: BranchMemberRole;          // Vai trò trong lớp này
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Form data for creating teacher schedule
export interface TeacherScheduleFormData {
  teacherId: string;
  classroomId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  role: BranchMemberRole;
}

// Teaching session (actual class taught)
export interface TeachingSession {
  id: string;
  branchId: string;
  teacherId: string;
  classroomId: string;
  scheduleId?: string;             // Reference to schedule (if from schedule)
  date: string;                    // YYYY-MM-DD
  startTime: string;               // HH:MM actual start
  endTime: string;                 // HH:MM actual end
  duration: number;                // Minutes actually taught
  status: TeachingSessionStatus;
  note?: string;
  approvedBy?: string;             // Admin who approved
  approvedAt?: string;             // ISO date
  createdAt: string;
  updatedAt: string;
}

// Form data for logging teaching session
export interface TeachingSessionFormData {
  classroomId: string;
  date: string;
  startTime: string;
  endTime: string;
  note?: string;
}

// Salary status
export type SalaryStatus = 'draft' | 'approved' | 'paid';

// Monthly salary record
export interface Salary {
  id: string;
  branchId: string;
  teacherId: string;
  month: string;                   // YYYY-MM format
  // Calculated from sessions
  totalHours: number;
  totalSessions: number;
  // Salary calculation
  hourlyRate: number;              // VND per hour
  baseSalary: number;              // totalHours * hourlyRate (or fixed monthly)
  bonus: number;                   // Thưởng
  deduction: number;               // Khấu trừ
  totalAmount: number;             // baseSalary + bonus - deduction
  // Status
  status: SalaryStatus;
  approvedAt?: string;             // ISO date when approved
  approvedBy?: string;             // Admin who approved
  paidAt?: string;                 // ISO date when paid
  paidBy?: string;                 // Admin who marked as paid
  // Notes
  note?: string;
  bonusNote?: string;
  deductionNote?: string;
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Form data for creating/updating salary
export interface SalaryFormData {
  teacherId: string;
  month: string;
  bonus?: number;
  bonusNote?: string;
  deduction?: number;
  deductionNote?: string;
  note?: string;
}

// Salary slip (for PDF export)
export interface SalarySlip extends Salary {
  teacherName: string;
  branchName: string;
  sessions: TeachingSession[];
}

// Monthly salary summary for branch
export interface MonthlySalarySummary {
  branchId: string;
  month: string;
  totalTeachers: number;
  totalHours: number;
  totalSessions: number;
  totalBaseSalary: number;
  totalBonus: number;
  totalDeduction: number;
  totalAmount: number;
  paidCount: number;
  pendingCount: number;
}

// Teacher's monthly summary
export interface TeacherMonthlySummary {
  teacherId: string;
  teacherName: string;
  month: string;
  totalHours: number;
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  absentSessions: number;
  salaryAmount?: number;
  salaryStatus?: SalaryStatus;
}

// Status labels (Vietnamese)
export const TEACHING_SESSION_STATUS_LABELS: Record<TeachingSessionStatus, string> = {
  scheduled: 'Đã lên lịch',
  completed: 'Hoàn thành',
  cancelled: 'Hủy',
  absent: 'Vắng',
};

export const TEACHING_SESSION_STATUS_COLORS: Record<TeachingSessionStatus, string> = {
  scheduled: '#3498db',
  completed: '#27ae60',
  cancelled: '#e74c3c',
  absent: '#f39c12',
};

export const SALARY_STATUS_LABELS: Record<SalaryStatus, string> = {
  draft: 'Nháp',
  approved: 'Đã duyệt',
  paid: 'Đã trả',
};

export const SALARY_STATUS_COLORS: Record<SalaryStatus, string> = {
  draft: '#95a5a6',
  approved: '#3498db',
  paid: '#27ae60',
};

// Helper: Calculate duration in minutes from start/end time
export function calculateDuration(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  return (endH * 60 + endM) - (startH * 60 + startM);
}

// Helper: Format duration as hours and minutes
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} phút`;
  if (mins === 0) return `${hours} giờ`;
  return `${hours} giờ ${mins} phút`;
}

// Helper: Format currency (VND)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}
