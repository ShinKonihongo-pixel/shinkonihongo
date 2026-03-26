// Shared constants and helpers for premium SVG charts
// Used by all chart components in this directory

export { CHART_COLORS } from '../svg-charts';

// Color tokens — consistent with dark glassmorphism palette
export const GRID_LINE   = 'rgba(255,255,255,0.06)';
export const GRID_LINE_2 = 'rgba(255,255,255,0.03)';
export const LABEL_COLOR = 'rgba(255,255,255,0.5)';
export const VALUE_COLOR = 'rgba(255,255,255,0.92)';

/** Clamp a value between lo and hi (inclusive). */
export function clamp(v: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, v)); }

/** Convert hex color to RGB components for use in rgba() strings. */
export function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

/** Format numbers with K suffix for large values to keep axis labels concise. */
export function formatNum(n: number) {
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
