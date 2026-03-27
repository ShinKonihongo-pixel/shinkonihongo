import React from 'react';
import { GRID_LINE, LABEL_COLOR, VALUE_COLOR, clamp } from './chart-constants';
import { EmptyState } from './chart-empty-state';

// ─── 3. ConcentricRings ───────────────────────────────────────────────────────
export interface ConcentricRingsProps {
  data: Array<{ name: string; percent: number; color: string }>;
}

export function ConcentricRings({ data }: ConcentricRingsProps) {
  if (!data.length) return <EmptyState />;

  const RING_SIZE = 180;
  const CX = RING_SIZE / 2;
  const CY = RING_SIZE / 2;
  const BASE_R = 72;
  const GAP = 16;
  const STROKE = 12;
  const LEGEND_ROW_H = 20;
  const LEGEND_H = data.length * LEGEND_ROW_H + 8;
  const TOTAL_H = RING_SIZE + LEGEND_H;

  const avgPercent = data.length > 0
    ? Math.round(data.reduce((s, d) => s + d.percent, 0) / data.length)
    : 0;

  return (
    <svg viewBox={`0 0 ${RING_SIZE} ${TOTAL_H}`} style={{ width: '100%' }}>
      <defs>
        {data.map((item, i) => (
          <filter key={i} id={`ring-glow-${i}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        ))}
      </defs>

      {data.map((item, i) => {
        const r = BASE_R - i * GAP;
        if (r <= 0) return null;
        const circ = 2 * Math.PI * r;
        const filled = (clamp(item.percent, 0, 100) / 100) * circ;
        return (
          <g key={i}>
            {/* Track — slightly thinner for depth */}
            <circle cx={CX} cy={CY} r={r} fill="none" stroke={GRID_LINE} strokeWidth={STROKE - 2} />
            {/* Arc with glow */}
            <circle
              cx={CX} cy={CY} r={r}
              fill="none"
              stroke={item.color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${filled} ${circ}`}
              strokeDashoffset={circ / 4}
              className="ring-arc"
              style={{ '--ring-circ': circ, animationDelay: `${i * 0.15}s` } as React.CSSProperties}
              filter={`url(#ring-glow-${i})`}
            />
          </g>
        );
      })}

      {/* Center text — total average */}
      <text x={CX} y={CY - 6} textAnchor="middle" fill={VALUE_COLOR} fontSize="20" fontFamily="inherit" fontWeight="700">
        {avgPercent}%
      </text>
      <text x={CX} y={CY + 12} textAnchor="middle" fill={LABEL_COLOR} fontSize="9" fontFamily="inherit">
        Trung bình
      </text>

      {/* Legend below rings */}
      {data.map((item, i) => (
        <g key={i} transform={`translate(${RING_SIZE / 2 - 60}, ${RING_SIZE + 8 + i * LEGEND_ROW_H})`}>
          <rect x="0" y="2" width="10" height="10" rx="3" fill={item.color} opacity="0.9" />
          <text x="16" y="12" fill={item.color} fontSize="10" fontFamily="inherit" fontWeight="600">
            {item.name}
          </text>
          <text x="80" y="12" fill={VALUE_COLOR} fontSize="10" fontFamily="inherit" fontWeight="700" textAnchor="end">
            {item.percent}%
          </text>
        </g>
      ))}
    </svg>
  );
}
