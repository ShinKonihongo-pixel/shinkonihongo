// Student Detail Modal - View all information about a student
// Shows grades, attendance, evaluations, and submission history

import { useState, useMemo, useEffect } from 'react';
import type { User } from '../../types/user';
import type {
  Classroom,
  ClassroomTest,
  ClassroomSubmission,
  StudentGrade,
  AttendanceRecord,
  StudentEvaluation,
  StudentAttendanceSummary,
} from '../../types/classroom';
import {
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_COLORS,
  EVALUATION_RATING_LABELS,
  DEFAULT_EVALUATION_CRITERIA,
} from '../../types/classroom';
import {
  X,
  User as UserIcon,
  BarChart3,
  Calendar,
  Star,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
} from 'lucide-react';
import { exportStudentReportPDF } from '../../utils/student-report-pdf-export';
import { getStudentReports } from '../../services/report-storage-service';
import type { ReportMetadata } from '../../types/student-report';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  user?: User;
  classroom?: Classroom;
  studentGrade?: StudentGrade;
  attendanceSummary?: StudentAttendanceSummary;
  attendanceRecords: AttendanceRecord[];
  evaluations: StudentEvaluation[];
  submissions: ClassroomSubmission[];
  tests: ClassroomTest[];
}

type TabType = 'overview' | 'grades' | 'attendance' | 'evaluations' | 'reports';

// ── Helpers ────────────────────────────────────────────────────────────────

function scoreClass(pct: number): 'score-high' | 'score-mid' | 'score-low' {
  if (pct >= 0.8) return 'score-high';
  if (pct >= 0.5) return 'score-mid';
  return 'score-low';
}

// ── SVG Mini-Charts ────────────────────────────────────────────────────────

/** Score trend sparkline — last N submissions (oldest→newest) */
function ScoreSparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) return null;
  const W = 80, H = 28, PAD = 2;
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;
  const pts = scores.map((v, i) => {
    const x = PAD + (i / (scores.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
    return `${x},${y}`;
  });
  const polyline = pts.join(' ');
  const lastPt = pts[pts.length - 1].split(',');
  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="sparkline-svg"
      aria-hidden="true"
    >
      <polyline
        points={polyline}
        fill="none"
        stroke="rgba(6,182,212,0.7)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={parseFloat(lastPt[0])}
        cy={parseFloat(lastPt[1])}
        r="2.5"
        fill="#06b6d4"
      />
    </svg>
  );
}

