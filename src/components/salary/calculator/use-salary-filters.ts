// Custom hook for salary filtering and sorting logic

import { useMemo } from 'react';
import type { SalaryWithUser, FilterType, SortByType } from './types';

export function useSalaryFilters(
  salaries: SalaryWithUser[],
  filter: FilterType,
  sortBy: SortByType
) {
  return useMemo(() => {
    let result = [...salaries];

    // Filter by status
    if (filter !== 'all') {
      result = result.filter(s => s.status === filter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.teacher?.displayName || '').localeCompare(b.teacher?.displayName || '');
        case 'amount':
          return b.totalAmount - a.totalAmount;
        case 'status': {
          const statusOrder = { draft: 0, approved: 1, paid: 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        }
        default:
          return 0;
      }
    });

    return result;
  }, [salaries, filter, sortBy]);
}
