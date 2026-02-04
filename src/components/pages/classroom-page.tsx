// Classroom page - manage and view classrooms
// Modular architecture with separate view components

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
import { StudentReportModal } from '../classroom/student-report-modal';
import { ReportSettingsModal } from '../classroom/report-settings-modal';
import {
  ClassroomListView,
  MembersTab,
  TestsTab,
  GradesTab,
  StudentOverview,
  type ViewMode,
} from '../classroom-views';
import type { Classroom, ClassroomFormData, ClassroomMember, ClassroomTest, TestType, SubmissionAnswer } from '../../types/classroom';
import type { User } from '../../types/user';

interface ClassroomPageProps {
  users: User[];
}

export function ClassroomPage({ users }: ClassroomPageProps) {
  const { currentUser, isAdmin } = useAuth();
  const { classrooms, loading, createClassroom, updateClassroom, deleteClassroom, joinByCode } = useClassrooms(currentUser?.id || null, isAdmin);
  const { templates: testTemplates, assignToClassroom } = useTestTemplates();

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
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Join by code state
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

  // Confirm modal state
  const [publishTestConfirm, setPublishTestConfirm] = useState<string | null>(null);
  const [removeMemberConfirm, setRemoveMemberConfirm] = useState<string | null>(null);

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReportSettingsModal, setShowReportSettingsModal] = useState(false);

  // Hooks
  const { membersWithUsers, students, loading: membersLoading, inviteUser, removeMember } = useClassroomMembers(selectedClassroom?.id || null, users);
  const { tests, testsList, assignmentsList, loading: testsLoading, publishTest } = useClassroomTests(selectedClassroom?.id || null);
  const { mySubmission, submissions: allSubmissions, startSubmission, submitAnswers } = useClassroomSubmissions(activeTest?.id || reviewingTest?.id || null, currentUser?.id);
  const { classProgress, studentGrades, loading: gradesLoading } = useClassroomGrades(selectedClassroom?.id || null, tests, membersWithUsers.map(m => ({ ...m, id: m.id, classroomId: m.classroomId, userId: m.userId, role: m.role, joinedAt: m.joinedAt, invitedBy: m.invitedBy, inviteMethod: m.inviteMethod })), users);
  const { unreadCount } = useClassroomNotifications(currentUser?.id || null);
  const { sessions: attendanceSessions, currentRecords, recordsWithUsers, selectedDate, setSelectedDate, loading: attendanceLoading, createSession, markAttendance, bulkMarkAttendance, studentSummaries, hasSessionForDate } = useClassroomAttendance(selectedClassroom?.id || null, users);
  const { evaluations, loading: evaluationsLoading, createEvaluation, updateEvaluation, deleteEvaluation, getAverageRating, latestEvaluationByUser } = useStudentEvaluations(selectedClassroom?.id || null, users);

  // Handlers
  const handleCreateClassroom = useCallback(async (data: ClassroomFormData): Promise<boolean> => { const result = await createClassroom(data); return !!result; }, [createClassroom]);
  const handleUpdateClassroom = useCallback(async (data: ClassroomFormData): Promise<boolean> => { if (!editingClassroom) return false; return await updateClassroom(editingClassroom.id, data); }, [editingClassroom, updateClassroom]);
  const handleDeleteClassroom = useCallback(async (classroom: Classroom) => { await deleteClassroom(classroom.id); if (selectedClassroom?.id === classroom.id) { setSelectedClassroom(null); setViewMode('list'); } }, [deleteClassroom, selectedClassroom]);

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) { setJoinError('Vui lòng nhập mã lớp'); return; }
    setJoining(true); setJoinError('');
    const result = await joinByCode(joinCode.trim());
    if (result.success) { setJoinCode(''); if (result.classroom) { setSelectedClassroom(result.classroom); setViewMode('detail'); } }
    else { setJoinError(result.error || 'Không thể tham gia lớp học'); }
    setJoining(false);
  };

  const handleSelectClassroom = (classroom: Classroom) => { setSelectedClassroom(classroom); setViewMode('detail'); };
  const handleBack = () => { setSelectedClassroom(null); setViewMode('list'); };
  const handleEdit = (classroom: Classroom) => { setEditingClassroom(classroom); setShowCreateModal(true); };
  const handleInviteUser = async (userId: string): Promise<ClassroomMember | null> => { if (!currentUser) return null; return await inviteUser(userId, currentUser.id); };

  const handleStartTest = async (test: ClassroomTest) => {
    if (!currentUser || !selectedClassroom) return;
    if (mySubmission) { if (mySubmission.submittedAt) setReviewingTest(test); else setActiveTest(test); }
    else { const submission = await startSubmission(selectedClassroom.id, currentUser.id); if (submission) setActiveTest(test); }
  };

  const handleSubmitTest = async (answers: SubmissionAnswer[], timeSpent: number): Promise<boolean> => {
    if (!mySubmission) return false;
    const success = await submitAnswers(mySubmission.id, answers, timeSpent);
    if (success) { setActiveTest(null); setReviewingTest(null); }
    return success;
  };

  const handlePublishTestConfirm = async () => { if (publishTestConfirm) { await publishTest(publishTestConfirm); setPublishTestConfirm(null); } };
  const handleRemoveMemberConfirm = async () => { if (removeMemberConfirm) { await removeMember(removeMemberConfirm); setRemoveMemberConfirm(null); } };
  const handleCreateAttendanceSession = async (date: string) => { if (!currentUser) return null; return await createSession(date, currentUser.id); };
  const handleMarkAttendance = async (userId: string, status: Parameters<typeof markAttendance>[1], note?: string) => { if (!currentUser) return null; return await markAttendance(userId, status, currentUser.id, note); };
  const handleBulkMarkAttendance = async (records: Parameters<typeof bulkMarkAttendance>[0]) => { if (!currentUser) return false; return await bulkMarkAttendance(records, currentUser.id); };
  const handleCreateEvaluation = async (data: Parameters<typeof createEvaluation>[0]) => { if (!currentUser) return null; return await createEvaluation(data, currentUser.id); };
  const handleNavigateToTab = (tab: string) => { setViewMode(tab as ViewMode); };

  if (loading) return <div className="loading-state">Đang tải...</div>;

  // LIST VIEW
  if (viewMode === 'list') {
    return (
      <>
        <ClassroomListView
          classrooms={classrooms}
          isAdmin={isAdmin}
          unreadCount={unreadCount}
          joinCode={joinCode}
          joinError={joinError}
          joining={joining}
          onJoinCodeChange={setJoinCode}
          onJoinByCode={handleJoinByCode}
          onSelectClassroom={handleSelectClassroom}
          onCreateClick={() => { setEditingClassroom(undefined); setShowCreateModal(true); }}
          onEdit={handleEdit}
          onDelete={handleDeleteClassroom}
        />
        <ClassroomCreateModal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); setEditingClassroom(undefined); }} onSave={editingClassroom ? handleUpdateClassroom : handleCreateClassroom} classroom={editingClassroom} />
      </>
    );
  }

  // DETAIL VIEW
  if (!selectedClassroom) return null;

  return (
    <div className="classroom-page">
      <div className="classroom-header">
        <button className="btn btn-back" onClick={handleBack}>← Quay lại</button>
        <h1>{selectedClassroom.name}</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isAdmin && <button className="btn btn-primary" onClick={() => setShowReportModal(true)}>📄 Xuất báo cáo</button>}
          {isAdmin && <button className="btn btn-secondary" onClick={() => handleEdit(selectedClassroom)}>Sửa</button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="classroom-tabs">
        <button className={`tab-btn ${viewMode === 'detail' ? 'active' : ''}`} onClick={() => setViewMode('detail')}>Tổng quan</button>
        {isAdmin && (
          <>
            <button className={`tab-btn ${viewMode === 'members' ? 'active' : ''}`} onClick={() => setViewMode('members')}>Học viên ({selectedClassroom.studentCount})</button>
            <button className={`tab-btn ${viewMode === 'grades' ? 'active' : ''}`} onClick={() => setViewMode('grades')}>Điểm số</button>
          </>
        )}
        <button className={`tab-btn ${viewMode === 'tests' ? 'active' : ''}`} onClick={() => setViewMode('tests')}>Bài kiểm tra ({testsList.length + assignmentsList.length})</button>
        {isAdmin && (
          <>
            <button className={`tab-btn ${viewMode === 'submissions' ? 'active' : ''}`} onClick={() => setViewMode('submissions')}>Quản lý bài nộp</button>
            <button className={`tab-btn ${viewMode === 'attendance' ? 'active' : ''}`} onClick={() => setViewMode('attendance')}>Điểm danh</button>
            <button className={`tab-btn ${viewMode === 'evaluation' ? 'active' : ''}`} onClick={() => setViewMode('evaluation')}>Đánh giá</button>
          </>
        )}
      </div>

      {/* Tab content */}
      <div className="classroom-content">
        {viewMode === 'detail' && isAdmin && (
          <TeacherDashboard classroom={selectedClassroom} classProgress={classProgress} studentGrades={studentGrades} tests={tests} submissions={allSubmissions} attendanceSummaries={studentSummaries} evaluations={evaluations} students={students} onViewStudent={setSelectedStudentId} onViewTest={(testId) => { const test = tests.find(t => t.id === testId); if (test) setReviewingTest(test); }} onNavigateToTab={handleNavigateToTab} />
        )}

        {viewMode === 'detail' && !isAdmin && <StudentOverview classroom={selectedClassroom} />}

        {viewMode === 'members' && isAdmin && (
          <MembersTab classroom={selectedClassroom} students={students} loading={membersLoading} onInviteClick={() => setShowInviteModal(true)} onRemoveMember={(id) => setRemoveMemberConfirm(id)} />
        )}

        {viewMode === 'tests' && (
          <TestsTab tests={tests} testsList={testsList} assignmentsList={assignmentsList} submissions={allSubmissions} isAdmin={isAdmin} loading={testsLoading} onAssignTest={() => { setAssignFilterType('test'); setShowAssignTestModal(true); }} onAssignAssignment={() => { setAssignFilterType('assignment'); setShowAssignTestModal(true); }} onPublish={setPublishTestConfirm} onReview={setReviewingTest} onStartTest={handleStartTest} />
        )}

        {viewMode === 'grades' && isAdmin && <GradesTab studentGrades={studentGrades} loading={gradesLoading} />}

        {viewMode === 'submissions' && isAdmin && (
          <SubmissionTracker tests={tests} submissions={allSubmissions} students={students} onViewSubmission={(submission, test) => setReviewingSubmission({ submission, test })} onGradeSubmission={async (submissionId, answers, feedback) => { if (!currentUser) return false; try { const { gradeSubmission } = await import('../../services/classroom-firestore'); await gradeSubmission(submissionId, answers, feedback, currentUser.id); return true; } catch { return false; } }} />
        )}

        {viewMode === 'attendance' && isAdmin && (
          <AttendancePanel sessions={attendanceSessions} currentRecords={currentRecords} selectedDate={selectedDate} setSelectedDate={setSelectedDate} students={students} loading={attendanceLoading} onCreateSession={handleCreateAttendanceSession} onMarkAttendance={handleMarkAttendance} onBulkMark={handleBulkMarkAttendance} hasSessionForDate={hasSessionForDate} studentSummaries={studentSummaries} />
        )}

        {viewMode === 'evaluation' && isAdmin && (
          <EvaluationPanel evaluations={evaluations} students={students} loading={evaluationsLoading} onCreate={handleCreateEvaluation} onUpdate={updateEvaluation} onDelete={deleteEvaluation} getAverageRating={getAverageRating} latestEvaluationByUser={latestEvaluationByUser} classroom={selectedClassroom || undefined} studentGrades={studentGrades} attendanceSummaries={studentSummaries} submissions={allSubmissions} tests={tests} attendanceRecords={recordsWithUsers} />
        )}
      </div>

      {/* Modals */}
      <ClassroomCreateModal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); setEditingClassroom(undefined); }} onSave={editingClassroom ? handleUpdateClassroom : handleCreateClassroom} classroom={editingClassroom} />
      <ClassroomInviteModal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} classroomCode={selectedClassroom?.code || ''} users={users.filter(u => u.id !== currentUser?.id && (u.role === 'user' || u.role === 'vip_user'))} existingMemberIds={membersWithUsers.map(m => m.userId)} onInviteUser={handleInviteUser} />
      <AssignTestModal isOpen={showAssignTestModal} onClose={() => setShowAssignTestModal(false)} templates={testTemplates} onAssign={async (templateId, options) => { if (!selectedClassroom || !currentUser) return null; return assignToClassroom(templateId, selectedClassroom.id, currentUser.id, options); }} classroomName={selectedClassroom?.name} filterType={assignFilterType} />

      {activeTest && mySubmission && (
        <div className="modal-overlay">
          <div className="modal-content test-take-modal">
            <TestTake test={activeTest} submission={mySubmission} onSubmit={handleSubmitTest} onCancel={() => setActiveTest(null)} />
          </div>
        </div>
      )}

      {reviewingTest && mySubmission && !isAdmin && (
        <div className="modal-overlay">
          <div className="modal-content review-modal">
            <SubmissionReview test={reviewingTest} submission={mySubmission} isAdmin={false} onClose={() => setReviewingTest(null)} />
          </div>
        </div>
      )}

      {reviewingSubmission && isAdmin && (
        <div className="modal-overlay" onClick={() => setReviewingSubmission(null)}>
          <div className="modal-content review-modal" onClick={e => e.stopPropagation()}>
            <SubmissionReview test={reviewingSubmission.test} submission={reviewingSubmission.submission} isAdmin={true} onGrade={async (answers, feedback) => { if (!currentUser) return false; try { const { gradeSubmission } = await import('../../services/classroom-firestore'); await gradeSubmission(reviewingSubmission.submission.id, answers, feedback, currentUser.id); setReviewingSubmission(null); return true; } catch { return false; } }} onClose={() => setReviewingSubmission(null)} />
          </div>
        </div>
      )}

      {selectedStudentId && (
        <StudentDetailModal isOpen={!!selectedStudentId} onClose={() => setSelectedStudentId(null)} userId={selectedStudentId} user={users.find(u => u.id === selectedStudentId)} classroom={selectedClassroom || undefined} studentGrade={studentGrades.find(g => g.userId === selectedStudentId)} attendanceSummary={studentSummaries.find(s => s.userId === selectedStudentId)} attendanceRecords={recordsWithUsers.filter(r => r.userId === selectedStudentId)} evaluations={evaluations.filter(e => e.userId === selectedStudentId)} submissions={allSubmissions.filter(s => s.userId === selectedStudentId)} tests={tests} />
      )}

      {showReportModal && selectedClassroom && currentUser && (
        <StudentReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          classroom={selectedClassroom}
          students={students.map(s => ({
            user: s.user!,
            grade: studentGrades.find(g => g.userId === s.userId),
            attendance: studentSummaries.find(a => a.userId === s.userId),
            evaluation: evaluations.find(e => e.userId === s.userId),
          })).filter(s => s.user)}
          currentUserId={currentUser.id}
          currentUserName={currentUser.displayName || currentUser.username || 'Teacher'}
          onOpenSettings={() => { setShowReportModal(false); setShowReportSettingsModal(true); }}
        />
      )}

      <ReportSettingsModal
        isOpen={showReportSettingsModal}
        onClose={() => setShowReportSettingsModal(false)}
      />

      <ConfirmModal isOpen={!!publishTestConfirm} title="Xuất bản bài kiểm tra" message="Bạn có chắc muốn xuất bản bài kiểm tra này? Học viên sẽ có thể làm bài ngay sau khi xuất bản." confirmText="Xuất bản" onConfirm={handlePublishTestConfirm} onCancel={() => setPublishTestConfirm(null)} />
      <ConfirmModal isOpen={!!removeMemberConfirm} title="Xóa học viên" message="Bạn có chắc muốn xóa học viên này khỏi lớp? Dữ liệu điểm số và bài nộp của học viên vẫn được giữ lại." confirmText="Xóa" onConfirm={handleRemoveMemberConfirm} onCancel={() => setRemoveMemberConfirm(null)} />
    </div>
  );
}
