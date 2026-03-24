// Main entry point for student report PDF generation

import type { StudentReportConfig, StudentReportData } from '../../types/student-report';
import { renderHeader } from './header';
import { renderStudentInfo } from './student-info';
import { renderSummaryStats } from './summary-stats';
import { renderAttendanceSection, renderGradesSection } from './sections';
import { renderEvaluationSection } from './evaluation-section';
import { renderSignatureSection, renderFooterOnAllPages } from './footer';
import { toASCII, formatDate, generateRecommendations } from './utils';

// Generate student report PDF — routes to correct style
export async function generateStudentReportPDF(
  data: StudentReportData,
  config: StudentReportConfig
): Promise<import('jspdf').jsPDF> {
  const style = config.reportStyle || 'classic';

  if (style === 'infographic') {
    const { generateInfographicReport } = await import('./infographic-report');
    return generateInfographicReport(data, config);
  }

  if (style === 'academic') {
    const { generateAcademicReport } = await import('./academic-report');
    return generateAcademicReport(data, config);
  }

  // ── classic (default) ──────────────────────────────────────────────────────
  const { jsPDF } = await import('jspdf');
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
    yPos = await renderGradesSection(doc, data, pageWidth, pageHeight, margin, yPos);
  }

  // Render evaluation section
  if (config.showEvaluation && data.evaluation) {
    yPos = renderEvaluationSection(doc, data, pageWidth, pageHeight, margin, yPos);
  }

  // Render class comparison row
  if (data.classAverage !== undefined && data.classSize !== undefined) {
    const studentAvg = data.grades?.averagePercent ?? 0;
    const diff = studentAvg - data.classAverage;
    const diffSign = diff >= 0 ? '+' : '';
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('So voi lop:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(diff >= 0 ? 46 : 231, diff >= 0 ? 204 : 76, diff >= 0 ? 113 : 60);
    const rankText = data.studentRank ? `  |  Hang ${data.studentRank}/${data.classSize}` : '';
    doc.text(`TB lop: ${data.classAverage.toFixed(1)}%  (${diffSign}${diff.toFixed(1)}%)${rankText}`, margin + 28, yPos);
    doc.setTextColor(44, 62, 80);
    yPos += 10;
  }

  // Render custom teacher note
  if (data.customNote) {
    if (yPos > pageHeight - 35) { doc.addPage(); yPos = margin; }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('Ghi chu them:', margin, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 100);
    const noteLines = doc.splitTextToSize(toASCII(data.customNote), pageWidth - 2 * margin);
    doc.text(noteLines.slice(0, 4), margin, yPos);
    yPos += noteLines.slice(0, 4).length * 5 + 6;
  }

  // Render recommendations section
  const recommendations = generateRecommendations(data);
  if (yPos > pageHeight - 45) { doc.addPage(); yPos = margin; }
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 62, 80);
  doc.text('De xuat:', margin, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 100);
  recommendations.forEach(item => {
    if (yPos > pageHeight - 15) { doc.addPage(); yPos = margin; }
    doc.text(`- ${item}`, margin + 2, yPos);
    yPos += 6;
  });
  yPos += 4;

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