/** Attendance donut SVG */
function AttendanceDonut({
  present = 0,
  late = 0,
  absent = 0,
  excused = 0,
  rate = 0,
}: {
  present?: number;
  late?: number;
  absent?: number;
  excused?: number;
  rate?: number;
}) {
  const total = present + late + absent + excused;
  const R = 38, CX = 44, CY = 44, stroke = 10;
  const circ = 2 * Math.PI * R;

  type Seg = { count: number; color: string };
  const segments: Seg[] = [
    { count: present, color: '#22c55e' },
    { count: late,    color: '#f59e0b' },
    { count: excused, color: '#60a5fa' },
    { count: absent,  color: '#ef4444' },
  ];

  let offset = 0;
  const arcs = segments.map((seg) => {
    const frac = total > 0 ? seg.count / total : 0;
    const dash = frac * circ;
    const gap  = circ - dash;
    const el = (
      <circle
        key={seg.color}
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke={seg.color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${CX} ${CY})`}
        opacity={frac > 0 ? 0.85 : 0}
      />
    );
    offset += dash;
    return el;
  });

  return (
    <svg width={88} height={88} viewBox="0 0 88 88" aria-hidden="true">
      <circle
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={stroke}
      />
      {arcs}
      <text x={CX} y={CY - 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="white">
        {rate.toFixed(0)}%
      </text>
      <text x={CX} y={CY + 9} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.4)">
        chuyên cần
      </text>
    </svg>
  );
}

/** Radar chart for latest evaluation criteria */
function CriteriaRadar({ evaluation }: { evaluation: StudentEvaluation }) {
  const SIZE = 110, CX = 55, CY = 55, MAX_R = 40;
  const criteria = DEFAULT_EVALUATION_CRITERIA.slice(0, 6); // up to 6 axes
  const n = criteria.length;
  if (n < 3) return null;

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i: number, r: number) => ({
    x: CX + r * Math.cos(angle(i)),
    y: CY + r * Math.sin(angle(i)),
  });

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1].map((frac, ri) => {
    const pts = Array.from({ length: n }, (_, i) => pt(i, MAX_R * frac));
    return (
      <polygon
        key={ri}
        points={pts.map(p => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />
    );
  });

  // Axis lines
  const axes = Array.from({ length: n }, (_, i) => {
    const end = pt(i, MAX_R);
    return (
      <line
        key={i}
        x1={CX} y1={CY}
        x2={end.x} y2={end.y}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1"
      />
    );
  });

  // Data polygon
  const dataPoints = criteria.map((c, i) => {
    const score = evaluation.ratings[c.id] || 0;
    const frac = score / c.maxPoints;
    return pt(i, MAX_R * frac);
  });
  const dataPolyline = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Labels
  const labels = criteria.map((c, i) => {
    const p = pt(i, MAX_R + 11);
    return (
      <text
        key={i}
        x={p.x}
        y={p.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="7"
        fill="rgba(255,255,255,0.45)"
      >
        {c.name.slice(0, 6)}
      </text>
    );
  });

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
      {rings}
      {axes}
      <polygon
        points={dataPolyline}
        fill="rgba(6,182,212,0.15)"
        stroke="#06b6d4"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#8b5cf6" />
      ))}
      {labels}
    </svg>
  );
}

// ── Report History Tab ─────────────────────────────────────────────────────

function ReportHistoryTab({ userId, classroomId }: { userId: string; classroomId?: string }) {
  const [reports, setReports] = useState<ReportMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classroomId) { setLoading(false); return; }
    getStudentReports(classroomId, userId)
      .then(setReports)
      .catch(err => setError(err instanceof Error ? err.message : 'Lỗi tải báo cáo'))
      .finally(() => setLoading(false));
  }, [classroomId, userId]);

  if (!classroomId) {
    return <p className="empty-text">Không có thông tin lớp học.</p>;
  }

  if (loading) {
    return <p className="empty-text">Đang tải báo cáo...</p>;
  }

  if (error) {
    return <p className="empty-text" style={{ color: '#ef4444' }}>{error}</p>;
  }

  if (reports.length === 0) {
    return <p className="empty-text">Chưa có báo cáo nào</p>;
  }

  return (
    <div className="report-history-list">
      {reports.map(report => (
        <div key={report.id} className="report-history-item">
          <div className="report-history-info">
            <span className="report-history-date">
              {new Date(report.generatedAt).toLocaleDateString('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
            <span className="report-history-period">
              {new Date(report.periodStart).toLocaleDateString('vi-VN')} – {new Date(report.periodEnd).toLocaleDateString('vi-VN')}
            </span>
          </div>
          <a
            href={report.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-secondary report-history-download"
          >
            <Download size={13} /> Tải xuống
          </a>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function StudentDetailModal({
  isOpen,
  onClose,
  userId,
  user,
  classroom,
  studentGrade,
  attendanceSummary,
  attendanceRecords,
  evaluations,
  submissions,
  tests,
}: StudentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!user || !classroom) return;
    setExporting(true);
    try {
      await exportStudentReportPDF({
        user,
        classroom,
        studentGrade,
        attendanceSummary,
        attendanceRecords,
        evaluations,
        submissions,
        tests,
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setExporting(false);
    }
  };

  const submissionsWithTest = useMemo(() => {
    return submissions
      .filter(s => s.userId === userId && s.submittedAt)
      .map(sub => ({
        ...sub,
        test: tests.find(t => t.id === sub.testId),
      }))
      .sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime());
  }, [submissions, tests, userId]);

  const userEvaluations = useMemo(() => {
    return evaluations
      .filter(e => e.userId === userId)
      .sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());
  }, [evaluations, userId]);

  const userAttendance = useMemo(() => {
    return attendanceRecords
      .filter(r => r.userId === userId)
      .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
  }, [attendanceRecords, userId]);

  const performanceTrend = useMemo(() => {
    const recent = submissionsWithTest.slice(0, 5).reverse();
    if (recent.length < 2) return 'neutral';
    const firstHalf  = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    const firstAvg  = firstHalf.reduce((sum, s)  => sum + s.score / s.totalPoints, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s.score / s.totalPoints, 0) / secondHalf.length;
    if (secondAvg > firstAvg + 0.1) return 'up';
    if (secondAvg < firstAvg - 0.1) return 'down';
    return 'neutral';
  }, [submissionsWithTest]);

  const avgRating = useMemo(() => {
    if (userEvaluations.length === 0) return 0;
    return userEvaluations.reduce((sum, e) => sum + e.overallRating, 0) / userEvaluations.length;
  }, [userEvaluations]);

  // Last 5 submission percentages for sparkline (oldest first)
  const sparklineScores = useMemo(() => {
    return submissionsWithTest
      .slice(0, 5)
      .reverse()
      .map(s => (s.score / s.totalPoints) * 100);
  }, [submissionsWithTest]);

  // Score distribution buckets: 0-49, 50-69, 70-89, 90-100
  const scoreDistribution = useMemo(() => {
    const buckets = [0, 0, 0, 0]; // <50, 50-69, 70-89, >=90
    submissionsWithTest.forEach(s => {
      const pct = (s.score / s.totalPoints) * 100;
      if (pct < 50) buckets[0]++;
      else if (pct < 70) buckets[1]++;
      else if (pct < 90) buckets[2]++;
      else buckets[3]++;
    });
    return buckets;
  }, [submissionsWithTest]);

  if (!isOpen) return null;

  const displayName = user?.displayName || user?.username || 'Unknown';
  const trendIcon =
    performanceTrend === 'up'   ? <TrendingUp size={14} className="trend-up" /> :
    performanceTrend === 'down' ? <TrendingDown size={14} className="trend-down" /> :
    null;

  const maxBucket = Math.max(...scoreDistribution, 1);
  const bucketColors = ['#ef4444', '#f59e0b', '#22c55e', '#06b6d4'];
  const bucketLabels = ['<50', '50–69', '70–89', '≥90'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content student-detail-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header student-header">
          <div className="student-identity">
            <div className="student-avatar-large">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="student-name-section">
              <h2>{displayName}</h2>
              <span className="student-email">{user?.email || ''}</span>
            </div>
          </div>
          <div className="header-actions">
            {classroom && (
              <button
                className="btn btn-secondary btn-export"
                onClick={handleExportPDF}
                disabled={exporting}
                title="Xuất báo cáo PDF"
              >
                <Download size={15} />
                {exporting ? 'Đang xuất...' : 'Xuất PDF'}
              </button>
            )}
            <button className="btn-close" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="student-tabs">
          {([
            { id: 'overview',    icon: <UserIcon size={15} />,  label: 'Tổng quan' },
            { id: 'grades',      icon: <BarChart3 size={15} />, label: 'Điểm số' },
            { id: 'attendance',  icon: <Calendar size={15} />,  label: 'Chuyên cần' },
            { id: 'evaluations', icon: <Star size={15} />,      label: 'Đánh giá' },
            { id: 'reports',     icon: <FileText size={15} />,  label: 'Báo cáo' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="modal-body student-body">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="student-overview">
              {/* 4-col summary cards */}
              <div className="summary-cards">
                {/* Card 1: Avg score + sparkline */}
                <div className="summary-card">
                  <div className="summary-card-top">
                    <div className="summary-icon">
                      {performanceTrend === 'up'   ? <TrendingUp size={16} /> :
                       performanceTrend === 'down' ? <TrendingDown size={16} /> :
                       <BarChart3 size={16} />}
                    </div>
                    <div className="summary-trend">{trendIcon}</div>
                  </div>
                  <div className="summary-content">
                    <span className="summary-value">
                      {studentGrade?.averagePercent.toFixed(1) ?? 0}%
                    </span>
                    <span className="summary-label">Điểm trung bình</span>
                  </div>
                  <ScoreSparkline scores={sparklineScores} />
                </div>

                {/* Card 2: Attendance */}
                <div className="summary-card">
                  <div className="summary-card-top">
                    <div className="summary-icon"><Calendar size={16} /></div>
                  </div>
                  <div className="summary-content">
                    <span className="summary-value">
                      {attendanceSummary?.attendanceRate.toFixed(0) ?? 0}%
                    </span>
                    <span className="summary-label">Tỷ lệ chuyên cần</span>
                  </div>
                </div>

                {/* Card 3: Submissions */}
                <div className="summary-card">
                  <div className="summary-card-top">
                    <div className="summary-icon"><FileText size={16} /></div>
                  </div>
                  <div className="summary-content">
                    <span className="summary-value">{submissionsWithTest.length}</span>
                    <span className="summary-label">Bài đã nộp</span>
                  </div>
                </div>

                {/* Card 4: Avg rating */}
                <div className="summary-card">
                  <div className="summary-card-top">
                    <div className="summary-icon"><Star size={16} /></div>
                  </div>
                  <div className="summary-content">
                    <span className="summary-value">
                      {avgRating > 0 ? avgRating.toFixed(1) : '–'}/5
                    </span>
                    <span className="summary-label">Đánh giá TB</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="quick-stats-grid">
                <div className="quick-stat">
                  <span className="stat-label">Bài kiểm tra</span>
                  <span className="stat-value">{studentGrade?.testsCompleted ?? 0}</span>
                </div>
                <div className="quick-stat">
                  <span className="stat-label">Bài tập</span>
                  <span className="stat-value">{studentGrade?.assignmentsCompleted ?? 0}</span>
                </div>
                <div className="quick-stat">
                  <span className="stat-label">Có mặt</span>
                  <span className="stat-value">{attendanceSummary?.present ?? 0}</span>
                </div>
                <div className="quick-stat">
                  <span className="stat-label">Vắng</span>
                  <span className="stat-value">{attendanceSummary?.absent ?? 0}</span>
                </div>
              </div>

              {/* Latest Evaluation Preview */}
              {userEvaluations.length > 0 && (
                <div className="latest-evaluation">
                  <h4>Đánh giá gần nhất</h4>
                  <div className="evaluation-preview">
                    <div className="eval-rating">
                      {[1, 2, 3, 4, 5].map(v => (
                        <Star
                          key={v}
                          size={15}
                          fill={v <= userEvaluations[0].overallRating ? '#f59e0b' : 'none'}
                          stroke={v <= userEvaluations[0].overallRating ? '#f59e0b' : 'rgba(255,255,255,0.2)'}
                        />
                      ))}
                    </div>
                    <p className="eval-comment">{userEvaluations[0].comment}</p>
                    <span className="eval-date">
                      {new Date(userEvaluations[0].evaluatedAt).toLocaleDateString('vi-VN')}
                    </span>
                    {/* Radar chart for latest evaluation */}
                    <div className="radar-section">
                      <CriteriaRadar evaluation={userEvaluations[0]} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── GRADES ── */}
          {activeTab === 'grades' && (
            <div className="student-grades-detail">
              <div className="grades-summary">
                <div className="total-score">
                  <span className="score-value">
                    {studentGrade?.totalScore ?? 0}/{studentGrade?.totalPoints ?? 0}
                  </span>
                  <span className="score-label">Tổng điểm</span>
                </div>
                <div className={`average-badge ${(studentGrade?.averagePercent ?? 0) >= 50 ? 'pass' : 'fail'}`}>
                  {studentGrade?.averagePercent.toFixed(1) ?? 0}%
                </div>
              </div>

              {/* Score distribution chart */}
              {submissionsWithTest.length > 0 && (
                <div className="score-distribution">
                  <div className="score-distribution-title">Phân bố điểm</div>
                  <div className="score-dist-bars">
                    {scoreDistribution.map((count, i) => {
                      const heightPct = (count / maxBucket) * 100;
                      return (
                        <div key={i} className="score-dist-bar-wrap">
                          <div
                            className="score-dist-bar"
                            style={{
                              height: `${Math.max(heightPct * 0.42, count > 0 ? 4 : 2)}px`,
                              background: bucketColors[i],
                              opacity: count > 0 ? 0.8 : 0.2,
                            }}
                          />
                          <span className="score-dist-label">{bucketLabels[i]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <h4>Lịch sử bài nộp</h4>
              {submissionsWithTest.length === 0 ? (
                <p className="empty-text">Chưa có bài nộp</p>
              ) : (
                <div className="submissions-list">
                  {submissionsWithTest.map(sub => {
                    const pct = sub.score / sub.totalPoints;
                    const cls = scoreClass(pct);
                    return (
                      <div key={sub.id} className={`submission-item ${cls}`}>
                        <div className="submission-item-left">
                          <div className="submission-info">
                            <span className="submission-title">{sub.test?.title ?? 'Unknown'}</span>
                            <span className="submission-type">
                              {sub.test?.type === 'test' ? '📝 Bài kiểm tra' : '📋 Bài tập'}
                            </span>
                          </div>
                          {/* Visual score bar */}
                          <div className="submission-score-bar-wrap">
                            <div className="submission-score-bar-track">
                              <div
                                className={`submission-score-bar-fill ${cls}`}
                                style={{ width: `${pct * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="submission-result">
                          <span className={`submission-score ${pct >= 0.5 ? 'pass' : 'fail'}`}>
                            {sub.score}/{sub.totalPoints}
                          </span>
                          <span className="submission-percent">
                            ({(pct * 100).toFixed(0)}%)
                          </span>
                          <div className="submission-meta">
                            <span className="submission-time">
                              <Clock size={10} />{Math.floor(sub.timeSpent / 60)} phút
                            </span>
                            <span>{new Date(sub.submittedAt!).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── ATTENDANCE ── */}
          {activeTab === 'attendance' && (
            <div className="student-attendance-detail">
              <div className="attendance-summary">
                {/* SVG Donut */}
                <div className="attendance-donut-wrap">
                  <AttendanceDonut
                    present={attendanceSummary?.present}
                    late={attendanceSummary?.late}
                    absent={attendanceSummary?.absent}
                    excused={attendanceSummary?.excused}
                    rate={attendanceSummary?.attendanceRate ?? 0}
                  />
                  <span className="attendance-donut-label">tổng {(attendanceSummary?.present ?? 0) + (attendanceSummary?.late ?? 0) + (attendanceSummary?.absent ?? 0) + (attendanceSummary?.excused ?? 0)} buổi</span>
                </div>
                <div className="attendance-breakdown">
                  <div className="breakdown-item present">
                    <CheckCircle size={14} />
                    <span>{attendanceSummary?.present ?? 0} Có mặt</span>
                  </div>
                  <div className="breakdown-item late">
                    <Clock size={14} />
                    <span>{attendanceSummary?.late ?? 0} Đi muộn</span>
                  </div>
                  <div className="breakdown-item absent">
                    <XCircle size={14} />
                    <span>{attendanceSummary?.absent ?? 0} Vắng</span>
                  </div>
                  <div className="breakdown-item excused">
                    <AlertCircle size={14} />
                    <span>{attendanceSummary?.excused ?? 0} Có phép</span>
                  </div>
                </div>
              </div>

              {/* Timeline dots (last 30 sessions) */}
              {userAttendance.length > 0 && (
                <div className="attendance-timeline">
                  <div className="attendance-timeline-title">
                    30 buổi gần nhất
                  </div>
                  <div className="attendance-dots">
                    {userAttendance.slice(0, 30).reverse().map(record => (
                      <div
                        key={record.id}
                        className={`attendance-dot ${record.status}`}
                        title={`${new Date(record.sessionDate).toLocaleDateString('vi-VN')} — ${ATTENDANCE_STATUS_LABELS[record.status]}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <h4>Lịch sử điểm danh</h4>
              {userAttendance.length === 0 ? (
                <p className="empty-text">Chưa có dữ liệu điểm danh</p>
              ) : (
                <div className="attendance-history">
                  {userAttendance.map(record => (
                    <div key={record.id} className="attendance-record">
                      <span className="record-date">
                        {new Date(record.sessionDate).toLocaleDateString('vi-VN', {
                          weekday: 'short',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </span>
                      <span
                        className="record-status"
                        style={{ backgroundColor: ATTENDANCE_STATUS_COLORS[record.status] }}
                      >
                        {ATTENDANCE_STATUS_LABELS[record.status]}
                      </span>
                      {record.note && <span className="record-note">{record.note}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── REPORTS ── */}
          {activeTab === 'reports' && (
            <div className="student-reports-detail">
              <h4>Lịch sử báo cáo</h4>
              <ReportHistoryTab userId={userId} classroomId={classroom?.id} />
            </div>
          )}

          {/* ── EVALUATIONS ── */}
          {activeTab === 'evaluations' && (
            <div className="student-evaluations-detail">
              {userEvaluations.length === 0 ? (
                <p className="empty-text">Chưa có đánh giá</p>
              ) : (
                <div className="evaluations-list">
                  {userEvaluations.map(evaluation => (
                    <div key={evaluation.id} className="evaluation-card">
                      <div className="eval-header">
                        <div className="eval-period">
                          {new Date(evaluation.periodStart).toLocaleDateString('vi-VN')} –{' '}
                          {new Date(evaluation.periodEnd).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="eval-rating-display">
                          {[1, 2, 3, 4, 5].map(v => (
                            <Star
                              key={v}
                              size={15}
                              fill={v <= evaluation.overallRating ? '#f59e0b' : 'none'}
                              stroke={v <= evaluation.overallRating ? '#f59e0b' : 'rgba(255,255,255,0.2)'}
                            />
                          ))}
                          <span className="rating-text">
                            {EVALUATION_RATING_LABELS[evaluation.overallRating]}
                          </span>
                        </div>
                      </div>

                      <p className="eval-comment">{evaluation.comment}</p>

                      {evaluation.strengths && (
                        <div className="eval-section strengths">
                          <strong>✓ Điểm mạnh:</strong> {evaluation.strengths}
                        </div>
                      )}

                      {evaluation.improvements && (
                        <div className="eval-section improvements">
                          <strong>△ Cần cải thiện:</strong> {evaluation.improvements}
                        </div>
                      )}

                      {/* Criteria bars */}
                      <div className="eval-criteria-scores">
                        {DEFAULT_EVALUATION_CRITERIA.map(criteria => {
                          const score = evaluation.ratings[criteria.id] ?? 0;
                          const percent = (score / criteria.maxPoints) * 100;
                          return (
                            <div key={criteria.id} className="criteria-score-item">
                              <span className="criteria-name">{criteria.name}</span>
                              <div className="criteria-bar">
                                <div className="criteria-fill" style={{ width: `${percent}%` }} />
                              </div>
                              <span className="criteria-value">{score}/{criteria.maxPoints}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="eval-footer">
                        <span className="eval-date">
                          Đánh giá ngày {new Date(evaluation.evaluatedAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
