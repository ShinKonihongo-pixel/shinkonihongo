// Infographic-style student report — colorful, visual-heavy (Duolingo/ClassDojo inspired)

import type { jsPDF } from 'jspdf';
import type { StudentReportConfig, StudentReportData } from '../../types/student-report';
import { drawRoundedRect } from './drawing-primitives';
import { drawRadarChart } from './charts';
import { toASCII, formatDate, generateRecommendations } from './utils';
import { DEFAULT_EVALUATION_CRITERIA } from '../../types/classroom';

// Infographic color palette
const C = {
  purple:  { r: 139, g: 92,  b: 246 },
  pink:    { r: 236, g: 72,  b: 153 },
  cyan:    { r: 6,   g: 182, b: 212 },
  green:   { r: 34,  g: 197, b: 94  },
  amber:   { r: 245, g: 158, b: 11  },
  red:     { r: 239, g: 68,  b: 68  },
  white:   { r: 255, g: 255, b: 255 },
  dark:    { r: 30,  g: 30,  b: 46  },
  muted:   { r: 148, g: 163, b: 184 },
  bgLight: { r: 248, g: 245, b: 255 },
};

// Card gradient pairs [left color, right color] for gradient simulation
const CARD_GRADIENTS = [
  { left: { r: 167, g: 139, b: 250 }, right: { r: 196, g: 181, b: 253 } }, // purple
  { left: { r: 59,  g: 130, b: 246 }, right: { r: 147, g: 197, b: 253 } }, // blue
  { left: { r: 34,  g: 197, b: 94  }, right: { r: 134, g: 239, b: 172 } }, // green
  { left: { r: 245, g: 158, b: 11  }, right: { r: 252, g: 211, b: 77  } }, // amber
];
const CARD_ICONS = ['CHUYEN CAN', 'BAI NOP', 'DANH GIA', 'KIEM TRA'];
const CARD_ICON_CHARS = ['%', '#', '*', '!'];

function setColor(doc: jsPDF, c: { r: number; g: number; b: number }, mode: 'fill' | 'text' | 'draw') {
  if (mode === 'fill') doc.setFillColor(c.r, c.g, c.b);
  else if (mode === 'text') doc.setTextColor(c.r, c.g, c.b);
  else doc.setDrawColor(c.r, c.g, c.b);
}

function scoreColor(avg: number) {
  if (avg >= 80) return C.green;
  if (avg >= 50) return C.amber;
  return C.red;
}

// Draw smooth donut arc segment using many small line segments
function drawDonutSegment(
  doc: jsPDF,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startDeg: number,
  endDeg: number,
  color: { r: number; g: number; b: number },
  gapDeg: number = 1.5
) {
  const span = endDeg - startDeg - gapDeg;
  if (span < 0.5) return;
  const sD = startDeg + gapDeg / 2;

  setColor(doc, color, 'fill');
  setColor(doc, color, 'draw');

  const midR = (outerR + innerR) / 2;
  const lineW = outerR - innerR;
  doc.setLineWidth(lineW);
  doc.setLineCap('round');

  const steps = Math.max(8, Math.round(span / 3));
  const toRad = (deg: number) => (deg - 90) * (Math.PI / 180);

  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = toRad(sD + (span * i) / steps);
    pts.push({ x: cx + midR * Math.cos(angle), y: cy + midR * Math.sin(angle) });
  }

  if (pts.length > 1) {
    doc.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) doc.lineTo(pts[i].x, pts[i].y);
    doc.stroke();
  }
  doc.setLineCap('butt');
}

// Draw a progress arc on a track (for score circle)
function drawProgressArc(
  doc: jsPDF,
  cx: number,
  cy: number,
  r: number,
  lineW: number,
  percent: number,
  color: { r: number; g: number; b: number }
) {
  // Background track
  doc.setDrawColor(220, 220, 235);
  doc.setLineWidth(lineW);
  doc.setLineCap('round');
  const steps = 60;
  const toRad = (deg: number) => (deg - 90) * (Math.PI / 180);
  const trackPts: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = toRad((360 * i) / steps);
    trackPts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  }
  doc.moveTo(trackPts[0].x, trackPts[0].y);
  for (let i = 1; i < trackPts.length; i++) doc.lineTo(trackPts[i].x, trackPts[i].y);
  doc.stroke();

  // Progress arc
  const arcDeg = (percent / 100) * 360;
  const arcSteps = Math.max(8, Math.round(arcDeg / 4));
  const arcPts: { x: number; y: number }[] = [];
  for (let i = 0; i <= arcSteps; i++) {
    const angle = toRad((arcDeg * i) / arcSteps);
    arcPts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  }
  setColor(doc, color, 'draw');
  doc.setLineWidth(lineW);
  if (arcPts.length > 1) {
    doc.moveTo(arcPts[0].x, arcPts[0].y);
    for (let i = 1; i < arcPts.length; i++) doc.lineTo(arcPts[i].x, arcPts[i].y);
    doc.stroke();
  }
  doc.setLineCap('butt');
}

