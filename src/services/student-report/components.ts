// Reusable PDF components for student reports

import type { jsPDF } from 'jspdf';
import { COLORS } from './constants';
import type { Color } from './constants';
import { drawRoundedRect } from './drawing-primitives';
import { toASCII } from './utils';

// Draw stat card
export function drawStatCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: string,
  color: Color,
  icon?: string
) {
  // Card background
  doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  drawRoundedRect(doc, x, y, width, height, 3);

  // Left accent bar
  doc.setFillColor(color.r, color.g, color.b);
  drawRoundedRect(doc, x, y, 3, height, 1.5);

  // Icon area (circle)
  const iconSize = 8;
  const iconX = x + 10;
  const iconY = y + height / 2;
  doc.setFillColor(color.r, color.g, color.b);
  doc.setGState(doc.GState({ opacity: 0.15 }));
  doc.circle(iconX, iconY, iconSize, 'F');
  doc.setGState(doc.GState({ opacity: 1 }));

  // Icon text
  if (icon) {
    doc.setFontSize(10);
    doc.setTextColor(color.r, color.g, color.b);
    doc.text(icon, iconX, iconY + 1.5, { align: 'center' });
  }

  // Label
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  doc.text(toASCII(label), x + 22, y + height / 2 - 2);

  // Value
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.text(value, x + 22, y + height / 2 + 5);
}

// Draw section header
export function drawSectionHeader(
  doc: jsPDF,
  y: number,
  title: string,
  color: Color,
  pageWidth: number,
  margin: number
) {
  // Icon circle
  doc.setFillColor(color.r, color.g, color.b);
  doc.circle(margin + 4, y + 2, 4, 'F');

  // Title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(color.r, color.g, color.b);
  doc.text(toASCII(title), margin + 12, y + 4);

  // Underline
  doc.setDrawColor(color.r, color.g, color.b);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 8, pageWidth - margin, y + 8);

  return y + 14;
}
