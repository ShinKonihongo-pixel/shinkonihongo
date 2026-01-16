// Branch Management - Shared Types and Interfaces

import type { Branch, BranchMember, BranchMemberRole } from '../../types/branch';
import type { TeacherSchedule, TeacherScheduleFormData, Salary, TeachingSession } from '../../types/teacher';
import type { Classroom } from '../../types/classroom';
import type { User } from '../../types/user';

// View types
export type MainView = 'list' | 'detail';
export type DetailTab = 'overview' | 'teachers' | 'salaries' | 'staff' | 'settings';
export type TeacherSubTab = 'list' | 'schedule' | 'log';
export type SalarySubTab = 'calculator' | 'report' | 'slips';

// Branch stats
export interface BranchStats {
  totalClasses: number;
  activeClasses: number;
  totalStudents: number;
  totalTeachers: number;
}

// Salary summary
export interface SalarySummary {
  total: number;
  approved: number;
  paid: number;
  count: number;
}

// Teacher with user info
export type TeacherMember = BranchMember & { user?: User };

// Props interfaces
export interface BranchListViewProps {
  branches: Branch[];
  isDirector: boolean;
  onSelectBranch: (branch: Branch) => void;
  onCreateBranch: () => void;
  onEditBranch: (branch: Branch) => void;
  onDeleteBranch: (branch: Branch) => void;
}

export interface BranchOverviewTabProps {
  branch: Branch;
  stats: BranchStats | null;
  salarySummary: SalarySummary | null;
  selectedMonth: string;
}

export interface BranchTeachersTabProps {
  teachers: TeacherMember[];
  schedules: (TeacherSchedule & { classroom?: Classroom; teacher?: User })[];
  sessions: (TeachingSession & { classroom?: Classroom; teacher?: User })[];
  classrooms: Classroom[];
  users: User[];
  isAdmin: boolean;
  loading: {
    members: boolean;
    schedules: boolean;
    sessions: boolean;
  };
  onAddTeacher: () => void;
  onEditTeacher: (member: TeacherMember) => void;
  onRemoveTeacher: (memberId: string) => void;
  onAddSchedule: () => void;
  onEditSchedule: (schedule: TeacherSchedule) => void;
  onDeleteSchedule: (scheduleId: string) => void;
  onAddSession: (teacherId: string) => void;
  onApproveSession: (sessionId: string) => void;
}

export interface BranchSalariesTabProps {
  salaries: (Salary & { teacher?: User })[];
  summary: SalarySummary | null;
  branch: Branch;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  isAdmin: boolean;
  loading: boolean;
  onApprove: (salary: Salary) => void;
  onMarkPaid: (salary: Salary) => void;
  onEdit: (salary: Salary) => void;
  onRecalculate: (salary: Salary) => void;
  onGenerateAll: () => void;
  onViewSlip: (salary: Salary) => void;
}

export interface BranchStaffTabProps {
  members: TeacherMember[];
  availableUsers: User[];
  isDirector: boolean;
  loading: boolean;
  onAddAdmin: (userId: string) => void;
  onRemoveMember: (memberId: string) => void;
}

export interface BranchSettingsTabProps {
  branch: Branch;
  onToggleStatus: () => void;
  onDelete: () => void;
}
