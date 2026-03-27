// Branch List View - Shows all branches in a grid with summary stats

import { Building2 } from 'lucide-react';
import { BranchCard } from '../branch/branch-card';
import type { BranchListViewProps } from './branch-management-types';
import { EmptyState } from '../ui/empty-state';

export function BranchListView({
  branches,
  isDirector,
  onSelectBranch,
  onCreateBranch,
  onEditBranch,
  onDeleteBranch,
}: BranchListViewProps) {
  const activeCount = branches.filter(b => b.status === 'active').length;
  const inactiveCount = branches.filter(b => b.status === 'inactive').length;

  return (
    <>
      {/* Header */}
      <div className="branch-mgmt-header">
        <div className="header-title">
          <span className="jp-icon">支</span>
          <h1>Quản lý Chi nhánh</h1>
        </div>
        {isDirector && (
          <button className="btn btn-primary" onClick={onCreateBranch}>
            <span>+</span> Tạo chi nhánh
          </button>
        )}
      </div>

      {/* Summary stats */}
      <div className="branch-mgmt-stats">
        <StatCard icon="🏢" value={branches.length} label="Tổng chi nhánh" />
        <StatCard icon="✓" value={activeCount} label="Đang hoạt động" variant="success" />
        <StatCard icon="⏸" value={inactiveCount} label="Tạm ngưng" variant="warning" />
      </div>

      {/* Branch grid */}
      {branches.length === 0 ? (
        <EmptyState
          icon={<Building2 size={48} strokeWidth={1.5} />}
          title="Chưa có chi nhánh nào"
          description={isDirector ? 'Bấm "Tạo chi nhánh" để bắt đầu' : undefined}
          action={isDirector ? { label: 'Tạo chi nhánh', onClick: onCreateBranch } : undefined}
        />
      ) : (
        <div className="branch-mgmt-grid">
          {branches.map(branch => (
            <BranchCard
              key={branch.id}
              branch={branch}
              onClick={() => onSelectBranch(branch)}
              onEdit={isDirector ? () => onEditBranch(branch) : undefined}
              onDelete={isDirector ? () => onDeleteBranch(branch) : undefined}
            />
          ))}
        </div>
      )}
    </>
  );
}

// Helper component for stat cards
interface StatCardProps {
  icon: string;
  value: number;
  label: string;
  variant?: 'default' | 'success' | 'warning';
}

function StatCard({ icon, value, label, variant = 'default' }: StatCardProps) {
  return (
    <div className={`stat-card ${variant !== 'default' ? `stat-${variant}` : ''}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-info">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
}
