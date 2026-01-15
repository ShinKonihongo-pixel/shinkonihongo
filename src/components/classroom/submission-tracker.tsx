// Submission Tracker - Track student submissions for tests/assignments
// Shows who has submitted, pending, and allows quick grading

import { useState, useMemo } from 'react';
import type { User } from '../../types/user';
import type {
  ClassroomTest,
  ClassroomSubmission,
  SubmissionAnswer,
} from '../../types/classroom';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  Award,
} from 'lucide-react';

interface SubmissionTrackerProps {
  tests: ClassroomTest[];
  submissions: ClassroomSubmission[];
  students: { userId: string; user?: User }[];
  onViewSubmission: (submission: ClassroomSubmission, test: ClassroomTest) => void;
  onGradeSubmission: (submissionId: string, answers: SubmissionAnswer[], feedback: string) => Promise<boolean>;
}

type FilterType = 'all' | 'pending' | 'submitted' | 'graded' | 'ungraded';

export function SubmissionTracker({
  tests,
  submissions,
  students,
  onViewSubmission,
  onGradeSubmission,
}: SubmissionTrackerProps) {
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  // Published tests only
  const publishedTests = useMemo(() => {
    return tests.filter(t => t.isPublished);
  }, [tests]);

  // Get submissions for a test with student info
  const getTestSubmissions = (testId: string) => {
    const testSubs = submissions.filter(s => s.testId === testId);
    const test = tests.find(t => t.id === testId);
    const hasTextQuestions = test?.questions.some(q => q.questionType === 'text') || false;

    return students.map(({ userId, user }) => {
      const sub = testSubs.find(s => s.userId === userId);
      const status: 'not_started' | 'in_progress' | 'submitted' | 'graded' =
        !sub ? 'not_started' :
        !sub.submittedAt ? 'in_progress' :
        (hasTextQuestions && !sub.gradedBy) ? 'submitted' : 'graded';

      return {
        userId,
        user,
        submission: sub,
        status,
        score: sub?.score ?? 0,
        totalPoints: sub?.totalPoints ?? test?.totalPoints ?? 0,
      };
    });
  };

  // Test statistics
  const getTestStats = (testId: string) => {
    const subs = getTestSubmissions(testId);
    return {
      total: subs.length,
      submitted: subs.filter(s => s.status === 'submitted' || s.status === 'graded').length,
      graded: subs.filter(s => s.status === 'graded').length,
      inProgress: subs.filter(s => s.status === 'in_progress').length,
      notStarted: subs.filter(s => s.status === 'not_started').length,
    };
  };

  // Filter submissions
  const filterSubmissions = (subs: ReturnType<typeof getTestSubmissions>) => {
    switch (filter) {
      case 'pending':
        return subs.filter(s => s.status === 'not_started' || s.status === 'in_progress');
      case 'submitted':
        return subs.filter(s => s.status === 'submitted' || s.status === 'graded');
      case 'graded':
        return subs.filter(s => s.status === 'graded');
      case 'ungraded':
        return subs.filter(s => s.status === 'submitted');
      default:
        return subs;
    }
  };

  // Overall stats
  const overallStats = useMemo(() => {
    let totalSubmissions = 0;
    let totalGraded = 0;
    let totalPending = 0;
    let ungradedCount = 0;

    publishedTests.forEach(test => {
      const stats = getTestStats(test.id);
      totalSubmissions += stats.submitted;
      totalGraded += stats.graded;
      totalPending += stats.notStarted + stats.inProgress;
      ungradedCount += stats.submitted - stats.graded;
    });

    return { totalSubmissions, totalGraded, totalPending, ungradedCount };
  }, [publishedTests, submissions, students]);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'graded': return <CheckCircle size={16} className="status-icon graded" />;
      case 'submitted': return <Clock size={16} className="status-icon submitted" />;
      case 'in_progress': return <AlertTriangle size={16} className="status-icon in-progress" />;
      default: return <XCircle size={16} className="status-icon not-started" />;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'graded': return 'Đã chấm';
      case 'submitted': return 'Chờ chấm';
      case 'in_progress': return 'Đang làm';
      default: return 'Chưa làm';
    }
  };

  return (
    <div className="submission-tracker">
      {/* Overview Stats */}
      <div className="tracker-stats">
        <div className="stat-card">
          <CheckCircle size={20} className="stat-icon success" />
          <div className="stat-info">
            <span className="stat-value">{overallStats.totalSubmissions}</span>
            <span className="stat-label">Đã nộp</span>
          </div>
        </div>
        <div className="stat-card">
          <Award size={20} className="stat-icon info" />
          <div className="stat-info">
            <span className="stat-value">{overallStats.totalGraded}</span>
            <span className="stat-label">Đã chấm</span>
          </div>
        </div>
        <div className="stat-card">
          <Clock size={20} className="stat-icon warning" />
          <div className="stat-info">
            <span className="stat-value">{overallStats.ungradedCount}</span>
            <span className="stat-label">Chờ chấm</span>
          </div>
        </div>
        <div className="stat-card">
          <XCircle size={20} className="stat-icon danger" />
          <div className="stat-info">
            <span className="stat-value">{overallStats.totalPending}</span>
            <span className="stat-label">Chưa nộp</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="tracker-filters">
        <div className="filter-group">
          <Filter size={16} />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as FilterType)}
            className="form-select filter-select"
          >
            <option value="all">Tất cả</option>
            <option value="pending">Chưa nộp</option>
            <option value="submitted">Đã nộp</option>
            <option value="graded">Đã chấm</option>
            <option value="ungraded">Chờ chấm</option>
          </select>
        </div>
      </div>

      {/* Tests List */}
      <div className="tests-tracker-list">
        {publishedTests.length === 0 ? (
          <p className="empty-text">Chưa có bài kiểm tra/bài tập nào</p>
        ) : (
          publishedTests.map(test => {
            const stats = getTestStats(test.id);
            const isExpanded = expandedTest === test.id;
            const submissionsList = filterSubmissions(getTestSubmissions(test.id));
            const isOverdue = test.deadline && new Date(test.deadline) < new Date();

            return (
              <div key={test.id} className={`tracker-test-card ${isOverdue ? 'overdue' : ''}`}>
                <div
                  className="test-card-header"
                  onClick={() => setExpandedTest(isExpanded ? null : test.id)}
                >
                  <div className="test-info">
                    <span className="test-type-badge">{test.type === 'test' ? '📝' : '📋'}</span>
                    <div className="test-details">
                      <span className="test-title">{test.title}</span>
                      <span className="test-meta">
                        {test.questions.length} câu • {test.totalPoints} điểm
                        {test.deadline && (
                          <span className={`deadline ${isOverdue ? 'overdue' : ''}`}>
                            • Hạn: {new Date(test.deadline).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="test-progress">
                    <div className="progress-bar-mini">
                      <div
                        className="progress-fill graded"
                        style={{ width: `${(stats.graded / stats.total) * 100}%` }}
                      />
                      <div
                        className="progress-fill submitted"
                        style={{
                          width: `${((stats.submitted - stats.graded) / stats.total) * 100}%`,
                          left: `${(stats.graded / stats.total) * 100}%`
                        }}
                      />
                    </div>
                    <span className="progress-text">
                      {stats.submitted}/{stats.total} nộp
                    </span>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="test-submissions">
                    <div className="submissions-header">
                      <span className="submissions-count">
                        {submissionsList.length} học viên
                      </span>
                    </div>

                    <div className="submissions-list-compact">
                      {submissionsList.map(({ userId, user, submission, status, score, totalPoints }) => (
                        <div key={userId} className={`submission-row ${status}`}>
                          <div className="student-info">
                            {statusIcon(status)}
                            <span className="student-name">
                              {user?.displayName || user?.username || 'Unknown'}
                            </span>
                          </div>

                          <div className="submission-status">
                            <span className={`status-badge ${status}`}>
                              {statusLabel(status)}
                            </span>
                          </div>

                          <div className="submission-score">
                            {(status === 'submitted' || status === 'graded') && (
                              <span className={`score ${score / totalPoints >= 0.5 ? 'pass' : 'fail'}`}>
                                {score}/{totalPoints}
                              </span>
                            )}
                          </div>

                          <div className="submission-actions">
                            {submission && submission.submittedAt && (
                              <button
                                className="btn btn-sm btn-icon"
                                onClick={() => onViewSubmission(submission, test)}
                                title="Xem chi tiết"
                              >
                                <Eye size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
