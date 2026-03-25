// Extended SVG chart components — premium professional chart types
// Pure SVG, dark glassmorphism theme, responsive via viewBox + CSS width:100%
// Multi-layer gradients, glass reflections, ambient glows, refined typography

import './svg-charts-extended.css';
import { CHART_COLORS } from './svg-charts';

// Shared color tokens — kept consistent with the glassmorphism palette
const GRID_LINE   = 'rgba(255,255,255,0.06)';
const GRID_LINE_2 = 'rgba(255,255,255,0.03)';
const LABEL_COLOR = 'rgba(255,255,255,0.5)';
const VALUE_COLOR = 'rgba(255,255,255,0.92)';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Clamp a value between lo and hi (inclusive). */
function clamp(v: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, v)); }

/** Convert hex color to RGB components for use in rgba() strings. */
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

/** Format numbers with K suffix for large values to keep axis labels concise. */
function formatNum(n: number) {
  if (Math.abs(n) >= 10000) return `${(n / 1000).toFixed(1)}K`;
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

/** Placeholder rendered when no data is supplied to a chart. */
function EmptyState({ height = 160 }: { height?: number }) {
  return (
    <svg viewBox={`0 0 300 ${height}`} style={{ width: '100%' }}>
      <rect x="0" y="0" width="300" height={height} rx="8" fill="rgba(255,255,255,0.02)" />
      <text x="150" y={height / 2} textAnchor="middle" fill={LABEL_COLOR} fontSize="12" fontFamily="inherit" fontWeight="500">
        Chưa có dữ liệu
      </text>
    </svg>
  );
}

// ─── Shared SVG defs for premium effects ──────────────────────────────────────
/**
 * PremiumDefs — reusable SVG filter and gradient definitions shared across charts.
 *
 * Three effects are defined here so each chart can reference them without
 * duplicating markup:
 *  - px-noise  : subtle fractal-noise texture blended in soft-light mode to add
 *                surface grain and prevent the flat digital look.
 *  - px-glass  : top-to-bottom white fade simulating a glass-pane highlight on
 *                bar/bubble surfaces.
 *  - px-ambient: radial purple glow placed behind chart content to reinforce the
 *                dark glassmorphism background color.
 */
function PremiumDefs() {
  return (
    <>
      {/* Subtle noise texture overlay — soft-light blend adds surface grain */}
      <filter id="px-noise" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
        <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
        <feBlend in="SourceGraphic" in2="grayNoise" mode="soft-light" />
      </filter>
      {/* Glass highlight for bars — bright top edge fades to transparent */}
      <linearGradient id="px-glass" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.15" />
        <stop offset="40%" stopColor="#fff" stopOpacity="0.03" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      {/* Ambient background glow — very subtle purple tint behind chart content */}
      <radialGradient id="px-ambient" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.04" />
        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
      </radialGradient>
    </>
  );
}

// ─── 1. WaterfallChart ────────────────────────────────────────────────────────
/**
 * WaterfallChart — visualizes how sequential positive/negative values
 * contribute to a cumulative total (e.g., monthly revenue deltas, cost breakdown).
 *
 * Each bar floats above/below the running total from the previous bar.
 * An optional "Total" bar anchored at zero summarizes the net result.
 * A dashed polyline traces the running total across bars for quick trend reading.
 *
 * Premium rendering: glass bars, running-total line, value pills, drop-shadow.
 */
export interface WaterfallChartProps {
  data: Array<{ label: string; value: number }>;
  positiveColor?: string;
  negativeColor?: string;
  totalColor?: string;
  showTotal?: boolean;
}

export function WaterfallChart({
  data,
  positiveColor = CHART_COLORS.teal,
  negativeColor = '#ef4444',
  totalColor = CHART_COLORS.purple,
  showTotal = true,
}: WaterfallChartProps) {
  if (!data.length) return <EmptyState />;

  const W = 400;
  const H = 220;
  const PAD = { top: 20, right: 14, bottom: 40, left: 42 };
  const cW = W - PAD.left - PAD.right; // chart content width
  const cH = H - PAD.top - PAD.bottom; // chart content height

  // Each item carries its floating start and end positions for the bar rect.
  // start = sum of all preceding values; end = start + this value.
  const items = data.map((d, i) => {
    const runningBefore = data.slice(0, i).reduce((s, x) => s + x.value, 0);
    return { ...d, start: runningBefore, end: runningBefore + d.value };
  });

  // Append a total bar that always starts at 0 (spans the full net amount)
  const totalValue = items.length > 0 ? items[items.length - 1].end : 0;
  const allItems = showTotal
    ? [...items, { label: 'Tổng', value: totalValue, start: 0, end: totalValue, isTotal: true as const }]
    : items.map(it => ({ ...it, isTotal: false as const }));

  // Include 0 in the domain so the baseline is always visible
  const allValues = allItems.flatMap(d => [d.start, d.end, 0]);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = Math.max(maxVal - minVal, 1);
  // yScale maps a data value to an SVG y-coordinate (SVG y grows downward)
  const yScale = (v: number) => PAD.top + cH - ((v - minVal) / range) * cH;

  const barCount = allItems.length;
  const groupW = cW / barCount;
  const barW = Math.min(groupW * 0.55, 30); // cap bar width for readability
  const gridLines = 4;

  // Polyline that traces the running end-value across each non-total bar
  const runningPoints = items.map((d, i) => ({
    x: PAD.left + i * groupW + groupW / 2,
    y: yScale(d.end),
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      <defs>
        <PremiumDefs />
        <linearGradient id="wf-pos" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={positiveColor} stopOpacity="1" />
          <stop offset="60%" stopColor={positiveColor} stopOpacity="0.75" />
          <stop offset="100%" stopColor={positiveColor} stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="wf-neg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={negativeColor} stopOpacity="1" />
          <stop offset="60%" stopColor={negativeColor} stopOpacity="0.75" />
          <stop offset="100%" stopColor={negativeColor} stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="wf-total" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={totalColor} stopOpacity="1" />
          <stop offset="50%" stopColor={totalColor} stopOpacity="0.8" />
          <stop offset="100%" stopColor={totalColor} stopOpacity="0.45" />
        </linearGradient>
        <filter id="wf-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="wf-shadow" x="-10%" y="-5%" width="120%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.3)" />
        </filter>
      </defs>

      {/* Ambient bg */}
      <rect x="0" y="0" width={W} height={H} fill="url(#px-ambient)" />

      {/* Grid — alternating subtle bands improve readability across many bars */}
      {Array.from({ length: gridLines + 1 }).map((_, i) => {
        const y = PAD.top + (i / gridLines) * cH;
        const val = Math.round(maxVal - (i / gridLines) * range);
        return (
          <g key={i}>
            {i < gridLines && <rect x={PAD.left} y={y} width={cW} height={cH / gridLines} fill={i % 2 === 0 ? GRID_LINE_2 : 'transparent'} />}
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke={GRID_LINE} strokeWidth="1" />
            <text x={PAD.left - 6} y={y + 3} textAnchor="end" fill={LABEL_COLOR} fontSize="8" fontFamily="inherit" fontWeight="500">{formatNum(val)}</text>
          </g>
        );
      })}

      {/* Zero line — only shown when data spans both positive and negative */}
      {minVal < 0 && maxVal > 0 && (
        <line x1={PAD.left} y1={yScale(0)} x2={W - PAD.right} y2={yScale(0)} stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="6,3" />
      )}

      {/* Running total line — dashed ghost trace connecting each bar's end value */}
      {runningPoints.length > 1 && (
        <polyline
          points={runningPoints.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1.5"
          strokeDasharray="4,4"
          className="wf-line"
        />
      )}

      {/* Bars + connectors */}
      {allItems.map((d, i) => {
        const x = PAD.left + i * groupW + (groupW - barW) / 2;
        const isTotal = 'isTotal' in d && d.isTotal;
        const isPositive = d.value >= 0;
        // Bar rect: top is the higher of start/end, height is the absolute delta
        const yTop = yScale(Math.max(d.start, d.end));
        const yBot = yScale(Math.min(d.start, d.end));
        const barH = Math.max(yBot - yTop, 3); // min 3px so tiny values remain visible
        const fill = isTotal ? 'url(#wf-total)' : isPositive ? 'url(#wf-pos)' : 'url(#wf-neg)';
        const color = isTotal ? totalColor : isPositive ? positiveColor : negativeColor;

        return (
          <g key={i}>
            {/* Connector line from previous bar's end value to this bar's start */}
            {i > 0 && !isTotal && (
              <line
                x1={PAD.left + (i - 1) * groupW + (groupW + barW) / 2}
                y1={yScale(d.start)}
                x2={x}
                y2={yScale(d.start)}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
                strokeDasharray="3,2"
              />
            )}
            {/* Glow shadow rendered behind the bar for depth */}
            <rect x={x} y={yTop + 2} width={barW} height={barH} rx="5" fill={color} opacity="0.2" filter="url(#wf-glow)" />
            {/* Main bar */}
            <rect x={x} y={yTop} width={barW} height={barH} rx="5" fill={fill} className="wf-bar" style={{ animationDelay: `${i * 0.08}s` }} filter="url(#wf-shadow)" />
            {/* Glass highlight — top-half white fade for gloss effect */}
            <rect x={x} y={yTop} width={barW} height={barH / 2} rx="5" fill="url(#px-glass)" className="wf-bar" style={{ animationDelay: `${i * 0.08}s` }} />
            {/* Value pill — shows signed delta; total bar shows absolute value */}
            <g className="wf-value-pill" style={{ animationDelay: `${i * 0.08 + 0.3}s` } as React.CSSProperties}>
              <rect x={x + barW / 2 - 16} y={yTop - 18} width="32" height="14" rx="7" fill={color} opacity="0.2" />
              <text x={x + barW / 2} y={yTop - 8} textAnchor="middle" fill={color} fontSize="8" fontFamily="inherit" fontWeight="700">
                {isTotal ? formatNum(d.value) : (isPositive ? '+' : '') + formatNum(d.value)}
              </text>
            </g>
            {/* X label — total bar uses accent color to stand out */}
            <text x={x + barW / 2} y={H - PAD.bottom + 16} textAnchor="middle" fill={isTotal ? totalColor : LABEL_COLOR} fontSize="8" fontFamily="inherit" fontWeight={isTotal ? '700' : '500'}>
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── 2. HeatmapChart ─────────────────────────────────────────────────────────
/**
 * HeatmapChart — renders a 2D matrix where cell opacity encodes value intensity.
 * Suitable for activity grids (e.g., study sessions by day/hour), confusion matrices.
 *
 * Cell color is derived by scaling the theme color's opacity against the max value.
 * Cells above 70% intensity receive an extra glow filter to draw the eye.
 * A gradient legend bar at the bottom maps low→high intensity.
 *
 * Premium rendering: inner shadow cells, glow on hot values, gradient legend bar.
 */
export interface HeatmapChartProps {
  data: Array<{ row: string; col: string; value: number }>;
  rowLabels: string[];
  colLabels: string[];
  color?: string;
  emptyColor?: string;
}

export function HeatmapChart({
  data,
  rowLabels,
  colLabels,
  color = CHART_COLORS.purple,
  emptyColor = 'rgba(255,255,255,0.02)',
}: HeatmapChartProps) {
  if (!data.length) return <EmptyState />;

  const CELL_SIZE = 30;
  const GAP = 3;
  const ROW_LABEL_W = 40;
  const COL_LABEL_H = 22;
  const PAD = 10;

  // SVG dimensions scale with the number of rows/cols
  const W = ROW_LABEL_W + colLabels.length * (CELL_SIZE + GAP) + PAD;
  const H = COL_LABEL_H + rowLabels.length * (CELL_SIZE + GAP) + PAD + 26; // +26 for legend

  const maxVal = Math.max(...data.map(d => d.value), 1);
  // Pre-build a lookup map to avoid O(n) search per cell during render
  const valueMap = new Map<string, number>();
  data.forEach(d => valueMap.set(`${d.row}|${d.col}`, d.value));

  // Decompose hex color once; used for per-cell rgba() construction
  const rgb = hexToRgb(color);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      <defs>
        <PremiumDefs />
        {/* Cell glow for high-intensity cells */}
        <filter id="hm-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        {/* Cell inner highlight — diagonal gradient gives a faceted look */}
        <linearGradient id="hm-cell-glass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="50%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.08" />
        </linearGradient>
        {/* Legend gradient bar — left=low, right=high */}
        <linearGradient id="hm-legend-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.1" />
          <stop offset="50%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0.95" />
        </linearGradient>
      </defs>

      {/* Ambient bg */}
      <rect x="0" y="0" width={W} height={H} fill="url(#px-ambient)" />

      {/* Column labels */}
      {colLabels.map((label, ci) => (
        <text
          key={`cl-${ci}`}
          x={ROW_LABEL_W + ci * (CELL_SIZE + GAP) + CELL_SIZE / 2}
          y={COL_LABEL_H - 6}
          textAnchor="middle"
          fill={LABEL_COLOR}
          fontSize="8"
          fontFamily="inherit"
          fontWeight="600"
        >
          {label}
        </text>
      ))}

      {/* Rows */}
      {rowLabels.map((rowLabel, ri) => (
        <g key={`r-${ri}`}>
          <text
            x={ROW_LABEL_W - 6}
            y={COL_LABEL_H + ri * (CELL_SIZE + GAP) + CELL_SIZE / 2 + 3}
            textAnchor="end"
            fill={LABEL_COLOR}
            fontSize="8"
            fontFamily="inherit"
            fontWeight="500"
          >
            {rowLabel}
          </text>
          {colLabels.map((colLabel, ci) => {
            const val = valueMap.get(`${rowLabel}|${colLabel}`) ?? 0;
            // Normalize 0–1 against the dataset max
            const intensity = val / maxVal;
            const cellX = ROW_LABEL_W + ci * (CELL_SIZE + GAP);
            const cellY = COL_LABEL_H + ri * (CELL_SIZE + GAP);
            // Cells above 70% intensity receive a glow halo to highlight hot spots
            const isHot = intensity > 0.7;

            return (
              <g key={`c-${ri}-${ci}`}>
                {/* Glow halo rendered behind hot cells */}
                {isHot && (
                  <rect
                    x={cellX - 1} y={cellY - 1}
                    width={CELL_SIZE + 2} height={CELL_SIZE + 2}
                    rx="6" fill={color} opacity={intensity * 0.15}
                    filter="url(#hm-glow)"
                  />
                )}
                {/* Cell background — opacity scales with intensity, clamped to avoid
                    invisible (< 0.08) or fully opaque (> 0.92) extremes */}
                <rect
                  x={cellX} y={cellY}
                  width={CELL_SIZE} height={CELL_SIZE}
                  rx="5"
                  fill={val > 0 ? `rgba(${rgb.r},${rgb.g},${rgb.b},${clamp(intensity * 0.85 + 0.08, 0.08, 0.92)})` : emptyColor}
                  stroke={val > 0 ? `rgba(${rgb.r},${rgb.g},${rgb.b},${clamp(intensity * 0.3, 0.05, 0.3)})` : 'rgba(255,255,255,0.03)'}
                  strokeWidth="0.5"
                  className="heatmap-cell"
                  style={{ animationDelay: `${(ri * colLabels.length + ci) * 0.015}s` }}
                />
                {/* Glass overlay — top-half diagonal shine for non-empty cells */}
                {val > 0 && (
                  <rect
                    x={cellX} y={cellY}
                    width={CELL_SIZE} height={CELL_SIZE / 2}
                    rx="5"
                    fill="url(#hm-cell-glass)"
                    pointerEvents="none"
                    className="heatmap-cell"
                    style={{ animationDelay: `${(ri * colLabels.length + ci) * 0.015}s` }}
                  />
                )}
                {/* Value text — only shown when cells are large enough to fit */}
                {val > 0 && CELL_SIZE >= 26 && (
                  <text
                    x={cellX + CELL_SIZE / 2}
                    y={cellY + CELL_SIZE / 2 + 3}
                    textAnchor="middle"
                    // High-intensity cells get near-white text; low-intensity get dimmer
                    fill={intensity > 0.45 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)'}
                    fontSize="9"
                    fontFamily="inherit"
                    fontWeight="700"
                  >
                    {val}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      ))}

      {/* Gradient legend bar — anchored at the bottom of the chart */}
      <g transform={`translate(${ROW_LABEL_W}, ${H - 20})`}>
        <text x="0" y="9" fill={LABEL_COLOR} fontSize="7" fontFamily="inherit" fontWeight="500">Ít</text>
        <rect x="16" y="1" width="80" height="10" rx="5" fill="url(#hm-legend-grad)" />
        <rect x="16" y="1" width="80" height="5" rx="3" fill="url(#px-glass)" />
        <text x="100" y="9" fill={LABEL_COLOR} fontSize="7" fontFamily="inherit" fontWeight="500">Nhiều</text>
      </g>
    </svg>
  );
}

// ─── 3. GaugeChart ────────────────────────────────────────────────────────────
/**
 * GaugeChart — half-dial KPI meter showing a single percentage value (0–100).
 * Use cases: completion rates, score summaries, target attainment.
 *
 * Arc math overview:
 *  - The gauge spans 270° of arc, starting at 225° (lower-left) and sweeping
 *    counter-clockwise toward 315° (lower-right) through the top of the circle.
 *  - Angles follow SVG convention where 0° = right, increasing clockwise.
 *    However, `arcPoint()` negates the y component so angles increase
 *    counter-clockwise in visual space (standard math convention).
 *  - `startAngle` (225°) sits in the lower-left quadrant.
 *  - `endAngle` decreases from startAngle as the value grows, sweeping toward 315°.
 *  - `largeArc` flag = 1 when the sweep exceeds 180°; the SVG arc command needs
 *    this to choose the correct of the two possible arcs.
 *  - The colored zone segments (red/amber/green) are drawn as separate arc paths
 *    at low opacity to show threshold context behind the value arc.
 *
 * Color resolves automatically from thresholds unless explicitly overridden.
 *
 * Premium rendering: multi-zone track, glass ring, pulsing dot, inner shadow.
 */
export interface GaugeChartProps {
  value: number;
  label?: string;
  unit?: string;
  color?: string;
  thresholds?: { good: number; warn: number };
}

export function GaugeChart({
  value,
  label = '',
  unit = '%',
  color,
  thresholds = { good: 70, warn: 40 },
}: GaugeChartProps) {
  const SIZE = 220;
  const CX = SIZE / 2;
  // CY is offset downward so the half-dial fits visually in the square viewBox
  const CY = SIZE / 2 + 8;
  const R = 78;         // arc radius
  const STROKE = 14;    // track stroke width
  const INNER_R = R - STROKE / 2 - 8; // radius for inner shadow circle

  const clamped = clamp(value, 0, 100);
  const startAngle = 225; // degrees — lower-left start of the gauge arc
  const totalSweep = 270; // degrees — full-scale arc span

  // endAngle decreases from startAngle as value grows (counter-clockwise sweep)
  const endAngle = startAngle - (clamped / 100) * totalSweep;

  /** Convert degrees to radians. */
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  /**
   * Return the SVG (x, y) point on the arc at the given angle.
   * Standard math: x = cx + r·cos(θ), y = cy - r·sin(θ)
   * The minus on y converts math angles (CCW positive) to SVG (CW positive).
   */
  const arcPoint = (angle: number, r = R) => ({
    x: CX + r * Math.cos(toRad(angle)),
    y: CY - r * Math.sin(toRad(angle)),
  });

  const start = arcPoint(startAngle);
  const end = arcPoint(endAngle);
  const sweepDeg = (clamped / 100) * totalSweep;
  // largeArc flag: SVG needs 1 when the arc subtends more than 180°
  const largeArc = sweepDeg > 180 ? 1 : 0;

  // Full track path (used for the gray background arc)
  const trackEnd = arcPoint(startAngle - totalSweep);
  const trackPath = `M ${start.x},${start.y} A ${R},${R} 0 1 0 ${trackEnd.x},${trackEnd.y}`;

  // Arc length in SVG units — used for stroke-dasharray CSS animation
  const arcLength = (clamped / 100) * totalSweep * (Math.PI / 180) * R;
  const fullArcLength = totalSweep * (Math.PI / 180) * R;

  // Value arc path — empty string when value is effectively 0
  const valuePath = clamped < 0.1
    ? ''
    : clamped >= 99.9
      ? trackPath                                                                      // reuse full track at 100%
      : `M ${start.x},${start.y} A ${R},${R} 0 ${largeArc} 0 ${end.x},${end.y}`;

  // Auto-resolve color from thresholds when no explicit color is provided
  const resolvedColor = color ?? (clamped >= thresholds.good ? CHART_COLORS.teal : clamped >= thresholds.warn ? CHART_COLORS.amber : '#ef4444');
  const colorRgb = hexToRgb(resolvedColor);

  // Major tick positions (evenly spaced across the 0–100 range)
  const ticks = [0, 25, 50, 75, 100];

  /**
   * Build an SVG arc path for a colored zone segment.
   * @param from - percentage start of the zone (0–100)
   * @param to   - percentage end of the zone (0–100)
   */
  const zoneArc = (from: number, to: number) => {
    const s = arcPoint(startAngle - (from / 100) * totalSweep);
    const e = arcPoint(startAngle - (to / 100) * totalSweep);
    const sweep = ((to - from) / 100) * totalSweep;
    const la = sweep > 180 ? 1 : 0;
    return `M ${s.x},${s.y} A ${R},${R} 0 ${la} 0 ${e.x},${e.y}`;
  };

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: '100%', maxWidth: 220 }}>
      <defs>
        <PremiumDefs />
        <linearGradient id="gauge-val-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={resolvedColor} stopOpacity="0.7" />
          <stop offset="100%" stopColor={resolvedColor} stopOpacity="1" />
        </linearGradient>
        <filter id="gauge-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="gauge-inner-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="rgba(0,0,0,0.4)" />
        </filter>
        {/* Center gradient — subtle colored tint behind the large value number */}
        <radialGradient id="gauge-center-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={resolvedColor} stopOpacity="0.08" />
          <stop offset="100%" stopColor={resolvedColor} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient */}
      <rect x="0" y="0" width={SIZE} height={SIZE} fill="url(#px-ambient)" />

      {/* Inner shadow circle — adds depth inside the gauge bowl */}
      <circle cx={CX} cy={CY} r={INNER_R} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" filter="url(#gauge-inner-shadow)" />

      {/* Colored zone track segments (very low opacity) — give threshold context */}
      <path d={zoneArc(0, thresholds.warn)} fill="none" stroke="rgba(239,68,68,0.08)" strokeWidth={STROKE} strokeLinecap="round" />
      <path d={zoneArc(thresholds.warn, thresholds.good)} fill="none" stroke="rgba(245,158,11,0.08)" strokeWidth={STROKE} strokeLinecap="round" />
      <path d={zoneArc(thresholds.good, 100)} fill="none" stroke="rgba(20,184,166,0.08)" strokeWidth={STROKE} strokeLinecap="round" />

      {/* Main gray track — base ring the value arc paints over */}
      <path d={trackPath} fill="none" stroke={GRID_LINE} strokeWidth={STROKE} strokeLinecap="round" />

      {/* Major tick marks and labels at 0 / 25 / 50 / 75 / 100 */}
      {ticks.map(t => {
        const angle = startAngle - (t / 100) * totalSweep;
        const tickR = R + STROKE / 2;
        const inner = arcPoint(angle, tickR - 2);
        const outer = arcPoint(angle, tickR + 6);
        const labelPt = arcPoint(angle, tickR + 16);
        return (
          <g key={t}>
            <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" />
            <text x={labelPt.x} y={labelPt.y + 3} textAnchor="middle" fill={LABEL_COLOR} fontSize="7" fontFamily="inherit" fontWeight="600">{t}</text>
          </g>
        );
      })}

      {/* Minor ticks at 12.5 intervals between major ticks */}
      {[12.5, 37.5, 62.5, 87.5].map(t => {
        const angle = startAngle - (t / 100) * totalSweep;
        const tickR = R + STROKE / 2;
        const inner = arcPoint(angle, tickR - 1);
        const outer = arcPoint(angle, tickR + 3);
        return <line key={t} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
      })}

      {/* Value arc — glow layer (wider, low opacity) drawn first for bloom */}
      {valuePath && <path d={valuePath} fill="none" stroke={resolvedColor} strokeWidth={STROKE + 6} strokeLinecap="round" opacity="0.15" filter="url(#gauge-glow)" />}
      {/* Value arc — main colored stroke; CSS animation uses --gauge-len for draw-on */}
      {valuePath && (
        <path
          d={valuePath} fill="none" stroke="url(#gauge-val-grad)" strokeWidth={STROKE} strokeLinecap="round"
          className="gauge-arc"
          style={{ '--gauge-len': `${clamped >= 99.9 ? fullArcLength : arcLength}` } as React.CSSProperties}
        />
      )}
      {/* Value arc — glass highlight on top half for gloss effect */}
      {valuePath && (
        <path d={valuePath} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={STROKE / 2} strokeLinecap="round"
          className="gauge-arc"
          style={{ '--gauge-len': `${clamped >= 99.9 ? fullArcLength : arcLength}` } as React.CSSProperties}
          transform={`translate(0, -${STROKE / 4})`}
        />
      )}

      {/* Needle dot — marks the exact value position on the arc */}
      <circle cx={end.x} cy={end.y} r={9} fill={`rgba(${colorRgb.r},${colorRgb.g},${colorRgb.b},0.15)`} className="gauge-dot-ring" />
      <circle cx={end.x} cy={end.y} r={5} fill={resolvedColor} className="gauge-dot" />
      <circle cx={end.x} cy={end.y} r={2} fill="#fff" opacity="0.5" className="gauge-dot" />

      {/* Center value display */}
      <circle cx={CX} cy={CY} r={36} fill="url(#gauge-center-bg)" />
      <text x={CX} y={CY - 4} textAnchor="middle" fill={VALUE_COLOR} fontSize="30" fontFamily="inherit" fontWeight="800" letterSpacing="-1">
        {Math.round(clamped)}
      </text>
      <text x={CX} y={CY + 12} textAnchor="middle" fill={resolvedColor} fontSize="10" fontFamily="inherit" fontWeight="600" opacity="0.8">
        {unit}
      </text>

      {/* Optional descriptive label below the dial */}
      {label && (
        <text x={CX} y={CY + 38} textAnchor="middle" fill={LABEL_COLOR} fontSize="10" fontFamily="inherit" fontWeight="600">
          {label}
        </text>
      )}
    </svg>
  );
}

// ─── 4. BubbleChart ───────────────────────────────────────────────────────────
/**
 * BubbleChart — plots data points as circles on an (x, y) scatter plane where
 * the bubble radius encodes a third dimension (size / magnitude).
 * Use cases: comparing students by score (x) vs sessions (y) vs vocabulary size (radius).
 *
 * Rendering strategy — bubbles sorted largest-to-smallest:
 *   Large bubbles are drawn first so smaller ones are never fully hidden behind them.
 *   `origIdx` is preserved through the sort so color assignment stays consistent
 *   with the original data order (color maps to data identity, not render order).
 *
 * The glass highlight ellipse is offset to the upper-left of center (cx - r*0.15,
 * cy - r*0.2) to simulate light coming from the top-left — matching the
 * glassmorphism theme convention used throughout the app.
 *
 * Premium rendering: glass-reflective bubbles, value tooltips, gradient crosshair grid.
 */
export interface BubbleChartProps {
  data: Array<{ x: number; y: number; size: number; label?: string; color?: string }>;
  xLabel?: string;
  yLabel?: string;
  colors?: string[];
}

export function BubbleChart({
  data,
  xLabel = '',
  yLabel = '',
  colors = [CHART_COLORS.cyan, CHART_COLORS.purple, CHART_COLORS.pink, CHART_COLORS.teal, CHART_COLORS.amber],
}: BubbleChartProps) {
  if (!data.length) return <EmptyState />;

  const W = 420;
  const H = 260;
  const PAD = { top: 18, right: 22, bottom: 36, left: 44 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  // Compute domain extents for both axes and the size dimension
  const xMin = Math.min(...data.map(d => d.x));
  const xMax = Math.max(...data.map(d => d.x));
  const yMin = Math.min(...data.map(d => d.y));
  const yMax = Math.max(...data.map(d => d.y));
  const sMax = Math.max(...data.map(d => d.size), 1);
  const xRange = Math.max(xMax - xMin, 1);
  const yRange = Math.max(yMax - yMin, 1);

  // Linear scale functions mapping data values to SVG pixel coordinates
  const scaleX = (v: number) => PAD.left + ((v - xMin) / xRange) * cW;
  const scaleY = (v: number) => PAD.top + cH - ((v - yMin) / yRange) * cH; // inverted: larger y → higher on screen
  // Radius clamped to [5, 24]px so tiny/huge outliers don't break the layout
  const scaleR = (v: number) => clamp((v / sMax) * 20, 5, 24);

  const gridLines = 4;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      <defs>
        <PremiumDefs />
        {/* Per-color radial gradients — simulate 3D sphere shading.
            The highlight stop is brightened (+40 to each channel) and positioned
            at 30% cx/cy to mimic a top-left light source. */}
        {colors.map((c, i) => {
          const { r, g, b } = hexToRgb(c);
          return (
            <radialGradient key={i} id={`bubble-grad-${i}`} cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor={`rgba(${r + 40},${g + 40},${b + 40},0.95)`} />
              <stop offset="50%" stopColor={c} stopOpacity="0.7" />
              <stop offset="100%" stopColor={c} stopOpacity="0.35" />
            </radialGradient>
          );
        })}
        <filter id="bubble-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <filter id="bubble-shadow" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.3)" />
        </filter>
        {/* Glass reflection — radial gradient offset toward upper-left to simulate a specular highlight */}
        <radialGradient id="bubble-glass" cx="35%" cy="25%" r="40%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient */}
      <rect x="0" y="0" width={W} height={H} fill="url(#px-ambient)" />

      {/* Y axis grid lines */}
      {Array.from({ length: gridLines + 1 }).map((_, i) => {
        const y = PAD.top + (i / gridLines) * cH;
        const val = Math.round(yMax - (i / gridLines) * yRange);
        return (
          <g key={`yg-${i}`}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke={GRID_LINE} strokeWidth="1" />
            <text x={PAD.left - 6} y={y + 3} textAnchor="end" fill={LABEL_COLOR} fontSize="8" fontFamily="inherit" fontWeight="500">{val}</text>
          </g>
        );
      })}

      {/* X axis grid lines */}
      {Array.from({ length: gridLines + 1 }).map((_, i) => {
        const x = PAD.left + (i / gridLines) * cW;
        const val = Math.round(xMin + (i / gridLines) * xRange);
        return (
          <g key={`xg-${i}`}>
            <line x1={x} y1={PAD.top} x2={x} y2={PAD.top + cH} stroke={GRID_LINE} strokeWidth="1" />
            <text x={x} y={H - PAD.bottom + 16} textAnchor="middle" fill={LABEL_COLOR} fontSize="8" fontFamily="inherit" fontWeight="500">{val}</text>
          </g>
        );
      })}

      {/* Chart border */}
      <rect x={PAD.left} y={PAD.top} width={cW} height={cH} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" rx="2" />

      {/* Axis labels with pill backgrounds */}
      {xLabel && (
        <g>
          <rect x={W / 2 - 30} y={H - 12} width="60" height="12" rx="6" fill="rgba(255,255,255,0.04)" />
          <text x={W / 2} y={H - 3} textAnchor="middle" fill={LABEL_COLOR} fontSize="8" fontFamily="inherit" fontWeight="600">{xLabel}</text>
        </g>
      )}
      {yLabel && (
        <text x={10} y={H / 2} textAnchor="middle" fill={LABEL_COLOR} fontSize="8" fontFamily="inherit" fontWeight="600" transform={`rotate(-90, 10, ${H / 2})`}>{yLabel}</text>
      )}

      {/* Bubbles — sorted largest-first so smaller bubbles render on top.
          origIdx is carried through the sort to keep color stable per data point. */}
      {data.map((d, origIdx) => ({ ...d, origIdx })).sort((a, b) => b.size - a.size).map((d, renderIdx) => {
        const cx = scaleX(d.x);
        const cy = scaleY(d.y);
        const r = scaleR(d.size);
        // Color cycles through the palette using the original data index (not render index)
        const colorIdx = d.origIdx % colors.length;
        const bubbleColor = d.color ?? colors[colorIdx];
        return (
          <g key={d.origIdx}>
            {/* Drop shadow offset downward to simulate light from above */}
            <circle cx={cx} cy={cy + 2} r={r} fill="rgba(0,0,0,0.2)" filter="url(#bubble-shadow)" />
            {/* Glow halo — larger, very transparent bloom around the bubble */}
            <circle cx={cx} cy={cy} r={r + 3} fill={bubbleColor} opacity="0.1" filter="url(#bubble-glow)" />
            {/* Main bubble — uses per-color radial gradient for custom colors; solid color as fallback */}
            <circle
              cx={cx} cy={cy} r={r}
              fill={d.color ? bubbleColor : `url(#bubble-grad-${colorIdx})`}
              stroke={bubbleColor}
              strokeWidth="1.5"
              strokeOpacity="0.4"
              className="bubble-circle"
              style={{ animationDelay: `${renderIdx * 0.06}s` }}
            />
            {/* Glass reflection ellipse — offset upper-left to simulate top-left light source */}
            <ellipse
              cx={cx - r * 0.15} cy={cy - r * 0.2}
              rx={r * 0.55} ry={r * 0.4}
              fill="url(#bubble-glass)"
              pointerEvents="none"
              className="bubble-circle"
              style={{ animationDelay: `${renderIdx * 0.06}s` }}
            />
            {/* Label tooltip pill — only shown when bubble is large enough to read */}
            {d.label && r >= 8 && (
              <g className="bubble-label" style={{ animationDelay: `${renderIdx * 0.06 + 0.3}s` } as React.CSSProperties}>
                <rect x={cx - 14} y={cy - r - 16} width="28" height="12" rx="6" fill="rgba(0,0,0,0.5)" />
                <text x={cx} y={cy - r - 7} textAnchor="middle" fill="#fff" fontSize="7" fontFamily="inherit" fontWeight="600">
                  {d.label}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── 5. FunnelChart ───────────────────────────────────────────────────────────
/**
 * FunnelChart — shows how a population drops off across sequential stages
 * (e.g., enrollment → active → passed → certified).
 *
 * Each stage is a centered trapezoid whose top width = current stage proportion
 * and bottom width = next stage proportion, creating a narrowing funnel shape.
 * The last stage uses 65% of its own width as the "next" width to maintain
 * visible geometry even when no following stage exists.
 *
 * Drop-off pills between stages show the percentage lost at each transition,
 * helping teachers identify which step loses the most students.
 *
 * Premium rendering: rounded trapezoids, side accent lines, animated drop-off arrows.
 */
export interface FunnelChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  colors?: string[];
}

export function FunnelChart({
  data,
  colors = [CHART_COLORS.cyan, CHART_COLORS.teal, CHART_COLORS.amber, CHART_COLORS.purple, CHART_COLORS.pink],
}: FunnelChartProps) {
  if (!data.length) return <EmptyState />;

  const W = 360;
  const STAGE_H = 44;
  const GAP = 6;
  const H = data.length * (STAGE_H + GAP) + 28;
  const MAX_BAR_W = 290; // maximum width of the widest (first) stage
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      <defs>
        <PremiumDefs />
        {/* Horizontal gradient — left edge brighter, right edge dimmer for 3D look */}
        {colors.map((c, i) => (
          <linearGradient key={i} id={`funnel-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={c} stopOpacity="0.9" />
            <stop offset="50%" stopColor={c} stopOpacity="0.7" />
            <stop offset="100%" stopColor={c} stopOpacity="0.45" />
          </linearGradient>
        ))}
        {/* Top-to-bottom glass sheen per stage */}
        {colors.map((c, i) => (
          <linearGradient key={`fg-${i}`} id={`funnel-glass-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.12" />
            <stop offset="50%" stopColor="#fff" stopOpacity="0.02" />
            <stop offset="100%" stopColor={c} stopOpacity="0.05" />
          </linearGradient>
        ))}
        <filter id="funnel-glow" x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="funnel-shadow" x="-5%" y="-5%" width="110%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.25)" />
        </filter>
      </defs>

      {/* Ambient */}
      <rect x="0" y="0" width={W} height={H} fill="url(#px-ambient)" />

      {/* Vertical center guide line — subtle dashed reference axis */}
      <line x1={W / 2} y1="4" x2={W / 2} y2={H - 4} stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="2,4" />

      {data.map((d, i) => {
        // barW = proportion of MAX_BAR_W for this stage
        const barW = (d.value / maxVal) * MAX_BAR_W;
        // nextBarW drives the bottom edge; last stage narrows to 65% of itself
        const nextBarW = i < data.length - 1 ? (data[i + 1].value / maxVal) * MAX_BAR_W : barW * 0.65;
        const y = i * (STAGE_H + GAP) + 10;
        const colorIdx = i % colors.length;
        const stageColor = d.color ?? colors[colorIdx];
        // Percentage relative to the first stage (top of funnel = 100%)
        const pct = i === 0 ? 100 : Math.round((d.value / data[0].value) * 100);

        // Trapezoid corners: tl/tr = top-left/right, bl/br = bottom-left/right
        // Centered horizontally within the viewBox
        const tl = (W - barW) / 2;
        const tr = (W + barW) / 2;
        const bl = (W - nextBarW) / 2;
        const br = (W + nextBarW) / 2;
        const midY = y + STAGE_H / 2;

        // Rounded trapezoid path using quadratic bezier corners (radius = 3px)
        const trapezoid = `M ${tl + 3},${y} L ${tr - 3},${y} Q ${tr},${y} ${tr},${y + 3} L ${br},${y + STAGE_H - 3} Q ${br},${y + STAGE_H} ${br - 3},${y + STAGE_H} L ${bl + 3},${y + STAGE_H} Q ${bl},${y + STAGE_H} ${bl},${y + STAGE_H - 3} L ${tl},${y + 3} Q ${tl},${y} ${tl + 3},${y} Z`;

        return (
          <g key={i}>
            {/* Glow halo behind the trapezoid */}
            <path d={trapezoid} fill={stageColor} opacity="0.12" filter="url(#funnel-glow)" />
            {/* Main trapezoid shape */}
            <path
              d={trapezoid}
              fill={d.color ? stageColor : `url(#funnel-grad-${colorIdx})`}
              stroke={stageColor}
              strokeWidth="0.5"
              strokeOpacity="0.25"
              className="funnel-stage"
              style={{ animationDelay: `${i * 0.1}s` }}
              filter="url(#funnel-shadow)"
            />
            {/* Glass sheen — clipped to the top half of the trapezoid */}
            <clipPath id={`funnel-clip-${i}`}><path d={trapezoid} /></clipPath>
            <rect
              x={tl} y={y} width={barW} height={STAGE_H / 2}
              fill={`url(#funnel-glass-${colorIdx})`}
              clipPath={`url(#funnel-clip-${i})`}
              className="funnel-stage"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
            {/* Side accent lines — short horizontal strokes flanking the trapezoid */}
            <line x1={tl - 8} y1={midY} x2={tl - 3} y2={midY} stroke={stageColor} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
            <line x1={tr + 3} y1={midY} x2={tr + 8} y2={midY} stroke={stageColor} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
            {/* Stage label */}
            <text x={W / 2} y={y + STAGE_H / 2 - 4} textAnchor="middle" fill="#fff" fontSize="11" fontFamily="inherit" fontWeight="700">
              {d.label}
            </text>
            {/* Value + percentage relative to stage 0 */}
            <text x={W / 2} y={y + STAGE_H / 2 + 10} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="8" fontFamily="inherit" fontWeight="500">
              {d.value.toLocaleString()}
              <tspan fill={stageColor} fontWeight="700"> · {pct}%</tspan>
            </text>
            {/* Drop-off pill — shows % lost between this stage and the next */}
            {i < data.length - 1 && (
              <g className="funnel-dropoff" style={{ animationDelay: `${i * 0.1 + 0.4}s` } as React.CSSProperties}>
                <rect x={Math.min(tr + 12, W - 44)} y={y + STAGE_H - 2} width="36" height="14" rx="7" fill="rgba(239,68,68,0.12)" stroke="rgba(239,68,68,0.15)" strokeWidth="0.5" />
                <text
                  x={Math.min(tr + 30, W - 26)}
                  y={y + STAGE_H + 9}
                  textAnchor="middle"
                  fill="rgba(239,68,68,0.7)"
                  fontSize="7"
                  fontFamily="inherit"
                  fontWeight="700"
                >
                  −{Math.round(((d.value - data[i + 1].value) / d.value) * 100)}%
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── 6. PolarAreaChart ────────────────────────────────────────────────────────
/**
 * PolarAreaChart — radar-style chart where equal angular slices have variable
 * radius, encoding magnitude purely through area rather than angle.
 * Use cases: multi-skill breakdowns (reading, listening, grammar…), category comparisons.
 *
 * Polar coordinate math:
 *  - sliceAngle = 2π / N  (evenly divides the circle among N data points)
 *  - Rotation starts at -π/2 (12 o'clock) so the first slice tops the chart.
 *  - For each slice i:
 *      startAngle (sa) = -π/2 + i * sliceAngle
 *      endAngle   (ea) = sa + sliceAngle
 *      radius     (r)  = (value / maxVal) * MAX_R   (proportional to max value)
 *  - SVG arc path: M cx,cy L x1,y1 A r,r 0 largeArc 1 x2,y2 Z
 *    where x1,y1 and x2,y2 are the arc endpoints computed from sa and ea.
 *  - largeArc = 1 when sliceAngle > π (i.e., fewer than 3 data points fill > half circle).
 *  - Labels are placed at MAX_R + 16px along the slice midAngle for clearance.
 *  - Value badges sit at 55% of the slice radius along midAngle,
 *    staying inside the slice while avoiding the center hub.
 *
 * The center hub shows the average value across all slices (TB = trung bình).
 *
 * Premium rendering: glowing petals, center hub, outer ring, value badges.
 */
export interface PolarAreaChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  colors?: string[];
  showCenter?: boolean;
}

export function PolarAreaChart({
  data,
  colors = [CHART_COLORS.cyan, CHART_COLORS.purple, CHART_COLORS.pink, CHART_COLORS.teal, CHART_COLORS.amber],
  showCenter = true,
}: PolarAreaChartProps) {
  if (!data.length) return <EmptyState height={200} />;

  const SIZE = 260;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const MAX_R = 90;                                      // maximum slice radius in pixels
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const sliceAngle = (2 * Math.PI) / data.length;       // angular width per slice
  const totalVal = data.reduce((s, d) => s + d.value, 0);
  const avgVal = Math.round(totalVal / data.length);     // displayed in center hub

  const gridRings = 3; // concentric reference rings

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: '100%', maxWidth: 260 }}>
      <defs>
        <PremiumDefs />
        {/* Per-slice linear gradients from center (bright) to edge (transparent) */}
        {colors.map((c, i) => {
          const { r, g, b } = hexToRgb(c);
          return (
            <linearGradient key={i} id={`polar-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={c} stopOpacity="0.8" />
              <stop offset="60%" stopColor={c} stopOpacity="0.45" />
              <stop offset="100%" stopColor={`rgba(${r},${g},${b},0.2)`} />
            </linearGradient>
          );
        })}
        <filter id="polar-glow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="polar-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="rgba(0,0,0,0.2)" />
        </filter>
        {/* Center hub gradient — subtle glass disc */}
        <radialGradient id="polar-hub" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
        </radialGradient>
      </defs>

      {/* Ambient */}
      <rect x="0" y="0" width={SIZE} height={SIZE} fill="url(#px-ambient)" />

      {/* Concentric grid rings with value labels */}
      {Array.from({ length: gridRings }).map((_, i) => {
        const r = MAX_R * ((i + 1) / gridRings);
        const val = Math.round(maxVal * ((i + 1) / gridRings));
        return (
          <g key={i}>
            <circle cx={CX} cy={CY} r={r} fill="none" stroke={GRID_LINE} strokeWidth="1" />
            <text x={CX + 3} y={CY - r + 10} fill={LABEL_COLOR} fontSize="7" fontFamily="inherit" fontWeight="500" opacity="0.5">{val}</text>
          </g>
        );
      })}

      {/* Radial axis lines from center to MAX_R — one per slice */}
      {data.map((_, i) => {
        // Axis angle for each slice boundary, starting at 12 o'clock
        const angle = -Math.PI / 2 + i * sliceAngle;
        const x2 = CX + MAX_R * Math.cos(angle);
        const y2 = CY + MAX_R * Math.sin(angle);
        return <line key={i} x1={CX} y1={CY} x2={x2} y2={y2} stroke={GRID_LINE} strokeWidth="1" />;
      })}

      {/* Outer ring border — subtle enclosure for the chart area */}
      <circle cx={CX} cy={CY} r={MAX_R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />

      {/* Slices */}
      {data.map((d, i) => {
        const colorIdx = i % colors.length;
        const sliceColor = d.color ?? colors[colorIdx];
        // Radius proportional to value; slice stays within MAX_R
        const r = (d.value / maxVal) * MAX_R;
        const sa = -Math.PI / 2 + i * sliceAngle;  // slice start angle
        const ea = sa + sliceAngle;                  // slice end angle

        // Arc endpoints in SVG coordinates
        const x1 = CX + r * Math.cos(sa);
        const y1 = CY + r * Math.sin(sa);
        const x2 = CX + r * Math.cos(ea);
        const y2 = CY + r * Math.sin(ea);

        // largeArc flag required by SVG arc when the arc subtends more than 180°
        const la = sliceAngle > Math.PI ? 1 : 0;
        // Pie-slice path: move to center, line to start of arc, arc to end, close
        const path = `M ${CX},${CY} L ${x1},${y1} A ${r},${r} 0 ${la} 1 ${x2},${y2} Z`;

        // Label position: midpoint angle, outside the outer ring
        const midAngle = sa + sliceAngle / 2;
        const labelR = MAX_R + 16;
        const lx = CX + labelR * Math.cos(midAngle);
        const ly = CY + labelR * Math.sin(midAngle);

        // Value badge position: 55% of slice radius along midAngle — inside the slice
        const badgeR = Math.max(r * 0.55, 14);
        const bx = CX + badgeR * Math.cos(midAngle);
        const by = CY + badgeR * Math.sin(midAngle);

        return (
          <g key={i}>
            {/* Glow halo behind the slice */}
            <path d={path} fill={sliceColor} opacity="0.12" filter="url(#polar-glow)" />
            {/* Main slice shape */}
            <path
              d={path}
              fill={d.color ? sliceColor : `url(#polar-grad-${colorIdx})`}
              stroke={sliceColor}
              strokeWidth="1.5"
              strokeOpacity="0.3"
              className="polar-slice"
              style={{ animationDelay: `${i * 0.08}s` }}
              filter="url(#polar-shadow)"
            />
            {/* Glass highlight — slightly smaller (95%) inner arc in px-glass gradient */}
            {r > 15 && (
              <path
                d={`M ${CX},${CY} L ${CX + (r * 0.95) * Math.cos(sa)},${CY + (r * 0.95) * Math.sin(sa)} A ${r * 0.95},${r * 0.95} 0 ${la} 1 ${CX + (r * 0.95) * Math.cos(ea)},${CY + (r * 0.95) * Math.sin(ea)} Z`}
                fill="url(#px-glass)"
                pointerEvents="none"
                className="polar-slice"
                style={{ animationDelay: `${i * 0.08}s` }}
              />
            )}
            {/* Slice label outside the chart ring */}
            <text x={lx} y={ly + 3} textAnchor="middle" fill={LABEL_COLOR} fontSize="8" fontFamily="inherit" fontWeight="600">
              {d.label}
            </text>
            {/* Value badge — only shown when slice is large enough (r > 22px) */}
            {r > 22 && (
              <g className="polar-badge" style={{ animationDelay: `${i * 0.08 + 0.3}s` } as React.CSSProperties}>
                <circle cx={bx} cy={by} r="10" fill="rgba(0,0,0,0.35)" />
                <text x={bx} y={by + 3} textAnchor="middle" fill="#fff" fontSize="8" fontFamily="inherit" fontWeight="700">
                  {d.value}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Center hub — displays average value across all slices */}
      {showCenter && (
        <g>
          <circle cx={CX} cy={CY} r="20" fill="url(#polar-hub)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <text x={CX} y={CY - 2} textAnchor="middle" fill={VALUE_COLOR} fontSize="11" fontFamily="inherit" fontWeight="800">{avgVal}</text>
          {/* TB = Trung Bình (average) */}
          <text x={CX} y={CY + 8} textAnchor="middle" fill={LABEL_COLOR} fontSize="5" fontFamily="inherit" fontWeight="600">TB</text>
        </g>
      )}
    </svg>
  );
}
