// PDF export utility for student reports
// Generates comprehensive student report including grades, attendance, evaluations

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { User } from '../types/user';
import type {
  Classroom,
  StudentGrade,
  StudentAttendanceSummary,
  AttendanceRecord,
  StudentEvaluation,
  ClassroomSubmission,
  ClassroomTest,
} from '../types/classroom';
import {
  DEFAULT_EVALUATION_CRITERIA,
  CLASSROOM_LEVEL_LABELS,
} from '../types/classroom';

// Vietnamese font support - using built-in font with Vietnamese characters
// Note: For full Vietnamese support, you may need to add a custom font

interface StudentReportData {
  user: User;
  classroom: Classroom;
  studentGrade?: StudentGrade;
  attendanceSummary?: StudentAttendanceSummary;
  attendanceRecords: AttendanceRecord[];
  evaluations: StudentEvaluation[];
  submissions: ClassroomSubmission[];
  tests: ClassroomTest[];
}

// Convert Vietnamese characters to ASCII for PDF (basic support)
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

// Get rating text from number
function getRatingText(rating: number): string {
  const labels: Record<number, string> = {
    1: 'Yeu',
    2: 'Trung binh',
    3: 'Kha',
    4: 'Tot',
    5: 'Xuat sac',
  };
  return labels[rating] || '-';
}

// Get attendance status text
function getAttendanceText(status: string): string {
  const labels: Record<string, string> = {
    present: 'Co mat',
    late: 'Di muon',
    absent: 'Vang',
    excused: 'Co phep',
  };
  return labels[status] || status;
}

