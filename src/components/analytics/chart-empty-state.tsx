import { LABEL_COLOR } from './chart-constants';

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ height = 160 }: { height?: number }) {
  return (
    <svg viewBox={`0 0 300 ${height}`} style={{ width: '100%' }}>
      <text x="150" y={height / 2} textAnchor="middle" fill={LABEL_COLOR} fontSize="13" fontFamily="inherit">
        Chưa có dữ liệu
      </text>
    </svg>
  );
}
