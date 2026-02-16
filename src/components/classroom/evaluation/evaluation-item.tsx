// Individual evaluation display component

import { Edit2, Trash2, Send } from 'lucide-react';
import type { StudentEvaluation } from '../../../types/classroom';
import { RatingStars } from './rating-components';
import { DEFAULT_EVALUATION_CRITERIA, EVALUATION_LEVEL_INFO, getPointsLevel } from './evaluation-types';

interface EvaluationItemProps {
  evaluation: StudentEvaluation;
  onEdit: (evaluation: StudentEvaluation) => void;
  onDelete: (id: string) => void;
  onSendNotification: (evaluation: StudentEvaluation) => void;
  deleteConfirm: string | null;
  setDeleteConfirm: (id: string | null) => void;
  sending: boolean;
  sendSuccess: string | null;
  saving: boolean;
}

export function EvaluationItem({
  evaluation,
  onEdit,
  onDelete,
  onSendNotification,
  deleteConfirm,
  setDeleteConfirm,
  sending,
  sendSuccess,
  saving,
}: EvaluationItemProps) {
  return (
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
          onClick={() => onSendNotification(evaluation)}
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
          onClick={() => onEdit(evaluation)}
          title="Chinh sua"
        >
          <Edit2 size={14} />
        </button>
        {deleteConfirm === evaluation.id ? (
          <>
            <span className="delete-confirm-text">Xac nhan xoa?</span>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => onDelete(evaluation.id)}
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
  );
}
