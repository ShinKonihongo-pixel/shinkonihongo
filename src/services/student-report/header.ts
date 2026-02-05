// Header section rendering for student report PDF

import type { jsPDF } from 'jspdf';
import type { StudentReportConfig } from '../../types/student-report';
import { COLORS } from './constants';
import { drawRoundedRect } from './drawing-primitives';
import { toASCII } from './utils';

export function renderHeader(
  doc: jsPDF,
  config: StudentReportConfig,
  pageWidth: number,
  margin: number
): number {
  const headerHeight = 50;

  // Create gradient effect with multiple rectangles
  for (let i = 0; i < headerHeight; i++) {
    const ratio = i / headerHeight;
    const r = COLORS.primary.r + (COLORS.primaryLight.r - COLORS.primary.r) * ratio * 0.5;
    const g = COLORS.primary.g + (COLORS.primaryLight.g - COLORS.primary.g) * ratio * 0.5;
    const b = COLORS.primary.b + (COLORS.primaryLight.b - COLORS.primary.b) * ratio * 0.5;
    doc.setFillColor(r, g, b);
    doc.rect(0, i, pageWidth, 1, 'F');
  }

  // Decorative circles in header
  doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.setGState(doc.GState({ opacity: 0.1 }));
  doc.circle(pageWidth - 20, 10, 30, 'F');
  doc.circle(pageWidth - 50, 40, 20, 'F');
  doc.setGState(doc.GState({ opacity: 1 }));

  // School logo placeholder
  const logoX = margin;
  const logoY = 8;
  const logoSize = 32;

  if (config.schoolLogo) {
    try {
      doc.addImage(config.schoolLogo, 'PNG', logoX, logoY, logoSize, logoSize);
    } catch {
      // Draw placeholder circle
      doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
      doc.setGState(doc.GState({ opacity: 0.2 }));
      doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 'F');
      doc.setGState(doc.GState({ opacity: 1 }));
    }
  }

  // School name
  const textX = config.schoolLogo ? logoX + logoSize + 8 : margin;
  doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(toASCII(config.schoolName.toUpperCase()), textX, 18);

  // School contact info
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const contactParts: string[] = [];
  if (config.schoolAddress) contactParts.push(toASCII(config.schoolAddress));
  if (config.schoolPhone) contactParts.push(`Tel: ${config.schoolPhone}`);
  if (config.schoolEmail) contactParts.push(config.schoolEmail);
  if (contactParts.length > 0) {
    doc.text(contactParts.join('  |  '), textX, 26);
  }

  // Report title badge
  doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.setGState(doc.GState({ opacity: 0.95 }));
  const titleBadgeWidth = 90;
  const titleBadgeHeight = 10;
  const titleBadgeX = textX;
  const titleBadgeY = 32;
  drawRoundedRect(doc, titleBadgeX, titleBadgeY, titleBadgeWidth, titleBadgeHeight, 2);
  doc.setGState(doc.GState({ opacity: 1 }));

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  doc.text(toASCII(config.reportTitle), titleBadgeX + titleBadgeWidth / 2, titleBadgeY + 6.5, {
    align: 'center'
  });

  return headerHeight + 8;
}
