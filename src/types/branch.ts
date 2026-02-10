// Branch management types

// Branch status
export type BranchStatus = 'active' | 'inactive';

// Center branding configuration
export interface CenterBranding {
  logo?: string;           // URL to logo image
  coverImage?: string;     // URL to cover image
  primaryColor: string;    // Hex color
  secondaryColor: string;  // Hex color
  fontFamily?: string;     // Optional custom font
}

// Main branch entity (also serves as Center)
export interface Branch {
  id: string;
  name: string;                    // Tên chi nhánh
  code: string;                    // Mã chi nhánh (unique, auto-generated)
  slug?: string;                   // URL slug for center (e.g. "sakura-center")
  address?: string;
  phone?: string;
  email?: string;
  directorId: string;              // Giám đốc sở hữu
  status: BranchStatus;
  branding?: CenterBranding;       // Center branding settings
  inviteCode?: string;             // Default invite code
  inviteEnabled?: boolean;         // Whether invite system is active
  isPublic?: boolean;              // Whether public landing page is visible
  description?: string;            // Center description for landing page
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

// Branch member role (giáo viên/học viên trong chi nhánh)
export type BranchMemberRole = 'branch_admin' | 'main_teacher' | 'part_time_teacher' | 'assistant' | 'student';

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
  joinedViaCode?: string;          // Invite code used to join
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
  student: 'Học viên',
};

// Role colors for UI
export const BRANCH_MEMBER_ROLE_COLORS: Record<BranchMemberRole, string> = {
  branch_admin: '#9b59b6',
  main_teacher: '#3498db',
  part_time_teacher: '#f39c12',
  assistant: '#1abc9c',
  student: '#2ecc71',
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

// Center invite for student enrollment
export interface CenterInvite {
  id: string;
  branchId: string;
  code: string;
  createdBy: string;
  expiresAt?: string;       // ISO date, optional expiry
  maxUses?: number;          // Optional usage limit
  useCount: number;
  isActive: boolean;
  createdAt: string;         // ISO date
}

// Default center branding
export const DEFAULT_CENTER_BRANDING: CenterBranding = {
  primaryColor: '#3b82f6',
  secondaryColor: '#8b5cf6',
};
