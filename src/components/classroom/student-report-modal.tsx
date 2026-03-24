// Student Report Modal - Export PDF reports for students
// Allows selecting students, date range, and export options

import { useState, useMemo } from 'react';
import type { User } from '../../types/user';
import type {
  Classroom,
  StudentGrade,
  StudentAttendanceSummary,
  StudentEvaluation,
} from '../../types/classroom';
import { CLASSROOM_LEVEL_LABELS } from '../../types/classroom';
import type { StudentReportConfig, StudentReportData, ReportStyle } from '../../types/student-report';
import { DEFAULT_REPORT_CONFIG, REPORT_SETTINGS_STORAGE_KEY } from '../../types/student-report';
import {
  downloadStudentReportPDF,
  getStudentReportPDFBlob,
} from '../../services/student-report-pdf';
import { saveReportToStorage } from '../../services/report-storage-service';
import { sendReportEmail, isValidEmail } from '../../services/email-service';
import {
  X,
  FileText,
  Download,
  Mail,
  Save,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  Users,
  Calendar,
  Eye,
} from 'lucide-react';
import './student-report-modal.css';

interface StudentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: Classroom;
  students: Array<{
    user: User;
    grade?: StudentGrade;
    attendance?: StudentAttendanceSummary;
    evaluation?: StudentEvaluation;
  }>;
  currentUserId: string;
  currentUserName: string;
  onOpenSettings: () => void;
}

type ExportAction = 'download' | 'save' | 'email';

