// Pure SVG chart components — no external library
// Dark glassmorphism theme, fully responsive via viewBox + CSS width:100%

import './svg-charts.css';

// ─── Color palette ────────────────────────────────────────────────────────────
export const CHART_COLORS = {
  cyan:   '#06b6d4',
  purple: '#8b5cf6',
  pink:   '#ec4899',
  teal:   '#14b8a6',
  amber:  '#f59e0b',
} as const;

const GRID_LINE   = 'rgba(255,255,255,0.06)';
const LABEL_COLOR = 'rgba(255,255,255,0.55)';
const VALUE_COLOR = 'rgba(255,255,255,0.9)';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function clamp(v: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, v)); }

/** Smooth catmull-rom polyline → SVG path d attribute */
function smoothPath(points: [number, number][], closed = false): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0][0]},${points[0][1]} L ${points[1][0]},${points[1][1]}`;
  }
  let d = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
  }
  if (closed) d += ' Z';
  return d;
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ height = 160 }: { height?: number }) {
  return (
    <svg viewBox={`0 0 300 ${height}`} style={{ width: '100%' }}>
      <text x="150" y={height / 2} textAnchor="middle" fill={LABEL_COLOR} fontSize="13" fontFamily="inherit">
        Chưa có dữ liệu
      </text>
    </svg>
  );
}

// ─── 1. HorizontalBarChart ────────────────────────────────────────────────────
interface HBarItem {
  label: string;
  value: number;
  max: number;
  color?: string;
}

const LEVEL_COLORS: Record<string, string> = {
  N5: CHART_COLORS.cyan,
  N4: CHART_COLORS.teal,
  N3: CHART_COLORS.amber,
  N2: CHART_COLORS.purple,
  N1: CHART_COLORS.pink,
};

export interface HorizontalBarChartProps {
  data: Array<{ level: string; mastered: number; total: number; percent: number }>;
}

export function HorizontalBarChart({ data }: HorizontalBarChartProps) {
  if (!data.length) return <EmptyState />;

  const ROW_H = 40;
  const LABEL_W = 32;
  const PAD = 8;
  const HEIGHT = data.length * ROW_H + PAD * 2;
  const WIDTH = 300;
  const BAR_W = WIDTH - LABEL_W - 50; // 50 for percent label

  const items: HBarItem[] = data.map(d => ({
    label: d.level,
    value: d.percent,
    max: 100,
    color: LEVEL_COLORS[d.level] ?? CHART_COLORS.cyan,
  }));

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: '100%' }}>
      <defs>
        {items.map((item, i) => (
          <linearGradient key={i} id={`hbar-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={item.color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={item.color} stopOpacity="1" />
          </linearGradient>
        ))}
        {items.map((item, i) => (
          <filter key={`f${i}`} id={`hbar-glow-${i}`} x="-20%" y="-100%" width="140%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        ))}
      </defs>
      {items.map((item, i) => {
        const y = PAD + i * ROW_H;
        const barH = 14;
        const barY = y + (ROW_H - barH) / 2;
        const filled = (item.value / item.max) * BAR_W;
        return (
          <g key={i}>
            {/* Label */}
            <text x={LABEL_W - 4} y={barY + barH / 2 + 1} textAnchor="end" fill={VALUE_COLOR} fontSize="11" fontFamily="inherit" fontWeight="600">
              {item.label}
            </text>
            {/* Track */}
            <rect x={LABEL_W} y={barY} width={BAR_W} height={barH} rx="7" fill={GRID_LINE} />
            {/* Glow shadow under filled bar */}
            {filled > 0 && (
              <rect
                x={LABEL_W} y={barY + 2} width={Math.max(0, filled)} height={barH}
                rx="7"
                fill={item.color}
                opacity="0.25"
                filter={`url(#hbar-glow-${i})`}
              />
            )}
            {/* Fill */}
            <rect
              x={LABEL_W} y={barY} width={Math.max(0, filled)} height={barH} rx="7"
              fill={`url(#hbar-grad-${i})`}
              className="hbar-fill"
              style={{ transformOrigin: `${LABEL_W}px ${barY + barH / 2}px` }}
            />
            {/* Percent */}
            <text x={LABEL_W + BAR_W + 6} y={barY + barH / 2 + 4} fill={item.color} fontSize="11" fontFamily="inherit" fontWeight="700">
              {item.value}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

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
        const botPts: [number, number][] = layer.map(p => [p.x, p.yBelow]).reverse();
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
