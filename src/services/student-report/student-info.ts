// Student info card rendering for report PDF

import type { jsPDF } from 'jspdf';
import type { StudentReportData } from '../../types/student-report';
import { COLORS } from './constants';
import { drawRoundedRect } from './drawing-primitives';
import { toASCII, formatDate } from './utils';

export function renderStudentInfo(
  doc: jsPDF,
  data: StudentReportData,
  pageWidth: number,
  margin: number,
  yPos: number
): number {
  const infoCardHeight = 28;

  // Card shadow effect
  doc.setFillColor(COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b);
  doc.setGState(doc.GState({ opacity: 0.3 }));
  drawRoundedRect(doc, margin + 1, yPos + 1, pageWidth - 2 * margin, infoCardHeight, 4);
  doc.setGState(doc.GState({ opacity: 1 }));

  // Card background
  doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  drawRoundedRect(doc, margin, yPos, pageWidth - 2 * margin, infoCardHeight, 4);

  // Left accent
  doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  drawRoundedRect(doc, margin, yPos, 4, infoCardHeight, 2);

  // Student avatar circle
  const avatarX = margin + 18;
  const avatarY = yPos + infoCardHeight / 2;
  doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  doc.setGState(doc.GState({ opacity: 0.15 }));
  doc.circle(avatarX, avatarY, 10, 'F');
  doc.setGState(doc.GState({ opacity: 1 }));

  // Avatar icon (user silhouette using text)
  doc.setFontSize(12);
  doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  doc.text('HV', avatarX, avatarY + 2, { align: 'center' });

  // Student name
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.text(toASCII(data.studentName), margin + 32, yPos + 10);

  // Info row
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);

  const infoItems = [
    `Lop: ${toASCII(data.classroomName)}`,
    `Trinh do: ${toASCII(data.levelLabel)}`,
    `Ky hoc: ${formatDate(data.periodStart)} - ${formatDate(data.periodEnd)}`,
  ];
  doc.text(infoItems.join('    |    '), margin + 32, yPos + 18);

  // Period badge
  const periodBadgeWidth = 50;
  doc.setFillColor(COLORS.primaryLight.r, COLORS.primaryLight.g, COLORS.primaryLight.b);
  doc.setGState(doc.GState({ opacity: 0.15 }));
  drawRoundedRect(doc, pageWidth - margin - periodBadgeWidth - 5, yPos + 5, periodBadgeWidth, 18, 3);
  doc.setGState(doc.GState({ opacity: 1 }));

  doc.setFontSize(7);
  doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  doc.text('Ky hoc', pageWidth - margin - periodBadgeWidth / 2 - 5, yPos + 11, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const periodDays = Math.ceil(
    (new Date(data.periodEnd).getTime() - new Date(data.periodStart).getTime()) / (1000 * 60 * 60 * 24)
  );
  doc.text(`${periodDays} ngay`, pageWidth - margin - periodBadgeWidth / 2 - 5, yPos + 19, {
    align: 'center'
  });

  return yPos + infoCardHeight + 10;
}
