// EmptyState — reusable empty/no-data display
// Replaces 129+ inline "Chưa có..." patterns across the codebase
// Usage:
//   <EmptyState icon={<FileText />} title="Chưa có bài học" description="Nhấn nút để thêm" />
//   <EmptyState icon={<FileText />} title="Chưa có" action={{ label: "Thêm", onClick: add }} />

import type { ReactNode } from 'react';
import './empty-state.css';

interface EmptyStateProps {
  /** Icon element (e.g., lucide icon) */
  icon?: ReactNode;
  /** Main message */
  title: string;
  /** Optional secondary text */
  description?: string;
  /** Optional CTA button */
  action?: { label: string; onClick: () => void };
  /** Compact mode (less padding, smaller text) */
  compact?: boolean;
  /** Additional CSS class */
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`es-container ${compact ? 'es-container--compact' : ''} ${className}`}>
      {icon && <div className="es-icon">{icon}</div>}
      <p className="es-title">{title}</p>
      {description && <p className="es-desc">{description}</p>}
      {action && (
        <button className="es-action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
