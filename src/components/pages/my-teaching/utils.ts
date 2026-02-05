// Helper functions for salary status
export function getSalaryStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Nháp',
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    paid: 'Đã thanh toán',
  };
  return labels[status] || status;
}

export function getSalaryStatusColor(status: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    draft: { bg: '#f5f5f5', text: '#999' },
    pending: { bg: '#fff3e0', text: '#f39c12' },
    approved: { bg: '#e3f2fd', text: '#1976d2' },
    paid: { bg: '#e8f5e9', text: '#27ae60' },
  };
  return colors[status] || colors.draft;
}

export function getSalaryStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    draft: '📝',
    pending: '⏳',
    approved: '✅',
    paid: '💰',
  };
  return icons[status] || '📝';
}

export function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const monthNames = ['', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  return `${monthNames[parseInt(month)]} ${year}`;
}
