// Shared constants and helpers for SVG chart components

// ─── Color palette ────────────────────────────────────────────────────────────
export const CHART_COLORS = {
  cyan:   '#06b6d4',
  purple: '#8b5cf6',
  pink:   '#ec4899',
  teal:   '#14b8a6',
  amber:  '#f59e0b',
} as const;

export const GRID_LINE   = 'rgba(255,255,255,0.06)';
export const LABEL_COLOR = 'rgba(255,255,255,0.55)';
export const VALUE_COLOR = 'rgba(255,255,255,0.9)';

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function clamp(v: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, v)); }

/** Smooth catmull-rom polyline → SVG path d attribute */
export function smoothPath(points: [number, number][], closed = false): string {
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
