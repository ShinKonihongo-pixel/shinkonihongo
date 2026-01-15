// Student Detail Modal - View all information about a student
// Shows grades, attendance, evaluations, and submission history

import { useState, useMemo } from 'react';
import type { User } from '../../types/user';
import type {
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
} from 'lucide-react';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  user?: User;
  studentGrade?: StudentGrade;
  attendanceSummary?: StudentAttendanceSummary;
  attendanceRecords: AttendanceRecord[];
  evaluations: StudentEvaluation[];
  submissions: ClassroomSubmission[];
  tests: ClassroomTest[];
}

type TabType = 'overview' | 'grades' | 'attendance' | 'evaluations';

export function StudentDetailModal({
  isOpen,
  onClose,
  userId,
  user,
  studentGrade,
  attendanceSummary,
  attendanceRecords,
  evaluations,
  submissions,
  tests,
}: StudentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Student submissions with test info
  const submissionsWithTest = useMemo(() => {
    return submissions
      .filter(s => s.userId === userId && s.submittedAt)
      .map(sub => ({
        ...sub,
        test: tests.find(t => t.id === sub.testId),
      }))
      .sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime());
  }, [submissions, tests, userId]);

  // User evaluations sorted by date
  const userEvaluations = useMemo(() => {
    return evaluations
      .filter(e => e.userId === userId)
      .sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());
  }, [evaluations, userId]);

  // User attendance records sorted by date
  const userAttendance = useMemo(() => {
    return attendanceRecords
      .filter(r => r.userId === userId)
      .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
  }, [attendanceRecords, userId]);

  // Performance trend (last 5 submissions)
  const performanceTrend = useMemo(() => {
    const recent = submissionsWithTest.slice(0, 5).reverse();
    if (recent.length < 2) return 'neutral';
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    const firstAvg = firstHalf.reduce((sum, s) => sum + (s.score / s.totalPoints), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + (s.score / s.totalPoints), 0) / secondHalf.length;
    if (secondAvg > firstAvg + 0.1) return 'up';
    if (secondAvg < firstAvg - 0.1) return 'down';
    return 'neutral';
  }, [submissionsWithTest]);

  // Average evaluation rating
  const avgRating = useMemo(() => {
    if (userEvaluations.length === 0) return 0;
    return userEvaluations.reduce((sum, e) => sum + e.overallRating, 0) / userEvaluations.length;
  }, [userEvaluations]);

  if (!isOpen) return null;

  const displayName = user?.displayName || user?.username || 'Unknown';

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
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="student-tabs">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <UserIcon size={16} /> Tổng quan
          </button>
          <button
            className={`tab-btn ${activeTab === 'grades' ? 'active' : ''}`}
            onClick={() => setActiveTab('grades')}
          >
            <BarChart3 size={16} /> Điểm số
          </button>
          <button
            className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <Calendar size={16} /> Chuyên cần
          </button>
          <button
            className={`tab-btn ${activeTab === 'evaluations' ? 'active' : ''}`}
            onClick={() => setActiveTab('evaluations')}
          >
            <Star size={16} /> Đánh giá
          </button>
        </div>

        {/* Tab Content */}
        <div className="modal-body student-body">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="student-overview">
              {/* Summary Cards */}
              <div className="summary-cards">
                <div className="summary-card">
                  <div className="summary-icon">
                    {performanceTrend === 'up' ? <TrendingUp size={24} className="trend-up" /> :
                     performanceTrend === 'down' ? <TrendingDown size={24} className="trend-down" /> :
                     <BarChart3 size={24} />}
                  </div>
                  <div className="summary-content">
                    <span className="summary-value">
                      {studentGrade?.averagePercent.toFixed(1) || 0}%
                    </span>
                    <span className="summary-label">Điểm trung bình</span>
                  </div>
                </div>

                <div className="summary-card">
                  <div className="summary-icon"><Calendar size={24} /></div>
                  <div className="summary-content">
                    <span className="summary-value">
                      {attendanceSummary?.attendanceRate.toFixed(0) || 0}%
                    </span>
                    <span className="summary-label">Tỷ lệ chuyên cần</span>
                  </div>
                </div>

                <div className="summary-card">
                  <div className="summary-icon"><FileText size={24} /></div>
                  <div className="summary-content">
                    <span className="summary-value">
                      {submissionsWithTest.length}
                    </span>
                    <span className="summary-label">Bài đã nộp</span>
                  </div>
                </div>

                <div className="summary-card">
                  <div className="summary-icon"><Star size={24} /></div>
                  <div className="summary-content">
                    <span className="summary-value">
                      {avgRating > 0 ? avgRating.toFixed(1) : '-'}/5
                    </span>
                    <span className="summary-label">Đánh giá TB</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="quick-stats-grid">
                <div className="quick-stat">
                  <span className="stat-label">Bài kiểm tra</span>
                  <span className="stat-value">{studentGrade?.testsCompleted || 0}</span>
                </div>
                <div className="quick-stat">
                  <span className="stat-label">Bài tập</span>
                  <span className="stat-value">{studentGrade?.assignmentsCompleted || 0}</span>
                </div>
                <div className="quick-stat">
                  <span className="stat-label">Có mặt</span>
                  <span className="stat-value">{attendanceSummary?.present || 0}</span>
                </div>
                <div className="quick-stat">
                  <span className="stat-label">Vắng</span>
                  <span className="stat-value">{attendanceSummary?.absent || 0}</span>
                </div>
              </div>

              {/* Latest Evaluation */}
              {userEvaluations.length > 0 && (
                <div className="latest-evaluation">
                  <h4>Đánh giá gần nhất</h4>
                  <div className="evaluation-preview">
                    <div className="eval-rating">
                      {[1, 2, 3, 4, 5].map(v => (
                        <Star
                          key={v}
                          size={16}
                          fill={v <= userEvaluations[0].overallRating ? '#f39c12' : 'none'}
                          stroke={v <= userEvaluations[0].overallRating ? '#f39c12' : '#ccc'}
                        />
                      ))}
                    </div>
                    <p className="eval-comment">{userEvaluations[0].comment}</p>
                    <span className="eval-date">
                      {new Date(userEvaluations[0].evaluatedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Grades Tab */}
          {activeTab === 'grades' && (
            <div className="student-grades-detail">
              <div className="grades-summary">
                <div className="total-score">
                  <span className="score-value">
                    {studentGrade?.totalScore || 0}/{studentGrade?.totalPoints || 0}
                  </span>
                  <span className="score-label">Tổng điểm</span>
                </div>
                <div className={`average-badge ${(studentGrade?.averagePercent || 0) >= 50 ? 'pass' : 'fail'}`}>
                  {studentGrade?.averagePercent.toFixed(1) || 0}%
                </div>
              </div>

              <h4>Lịch sử bài nộp</h4>
              {submissionsWithTest.length === 0 ? (
                <p className="empty-text">Chưa có bài nộp</p>
              ) : (
                <div className="submissions-list">
                  {submissionsWithTest.map(sub => (
                    <div key={sub.id} className="submission-item">
                      <div className="submission-info">
                        <span className="submission-title">{sub.test?.title || 'Unknown'}</span>
                        <span className="submission-type">
                          {sub.test?.type === 'test' ? '📝 Bài kiểm tra' : '📋 Bài tập'}
                        </span>
                      </div>
                      <div className="submission-result">
                        <span className={`submission-score ${sub.score / sub.totalPoints >= 0.5 ? 'pass' : 'fail'}`}>
                          {sub.score}/{sub.totalPoints}
                        </span>
                        <span className="submission-percent">
                          ({((sub.score / sub.totalPoints) * 100).toFixed(0)}%)
                        </span>
                      </div>
                      <div className="submission-meta">
                        <span className="submission-time">
                          <Clock size={12} />
                          {Math.floor(sub.timeSpent / 60)} phút
                        </span>
                        <span className="submission-date">
                          {new Date(sub.submittedAt!).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="student-attendance-detail">
              <div className="attendance-summary">
                <div className="attendance-rate-display">
                  <div className="rate-circle" style={{
                    background: `conic-gradient(
                      ${ATTENDANCE_STATUS_COLORS.present} 0% ${attendanceSummary?.attendanceRate || 0}%,
                      #e5e7eb ${attendanceSummary?.attendanceRate || 0}% 100%
                    )`
                  }}>
                    <span className="rate-value">{attendanceSummary?.attendanceRate.toFixed(0) || 0}%</span>
                  </div>
                </div>
                <div className="attendance-breakdown">
                  <div className="breakdown-item present">
                    <CheckCircle size={16} />
                    <span>{attendanceSummary?.present || 0} Có mặt</span>
                  </div>
                  <div className="breakdown-item late">
                    <Clock size={16} />
                    <span>{attendanceSummary?.late || 0} Đi muộn</span>
                  </div>
                  <div className="breakdown-item absent">
                    <XCircle size={16} />
                    <span>{attendanceSummary?.absent || 0} Vắng</span>
                  </div>
                  <div className="breakdown-item excused">
                    <AlertCircle size={16} />
                    <span>{attendanceSummary?.excused || 0} Có phép</span>
                  </div>
                </div>
              </div>

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

          {/* Evaluations Tab */}
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
                          {new Date(evaluation.periodStart).toLocaleDateString('vi-VN')} -{' '}
                          {new Date(evaluation.periodEnd).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="eval-rating-display">
                          {[1, 2, 3, 4, 5].map(v => (
                            <Star
                              key={v}
                              size={16}
                              fill={v <= evaluation.overallRating ? '#f39c12' : 'none'}
                              stroke={v <= evaluation.overallRating ? '#f39c12' : '#ccc'}
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

                      {/* Criteria scores */}
                      <div className="eval-criteria-scores">
                        {DEFAULT_EVALUATION_CRITERIA.map(criteria => {
                          const score = evaluation.ratings[criteria.id] || 0;
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
