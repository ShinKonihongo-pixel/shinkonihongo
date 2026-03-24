// Evaluation Panel - Orchestrator component with state management

import { useState } from 'react';
import { Plus, FileText, Send } from 'lucide-react';
import type { EvaluationFormData, StudentEvaluation } from '../../../types/classroom';
import type { EvaluationPanelProps } from './evaluation-types';
import {
  autoCalculateRatings,
  generateAutoComment,
  calculateOverallRating,
} from './evaluation-types';
import { EvaluationForm } from './evaluation-form';
import { StudentList } from './student-list';
import { exportStudentReportPDF, exportClassroomReportPDF } from '../../../utils/student-report-pdf-export';
import { sendEvaluationNotification, sendBulkEvaluationNotifications } from '../../../services/classroom-firestore';

export function EvaluationPanel({
  evaluations,
  students,
  loading,
  onCreate,
  onUpdate,
  onDelete,
  getAverageRating,
  latestEvaluationByUser,
  classroom,
  studentGrades = [],
  attendanceSummaries = [],
  submissions = [],
  tests = [],
  attendanceRecords = [],
}: EvaluationPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<EvaluationFormData>({
    userId: '',
    periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    periodEnd: new Date().toISOString().split('T')[0],
    ratings: {},
    overallRating: 3,
    comment: '',
    strengths: '',
    improvements: '',
  });

  const getStudentGrade = (userId: string) => studentGrades.find(g => g.userId === userId);
  const getStudentAttendance = (userId: string) => attendanceSummaries.find(a => a.userId === userId);

  const handleAutoFill = (userId: string) => {
    if (!userId) return;

    const ratings = autoCalculateRatings(userId, studentGrades, attendanceSummaries);
    const overallRating = calculateOverallRating(ratings);
    const { comment, strengths, improvements } = generateAutoComment(userId, studentGrades, attendanceSummaries);

    setFormData(prev => ({
      ...prev,
      userId,
      ratings,
      overallRating,
      comment,
      strengths,
      improvements,
    }));
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      periodEnd: new Date().toISOString().split('T')[0],
      ratings: {},
      overallRating: 3,
      comment: '',
      strengths: '',
      improvements: '',
    });
    setShowForm(false);
    setEditingId(null);
  };

  const openEdit = (evaluation: StudentEvaluation) => {
    setFormData({
      userId: evaluation.userId,
      periodStart: evaluation.periodStart,
      periodEnd: evaluation.periodEnd,
      ratings: evaluation.ratings,
      overallRating: evaluation.overallRating,
      comment: evaluation.comment,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
    });
    setEditingId(evaluation.id);
    setShowForm(true);
  };

  const openFormWithUser = (userId?: string) => {
    if (userId) {
      setFormData(prev => ({ ...prev, userId }));
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId || !formData.comment) return;

    setSaving(true);

    if (editingId) {
      const success = await onUpdate(editingId, formData);
      if (success) resetForm();
    } else {
      const result = await onCreate(formData);
      if (result) resetForm();
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    const success = await onDelete(id);
    if (success) {
      setDeleteConfirm(null);
    }
    setSaving(false);
  };

  const handleExportStudent = async (userId: string) => {
    const student = students.find(s => s.userId === userId);
    if (!student?.user || !classroom) return;

    setExporting(true);
    try {
      await exportStudentReportPDF({
        user: student.user,
        classroom,
        studentGrade: getStudentGrade(userId),
        attendanceSummary: getStudentAttendance(userId),
        attendanceRecords: attendanceRecords.filter(r => r.userId === userId),
        evaluations: evaluations.filter(e => e.userId === userId),
        submissions: submissions.filter(s => s.userId === userId),
        tests,
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportAll = async () => {
    if (!classroom) return;

    setExporting(true);
    try {
      await exportClassroomReportPDF(
        classroom,
        students.map(s => ({
          user: s.user!,
          grade: getStudentGrade(s.userId),
          attendance: getStudentAttendance(s.userId),
        })).filter(s => s.user),
        evaluations
      );
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleSendNotification = async (evaluation: StudentEvaluation) => {
    setSending(true);
    setSendSuccess(null);
    try {
      await sendEvaluationNotification(evaluation);
      setSendSuccess(evaluation.id);
      setTimeout(() => setSendSuccess(null), 3000);
    } catch (error) {
      console.error('Error sending notification:', error);
    } finally {
      setSending(false);
    }
  };

  const handleSendAllNotifications = async () => {
    setSending(true);
    setSendSuccess(null);
    try {
      const latestEvaluations = Array.from(latestEvaluationByUser.values());
      if (latestEvaluations.length === 0) {
        alert('Chua co danh gia nao de gui');
        return;
      }
      const sentCount = await sendBulkEvaluationNotifications(latestEvaluations);
      setSendSuccess(`all-${sentCount}`);
      setTimeout(() => setSendSuccess(null), 3000);
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="evaluation-loading">Dang tai...</div>;
  }

  return (
    <div className="evaluation-panel">
      {/* Header with actions */}
      <div className="evaluation-header">
        <h3>Danh gia hoc vien</h3>
        <div className="evaluation-actions-header">
          {classroom && (
            <>
              <button
                className="btn btn-secondary"
                onClick={handleExportAll}
                disabled={exporting}
                title="Xuat bao cao tong hop"
              >
                <FileText size={16} />
                Xuat bao cao lop
              </button>
              <button
                className="btn btn-success"
                onClick={handleSendAllNotifications}
                disabled={sending || evaluations.length === 0}
                title="Gui thong bao danh gia cho tat ca hoc vien"
              >
                <Send size={16} />
                {sending ? 'Dang gui...' : 'Gui tat ca'}
              </button>
              {sendSuccess?.startsWith('all-') && (
                <span className="send-success-badge">
                  Da gui {sendSuccess.split('-')[1]} thong bao!
                </span>
              )}
            </>
          )}
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            <Plus size={16} />
            Tao danh gia
          </button>
        </div>
      </div>

      {/* Evaluation form */}
      {showForm && (
        <EvaluationForm
          formData={formData}
          setFormData={setFormData}
          students={students}
          editingId={editingId}
          saving={saving}
          onSubmit={handleSubmit}
          onClose={resetForm}
          onAutoFill={handleAutoFill}
          getStudentGrade={getStudentGrade}
          getStudentAttendance={getStudentAttendance}
        />
      )}

      {/* Student evaluation list */}
      <div className="evaluation-list">
        <StudentList
          students={students}
          evaluations={evaluations}
          getAverageRating={getAverageRating}
          getStudentGrade={getStudentGrade}
          getStudentAttendance={getStudentAttendance}
          onExportStudent={handleExportStudent}
          onSendNotification={handleSendNotification}
          onOpenForm={openFormWithUser}
          onEditEvaluation={openEdit}
          onDeleteEvaluation={handleDelete}
          deleteConfirm={deleteConfirm}
          setDeleteConfirm={setDeleteConfirm}
          exporting={exporting}
          sending={sending}
          sendSuccess={sendSuccess}
          saving={saving}
          hasClassroom={!!classroom}
        />
      </div>
    </div>
  );
}
