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
import type { StudentReportConfig, StudentReportData } from '../../types/student-report';
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
} from 'lucide-react';

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
  // State
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [periodStart, setPeriodStart] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
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

  // Load config from localStorage
  const config: StudentReportConfig = useMemo(() => {
    try {
      const saved = localStorage.getItem(REPORT_SETTINGS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_REPORT_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // Ignore parse errors
    }
    return DEFAULT_REPORT_CONFIG;
  }, []);

  // Toggle student selection
  const toggleStudent = (userId: string) => {
    setSelectedStudents(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Select all students
  const selectAll = () => {
    setSelectedStudents(students.map(s => s.user.id));
  };

  // Deselect all students
  const deselectAll = () => {
    setSelectedStudents([]);
  };

  // Prepare report data for a student
  const prepareReportData = (student: typeof students[0]): StudentReportData => {
    return {
      studentId: student.user.id,
      studentName: student.user.displayName || student.user.username || 'Unknown',
      studentEmail: student.user.email,
      classroomId: classroom.id,
      classroomName: classroom.name,
      level: classroom.level,
      levelLabel: CLASSROOM_LEVEL_LABELS[classroom.level],
      periodStart,
      periodEnd,
      attendance: showAttendance ? student.attendance : undefined,
      grades: showGrades ? student.grade : undefined,
      evaluation: showEvaluation ? student.evaluation : undefined,
      teacherName: currentUserName,
      teacherId: currentUserId,
      generatedAt: new Date().toISOString(),
      generatedBy: currentUserId,
    };
  };

  // Get export config
  const getExportConfig = (): StudentReportConfig => ({
    ...config,
    showAttendance,
    showGrades,
    showEvaluation,
    showSignatures,
  });

  // Handle download action
  const handleDownload = async () => {
    if (selectedStudents.length === 0) return;

    setIsProcessing(true);
    setCurrentAction('download');
    setResults(null);

    const selectedData = students.filter(s => selectedStudents.includes(s.user.id));
    const exportConfig = getExportConfig();

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < selectedData.length; i++) {
      const student = selectedData[i];
      setProgress({ current: i + 1, total: selectedData.length, name: student.user.displayName || student.user.username || 'Unknown' });

      try {
        const reportData = prepareReportData(student);
        await downloadStudentReportPDF(reportData, exportConfig);
        success++;
      } catch (error) {
        failed++;
        errors.push(`${student.user.displayName || student.user.username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Small delay between downloads
      if (i < selectedData.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setResults({ success, failed, errors });
    setIsProcessing(false);
    setCurrentAction(null);
  };

  // Handle save to storage action
  const handleSaveToStorage = async () => {
    if (selectedStudents.length === 0) return;

    setIsProcessing(true);
    setCurrentAction('save');
    setResults(null);

    const selectedData = students.filter(s => selectedStudents.includes(s.user.id));
    const exportConfig = getExportConfig();

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < selectedData.length; i++) {
      const student = selectedData[i];
      setProgress({ current: i + 1, total: selectedData.length, name: student.user.displayName || student.user.username || 'Unknown' });

      try {
        const reportData = prepareReportData(student);
        const pdfBlob = await getStudentReportPDFBlob(reportData, exportConfig);
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

  // Handle email action
  const handleSendEmail = async () => {
    if (selectedStudents.length === 0) return;

    // Check if email config is set
    if (!config.emailServiceId || !config.emailTemplateId || !config.emailPublicKey) {
      setResults({
        success: 0,
        failed: 1,
        errors: ['Chua cau hinh EmailJS. Vui long vao Cai dat de thiet lap truoc khi gui email.'],
      });
      return;
    }

    setIsProcessing(true);
    setCurrentAction('email');
    setResults(null);

    const selectedData = students.filter(s => selectedStudents.includes(s.user.id));
    const exportConfig = getExportConfig();

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < selectedData.length; i++) {
      const student = selectedData[i];
      const recipientEmail = emailAddress || student.user.email;

      setProgress({ current: i + 1, total: selectedData.length, name: student.user.displayName || student.user.username || 'Unknown' });

      if (!recipientEmail || !isValidEmail(recipientEmail)) {
        failed++;
        errors.push(`${student.user.displayName || student.user.username}: Khong co email hop le`);
        continue;
      }

      try {
        // First save to storage to get URL
        const reportData = prepareReportData(student);
        const pdfBlob = await getStudentReportPDFBlob(reportData, exportConfig);
        const savedReport = await saveReportToStorage(
          classroom.id,
          student.user.id,
          student.user.displayName || student.user.username || 'Unknown',
          periodStart,
          periodEnd,
          pdfBlob,
          currentUserId
        );

        // Send email with PDF URL
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

        if (result.success) {
          success++;
        } else {
          failed++;
          errors.push(`${student.user.displayName || student.user.username}: ${result.message}`);
        }
      } catch (error) {
        failed++;
        errors.push(`${student.user.displayName || student.user.username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Delay between emails to avoid rate limiting
      if (i < selectedData.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    setResults({ success, failed, errors });
    setIsProcessing(false);
    setCurrentAction(null);
    setShowEmailInput(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content student-report-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.25rem' }}>
            <FileText size={24} />
            Xuat bao cao hoc vien
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              onClick={onOpenSettings}
              title="Cai dat bao cao"
              style={{ padding: '0.5rem' }}
            >
              <Settings size={18} />
            </button>
            <button className="btn-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Date Range */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: '500' }}>
            <Calendar size={16} />
            Ky hoc
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="date"
              value={periodStart}
              onChange={e => setPeriodStart(e.target.value)}
              style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
            />
            <span>-</span>
            <input
              type="date"
              value={periodEnd}
              onChange={e => setPeriodEnd(e.target.value)}
              style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
            />
          </div>
        </div>

        {/* Student Selection */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
              <Users size={16} />
              Chon hoc vien ({selectedStudents.length}/{students.length})
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-sm" onClick={selectAll} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                Chon tat ca
              </button>
              <button className="btn btn-sm btn-secondary" onClick={deselectAll} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                Bo chon
              </button>
            </div>
          </div>
          <div
            style={{
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem',
            }}
          >
            {students.map(student => (
              <label
                key={student.user.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: selectedStudents.includes(student.user.id) ? 'var(--jp-sakura-light)' : 'transparent',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(student.user.id)}
                  onChange={() => toggleStudent(student.user.id)}
                />
                <span style={{ flex: 1 }}>{student.user.displayName || student.user.username || 'Unknown'}</span>
                {student.grade && <span style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{student.grade.averagePercent.toFixed(0)}%</span>}
              </label>
            ))}
          </div>
        </div>

        {/* Export Options */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>Noi dung bao cao</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={showAttendance} onChange={e => setShowAttendance(e.target.checked)} />
              Diem danh
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={showGrades} onChange={e => setShowGrades(e.target.checked)} />
              Diem so
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={showEvaluation} onChange={e => setShowEvaluation(e.target.checked)} />
              Danh gia
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={showSignatures} onChange={e => setShowSignatures(e.target.checked)} />
              Chu ky
            </label>
          </div>
        </div>

        {/* Email Input (conditional) */}
        {showEmailInput && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
              Email nhan bao cao (de trong de dung email hoc vien)
            </label>
            <input
              type="email"
              value={emailAddress}
              onChange={e => setEmailAddress(e.target.value)}
              placeholder="email@example.com"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
            />
          </div>
        )}

        {/* Progress */}
        {isProcessing && (
          <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'var(--jp-washi-cool)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
              <span>
                {currentAction === 'download' && 'Dang tai xuong...'}
                {currentAction === 'save' && 'Dang luu len server...'}
                {currentAction === 'email' && 'Dang gui email...'}
              </span>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray)' }}>
              {progress.current}/{progress.total}: {progress.name}
            </div>
            <div style={{ height: '4px', backgroundColor: 'var(--border)', borderRadius: '2px', marginTop: '0.5rem' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(progress.current / progress.total) * 100}%`,
                  backgroundColor: 'var(--success)',
                  borderRadius: '2px',
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '1rem',
              backgroundColor: results.failed === 0 ? 'var(--success-light)' : 'var(--danger-light)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {results.failed === 0 ? <CheckCircle size={18} color="var(--success)" /> : <AlertCircle size={18} color="var(--danger)" />}
              <span style={{ fontWeight: '500' }}>
                Hoan thanh: {results.success} thanh cong, {results.failed} that bai
              </span>
            </div>
            {results.errors.length > 0 && (
              <div style={{ fontSize: '0.875rem', color: 'var(--danger)' }}>
                {results.errors.slice(0, 3).map((error, i) => (
                  <div key={i}>{error}</div>
                ))}
                {results.errors.length > 3 && <div>...va {results.errors.length - 3} loi khac</div>}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={handleDownload}
            disabled={isProcessing || selectedStudents.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'center' }}
          >
            <Download size={16} />
            Tai xuong ({selectedStudents.length})
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleSaveToStorage}
            disabled={isProcessing || selectedStudents.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'center' }}
          >
            <Save size={16} />
            Luu server
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (showEmailInput) {
                handleSendEmail();
              } else {
                setShowEmailInput(true);
              }
            }}
            disabled={isProcessing || selectedStudents.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'center' }}
          >
            <Mail size={16} />
            {showEmailInput ? 'Gui email' : 'Email'}
          </button>
        </div>

        {/* School info preview */}
        <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--gray)', textAlign: 'center' }}>
          Truong: {config.schoolName}
          {config.schoolAddress && ` | ${config.schoolAddress}`}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
