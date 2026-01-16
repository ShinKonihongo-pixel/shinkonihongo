// Classroom page - manage and view classrooms

import { useState, useCallback } from 'react';
import { ConfirmModal } from '../ui/confirm-modal';
import {
  useClassrooms,
  useClassroomMembers,
  useClassroomTests,
  useClassroomGrades,
  useClassroomNotifications,
  useClassroomSubmissions,
  useClassroomAttendance,
  useStudentEvaluations,
  useTestTemplates,
} from '../../hooks/use-classrooms';
import { useAuth } from '../../hooks/use-auth';
import { ClassroomCard } from '../classroom/classroom-card';
import { ClassroomCreateModal } from '../classroom/classroom-create-modal';
import { ClassroomInviteModal } from '../classroom/classroom-invite-modal';
import { AssignTestModal } from '../classroom/assign-test-modal';
import { TestTake } from '../classroom/test-take';
import { SubmissionReview } from '../classroom/submission-review';
import { AttendancePanel } from '../classroom/attendance-panel';
import { EvaluationPanel } from '../classroom/evaluation-panel';
import { TeacherDashboard } from '../classroom/teacher-dashboard';
import { StudentDetailModal } from '../classroom/student-detail-modal';
import { SubmissionTracker } from '../classroom/submission-tracker';
import type { Classroom, ClassroomFormData, ClassroomMember, ClassroomTest, TestType, SubmissionAnswer } from '../../types/classroom';
import { CLASSROOM_LEVELS, CLASSROOM_LEVEL_COLORS, DAY_OF_WEEK_LABELS } from '../../types/classroom';
import type { User } from '../../types/user';

type ViewMode = 'list' | 'detail' | 'members' | 'tests' | 'submissions' | 'grades' | 'attendance' | 'evaluation';

interface ClassroomPageProps {
  users: User[];
}

