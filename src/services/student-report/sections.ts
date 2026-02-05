// Section rendering functions (attendance, grades, evaluation)

import type { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { StudentReportData } from '../../types/student-report';
import { COLORS } from './constants';
import { drawSectionHeader } from './components';
import { drawRoundedRect, drawProgressBar } from './drawing-primitives';
import { toASCII, getPercentColor } from './utils';

export function renderAttendanceSection(
  doc: jsPDF,
  data: StudentReportData,
  pageWidth: number,
  margin: number,
  yPos: number
): number {
  if (!data.attendance) return yPos;

  yPos = drawSectionHeader(doc, yPos, 'I. DIEM DANH', COLORS.attendance, pageWidth, margin);

  // Attendance stats grid
  const attStatWidth = (pageWidth - 2 * margin - 15) / 4;
  const attStatHeight = 18;

  const attStats = [
    { label: 'Tong buoi', value: data.attendance.totalSessions, color: COLORS.gray },
    { label: 'Co mat', value: data.attendance.present, color: COLORS.success },
    { label: 'Di muon', value: data.attendance.late, color: COLORS.warning },
    { label: 'Vang mat', value: data.attendance.absent + data.attendance.excused, color: COLORS.danger },
  ];

  attStats.forEach((stat, idx) => {
    const x = margin + idx * (attStatWidth + 5);

    // Mini card
    doc.setFillColor(COLORS.background.r, COLORS.background.g, COLORS.background.b);
    drawRoundedRect(doc, x, yPos, attStatWidth, attStatHeight, 3);

    // Value
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(stat.color.r, stat.color.g, stat.color.b);
    doc.text(stat.value.toString(), x + attStatWidth / 2, yPos + 8, { align: 'center' });

    // Label
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.text(toASCII(stat.label), x + attStatWidth / 2, yPos + 14, { align: 'center' });
  });

  yPos += attStatHeight + 6;

  // Attendance progress bar
  const attPercent = data.attendance.attendanceRate;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.text(toASCII('Ty le chuyen can:'), margin, yPos + 4);

  drawProgressBar(
    doc,
    margin + 45,
    yPos,
    pageWidth - 2 * margin - 45,
    6,
    attPercent,
    getPercentColor(attPercent),
    true
  );

  return yPos + 14;
}

export function renderGradesSection(
  doc: jsPDF,
  data: StudentReportData,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  yPos: number
): number {
  if (!data.grades) return yPos;

  // Check page break
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = margin;
  }

  yPos = drawSectionHeader(doc, yPos, 'II. KET QUA HOC TAP', COLORS.grades, pageWidth, margin);

  // Grade summary row
  const gradeStatWidth = (pageWidth - 2 * margin - 10) / 3;
  const gradeStatHeight = 20;

  const gradeStats = [
    { label: 'Bai kiem tra', value: data.grades.testsCompleted.toString() },
    { label: 'Bai tap', value: data.grades.assignmentsCompleted.toString() },
    { label: 'Tong diem', value: `${data.grades.totalScore}/${data.grades.totalPoints}` },
  ];

  gradeStats.forEach((stat, idx) => {
    const x = margin + idx * (gradeStatWidth + 5);

    doc.setFillColor(COLORS.background.r, COLORS.background.g, COLORS.background.b);
    drawRoundedRect(doc, x, yPos, gradeStatWidth, gradeStatHeight, 3);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.grades.r, COLORS.grades.g, COLORS.grades.b);
    doc.text(stat.value, x + gradeStatWidth / 2, yPos + 8, { align: 'center' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.text(toASCII(stat.label), x + gradeStatWidth / 2, yPos + 15, { align: 'center' });
  });

  yPos += gradeStatHeight + 6;

  // Average progress bar
  const avgPercent = data.grades.averagePercent;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.text(toASCII('Diem trung binh:'), margin, yPos + 4);

  drawProgressBar(
    doc,
    margin + 40,
    yPos,
    pageWidth - 2 * margin - 40,
    6,
    avgPercent,
    getPercentColor(avgPercent),
    true
  );

  yPos += 12;

  // Submissions table
  if (data.grades.submissions && data.grades.submissions.length > 0) {
    const submittedItems = data.grades.submissions
      .filter(s => s.submittedAt)
      .slice(0, 8);

    if (submittedItems.length > 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
      doc.text(toASCII('Chi tiet bai lam:'), margin, yPos);
      yPos += 4;

      const tableData = submittedItems.map((sub, idx) => {
        const percent = (sub.score / sub.totalPoints) * 100;
        return [
          (idx + 1).toString(),
          toASCII(sub.testId.length > 20 ? sub.testId.substring(0, 20) + '...' : sub.testId),
          `${sub.score}/${sub.totalPoints}`,
          `${percent.toFixed(0)}%`,
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['#', toASCII('Bai lam'), toASCII('Diem'), '%']],
        body: tableData,
        theme: 'plain',
        headStyles: {
          fillColor: [COLORS.grades.r, COLORS.grades.g, COLORS.grades.b],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: 2,
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 2,
        },
        alternateRowStyles: {
          fillColor: [COLORS.background.r, COLORS.background.g, COLORS.background.b],
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
        },
        margin: { left: margin, right: margin },
      });

      yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }
  }

  return yPos;
}
