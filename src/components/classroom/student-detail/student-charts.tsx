// SVG mini-charts for student detail modal
// ScoreSparkline, AttendanceDonut, CriteriaRadar — extracted for reusability

import type { StudentEvaluation } from '../../../types/classroom';
import { DEFAULT_EVALUATION_CRITERIA } from '../../../types/classroom';

/** Score trend sparkline — last N submissions (oldest→newest) */
export function ScoreSparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) return null;
  const W = 80, H = 28, PAD = 2;
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;
  const pts = scores.map((v, i) => {
    const x = PAD + (i / (scores.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
    return `${x},${y}`;
  });
  const polyline = pts.join(' ');
  const lastPt = pts[pts.length - 1].split(',');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="sparkline-svg" aria-hidden="true">
      <polyline points={polyline} fill="none" stroke="rgba(6,182,212,0.7)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={parseFloat(lastPt[0])} cy={parseFloat(lastPt[1])} r="2.5" fill="#06b6d4" />
    </svg>
  );
}

/** Attendance donut — shows present/late/absent/excused ratio with center % */
export function AttendanceDonut({
  present = 0, late = 0, absent = 0, excused = 0, rate = 0,
}: {
  present?: number; late?: number; absent?: number; excused?: number; rate?: number;
}) {
  const total = present + late + absent + excused;
  const R = 38, CX = 44, CY = 44, stroke = 10;
  const circ = 2 * Math.PI * R;

  const segments = [
    { count: present, color: '#22c55e' },
    { count: late,    color: '#f59e0b' },
    { count: excused, color: '#60a5fa' },
    { count: absent,  color: '#ef4444' },
  ];

  let offset = 0;
  const arcs = segments.map((seg) => {
    const frac = total > 0 ? seg.count / total : 0;
    const dash = frac * circ;
    const gap  = circ - dash;
    const el = (
      <circle key={seg.color} cx={CX} cy={CY} r={R} fill="none" stroke={seg.color}
        strokeWidth={stroke} strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset}
        transform={`rotate(-90 ${CX} ${CY})`} opacity={frac > 0 ? 0.85 : 0} />
    );
    offset += dash;
    return el;
  });

  return (
    <svg width={88} height={88} viewBox="0 0 88 88" aria-hidden="true">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      {arcs}
      <text x={CX} y={CY - 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="white">{rate.toFixed(0)}%</text>
      <text x={CX} y={CY + 9} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.4)">chuyên cần</text>
    </svg>
  );
}

/** Radar chart for latest evaluation criteria scores (up to 6 axes) */
export function CriteriaRadar({ evaluation }: { evaluation: StudentEvaluation }) {
  const SIZE = 110, CX = 55, CY = 55, MAX_R = 40;
  const criteria = DEFAULT_EVALUATION_CRITERIA.slice(0, 6);
  const n = criteria.length;
  if (n < 3) return null;

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i: number, r: number) => ({
    x: CX + r * Math.cos(angle(i)),
    y: CY + r * Math.sin(angle(i)),
  });

  const rings = [0.25, 0.5, 0.75, 1].map((frac, ri) => {
    const pts = Array.from({ length: n }, (_, i) => pt(i, MAX_R * frac));
    return <polygon key={ri} points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
  });

  const axes = Array.from({ length: n }, (_, i) => {
    const end = pt(i, MAX_R);
    return <line key={i} x1={CX} y1={CY} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
  });

  const dataPoints = criteria.map((c, i) => {
    const score = evaluation.ratings[c.id] || 0;
    return pt(i, MAX_R * (score / c.maxPoints));
  });

  const labels = criteria.map((c, i) => {
    const p = pt(i, MAX_R + 11);
    return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="rgba(255,255,255,0.45)">{c.name.slice(0, 6)}</text>;
  });

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
      {rings}
      {axes}
      <polygon points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')} fill="rgba(6,182,212,0.15)" stroke="#06b6d4" strokeWidth="1.5" strokeLinejoin="round" />
      {dataPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#8b5cf6" />)}
      {labels}
    </svg>
  );
}
