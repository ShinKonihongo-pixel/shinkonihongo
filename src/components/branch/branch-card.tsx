// Branch card — dark glassmorphism theme, no inline styles

import { useState } from 'react';
import { MapPin, Phone, Mail, Pencil, Trash2, Users, GraduationCap, BookOpen } from 'lucide-react';
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
      className="bcard"
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Colored left accent */}
      <div className={`bcard-accent ${branch.status === 'active' ? 'active' : 'inactive'}`} />

      {/* Action buttons */}
      {showActions && (onEdit || onDelete) && (
        <div className="bcard-actions">
          {onEdit && (
            <button
              className="bcard-action-btn"
              onClick={e => { e.stopPropagation(); onEdit(); }}
              title="Chỉnh sửa"
            >
              <Pencil size={13} />
            </button>
          )}
          {onDelete && (
            <button
              className="bcard-action-btn bcard-action-danger"
              onClick={e => { e.stopPropagation(); onDelete(); }}
              title="Xóa"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}

      {/* Header: name + code + status */}
      <div className="bcard-header">
        <div className="bcard-title-group">
          <h3 className="bcard-name">{branch.name}</h3>
          <span className="bcard-code">{branch.code}</span>
        </div>
        <span className={`bcard-status ${branch.status}`}>
          {BRANCH_STATUS_LABELS[branch.status]}
        </span>
      </div>

      {/* Address */}
      {branch.address && (
        <div className="bcard-detail">
          <MapPin size={12} />
          <span>{branch.address}</span>
        </div>
      )}

      {/* Contact */}
      {branch.phone && (
        <div className="bcard-detail">
          <Phone size={12} />
          <span>{branch.phone}</span>
        </div>
      )}
      {branch.email && (
        <div className="bcard-detail">
          <Mail size={12} />
          <span>{branch.email}</span>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="bcard-stats">
          <div className="bcard-stat">
            <BookOpen size={13} />
            <span className="bcard-stat-val">{stats.activeClasses}<span className="bcard-stat-total">/{stats.totalClasses}</span></span>
            <span className="bcard-stat-label">Lớp</span>
          </div>
          <div className="bcard-stat">
            <GraduationCap size={13} />
            <span className="bcard-stat-val">{stats.totalStudents}</span>
            <span className="bcard-stat-label">Học viên</span>
          </div>
          <div className="bcard-stat">
            <Users size={13} />
            <span className="bcard-stat-val">{stats.totalTeachers}</span>
            <span className="bcard-stat-label">GV</span>
          </div>
        </div>
      )}
    </div>
  );
}
