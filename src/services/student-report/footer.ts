// Footer and signature section rendering

import type { jsPDF } from 'jspdf';
import type { StudentReportData, StudentReportConfig } from '../../types/student-report';
import { COLORS } from './constants';
import { toASCII, formatDate } from './utils';

export function renderSignatureSection(
  doc: jsPDF,
  data: StudentReportData,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  yPos: number
): number {
  // Check page break
  if (yPos > pageHeight - 55) {
    doc.addPage();
    yPos = margin;
  }

  yPos += 10;

  // Date line
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  const dateStr = `Ngay ${new Date().getDate()} thang ${new Date().getMonth() + 1} nam ${new Date().getFullYear()}`;
  doc.text(toASCII(dateStr), pageWidth - margin, yPos, { align: 'right' });
  yPos += 12;

  // Signature boxes
  const sigBoxWidth = 70;
  const sigBoxHeight = 30;
  const teacherX = margin + 20;
  const parentX = pageWidth - margin - sigBoxWidth - 20;

  // Teacher signature box
  doc.setDrawColor(COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b);
  doc.setLineWidth(0.5);
  doc.setLineDashPattern([2, 2], 0);
  doc.rect(teacherX, yPos, sigBoxWidth, sigBoxHeight, 'S');
  doc.setLineDashPattern([], 0);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.text(toASCII('GIAO VIEN'), teacherX + sigBoxWidth / 2, yPos - 3, { align: 'center' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  doc.text(toASCII('(Ky va ghi ro ho ten)'), teacherX + sigBoxWidth / 2, yPos + sigBoxHeight + 5, {
    align: 'center'
  });

  if (data.teacherName) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.text(toASCII(data.teacherName), teacherX + sigBoxWidth / 2, yPos + sigBoxHeight - 5, {
      align: 'center'
    });
  }

  // Parent/Student signature box
  doc.setDrawColor(COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b);
  doc.setLineDashPattern([2, 2], 0);
  doc.rect(parentX, yPos, sigBoxWidth, sigBoxHeight, 'S');
  doc.setLineDashPattern([], 0);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.text(toASCII('PHU HUYNH / HOC VIEN'), parentX + sigBoxWidth / 2, yPos - 3, {
    align: 'center'
  });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  doc.text(toASCII('(Ky va ghi ro ho ten)'), parentX + sigBoxWidth / 2, yPos + sigBoxHeight + 5, {
    align: 'center'
  });

  return yPos + sigBoxHeight + 10;
}

export function renderFooterOnAllPages(
  doc: jsPDF,
  data: StudentReportData,
  config: StudentReportConfig,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    // Page number
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.text(`Trang ${i}/${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });

    // Export date
    doc.text(toASCII(`Xuat ngay: ${formatDate(data.generatedAt)}`), margin, pageHeight - 8);

    // School name watermark
    doc.setFontSize(7);
    doc.text(toASCII(config.schoolName), pageWidth - margin, pageHeight - 8, { align: 'right' });
  }
}
