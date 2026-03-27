import { CHART_COLORS, GRID_LINE, LABEL_COLOR, smoothPath } from './chart-constants';
import { EmptyState } from './chart-empty-state';

// ─── 5. LineAreaChart ─────────────────────────────────────────────────────────
export interface LineAreaChartProps {
  data: Array<{ date: string; xp: number; streak: number }>;
  color?: string;
}

export function LineAreaChart({ data, color }: LineAreaChartProps) {
  const resolvedColor = color ?? CHART_COLORS.cyan;

  if (!data.length) return <EmptyState />;

  const W = 340;
  const H = 150;
  const PAD = { top: 12, right: 12, bottom: 28, left: 36 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const n = data.length;

  const maxXp = Math.max(...data.map(d => d.xp), 1);
  const xs = data.map((_, i) => PAD.left + (i / Math.max(n - 1, 1)) * cW);
  const ys = data.map(d => PAD.top + cH - (d.xp / maxXp) * cH);
  const pts: [number, number][] = xs.map((x, i) => [x, ys[i]]);

  const linePath = smoothPath(pts);
  const areaPath = linePath +
    ` L ${xs[n - 1]},${PAD.top + cH} L ${xs[0]},${PAD.top + cH} Z`;

  const gridLines = 3;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      <defs>
        <linearGradient id="la-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={resolvedColor} stopOpacity="0.5" />
          <stop offset="100%" stopColor={resolvedColor} stopOpacity="0.08" />
        </linearGradient>
        <filter id="la-line-glow" x="-10%" y="-100%" width="120%" height="300%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="la-dot-shadow" x="-100%" y="-100%" width="300%" height="300%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor={resolvedColor} floodOpacity="0.7" />
        </filter>
        {/* Subtle grid pattern */}
        <pattern id="la-grid-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
        </pattern>
      </defs>

      {/* Subtle grid background */}
      <rect x={PAD.left} y={PAD.top} width={cW} height={cH} fill="url(#la-grid-pattern)" />

      {/* Grid lines */}
      {Array.from({ length: gridLines + 1 }).map((_, i) => {
        const y = PAD.top + (i / gridLines) * cH;
        const val = Math.round(maxXp * (1 - i / gridLines));
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke={GRID_LINE} strokeWidth="1" />
            <text x={PAD.left - 4} y={y + 4} textAnchor="end" fill={LABEL_COLOR} fontSize="9" fontFamily="inherit">{val}</text>
          </g>
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill="url(#la-grad)" />
      {/* Line with glow */}
      <path d={linePath} fill="none" stroke={resolvedColor} strokeWidth="2.5" strokeLinecap="round" className="line-path" filter="url(#la-line-glow)" />

      {/* Dots at all points */}
      {pts.map(([x, y], i) => (
        <circle
          key={i} cx={x} cy={y} r="3"
          fill={resolvedColor}
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="1.5"
          className="chart-dot"
          filter="url(#la-dot-shadow)"
          style={{ animationDelay: `${i * 0.04}s` }}
        />
      ))}

      {/* X labels: first and last */}
      {[0, n - 1].filter(i => i < n).map(i => (
        <text key={i} x={xs[i]} y={H - PAD.bottom + 14} textAnchor="middle" fill={LABEL_COLOR} fontSize="9" fontFamily="inherit">
          {data[i].date.slice(5)}
        </text>
      ))}

      {/* Latest XP value */}
      {pts.length > 0 && (
        <text x={pts[pts.length - 1][0]} y={pts[pts.length - 1][1] - 10} textAnchor="middle" fill={resolvedColor} fontSize="10" fontFamily="inherit" fontWeight="700">
          {data[data.length - 1].xp} XP
        </text>
      )}
    </svg>
  );
}
