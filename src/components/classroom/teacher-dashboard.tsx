// Teacher Dashboard - Comprehensive classroom management overview
// Shows key metrics, alerts, recent activity, and quick actions

import React, { useMemo } from 'react';
import type { User } from '../../types/user';
import type {
  Classroom,
  ClassroomTest,
  ClassroomSubmission,
  StudentGrade,
  StudentAttendanceSummary,
  StudentEvaluation,
  ClassProgress,
} from '../../types/classroom';
import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Award,
  Calendar,
  ClipboardList,
  Star,
  BarChart3,
  AlertCircle,
} from 'lucide-react';

interface TeacherDashboardProps {
  classroom: Classroom;
  classProgress: ClassProgress;
  studentGrades: StudentGrade[];
  tests: ClassroomTest[];
  submissions: ClassroomSubmission[];
  attendanceSummaries: StudentAttendanceSummary[];
  evaluations: StudentEvaluation[];
  students: { userId: string; user?: User }[];
  onViewStudent: (userId: string) => void;
  onViewTest: (testId: string) => void;
  onNavigateToTab: (tab: string) => void;
}

interface AlertItem {
  type: 'warning' | 'danger' | 'info';
  icon: React.ReactElement;
  title: string;
  description: string;
  action?: () => void;
  actionLabel?: string;
}

