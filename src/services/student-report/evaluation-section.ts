// Evaluation section rendering

import type { jsPDF } from 'jspdf';
import type { StudentReportData } from '../../types/student-report';
import { COLORS } from './constants';
import { drawSectionHeader } from './components';
import { drawRoundedRect, drawProgressBar } from './drawing-primitives';
import { drawRadarChart } from './charts';
import { toASCII, getPercentColor, getEvaluationLevel, getRatingLabel } from './utils';
import { DEFAULT_EVALUATION_CRITERIA } from '../../types/classroom';

export function renderEvaluationSection(
  doc: jsPDF,
  data: StudentReportData,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  yPos: number
): number {
  if (!data.evaluation) return yPos;

  // Check page break
  if (yPos > pageHeight - 120) {
    doc.addPage();
    yPos = margin;
  }

  yPos = drawSectionHeader(doc, yPos, 'III. DANH GIA CHI TIET', COLORS.evaluation, pageWidth, margin);

  // Prepare radar chart data
  const radarData = DEFAULT_EVALUATION_CRITERIA.slice(0, 6).map(criteria => ({
    label: criteria.name.length > 10 ? criteria.name.substring(0, 8) + '..' : criteria.name,
    value: data.evaluation?.ratings[criteria.id] || 0,
    max: criteria.maxPoints,
  }));

  // Two column layout: Radar chart + Score list
  const chartWidth = 70;
  const chartCenterX = margin + chartWidth / 2 + 5;
  const chartCenterY = yPos + 35;
  const chartRadius = 25;

  // Draw radar chart
  drawRadarChart(doc, chartCenterX, chartCenterY, chartRadius, radarData);

  // Score list on the right
  const scoreListX = margin + chartWidth + 15;
  const scoreListWidth = pageWidth - margin - scoreListX;
  let scoreY = yPos;

  // Calculate totals
  const totalScore = DEFAULT_EVALUATION_CRITERIA.reduce(
    (sum, c) => sum + (data.evaluation?.ratings[c.id] || 0),
    0
  );
  const maxTotalScore = DEFAULT_EVALUATION_CRITERIA.reduce((sum, c) => sum + c.maxPoints, 0);
  const evalLevel = getEvaluationLevel(totalScore, maxTotalScore);

  // Overall rating badge
  doc.setFillColor(evalLevel.color.r, evalLevel.color.g, evalLevel.color.b);
  doc.setGState(doc.GState({ opacity: 0.15 }));
  drawRoundedRect(doc, scoreListX, scoreY, scoreListWidth, 16, 3);
  doc.setGState(doc.GState({ opacity: 1 }));

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(evalLevel.color.r, evalLevel.color.g, evalLevel.color.b);
  doc.text(toASCII(`Tong hop: ${evalLevel.label}`), scoreListX + 5, scoreY + 7);
  doc.text(`${totalScore}/${maxTotalScore}`, scoreListX + scoreListWidth - 5, scoreY + 7, {
    align: 'right'
  });

  // Rating stars
  const starY = scoreY + 12;
  doc.setFontSize(8);
  doc.text(
    toASCII(`Xep loai: ${getRatingLabel(data.evaluation.overallRating)} (${data.evaluation.overallRating}/5)`),
    scoreListX + 5,
    starY
  );

  scoreY += 22;

  // Individual criteria scores (compact list)
  DEFAULT_EVALUATION_CRITERIA.forEach((criteria, idx) => {
    if (idx >= 6) return; // Only show first 6 in main view

    const score = data.evaluation?.ratings[criteria.id] || 0;
    const percent = (score / criteria.maxPoints) * 100;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.text(toASCII(criteria.name), scoreListX, scoreY + 3);

    // Mini progress bar
    const barWidth = 40;
    const barX = scoreListX + scoreListWidth - barWidth - 20;
    drawProgressBar(doc, barX, scoreY, barWidth, 4, percent, getPercentColor(percent), false);

    // Score text
    doc.setFontSize(7);
    doc.text(`${score}/${criteria.maxPoints}`, scoreListX + scoreListWidth - 2, scoreY + 3, {
      align: 'right'
    });

    scoreY += 8;
  });

  yPos = Math.max(chartCenterY + chartRadius + 15, scoreY + 5);

  // Comments section
  if (data.evaluation.strengths || data.evaluation.improvements || data.evaluation.comment) {
    yPos = renderEvaluationComments(doc, data, pageWidth, pageHeight, margin, yPos);
  }

  return yPos;
}

function renderEvaluationComments(
  doc: jsPDF,
  data: StudentReportData,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  yPos: number
): number {
  // Check page break
  if (yPos > pageHeight - 50) {
    doc.addPage();
    yPos = margin;
  }

  doc.setFillColor(COLORS.background.r, COLORS.background.g, COLORS.background.b);
  drawRoundedRect(doc, margin, yPos, pageWidth - 2 * margin, 35, 3);

  const commentY = yPos + 5;
  const commentWidth = (pageWidth - 2 * margin - 15) / 2;

  // Strengths
  if (data.evaluation?.strengths) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.success.r, COLORS.success.g, COLORS.success.b);
    doc.text('[+] ' + toASCII('Diem manh:'), margin + 5, commentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    const strengthLines = doc.splitTextToSize(toASCII(data.evaluation.strengths), commentWidth - 10);
    doc.text(strengthLines.slice(0, 2), margin + 5, commentY + 12);
  }

  // Improvements
  if (data.evaluation?.improvements) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.warning.r, COLORS.warning.g, COLORS.warning.b);
    doc.text('[-] ' + toASCII('Can cai thien:'), margin + commentWidth + 10, commentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    const improvementLines = doc.splitTextToSize(
      toASCII(data.evaluation.improvements),
      commentWidth - 10
    );
    doc.text(improvementLines.slice(0, 2), margin + commentWidth + 10, commentY + 12);
  }

  yPos += 40;

  // General comment
  if (data.evaluation?.comment) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.text(toASCII('Nhan xet:'), margin, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    const commentLines = doc.splitTextToSize(toASCII(data.evaluation.comment), pageWidth - 2 * margin);
    doc.text(commentLines.slice(0, 3), margin, yPos + 6);
    yPos += 6 + commentLines.slice(0, 3).length * 4;
  }

  return yPos;
}
