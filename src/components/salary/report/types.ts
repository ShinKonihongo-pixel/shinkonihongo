// Type definitions for salary report components

import type { Salary, MonthlySalarySummary } from '../../../types/teacher';
import type { User } from '../../../types/user';
import type { Branch } from '../../../types/branch';

export interface SalaryWithUser extends Salary {
  teacher?: User;
}

export interface SalaryReportProps {
  salaries: SalaryWithUser[];
  summary?: MonthlySalarySummary;
  branch?: Branch;
  month: string;
  onMonthChange: (month: string) => void;
  onExport?: (format: 'csv' | 'pdf') => void;
  loading?: boolean;
}

export interface SalaryMiniReportProps {
  summary?: MonthlySalarySummary;
  month: string;
  onClick?: () => void;
}

export type ViewMode = 'summary' | 'detail' | 'comparison';

export interface RoleData {
  count: number;
  totalAmount: number;
  totalHours: number;
}

export interface StatusDistribution {
  draft: number;
  approved: number;
  paid: number;
}
