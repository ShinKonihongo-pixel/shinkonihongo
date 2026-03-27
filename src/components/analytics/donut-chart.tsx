import React from 'react';
import { GRID_LINE, LABEL_COLOR, VALUE_COLOR, clamp } from './chart-constants';

// ─── 6. DonutChart ────────────────────────────────────────────────────────────
export interface DonutChartProps {
  percent: number;
  label: string;
  color: string;
  size?: number;
  subtitle?: string;
}

export function DonutChart({ percent, label, color, size = 110, subtitle }: DonutChartProps) {
  const trackStroke = 10;
  const arcStroke = 14;
  const r = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const filled = (clamp(percent, 0, 100) / 100) * circ;
  const extraH = subtitle ? 30 : 18;

  return (
    <svg viewBox={`0 0 ${size} ${size + extraH}`} style={{ width: size, flexShrink: 0 }}>
      <defs>
        <linearGradient id={`donut-grad-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
        <filter id={`donut-glow-${label}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Track — slightly thinner for depth */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={GRID_LINE} strokeWidth={trackStroke} />
      {/* Arc with glow */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={`url(#donut-grad-${label})`}
        strokeWidth={arcStroke}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        strokeDashoffset={circ / 4}
        className="ring-arc"
        style={{ '--ring-circ': circ } as React.CSSProperties}
        filter={`url(#donut-glow-${label})`}
      />
      {/* Center percent */}
      <text x={cx} y={cy - 2} textAnchor="middle" fill={VALUE_COLOR} fontSize={size * 0.2} fontFamily="inherit" fontWeight="700">
        {percent}%
      </text>
      {/* Inner label */}
      <text x={cx} y={cy + size * 0.16} textAnchor="middle" fill={LABEL_COLOR} fontSize={size * 0.1} fontFamily="inherit">
        {label}
      </text>
      {/* Bottom label */}
      <text x={cx} y={size + 12} textAnchor="middle" fill={color} fontSize="10" fontFamily="inherit" fontWeight="600">
        {label}
      </text>
      {/* Optional subtitle */}
      {subtitle && (
        <text x={cx} y={size + 26} textAnchor="middle" fill={LABEL_COLOR} fontSize="9" fontFamily="inherit">
          {subtitle}
        </text>
      )}
    </svg>
  );
}
