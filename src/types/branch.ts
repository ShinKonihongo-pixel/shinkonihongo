// Branch management types

// Branch status
export type BranchStatus = 'active' | 'inactive';

// Main branch entity
export interface Branch {
  id: string;
  name: string;                    // Tên chi nhánh
  code: string;                    // Mã chi nhánh (unique, auto-generated)
  address?: string;
  phone?: string;
  email?: string;
  directorId: string;              // Giám đốc sở hữu
  status: BranchStatus;
  createdAt: string;               // ISO date
  updatedAt: string;               // ISO date
}

// Form data for creating/editing branch
export interface BranchFormData {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

// Branch member role (giáo viên trong chi nhánh)
export type BranchMemberRole = 'branch_admin' | 'main_teacher' | 'part_time_teacher' | 'assistant';

// Branch member status
export type BranchMemberStatus = 'active' | 'inactive' | 'pending';

// Salary type
export type SalaryType = 'monthly' | 'hourly';

// Salary configuration for a member
export interface SalaryConfig {
  type: SalaryType;
  amount: number;                  // VND per month or per hour
}

// Branch member (giáo viên/admin trong chi nhánh)
export interface BranchMember {
  id: string;
  branchId: string;
  userId: string;
  role: BranchMemberRole;
  salary?: SalaryConfig;
  joinedAt: string;                // ISO date
  status: BranchMemberStatus;
  note?: string;
}

// Form data for adding branch member
export interface BranchMemberFormData {
  userId?: string;                 // For existing user
  // For creating new user
  username?: string;
  displayName?: string;
  password?: string;
  role: BranchMemberRole;
  salary?: SalaryConfig;
}

// Branch statistics
export interface BranchStats {
  branchId: string;
  totalClasses: number;
  totalStudents: number;
  totalTeachers: number;
  activeClasses: number;
  monthlyRevenue?: number;
  monthlySalaryExpense?: number;
}

// Branch with additional info for display
export interface BranchWithStats extends Branch {
  stats?: BranchStats;
  adminCount: number;
  teacherCount: number;
}

// Role labels (Vietnamese)
export const BRANCH_MEMBER_ROLE_LABELS: Record<BranchMemberRole, string> = {
  branch_admin: 'Admin chi nhánh',
  main_teacher: 'Giáo viên chính',
  part_time_teacher: 'Giáo viên part-time',
  assistant: 'Trợ giảng',
};

// Role colors for UI
export const BRANCH_MEMBER_ROLE_COLORS: Record<BranchMemberRole, string> = {
  branch_admin: '#9b59b6',
  main_teacher: '#3498db',
  part_time_teacher: '#f39c12',
  assistant: '#1abc9c',
};

// Salary type labels
export const SALARY_TYPE_LABELS: Record<SalaryType, string> = {
  monthly: 'Lương tháng',
  hourly: 'Lương theo giờ',
};

// Status labels
export const BRANCH_STATUS_LABELS: Record<BranchStatus, string> = {
  active: 'Hoạt động',
  inactive: 'Tạm ngưng',
};

export const BRANCH_MEMBER_STATUS_LABELS: Record<BranchMemberStatus, string> = {
  active: 'Đang làm việc',
  inactive: 'Nghỉ việc',
  pending: 'Chờ duyệt',
};
