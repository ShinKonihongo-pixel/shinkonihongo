// Student evaluation panel component

import { useState, useMemo } from 'react';
import type { User } from '../../types/user';
import type {
  StudentEvaluation,
  EvaluationFormData,
  EvaluationRating,
  EvaluationCriteria,
} from '../../types/classroom';
import {
  EVALUATION_RATING_LABELS,
  DEFAULT_EVALUATION_CRITERIA,
} from '../../types/classroom';
import { Star, Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface EvaluationPanelProps {
  evaluations: StudentEvaluation[];
  students: { userId: string; user?: User }[];
  loading: boolean;
  onCreate: (data: EvaluationFormData) => Promise<StudentEvaluation | null>;
  onUpdate: (id: string, data: Partial<StudentEvaluation>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  getAverageRating: (userId: string) => number;
  latestEvaluationByUser: Map<string, StudentEvaluation>;
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

export function EvaluationPanel({
  evaluations,
  students,
  loading,
  onCreate,
  onUpdate,
  onDelete,
  getAverageRating,
  latestEvaluationByUser,
}: EvaluationPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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
    return <div className="evaluation-loading">Đang tải...</div>;
  }

  return (
    <div className="evaluation-panel">
      {/* Header with add button */}
      <div className="evaluation-header">
        <h3>Đánh giá học viên</h3>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          <Plus size={16} />
          Tạo đánh giá
        </button>
      </div>

      {/* Evaluation form */}
      {showForm && (
        <div className="evaluation-form-overlay">
          <form className="evaluation-form" onSubmit={handleSubmit}>
            <h4>{editingId ? 'Chỉnh sửa đánh giá' : 'Tạo đánh giá mới'}</h4>

            {/* Student selector */}
            <div className="form-group">
              <label>Học viên <span className="required">*</span></label>
              <select
                value={formData.userId}
                onChange={e => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                className="form-select"
                required
                disabled={!!editingId}
              >
                <option value="">Chọn học viên...</option>
                {students.map(({ userId, user }) => (
                  <option key={userId} value={userId}>
                    {user?.displayName || user?.username || 'Unknown'}
                  </option>
                ))}
              </select>
            </div>

            {/* Period */}
            <div className="form-row">
              <div className="form-group">
                <label>Từ ngày</label>
                <input
                  type="date"
                  value={formData.periodStart}
                  onChange={e => setFormData(prev => ({ ...prev, periodStart: e.target.value }))}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Đến ngày</label>
                <input
                  type="date"
                  value={formData.periodEnd}
                  onChange={e => setFormData(prev => ({ ...prev, periodEnd: e.target.value }))}
                  className="form-input"
                />
              </div>
            </div>

            {/* Criteria ratings */}
            <div className="form-group">
              <label>Đánh giá theo tiêu chí</label>
              <div className="criteria-list">
                {DEFAULT_EVALUATION_CRITERIA.map(criteria => (
                  <div key={criteria.id} className="criteria-row">
                    <div className="criteria-info">
                      <span className="criteria-name">{criteria.name}</span>
                      <span className="criteria-desc">{criteria.description}</span>
                    </div>
                    <div className="criteria-rating">
                      <input
                        type="range"
                        min={0}
                        max={criteria.maxPoints}
                        value={formData.ratings[criteria.id] || 0}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          ratings: { ...prev.ratings, [criteria.id]: parseInt(e.target.value) },
                        }))}
                        className="range-input"
                      />
                      <span className="rating-value">{formData.ratings[criteria.id] || 0}/{criteria.maxPoints}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Overall rating */}
            <div className="form-group">
              <label>Đánh giá tổng thể <span className="required">*</span></label>
              <RatingStars
                rating={formData.overallRating}
                onChange={rating => setFormData(prev => ({ ...prev, overallRating: rating }))}
              />
            </div>

            {/* Comment */}
            <div className="form-group">
              <label>Nhận xét <span className="required">*</span></label>
              <textarea
                value={formData.comment}
                onChange={e => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                className="form-textarea"
                rows={3}
                placeholder="Nhận xét chung về học viên..."
                required
              />
            </div>

            {/* Strengths */}
            <div className="form-group">
              <label>Điểm mạnh</label>
              <textarea
                value={formData.strengths || ''}
                onChange={e => setFormData(prev => ({ ...prev, strengths: e.target.value }))}
                className="form-textarea"
                rows={2}
                placeholder="Điểm mạnh của học viên..."
              />
            </div>

            {/* Improvements */}
            <div className="form-group">
              <label>Cần cải thiện</label>
              <textarea
                value={formData.improvements || ''}
                onChange={e => setFormData(prev => ({ ...prev, improvements: e.target.value }))}
                className="form-textarea"
                rows={2}
                placeholder="Những điểm cần cải thiện..."
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
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || !formData.userId || !formData.comment}
              >
                {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Tạo đánh giá'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Student evaluation list */}
      <div className="evaluation-list">
        {students.length === 0 ? (
          <p className="empty-text">Chưa có học viên trong lớp</p>
        ) : (
          students.map(({ userId, user }) => {
            const userEvals = evaluationsByUser.get(userId) || [];
            const latestEval = latestEvaluationByUser.get(userId);
            const avgRating = getAverageRating(userId);
            const isExpanded = expandedUser === userId;

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
                      <span className="evaluation-count">{userEvals.length} đánh giá</span>
                    </div>
                  </div>

                  <div className="student-rating">
                    {avgRating > 0 ? (
                      <RatingStars rating={Math.round(avgRating) as EvaluationRating} readonly />
                    ) : (
                      <span className="no-rating">Chưa đánh giá</span>
                    )}
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="student-evaluations">
                    {userEvals.length === 0 ? (
                      <p className="empty-text">Chưa có đánh giá</p>
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
                            <div className="evaluation-section">
                              <strong>Điểm mạnh:</strong> {evaluation.strengths}
                            </div>
                          )}

                          {evaluation.improvements && (
                            <div className="evaluation-section">
                              <strong>Cần cải thiện:</strong> {evaluation.improvements}
                            </div>
                          )}

                          {/* Criteria scores */}
                          <div className="evaluation-criteria">
                            {DEFAULT_EVALUATION_CRITERIA.map(criteria => (
                              <div key={criteria.id} className="criteria-score">
                                <span className="criteria-name">{criteria.name}</span>
                                <div className="score-bar">
                                  <div
                                    className="score-fill"
                                    style={{ width: `${((evaluation.ratings[criteria.id] || 0) / criteria.maxPoints) * 100}%` }}
                                  />
                                </div>
                                <span className="score-value">{evaluation.ratings[criteria.id] || 0}/{criteria.maxPoints}</span>
                              </div>
                            ))}
                          </div>

                          <div className="evaluation-actions">
                            <button
                              className="btn btn-sm btn-icon"
                              onClick={() => openEdit(evaluation)}
                              title="Chỉnh sửa"
                            >
                              <Edit2 size={14} />
                            </button>
                            {deleteConfirm === evaluation.id ? (
                              <>
                                <span className="delete-confirm-text">Xác nhận xóa?</span>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDelete(evaluation.id)}
                                  disabled={saving}
                                >
                                  Xóa
                                </button>
                                <button
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => setDeleteConfirm(null)}
                                >
                                  Hủy
                                </button>
                              </>
                            ) : (
                              <button
                                className="btn btn-sm btn-icon danger"
                                onClick={() => setDeleteConfirm(evaluation.id)}
                                title="Xóa"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>

                          <div className="evaluation-footer">
                            <span className="evaluated-at">
                              Đánh giá lúc {new Date(evaluation.evaluatedAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      ))
                    )}

                    <button
                      className="btn btn-sm btn-link"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, userId }));
                        setShowForm(true);
                      }}
                    >
                      <Plus size={14} />
                      Thêm đánh giá
                    </button>
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