export function ClassroomPage({ users }: ClassroomPageProps) {
  const { currentUser, isAdmin } = useAuth();
  const {
    classrooms,
    loading,
    createClassroom,
    updateClassroom,
    deleteClassroom,
    joinByCode,
  } = useClassrooms(currentUser?.id || null, isAdmin);

  // Test templates (test bank)
  const {
    templates: testTemplates,
    assignToClassroom,
  } = useTestTemplates();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAssignTestModal, setShowAssignTestModal] = useState(false);
  const [assignFilterType, setAssignFilterType] = useState<TestType | 'all'>('all');
  const [editingClassroom, setEditingClassroom] = useState<Classroom | undefined>();

  // Test taking state
  const [activeTest, setActiveTest] = useState<ClassroomTest | null>(null);
  const [reviewingTest, setReviewingTest] = useState<ClassroomTest | null>(null);
  const [reviewingSubmission, setReviewingSubmission] = useState<{ submission: any; test: ClassroomTest } | null>(null);

  // Student detail modal state
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Join by code state
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

  // Confirm modal state
  const [publishTestConfirm, setPublishTestConfirm] = useState<string | null>(null);
  const [removeMemberConfirm, setRemoveMemberConfirm] = useState<string | null>(null);

  // Members hook
  const { membersWithUsers, students, loading: membersLoading, inviteUser, removeMember } = useClassroomMembers(
    selectedClassroom?.id || null,
    users
  );

  // Tests hook
  const { tests, testsList, assignmentsList, loading: testsLoading, publishTest } = useClassroomTests(
    selectedClassroom?.id || null
  );

  // Submissions hook (for active test)
  const {
    mySubmission,
    submissions: allSubmissions,
    startSubmission,
    submitAnswers,
  } = useClassroomSubmissions(activeTest?.id || reviewingTest?.id || null, currentUser?.id);

  // Grades hook
  const { classProgress, studentGrades, loading: gradesLoading } = useClassroomGrades(
    selectedClassroom?.id || null,
    tests,
    membersWithUsers.map(m => ({ ...m, id: m.id, classroomId: m.classroomId, userId: m.userId, role: m.role, joinedAt: m.joinedAt, invitedBy: m.invitedBy, inviteMethod: m.inviteMethod })),
    users
  );

  // Notifications
  const { unreadCount } = useClassroomNotifications(currentUser?.id || null);

  // Attendance hook
  const {
    sessions: attendanceSessions,
    currentRecords,
    recordsWithUsers,
    selectedDate,
    setSelectedDate,
    loading: attendanceLoading,
    createSession,
    markAttendance,
    bulkMarkAttendance,
    studentSummaries,
    hasSessionForDate,
  } = useClassroomAttendance(selectedClassroom?.id || null, users);

  // Evaluations hook
  const {
    evaluations,
    evaluationsWithUsers: _evaluationsWithUsers,
    loading: evaluationsLoading,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
    getAverageRating,
    latestEvaluationByUser,
  } = useStudentEvaluations(selectedClassroom?.id || null, users);

  // Handle create classroom
  const handleCreateClassroom = useCallback(async (data: ClassroomFormData): Promise<boolean> => {
    const result = await createClassroom(data);
    return !!result;
  }, [createClassroom]);

  // Handle update classroom
  const handleUpdateClassroom = useCallback(async (data: ClassroomFormData): Promise<boolean> => {
    if (!editingClassroom) return false;
    return await updateClassroom(editingClassroom.id, data);
  }, [editingClassroom, updateClassroom]);

  // Handle delete classroom
  const handleDeleteClassroom = useCallback(async (classroom: Classroom) => {
    await deleteClassroom(classroom.id);
    if (selectedClassroom?.id === classroom.id) {
      setSelectedClassroom(null);
      setViewMode('list');
    }
  }, [deleteClassroom, selectedClassroom]);

  // Handle join by code
  const handleJoinByCode = async () => {
    if (!joinCode.trim()) {
      setJoinError('Vui lòng nhập mã lớp');
      return;
    }

    setJoining(true);
    setJoinError('');

    const result = await joinByCode(joinCode.trim());

    if (result.success) {
      setJoinCode('');
      if (result.classroom) {
        setSelectedClassroom(result.classroom);
        setViewMode('detail');
      }
    } else {
      setJoinError(result.error || 'Không thể tham gia lớp học');
    }

    setJoining(false);
  };

  // Handle select classroom
  const handleSelectClassroom = (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setViewMode('detail');
  };

  // Handle back to list
  const handleBack = () => {
    setSelectedClassroom(null);
    setViewMode('list');
  };

  // Handle edit classroom
  const handleEdit = (classroom: Classroom) => {
    setEditingClassroom(classroom);
    setShowCreateModal(true);
  };

  // Handle invite user
  const handleInviteUser = async (userId: string): Promise<ClassroomMember | null> => {
    if (!currentUser) return null;
    return await inviteUser(userId, currentUser.id);
  };

  // Handle start test
  const handleStartTest = async (test: ClassroomTest) => {
    if (!currentUser || !selectedClassroom) return;

    // Check if already has a submission
    if (mySubmission) {
      // Resume or view result
      if (mySubmission.submittedAt) {
        setReviewingTest(test);
      } else {
        setActiveTest(test);
      }
    } else {
      // Start new submission
      const submission = await startSubmission(selectedClassroom.id, currentUser.id);
      if (submission) {
        setActiveTest(test);
      }
    }
  };

  // Handle submit test
  const handleSubmitTest = async (answers: SubmissionAnswer[], timeSpent: number): Promise<boolean> => {
    if (!mySubmission) return false;
    const success = await submitAnswers(mySubmission.id, answers, timeSpent);
    if (success) {
      setActiveTest(null);
      setReviewingTest(null);
    }
    return success;
  };

  // Handle publish test
  const handlePublishTestClick = (testId: string) => {
    setPublishTestConfirm(testId);
  };

  const handlePublishTestConfirm = async () => {
    if (publishTestConfirm) {
      await publishTest(publishTestConfirm);
      setPublishTestConfirm(null);
    }
  };

  // Handle remove member
  const handleRemoveMemberClick = (memberId: string) => {
    setRemoveMemberConfirm(memberId);
  };

  const handleRemoveMemberConfirm = async () => {
    if (removeMemberConfirm) {
      await removeMember(removeMemberConfirm);
      setRemoveMemberConfirm(null);
    }
  };

  // Handle create attendance session
  const handleCreateAttendanceSession = async (date: string) => {
    if (!currentUser) return null;
    return await createSession(date, currentUser.id);
  };

  // Handle mark attendance
  const handleMarkAttendance = async (userId: string, status: Parameters<typeof markAttendance>[1], note?: string) => {
    if (!currentUser) return null;
    return await markAttendance(userId, status, currentUser.id, note);
  };

  // Handle bulk mark attendance
  const handleBulkMarkAttendance = async (records: Parameters<typeof bulkMarkAttendance>[0]) => {
    if (!currentUser) return false;
    return await bulkMarkAttendance(records, currentUser.id);
  };

  // Handle create evaluation
  const handleCreateEvaluation = async (data: Parameters<typeof createEvaluation>[0]) => {
    if (!currentUser) return null;
    return await createEvaluation(data, currentUser.id);
  };

  // Handle view student detail
  const handleViewStudent = (userId: string) => {
    setSelectedStudentId(userId);
  };

  // Handle view submission from tracker
  const handleViewSubmissionFromTracker = (submission: any, test: ClassroomTest) => {
    setReviewingSubmission({ submission, test });
  };

  // Handle navigation to tab
  const handleNavigateToTab = (tab: string) => {
    setViewMode(tab as ViewMode);
  };

  // Format schedule for display
  const formatSchedule = (classroom: Classroom) => {
    if (!classroom.schedule || classroom.schedule.length === 0) {
      return 'Chưa có lịch học';
    }
    return classroom.schedule.map(s => (
      <div key={`${s.dayOfWeek}-${s.startTime}`} className="schedule-display-item">
        <span className="schedule-day">{DAY_OF_WEEK_LABELS[s.dayOfWeek]}</span>
        <span className="schedule-time">{s.startTime} - {s.endTime}</span>
      </div>
    ));
  };

  if (loading) {
    return <div className="loading-state">Đang tải...</div>;
  }

  // ============ LIST VIEW ============
  if (viewMode === 'list') {
    return (
      <div className="classroom-page">
        <div className="classroom-header">
          <h1>Lớp học</h1>
          {unreadCount > 0 && (
            <span className="notification-badge-inline">{unreadCount} thông báo mới</span>
          )}
          {isAdmin && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingClassroom(undefined);
                setShowCreateModal(true);
              }}
            >
              + Tạo lớp học
            </button>
          )}
        </div>

        {/* Join by code section for students */}
        {!isAdmin && (
          <div className="join-classroom-section">
            <h3>Tham gia lớp học</h3>
            <div className="join-form">
              <input
                type="text"
                placeholder="Nhập mã lớp học..."
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                className="join-input"
                maxLength={6}
              />
              <button
                className="btn btn-primary"
                onClick={handleJoinByCode}
                disabled={joining}
              >
                {joining ? 'Đang tham gia...' : 'Tham gia'}
              </button>
            </div>
            {joinError && <p className="error-text">{joinError}</p>}
          </div>
        )}

        {/* Classroom list */}
        {classrooms.length === 0 ? (
          <div className="empty-state">
            <p>{isAdmin ? 'Bạn chưa tạo lớp học nào' : 'Bạn chưa tham gia lớp học nào'}</p>
            {!isAdmin && <p className="hint">Nhập mã lớp để tham gia hoặc liên hệ giáo viên để được mời</p>}
          </div>
        ) : (
          <div className="classroom-grid">
            {classrooms.map(classroom => (
              <ClassroomCard
                key={classroom.id}
                classroom={classroom}
                onClick={() => handleSelectClassroom(classroom)}
                showActions={isAdmin}
                onEdit={() => handleEdit(classroom)}
                onDelete={() => handleDeleteClassroom(classroom)}
              />
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <ClassroomCreateModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setEditingClassroom(undefined);
          }}
          onSave={editingClassroom ? handleUpdateClassroom : handleCreateClassroom}
          classroom={editingClassroom}
        />
      </div>
    );
  }

  // ============ DETAIL VIEW ============
  if (!selectedClassroom) {
    return null;
  }

  return (
    <div className="classroom-page">
      <div className="classroom-header">
        <button className="btn btn-back" onClick={handleBack}>
          ← Quay lại
        </button>
        <h1>{selectedClassroom.name}</h1>
        {isAdmin && (
          <button
            className="btn btn-secondary"
            onClick={() => handleEdit(selectedClassroom)}
          >
            Sửa
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="classroom-tabs">
        <button
          className={`tab-btn ${viewMode === 'detail' ? 'active' : ''}`}
          onClick={() => setViewMode('detail')}
        >
          Tổng quan
        </button>
        {isAdmin && (
          <>
            <button
              className={`tab-btn ${viewMode === 'members' ? 'active' : ''}`}
              onClick={() => setViewMode('members')}
            >
              Học viên ({selectedClassroom.studentCount})
            </button>
            <button
              className={`tab-btn ${viewMode === 'grades' ? 'active' : ''}`}
              onClick={() => setViewMode('grades')}
            >
              Điểm số
            </button>
          </>
        )}
        <button
          className={`tab-btn ${viewMode === 'tests' ? 'active' : ''}`}
          onClick={() => setViewMode('tests')}
        >
          Bài kiểm tra ({testsList.length + assignmentsList.length})
        </button>
        {isAdmin && (
          <>
            <button
              className={`tab-btn ${viewMode === 'submissions' ? 'active' : ''}`}
              onClick={() => setViewMode('submissions' as ViewMode)}
            >
              Quản lý bài nộp
            </button>
            <button
              className={`tab-btn ${viewMode === 'attendance' ? 'active' : ''}`}
              onClick={() => setViewMode('attendance')}
            >
              Điểm danh
            </button>
            <button
              className={`tab-btn ${viewMode === 'evaluation' ? 'active' : ''}`}
              onClick={() => setViewMode('evaluation')}
            >
              Đánh giá
            </button>
          </>
        )}
      </div>

      {/* Tab content */}
      <div className="classroom-content">
        {/* Overview Tab - Teacher Dashboard for Admin */}
        {viewMode === 'detail' && isAdmin && (
          <TeacherDashboard
            classroom={selectedClassroom}
            classProgress={classProgress}
            studentGrades={studentGrades}
            tests={tests}
            submissions={allSubmissions}
            attendanceSummaries={studentSummaries}
            evaluations={evaluations}
            students={students}
            onViewStudent={handleViewStudent}
            onViewTest={(testId) => {
              const test = tests.find(t => t.id === testId);
              if (test) setReviewingTest(test);
            }}
            onNavigateToTab={handleNavigateToTab}
          />
        )}

        {/* Overview Tab - Student View */}
        {viewMode === 'detail' && !isAdmin && (
          <div className="classroom-overview">
            <div className="overview-card">
              <h3>Thông tin lớp học</h3>
              <div className="overview-info">
                <div className="info-row">
                  <span className="info-label">Cấp độ:</span>
                  <span
                    className="level-badge"
                    style={{ backgroundColor: CLASSROOM_LEVEL_COLORS[selectedClassroom.level] }}
                  >
                    {CLASSROOM_LEVELS.find(l => l.value === selectedClassroom.level)?.label}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Mã lớp:</span>
                  <span className="classroom-code-display">{selectedClassroom.code}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Số học viên:</span>
                  <span>{selectedClassroom.studentCount}</span>
                </div>
                {selectedClassroom.description && (
                  <div className="info-row">
                    <span className="info-label">Mô tả:</span>
                    <span>{selectedClassroom.description}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="overview-card">
              <h3>Thời khóa biểu</h3>
              <div className="schedule-display">
                {formatSchedule(selectedClassroom)}
              </div>
            </div>
          </div>
        )}

        {/* Members Tab (Admin only) */}
        {viewMode === 'members' && isAdmin && (
          <div className="classroom-members">
            <div className="members-header">
              <h3>Danh sách học viên</h3>
              <button
                className="btn btn-primary"
                onClick={() => setShowInviteModal(true)}
              >
                + Mời học viên
              </button>
            </div>

            {/* Class code display */}
            <div className="class-code-section">
              <span className="class-code-label">Mã lớp:</span>
              <span className="class-code-value">{selectedClassroom.code}</span>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(selectedClassroom.code);
                }}
              >
                Sao chép
              </button>
            </div>

            {/* Current members */}
            <div className="current-members">
              <h4>Học viên hiện tại ({students.length})</h4>
              {membersLoading ? (
                <p>Đang tải...</p>
              ) : students.length === 0 ? (
                <p className="empty-text">Chưa có học viên</p>
              ) : (
                <div className="members-list">
                  {students.map(member => (
                    <div key={member.id} className="member-item">
                      <div className="member-info">
                        <span className="member-name">
                          {member.user?.displayName || member.user?.username || 'Unknown'}
                        </span>
                        <span className="member-joined">
                          Tham gia: {new Date(member.joinedAt).toLocaleDateString('vi-VN')}
                        </span>
                        <span className="member-method">
                          ({member.inviteMethod === 'code' ? 'Mã lớp' : 'Mời trực tiếp'})
                        </span>
                      </div>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleRemoveMemberClick(member.id)}
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tests Tab */}
        {viewMode === 'tests' && (
          <div className="classroom-tests">
            <div className="tests-header">
              <h3>Bài kiểm tra & Bài tập</h3>
              {isAdmin && (
                <div className="tests-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setAssignFilterType('test');
                      setShowAssignTestModal(true);
                    }}
                  >
                    + Giao bài kiểm tra
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setAssignFilterType('assignment');
                      setShowAssignTestModal(true);
                    }}
                  >
                    + Giao bài tập
                  </button>
                </div>
              )}
            </div>

            {testsLoading ? (
              <p>Đang tải...</p>
            ) : tests.length === 0 ? (
              <div className="empty-state">
                <p>Chưa có bài kiểm tra hoặc bài tập nào</p>
              </div>
            ) : (
              <>
                {/* Tests */}
                {testsList.length > 0 && (
                  <div className="tests-section">
                    <h4>Bài kiểm tra</h4>
                    <div className="tests-list">
                      {testsList.map(test => {
                        const canTake = test.isPublished && !isAdmin;
                        return (
                          <div key={test.id} className="test-item">
                            <div className="test-info">
                              <span className="test-title">{test.title}</span>
                              <span className="test-meta">
                                {test.questions.length} câu • {test.timeLimit} phút • {test.totalPoints} điểm
                                {!test.isPublished && <span className="draft-badge">Nháp</span>}
                              </span>
                            </div>
                            <div className="test-actions">
                              {isAdmin ? (
                                <>
                                  {!test.isPublished && (
                                    <button
                                      className="btn btn-sm btn-primary"
                                      onClick={() => handlePublishTestClick(test.id)}
                                    >
                                      Xuất bản
                                    </button>
                                  )}
                                  <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => setReviewingTest(test)}
                                  >
                                    Xem bài nộp ({allSubmissions.filter(s => s.testId === test.id && s.submittedAt).length})
                                  </button>
                                </>
                              ) : canTake ? (
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleStartTest(test)}
                                >
                                  Làm bài
                                </button>
                              ) : (
                                <span className="test-status">Chưa mở</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Assignments */}
                {assignmentsList.length > 0 && (
                  <div className="tests-section">
                    <h4>Bài tập</h4>
                    <div className="tests-list">
                      {assignmentsList.map(assignment => {
                        const canSubmit = assignment.isPublished && !isAdmin;
                        const isOverdue = assignment.deadline && new Date(assignment.deadline) < new Date();
                        return (
                          <div key={assignment.id} className={`test-item ${isOverdue ? 'overdue' : ''}`}>
                            <div className="test-info">
                              <span className="test-title">{assignment.title}</span>
                              <span className="test-meta">
                                {assignment.questions.length} câu • {assignment.totalPoints} điểm
                                {assignment.deadline && (
                                  <span className={`deadline ${isOverdue ? 'overdue' : ''}`}>
                                    Hạn: {new Date(assignment.deadline).toLocaleString('vi-VN')}
                                  </span>
                                )}
                                {!assignment.isPublished && <span className="draft-badge">Nháp</span>}
                              </span>
                            </div>
                            <div className="test-actions">
                              {isAdmin ? (
                                <>
                                  {!assignment.isPublished && (
                                    <button
                                      className="btn btn-sm btn-primary"
                                      onClick={() => handlePublishTestClick(assignment.id)}
                                    >
                                      Xuất bản
                                    </button>
                                  )}
                                  <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => setReviewingTest(assignment)}
                                  >
                                    Xem bài nộp
                                  </button>
                                </>
                              ) : canSubmit && !isOverdue ? (
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleStartTest(assignment)}
                                >
                                  Nộp bài
                                </button>
                              ) : (
                                <span className="test-status">{isOverdue ? 'Quá hạn' : 'Chưa mở'}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Grades Tab (Admin only) */}
        {viewMode === 'grades' && isAdmin && (
          <div className="classroom-grades">
            <div className="grades-header">
              <h3>Bảng điểm</h3>
            </div>

            {gradesLoading ? (
              <p>Đang tải...</p>
            ) : studentGrades.length === 0 ? (
              <div className="empty-state">
                <p>Chưa có dữ liệu điểm</p>
              </div>
            ) : (
              <div className="grades-table-wrapper">
                <table className="grades-table">
                  <thead>
                    <tr>
                      <th>Học viên</th>
                      <th>Bài KT</th>
                      <th>Bài tập</th>
                      <th>Tổng điểm</th>
                      <th>Trung bình</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentGrades.map(grade => (
                      <tr key={grade.userId}>
                        <td>{grade.userName}</td>
                        <td>{grade.testsCompleted}</td>
                        <td>{grade.assignmentsCompleted}</td>
                        <td>{grade.totalScore}/{grade.totalPoints}</td>
                        <td>
                          <span className={`grade-percent ${grade.averagePercent >= 50 ? 'pass' : 'fail'}`}>
                            {grade.averagePercent.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Submissions Tab (Admin only) */}
        {viewMode === 'submissions' && isAdmin && (
          <SubmissionTracker
            tests={tests}
            submissions={allSubmissions}
            students={students}
            onViewSubmission={handleViewSubmissionFromTracker}
            onGradeSubmission={async (submissionId, answers, feedback) => {
              if (!currentUser) return false;
              try {
                const { gradeSubmission } = await import('../../services/classroom-firestore');
                await gradeSubmission(submissionId, answers, feedback, currentUser.id);
                return true;
              } catch {
                return false;
              }
            }}
          />
        )}

        {/* Attendance Tab (Admin only) */}
        {viewMode === 'attendance' && isAdmin && (
          <AttendancePanel
            sessions={attendanceSessions}
            currentRecords={currentRecords}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            students={students}
            loading={attendanceLoading}
            onCreateSession={handleCreateAttendanceSession}
            onMarkAttendance={handleMarkAttendance}
            onBulkMark={handleBulkMarkAttendance}
            hasSessionForDate={hasSessionForDate}
            studentSummaries={studentSummaries}
          />
        )}

        {/* Evaluation Tab (Admin only) */}
        {viewMode === 'evaluation' && isAdmin && (
          <EvaluationPanel
            evaluations={evaluations}
            students={students}
            loading={evaluationsLoading}
            onCreate={handleCreateEvaluation}
            onUpdate={updateEvaluation}
            onDelete={deleteEvaluation}
            getAverageRating={getAverageRating}
            latestEvaluationByUser={latestEvaluationByUser}
            classroom={selectedClassroom || undefined}
            studentGrades={studentGrades}
            attendanceSummaries={studentSummaries}
            submissions={allSubmissions}
            tests={tests}
            attendanceRecords={recordsWithUsers}
          />
        )}
      </div>

      {/* Create/Edit Modal */}
      <ClassroomCreateModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingClassroom(undefined);
        }}
        onSave={editingClassroom ? handleUpdateClassroom : handleCreateClassroom}
        classroom={editingClassroom}
      />

      {/* Invite Modal */}
      <ClassroomInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        classroomCode={selectedClassroom?.code || ''}
        users={users.filter(u => u.id !== currentUser?.id && (u.role === 'user' || u.role === 'vip_user'))}
        existingMemberIds={membersWithUsers.map(m => m.userId)}
        onInviteUser={handleInviteUser}
      />

      {/* Test Create Modal */}
      <AssignTestModal
        isOpen={showAssignTestModal}
        onClose={() => setShowAssignTestModal(false)}
        templates={testTemplates}
        onAssign={async (templateId, options) => {
          if (!selectedClassroom || !currentUser) return null;
          return assignToClassroom(templateId, selectedClassroom.id, currentUser.id, options);
        }}
        classroomName={selectedClassroom?.name}
        filterType={assignFilterType}
      />

      {/* Test Take View */}
      {activeTest && mySubmission && (
        <div className="modal-overlay">
          <div className="modal-content test-take-modal">
            <TestTake
              test={activeTest}
              submission={mySubmission}
              onSubmit={handleSubmitTest}
              onCancel={() => setActiveTest(null)}
            />
          </div>
        </div>
      )}

      {/* Submission Review Modal */}
      {reviewingTest && mySubmission && !isAdmin && (
        <div className="modal-overlay">
          <div className="modal-content review-modal">
            <SubmissionReview
              test={reviewingTest}
              submission={mySubmission}
              isAdmin={false}
              onClose={() => setReviewingTest(null)}
            />
          </div>
        </div>
      )}

      {/* Submission Review Modal from Tracker (Admin) */}
      {reviewingSubmission && isAdmin && (
        <div className="modal-overlay" onClick={() => setReviewingSubmission(null)}>
          <div className="modal-content review-modal" onClick={e => e.stopPropagation()}>
            <SubmissionReview
              test={reviewingSubmission.test}
              submission={reviewingSubmission.submission}
              isAdmin={true}
              onGrade={async (answers, feedback) => {
                if (!currentUser) return false;
                try {
                  const { gradeSubmission } = await import('../../services/classroom-firestore');
                  await gradeSubmission(reviewingSubmission.submission.id, answers, feedback, currentUser.id);
                  setReviewingSubmission(null);
                  return true;
                } catch {
                  return false;
                }
              }}
              onClose={() => setReviewingSubmission(null)}
            />
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudentId && (
        <StudentDetailModal
          isOpen={!!selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
          userId={selectedStudentId}
          user={users.find(u => u.id === selectedStudentId)}
          classroom={selectedClassroom || undefined}
          studentGrade={studentGrades.find(g => g.userId === selectedStudentId)}
          attendanceSummary={studentSummaries.find(s => s.userId === selectedStudentId)}
          attendanceRecords={recordsWithUsers.filter(r => r.userId === selectedStudentId)}
          evaluations={evaluations.filter(e => e.userId === selectedStudentId)}
          submissions={allSubmissions.filter(s => s.userId === selectedStudentId)}
          tests={tests}
        />
      )}

      {/* Publish Test Confirm Modal */}
      <ConfirmModal
        isOpen={!!publishTestConfirm}
        title="Xuất bản bài kiểm tra"
        message="Bạn có chắc muốn xuất bản bài kiểm tra này? Học viên sẽ có thể làm bài ngay sau khi xuất bản."
        confirmText="Xuất bản"
        onConfirm={handlePublishTestConfirm}
        onCancel={() => setPublishTestConfirm(null)}
      />

      {/* Remove Member Confirm Modal */}
      <ConfirmModal
        isOpen={!!removeMemberConfirm}
        title="Xóa học viên"
        message="Bạn có chắc muốn xóa học viên này khỏi lớp? Dữ liệu điểm số và bài nộp của học viên vẫn được giữ lại."
        confirmText="Xóa"
        onConfirm={handleRemoveMemberConfirm}
        onCancel={() => setRemoveMemberConfirm(null)}
      />
    </div>
  );
}
