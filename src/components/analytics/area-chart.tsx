import { CHART_COLORS, GRID_LINE, LABEL_COLOR, smoothPath } from './chart-constants';
import { EmptyState } from './chart-empty-state';

// ─── 2. AreaChart (stacked) ───────────────────────────────────────────────────
export interface AreaChartProps {
  data: Array<{ date: string; vocab: number; grammar: number; kanji: number }>;
  colors?: string[];
  labels?: string[];
}

export function AreaChart({ data, colors, labels }: AreaChartProps) {
  const resolvedColors = colors ?? [CHART_COLORS.cyan, CHART_COLORS.purple, CHART_COLORS.pink];
  const resolvedLabels = labels ?? ['Từ vựng', 'JLPT', 'Game'];

  if (!data.length) return <EmptyState />;

  const W = 400;
  const H = 160;
  const PAD = { top: 8, right: 8, bottom: 28, left: 32 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const keys: (keyof typeof data[0])[] = ['vocab', 'grammar', 'kanji'];

  // Stacked max
  const maxStack = Math.max(...data.map(d => (d.vocab + d.grammar + d.kanji)));
  const safeMax = Math.max(maxStack, 1);

  // Map to stacked polygons (bottom → top)
  const n = data.length;
  const xs = data.map((_, i) => PAD.left + (i / Math.max(n - 1, 1)) * cW);

  // Build stacked layers: each layer's y is cumulative sum
  const layers = keys.map((key, ki) => {
    return data.map((d, i) => {
      const below = keys.slice(0, ki).reduce((sum, k) => sum + (d[k] as number), 0);
      const above = below + (d[key] as number);
      const yBelow = PAD.top + cH - (below / safeMax) * cH;
      const yAbove = PAD.top + cH - (above / safeMax) * cH;
      return { x: xs[i], yAbove, yBelow };
    });
  });

  // Grid lines
  const gridLines = 4;

  // X-axis labels: show every 5 days (up to 6 labels max)
  const xLabelStep = Math.max(1, Math.floor(n / 6));
  const xLabels: number[] = [];
  for (let i = 0; i < n; i += xLabelStep) xLabels.push(i);
  if (xLabels[xLabels.length - 1] !== n - 1) xLabels.push(n - 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      <defs>
        {resolvedColors.map((color, i) => (
          <linearGradient key={i} id={`area-grad-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.7" />
            <stop offset="100%" stopColor={color} stopOpacity="0.15" />
          </linearGradient>
        ))}
        <filter id="area-line-glow" x="-10%" y="-100%" width="120%" height="300%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Grid */}
      {Array.from({ length: gridLines + 1 }).map((_, i) => {
        const y = PAD.top + (i / gridLines) * cH;
        const val = Math.round(safeMax * (1 - i / gridLines));
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke={GRID_LINE} strokeWidth="1" />
            <text x={PAD.left - 4} y={y + 4} textAnchor="end" fill={LABEL_COLOR} fontSize="9" fontFamily="inherit">{val}</text>
          </g>
        );
      })}

      {/* Area layers — drawn bottom to top, reverse order so top layer is in front */}
      {layers.map((layer, li) => {
        const topPts: [number, number][] = layer.map(p => [p.x, p.yAbove]);
        const botPts: [number, number][] = (layer.map(p => [p.x, p.yBelow]) as [number, number][]).reverse();
        const allPts = [...topPts, ...botPts];
        const polyD = allPts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ' Z';
        const lineD = smoothPath(topPts);
        const color = resolvedColors[li];
        return (
          <g key={li} className="area-layer">
            <path d={polyD} fill={`url(#area-grad-${li})`} opacity="0.7" />
            <path d={lineD} fill="none" stroke={color} strokeWidth="2" opacity="0.95" filter="url(#area-line-glow)" />
            {/* Dots on top line */}
            {topPts.map(([x, y], di) => (
              <circle key={di} cx={x} cy={y} r="2.5" fill={color} opacity="0.9" className="chart-dot" />
            ))}
          </g>
        );
      })}

      {/* X-axis labels */}
      {xLabels.map(i => (
        <text key={i} x={xs[i]} y={H - 6} textAnchor="middle" fill={LABEL_COLOR} fontSize="9" fontFamily="inherit">
          {data[i].date.slice(5)} {/* MM-DD */}
        </text>
      ))}

      {/* Legend */}
      {resolvedLabels.map((lbl, i) => (
        <g key={i} transform={`translate(${PAD.left + i * 75}, ${H - 6})`}>
          <rect x="0" y="-7" width="8" height="4" rx="2" fill={resolvedColors[i]} />
          <text x="11" y="0" fill={LABEL_COLOR} fontSize="8" fontFamily="inherit">{lbl}</text>
        </g>
      ))}
    </svg>
  );
}
