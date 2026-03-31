// List of flashcards with filter and CRUD actions

import { useState } from 'react';
import type { Flashcard, DifficultyLevel } from '../../types/flashcard';
import { ConfirmModal } from '../ui/confirm-modal';
import { LevelBadge } from '../ui/level-badge';
import { Edit3, Trash2, LayoutGrid, List } from 'lucide-react';

type ViewMode = 'grid' | 'by-difficulty';

// Difficulty level config with Vietnamese labels and colors
const DIFFICULTY_CONFIG: Record<DifficultyLevel, { label: string; color: string; bgColor: string }> = {
  super_hard: { label: '🔥 Siêu Khó', color: '#DC2626', bgColor: 'rgba(220, 38, 38, 0.08)' },
  hard: { label: '😰 Khó', color: '#EA580C', bgColor: 'rgba(234, 88, 12, 0.08)' },
  medium: { label: '🤔 Trung Bình', color: '#CA8A04', bgColor: 'rgba(202, 138, 4, 0.08)' },
  easy: { label: '😊 Dễ', color: '#16A34A', bgColor: 'rgba(22, 163, 74, 0.08)' },
  unset: { label: '❓ Chưa đánh giá', color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.08)' },
};

// Order for difficulty display
const DIFFICULTY_ORDER: DifficultyLevel[] = ['super_hard', 'hard', 'medium', 'easy', 'unset'];

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
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

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

  // Group cards by difficulty level
  const cardsByDifficulty = DIFFICULTY_ORDER.reduce((acc, level) => {
    acc[level] = cards.filter(card => card.difficultyLevel === level);
    return acc;
  }, {} as Record<DifficultyLevel, Flashcard[]>);

  // Render a single card item
  const renderCardItem = (card: Flashcard, showDifficultyBorder = false) => {
    const diffConfig = DIFFICULTY_CONFIG[card.difficultyLevel || 'unset'];
    const borderStyle = showDifficultyBorder ? { borderColor: diffConfig.color, borderWidth: '2px' } : {};

    return (
      <div key={card.id} className="card-item">
        <div
          className={`mini-card ${flippedId === card.id ? 'flipped' : ''} difficulty-${card.difficultyLevel || 'unset'}`}
          onClick={() => handleFlip(card.id)}
          style={borderStyle}
        >
          <div className="mini-card-front">
            <LevelBadge level={card.jlptLevel} size="xs" />
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
    );
  };

  return (
    <div className="flashcard-list">
      <div className="flashcard-list-header">
        <p className="card-count">
          Hiển thị {cards.length} thẻ
        </p>
        <div className="view-mode-toggle">
          <button
            className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Hiển thị dạng lưới"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'by-difficulty' ? 'active' : ''}`}
            onClick={() => setViewMode('by-difficulty')}
            title="Hiển thị theo độ khó"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {cards.length === 0 ? (
        <p className="empty-message">Chưa có thẻ nào. Hãy tạo thẻ mới!</p>
      ) : viewMode === 'grid' ? (
        <div className="cards-grid">
          {cards.map(card => renderCardItem(card, true))}
        </div>
      ) : (
        <div className="cards-by-difficulty">
          {DIFFICULTY_ORDER.map(level => {
            const levelCards = cardsByDifficulty[level];
            if (levelCards.length === 0) return null;

            const config = DIFFICULTY_CONFIG[level];
            return (
              <div key={level} className="difficulty-section" style={{ backgroundColor: config.bgColor }}>
                <div className="difficulty-section-header" style={{ borderLeftColor: config.color }}>
                  <span className="difficulty-label" style={{ color: config.color }}>
                    {config.label}
                  </span>
                  <span className="difficulty-count">{levelCards.length} thẻ</span>
                </div>
                <div className="cards-grid">
                  {levelCards.map(card => renderCardItem(card, true))}
                </div>
              </div>
            );
          })}
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
