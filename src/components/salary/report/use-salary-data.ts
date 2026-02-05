// Custom hook for salary data calculations

import { useMemo } from 'react';
import type { SalaryWithUser, RoleData, StatusDistribution } from './types';

export function useSalaryData(salaries: SalaryWithUser[]) {
  // Group salaries by role
  const salaryByRole = useMemo(() => {
    const grouped: Record<string, RoleData> = {};

    salaries.forEach(salary => {
      const role = salary.teacher?.role || 'unknown';
      if (!grouped[role]) {
        grouped[role] = { count: 0, totalAmount: 0, totalHours: 0 };
      }
      grouped[role].count++;
      grouped[role].totalAmount += salary.totalAmount;
      grouped[role].totalHours += salary.totalHours;
    });

    return grouped;
  }, [salaries]);

  // Status distribution
  const statusDistribution = useMemo((): StatusDistribution => {
    return {
      draft: salaries.filter(s => s.status === 'draft').length,
      approved: salaries.filter(s => s.status === 'approved').length,
      paid: salaries.filter(s => s.status === 'paid').length,
    };
  }, [salaries]);

  // Top earners
  const topEarners = useMemo(() => {
    return [...salaries]
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);
  }, [salaries]);

  return {
    salaryByRole,
    statusDistribution,
    topEarners,
  };
}
