// Academic-style student report — formal, data-dense (Khan Academy/Canvas inspired)

import type { jsPDF } from 'jspdf';
import type { StudentReportConfig, StudentReportData } from '../../types/student-report';
import { toASCII, formatDate, getRatingLabel, generateRecommendations } from './utils';
import { DEFAULT_EVALUATION_CRITERIA } from '../../types/classroom';

// Academic color palette
const AC = {
  navy:      { r: 30,  g: 58,  b: 95  },
  darkGray:  { r: 44,  g: 62,  b: 80  },
  blue:      { r: 52,  g: 152, b: 219 },
  lightGray: { r: 236, g: 240, b: 241 },
  white:     { r: 255, g: 255, b: 255 },
  mutedText: { r: 127, g: 140, b: 141 },
  success:   { r: 39,  g: 174, b: 96  },
  warning:   { r: 243, g: 156, b: 18  },
  danger:    { r: 231, g: 76,  b: 60  },
  purple:    { r: 139, g: 92,  b: 246 },
  pink:      { r: 236, g: 72,  b: 153 },
};

function setFill(doc: jsPDF, c: { r: number; g: number; b: number }) {
  doc.setFillColor(c.r, c.g, c.b);
}
function setTxt(doc: jsPDF, c: { r: number; g: number; b: number }) {
  doc.setTextColor(c.r, c.g, c.b);
}
function setDraw(doc: jsPDF, c: { r: number; g: number; b: number }) {
  doc.setDrawColor(c.r, c.g, c.b);
}

function passColor(pct: number) {
  if (pct >= 80) return AC.success;
  if (pct >= 50) return AC.warning;
  return AC.danger;
}
function passLabel(pct: number) {
  return pct >= 50 ? 'v Dat' : 'x Chua dat';
}

function classifyScore(pct: number): string {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 65) return 'B';
  if (pct >= 50) return 'C';
  return 'D';
}

function classifyScoreLabel(pct: number): string {
  if (pct >= 90) return 'Xuat sac (A+)';
  if (pct >= 80) return 'Gioi (A)';
  if (pct >= 65) return 'Kha (B)';
  if (pct >= 50) return 'Trung binh (C)';
  return 'Yeu (D)';
}

function classifyAttendance(rate: number): string {
  if (rate >= 90) return 'Tot';
  if (rate >= 80) return 'Kha';
  if (rate >= 60) return 'Trung binh';
  return 'Yeu';
}

// Draw a subtle diagonal watermark across entire page
function drawWatermark(doc: jsPDF, pageWidth: number, pageHeight: number, text: string) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(52);
  doc.setGState(doc.GState({ opacity: 0.035 }));
  doc.setTextColor(100, 100, 120);

  // Draw at 45° angle approximated by placing text diagonally
  const cx = pageWidth / 2;
  const cy = pageHeight / 2;
  // jsPDF text angle via options — use angle if supported, else manual placements
  doc.text(text, cx, cy, { align: 'center', angle: 45 });
  doc.setGState(doc.GState({ opacity: 1 }));
}

// Draw double horizontal rule (thick + thin)
function drawDoubleRule(
  doc: jsPDF,
  x1: number,
  y: number,
  x2: number,
  thickColor: { r: number; g: number; b: number },
  thinColor: { r: number; g: number; b: number }
) {
  setDraw(doc, thickColor);
  doc.setLineWidth(1.2);
  doc.line(x1, y, x2, y);
  setDraw(doc, thinColor);
  doc.setLineWidth(0.4);
  doc.line(x1, y + 2.5, x2, y + 2.5);
}

// Draw a mini horizontal progress bar inline
function drawMiniBar(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  pct: number,
  color: { r: number; g: number; b: number }
) {
  // Track
  doc.setFillColor(220, 224, 228);
  doc.roundedRect(x, y, width, height, height / 2, height / 2, 'F');
  // Fill
  const fillW = Math.max((width * pct) / 100, height);
  doc.setFillColor(color.r, color.g, color.b);
  doc.roundedRect(x, y, fillW, height, height / 2, height / 2, 'F');
}

