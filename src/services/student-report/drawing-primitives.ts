// Basic drawing primitives for PDF generation

import type { jsPDF } from 'jspdf';
import { COLORS } from './constants';
import type { Color } from './constants';

// Draw rounded rectangle
export function drawRoundedRect(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  style: 'F' | 'S' | 'FD' = 'F'
) {
  doc.roundedRect(x, y, w, h, r, r, style);
}

// Draw progress bar
export function drawProgressBar(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  percent: number,
  color: Color,
  showLabel: boolean = true
) {
  // Background
  doc.setFillColor(COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b);
  drawRoundedRect(doc, x, y, width, height, height / 2);

  // Progress fill
  const fillWidth = Math.max((width * percent) / 100, height);
  doc.setFillColor(color.r, color.g, color.b);
  drawRoundedRect(doc, x, y, fillWidth, height, height / 2);

  // Label
  if (showLabel) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    const labelX = x + fillWidth / 2;
    doc.text(`${percent.toFixed(0)}%`, labelX, y + height / 2 + 1.5, { align: 'center' });
  }
}
