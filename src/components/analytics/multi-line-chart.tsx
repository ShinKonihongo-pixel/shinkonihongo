import { CHART_COLORS, GRID_LINE, LABEL_COLOR, smoothPath } from './chart-constants';
import { EmptyState } from './chart-empty-state';

// ─── 4. MultiLineChart ────────────────────────────────────────────────────────
export interface MultiLineChartProps {
  data: Array<{ week: string; studyMinutes: number; gameMinutes: number; jlptMinutes: number }>;
  lines?: Array<{ key: 'studyMinutes' | 'gameMinutes' | 'jlptMinutes'; color: string; label: string }>;
}

const DEFAULT_LINES: MultiLineChartProps['lines'] = [
  { key: 'studyMinutes', color: CHART_COLORS.cyan, label: 'Học' },
  { key: 'gameMinutes', color: CHART_COLORS.amber, label: 'Game' },
  { key: 'jlptMinutes', color: CHART_COLORS.purple, label: 'JLPT' },
];

export function MultiLineChart({ data, lines }: MultiLineChartProps) {
  const resolvedLines = lines ?? DEFAULT_LINES;

  if (!resolvedLines) return null;
  if (!data.length) return <EmptyState />;

  const W = 340;
  const H = 160;
  const PAD = { top: 10, right: 12, bottom: 30, left: 32 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const n = data.length;

  const allVals = resolvedLines.flatMap(l => data.map(d => d[l.key]));
  const maxVal = Math.max(...allVals, 1);

  const xs = data.map((_, i) => PAD.left + (i / Math.max(n - 1, 1)) * cW);
  const ys = (key: 'studyMinutes' | 'gameMinutes' | 'jlptMinutes') =>
    data.map(d => PAD.top + cH - (d[key] / maxVal) * cH);

  const gridLines = 3;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      <defs>
        {resolvedLines.map((line, i) => (
          <filter key={i} id={`ml-dot-shadow-${i}`} x="-100%" y="-100%" width="300%" height="300%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor={line.color} floodOpacity="0.6" />
          </filter>
        ))}
        {resolvedLines.map((line, li) => (
          <linearGradient key={li} id={`ml-area-${li}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={line.color} stopOpacity="0.12" />
            <stop offset="100%" stopColor={line.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>

      {/* Grid */}
      {Array.from({ length: gridLines + 1 }).map((_, i) => {
        const y = PAD.top + (i / gridLines) * cH;
        const val = Math.round(maxVal * (1 - i / gridLines));
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke={GRID_LINE} strokeWidth="1" />
            <text x={PAD.left - 4} y={y + 4} textAnchor="end" fill={LABEL_COLOR} fontSize="9" fontFamily="inherit">{val}</text>
          </g>
        );
      })}

      {/* Area fills under each line */}
      {resolvedLines.map((line, li) => {
        const yArr = ys(line.key);
        const pts: [number, number][] = xs.map((x, i) => [x, yArr[i]]);
        const linePath = smoothPath(pts);
        const areaPath = linePath +
          ` L ${xs[n - 1]},${PAD.top + cH} L ${xs[0]},${PAD.top + cH} Z`;
        return (
          <path key={li} d={areaPath} fill={`url(#ml-area-${li})`} />
        );
      })}

      {/* Lines and dots */}
      {resolvedLines.map((line, li) => {
        const yArr = ys(line.key);
        const pts: [number, number][] = xs.map((x, i) => [x, yArr[i]]);
        const d = smoothPath(pts);
        return (
          <g key={line.key}>
            <path d={d} fill="none" stroke={line.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="line-path" />
            {/* Dots with white stroke and drop shadow */}
            {pts.map(([x, y], i) => (
              <circle
                key={i} cx={x} cy={y} r="4"
                fill={line.color}
                stroke="rgba(255,255,255,0.9)"
                strokeWidth="1.5"
                className="chart-dot"
                filter={`url(#ml-dot-shadow-${li})`}
                style={{ animationDelay: `${i * 0.04}s` }}
              />
            ))}
          </g>
        );
      })}

      {/* X labels */}
      {data.map((d, i) => (
        <text key={i} x={xs[i]} y={H - PAD.bottom + 14} textAnchor="middle" fill={LABEL_COLOR} fontSize="9" fontFamily="inherit">
          {d.week}
        </text>
      ))}

      {/* Legend */}
      {resolvedLines.map((line, i) => (
        <g key={line.key} transform={`translate(${PAD.left + i * 68}, ${H - 6})`}>
          <line x1="0" y1="-3" x2="10" y2="-3" stroke={line.color} strokeWidth="2" strokeLinecap="round" />
          <circle cx="5" cy="-3" r="3" fill={line.color} stroke="rgba(255,255,255,0.8)" strokeWidth="1" />
          <text x="15" y="0" fill={LABEL_COLOR} fontSize="8" fontFamily="inherit">{line.label}</text>
        </g>
      ))}
    </svg>
  );
}
