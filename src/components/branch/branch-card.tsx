// Branch card component for displaying branch info

import { useState } from 'react';
import type { Branch, BranchStats } from '../../types/branch';
import { BRANCH_STATUS_LABELS } from '../../types/branch';

export interface BranchCardProps {
  branch: Branch;
  stats?: BranchStats;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function BranchCard({ branch, stats, onClick, onEdit, onDelete }: BranchCardProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      style={{
        padding: '16px',
        borderRadius: '12px',
        background: '#fff',
        color: '#333',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        border: '1px solid #eee',
        position: 'relative',
      }}
    >
      {/* Action buttons */}
      {showActions && (onEdit || onDelete) && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          gap: '4px',
        }}>
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                border: 'none',
                background: '#f5f5f5',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              title="Chỉnh sửa"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                border: 'none',
                background: '#fff5f5',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              title="Xóa"
            >
              🗑️
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            {branch.name}
          </h3>
          <span style={{
            fontSize: '12px',
            opacity: 0.7,
            fontFamily: 'monospace',
          }}>
            {branch.code}
          </span>
        </div>
        <span style={{
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 500,
          background: branch.status === 'active' ? '#e8f5e9' : '#ffebee',
          color: branch.status === 'active' ? '#27ae60' : '#e74c3c',
        }}>
          {BRANCH_STATUS_LABELS[branch.status]}
        </span>
      </div>

      {/* Address */}
      {branch.address && (
        <p style={{
          margin: '0 0 12px 0',
          fontSize: '13px',
          opacity: 0.8,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span>📍</span>
          {branch.address}
        </p>
      )}

      {/* Stats */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid #eee',
        }}>
          <StatItem
            label="Lớp học"
            value={stats.activeClasses}
            total={stats.totalClasses}
          />
          <StatItem
            label="Học sinh"
            value={stats.totalStudents}
          />
          <StatItem
            label="Giáo viên"
            value={stats.totalTeachers}
          />
        </div>
      )}

      {/* Contact */}
      {(branch.phone || branch.email) && (
        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid #eee',
          fontSize: '12px',
          opacity: 0.8,
        }}>
          {branch.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span>📞</span>
              {branch.phone}
            </div>
          )}
          {branch.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>✉️</span>
              {branch.email}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: number;
  total?: number;
}

function StatItem({ label, value, total }: StatItemProps) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: '20px',
        fontWeight: 700,
        marginBottom: '2px',
      }}>
        {value}
        {total !== undefined && (
          <span style={{ fontSize: '12px', fontWeight: 400, opacity: 0.7 }}>
            /{total}
          </span>
        )}
      </div>
      <div style={{
        fontSize: '11px',
        opacity: 0.7,
        textTransform: 'uppercase',
      }}>
        {label}
      </div>
    </div>
  );
}
