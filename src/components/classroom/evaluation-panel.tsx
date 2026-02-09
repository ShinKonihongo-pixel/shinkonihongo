// Student evaluation panel component with comprehensive rating system
// Includes auto-calculate from grades/attendance and export features

import { useState, useMemo } from 'react';
import type { User } from '../../types/user';
import type {
  Classroom,
  StudentEvaluation,
  EvaluationFormData,
  EvaluationRating,
  EvaluationLevel,
  StudentGrade,
  StudentAttendanceSummary,
  ClassroomSubmission,
  ClassroomTest,
} from '../../types/classroom';
import {
  EVALUATION_RATING_LABELS,
  EVALUATION_LEVEL_INFO,
  DEFAULT_EVALUATION_CRITERIA,
  EVALUATION_COMMENT_SUGGESTIONS,
} from '../../types/classroom';
import { Star, Plus, Edit2, Trash2, ChevronDown, ChevronUp, Lightbulb, X, Download, Zap, Send, FileText } from 'lucide-react';
import { exportStudentReportPDF, exportClassroomReportPDF } from '../../utils/student-report-pdf-export';
import { sendEvaluationNotification, sendBulkEvaluationNotifications } from '../../services/classroom-firestore';

interface EvaluationPanelProps {
  evaluations: StudentEvaluation[];
  students: { userId: string; user?: User }[];
  loading: boolean;
  onCreate: (data: EvaluationFormData) => Promise<StudentEvaluation | null>;
  onUpdate: (id: string, data: Partial<StudentEvaluation>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  getAverageRating: (userId: string) => number;
  latestEvaluationByUser: Map<string, StudentEvaluation>;
  // Additional data for auto-calculate and export
  classroom?: Classroom;
  studentGrades?: StudentGrade[];
  attendanceSummaries?: StudentAttendanceSummary[];
  submissions?: ClassroomSubmission[];
  tests?: ClassroomTest[];
  attendanceRecords?: Array<{ userId: string; sessionDate: string; status: string; note?: string }>;
}

// Rating star component
function RatingStars({ rating, onChange, readonly = false }: {
  rating: EvaluationRating | 0;
  onChange?: (rating: EvaluationRating) => void;
  readonly?: boolean;
}) {
  return (
    <div className={`rating-stars ${readonly ? 'readonly' : ''}`}>
      {[1, 2, 3, 4, 5].map(value => (
        <button
          key={value}
          type="button"
          className={`star-btn ${value <= rating ? 'filled' : ''}`}
          onClick={() => !readonly && onChange?.(value as EvaluationRating)}
          disabled={readonly}
        >
          <Star size={18} fill={value <= rating ? '#f39c12' : 'none'} />
        </button>
      ))}
      {rating > 0 && (
        <span className="rating-label">{EVALUATION_RATING_LABELS[rating as EvaluationRating]}</span>
      )}
    </div>
  );
}

// Level selector buttons
function LevelSelector({ onSelect, currentPoints, maxPoints }: {
  onSelect: (level: EvaluationLevel) => void;
  currentPoints: number;
  maxPoints: number;
}) {
  const currentLevel = getPointsLevel(currentPoints, maxPoints);

  return (
    <div className="level-selector">
      {(Object.entries(EVALUATION_LEVEL_INFO) as [EvaluationLevel, typeof EVALUATION_LEVEL_INFO[EvaluationLevel]][]).map(([level, info]) => (
        <button
          key={level}
          type="button"
          className={`level-btn-mini ${currentLevel === level ? 'active' : ''}`}
          style={{ '--level-color': info.color } as React.CSSProperties}
          onClick={() => onSelect(level)}
          title={`${info.pointRange[0]}-${info.pointRange[1]} diem`}
        >
          {info.label}
        </button>
      ))}
    </div>
  );
}

// Get level from points (percentage based)
function getPointsLevel(points: number, maxPoints: number): EvaluationLevel {
  const percentage = (points / maxPoints) * 10;
  if (percentage >= 9) return 'excellent';
  if (percentage >= 7) return 'good';
  if (percentage >= 5) return 'average';
  return 'weak';
}

// Get points from level
function getLevelPoints(level: EvaluationLevel, maxPoints: number): number {
  const range = EVALUATION_LEVEL_INFO[level].pointRange;
  return Math.round((range[0] + range[1]) / 2 * maxPoints / 10);
}

// Get level from percentage
function getLevelFromPercent(percent: number): EvaluationLevel {
  if (percent >= 90) return 'excellent';
  if (percent >= 70) return 'good';
  if (percent >= 50) return 'average';
  return 'weak';
}

// Suggestion chip component
function SuggestionChip({ text, onClick, selected }: {
  text: string;
  onClick: () => void;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      className={`suggestion-chip ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      {text}
    </button>
  );
}

// Student stats display component
function StudentStats({ grade, attendance }: {
  grade?: StudentGrade;
  attendance?: StudentAttendanceSummary;
}) {
  return (
    <div className="student-stats-preview">
      <div className="stat-item">
        <span className="stat-label">Diem TB:</span>
        <span className={`stat-value ${(grade?.averagePercent || 0) >= 50 ? 'good' : 'poor'}`}>
          {grade?.averagePercent?.toFixed(0) || 0}%
        </span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Bai nop:</span>
        <span className="stat-value">{(grade?.testsCompleted || 0) + (grade?.assignmentsCompleted || 0)}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Chuyen can:</span>
        <span className={`stat-value ${(attendance?.attendanceRate || 0) >= 80 ? 'good' : 'poor'}`}>
          {attendance?.attendanceRate?.toFixed(0) || 0}%
        </span>
      </div>
    </div>
  );
}

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
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<EvaluationFormData>({
    userId: '',
    periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    periodEnd: new Date().toISOString().split('T')[0],
    ratings: {},
    overallRating: 3 as EvaluationRating,
    comment: '',
    strengths: '',
    improvements: '',
  });

  // Get student grade and attendance
  const getStudentGrade = (userId: string) => studentGrades.find(g => g.userId === userId);
  const getStudentAttendance = (userId: string) => attendanceSummaries.find(a => a.userId === userId);

  // Auto-calculate ratings based on grades and attendance
  const autoCalculateRatings = (userId: string): Record<string, number> => {
    const grade = getStudentGrade(userId);
    const attendance = getStudentAttendance(userId);
    const ratings: Record<string, number> = {};

    // Calculate based on available data
    const avgPercent = grade?.averagePercent || 0;
    const attendanceRate = attendance?.attendanceRate || 0;
    const testsCompleted = (grade?.testsCompleted || 0) + (grade?.assignmentsCompleted || 0);

    // Vocabulary, Grammar, Kanji, Speaking, Reading, Listening - based on test scores
    const languageLevel = getLevelFromPercent(avgPercent);
    const languagePoints = getLevelPoints(languageLevel, 10);
    ['vocabulary', 'grammar', 'kanji', 'speaking', 'reading', 'listening'].forEach(id => {
      ratings[id] = languagePoints;
    });

    // Participation - based on attendance + tests completed
    const participationScore = Math.min(10, Math.round((attendanceRate / 10) * 0.6 + (testsCompleted > 5 ? 4 : testsCompleted * 0.8)));
    ratings['participation'] = participationScore;

    // Homework - based on assignments completed
    const homeworkScore = Math.min(10, Math.round((grade?.assignmentsCompleted || 0) * 2));
    ratings['homework'] = Math.max(homeworkScore, languagePoints);

    // Attitude - based on attendance
    const attitudeLevel = getLevelFromPercent(attendanceRate);
    ratings['attitude'] = getLevelPoints(attitudeLevel, 10);

    // Progress - average of all
    const totalScores = Object.values(ratings);
    const avgScore = totalScores.length > 0 ? totalScores.reduce((a, b) => a + b, 0) / totalScores.length : 5;
    ratings['progress'] = Math.round(avgScore);

    return ratings;
  };

  // Auto-calculate overall rating
  const calculateOverallRating = (ratings: Record<string, number>): EvaluationRating => {
    const values = Object.values(ratings);
    if (values.length === 0) return 3;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    if (avg >= 9) return 5;
    if (avg >= 7) return 4;
    if (avg >= 5) return 3;
    if (avg >= 3) return 2;
    return 1;
  };

  // Generate auto comment based on data
  const generateAutoComment = (userId: string): { comment: string; strengths: string; improvements: string } => {
    const grade = getStudentGrade(userId);
    const attendance = getStudentAttendance(userId);
    const overallLevel = getLevelFromPercent((grade?.averagePercent || 0 + (attendance?.attendanceRate || 0)) / 2);

    const comments = EVALUATION_COMMENT_SUGGESTIONS.overall[overallLevel];
    const comment = comments[Math.floor(Math.random() * comments.length)];

    // Determine strengths
    const strengths: string[] = [];
    if ((grade?.averagePercent || 0) >= 70) strengths.push('Ket qua hoc tap tot');
    if ((attendance?.attendanceRate || 0) >= 90) strengths.push('Chuyen can cao');
    if ((grade?.testsCompleted || 0) >= 3) strengths.push('Tich cuc lam bai kiem tra');

    // Determine improvements
    const improvements: string[] = [];
    if ((grade?.averagePercent || 0) < 50) improvements.push('Can cai thien diem so');
    if ((attendance?.attendanceRate || 0) < 80) improvements.push('Can di hoc day du hon');
    if ((grade?.assignmentsCompleted || 0) < 2) improvements.push('Can lam bai tap ve nha');

    return {
      comment,
      strengths: strengths.join(', '),
      improvements: improvements.join(', '),
    };
  };

  // Handle auto-fill form based on student data
  const handleAutoFill = (userId: string) => {
    if (!userId) return;

    const ratings = autoCalculateRatings(userId);
    const overallRating = calculateOverallRating(ratings);
    const { comment, strengths, improvements } = generateAutoComment(userId);

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

  // Reset form
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
    setShowSuggestions(null);
  };

  // Open edit form
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

  // Apply level to a criteria
  const applyCriteriaLevel = (criteriaId: string, level: EvaluationLevel) => {
    const criteria = DEFAULT_EVALUATION_CRITERIA.find(c => c.id === criteriaId);
    if (criteria) {
      const points = getLevelPoints(level, criteria.maxPoints);
      setFormData(prev => ({
        ...prev,
        ratings: { ...prev.ratings, [criteriaId]: points },
      }));
    }
  };

  // Apply level to all criteria
  const applyAllLevel = (level: EvaluationLevel) => {
    const newRatings: Record<string, number> = {};
    DEFAULT_EVALUATION_CRITERIA.forEach(criteria => {
      newRatings[criteria.id] = getLevelPoints(level, criteria.maxPoints);
    });

    const overallMap: Record<EvaluationLevel, EvaluationRating> = {
      excellent: 5,
      good: 4,
      average: 3,
      weak: 2,
    };

    setFormData(prev => ({
      ...prev,
      ratings: newRatings,
      overallRating: overallMap[level],
    }));
  };

  // Toggle suggestion in textarea
  const toggleSuggestion = (field: 'strengths' | 'improvements', suggestion: string) => {
    const current = formData[field] || '';
    const suggestions = current.split('\n').filter(s => s.trim());

    if (suggestions.includes(suggestion)) {
      const newValue = suggestions.filter(s => s !== suggestion).join('\n');
      setFormData(prev => ({ ...prev, [field]: newValue }));
    } else {
      const newValue = suggestions.length > 0 ? `${current}\n${suggestion}` : suggestion;
      setFormData(prev => ({ ...prev, [field]: newValue }));
    }
  };

  // Handle form submit
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

  // Handle delete
  const handleDelete = async (id: string) => {
    setSaving(true);
    const success = await onDelete(id);
    if (success) {
      setDeleteConfirm(null);
    }
    setSaving(false);
  };

  // Export single student PDF
  const handleExportStudent = (userId: string) => {
    const student = students.find(s => s.userId === userId);
    if (!student?.user || !classroom) return;

    setExporting(true);
    try {
      exportStudentReportPDF({
        user: student.user,
        classroom,
        studentGrade: getStudentGrade(userId),
        attendanceSummary: getStudentAttendance(userId),
        attendanceRecords: attendanceRecords.filter(r => r.userId === userId) as any,
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

  // Export all students PDF
  const handleExportAll = () => {
    if (!classroom) return;

    setExporting(true);
    try {
      exportClassroomReportPDF(
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

  // Send evaluation notification to single student
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

  // Send notifications to all students with latest evaluations
  const handleSendAllNotifications = async () => {
    setSending(true);
    setSendSuccess(null);
    try {
      // Get latest evaluation for each student
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

  // Group evaluations by user
  const evaluationsByUser = useMemo(() => {
    const map = new Map<string, StudentEvaluation[]>();
    evaluations.forEach(e => {
      const existing = map.get(e.userId) || [];
      existing.push(e);
      map.set(e.userId, existing);
    });
    return map;
  }, [evaluations]);

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
        <div className="evaluation-form-overlay">
          <form className="evaluation-form" onSubmit={handleSubmit}>
            <div className="form-header-row">
              <h4>{editingId ? 'Chinh sua danh gia' : 'Tao danh gia moi'}</h4>
              <button type="button" className="btn-close" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>

            {/* Student selector with stats */}
            <div className="form-group">
              <label>Hoc vien <span className="required">*</span></label>
              <div className="student-select-row">
                <select
                  value={formData.userId}
                  onChange={e => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                  className="form-select"
                  required
                  disabled={!!editingId}
                >
                  <option value="">Chon hoc vien...</option>
                  {students.map(({ userId, user }) => (
                    <option key={userId} value={userId}>
                      {user?.displayName || user?.username || 'Unknown'}
                    </option>
                  ))}
                </select>
                {formData.userId && !editingId && (
                  <button
                    type="button"
                    className="btn btn-auto-fill"
                    onClick={() => handleAutoFill(formData.userId)}
                    title="Tu dong dien dua tren diem so va chuyen can"
                  >
                    <Zap size={16} />
                    Tu dong
                  </button>
                )}
              </div>

              {/* Show student stats when selected */}
              {formData.userId && (
                <StudentStats
                  grade={getStudentGrade(formData.userId)}
                  attendance={getStudentAttendance(formData.userId)}
                />
              )}
            </div>

            {/* Period */}
            <div className="form-row">
              <div className="form-group">
                <label>Tu ngay</label>
                <input
                  type="date"
                  value={formData.periodStart}
                  onChange={e => setFormData(prev => ({ ...prev, periodStart: e.target.value }))}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Den ngay</label>
                <input
                  type="date"
                  value={formData.periodEnd}
                  onChange={e => setFormData(prev => ({ ...prev, periodEnd: e.target.value }))}
                  className="form-input"
                />
              </div>
            </div>

            {/* Quick apply all levels */}
            <div className="form-group">
              <label>Danh gia nhanh tat ca tieu chi</label>
              <div className="quick-level-buttons">
                {(Object.entries(EVALUATION_LEVEL_INFO) as [EvaluationLevel, typeof EVALUATION_LEVEL_INFO[EvaluationLevel]][]).map(([level, info]) => (
                  <button
                    key={level}
                    type="button"
                    className="quick-level-btn"
                    style={{ '--level-color': info.color } as React.CSSProperties}
                    onClick={() => applyAllLevel(level)}
                  >
                    {info.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Criteria ratings */}
            <div className="form-group">
              <label>Danh gia chi tiet</label>
              <div className="criteria-list">
                {DEFAULT_EVALUATION_CRITERIA.map(criteria => {
                  const currentPoints = formData.ratings[criteria.id] || 0;
                  const currentLevel = getPointsLevel(currentPoints, criteria.maxPoints);
                  const suggestion = criteria.suggestions[currentLevel];

                  return (
                    <div key={criteria.id} className="criteria-row-enhanced">
                      <div className="criteria-header">
                        <div className="criteria-info">
                          <span className="criteria-icon">{criteria.icon}</span>
                          <span className="criteria-name">{criteria.name}</span>
                        </div>
                        <LevelSelector
                          onSelect={(level) => applyCriteriaLevel(criteria.id, level)}
                          currentPoints={currentPoints}
                          maxPoints={criteria.maxPoints}
                        />
                      </div>

                      <div className="criteria-rating-row">
                        <input
                          type="range"
                          min={0}
                          max={criteria.maxPoints}
                          value={currentPoints}
                          onChange={e => setFormData(prev => ({
                            ...prev,
                            ratings: { ...prev.ratings, [criteria.id]: parseInt(e.target.value) },
                          }))}
                          className="range-input"
                          style={{ '--level-color': EVALUATION_LEVEL_INFO[currentLevel].color } as React.CSSProperties}
                        />
                        <span
                          className="rating-value"
                          style={{ color: EVALUATION_LEVEL_INFO[currentLevel].color }}
                        >
                          {currentPoints}/{criteria.maxPoints}
                        </span>
                      </div>

                      {currentPoints > 0 && (
                        <div className="criteria-suggestion" style={{ borderColor: EVALUATION_LEVEL_INFO[currentLevel].color }}>
                          <Lightbulb size={14} />
                          <span>{suggestion}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Overall rating */}
            <div className="form-group">
              <label>Danh gia tong the <span className="required">*</span></label>
              <RatingStars
                rating={formData.overallRating}
                onChange={rating => setFormData(prev => ({ ...prev, overallRating: rating }))}
              />
            </div>

            {/* Strengths with suggestions */}
            <div className="form-group">
              <label>
                Diem manh
                <button
                  type="button"
                  className="btn-toggle-suggestions"
                  onClick={() => setShowSuggestions(showSuggestions === 'strengths' ? null : 'strengths')}
                >
                  <Lightbulb size={14} />
                  Goi y
                </button>
              </label>
              {showSuggestions === 'strengths' && (
                <div className="suggestions-panel">
                  {EVALUATION_COMMENT_SUGGESTIONS.strengths.map(suggestion => (
                    <SuggestionChip
                      key={suggestion}
                      text={suggestion}
                      onClick={() => toggleSuggestion('strengths', suggestion)}
                      selected={formData.strengths?.includes(suggestion)}
                    />
                  ))}
                </div>
              )}
              <textarea
                value={formData.strengths || ''}
                onChange={e => setFormData(prev => ({ ...prev, strengths: e.target.value }))}
                className="form-textarea"
                rows={2}
                placeholder="Diem manh cua hoc vien..."
              />
            </div>

            {/* Improvements with suggestions */}
            <div className="form-group">
              <label>
                Can cai thien
                <button
                  type="button"
                  className="btn-toggle-suggestions"
                  onClick={() => setShowSuggestions(showSuggestions === 'improvements' ? null : 'improvements')}
                >
                  <Lightbulb size={14} />
                  Goi y
                </button>
              </label>
              {showSuggestions === 'improvements' && (
                <div className="suggestions-panel">
                  {EVALUATION_COMMENT_SUGGESTIONS.improvements.map(suggestion => (
                    <SuggestionChip
                      key={suggestion}
                      text={suggestion}
                      onClick={() => toggleSuggestion('improvements', suggestion)}
                      selected={formData.improvements?.includes(suggestion)}
                    />
                  ))}
                </div>
              )}
              <textarea
                value={formData.improvements || ''}
                onChange={e => setFormData(prev => ({ ...prev, improvements: e.target.value }))}
                className="form-textarea"
                rows={2}
                placeholder="Nhung diem can cai thien..."
              />
            </div>

            {/* Comment */}
            <div className="form-group">
              <label>
                Nhan xet <span className="required">*</span>
                <button
                  type="button"
                  className="btn-toggle-suggestions"
                  onClick={() => setShowSuggestions(showSuggestions === 'comment' ? null : 'comment')}
                >
                  <Lightbulb size={14} />
                  Goi y
                </button>
              </label>
              {showSuggestions === 'comment' && (
                <div className="suggestions-panel comment-suggestions">
                  {(Object.entries(EVALUATION_COMMENT_SUGGESTIONS.overall) as [EvaluationLevel, string[]][]).map(([level, suggestions]) => (
                    <div key={level} className="comment-level-group">
                      <span
                        className="level-label"
                        style={{ color: EVALUATION_LEVEL_INFO[level].color }}
                      >
                        {EVALUATION_LEVEL_INFO[level].label}:
                      </span>
                      {suggestions.map(suggestion => (
                        <SuggestionChip
                          key={suggestion}
                          text={suggestion}
                          onClick={() => setFormData(prev => ({ ...prev, comment: suggestion }))}
                          selected={formData.comment === suggestion}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
              <textarea
                value={formData.comment}
                onChange={e => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                className="form-textarea"
                rows={3}
                placeholder="Nhan xet chung ve hoc vien..."
                required
              />
            </div>

            {/* Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Huy
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || !formData.userId || !formData.comment}
              >
                {saving ? 'Dang luu...' : editingId ? 'Cap nhat' : 'Tao danh gia'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Student evaluation list */}
      <div className="evaluation-list">
        {students.length === 0 ? (
          <p className="empty-text">Chua co hoc vien trong lop</p>
        ) : (
          students.map(({ userId, user }) => {
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
                        onClick={() => handleExportStudent(userId)}
                        disabled={exporting || !classroom}
                      >
                        <Download size={14} />
                        Xuat PDF
                      </button>
                      {userEvals.length > 0 && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleSendNotification(userEvals[0])}
                          disabled={sending}
                        >
                          <Send size={14} />
                          Gui thong bao
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, userId }));
                          setShowForm(true);
                        }}
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
                        <div key={evaluation.id} className="evaluation-item">
                          <div className="evaluation-meta">
                            <span className="evaluation-period">
                              {new Date(evaluation.periodStart).toLocaleDateString('vi-VN')} -{' '}
                              {new Date(evaluation.periodEnd).toLocaleDateString('vi-VN')}
                            </span>
                            <RatingStars rating={evaluation.overallRating} readonly />
                          </div>

                          <p className="evaluation-comment">{evaluation.comment}</p>

                          {evaluation.strengths && (
                            <div className="evaluation-section strengths">
                              <strong>Diem manh:</strong> {evaluation.strengths}
                            </div>
                          )}

                          {evaluation.improvements && (
                            <div className="evaluation-section improvements">
                              <strong>Can cai thien:</strong> {evaluation.improvements}
                            </div>
                          )}

                          {/* Criteria scores */}
                          <div className="evaluation-criteria">
                            {DEFAULT_EVALUATION_CRITERIA.map(criteria => {
                              const points = evaluation.ratings[criteria.id] || 0;
                              const level = getPointsLevel(points, criteria.maxPoints);
                              return (
                                <div key={criteria.id} className="criteria-score">
                                  <span className="criteria-icon-small">{criteria.icon}</span>
                                  <span className="criteria-name">{criteria.name}</span>
                                  <div className="score-bar">
                                    <div
                                      className="score-fill"
                                      style={{
                                        width: `${(points / criteria.maxPoints) * 100}%`,
                                        backgroundColor: EVALUATION_LEVEL_INFO[level].color,
                                      }}
                                    />
                                  </div>
                                  <span
                                    className="score-value"
                                    style={{ color: EVALUATION_LEVEL_INFO[level].color }}
                                  >
                                    {points}/{criteria.maxPoints}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          <div className="evaluation-actions">
                            <button
                              className="btn btn-sm btn-icon success"
                              onClick={() => handleSendNotification(evaluation)}
                              disabled={sending}
                              title="Gui thong bao"
                            >
                              <Send size={14} />
                            </button>
                            {sendSuccess === evaluation.id && (
                              <span className="send-success-mini">Da gui!</span>
                            )}
                            <button
                              className="btn btn-sm btn-icon"
                              onClick={() => openEdit(evaluation)}
                              title="Chinh sua"
                            >
                              <Edit2 size={14} />
                            </button>
                            {deleteConfirm === evaluation.id ? (
                              <>
                                <span className="delete-confirm-text">Xac nhan xoa?</span>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDelete(evaluation.id)}
                                  disabled={saving}
                                >
                                  Xoa
                                </button>
                                <button
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => setDeleteConfirm(null)}
                                >
                                  Huy
                                </button>
                              </>
                            ) : (
                              <button
                                className="btn btn-sm btn-icon danger"
                                onClick={() => setDeleteConfirm(evaluation.id)}
                                title="Xoa"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>

                          <div className="evaluation-footer">
                            <span className="evaluated-at">
                              Danh gia luc {new Date(evaluation.evaluatedAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
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
