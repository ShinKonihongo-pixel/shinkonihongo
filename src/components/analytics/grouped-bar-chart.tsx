import { CHART_COLORS, GRID_LINE, LABEL_COLOR } from './chart-constants';
import { EmptyState } from './chart-empty-state';

// ─── 7. GroupedBarChart ───────────────────────────────────────────────────────
export interface GroupedBarChartProps {
  data: Array<{ category: string; thisMonth: number; lastMonth: number }>;
  colors?: [string, string];
  legends?: [string, string];
}

export function GroupedBarChart({ data, colors, legends }: GroupedBarChartProps) {
  const resolvedColors: [string, string] = colors ?? [CHART_COLORS.cyan, CHART_COLORS.purple];
  const resolvedLegends: [string, string] = legends ?? ['Tháng này', 'Tháng trước'];

  if (!data.length) return <EmptyState />;

  const W = 340;
  const H = 170;
  const PAD = { top: 16, right: 12, bottom: 40, left: 28 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...data.flatMap(d => [d.thisMonth, d.lastMonth]), 1);
  const n = data.length;
  const groupW = cW / n;
  const barW = Math.min(groupW * 0.35, 18);
  const gap = barW * 0.4;

  const gridLines = 3;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      <defs>
        <linearGradient id="gb-grad-0" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={resolvedColors[0]} stopOpacity="0.9" />
          <stop offset="100%" stopColor={resolvedColors[0]} stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="gb-grad-1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={resolvedColors[1]} stopOpacity="0.9" />
          <stop offset="100%" stopColor={resolvedColors[1]} stopOpacity="0.5" />
        </linearGradient>
        <filter id="gb-glow-0" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="gb-glow-1" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
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

      {/* Bars */}
      {data.map((d, i) => {
        const groupX = PAD.left + i * groupW + groupW / 2;
        const barX0 = groupX - gap / 2 - barW;
        const barX1 = groupX + gap / 2;

        const h0 = (d.thisMonth / maxVal) * cH;
        const h1 = (d.lastMonth / maxVal) * cH;
        const y0 = PAD.top + cH - h0;
        const y1 = PAD.top + cH - h1;

        return (
          <g key={i}>
            {/* Glow shadows */}
            {h0 > 2 && <rect x={barX0} y={y0 + 2} width={barW} height={Math.max(h0, 1)} rx="5" fill={resolvedColors[0]} opacity="0.2" filter="url(#gb-glow-0)" />}
            {h1 > 2 && <rect x={barX1} y={y1 + 2} width={barW} height={Math.max(h1, 1)} rx="5" fill={resolvedColors[1]} opacity="0.2" filter="url(#gb-glow-1)" />}
            {/* Bars */}
            <rect x={barX0} y={y0} width={barW} height={Math.max(h0, 1)} rx="5" fill="url(#gb-grad-0)" className="gbar-fill" />
            <rect x={barX1} y={y1} width={barW} height={Math.max(h1, 1)} rx="5" fill="url(#gb-grad-1)" className="gbar-fill" />
            {/* Value labels on top */}
            {h0 > 8 && (
              <text x={barX0 + barW / 2} y={y0 - 3} textAnchor="middle" fill={resolvedColors[0]} fontSize="8" fontFamily="inherit" fontWeight="700">
                {d.thisMonth}
              </text>
            )}
            {h1 > 8 && (
              <text x={barX1 + barW / 2} y={y1 - 3} textAnchor="middle" fill={resolvedColors[1]} fontSize="8" fontFamily="inherit" fontWeight="700">
                {d.lastMonth}
              </text>
            )}
            {/* Category label */}
            <text x={groupX} y={PAD.top + cH + 14} textAnchor="middle" fill={LABEL_COLOR} fontSize="9" fontFamily="inherit">
              {d.category}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      {resolvedLegends.map((lbl, i) => (
        <g key={i} transform={`translate(${PAD.left + i * 90}, ${H - 8})`}>
          <rect x="0" y="-7" width="8" height="8" rx="2" fill={resolvedColors[i]} />
          <text x="11" y="0" fill={LABEL_COLOR} fontSize="9" fontFamily="inherit">{lbl}</text>
        </g>
      ))}
    </svg>
  );
}