export function TeacherDashboard({
  classProgress,
  studentGrades,
  tests,
  submissions,
  attendanceSummaries,
  evaluations,
  students,
  onViewStudent,
  onNavigateToTab,
}: TeacherDashboardProps) {
  // Calculate key metrics
  const metrics = useMemo(() => {
    const publishedTests = tests.filter(t => t.isPublished);
    const totalPossibleSubmissions = publishedTests.length * students.length;
    const actualSubmissions = submissions.filter(s => s.submittedAt).length;
    const submissionRate = totalPossibleSubmissions > 0
      ? (actualSubmissions / totalPossibleSubmissions) * 100
      : 0;

    // Average attendance rate
    const avgAttendance = attendanceSummaries.length > 0
      ? attendanceSummaries.reduce((sum, s) => sum + s.attendanceRate, 0) / attendanceSummaries.length
      : 0;

    // Average evaluation rating
    const avgRating = evaluations.length > 0
      ? evaluations.reduce((sum, e) => sum + e.overallRating, 0) / evaluations.length
      : 0;

    // Pending submissions (tests published but not all submitted)
    const pendingSubmissions = publishedTests.reduce((count, test) => {
      const testSubs = submissions.filter(s => s.testId === test.id && s.submittedAt);
      return count + (students.length - testSubs.length);
    }, 0);

    // Ungraded text submissions
    const ungradedSubmissions = submissions.filter(s => {
      if (!s.submittedAt) return false;
      const test = tests.find(t => t.id === s.testId);
      if (!test) return false;
      const hasTextQuestions = test.questions.some(q => q.questionType === 'text');
      return hasTextQuestions && !s.gradedBy;
    }).length;

    return {
      totalStudents: students.length,
      avgScore: classProgress.averageClassScore,
      avgAttendance,
      avgRating,
      submissionRate,
      pendingSubmissions,
      ungradedSubmissions,
      testsCreated: classProgress.testsCreated,
      assignmentsCreated: classProgress.assignmentsCreated,
    };
  }, [tests, submissions, students, attendanceSummaries, evaluations, classProgress]);

  // Identify students needing attention
  const alerts = useMemo((): AlertItem[] => {
    const alertList: AlertItem[] = [];

    // Low performing students (< 50%)
    const lowPerformers = studentGrades.filter(g => g.averagePercent < 50 && g.totalPoints > 0);
    if (lowPerformers.length > 0) {
      alertList.push({
        type: 'danger',
        icon: <TrendingDown size={20} />,
        title: `${lowPerformers.length} học viên điểm thấp`,
        description: lowPerformers.map(s => s.userName).slice(0, 3).join(', ') +
          (lowPerformers.length > 3 ? ` và ${lowPerformers.length - 3} người khác` : ''),
        action: () => onNavigateToTab('grades'),
        actionLabel: 'Xem điểm',
      });
    }

    // Low attendance (< 70%)
    const lowAttendance = attendanceSummaries.filter(s => s.attendanceRate < 70 && s.totalSessions > 0);
    if (lowAttendance.length > 0) {
      alertList.push({
        type: 'warning',
        icon: <Calendar size={20} />,
        title: `${lowAttendance.length} học viên chuyên cần thấp`,
        description: lowAttendance.map(s => s.userName).slice(0, 3).join(', ') +
          (lowAttendance.length > 3 ? ` và ${lowAttendance.length - 3} người khác` : ''),
        action: () => onNavigateToTab('attendance'),
        actionLabel: 'Xem điểm danh',
      });
    }

    // Ungraded submissions
    if (metrics.ungradedSubmissions > 0) {
      alertList.push({
        type: 'info',
        icon: <ClipboardList size={20} />,
        title: `${metrics.ungradedSubmissions} bài chưa chấm`,
        description: 'Có bài tự luận cần chấm điểm thủ công',
        action: () => onNavigateToTab('tests'),
        actionLabel: 'Chấm điểm',
      });
    }

    // Overdue assignments
    const overdueAssignments = tests.filter(t =>
      t.type === 'assignment' &&
      t.deadline &&
      new Date(t.deadline) < new Date() &&
      t.isPublished
    );
    if (overdueAssignments.length > 0) {
      alertList.push({
        type: 'warning',
        icon: <Clock size={20} />,
        title: `${overdueAssignments.length} bài tập quá hạn`,
        description: overdueAssignments.map(t => t.title).slice(0, 2).join(', '),
        action: () => onNavigateToTab('tests'),
        actionLabel: 'Xem chi tiết',
      });
    }

    // Students without evaluation
    const studentsWithEval = new Set(evaluations.map(e => e.userId));
    const studentsWithoutEval = students.filter(s => !studentsWithEval.has(s.userId));
    if (studentsWithoutEval.length > 0 && students.length > 0) {
      alertList.push({
        type: 'info',
        icon: <Star size={20} />,
        title: `${studentsWithoutEval.length} học viên chưa đánh giá`,
        description: 'Nên đánh giá định kỳ để theo dõi tiến độ',
        action: () => onNavigateToTab('evaluation'),
        actionLabel: 'Đánh giá',
      });
    }

    return alertList;
  }, [studentGrades, attendanceSummaries, metrics, tests, evaluations, students, onNavigateToTab]);

  // Top and bottom performers
  const performanceRanking = useMemo(() => {
    const sorted = [...studentGrades].sort((a, b) => b.averagePercent - a.averagePercent);
    return {
      top: sorted.slice(0, 3).filter(s => s.totalPoints > 0),
      bottom: sorted.slice(-3).reverse().filter(s => s.totalPoints > 0 && s.averagePercent < 60),
    };
  }, [studentGrades]);

  // Recent submissions
  const recentSubmissions = useMemo(() => {
    return [...submissions]
      .filter(s => s.submittedAt)
      .sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime())
      .slice(0, 5)
      .map(sub => {
        const student = students.find(s => s.userId === sub.userId);
        const test = tests.find(t => t.id === sub.testId);
        return { ...sub, studentName: student?.user?.displayName || student?.user?.username || 'Unknown', testTitle: test?.title || 'Unknown' };
      });
  }, [submissions, students, tests]);

  return (
    <div className="teacher-dashboard">
      {/* Key Metrics Row */}
      <div className="dashboard-metrics">
        <div className="metric-card primary">
          <div className="metric-icon"><Users size={24} /></div>
          <div className="metric-content">
            <span className="metric-value">{metrics.totalStudents}</span>
            <span className="metric-label">Học viên</span>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon"><TrendingUp size={24} /></div>
          <div className="metric-content">
            <span className="metric-value">{metrics.avgScore.toFixed(1)}%</span>
            <span className="metric-label">Điểm TB</span>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon"><Calendar size={24} /></div>
          <div className="metric-content">
            <span className="metric-value">{metrics.avgAttendance.toFixed(0)}%</span>
            <span className="metric-label">Chuyên cần</span>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon"><CheckCircle size={24} /></div>
          <div className="metric-content">
            <span className="metric-value">{metrics.submissionRate.toFixed(0)}%</span>
            <span className="metric-label">Tỷ lệ nộp bài</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon"><FileText size={24} /></div>
          <div className="metric-content">
            <span className="metric-value">{metrics.testsCreated + metrics.assignmentsCreated}</span>
            <span className="metric-label">Bài KT/Tập</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Alerts Panel */}
        {alerts.length > 0 && (
          <div className="dashboard-panel alerts-panel">
            <h3><AlertCircle size={18} /> Cần chú ý</h3>
            <div className="alerts-list">
              {alerts.map((alert, idx) => (
                <div key={idx} className={`alert-item ${alert.type}`}>
                  <div className="alert-icon">{alert.icon}</div>
                  <div className="alert-content">
                    <span className="alert-title">{alert.title}</span>
                    <span className="alert-description">{alert.description}</span>
                  </div>
                  {alert.action && (
                    <button className="btn btn-sm btn-ghost" onClick={alert.action}>
                      {alert.actionLabel}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Overview */}
        <div className="dashboard-panel performance-panel">
          <h3><Award size={18} /> Xếp hạng học viên</h3>

          {performanceRanking.top.length > 0 && (
            <div className="ranking-section">
              <h4 className="ranking-title top">🏆 Top điểm cao</h4>
              <div className="ranking-list">
                {performanceRanking.top.map((student, idx) => (
                  <div
                    key={student.userId}
                    className="ranking-item clickable"
                    onClick={() => onViewStudent(student.userId)}
                  >
                    <span className="rank-number">#{idx + 1}</span>
                    <span className="student-name">{student.userName}</span>
                    <span className="score high">{student.averagePercent.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {performanceRanking.bottom.length > 0 && (
            <div className="ranking-section">
              <h4 className="ranking-title bottom">⚠️ Cần hỗ trợ</h4>
              <div className="ranking-list">
                {performanceRanking.bottom.map((student) => (
                  <div
                    key={student.userId}
                    className="ranking-item clickable"
                    onClick={() => onViewStudent(student.userId)}
                  >
                    <span className="student-name">{student.userName}</span>
                    <span className="score low">{student.averagePercent.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {performanceRanking.top.length === 0 && performanceRanking.bottom.length === 0 && (
            <p className="empty-text">Chưa có dữ liệu điểm</p>
          )}
        </div>

        {/* Recent Submissions */}
        <div className="dashboard-panel recent-panel">
          <h3><ClipboardList size={18} /> Bài nộp gần đây</h3>
          {recentSubmissions.length === 0 ? (
            <p className="empty-text">Chưa có bài nộp</p>
          ) : (
            <div className="recent-list">
              {recentSubmissions.map(sub => (
                <div key={sub.id} className="recent-item">
                  <div className="recent-info">
                    <span className="recent-student">{sub.studentName}</span>
                    <span className="recent-test">{sub.testTitle}</span>
                  </div>
                  <div className="recent-meta">
                    <span className={`recent-score ${sub.score / sub.totalPoints >= 0.5 ? 'pass' : 'fail'}`}>
                      {sub.score}/{sub.totalPoints}
                    </span>
                    <span className="recent-time">
                      {new Date(sub.submittedAt!).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button className="btn btn-link btn-sm" onClick={() => onNavigateToTab('tests')}>
            Xem tất cả →
          </button>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-panel actions-panel">
          <h3><BarChart3 size={18} /> Thao tác nhanh</h3>
          <div className="quick-actions">
            <button className="action-btn" onClick={() => onNavigateToTab('attendance')}>
              <Calendar size={20} />
              <span>Điểm danh hôm nay</span>
            </button>
            <button className="action-btn" onClick={() => onNavigateToTab('tests')}>
              <FileText size={20} />
              <span>Tạo bài kiểm tra</span>
            </button>
            <button className="action-btn" onClick={() => onNavigateToTab('evaluation')}>
              <Star size={20} />
              <span>Đánh giá học viên</span>
            </button>
            <button className="action-btn" onClick={() => onNavigateToTab('grades')}>
              <BarChart3 size={20} />
              <span>Xem bảng điểm</span>
            </button>
          </div>
        </div>

        {/* Class Statistics */}
        <div className="dashboard-panel stats-panel">
          <h3><TrendingUp size={18} /> Thống kê lớp</h3>
          <div className="stats-bars">
            <div className="stat-bar-item">
              <span className="stat-bar-label">Điểm trung bình</span>
              <div className="stat-bar">
                <div
                  className="stat-bar-fill success"
                  style={{ width: `${Math.min(metrics.avgScore, 100)}%` }}
                />
              </div>
              <span className="stat-bar-value">{metrics.avgScore.toFixed(1)}%</span>
            </div>
            <div className="stat-bar-item">
              <span className="stat-bar-label">Tỷ lệ chuyên cần</span>
              <div className="stat-bar">
                <div
                  className="stat-bar-fill info"
                  style={{ width: `${Math.min(metrics.avgAttendance, 100)}%` }}
                />
              </div>
              <span className="stat-bar-value">{metrics.avgAttendance.toFixed(0)}%</span>
            </div>
            <div className="stat-bar-item">
              <span className="stat-bar-label">Tỷ lệ nộp bài</span>
              <div className="stat-bar">
                <div
                  className="stat-bar-fill warning"
                  style={{ width: `${Math.min(metrics.submissionRate, 100)}%` }}
                />
              </div>
              <span className="stat-bar-value">{metrics.submissionRate.toFixed(0)}%</span>
            </div>
            <div className="stat-bar-item">
              <span className="stat-bar-label">Đánh giá TB</span>
              <div className="stat-bar">
                <div
                  className="stat-bar-fill primary"
                  style={{ width: `${(metrics.avgRating / 5) * 100}%` }}
                />
              </div>
              <span className="stat-bar-value">{metrics.avgRating.toFixed(1)}/5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
