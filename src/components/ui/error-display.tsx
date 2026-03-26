// Shared error display component — consistent error UI across all pages
// Supports: inline (card/section), banner (page-level), compact (form field)

import { AlertTriangle, Info, AlertCircle, RefreshCw } from 'lucide-react';
import './error-display.css';

interface ErrorDisplayProps {
  /** Error message to display */
  message: string;
  /** Visual severity level */
  severity?: 'info' | 'warning' | 'error';
  /** Optional retry callback — shows retry button when provided */
  onRetry?: () => void;
  /** Compact mode for inline/form usage */
  compact?: boolean;
  /** Additional CSS class */
  className?: string;
}

const SEVERITY_ICONS = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
};

export function ErrorDisplay({
  message,
  severity = 'error',
  onRetry,
  compact = false,
  className = '',
}: ErrorDisplayProps) {
  const Icon = SEVERITY_ICONS[severity];

  return (
    <div
      className={`error-display error-display--${severity} ${compact ? 'error-display--compact' : ''} ${className}`}
      role="alert"
    >
      <Icon size={compact ? 16 : 20} className="error-display__icon" />
      <span className="error-display__message">{message}</span>
      {onRetry && (
        <button className="error-display__retry" onClick={onRetry} title="Thử lại">
          <RefreshCw size={14} />
          <span>Thử lại</span>
        </button>
      )}
    </div>
  );
}
