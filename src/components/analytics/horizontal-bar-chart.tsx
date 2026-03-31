import { CHART_COLORS, GRID_LINE, VALUE_COLOR } from './chart-constants';
import { EmptyState } from './chart-empty-state';

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
        {items.map((_item, i) => (
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
