// Main entry point for student report PDF generation

import { jsPDF } from 'jspdf';
import type { StudentReportConfig, StudentReportData } from '../../types/student-report';
import { renderHeader } from './header';
import { renderStudentInfo } from './student-info';
import { renderSummaryStats } from './summary-stats';
import { renderAttendanceSection, renderGradesSection } from './sections';
import { renderEvaluationSection } from './evaluation-section';
import { renderSignatureSection, renderFooterOnAllPages } from './footer';
import { toASCII, formatDate } from './utils';

// Generate student report PDF
export async function generateStudentReportPDF(
  data: StudentReportData,
  config: StudentReportConfig
): Promise<jsPDF> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = 0;

  // Render header section
  yPos = renderHeader(doc, config, pageWidth, margin);

  // Render student info card
  yPos = renderStudentInfo(doc, data, pageWidth, margin, yPos);

  // Render summary statistics row
  yPos = renderSummaryStats(doc, data, pageWidth, margin, yPos);

  // Render attendance section
  if (config.showAttendance && data.attendance) {
    yPos = renderAttendanceSection(doc, data, pageWidth, margin, yPos);
  }

  // Render grades section
  if (config.showGrades && data.grades) {
    yPos = renderGradesSection(doc, data, pageWidth, pageHeight, margin, yPos);
  }

  // Render evaluation section
  if (config.showEvaluation && data.evaluation) {
    yPos = renderEvaluationSection(doc, data, pageWidth, pageHeight, margin, yPos);
  }

  // Render signature section
  if (config.showSignatures) {
    renderSignatureSection(doc, data, pageWidth, pageHeight, margin, yPos);
  }

  // Render footer on all pages
  renderFooterOnAllPages(doc, data, config, pageWidth, pageHeight, margin);

  return doc;
}

// Download PDF to client
export async function downloadStudentReportPDF(
  data: StudentReportData,
  config: StudentReportConfig
): Promise<void> {
  const doc = await generateStudentReportPDF(data, config);
  const fileName = `BaoCao_${toASCII(data.studentName).replace(/\s+/g, '_')}_${formatDate(data.generatedAt).replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
}

// Get PDF as Blob for upload/email
export async function getStudentReportPDFBlob(
  data: StudentReportData,
  config: StudentReportConfig
): Promise<Blob> {
  const doc = await generateStudentReportPDF(data, config);
  return doc.output('blob');
}

// Get PDF as base64 for email attachment
export async function getStudentReportPDFBase64(
  data: StudentReportData,
  config: StudentReportConfig
): Promise<string> {
  const doc = await generateStudentReportPDF(data, config);
  return doc.output('datauristring');
}

// Get file name for report
export function getReportFileName(studentName: string, periodEnd: string): string {
  return `BaoCao_${toASCII(studentName).replace(/\s+/g, '_')}_${formatDate(periodEnd).replace(/\//g, '-')}.pdf`;
}