export function exportStudentReportPDF(data: StudentReportData): void {
  const {
    user,
    classroom,
    studentGrade,
    attendanceSummary,
    attendanceRecords,
    evaluations,
    submissions,
    tests,
  } = data;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  const displayName = user.displayName || user.username || 'Unknown';

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(toASCII('BAO CAO HOC TAP'), pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(toASCII(`Hoc vien: ${displayName}`), pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;
  doc.text(toASCII(`Lop: ${classroom.name} (${CLASSROOM_LEVEL_LABELS[classroom.level]})`), pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;
  doc.text(toASCII(`Ngay xuat: ${formatDate(new Date().toISOString())}`), pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Separator line
  doc.setLineWidth(0.5);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;

  // ============ SUMMARY SECTION ============
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(toASCII('I. TONG QUAN'), 20, yPos);
  yPos += 10;

  // Summary table
  const summaryData = [
    [toASCII('Diem trung binh'), `${studentGrade?.averagePercent.toFixed(1) || 0}%`],
    [toASCII('Ty le chuyen can'), `${attendanceSummary?.attendanceRate.toFixed(0) || 0}%`],
    [toASCII('So bai da nop'), `${submissions.filter(s => s.userId === user.id && s.submittedAt).length}`],
    [toASCII('So lan danh gia'), `${evaluations.filter(e => e.userId === user.id).length}`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [[toASCII('Chi tieu'), toASCII('Ket qua')]],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [102, 126, 234], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 40, halign: 'center' },
    },
    margin: { left: 20, right: 20 },
  });

  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // ============ GRADES SECTION ============
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(toASCII('II. DIEM SO'), 20, yPos);
  yPos += 10;

  const userSubmissions = submissions
    .filter(s => s.userId === user.id && s.submittedAt)
    .sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime());

  if (userSubmissions.length > 0) {
    const gradesData = userSubmissions.map(sub => {
      const test = tests.find(t => t.id === sub.testId);
      return [
        toASCII(test?.title || 'Unknown'),
        test?.type === 'test' ? toASCII('Kiem tra') : toASCII('Bai tap'),
        `${sub.score}/${sub.totalPoints}`,
        `${((sub.score / sub.totalPoints) * 100).toFixed(0)}%`,
        formatDate(sub.submittedAt!),
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [[
        toASCII('Ten bai'),
        toASCII('Loai'),
        toASCII('Diem'),
        '%',
        toASCII('Ngay nop'),
      ]],
      body: gradesData,
      theme: 'striped',
      headStyles: { fillColor: [39, 174, 96], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 30, halign: 'center' },
      },
      margin: { left: 20, right: 20 },
    });

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(toASCII('Chua co bai nop'), 20, yPos);
    yPos += 15;
  }

  // Check if need new page
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  // ============ ATTENDANCE SECTION ============
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(toASCII('III. CHUYEN CAN'), 20, yPos);
  yPos += 10;

  // Attendance summary
  const attendanceStatsData = [
    [toASCII('Co mat'), `${attendanceSummary?.present || 0}`],
    [toASCII('Di muon'), `${attendanceSummary?.late || 0}`],
    [toASCII('Vang'), `${attendanceSummary?.absent || 0}`],
    [toASCII('Co phep'), `${attendanceSummary?.excused || 0}`],
    [toASCII('Tong so buoi'), `${attendanceSummary?.totalSessions || 0}`],
  ];

  autoTable(doc, {
    startY: yPos,
    body: attendanceStatsData,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 30, halign: 'center' },
    },
    margin: { left: 20, right: 20 },
  });

  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Recent attendance records (last 10)
  const userAttendance = attendanceRecords
    .filter(r => r.userId === user.id)
    .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
    .slice(0, 10);

  if (userAttendance.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(toASCII('Lich su diem danh (10 buoi gan nhat):'), 20, yPos);
    yPos += 7;

    const attendanceData = userAttendance.map(record => [
      formatDate(record.sessionDate),
      getAttendanceText(record.status),
      toASCII(record.note || '-'),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [[toASCII('Ngay'), toASCII('Trang thai'), toASCII('Ghi chu')]],
      body: attendanceData,
      theme: 'striped',
      headStyles: { fillColor: [52, 152, 219], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 80 },
      },
      margin: { left: 20, right: 20 },
    });

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }

  // Check if need new page
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }

  // ============ EVALUATIONS SECTION ============
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(toASCII('IV. DANH GIA'), 20, yPos);
  yPos += 10;

  const userEvaluations = evaluations
    .filter(e => e.userId === user.id)
    .sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());

  if (userEvaluations.length > 0) {
    userEvaluations.forEach((evaluation, index) => {
      // Check if need new page
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(toASCII(`Danh gia ${index + 1}: ${formatDate(evaluation.periodStart)} - ${formatDate(evaluation.periodEnd)}`), 20, yPos);
      yPos += 7;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(toASCII(`Xep loai: ${getRatingText(evaluation.overallRating)} (${evaluation.overallRating}/5)`), 20, yPos);
      yPos += 6;

      // Criteria scores table
      const criteriaData = DEFAULT_EVALUATION_CRITERIA.map(criteria => {
        const score = evaluation.ratings[criteria.id] || 0;
        return [
          toASCII(criteria.name),
          `${score}/${criteria.maxPoints}`,
        ];
      });

      autoTable(doc, {
        startY: yPos,
        body: criteriaData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 25, halign: 'center' },
        },
        margin: { left: 20, right: 20 },
      });

      yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

      // Comment
      if (evaluation.comment) {
        doc.setFontSize(9);
        const commentLines = doc.splitTextToSize(toASCII(`Nhan xet: ${evaluation.comment}`), pageWidth - 40);
        doc.text(commentLines, 20, yPos);
        yPos += commentLines.length * 4 + 3;
      }

      // Strengths
      if (evaluation.strengths) {
        const strengthLines = doc.splitTextToSize(toASCII(`Diem manh: ${evaluation.strengths}`), pageWidth - 40);
        doc.text(strengthLines, 20, yPos);
        yPos += strengthLines.length * 4 + 3;
      }

      // Improvements
      if (evaluation.improvements) {
        const improvementLines = doc.splitTextToSize(toASCII(`Can cai thien: ${evaluation.improvements}`), pageWidth - 40);
        doc.text(improvementLines, 20, yPos);
        yPos += improvementLines.length * 4 + 3;
      }

      yPos += 10;
    });
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(toASCII('Chua co danh gia'), 20, yPos);
    yPos += 15;
  }

  // ============ FOOTER ============
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Trang ${i}/${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save PDF
  const fileName = `BaoCao_${toASCII(displayName).replace(/\s+/g, '_')}_${formatDate(new Date().toISOString()).replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
}

// Export all students report for a classroom
export function exportClassroomReportPDF(
  classroom: Classroom,
  students: Array<{
    user: User;
    grade?: StudentGrade;
    attendance?: StudentAttendanceSummary;
  }>,
  evaluations: StudentEvaluation[]
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(toASCII('BAO CAO TONG HOP LOP HOC'), pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(toASCII(classroom.name), pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;

  doc.setFontSize(10);
  doc.text(toASCII(`Cap do: ${CLASSROOM_LEVEL_LABELS[classroom.level]}`), pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;
  doc.text(toASCII(`Ngay xuat: ${formatDate(new Date().toISOString())}`), pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Separator
  doc.setLineWidth(0.5);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;

  // Summary stats
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(toASCII(`Tong so hoc vien: ${students.length}`), 20, yPos);
  yPos += 15;

  // Students table
  const tableData = students.map((student, index) => {
    const displayName = student.user.displayName || student.user.username || 'Unknown';
    const latestEval = evaluations
      .filter(e => e.userId === student.user.id)
      .sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime())[0];

    return [
      (index + 1).toString(),
      toASCII(displayName),
      `${student.grade?.averagePercent.toFixed(1) || 0}%`,
      `${student.attendance?.attendanceRate.toFixed(0) || 0}%`,
      latestEval ? getRatingText(latestEval.overallRating) : '-',
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [[
      'STT',
      toASCII('Ho ten'),
      toASCII('Diem TB'),
      toASCII('Chuyen can'),
      toASCII('Danh gia'),
    ]],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [102, 126, 234], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 60 },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 30, halign: 'center' },
      4: { cellWidth: 30, halign: 'center' },
    },
    margin: { left: 20, right: 20 },
  });

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Trang ${i}/${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  const fileName = `BaoCaoLop_${toASCII(classroom.name).replace(/\s+/g, '_')}_${formatDate(new Date().toISOString()).replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
}
