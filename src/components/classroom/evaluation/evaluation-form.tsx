// Evaluation form component

import { useState } from 'react';
import { X, Lightbulb, Zap } from 'lucide-react';
import type { User } from '../../../types/user';
import type { EvaluationFormData, EvaluationLevel, EvaluationRating } from '../../../types/classroom';
import { RatingStars, LevelSelector, SuggestionChip, StudentStats } from './rating-components';
import {
  DEFAULT_EVALUATION_CRITERIA,
  EVALUATION_LEVEL_INFO,
  EVALUATION_COMMENT_SUGGESTIONS,
  getPointsLevel,
  getLevelPoints,
} from './evaluation-types';

interface EvaluationFormProps {
  formData: EvaluationFormData;
  setFormData: React.Dispatch<React.SetStateAction<EvaluationFormData>>;
  students: { userId: string; user?: User }[];
  editingId: string | null;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  onAutoFill: (userId: string) => void;
  getStudentGrade?: (userId: string) => any;
  getStudentAttendance?: (userId: string) => any;
}

export function EvaluationForm({
  formData,
  setFormData,
  students,
  editingId,
  saving,
  onSubmit,
  onClose,
  onAutoFill,
  getStudentGrade,
  getStudentAttendance,
}: EvaluationFormProps) {
  const [showSuggestions, setShowSuggestions] = useState<string | null>(null);

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

  return (
    <div className="evaluation-form-overlay">
      <form className="evaluation-form" onSubmit={onSubmit}>
        <div className="form-header-row">
          <h4>{editingId ? 'Chinh sua danh gia' : 'Tao danh gia moi'}</h4>
          <button type="button" className="btn-close" onClick={onClose}>
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
                onClick={() => onAutoFill(formData.userId)}
                title="Tu dong dien dua tren diem so va chuyen can"
              >
                <Zap size={16} />
                Tu dong
              </button>
            )}
          </div>

          {/* Show student stats when selected */}
          {formData.userId && getStudentGrade && getStudentAttendance && (
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
            onClick={onClose}
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
  );
}
