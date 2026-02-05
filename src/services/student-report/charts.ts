// Chart drawing functions for student reports

import type { jsPDF } from 'jspdf';
import { COLORS } from './constants';
import { toASCII } from './utils';

// Draw radar chart for skills
export function drawRadarChart(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  radius: number,
  data: { label: string; value: number; max: number }[]
) {
  const numPoints = data.length;
  const angleStep = (2 * Math.PI) / numPoints;
  const startAngle = -Math.PI / 2; // Start from top

  // Draw grid circles
  doc.setDrawColor(COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b);
  doc.setLineWidth(0.3);

  for (let i = 1; i <= 5; i++) {
    const r = (radius * i) / 5;
    doc.circle(centerX, centerY, r, 'S');
  }

  // Draw axes and labels
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);

  for (let i = 0; i < numPoints; i++) {
    const angle = startAngle + i * angleStep;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    // Draw axis line
    doc.setDrawColor(COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b);
    doc.line(centerX, centerY, x, y);

    // Draw label
    const labelRadius = radius + 8;
    const labelX = centerX + labelRadius * Math.cos(angle);
    const labelY = centerY + labelRadius * Math.sin(angle);

    let align: 'center' | 'left' | 'right' = 'center';
    if (Math.cos(angle) > 0.3) align = 'left';
    else if (Math.cos(angle) < -0.3) align = 'right';

    doc.text(toASCII(data[i].label), labelX, labelY + 1, { align });
  }

  // Draw data polygon
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < numPoints; i++) {
    const angle = startAngle + i * angleStep;
    const valuePercent = data[i].value / data[i].max;
    const r = radius * valuePercent;
    points.push({
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle),
    });
  }

  // Fill polygon
  doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  doc.setGState(doc.GState({ opacity: 0.3 }));

  if (points.length > 0) {
    doc.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      doc.lineTo(points[i].x, points[i].y);
    }
    doc.lineTo(points[0].x, points[0].y);
    doc.fill();
  }

  doc.setGState(doc.GState({ opacity: 1 }));

  // Draw polygon outline
  doc.setDrawColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  doc.setLineWidth(1);

  if (points.length > 0) {
    doc.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      doc.lineTo(points[i].x, points[i].y);
    }
    doc.lineTo(points[0].x, points[0].y);
    doc.stroke();
  }

  // Draw data points
  doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  for (const point of points) {
    doc.circle(point.x, point.y, 1.5, 'F');
  }
}
