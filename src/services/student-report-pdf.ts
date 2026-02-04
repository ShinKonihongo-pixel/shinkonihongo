// Student Report PDF Generator Service
// Generates professional PDF reports for students with modern design

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { StudentReportConfig, StudentReportData } from '../types/student-report';
import { DEFAULT_EVALUATION_CRITERIA } from '../types/classroom';

// ============ DESIGN CONSTANTS ============
const COLORS = {
  // Primary palette
  primary: { r: 67, g: 97, b: 238 },       // Royal blue
  primaryLight: { r: 114, g: 137, b: 245 },
  primaryDark: { r: 45, g: 66, b: 170 },

  // Accent colors
  accent: { r: 255, g: 107, b: 107 },      // Coral
  success: { r: 46, g: 204, b: 113 },      // Green
  warning: { r: 241, g: 196, b: 15 },      // Yellow
  danger: { r: 231, g: 76, b: 60 },        // Red
  info: { r: 52, g: 152, b: 219 },         // Sky blue

  // Neutral colors
  dark: { r: 44, g: 62, b: 80 },
  gray: { r: 127, g: 140, b: 141 },
  lightGray: { r: 189, g: 195, b: 199 },
  background: { r: 248, g: 249, b: 250 },
  white: { r: 255, g: 255, b: 255 },

  // Section colors
  attendance: { r: 46, g: 204, b: 113 },
  grades: { r: 52, g: 152, b: 219 },
  evaluation: { r: 155, g: 89, b: 182 },
};

// Vietnamese character to ASCII conversion
function toASCII(str: string): string {
  const vietnameseMap: Record<string, string> = {
    'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
    'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
    'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
    'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
    'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    'đ': 'd',
    'À': 'A', 'Á': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
    'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
    'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
    'È': 'E', 'É': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
    'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
    'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
    'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
    'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y',
    'Đ': 'D',
  };

  return str.split('').map(char => vietnameseMap[char] || char).join('');
}

// Format date to Vietnamese format
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

// Get rating label
function getRatingLabel(rating: number): string {
  const labels: Record<number, string> = {
    1: 'Yeu',
    2: 'Trung binh',
    3: 'Kha',
    4: 'Tot',
    5: 'Xuat sac',
  };
  return labels[rating] || '-';
}

// Get color based on percentage
function getPercentColor(percent: number): { r: number; g: number; b: number } {
  if (percent >= 80) return COLORS.success;
  if (percent >= 60) return COLORS.info;
  if (percent >= 40) return COLORS.warning;
  return COLORS.danger;
}

// Get evaluation level
function getEvaluationLevel(totalScore: number, maxScore: number): { label: string; color: typeof COLORS.success } {
  const percent = (totalScore / maxScore) * 100;
  if (percent >= 90) return { label: 'Xuat sac', color: COLORS.success };
  if (percent >= 70) return { label: 'Tot', color: COLORS.info };
  if (percent >= 50) return { label: 'Kha', color: COLORS.warning };
  return { label: 'Can co gang', color: COLORS.danger };
}

// Draw rounded rectangle
function drawRoundedRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, style: 'F' | 'S' | 'FD' = 'F') {
  doc.roundedRect(x, y, w, h, r, r, style);
}