export async function generateAcademicReport(
  data: StudentReportData,
  config: StudentReportConfig
): Promise<jsPDF> {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF();
  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  let y = margin;

  // Watermark on first page (very subtle)
  drawWatermark(doc, pageWidth, pageHeight, 'SHINKO');

  // ── Section 1: Formal Header ─────────────────────────────────────────────────

  // "Luu hanh noi bo" stamp text in top-right corner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  setDraw(doc, AC.mutedText);
  doc.setLineWidth(0.5);
  doc.setFillColor(250, 250, 252);
  const stampW = 38;
  const stampH = 8;
  doc.rect(pageWidth - margin - stampW, y - 2, stampW, stampH, 'FD');
  setTxt(doc, AC.mutedText);
  doc.text('Luu hanh noi bo', pageWidth - margin - stampW / 2, y + 3.5, { align: 'center' });

  // Document number
  const docYear  = new Date(data.generatedAt).getFullYear().toString().slice(-2);
  const docMonth = String(new Date(data.generatedAt).getMonth() + 1).padStart(2, '0');
  const docId    = data.studentId ? data.studentId.toString().slice(-4) : '0001';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setTxt(doc, AC.mutedText);
  doc.text(`So: BC-${docYear}${docMonth}-${docId}`, margin, y + 3.5);

  y += 12;

  // School name — 18pt bold all caps
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  setTxt(doc, AC.navy);
  doc.text(toASCII(config.schoolName).toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 5;

  if (config.schoolAddress) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setTxt(doc, AC.mutedText);
    doc.text(toASCII(config.schoolAddress), pageWidth / 2, y + 2, { align: 'center' });
    y += 6;
  }

  // Double horizontal rule
  drawDoubleRule(doc, margin, y + 2, pageWidth - margin, AC.navy, { r: 100, g: 130, b: 170 });
  y += 10;

  // Report title inside bordered box
  const titleBoxW = 120;
  const titleBoxH = 12;
  const titleBoxX = pageWidth / 2 - titleBoxW / 2;
  setFill(doc, { r: 245, g: 248, b: 255 });
  setDraw(doc, AC.navy);
  doc.setLineWidth(0.8);
  doc.rect(titleBoxX, y, titleBoxW, titleBoxH, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  setTxt(doc, AC.navy);
  doc.text('BAO CAO KET QUA HOC TAP', pageWidth / 2, y + 8.5, { align: 'center' });
  y += titleBoxH + 6;

  // Thin divider
  setDraw(doc, AC.lightGray);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // ── Student Info Block: 2 rows × 4 cols ──────────────────────────────────────
  const colW    = (pageWidth - 2 * margin) / 4;
  const rowH    = 10;
  const infoFields = [
    { label: 'Ho ten',  value: toASCII(data.studentName) },
    { label: 'Lop hoc', value: toASCII(data.classroomName) },
    { label: 'Trinh do', value: toASCII(data.levelLabel) },
    { label: 'Ky hoc',  value: `${formatDate(data.periodStart)} - ${formatDate(data.periodEnd)}` },
  ];

  infoFields.forEach((field, idx) => {
    const x    = margin + idx * colW;
    const bg   = idx % 2 === 0 ? { r: 234, g: 240, b: 248 } : { r: 244, g: 247, b: 252 };
    setFill(doc, bg);
    setDraw(doc, { r: 200, g: 210, b: 225 });
    doc.setLineWidth(0.3);
    doc.rect(x, y, colW, rowH, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    setTxt(doc, AC.mutedText);
    doc.text(field.label, x + colW / 2, y + 4, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setTxt(doc, AC.darkGray);
    const maxW = colW - 4;
    const vals = doc.splitTextToSize(field.value, maxW);
    doc.text(vals[0], x + colW / 2, y + rowH - 2, { align: 'center' });
  });

  y += rowH + 8;

  // ── Section 2: Performance Summary Table ─────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  setTxt(doc, AC.navy);
  doc.text('I. TONG KET KET QUA', margin, y);
  y += 5;

  const avg      = data.grades?.averagePercent ?? 0;
  const attRate  = data.attendance?.attendanceRate ?? 0;
  const evalTotal = DEFAULT_EVALUATION_CRITERIA.reduce((s, c) => s + (data.evaluation?.ratings[c.id] || 0), 0);
  const evalMax   = DEFAULT_EVALUATION_CRITERIA.reduce((s, c) => s + c.maxPoints, 0);
  const evalPct   = evalMax > 0 ? (evalTotal / evalMax) * 100 : 0;

  const classAvgDisplay = data.classAverage !== undefined ? `${data.classAverage.toFixed(1)}%` : '-';
  const perfRows = [
    ['Diem trung binh',    `${avg.toFixed(1)}%`,     classAvgDisplay, '50%', passLabel(avg),    passColor(avg),    avg],
    ['Ty le chuyen can',   `${attRate.toFixed(1)}%`, '-',              '80%', passLabel(attRate), passColor(attRate), attRate],
    ['So bai hoan thanh',
      data.grades ? `${data.grades.assignmentsCompleted}/${data.grades.assignmentsCompleted + (data.grades.submissions?.filter(s => !s.submittedAt).length || 0)}` : 'N/A',
      '-', '-', '-', AC.mutedText, 0],
    ['Danh gia chung',
      data.evaluation ? `${evalTotal}/${evalMax} (${evalPct.toFixed(0)}%)` : 'N/A',
      '-', '-', passLabel(evalPct), passColor(evalPct), evalPct],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Chi tieu', 'Ket qua', 'TB Lop', 'Muc tieu', 'Xep loai', 'Dat/Chua dat']],
    body: perfRows.map(r => [r[0], r[1], r[2], r[3], classifyScore(r[6] as number), r[4]]) as import('jspdf-autotable').RowInput[],
    theme: 'grid',
    headStyles: {
      fillColor: [AC.navy.r, AC.navy.g, AC.navy.b],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      cellPadding: 3,
    },
    bodyStyles: { fontSize: 8.5, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 'auto', fontStyle: 'bold' },
      1: { halign: 'center', cellWidth: 28 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
      5: { halign: 'center', cellWidth: 28 },
    },
    didParseCell: (hookData) => {
      if (hookData.section === 'body') {
        if (hookData.column.index === 4) {
          const grade = hookData.cell.raw as string;
          if (grade === 'A+' || grade === 'A') hookData.cell.styles.textColor = [AC.success.r, AC.success.g, AC.success.b];
          else if (grade === 'B') hookData.cell.styles.textColor = [52, 152, 219];
          else if (grade === 'C') hookData.cell.styles.textColor = [AC.warning.r, AC.warning.g, AC.warning.b];
          else hookData.cell.styles.textColor = [AC.danger.r, AC.danger.g, AC.danger.b];
        }
        if (hookData.column.index === 5) {
          const row = perfRows[hookData.row.index];
          if (row) {
            const col = row[5] as { r: number; g: number; b: number };
            hookData.cell.styles.textColor = [col.r, col.g, col.b];
            hookData.cell.styles.fontStyle = 'bold';
          }
        }
      }
    },
    margin: { left: margin, right: margin },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── Section 3: Attendance Detail ─────────────────────────────────────────────
  if (config.showAttendance && data.attendance) {
    if (y > pageHeight - 65) { doc.addPage(); y = margin; drawWatermark(doc, pageWidth, pageHeight, 'SHINKO'); }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setTxt(doc, AC.navy);
    doc.text('II. THONG KE DIEM DANH', margin, y);
    y += 5;

    const att = data.attendance;
    autoTable(doc, {
      startY: y,
      head: [['Co mat', 'Di muon', 'Vang khong phep', 'Vang co phep', 'Tong so buoi', 'Ty le']],
      body: [[
        att.present.toString(),
        att.late.toString(),
        att.absent.toString(),
        att.excused.toString(),
        att.totalSessions.toString(),
        `${att.attendanceRate.toFixed(1)}%`,
      ]],
      theme: 'grid',
      headStyles: {
        fillColor: [AC.blue.r, AC.blue.g, AC.blue.b],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
        cellPadding: 2.5,
      },
      bodyStyles: { fontSize: 9, cellPadding: 3, halign: 'center' },
      didParseCell: (hookData) => {
        if (hookData.section === 'body') {
          if (hookData.column.index === 0) {
            // green for present
            hookData.cell.styles.textColor = [AC.success.r, AC.success.g, AC.success.b];
            hookData.cell.styles.fontStyle = 'bold';
          } else if (hookData.column.index === 2) {
            // red for absent
            hookData.cell.styles.textColor = [AC.danger.r, AC.danger.g, AC.danger.b];
            hookData.cell.styles.fontStyle = 'bold';
          } else if (hookData.column.index === 5) {
            hookData.cell.styles.fontStyle = 'bold';
          }
        }
      },
      margin: { left: margin, right: margin },
    });

    const attTableEndY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

    // Attendance visual bar below table
    const barX = margin;
    const barY = attTableEndY + 3;
    const barW = pageWidth - 2 * margin;
    const barH = 5;
    drawMiniBar(doc, barX, barY, barW, barH, att.attendanceRate, passColor(att.attendanceRate));

    // Attendance evaluation label
    const attLabel = classifyAttendance(att.attendanceRate);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setTxt(doc, passColor(att.attendanceRate));
    doc.text(`Danh gia chuyen can: ${attLabel} (${att.attendanceRate.toFixed(0)}%)`, margin, barY + barH + 6);

    y = barY + barH + 14;
  }

  // ── Section 4: Grade Detail Table ────────────────────────────────────────────
  if (config.showGrades && data.grades && data.grades.submissions && data.grades.submissions.length > 0) {
    if (y > pageHeight - 75) { doc.addPage(); y = margin; drawWatermark(doc, pageWidth, pageHeight, 'SHINKO'); }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setTxt(doc, AC.navy);
    doc.text('III. CHI TIET DIEM SO', margin, y);
    y += 5;

    const sorted = [...data.grades.submissions]
      .filter(s => s.submittedAt)
      .sort((a, b) => new Date(a.submittedAt!).getTime() - new Date(b.submittedAt!).getTime());

    const gradeRows = sorted.map((sub, idx) => {
      const pct   = (sub.score / sub.totalPoints) * 100;
      const rank  = classifyScore(pct);
      return [
        (idx + 1).toString(),
        toASCII(sub.testId.length > 25 ? sub.testId.substring(0, 23) + '..' : sub.testId),
        (sub as Record<string, unknown>)['type'] === 'test' ? 'Kiem tra' : 'Bai tap',
        `${sub.score}/${sub.totalPoints}`,
        `${pct.toFixed(0)}%`,
        rank,
        sub.submittedAt ? formatDate(sub.submittedAt) : '-',
      ];
    });

    // Average row
    const avgPct = data.grades.averagePercent;
    gradeRows.push([
      '', 'TRUNG BINH', '', `${data.grades.totalScore}/${data.grades.totalPoints}`,
      `${avgPct.toFixed(0)}%`, classifyScore(avgPct), '',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['#', 'Bai', 'Loai', 'Diem', '%', 'Xep loai', 'Ngay nop']],
      body: gradeRows,
      theme: 'striped',
      headStyles: {
        fillColor: [AC.darkGray.r, AC.darkGray.g, AC.darkGray.b],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 2,
      },
      bodyStyles: { fontSize: 8, cellPadding: 2 },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      columnStyles: {
        0: { cellWidth: 10,  halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 24,  halign: 'center' },
        3: { cellWidth: 22,  halign: 'center' },
        4: { cellWidth: 14,  halign: 'center' },
        5: { cellWidth: 16,  halign: 'center', fontStyle: 'bold' },
        6: { cellWidth: 26,  halign: 'center' },
      },
      didParseCell: (hookData) => {
        const lastRow = gradeRows.length - 1;
        if (hookData.section === 'body' && hookData.row.index === lastRow) {
          hookData.cell.styles.fontStyle = 'bold';
          hookData.cell.styles.fillColor = [AC.navy.r, AC.navy.g, AC.navy.b];
          hookData.cell.styles.textColor = [255, 255, 255];
        }
        if (hookData.section === 'body' && hookData.row.index < lastRow) {
          if (hookData.column.index === 4) {
            const pct = parseFloat((hookData.cell.raw as string).replace('%', ''));
            const col = passColor(pct);
            hookData.cell.styles.textColor = [col.r, col.g, col.b];
            hookData.cell.styles.fontStyle = 'bold';
          }
          if (hookData.column.index === 5) {
            const grade = hookData.cell.raw as string;
            if (grade === 'A+' || grade === 'A') hookData.cell.styles.textColor = [AC.success.r, AC.success.g, AC.success.b];
            else if (grade === 'B') hookData.cell.styles.textColor = [52, 152, 219];
            else if (grade === 'C') hookData.cell.styles.textColor = [AC.warning.r, AC.warning.g, AC.warning.b];
            else hookData.cell.styles.textColor = [AC.danger.r, AC.danger.g, AC.danger.b];
          }
        }
      },
      margin: { left: margin, right: margin },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // ── Section 5: Evaluation Summary ────────────────────────────────────────────
  if (config.showEvaluation && data.evaluation) {
    if (y > pageHeight - 90) { doc.addPage(); y = margin; drawWatermark(doc, pageWidth, pageHeight, 'SHINKO'); }

    // Purple section header
    setFill(doc, AC.purple);
    doc.roundedRect(margin, y - 1, pageWidth - 2 * margin, 13, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setTxt(doc, AC.white);
    doc.text('IV. DANH GIA CHI TIET', margin + 4, y + 7.5);

    // Star rating visualization (5 stars)
    const rating = data.evaluation.overallRating;
    const starX  = pageWidth - margin - 40;
    doc.setFontSize(8);
    for (let s = 1; s <= 5; s++) {
      const sx = starX + (s - 1) * 7.5;
      if (s <= rating) {
        doc.setTextColor(255, 215, 0);
        doc.text('*', sx, y + 8);
      } else {
        doc.setTextColor(200, 200, 220);
        doc.text('*', sx, y + 8);
      }
    }
    doc.setFontSize(7);
    setTxt(doc, AC.white);
    doc.text(`${rating}/5`, pageWidth - margin - 2, y + 8, { align: 'right' });

    y += 16;

    const criteriaRows = DEFAULT_EVALUATION_CRITERIA.map(c => {
      const score = data.evaluation?.ratings[c.id] || 0;
      const pct   = (score / c.maxPoints) * 100;
      return [
        toASCII(c.name),
        score.toString(),
        c.maxPoints.toString(),
        `${pct.toFixed(0)}%`,
        classifyScore(pct),
      ];
    });

    const evalTotalScore = DEFAULT_EVALUATION_CRITERIA.reduce(
      (s, c) => s + (data.evaluation?.ratings[c.id] || 0), 0
    );
    const evalMaxScore = DEFAULT_EVALUATION_CRITERIA.reduce((s, c) => s + c.maxPoints, 0);
    const evalFinalPct  = evalMaxScore > 0 ? (evalTotalScore / evalMaxScore) * 100 : 0;
    criteriaRows.push([
      'TONG DIEM', evalTotalScore.toString(), evalMaxScore.toString(),
      `${evalFinalPct.toFixed(0)}%`, classifyScore(evalFinalPct),
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Tieu chi', 'Diem', 'Toi da', '%', 'Xep loai']],
      body: criteriaRows,
      theme: 'grid',
      headStyles: {
        fillColor: [155, 89, 182],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 2.5,
      },
      bodyStyles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      },
      didParseCell: (hookData) => {
        const lastRow = criteriaRows.length - 1;
        if (hookData.section === 'body' && hookData.row.index === lastRow) {
          hookData.cell.styles.fontStyle = 'bold';
          hookData.cell.styles.fillColor = [AC.navy.r, AC.navy.g, AC.navy.b];
          hookData.cell.styles.textColor = [255, 255, 255];
        }
        if (hookData.section === 'body' && hookData.row.index < lastRow && hookData.column.index === 4) {
          const grade = hookData.cell.raw as string;
          if (grade === 'A+' || grade === 'A') hookData.cell.styles.textColor = [AC.success.r, AC.success.g, AC.success.b];
          else if (grade === 'B') hookData.cell.styles.textColor = [52, 152, 219];
          else if (grade === 'C') hookData.cell.styles.textColor = [AC.warning.r, AC.warning.g, AC.warning.b];
          else hookData.cell.styles.textColor = [AC.danger.r, AC.danger.g, AC.danger.b];
        }
      },
      margin: { left: margin, right: margin },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

    // Overall rating label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setTxt(doc, AC.darkGray);
    doc.text(
      `Xep loai tong the: ${getRatingLabel(data.evaluation.overallRating)} — ${classifyScoreLabel(evalFinalPct)}`,
      margin, y + 5
    );
    y += 10;

    // Comment paragraph
    if (data.evaluation.comment) {
      if (y > pageHeight - 45) { doc.addPage(); y = margin; drawWatermark(doc, pageWidth, pageHeight, 'SHINKO'); }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      setTxt(doc, AC.navy);
      doc.text('Nhan xet chi tiet:', margin, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      setTxt(doc, AC.darkGray);
      const cLines = doc.splitTextToSize(toASCII(data.evaluation.comment), pageWidth - 2 * margin);
      doc.text(cLines.slice(0, 4), margin, y);
      y += cLines.slice(0, 4).length * 5 + 4;
    }

    // Strengths & improvements panels
    const hasSI = data.evaluation.strengths || data.evaluation.improvements;
    if (hasSI) {
      if (y > pageHeight - 35) { doc.addPage(); y = margin; drawWatermark(doc, pageWidth, pageHeight, 'SHINKO'); }
      const halfW = (pageWidth - 2 * margin - 6) / 2;

      if (data.evaluation.strengths) {
        // Green left-border panel
        doc.setFillColor(240, 253, 244);
        doc.roundedRect(margin, y, halfW, 22, 3, 3, 'F');
        doc.setFillColor(AC.success.r, AC.success.g, AC.success.b);
        doc.rect(margin, y, 3, 22, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        setTxt(doc, AC.success);
        doc.text('v Diem manh:', margin + 6, y + 6);
        doc.setFont('helvetica', 'normal');
        setTxt(doc, AC.darkGray);
        doc.setFontSize(7.5);
        const sLines = doc.splitTextToSize(toASCII(data.evaluation.strengths), halfW - 10);
        doc.text(sLines.slice(0, 3), margin + 6, y + 12);
      }

      if (data.evaluation.improvements) {
        const impX = margin + halfW + 6;
        // Orange left-border panel
        doc.setFillColor(255, 251, 235);
        doc.roundedRect(impX, y, halfW, 22, 3, 3, 'F');
        doc.setFillColor(AC.warning.r, AC.warning.g, AC.warning.b);
        doc.rect(impX, y, 3, 22, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        setTxt(doc, AC.warning);
        doc.text('^ Can cai thien:', impX + 6, y + 6);
        doc.setFont('helvetica', 'normal');
        setTxt(doc, AC.darkGray);
        doc.setFontSize(7.5);
        const iLines = doc.splitTextToSize(toASCII(data.evaluation.improvements), halfW - 10);
        doc.text(iLines.slice(0, 3), impX + 6, y + 12);
      }

      y += 28;
    }
  }

  // ── Section 5b: Custom Teacher Note ─────────────────────────────────────────
  if (data.customNote) {
    if (y > pageHeight - 40) { doc.addPage(); y = margin; drawWatermark(doc, pageWidth, pageHeight, 'SHINKO'); }

    const noteBoxH = 28;
    setFill(doc, { r: 240, g: 248, b: 255 });
    setDraw(doc, AC.blue);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, noteBoxH, 3, 3, 'FD');
    setFill(doc, AC.blue);
    doc.rect(margin, y, 4, noteBoxH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    setTxt(doc, AC.blue);
    doc.text('Ghi chu them cua giao vien:', margin + 7, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    setTxt(doc, AC.darkGray);
    const noteLines = doc.splitTextToSize(toASCII(data.customNote), pageWidth - 2 * margin - 12);
    doc.text(noteLines.slice(0, 3), margin + 7, y + 14);
    y += noteBoxH + 8;
  }

  // ── Section 5c: Recommendations ─────────────────────────────────────────────
  {
    if (y > pageHeight - 50) { doc.addPage(); y = margin; drawWatermark(doc, pageWidth, pageHeight, 'SHINKO'); }
    const recs = generateRecommendations(data);
    const recH = 12 + recs.length * 8 + 6;
    const recBoxH = Math.max(recH, 26);

    setFill(doc, { r: 245, g: 247, b: 250 });
    setDraw(doc, AC.purple);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, recBoxH, 3, 3, 'FD');
    setFill(doc, AC.purple);
    doc.rect(margin, y, 4, recBoxH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    setTxt(doc, AC.purple);
    doc.text('DE XUAT:', margin + 7, y + 7);

    let recY = y + 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setTxt(doc, AC.darkGray);
    recs.forEach(item => {
      if (recY > y + recBoxH - 4) return;
      doc.text(`- ${item}`, margin + 9, recY);
      recY += 8;
    });
    y += recBoxH + 8;
  }

  // ── Section 6: Recommendation ────────────────────────────────────────────────
  if (y > pageHeight - 45) { doc.addPage(); y = margin; drawWatermark(doc, pageWidth, pageHeight, 'SHINKO'); }

  const avgFinal = data.grades?.averagePercent ?? 0;
  const attFinal = data.attendance?.attendanceRate ?? 100;

  let recText = 'Tiep tuc phat huy tinh than hoc tap. Hoc vien da hoan thanh tot ky hoc.';
  if (attFinal < 80)   recText = 'Can cai thien ty le chuyen can. Vui long tham du day du cac buoi hoc de dat ket qua tot hon.';
  else if (avgFinal < 50) recText = 'Can no luc them trong hoc tap. De nghi hoc vien on tap va lam bai tap day du. Lien he giao vien de duoc ho tro.';
  else if (avgFinal >= 90) recText = 'Thanh tich xuat sac! Hoc vien the hien kha nang vuot troi. Khich le tiep tuc phat huy va tham gia cac hoat dong nang cao.';
  else if (avgFinal >= 80) recText = 'Hoc vien co thanh tich tot trong ky hoc nay. Tiep tuc phat huy tinh than hoc tap va cam giac tu tin de dat nhung muc tieu cao hon.';

  const recBoxH = 24;
  // Formal gray bg with navy left border
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, recBoxH, 3, 3, 'F');
  setDraw(doc, AC.navy);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, recBoxH, 3, 3, 'S');
  // Navy left accent bar
  doc.setFillColor(AC.navy.r, AC.navy.g, AC.navy.b);
  doc.roundedRect(margin, y, 4, recBoxH, 3, 3, 'F');
  doc.rect(margin + 2, y, 2, recBoxH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  setTxt(doc, AC.navy);
  doc.text('V. NHAN XET VA DE XUAT', margin + 8, y + 7);
  const perfClass = classifyScoreLabel(avgFinal);
  doc.setFontSize(7.5);
  setTxt(doc, passColor(avgFinal));
  doc.text(`Xep loai: ${perfClass}`, pageWidth - margin - 4, y + 7, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  setTxt(doc, AC.darkGray);
  const recLines = doc.splitTextToSize(recText, pageWidth - 2 * margin - 14);
  doc.text(recLines.slice(0, 2), margin + 8, y + 14);
  y += recBoxH + 10;

  // ── Section 7: Signatures ────────────────────────────────────────────────────
  if (config.showSignatures) {
    if (y > pageHeight - 48) { doc.addPage(); y = margin; drawWatermark(doc, pageWidth, pageHeight, 'SHINKO'); }

    const sigW      = (pageWidth - 2 * margin - 10) / 3;
    const sigLabels = ['Giao vien', 'Phu huynh', 'Hoc vien'];
    const sigTitles = ['Giao vien phu trach', 'Xac nhan phu huynh', 'Hoc vien ky ten'];
    const sigNames  = [toASCII(data.teacherName), '', toASCII(data.studentName)];

    sigLabels.forEach((label, idx) => {
      const x = margin + idx * (sigW + 5);

      // Signature column box
      doc.setFillColor(250, 251, 253);
      setDraw(doc, { r: 210, g: 218, b: 230 });
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, sigW, 40, 3, 3, 'FD');

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      setTxt(doc, AC.navy);
      doc.text(label, x + sigW / 2, y + 7, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      setTxt(doc, AC.mutedText);
      doc.text(sigTitles[idx], x + sigW / 2, y + 12, { align: 'center' });

      // Seal/stamp circle for teacher (col 0)
      if (idx === 0) {
        setDraw(doc, { r: 200, g: 200, b: 215 });
        doc.setLineWidth(0.5);
        doc.setLineDashPattern([1.5, 1.5], 0);
        doc.circle(x + sigW / 2, y + 24, 8, 'S');
        doc.setLineDashPattern([], 0);
        doc.setFontSize(5.5);
        setTxt(doc, AC.mutedText);
        doc.text('XAC NHAN', x + sigW / 2, y + 25, { align: 'center' });
      }

      // Dotted signature line
      setDraw(doc, AC.mutedText);
      doc.setLineWidth(0.5);
      doc.setLineDashPattern([1, 2], 0);
      doc.line(x + 5, y + 32, x + sigW - 5, y + 32);
      doc.setLineDashPattern([], 0);

      // Name & date
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      setTxt(doc, AC.darkGray);
      if (sigNames[idx]) doc.text(sigNames[idx], x + sigW / 2, y + 36.5, { align: 'center' });

      doc.setFontSize(6.5);
      setTxt(doc, AC.mutedText);
      doc.text(`Ngay: ${formatDate(data.generatedAt)}`, x + sigW / 2, y + 39.5, { align: 'center' });
    });

    y += 48;
  }

  // ── Section 8: Footer on all pages ───────────────────────────────────────────
  const numPages = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let p = 1; p <= numPages; p++) {
    doc.setPage(p);
    const fY = pageHeight - 12;

    // Double footer rule (thin + thick) matching header style
    setDraw(doc, { r: 100, g: 130, b: 170 });
    doc.setLineWidth(0.4);
    doc.line(margin, fY - 5, pageWidth - margin, fY - 5);
    setDraw(doc, AC.navy);
    doc.setLineWidth(1.0);
    doc.line(margin, fY - 3, pageWidth - margin, fY - 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setTxt(doc, AC.mutedText);
    doc.text(
      `${toASCII(config.schoolName)}  |  Bao cao hoc tap  |  Tai lieu mat - Khong sao chep`,
      margin, fY + 1
    );
    doc.text(`Trang ${p}/${numPages}  |  ${formatDate(data.generatedAt)}`, pageWidth - margin, fY + 1, { align: 'right' });
  }

  return doc;
}
