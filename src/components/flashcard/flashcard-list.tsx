// List of flashcards with filter and CRUD actions

import { useState } from 'react';
import type { Flashcard, JLPTLevel } from '../../types/flashcard';
import { ConfirmModal } from '../ui/confirm-modal';

interface FlashcardListProps {
  cards: Flashcard[];
  onEdit: (card: Flashcard) => void;
  onDelete: (id: string) => void;
  canEdit?: (card: Flashcard) => boolean;
  canDelete?: (card: Flashcard) => boolean;
}

const JLPT_LEVELS: (JLPTLevel | 'all')[] = ['all', 'N5', 'N4', 'N3', 'N2', 'N1'];

export function FlashcardList({ cards, onEdit, onDelete, canEdit, canDelete }: FlashcardListProps) {
  const [filter, setFilter] = useState<JLPTLevel | 'all'>('all');
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Flashcard | null>(null);

  const filteredCards = filter === 'all'
    ? cards
    : cards.filter(card => card.jlptLevel === filter);

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
      <div className="filter-bar">
        <span>Lọc theo JLPT:</span>
        {JLPT_LEVELS.map(level => (
          <button
            key={level}
            className={`filter-btn ${filter === level ? 'active' : ''}`}
            onClick={() => setFilter(level)}
          >
            {level === 'all' ? 'Tất cả' : level}
          </button>
        ))}
      </div>

      <p className="card-count">
        Hiển thị {filteredCards.length} / {cards.length} thẻ
      </p>

      {filteredCards.length === 0 ? (
        <p className="empty-message">Chưa có thẻ nào. Hãy tạo thẻ mới!</p>
      ) : (
        <div className="cards-grid">
          {filteredCards.map(card => (
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
                    ✏️
                  </button>
                )}
                {(!canDelete || canDelete(card)) && (
                  <button className="btn-icon" onClick={() => handleDeleteClick(card)} title="Xóa">
                    🗑️
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
