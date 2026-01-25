// Grammar Card List - 2-column grid with gradient level badges
// Features: Expandable cards, level-colored borders, gradient JLPT badges

import { useState } from 'react';
import { Edit3, Trash2, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import type { GrammarCard } from '../../types/flashcard';
import { ConfirmModal } from '../ui/confirm-modal';

interface GrammarCardListProps {
  cards: GrammarCard[];
  onEdit: (card: GrammarCard) => void;
  onDelete: (id: string) => void;
  canEdit?: (card: GrammarCard) => boolean;
  canDelete?: (card: GrammarCard) => boolean;
}

export function GrammarCardList({ cards, onEdit, onDelete, canEdit, canDelete }: GrammarCardListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GrammarCard | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const getLevelClass = (level: string) => `level-${level.toLowerCase()}`;
  const getBadgeClass = (level: string) => `badge-${level.toLowerCase()}`;

  if (cards.length === 0) {
    return (
      <div className="grammar-empty-state">
        <BookOpen size={64} className="empty-icon" />
        <div className="empty-title">Chưa có thẻ ngữ pháp nào</div>
        <div className="empty-desc">Hãy tạo thẻ mới để bắt đầu!</div>
      </div>
    );
  }

  return (
    <div className="grammar-card-list">
      <p className="card-count">Hiển thị {cards.length} thẻ ngữ pháp</p>

      <div className="grammar-card-grid">
        {cards.map(card => {
          const isExpanded = expandedId === card.id;
          const levelClass = getLevelClass(card.jlptLevel);
          const badgeClass = getBadgeClass(card.jlptLevel);

          return (
            <div
              key={card.id}
              className={`grammar-card-item has-level-badge ${levelClass} ${isExpanded ? 'expanded' : ''}`}
            >
              <div className="grammar-card-header" onClick={() => toggleExpand(card.id)}>
                <div className="grammar-card-info">
                  <BookOpen size={18} className="grammar-icon" />
                  <span className="grammar-title">{card.title}</span>
                  {card.formula && <span className="grammar-formula">{card.formula}</span>}
                </div>
                <div className="grammar-card-actions">
                  <span className={`grammar-jlpt-badge ${badgeClass}`}>{card.jlptLevel}</span>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {isExpanded && (
                <div className="grammar-card-content">
                  <div className="grammar-meaning">
                    <strong>Nghĩa:</strong> {card.meaning}
                  </div>

                  {card.explanation && (
                    <div className="grammar-explanation">
                      <strong>Giải thích:</strong> {card.explanation}
                    </div>
                  )}

                  {card.examples.length > 0 && (
                    <div className="grammar-examples">
                      <strong>Ví dụ:</strong>
                      <ul>
                        {card.examples.map((ex, idx) => (
                          <li key={idx}>
                            <div className="example-ja">{ex.japanese}</div>
                            <div className="example-vi">→ {ex.vietnamese}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grammar-card-buttons">
                    {(!canEdit || canEdit(card)) && (
                      <button
                        className="btn-icon"
                        onClick={(e) => { e.stopPropagation(); onEdit(card); }}
                        title="Sửa"
                      >
                        <Edit3 size={16} /> Sửa
                      </button>
                    )}
                    {(!canDelete || canDelete(card)) && (
                      <button
                        className="btn-icon btn-danger"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(card); }}
                        title="Xóa"
                      >
                        <Trash2 size={16} /> Xóa
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Xác nhận xóa"
        message={`Bạn có chắc muốn xóa thẻ ngữ pháp "${deleteTarget?.title || ''}"?`}
        confirmText="Xóa"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
