// Professional reset card confirmation modal
import { RotateCcw, X, AlertTriangle } from 'lucide-react';
import type { Flashcard } from '../../types/flashcard';

interface ResetCardModalProps {
  isOpen: boolean;
  card: Flashcard | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ResetCardModal({ isOpen, card, onConfirm, onCancel }: ResetCardModalProps) {
  if (!isOpen || !card) return null;

  const hasChanges = card.memorizationStatus !== 'unset' ||
                     card.difficultyLevel !== (card.originalDifficultyLevel || 'unset');

  return (
    <div className="reset-modal-overlay" onClick={onCancel}>
      <div className="reset-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="reset-modal-header">
          <div className="reset-modal-icon">
            <RotateCcw size={28} />
          </div>
          <button className="reset-modal-close" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="reset-modal-content">
          <h3 className="reset-modal-title">Reset thẻ về mặc định?</h3>

          <div className="reset-card-preview">
            <div className="reset-card-kanji">{card.kanji || card.vocabulary}</div>
            <div className="reset-card-vocab">{card.vocabulary}</div>
            <div className="reset-card-meaning">{card.meaning}</div>
          </div>

          {hasChanges ? (
            <div className="reset-modal-warning">
              <AlertTriangle size={18} />
              <span>Thao tác này sẽ:</span>
            </div>
          ) : (
            <p className="reset-modal-info">Thẻ này chưa có thay đổi nào.</p>
          )}

          {hasChanges && (
            <ul className="reset-modal-changes">
              {card.memorizationStatus !== 'unset' && (
                <li>
                  <span className="change-label">Trạng thái:</span>
                  <span className="change-from">{card.memorizationStatus === 'memorized' ? 'Đã thuộc' : 'Chưa thuộc'}</span>
                  <span className="change-arrow">→</span>
                  <span className="change-to">Chưa đánh giá</span>
                </li>
              )}
              {card.difficultyLevel !== (card.originalDifficultyLevel || 'unset') && (
                <li>
                  <span className="change-label">Độ khó:</span>
                  <span className="change-from">{getDifficultyLabel(card.difficultyLevel)}</span>
                  <span className="change-arrow">→</span>
                  <span className="change-to">{getDifficultyLabel(card.originalDifficultyLevel || 'unset')}</span>
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Actions */}
        <div className="reset-modal-actions">
          <button className="reset-btn-cancel" onClick={onCancel}>
            Hủy bỏ
          </button>
          <button
            className="reset-btn-confirm"
            onClick={onConfirm}
            disabled={!hasChanges}
          >
            <RotateCcw size={16} />
            Reset thẻ
          </button>
        </div>
      </div>
    </div>
  );
}

function getDifficultyLabel(level: string): string {
  const labels: Record<string, string> = {
    super_hard: 'Siêu khó',
    hard: 'Khó',
    medium: 'Trung bình',
    easy: 'Dễ',
    unset: 'Chưa đánh giá',
  };
  return labels[level] || level;
}
