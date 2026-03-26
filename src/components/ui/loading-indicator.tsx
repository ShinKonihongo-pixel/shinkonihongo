// Shared loading indicator — replaces 6+ inconsistent spinner patterns
// Supports: fullscreen (app loading), inline (page loading), compact (button/card loading)

import './loading-indicator.css';

interface LoadingIndicatorProps {
  /** Spinner size: sm (16px), md (32px), lg (48px) */
  size?: 'sm' | 'md' | 'lg';
  /** Optional label shown below spinner */
  label?: string;
  /** Full-screen centered overlay (for app/page loading) */
  fullScreen?: boolean;
  /** Inline block display (for section loading) */
  inline?: boolean;
  /** Additional CSS class */
  className?: string;
}

export function LoadingIndicator({
  size = 'md',
  label,
  fullScreen = false,
  inline = false,
  className = '',
}: LoadingIndicatorProps) {
  const spinner = (
    <div
      className={`loading-indicator loading-indicator--${size} ${inline ? 'loading-indicator--inline' : ''} ${className}`}
      role="status"
      aria-busy="true"
      aria-label={label || 'Đang tải...'}
    >
      <div className="loading-indicator__spinner" />
      {label && <span className="loading-indicator__label">{label}</span>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loading-indicator__fullscreen">
        {spinner}
      </div>
    );
  }

  return spinner;
}
