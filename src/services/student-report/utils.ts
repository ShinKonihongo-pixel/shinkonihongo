// Utility functions for student report generation

import { COLORS } from './constants';
import type { Color } from './constants';
import type { StudentReportData } from '../../types/student-report';
import { DEFAULT_EVALUATION_CRITERIA } from '../../types/classroom';

// Vietnamese character to ASCII conversion
export function toASCII(str: string): string {
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
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

// Get rating label
export function getRatingLabel(rating: number): string {
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
export function getPercentColor(percent: number): Color {
  if (percent >= 80) return COLORS.success;
  if (percent >= 60) return COLORS.info;
  if (percent >= 40) return COLORS.warning;
  return COLORS.danger;
}

// Generate actionable recommendations based on student data
export function generateRecommendations(data: StudentReportData): string[] {
  const items: string[] = [];
  const avg = data.grades?.averagePercent ?? 0;
  const att = data.attendance?.attendanceRate ?? 100;

  // Attendance recommendations
  if (att < 70) items.push('Can tham du day du cac buoi hoc. Ty le chuyen can hien tai qua thap.');
  else if (att < 85) items.push('Nen tang cuong ty le chuyen can de dat ket qua tot hon.');

  // Grade recommendations
  if (avg < 50) items.push('Can on tap lai kien thuc co ban va lam them bai tap.');
  else if (avg < 70) items.push('Nen tap trung vao cac dang bai con yeu de nang cao diem so.');
  else if (avg >= 85) items.push('Tiep tuc phat huy. Co the thu thach voi trinh do cao hon.');

  // Evaluation-based recommendations
  if (data.evaluation) {
    const criteria = DEFAULT_EVALUATION_CRITERIA;
    const weakest = [...criteria]
      .map(c => ({ name: c.name, score: data.evaluation!.ratings[c.id] || 0, max: c.maxPoints }))
      .sort((a, b) => (a.score / a.max) - (b.score / b.max));

    if (weakest.length > 0 && (weakest[0].score / weakest[0].max) < 0.5) {
      items.push(`Can tap trung cai thien: ${toASCII(weakest[0].name)}`);
    }
  }

  // JLPT recommendation
  if (avg >= 80 && att >= 85) items.push('San sang thu suc voi ky thi JLPT cap do tiep theo.');

  if (items.length === 0) items.push('Tiep tuc duy tri tinh than hoc tap tot.');

  return items;
}

// Get evaluation level
export function getEvaluationLevel(
  totalScore: number,
  maxScore: number
): { label: string; color: Color } {
  const percent = (totalScore / maxScore) * 100;
  if (percent >= 90) return { label: 'Xuat sac', color: COLORS.success };
  if (percent >= 70) return { label: 'Tot', color: COLORS.info };
  if (percent >= 50) return { label: 'Kha', color: COLORS.warning };
  return { label: 'Can co gang', color: COLORS.danger };
}
