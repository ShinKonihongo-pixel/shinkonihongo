// Type definitions for salary calculator components

import type { Salary } from '../../../types/teacher';
import type { User } from '../../../types/user';

export interface SalaryWithUser extends Salary {
  teacher?: User;
}

export interface SalaryCalculatorProps {
  salaries: SalaryWithUser[];
  summary?: MonthlySalarySummary;
  month: string;
  onMonthChange: (month: string) => void;
  onApprove?: (salary: SalaryWithUser) => void;
  onMarkPaid?: (salary: SalaryWithUser) => void;
  onEdit?: (salary: SalaryWithUser) => void;
  onRecalculate?: (salary: SalaryWithUser) => void;
  onGenerateAll?: () => void;
  loading?: boolean;
}

export interface MonthlySalarySummary {
  totalTeachers: number;
  totalHours: number;
  totalAmount: number;
  paidCount: number;
}

export type FilterType = 'all' | 'draft' | 'approved' | 'paid';
export type SortByType = 'name' | 'amount' | 'status';