// Draw a gradient band card (simulate with multiple thin rects)
function drawGradientCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  colorL: { r: number; g: number; b: number },
  colorR: { r: number; g: number; b: number },
  radius: number
) {
  const bands = 20;
  // Clip-friendly approach: draw full card in start color first as base
  doc.setFillColor(colorL.r, colorL.g, colorL.b);
  drawRoundedRect(doc, x, y, w, h, radius);
  for (let i = 0; i < bands; i++) {
    const t = i / bands;
    const r = Math.round(colorL.r + (colorR.r - colorL.r) * t);
    const g = Math.round(colorL.g + (colorR.g - colorL.g) * t);
    const b = Math.round(colorL.b + (colorR.b - colorL.b) * t);
    doc.setFillColor(r, g, b);
    const bx = x + (w * i) / bands;
    const bw = w / bands + 0.5;
    // Clip to card shape roughly by skipping corners
    const isLeftEdge  = i === 0;
    const isRightEdge = i === bands - 1;
    if (isLeftEdge || isRightEdge) continue; // corners handled by base
    doc.rect(bx, y, bw, h, 'F');
  }
  // Re-draw left/right caps with rounded corners in their respective colors
  doc.setFillColor(colorL.r, colorL.g, colorL.b);
  drawRoundedRect(doc, x, y, radius * 2, h, radius);
  doc.rect(x + radius, y, radius, h, 'F');
  doc.setFillColor(colorR.r, colorR.g, colorR.b);
  drawRoundedRect(doc, x + w - radius * 2, y, radius * 2, h, radius);
  doc.rect(x + w - radius * 2, y, radius, h, 'F');
}

