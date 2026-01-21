// List of flashcards with filter and CRUD actions

import { useState } from 'react';
import type { Flashcard } from '../../types/flashcard';
import { ConfirmModal } from '../ui/confirm-modal';
import { Edit3, Trash2 } from 'lucide-react';

interface FlashcardListProps {
  cards: Flashcard[];
  onEdit: (card: Flashcard) => void;
  onDelete: (id: string) => void;
  canEdit?: (card: Flashcard) => boolean;
  canDelete?: (card: Flashcard) => boolean;
}

export function FlashcardList({ cards, onEdit, onDelete, canEdit, canDelete }: FlashcardListProps) {
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Flashcard | null>(null);

  const handleFlip = (id: string) => {
    setFlippedId(prev => (prev === id ? null : id));
  };

  const handleDeleteClick = (card: Flashcard) => {
    setDeleteTarget(card);
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flashcard-list">
      <p className="card-count">
        Hiển thị {cards.length} thẻ
      </p>

      {cards.length === 0 ? (
        <p className="empty-message">Chưa có thẻ nào. Hãy tạo thẻ mới!</p>
      ) : (
        <div className="cards-grid">
          {cards.map(card => (
            <div key={card.id} className="card-item">
              <div
                className={`mini-card ${flippedId === card.id ? 'flipped' : ''}`}
                onClick={() => handleFlip(card.id)}
              >
                <div className="mini-card-front">
                  <span className="jlpt-badge-small">{card.jlptLevel}</span>
                  {card.kanji && <div className="mini-kanji">{card.kanji}</div>}
                  <div className="mini-vocab">{card.vocabulary}</div>
                </div>
                <div className="mini-card-back">
                  <div className="mini-meaning">{card.meaning}</div>
                </div>
              </div>
              <div className="card-item-actions">
                {(!canEdit || canEdit(card)) && (
                  <button className="btn-icon" onClick={() => onEdit(card)} title="Sửa">
                    <Edit3 size={16} />
                  </button>
                )}
                {(!canDelete || canDelete(card)) && (
                  <button className="btn-icon" onClick={() => handleDeleteClick(card)} title="Xóa">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Xác nhận xóa"
        message={`Bạn có chắc muốn xóa thẻ "${deleteTarget?.vocabulary || ''}"?`}
        confirmText="Xóa"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