// Draw progress bar
function drawProgressBar(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  percent: number,
  color: { r: number; g: number; b: number },
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

// Draw radar chart for skills
function drawRadarChart(
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

// Draw stat card
function drawStatCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: string,
  color: { r: number; g: number; b: number },
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
function drawSectionHeader(doc: jsPDF, y: number, title: string, color: { r: number; g: number; b: number }, pageWidth: number, margin: number) {
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

  // ============ HEADER SECTION ============
  // Gradient header background
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
  doc.text(toASCII(config.reportTitle), titleBadgeX + titleBadgeWidth / 2, titleBadgeY + 6.5, { align: 'center' });

  yPos = headerHeight + 8;

  // ============ STUDENT INFO CARD ============
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
  const periodDays = Math.ceil((new Date(data.periodEnd).getTime() - new Date(data.periodStart).getTime()) / (1000 * 60 * 60 * 24));
  doc.text(`${periodDays} ngay`, pageWidth - margin - periodBadgeWidth / 2 - 5, yPos + 19, { align: 'center' });

  yPos += infoCardHeight + 10;

  // ============ SUMMARY STATS ROW ============
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

  yPos += statCardHeight + 12;

  // ============ ATTENDANCE SECTION ============
  if (config.showAttendance && data.attendance) {
    yPos = drawSectionHeader(doc, yPos, 'I. DIEM DANH', COLORS.attendance, pageWidth, margin);

    // Attendance stats grid
    const attStatWidth = (pageWidth - 2 * margin - 15) / 4;
    const attStatHeight = 18;

    const attStats = [
      { label: 'Tong buoi', value: data.attendance.totalSessions, color: COLORS.gray },
      { label: 'Co mat', value: data.attendance.present, color: COLORS.success },
      { label: 'Di muon', value: data.attendance.late, color: COLORS.warning },
      { label: 'Vang mat', value: data.attendance.absent + data.attendance.excused, color: COLORS.danger },
    ];

    attStats.forEach((stat, idx) => {
      const x = margin + idx * (attStatWidth + 5);

      // Mini card
      doc.setFillColor(COLORS.background.r, COLORS.background.g, COLORS.background.b);
      drawRoundedRect(doc, x, yPos, attStatWidth, attStatHeight, 3);

      // Value
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(stat.color.r, stat.color.g, stat.color.b);
      doc.text(stat.value.toString(), x + attStatWidth / 2, yPos + 8, { align: 'center' });

      // Label
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
      doc.text(toASCII(stat.label), x + attStatWidth / 2, yPos + 14, { align: 'center' });
    });

    yPos += attStatHeight + 6;

    // Attendance progress bar
    const attPercent = data.attendance.attendanceRate;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.text(toASCII('Ty le chuyen can:'), margin, yPos + 4);

    drawProgressBar(
      doc,
      margin + 45,
      yPos,
      pageWidth - 2 * margin - 45,
      6,
      attPercent,
      getPercentColor(attPercent),
      true
    );

    yPos += 14;
  }

  // ============ GRADES SECTION ============
  if (config.showGrades && data.grades) {
    // Check page break
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = margin;
    }

    yPos = drawSectionHeader(doc, yPos, 'II. KET QUA HOC TAP', COLORS.grades, pageWidth, margin);

    // Grade summary row
    const gradeStatWidth = (pageWidth - 2 * margin - 10) / 3;
    const gradeStatHeight = 20;

    const gradeStats = [
      { label: 'Bai kiem tra', value: data.grades.testsCompleted.toString() },
      { label: 'Bai tap', value: data.grades.assignmentsCompleted.toString() },
      { label: 'Tong diem', value: `${data.grades.totalScore}/${data.grades.totalPoints}` },
    ];

    gradeStats.forEach((stat, idx) => {
      const x = margin + idx * (gradeStatWidth + 5);

      doc.setFillColor(COLORS.background.r, COLORS.background.g, COLORS.background.b);
      drawRoundedRect(doc, x, yPos, gradeStatWidth, gradeStatHeight, 3);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.grades.r, COLORS.grades.g, COLORS.grades.b);
      doc.text(stat.value, x + gradeStatWidth / 2, yPos + 8, { align: 'center' });

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
      doc.text(toASCII(stat.label), x + gradeStatWidth / 2, yPos + 15, { align: 'center' });
    });

    yPos += gradeStatHeight + 6;

    // Average progress bar
    const avgPercent = data.grades.averagePercent;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.text(toASCII('Diem trung binh:'), margin, yPos + 4);

    drawProgressBar(
      doc,
      margin + 40,
      yPos,
      pageWidth - 2 * margin - 40,
      6,
      avgPercent,
      getPercentColor(avgPercent),
      true
    );

    yPos += 12;

    // Submissions table
    if (data.grades.submissions && data.grades.submissions.length > 0) {
      const submittedItems = data.grades.submissions
        .filter(s => s.submittedAt)
        .slice(0, 8);

      if (submittedItems.length > 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
        doc.text(toASCII('Chi tiet bai lam:'), margin, yPos);
        yPos += 4;

        const tableData = submittedItems.map((sub, idx) => {
          const percent = (sub.score / sub.totalPoints) * 100;
          return [
            (idx + 1).toString(),
            toASCII(sub.testId.length > 20 ? sub.testId.substring(0, 20) + '...' : sub.testId),
            `${sub.score}/${sub.totalPoints}`,
            `${percent.toFixed(0)}%`,
          ];
        });

        autoTable(doc, {
          startY: yPos,
          head: [['#', toASCII('Bai lam'), toASCII('Diem'), '%']],
          body: tableData,
          theme: 'plain',
          headStyles: {
            fillColor: [COLORS.grades.r, COLORS.grades.g, COLORS.grades.b],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8,
            cellPadding: 2,
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 2,
          },
          alternateRowStyles: {
            fillColor: [COLORS.background.r, COLORS.background.g, COLORS.background.b],
          },
          columnStyles: {
            0: { cellWidth: 12, halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 20, halign: 'center' },
          },
          margin: { left: margin, right: margin },
        });

        yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      }
    }
  }

  // ============ EVALUATION SECTION ============
  if (config.showEvaluation && data.evaluation) {
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
    doc.text(`${totalScore}/${maxTotalScore}`, scoreListX + scoreListWidth - 5, scoreY + 7, { align: 'right' });

    // Rating stars
    const starY = scoreY + 12;
    doc.setFontSize(8);
    doc.text(toASCII(`Xep loai: ${getRatingLabel(data.evaluation.overallRating)} (${data.evaluation.overallRating}/5)`), scoreListX + 5, starY);

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
      doc.text(`${score}/${criteria.maxPoints}`, scoreListX + scoreListWidth - 2, scoreY + 3, { align: 'right' });

      scoreY += 8;
    });

    yPos = Math.max(chartCenterY + chartRadius + 15, scoreY + 5);

    // Comments section
    if (data.evaluation.strengths || data.evaluation.improvements || data.evaluation.comment) {
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
      if (data.evaluation.strengths) {
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
      if (data.evaluation.improvements) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(COLORS.warning.r, COLORS.warning.g, COLORS.warning.b);
        doc.text('[-] ' + toASCII('Can cai thien:'), margin + commentWidth + 10, commentY + 5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
        const improvementLines = doc.splitTextToSize(toASCII(data.evaluation.improvements), commentWidth - 10);
        doc.text(improvementLines.slice(0, 2), margin + commentWidth + 10, commentY + 12);
      }

      yPos += 40;

      // General comment
      if (data.evaluation.comment) {
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
    }
  }

  // ============ SIGNATURE SECTION ============
  if (config.showSignatures) {
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
    doc.text(toASCII('(Ky va ghi ro ho ten)'), teacherX + sigBoxWidth / 2, yPos + sigBoxHeight + 5, { align: 'center' });

    if (data.teacherName) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
      doc.text(toASCII(data.teacherName), teacherX + sigBoxWidth / 2, yPos + sigBoxHeight - 5, { align: 'center' });
    }

    // Parent/Student signature box
    doc.setDrawColor(COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b);
    doc.setLineDashPattern([2, 2], 0);
    doc.rect(parentX, yPos, sigBoxWidth, sigBoxHeight, 'S');
    doc.setLineDashPattern([], 0);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.text(toASCII('PHU HUYNH / HOC VIEN'), parentX + sigBoxWidth / 2, yPos - 3, { align: 'center' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.text(toASCII('(Ky va ghi ro ho ten)'), parentX + sigBoxWidth / 2, yPos + sigBoxHeight + 5, { align: 'center' });
  }

  // ============ FOOTER ON ALL PAGES ============
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