export function StudentReportModal({
  isOpen,
  onClose,
  classroom,
  students,
  currentUserId,
  currentUserName,
  onOpenSettings,
}: StudentReportModalProps) {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [periodStart, setPeriodStart] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().split('T')[0]);
  const [showAttendance, setShowAttendance] = useState(true);
  const [showGrades, setShowGrades] = useState(true);
  const [showEvaluation, setShowEvaluation] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAction, setCurrentAction] = useState<ExportAction | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, name: '' });
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [reportStyle, setReportStyle] = useState<ReportStyle>('classic');
  const [customNote, setCustomNote] = useState('');

  const config: StudentReportConfig = useMemo(() => {
    try {
      const saved = localStorage.getItem(REPORT_SETTINGS_STORAGE_KEY);
      if (saved) return { ...DEFAULT_REPORT_CONFIG, ...JSON.parse(saved) };
    } catch { /* ignore */ }
    return DEFAULT_REPORT_CONFIG;
  }, []);

  const toggleStudent = (userId: string) => {
    setSelectedStudents(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };
  const selectAll   = () => setSelectedStudents(students.map(s => s.user.id));
  const deselectAll = () => setSelectedStudents([]);

  const prepareReportData = (student: typeof students[0]): StudentReportData => {
    const allGrades = students.map(s => s.grade?.averagePercent ?? 0);
    const classAvg = allGrades.length > 0
      ? allGrades.reduce((a, b) => a + b, 0) / allGrades.length
      : 0;
    const sorted = [...allGrades].sort((a, b) => b - a);
    const studentAvg = student.grade?.averagePercent ?? 0;
    const rank = sorted.findIndex(g => g <= studentAvg) + 1;

    return {
      studentId:    student.user.id,
      studentName:  student.user.displayName || student.user.username || 'Unknown',
      studentEmail: student.user.email,
      classroomId:  classroom.id,
      classroomName: classroom.name,
      level:        classroom.level,
      levelLabel:   CLASSROOM_LEVEL_LABELS[classroom.level],
      periodStart,
      periodEnd,
      attendance:  showAttendance  ? student.attendance  : undefined,
      grades:      showGrades      ? student.grade       : undefined,
      evaluation:  showEvaluation  ? student.evaluation  : undefined,
      teacherName: currentUserName,
      teacherId:   currentUserId,
      generatedAt: new Date().toISOString(),
      generatedBy: currentUserId,
      customNote:  customNote.trim() || undefined,
      classAverage: Math.round(classAvg * 10) / 10,
      classSize:    students.length,
      studentRank:  rank,
    };
  };

  const getExportConfig = (): StudentReportConfig => ({
    ...config,
    showAttendance,
    showGrades,
    showEvaluation,
    showSignatures,
    reportStyle,
  });

  const handlePreview = async () => {
    if (selectedStudents.length === 0) return;
    setIsProcessing(true);
    setCurrentAction('download'); // reuse UI
    setResults(null);
    try {
      const student = students.find(s => s.user.id === selectedStudents[0]);
      if (!student) return;
      const reportData = prepareReportData(student);
      const blob = await getStudentReportPDFBlob(reportData, getExportConfig());
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      setResults({ success: 0, failed: 1, errors: [error instanceof Error ? error.message : 'Preview failed'] });
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };

  const handleClassOverview = async () => {
    setIsProcessing(true);
    setResults(null);
    try {
      const { exportClassroomReportPDF } = await import('../../utils/student-report-pdf-export');
      await exportClassroomReportPDF(
        classroom,
        students.map(s => ({ user: s.user, grade: s.grade, attendance: s.attendance })),
        students.flatMap(s => s.evaluation ? [s.evaluation] : [])
      );
    } catch (error) {
      setResults({ success: 0, failed: 1, errors: [error instanceof Error ? error.message : 'Export failed'] });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (selectedStudents.length === 0) return;
    setIsProcessing(true);
    setCurrentAction('download');
    setResults(null);

    const selectedData = students.filter(s => selectedStudents.includes(s.user.id));
    const exportConfig = getExportConfig();
    let success = 0, failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < selectedData.length; i++) {
      const student = selectedData[i];
      setProgress({ current: i + 1, total: selectedData.length, name: student.user.displayName || student.user.username || 'Unknown' });
      try {
        await downloadStudentReportPDF(prepareReportData(student), exportConfig);
        success++;
      } catch (error) {
        failed++;
        errors.push(`${student.user.displayName || student.user.username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      if (i < selectedData.length - 1) await new Promise(r => setTimeout(r, 500));
    }

    setResults({ success, failed, errors });
    setIsProcessing(false);
    setCurrentAction(null);
  };

  const handleSaveToStorage = async () => {
    if (selectedStudents.length === 0) return;
    setIsProcessing(true);
    setCurrentAction('save');
    setResults(null);

    const selectedData = students.filter(s => selectedStudents.includes(s.user.id));
    const exportConfig = getExportConfig();
    let success = 0, failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < selectedData.length; i++) {
      const student = selectedData[i];
      setProgress({ current: i + 1, total: selectedData.length, name: student.user.displayName || student.user.username || 'Unknown' });
      try {
        const pdfBlob = await getStudentReportPDFBlob(prepareReportData(student), exportConfig);
        await saveReportToStorage(
          classroom.id,
          student.user.id,
          student.user.displayName || student.user.username || 'Unknown',
          periodStart,
          periodEnd,
          pdfBlob,
          currentUserId
        );
        success++;
      } catch (error) {
        failed++;
        errors.push(`${student.user.displayName || student.user.username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    setResults({ success, failed, errors });
    setIsProcessing(false);
    setCurrentAction(null);
  };

  const handleSendEmail = async () => {
    if (selectedStudents.length === 0) return;
    if (!config.emailServiceId || !config.emailTemplateId || !config.emailPublicKey) {
      setResults({ success: 0, failed: 1, errors: ['Chưa cấu hình EmailJS. Vui lòng vào Cài đặt để thiết lập trước khi gửi email.'] });
      return;
    }

    setIsProcessing(true);
    setCurrentAction('email');
    setResults(null);

    const selectedData = students.filter(s => selectedStudents.includes(s.user.id));
    const exportConfig = getExportConfig();
    let success = 0, failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < selectedData.length; i++) {
      const student = selectedData[i];
      const recipientEmail = emailAddress || student.user.email;
      setProgress({ current: i + 1, total: selectedData.length, name: student.user.displayName || student.user.username || 'Unknown' });

      if (!recipientEmail || !isValidEmail(recipientEmail)) {
        failed++;
        errors.push(`${student.user.displayName || student.user.username}: Không có email hợp lệ`);
        continue;
      }

      try {
        const pdfBlob = await getStudentReportPDFBlob(prepareReportData(student), exportConfig);
        const savedReport = await saveReportToStorage(
          classroom.id, student.user.id,
          student.user.displayName || student.user.username || 'Unknown',
          periodStart, periodEnd, pdfBlob, currentUserId
        );
        const result = await sendReportEmail(
          {
            recipientEmail,
            recipientName: student.user.displayName || student.user.username || 'Unknown',
            senderName: currentUserName,
            schoolName: config.schoolName,
            reportPeriod: `${periodStart} - ${periodEnd}`,
            pdfUrl: savedReport.downloadUrl,
          },
          exportConfig
        );
        if (result.success) success++;
        else { failed++; errors.push(`${student.user.displayName || student.user.username}: ${result.message}`); }
      } catch (error) {
        failed++;
        errors.push(`${student.user.displayName || student.user.username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      if (i < selectedData.length - 1) await new Promise(r => setTimeout(r, 1500));
    }

    setResults({ success, failed, errors });
    setIsProcessing(false);
    setCurrentAction(null);
    setShowEmailInput(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content student-report-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="report-modal-header">
          <h2><FileText size={22} />Xuất báo cáo học viên</h2>
          <div className="report-modal-header-actions">
            <button
              className="btn btn-secondary"
              onClick={onOpenSettings}
              title="Cài đặt báo cáo"
            >
              <Settings size={17} />
            </button>
            <button className="btn-close" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div className="report-modal-body">

          {/* Report Template Selection */}
          <div>
            <div className="report-section-label">Kiểu báo cáo</div>
            <div className="report-template-grid">
              <button
                type="button"
                className={`report-template-card ${reportStyle === 'classic' ? 'active' : ''}`}
                onClick={() => setReportStyle('classic')}
              >
                <div className="template-preview classic-preview">
                  <div className="tp-header" />
                  <div className="tp-line" />
                  <div className="tp-line tp-short" />
                  <div className="tp-table" />
                </div>
                <span className="template-name">Chuẩn</span>
                <span className="template-desc">Đầy đủ, chuyên nghiệp</span>
              </button>

              <button
                type="button"
                className={`report-template-card ${reportStyle === 'infographic' ? 'active' : ''}`}
                onClick={() => setReportStyle('infographic')}
              >
                <div className="template-preview infographic-preview">
                  <div className="tp-hero" />
                  <div className="tp-circles" />
                  <div className="tp-badges" />
                </div>
                <span className="template-name">Infographic</span>
                <span className="template-desc">Sinh động, trực quan</span>
              </button>

              <button
                type="button"
                className={`report-template-card ${reportStyle === 'academic' ? 'active' : ''}`}
                onClick={() => setReportStyle('academic')}
              >
                <div className="template-preview academic-preview">
                  <div className="tp-title" />
                  <div className="tp-table-formal" />
                  <div className="tp-table-formal" />
                  <div className="tp-sigs" />
                </div>
                <span className="template-name">Học thuật</span>
                <span className="template-desc">Trang trọng, cho phụ huynh</span>
              </button>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <div className="report-section-label">
              <Calendar size={14} />Kỳ học
            </div>
            <div className="report-date-range">
              <input
                type="date"
                value={periodStart}
                onChange={e => setPeriodStart(e.target.value)}
              />
              <span className="report-date-separator">–</span>
              <input
                type="date"
                value={periodEnd}
                onChange={e => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>

          {/* Student Selection */}
          <div>
            <div className="report-student-list-header">
              <div className="report-section-label report-section-label--inline">
                <Users size={14} />Chọn học viên ({selectedStudents.length}/{students.length})
              </div>
              <div className="report-student-list-header-actions">
                <button className="btn btn-sm" onClick={selectAll}>Chọn tất cả</button>
                <button className="btn btn-sm btn-secondary" onClick={deselectAll}>Bỏ chọn</button>
              </div>
            </div>
            <div className="report-student-list">
              {students.map(student => (
                <label
                  key={student.user.id}
                  className={`report-student-item ${selectedStudents.includes(student.user.id) ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.user.id)}
                    onChange={() => toggleStudent(student.user.id)}
                  />
                  <span className="report-student-item-name">
                    {student.user.displayName || student.user.username || 'Unknown'}
                  </span>
                  {student.grade && (
                    <span className="report-student-item-score">
                      {student.grade.averagePercent.toFixed(0)}%
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div>
            <div className="report-section-label">Nội dung báo cáo</div>
            <div className="report-options">
              <label className="report-option-label">
                <input type="checkbox" checked={showAttendance} onChange={e => setShowAttendance(e.target.checked)} />
                Điểm danh
              </label>
              <label className="report-option-label">
                <input type="checkbox" checked={showGrades} onChange={e => setShowGrades(e.target.checked)} />
                Điểm số
              </label>
              <label className="report-option-label">
                <input type="checkbox" checked={showEvaluation} onChange={e => setShowEvaluation(e.target.checked)} />
                Đánh giá
              </label>
              <label className="report-option-label">
                <input type="checkbox" checked={showSignatures} onChange={e => setShowSignatures(e.target.checked)} />
                Chữ ký
              </label>
            </div>
          </div>

          {/* Custom Teacher Note */}
          <div className="report-section">
            <label className="report-section-label">Ghi chú giáo viên (tùy chọn)</label>
            <textarea
              className="report-note-input"
              value={customNote}
              onChange={e => setCustomNote(e.target.value)}
              placeholder="Nhận xét riêng cho học viên..."
              rows={3}
            />
          </div>

          {/* Email Input */}
          {showEmailInput && (
            <div className="report-email-input">
              <label>Email nhận báo cáo (để trống để dùng email học viên)</label>
              <input
                type="email"
                value={emailAddress}
                onChange={e => setEmailAddress(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          )}

          {/* Progress */}
          {isProcessing && (
            <div className="report-progress">
              <div className="report-progress-header">
                <Loader2 size={15} className="spin" />
                <span>
                  {currentAction === 'download' && 'Đang tải xuống...'}
                  {currentAction === 'save'     && 'Đang lưu lên server...'}
                  {currentAction === 'email'    && 'Đang gửi email...'}
                </span>
              </div>
              <div className="report-progress-sub">
                {progress.current}/{progress.total}: {progress.name}
              </div>
              <div className="report-progress-bar-track">
                <div
                  className="report-progress-bar-fill"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className={`report-results ${results.failed === 0 ? 'success' : 'has-errors'}`}>
              <div className="report-results-header">
                {results.failed === 0
                  ? <CheckCircle size={16} color="#22c55e" />
                  : <AlertCircle size={16} color="#ef4444" />
                }
                <span>Hoàn thành: {results.success} thành công, {results.failed} thất bại</span>
              </div>
              {results.errors.length > 0 && (
                <div className="report-results-errors">
                  {results.errors.slice(0, 3).map((err, i) => <div key={i}>{err}</div>)}
                  {results.errors.length > 3 && <div>...và {results.errors.length - 3} lỗi khác</div>}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="report-actions">
            <button
              className="report-btn report-btn--preview"
              onClick={handlePreview}
              disabled={isProcessing || selectedStudents.length === 0}
            >
              <Eye size={16} /> Xem trước
            </button>
            <button
              className="report-btn report-btn--class-overview"
              onClick={handleClassOverview}
              disabled={isProcessing}
            >
              <Users size={16} /> Báo cáo tổng lớp
            </button>
            <button
              className="report-action-btn primary"
              onClick={handleDownload}
              disabled={isProcessing || selectedStudents.length === 0}
            >
              <Download size={15} />
              Tải xuống ({selectedStudents.length})
            </button>
            <button
              className="report-action-btn secondary"
              onClick={handleSaveToStorage}
              disabled={isProcessing || selectedStudents.length === 0}
            >
              <Save size={15} />
              Lưu server
            </button>
            <button
              className="report-action-btn secondary"
              onClick={() => {
                if (showEmailInput) handleSendEmail();
                else setShowEmailInput(true);
              }}
              disabled={isProcessing || selectedStudents.length === 0}
            >
              <Mail size={15} />
              {showEmailInput ? 'Gửi email' : 'Email'}
            </button>
          </div>

          {/* School info */}
          <div className="report-school-info">
            Trường: {config.schoolName}
            {config.schoolAddress && ` | ${config.schoolAddress}`}
          </div>

        </div>
      </div>
    </div>
  );
}