export async function generateInfographicReport(
  data: StudentReportData,
  config: StudentReportConfig
): Promise<jsPDF> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 0;

  // ── Section 1: Hero Banner ──────────────────────────────────────────────────
  const bannerH = 50;

  // Smooth gradient: 40+ bands, purple → pink
  const bands = 48;
  for (let i = 0; i < bands; i++) {
    const t = i / bands;
    const r = Math.round(C.purple.r + (C.pink.r - C.purple.r) * t);
    const g = Math.round(C.purple.g + (C.pink.g - C.purple.g) * t);
    const b = Math.round(C.purple.b + (C.pink.b - C.purple.b) * t);
    doc.setFillColor(r, g, b);
    doc.rect((pageWidth * i) / bands, 0, pageWidth / bands + 0.5, bannerH, 'F');
  }

  // Decorative circles (semi-transparent, like classic report)
  doc.setGState(doc.GState({ opacity: 0.12 }));
  doc.setFillColor(255, 255, 255);
  doc.circle(pageWidth - 22, -8, 28, 'F');
  doc.circle(18, bannerH + 4, 20, 'F');
  doc.circle(pageWidth / 2 + 55, bannerH - 2, 14, 'F');
  doc.setGState(doc.GState({ opacity: 0.07 }));
  doc.circle(28, 10, 18, 'F');
  doc.circle(pageWidth - 10, bannerH - 6, 16, 'F');
  doc.setGState(doc.GState({ opacity: 1 }));

  // School name (top, small)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setColor(doc, { r: 233, g: 213, b: 255 }, 'text');
  doc.text(toASCII(config.schoolName), pageWidth / 2, 7, { align: 'center' });

  // Japanese subtitle
  doc.setFontSize(6.5);
  setColor(doc, { r: 253, g: 224, b: 255 }, 'text');
  doc.text('Phieu danh gia hoc tap', pageWidth / 2, 12, { align: 'center' });

  // "✨ PHIEU DANH GIA ✨" badge
  const badgeW = 60;
  const badgeH = 9;
  const badgeX = pageWidth / 2 - badgeW / 2;
  doc.setFillColor(255, 255, 255);
  doc.setGState(doc.GState({ opacity: 0.22 }));
  drawRoundedRect(doc, badgeX, 15, badgeW, badgeH, 4.5);
  doc.setGState(doc.GState({ opacity: 1 }));
  doc.setFontSize(7);
  setColor(doc, C.white, 'text');
  doc.setFont('helvetica', 'bold');
  doc.text('** PHIEU DANH GIA **', pageWidth / 2, 20.5, { align: 'center' });

  // Student name (large)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  setColor(doc, C.white, 'text');
  doc.text(toASCII(data.studentName), pageWidth / 2, 34, { align: 'center' });

  // Period + classroom
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setColor(doc, { r: 233, g: 213, b: 255 }, 'text');
  doc.text(
    `${formatDate(data.periodStart)} - ${formatDate(data.periodEnd)}  |  ${toASCII(data.classroomName)}`,
    pageWidth / 2, 43, { align: 'center' }
  );

  y = bannerH + 10;

  // ── Section 2: Score Spotlight ──────────────────────────────────────────────
  const avg    = data.grades?.averagePercent ?? 0;
  const circR  = 22;
  const cx     = pageWidth / 2;
  const cy     = y + circR + 4;
  const sColor = scoreColor(avg);

  // Outer glow ring
  setColor(doc, sColor, 'draw');
  doc.setLineWidth(0.8);
  doc.setGState(doc.GState({ opacity: 0.18 }));
  doc.circle(cx, cy, circR + 6, 'S');
  doc.setGState(doc.GState({ opacity: 0.08 }));
  doc.circle(cx, cy, circR + 10, 'S');
  doc.setGState(doc.GState({ opacity: 1 }));

  // Concentric inner rings (subtle)
  doc.setLineWidth(0.3);
  setColor(doc, { r: 230, g: 225, b: 245 }, 'draw');
  doc.circle(cx, cy, circR - 5, 'S');
  doc.circle(cx, cy, circR - 10, 'S');

  // Progress arc track + arc
  drawProgressArc(doc, cx, cy, circR, 3.5, avg, sColor);

  // Inner circle fill
  setColor(doc, sColor, 'fill');
  doc.setGState(doc.GState({ opacity: 0.10 }));
  doc.circle(cx, cy, circR - 4, 'F');
  doc.setGState(doc.GState({ opacity: 1 }));

  // Score number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  setColor(doc, sColor, 'text');
  doc.text(`${avg.toFixed(0)}`, cx, cy + 2, { align: 'center' });

  // "/ 100" sub-label
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setColor(doc, C.muted, 'text');
  doc.text('/ 100', cx, cy + 8.5, { align: 'center' });

  // Trend arrow
  const trendArrow = avg >= 80 ? '^ Xuat sac' : avg >= 50 ? '> Dat yeu cau' : 'v Can co gang';
  const trendColor = avg >= 80 ? C.green : avg >= 50 ? C.amber : C.red;
  doc.setFontSize(7);
  setColor(doc, trendColor, 'text');
  doc.text(trendArrow, cx, cy + circR + 8, { align: 'center' });

  // Label below
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setColor(doc, C.muted, 'text');
  doc.text('Diem trung binh', cx, cy + circR + 14, { align: 'center' });

  y = cy + circR + 20;

  // ── Section 3: Stats Cards Row ──────────────────────────────────────────────
  const cardW = (pageWidth - 2 * margin - 9) / 4;
  const cardH = 28;

  const statsCards = [
    {
      label:  'Chuyen can',
      value:  data.attendance ? `${data.attendance.attendanceRate.toFixed(0)}%` : 'N/A',
      detail: data.attendance ? `${data.attendance.present}/${data.attendance.totalSessions} buoi` : '',
    },
    {
      label:  'Bai nop',
      value:  data.grades ? data.grades.assignmentsCompleted.toString() : 'N/A',
      detail: data.grades ? `${data.grades.assignmentsCompleted} bai hoan thanh` : '',
    },
    {
      label:  'Danh gia',
      value:  data.evaluation ? `${data.evaluation.overallRating}/5` : 'N/A',
      detail: data.evaluation ? 'Xep loai chung' : '',
    },
    {
      label:  'Kiem tra',
      value:  data.grades ? data.grades.testsCompleted.toString() : 'N/A',
      detail: data.grades ? `${data.grades.testsCompleted} bai kiem tra` : '',
    },
  ];

  statsCards.forEach((card, idx) => {
    const x  = margin + idx * (cardW + 3);
    const gr = CARD_GRADIENTS[idx];

    // Shadow (offset dark rect)
    doc.setFillColor(gr.left.r - 30, gr.left.g - 30, gr.left.b - 30);
    doc.setGState(doc.GState({ opacity: 0.18 }));
    drawRoundedRect(doc, x + 1.5, y + 2, cardW, cardH, 5);
    doc.setGState(doc.GState({ opacity: 1 }));

    // Gradient card background
    drawGradientCard(doc, x, y, cardW, cardH, gr.left, gr.right, 5);

    // White icon circle on left
    const iconCx = x + 8;
    const iconCy = y + cardH / 2;
    doc.setFillColor(255, 255, 255);
    doc.setGState(doc.GState({ opacity: 0.30 }));
    doc.circle(iconCx, iconCy, 6, 'F');
    doc.setGState(doc.GState({ opacity: 1 }));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(CARD_ICON_CHARS[idx], iconCx, iconCy + 2, { align: 'center' });

    // Value (large)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(card.value, x + cardW / 2 + 4, y + 12, { align: 'center' });

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.setGState(doc.GState({ opacity: 0.85 }));
    doc.text(CARD_ICONS[idx], x + cardW / 2 + 4, y + 19, { align: 'center' });
    doc.setGState(doc.GState({ opacity: 1 }));

    // Detail line
    if (card.detail) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setGState(doc.GState({ opacity: 0.75 }));
      doc.setTextColor(255, 255, 255);
      doc.text(card.detail, x + cardW / 2 + 4, y + 25, { align: 'center' });
      doc.setGState(doc.GState({ opacity: 1 }));
    }
  });

  y += cardH + 12;

  // ── Section 4: Attendance Donut ─────────────────────────────────────────────
  if (config.showAttendance && data.attendance) {
    const att   = data.attendance;
    const total = att.totalSessions || 1;

    // Section header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setColor(doc, C.dark, 'text');
    doc.text('DIEM DANH', margin, y + 4);

    // Gradient divider
    const divBands = 40;
    for (let i = 0; i < divBands; i++) {
      const t = i / divBands;
      const r = Math.round(C.purple.r + (C.pink.r - C.purple.r) * t);
      const g = Math.round(C.purple.g + (C.pink.g - C.purple.g) * t);
      const b = Math.round(C.purple.b + (C.pink.b - C.purple.b) * t);
      doc.setFillColor(r, g, b);
      doc.rect(margin + ((pageWidth - 2 * margin) * i) / divBands, y + 6, (pageWidth - 2 * margin) / divBands + 0.5, 2, 'F');
    }
    y += 12;

    const donutR  = 20;
    const donutCx = margin + donutR + 4;
    const donutCy = y + donutR + 4;

    const segments = [
      { count: att.present,  color: C.green,  label: 'Co mat' },
      { count: att.late,     color: C.amber,  label: 'Di muon' },
      { count: att.absent,   color: C.red,    label: 'Vang' },
      { count: att.excused,  color: C.cyan,   label: 'Co phep' },
    ];

    let currentDeg = 0;
    segments.forEach(seg => {
      const deg = (seg.count / total) * 360;
      drawDonutSegment(doc, donutCx, donutCy, donutR, donutR - 8, currentDeg, currentDeg + deg, seg.color, 2);

      // Percentage label on segment if > 15%
      const pct = (seg.count / total) * 100;
      if (pct > 15) {
        const midDeg = currentDeg + deg / 2;
        const midRad = (midDeg - 90) * (Math.PI / 180);
        const labelR  = donutR - 4;
        const lx = donutCx + labelR * Math.cos(midRad);
        const ly = donutCy + labelR * Math.sin(midRad);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        setColor(doc, C.white, 'text');
        doc.text(`${pct.toFixed(0)}%`, lx, ly + 1, { align: 'center' });
      }
      currentDeg += deg;
    });

    // Center circle (white fill)
    doc.setFillColor(255, 255, 255);
    doc.circle(donutCx, donutCy, donutR - 9, 'F');

    // Center text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    setColor(doc, C.dark, 'text');
    doc.text(`${att.attendanceRate.toFixed(0)}%`, donutCx, donutCy + 1.5, { align: 'center' });
    doc.setFontSize(5.5);
    setColor(doc, C.muted, 'text');
    doc.text('ty le', donutCx, donutCy + 5.5, { align: 'center' });

    // Legend with colored rounded squares
    const legendX  = donutCx + donutR + 10;
    let legY = donutCy - 14;
    segments.forEach(seg => {
      // Colored pill
      doc.setFillColor(seg.color.r, seg.color.g, seg.color.b);
      drawRoundedRect(doc, legendX, legY, 5, 5, 1.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      setColor(doc, C.dark, 'text');
      const pct = ((seg.count / total) * 100).toFixed(0);
      doc.text(`${seg.label}: ${seg.count} (${pct}%)`, legendX + 8, legY + 4);
      legY += 9;
    });

    y = Math.max(donutCy + donutR + 10, y + 48);
  }

  // ── Section 5: Skills Radar ──────────────────────────────────────────────────
  if (config.showEvaluation && data.evaluation) {
    if (y > pageHeight - 95) { doc.addPage(); y = margin; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setColor(doc, C.dark, 'text');
    doc.text('KY NANG', margin, y + 4);

    // Gradient divider
    const divBands = 40;
    for (let i = 0; i < divBands; i++) {
      const t = i / divBands;
      const r = Math.round(C.cyan.r + (C.purple.r - C.cyan.r) * t);
      const g = Math.round(C.cyan.g + (C.purple.g - C.cyan.g) * t);
      const b = Math.round(C.cyan.b + (C.purple.b - C.cyan.b) * t);
      doc.setFillColor(r, g, b);
      doc.rect(margin + ((pageWidth - 2 * margin) * i) / divBands, y + 6, (pageWidth - 2 * margin) / divBands + 0.5, 2, 'F');
    }
    y += 14;

    const radarData = DEFAULT_EVALUATION_CRITERIA.slice(0, 6).map(c => ({
      label: c.name.length > 10 ? c.name.substring(0, 8) + '..' : c.name,
      value: data.evaluation?.ratings[c.id] || 0,
      max:   c.maxPoints,
    }));

    const rCx = pageWidth / 2;
    const rCy = y + 38;
    drawRadarChart(doc, rCx, rCy, 32, radarData);

    // Value labels at each vertex
    const angleStep  = (2 * Math.PI) / radarData.length;
    const startAngle = -Math.PI / 2;
    radarData.forEach((pt, i) => {
      const angle     = startAngle + i * angleStep;
      const valPct    = pt.value / pt.max;
      const labelR    = 32 * valPct;
      const lx        = rCx + labelR * Math.cos(angle);
      const ly        = rCy + labelR * Math.sin(angle);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      setColor(doc, C.purple, 'text');
      doc.text(`${pt.value}`, lx, ly - 1.5, { align: 'center' });
    });

    y = rCy + 38;
  }

  // ── Section 6: Achievement Badges ───────────────────────────────────────────
  if (y > pageHeight - 55) { doc.addPage(); y = margin; }

  const badges: { label: string; icon: string; color: { r: number; g: number; b: number }; gColor: { r: number; g: number; b: number } }[] = [];
  if (data.attendance && data.attendance.attendanceRate >= 90)
    badges.push({ label: 'Chuyen can xuat sac', icon: 'CC', color: C.green,  gColor: { r: 16, g: 185, b: 129 } });
  if (data.grades && data.grades.averagePercent >= 80)
    badges.push({ label: 'Hoc sinh gioi',       icon: 'HS', color: C.purple, gColor: { r: 109, g: 40, b: 217 } });
  const allPassed = data.grades?.submissions?.every(s => s.score / s.totalPoints >= 0.5) ?? false;
  if (data.grades && allPassed && data.grades.submissions && data.grades.submissions.length > 0)
    badges.push({ label: 'Hoan thanh tot',      icon: 'HT', color: C.cyan,   gColor: { r: 8, g: 145, b: 178 } });

  if (badges.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setColor(doc, C.dark, 'text');
    doc.text('THANH TICH', margin, y + 4);

    const divBands = 40;
    for (let i = 0; i < divBands; i++) {
      const t = i / divBands;
      const r = Math.round(C.amber.r + (C.pink.r - C.amber.r) * t);
      const g = Math.round(C.amber.g + (C.pink.g - C.amber.g) * t);
      const b = Math.round(C.amber.b + (C.pink.b - C.amber.b) * t);
      doc.setFillColor(r, g, b);
      doc.rect(margin + ((pageWidth - 2 * margin) * i) / divBands, y + 6, (pageWidth - 2 * margin) / divBands + 0.5, 2, 'F');
    }
    y += 14;

    let bx = margin;
    badges.forEach(badge => {
      const tw = doc.getTextWidth(badge.label) + 28;
      const bh = 14;

      // Shadow
      doc.setFillColor(badge.gColor.r - 20, badge.gColor.g - 20, badge.gColor.b - 20);
      doc.setGState(doc.GState({ opacity: 0.20 }));
      drawRoundedRect(doc, bx + 1.5, y + 2, tw, bh, 7);
      doc.setGState(doc.GState({ opacity: 1 }));

      // Gradient background
      drawGradientCard(doc, bx, y, tw, bh, badge.color, badge.gColor, 7);

      // Icon circle
      doc.setFillColor(255, 255, 255);
      doc.setGState(doc.GState({ opacity: 0.25 }));
      doc.circle(bx + 9, y + bh / 2, 5, 'F');
      doc.setGState(doc.GState({ opacity: 1 }));
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(255, 255, 255);
      doc.text(badge.icon, bx + 9, y + bh / 2 + 1.8, { align: 'center' });

      // Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text(badge.label, bx + 17, y + bh / 2 + 2.5);

      bx += tw + 5;
    });
    y += 20;
  }

  // ── Section 7: Teacher Comment ───────────────────────────────────────────────
  if (data.evaluation?.comment) {
    if (y > pageHeight - 48) { doc.addPage(); y = margin; }

    const boxH = 38;

    // Outer shadow
    doc.setFillColor(139, 92, 246);
    doc.setGState(doc.GState({ opacity: 0.08 }));
    drawRoundedRect(doc, margin + 1.5, y + 2, pageWidth - 2 * margin, boxH, 6);
    doc.setGState(doc.GState({ opacity: 1 }));

    // Box fill (light purple tint)
    doc.setFillColor(245, 243, 255);
    drawRoundedRect(doc, margin, y, pageWidth - 2 * margin, boxH, 6);

    // Thick purple left border
    doc.setFillColor(C.purple.r, C.purple.g, C.purple.b);
    drawRoundedRect(doc, margin, y, 4, boxH, 3);

    // Large decorative quote mark
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setGState(doc.GState({ opacity: 0.15 }));
    setColor(doc, C.purple, 'text');
    doc.text('"', margin + 8, y + 16);
    doc.setGState(doc.GState({ opacity: 1 }));

    // Header label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setColor(doc, C.purple, 'text');
    doc.text('Nhan xet cua giao vien:', margin + 8, y + 10);

    // Comment text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    setColor(doc, C.dark, 'text');
    const lines = doc.splitTextToSize(toASCII(data.evaluation.comment), pageWidth - 2 * margin - 14);
    doc.text(lines.slice(0, 3), margin + 8, y + 18, { lineHeightFactor: 1.5 });
    y += boxH + 10;
  }

  // ── Section 7b: Class Comparison bar ────────────────────────────────────────
  if (data.classAverage !== undefined && data.grades) {
    if (y > pageHeight - 35) { doc.addPage(); y = margin; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(doc, C.dark, 'text');
    doc.text('SO SANH LOP', margin, y + 4);

    const divBands = 40;
    for (let i = 0; i < divBands; i++) {
      const t = i / divBands;
      const r = Math.round(C.cyan.r + (C.amber.r - C.cyan.r) * t);
      const g = Math.round(C.cyan.g + (C.amber.g - C.cyan.g) * t);
      const b = Math.round(C.cyan.b + (C.amber.b - C.cyan.b) * t);
      doc.setFillColor(r, g, b);
      doc.rect(margin + ((pageWidth - 2 * margin) * i) / divBands, y + 6, (pageWidth - 2 * margin) / divBands + 0.5, 2, 'F');
    }
    y += 14;

    const studentAvg = data.grades.averagePercent;
    const classAvg = data.classAverage;
    const barW = pageWidth - 2 * margin;
    const barH = 6;

    // Student bar
    doc.setFillColor(220, 224, 230);
    doc.roundedRect(margin, y, barW, barH, 3, 3, 'F');
    const sColor = scoreColor(studentAvg);
    setColor(doc, sColor, 'fill');
    doc.roundedRect(margin, y, (barW * studentAvg) / 100, barH, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    setColor(doc, C.dark, 'text');
    doc.text(`Hoc vien: ${studentAvg.toFixed(0)}%`, margin, y - 3);
    y += barH + 4;

    // Class avg bar
    doc.setFillColor(220, 224, 230);
    doc.roundedRect(margin, y, barW, barH, 3, 3, 'F');
    setColor(doc, C.cyan, 'fill');
    doc.roundedRect(margin, y, (barW * classAvg) / 100, barH, 3, 3, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setColor(doc, C.muted, 'text');
    doc.text(`TB lop: ${classAvg.toFixed(1)}%${data.studentRank && data.classSize ? `  |  Hang ${data.studentRank}/${data.classSize}` : ''}`, margin, y - 3);
    y += barH + 10;
  }

  // ── Section 7c: Custom Teacher Note ─────────────────────────────────────────
  if (data.customNote) {
    if (y > pageHeight - 42) { doc.addPage(); y = margin; }

    const boxH = 36;
    doc.setFillColor(240, 253, 244); // green tint — distinct from purple comment box
    doc.roundedRect(margin, y, pageWidth - 2 * margin, boxH, 6, 6, 'F');
    setColor(doc, C.green, 'fill');
    doc.roundedRect(margin, y, 4, boxH, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setColor(doc, C.green, 'text');
    doc.text('Ghi chu cua giao vien:', margin + 8, y + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    setColor(doc, C.dark, 'text');
    const noteLines = doc.splitTextToSize(toASCII(data.customNote), pageWidth - 2 * margin - 14);
    doc.text(noteLines.slice(0, 3), margin + 8, y + 18, { lineHeightFactor: 1.5 });
    y += boxH + 8;
  }

  // ── Section 7d: Recommendations ─────────────────────────────────────────────
  const recommendations = generateRecommendations(data);
  if (y > pageHeight - 50) { doc.addPage(); y = margin; }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setColor(doc, C.dark, 'text');
  doc.text('DE XUAT', margin, y + 4);

  const divBandsRec = 40;
  for (let i = 0; i < divBandsRec; i++) {
    const t = i / divBandsRec;
    const r = Math.round(C.pink.r + (C.purple.r - C.pink.r) * t);
    const g = Math.round(C.pink.g + (C.purple.g - C.pink.g) * t);
    const b = Math.round(C.pink.b + (C.purple.b - C.pink.b) * t);
    doc.setFillColor(r, g, b);
    doc.rect(margin + ((pageWidth - 2 * margin) * i) / divBandsRec, y + 6, (pageWidth - 2 * margin) / divBandsRec + 0.5, 2, 'F');
  }
  y += 14;

  recommendations.forEach(item => {
    if (y > pageHeight - 20) { doc.addPage(); y = margin; }
    // Small pill bullet
    setColor(doc, C.purple, 'fill');
    doc.circle(margin + 3, y + 1, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setColor(doc, C.dark, 'text');
    doc.text(item, margin + 8, y + 3);
    y += 8;
  });
  y += 6;

  // ── Section 8: Footer on all pages ───────────────────────────────────────────
  const numPages = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let p = 1; p <= numPages; p++) {
    doc.setPage(p);
    const fY  = pageHeight - 10;
    const fH  = 12;

    // Gradient footer bar
    const fBands = 48;
    for (let i = 0; i < fBands; i++) {
      const t = i / fBands;
      const r = Math.round(C.purple.r + (C.pink.r - C.purple.r) * t);
      const g = Math.round(C.purple.g + (C.pink.g - C.purple.g) * t);
      const b = Math.round(C.purple.b + (C.pink.b - C.purple.b) * t);
      doc.setFillColor(r, g, b);
      doc.rect((pageWidth * i) / fBands, fY - 2, pageWidth / fBands + 0.5, fH, 'F');
    }

    // White text on gradient bar
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setColor(doc, C.white, 'text');
    doc.text(
      `${toASCII(config.schoolName)}  |  Generated by Shinko  |  ${formatDate(data.generatedAt)}`,
      pageWidth / 2, fY + 3, { align: 'center' }
    );
    doc.text(`Trang ${p}/${numPages}`, pageWidth - margin, fY + 3, { align: 'right' });
  }

  return doc;
}
