// Summary statistics row rendering

import type { jsPDF } from 'jspdf';
import type { StudentReportData } from '../../types/student-report';
import { COLORS } from './constants';
import { drawStatCard } from './components';
import { getEvaluationLevel, toASCII } from './utils';
import { DEFAULT_EVALUATION_CRITERIA } from '../../types/classroom';

export function renderSummaryStats(
  doc: jsPDF,
  data: StudentReportData,
  pageWidth: number,
  margin: number,
  yPos: number
): number {
  const statCardWidth = (pageWidth - 2 * margin - 10) / 3;
  const statCardHeight = 22;

  // Attendance stat
  if (data.attendance) {
    drawStatCard(
      doc,
      margin,
      yPos,
      statCardWidth,
      statCardHeight,
      'Chuyen can',
      `${data.attendance.attendanceRate.toFixed(0)}%`,
      COLORS.attendance,
      'CC'
    );
  }

  // Grades stat
  if (data.grades) {
    drawStatCard(
      doc,
      margin + statCardWidth + 5,
      yPos,
      statCardWidth,
      statCardHeight,
      'Diem trung binh',
      `${data.grades.averagePercent.toFixed(0)}%`,
      COLORS.grades,
      'TB'
    );
  }

  // Evaluation stat
  if (data.evaluation) {
    const totalScore = DEFAULT_EVALUATION_CRITERIA.reduce(
      (sum, c) => sum + (data.evaluation?.ratings[c.id] || 0),
      0
    );
    const maxTotalScore = DEFAULT_EVALUATION_CRITERIA.reduce((sum, c) => sum + c.maxPoints, 0);
    const evalLevel = getEvaluationLevel(totalScore, maxTotalScore);

    drawStatCard(
      doc,
      margin + (statCardWidth + 5) * 2,
      yPos,
      statCardWidth,
      statCardHeight,
      'Danh gia tong hop',
      toASCII(evalLevel.label),
      evalLevel.color,
      'DG'
    );
  }

  return yPos + statCardHeight + 12;
}
