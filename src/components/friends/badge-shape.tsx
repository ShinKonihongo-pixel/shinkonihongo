// Badge/Shield shape SVG component for achievement badges

import { useState, useRef, useEffect } from 'react';

interface BadgeShapeProps {
  icon: string;
  color: string;
  size?: number;
  count?: number;
  name?: string;
  description?: string;
  locked?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export function BadgeShape({
  icon,
  color,
  size = 48,
  count,
  name,
  description,
  locked = false,
  showTooltip = true,
  className = '',
}: BadgeShapeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('top');
  const badgeRef = useRef<HTMLDivElement>(null);

  // Determine tooltip position based on viewport
  useEffect(() => {
    if (isHovered && badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTooltipPosition(spaceAbove < 100 ? 'bottom' : 'top');
    }
  }, [isHovered]);

  return (
    <div
      ref={badgeRef}
      className={`badge-shape-wrapper ${className} ${locked ? 'locked' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: size, height: size * 1.15 }}
    >
      <svg
        width={size}
        height={size * 1.15}
        viewBox="0 0 48 55"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="badge-shape-svg"
      >
        <defs>
          <linearGradient id={`badge-gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={locked ? '#e5e7eb' : color} />
            <stop offset="100%" stopColor={locked ? '#d1d5db' : adjustColor(color, -25)} />
          </linearGradient>
          <filter id="badge-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25" />
          </filter>
          <clipPath id="badge-clip">
            <path d="M24 0L48 12V32C48 44 36 52 24 55C12 52 0 44 0 32V12L24 0Z" />
          </clipPath>
        </defs>

        {/* Badge outline/border */}
        <path
          d="M24 2L46 13V32C46 42.5 35 49.5 24 52.5C13 49.5 2 42.5 2 32V13L24 2Z"
          fill={`url(#badge-gradient-${color.replace('#', '')})`}
          filter={!locked ? 'url(#badge-shadow)' : undefined}
          stroke={locked ? '#9ca3af' : adjustColor(color, -30)}
          strokeWidth="2"
        />

        {/* Inner shine effect */}
        {!locked && (
          <path
            d="M24 6L42 15V32C42 40 33 46 24 48.5C15 46 6 40 6 32V15L24 6Z"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
          />
        )}

        {/* Top ribbon decoration */}
        <path
          d="M12 10L24 4L36 10"
          fill="none"
          stroke={locked ? '#b0b0b0' : adjustColor(color, 20)}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {/* Icon overlay */}
      <div
        className="badge-shape-icon"
        style={{
          fontSize: size * 0.45,
          filter: locked ? 'grayscale(1) opacity(0.5)' : 'none',
        }}
      >
        {icon}
      </div>

      {/* Count badge */}
      {count !== undefined && count > 0 && !locked && (
        <div
          className="badge-shape-count"
          style={{ backgroundColor: adjustColor(color, -10) }}
        >
          {count > 99 ? '99+' : count}
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (name || description) && isHovered && (
        <div className={`badge-tooltip ${tooltipPosition}`}>
          {name && <span className="tooltip-name">{name}</span>}
          {description && <span className="tooltip-desc">{description}</span>}
          {count !== undefined && count > 0 && (
            <span className="tooltip-count">Đã nhận: ×{count}</span>
          )}
          {locked && <span className="tooltip-locked">Chưa mở khóa</span>}
        </div>
      )}
    </div>
  );
}

// Adjust color brightness
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// Mini badge shape for compact displays
interface MiniBadgeProps {
  icon: string;
  color: string;
  count?: number;
  name?: string;
}

export function MiniBadge({ icon, color, count, name }: MiniBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="mini-badge-wrapper"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <svg width="28" height="32" viewBox="0 0 28 32" fill="none">
        <path
          d="M14 1L27 7V19C27 26 19 30 14 31.5C9 30 1 26 1 19V7L14 1Z"
          fill={color}
          stroke={adjustColor(color, -30)}
          strokeWidth="1"
        />
      </svg>
      <span className="mini-badge-icon">{icon}</span>
      {count !== undefined && count > 1 && (
        <span className="mini-badge-count">{count}</span>
      )}
      {showTooltip && name && (
        <div className="mini-badge-tooltip">{name}{count ? `: ×${count}` : ''}</div>
      )}
    </div>
  );
}
