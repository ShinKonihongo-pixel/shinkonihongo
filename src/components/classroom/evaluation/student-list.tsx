// Student list with evaluations view

import { useState, useMemo } from 'react';
import { Plus, Download, Send, ChevronDown, ChevronUp } from 'lucide-react';
import type { User } from '../../../types/user';
import type { StudentEvaluation, StudentGrade, StudentAttendanceSummary } from '../../../types/classroom';
import { RatingStars } from './rating-components';
import { EvaluationItem } from './evaluation-item';
import type { EvaluationRating } from '../../../types/classroom';

interface StudentListProps {
  students: { userId: string; user?: User }[];
  evaluations: StudentEvaluation[];
  getAverageRating: (userId: string) => number;
  getStudentGrade: (userId: string) => StudentGrade | undefined;
  getStudentAttendance: (userId: string) => StudentAttendanceSummary | undefined;
  onExportStudent: (userId: string) => void;
  onSendNotification: (evaluation: StudentEvaluation) => void;
  onOpenForm: (userId?: string) => void;
  onEditEvaluation: (evaluation: StudentEvaluation) => void;
  onDeleteEvaluation: (id: string) => void;
  deleteConfirm: string | null;
  setDeleteConfirm: (id: string | null) => void;
  exporting: boolean;
  sending: boolean;
  sendSuccess: string | null;
  saving: boolean;
  hasClassroom: boolean;
}

export function StudentList({
  students,
  evaluations,
  getAverageRating,
  getStudentGrade,
  getStudentAttendance,
  onExportStudent,
  onSendNotification,
  onOpenForm,
  onEditEvaluation,
  onDeleteEvaluation,
  deleteConfirm,
  setDeleteConfirm,
  exporting,
  sending,
  sendSuccess,
  saving,
  hasClassroom,
}: StudentListProps) {
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const evaluationsByUser = useMemo(() => {
    const map = new Map<string, StudentEvaluation[]>();
    evaluations.forEach(e => {
      const existing = map.get(e.userId) || [];
      existing.push(e);
      map.set(e.userId, existing);
    });
    return map;
  }, [evaluations]);

  if (students.length === 0) {
    return <p className="empty-text">Chua co hoc vien trong lop</p>;
  }

  return (
    <>
      {students.map(({ userId, user }) => {
        const userEvals = evaluationsByUser.get(userId) || [];
        const avgRating = getAverageRating(userId);
        const isExpanded = expandedUser === userId;
        const grade = getStudentGrade(userId);
        const attendance = getStudentAttendance(userId);

        return (
          <div key={userId} className="evaluation-student-card">
            <div
              className="student-header"
              onClick={() => setExpandedUser(isExpanded ? null : userId)}
            >
              <div className="student-info">
                <div className="student-avatar">
                  {user?.displayName?.charAt(0) || user?.username?.charAt(0) || '?'}
                </div>
                <div className="student-details">
                  <span className="student-name">
                    {user?.displayName || user?.username || 'Unknown'}
                  </span>
                  <span className="evaluation-count">{userEvals.length} danh gia</span>
                </div>
              </div>

              <div className="student-stats-mini">
                <span className="mini-stat" title="Diem TB">
                  {grade?.averagePercent?.toFixed(0) || 0}%
                </span>
                <span className="mini-stat" title="Chuyen can">
                  {attendance?.attendanceRate?.toFixed(0) || 0}%
                </span>
              </div>

              <div className="student-rating">
                {avgRating > 0 ? (
                  <RatingStars rating={Math.round(avgRating) as EvaluationRating} readonly />
                ) : (
                  <span className="no-rating">Chua danh gia</span>
                )}
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>

            {isExpanded && (
              <div className="student-evaluations">
                {/* Student stats summary */}
                <div className="student-stats-expanded">
                  <div className="stat-box">
                    <span className="stat-value-large">{grade?.averagePercent?.toFixed(1) || 0}%</span>
                    <span className="stat-label">Diem TB</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-value-large">{(grade?.testsCompleted || 0) + (grade?.assignmentsCompleted || 0)}</span>
                    <span className="stat-label">Bai nop</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-value-large">{attendance?.attendanceRate?.toFixed(0) || 0}%</span>
                    <span className="stat-label">Chuyen can</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-value-large">{attendance?.present || 0}/{attendance?.totalSessions || 0}</span>
                    <span className="stat-label">Co mat</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="student-evaluation-actions">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => onExportStudent(userId)}
                    disabled={exporting || !hasClassroom}
                  >
                    <Download size={14} />
                    Xuat PDF
                  </button>
                  {userEvals.length > 0 && (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => onSendNotification(userEvals[0])}
                      disabled={sending}
                    >
                      <Send size={14} />
                      Gui thong bao
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => onOpenForm(userId)}
                  >
                    <Plus size={14} />
                    Them danh gia
                  </button>
                </div>

                {/* Evaluations list */}
                {userEvals.length === 0 ? (
                  <p className="empty-text">Chua co danh gia</p>
                ) : (
                  userEvals.map(evaluation => (
                    <EvaluationItem
                      key={evaluation.id}
                      evaluation={evaluation}
                      onEdit={onEditEvaluation}
                      onDelete={onDeleteEvaluation}
                      onSendNotification={onSendNotification}
                      deleteConfirm={deleteConfirm}
                      setDeleteConfirm={setDeleteConfirm}
                      sending={sending}
                      sendSuccess={sendSuccess}
                      saving={saving}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
