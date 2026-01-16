// Branch Overview Tab - Shows branch info, stats, and monthly summary

import type { BranchOverviewTabProps } from './branch-management-types';

export function BranchOverviewTab({ branch, stats, salarySummary, selectedMonth }: BranchOverviewTabProps) {
  const [year, month] = selectedMonth.split('-');

  return (
    <div className="tab-content-overview">
      <div className="overview-grid">
        {/* Branch Info Card */}
        <div className="card card-info">
          <h3><span className="card-icon">🏢</span> Thông tin chi nhánh</h3>
          <div className="info-list">
            <InfoRow label="Mã chi nhánh" value={branch.code} />
            <InfoRow label="Địa chỉ" value={branch.address || '-'} />
            <InfoRow label="Điện thoại" value={branch.phone || '-'} />
            <InfoRow label="Email" value={branch.email || '-'} />
            <InfoRow label="Ngày tạo" value={new Date(branch.createdAt).toLocaleDateString('vi-VN')} />
          </div>
        </div>

        {/* Stats Card */}
        <div className="card card-stats">
          <h3><span className="card-icon">📈</span> Thống kê hoạt động</h3>
          <div className="stats-grid">
            <StatBox value={stats?.totalClasses || 0} label="Lớp học" />
            <StatBox value={stats?.activeClasses || 0} label="Đang mở" active />
            <StatBox value={stats?.totalStudents || 0} label="Học viên" />
            <StatBox value={stats?.totalTeachers || 0} label="Giáo viên" />
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="card card-monthly">
          <h3><span className="card-icon">📅</span> Tóm tắt tháng {month}/{year}</h3>
          <div className="monthly-stats">
            <MonthlyItem
              label="Tổng lương"
              value={`${(salarySummary?.total || 0).toLocaleString('vi-VN')}đ`}
            />
            <MonthlyItem
              label="Đã duyệt"
              value={`${salarySummary?.approved || 0}/${salarySummary?.count || 0}`}
              variant="approved"
            />
            <MonthlyItem
              label="Đã thanh toán"
              value={`${salarySummary?.paid || 0}/${salarySummary?.count || 0}`}
              variant="paid"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper components
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-row">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
    </div>
  );
}

function StatBox({ value, label, active }: { value: number; label: string; active?: boolean }) {
  return (
    <div className={`stat-box ${active ? 'stat-active' : ''}`}>
      <span className="stat-number">{value}</span>
      <span className="stat-text">{label}</span>
    </div>
  );
}

function MonthlyItem({ label, value, variant }: { label: string; value: string; variant?: 'approved' | 'paid' }) {
  return (
    <div className="monthly-item">
      <span className="monthly-label">{label}</span>
      <span className={`monthly-value ${variant || ''}`}>{value}</span>
    </div>
  );
}
