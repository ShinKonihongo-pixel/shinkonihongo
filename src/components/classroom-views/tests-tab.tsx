// Tests Tab - Tests and assignments listing

import type { TestsTabProps } from './classroom-types';
import type { ClassroomTest } from '../../types/classroom';

export function TestsTab({
  tests, testsList, assignmentsList, submissions, isAdmin, loading,
  onAssignTest, onAssignAssignment, onPublish, onReview, onStartTest,
}: TestsTabProps) {
  const renderTestItem = (test: ClassroomTest, isAssignment: boolean = false) => {
    const canTake = test.isPublished && !isAdmin;
    const isOverdue = isAssignment && test.deadline && new Date(test.deadline) < new Date();

    return (
      <div key={test.id} className={`test-item ${isOverdue ? 'overdue' : ''}`}>
        <div className="test-info">
          <span className="test-title">{test.title}</span>
          <span className="test-meta">
            {test.questions.length} câu • {!isAssignment && `${test.timeLimit} phút • `}{test.totalPoints} điểm
            {isAssignment && test.deadline && (
              <span className={`deadline ${isOverdue ? 'overdue' : ''}`}>
                Hạn: {new Date(test.deadline).toLocaleString('vi-VN')}
              </span>
            )}
            {!test.isPublished && <span className="draft-badge">Nháp</span>}
          </span>
        </div>
        <div className="test-actions">
          {isAdmin ? (
            <>
              {!test.isPublished && (
                <button className="btn btn-sm btn-primary" onClick={() => onPublish(test.id)}>Xuất bản</button>
              )}
              <button className="btn btn-sm btn-secondary" onClick={() => onReview(test)}>
                Xem bài nộp {!isAssignment && `(${submissions.filter(s => s.testId === test.id && s.submittedAt).length})`}
              </button>
            </>
          ) : canTake && !isOverdue ? (
            <button className="btn btn-sm btn-primary" onClick={() => onStartTest(test)}>
              {isAssignment ? 'Nộp bài' : 'Làm bài'}
            </button>
          ) : (
            <span className="test-status">{isOverdue ? 'Quá hạn' : 'Chưa mở'}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="classroom-tests">
      <div className="tests-header">
        <h3>Bài kiểm tra & Bài tập</h3>
        {isAdmin && (
          <div className="tests-actions">
            <button className="btn btn-primary" onClick={onAssignTest}>+ Giao bài kiểm tra</button>
            <button className="btn btn-secondary" onClick={onAssignAssignment}>+ Giao bài tập</button>
          </div>
        )}
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : tests.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có bài kiểm tra hoặc bài tập nào</p>
        </div>
      ) : (
        <>
          {testsList.length > 0 && (
            <div className="tests-section">
              <h4>Bài kiểm tra</h4>
              <div className="tests-list">{testsList.map(test => renderTestItem(test))}</div>
            </div>
          )}
          {assignmentsList.length > 0 && (
            <div className="tests-section">
              <h4>Bài tập</h4>
              <div className="tests-list">{assignmentsList.map(assignment => renderTestItem(assignment, true))}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
