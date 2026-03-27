// Main notebook panel - list / view / study modes

import { useState } from 'react';
import {
  X, ChevronLeft, Plus, Play, Trash2,
  Edit3, Check, BookMarked, BookOpen,
} from 'lucide-react';
import type { VocabularyNotebook, Flashcard } from '../../../types/flashcard';
import { ModalShell } from '../../ui/modal-shell';
import './notebook.css';

const PALETTE = [
  '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6',
  '#10b981', '#ec4899', '#06b6d4', '#f97316',
];

type PanelView = 'list' | 'view';

interface NotebookPanelProps {
  notebooks: VocabularyNotebook[];
  allCards: Flashcard[];
  onClose: () => void;
  onCreateNotebook: (name: string, color: string, description?: string) => Promise<void>;
  onUpdateNotebook: (id: string, data: Partial<Pick<VocabularyNotebook, 'name' | 'description' | 'color'>>) => Promise<void>;
  onDeleteNotebook: (id: string) => Promise<void>;
  onRemoveCard: (notebookId: string, flashcardId: string) => Promise<void>;
  getNotebookCards: (notebookId: string, allCards: Flashcard[]) => Flashcard[];
  onStudy: (cards: Flashcard[]) => void;
}

export function NotebookPanel({
  notebooks,
  allCards,
  onClose,
  onCreateNotebook,
  onUpdateNotebook,
  onDeleteNotebook,
  onRemoveCard,
  getNotebookCards,
  onStudy,
}: NotebookPanelProps) {
  const [view, setView] = useState<PanelView>('list');
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PALETTE[0]);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const activeNotebook = notebooks.find((nb) => nb.id === activeNotebookId);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await onCreateNotebook(newName.trim(), newColor);
    setNewName('');
  };

  const handleOpenNotebook = (id: string) => {
    setActiveNotebookId(id);
    setView('view');
  };

  const handleBack = () => {
    setView('list');
    setActiveNotebookId(null);
    setEditId(null);
  };

  const handleStartEdit = (nb: VocabularyNotebook) => {
    setEditId(nb.id);
    setEditName(nb.name);
  };

  const handleSaveEdit = async () => {
    if (!editId || !editName.trim()) return;
    await onUpdateNotebook(editId, { name: editName.trim() });
    setEditId(null);
  };

  const handleStudy = () => {
    if (!activeNotebook) return;
    const cards = getNotebookCards(activeNotebook.id, allCards);
    if (cards.length > 0) {
      onStudy(cards);
      onClose();
    }
  };

  const viewCards = activeNotebook
    ? getNotebookCards(activeNotebook.id, allCards)
    : [];

  return (
    <ModalShell isOpen={true} onClose={onClose} hideClose={true} maxWidth={480}>
      {/* Header */}
      <div className="nb-header">
        <div className="nb-header-left">
          {view === 'view' && (
            <button className="nb-back-btn" onClick={handleBack}>
              <ChevronLeft size={16} />
            </button>
          )}
          {view === 'list' ? (
            <>
              <BookMarked size={18} className="nb-title-icon" />
              <h3>Sổ Tay Từ Vựng</h3>
            </>
          ) : (
            <>
              <span
                className="nb-card-color"
                style={{ background: activeNotebook?.color }}
              />
              <h3>{activeNotebook?.name}</h3>
              <span className="nb-header-subtitle">{viewCards.length} từ</span>
            </>
          )}
        </div>
        <button className="nb-close-btn" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="nb-body">
        {view === 'list' ? (
          <>
            {/* Create Form */}
            <div className="nb-create-form">
              <div className="nb-create-row">
                <input
                  className="nb-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Tên sổ tay mới..."
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                <button
                  className="nb-create-btn"
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                >
                  <Plus size={14} />
                  <span>Tạo</span>
                </button>
              </div>
              <div className="nb-color-picker">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    className={`nb-color-swatch ${newColor === c ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setNewColor(c)}
                  />
                ))}
              </div>
            </div>

            {/* Notebook List */}
            {notebooks.length === 0 ? (
              <div className="nb-empty">
                <BookOpen size={40} strokeWidth={1} />
                <p>Chưa có sổ tay nào</p>
                <p className="nb-empty-hint">Tạo sổ tay để lưu từ vựng yêu thích</p>
              </div>
            ) : (
              <div className="nb-list">
                {notebooks.map((nb) => (
                  <div key={nb.id} className="nb-card" onClick={() => handleOpenNotebook(nb.id)}>
                    <span className="nb-card-color" style={{ background: nb.color }} />
                    <div className="nb-card-info">
                      {editId === nb.id ? (
                        <div className="nb-edit-row" onClick={(e) => e.stopPropagation()}>
                          <input
                            className="nb-edit-input"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                            autoFocus
                          />
                          <button className="nb-edit-save" onClick={handleSaveEdit}>
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="nb-card-name">{nb.name}</div>
                          <div className="nb-card-meta">
                            {nb.flashcardIds.length} từ
                          </div>
                        </>
                      )}
                    </div>
                    <div className="nb-card-actions" onClick={(e) => e.stopPropagation()}>
                      {nb.flashcardIds.length > 0 && (
                        <button
                          className="nb-card-action study-btn"
                          onClick={() => {
                            const cards = getNotebookCards(nb.id, allCards);
                            if (cards.length > 0) {
                              onStudy(cards);
                              onClose();
                            }
                          }}
                        >
                          <Play size={12} />
                          <span>Học</span>
                        </button>
                      )}
                      <button
                        className="nb-card-action"
                        onClick={() => handleStartEdit(nb)}
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        className="nb-card-action delete-btn"
                        onClick={() => onDeleteNotebook(nb.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* View mode - single notebook */
          <>
            {viewCards.length === 0 ? (
              <div className="nb-empty">
                <BookOpen size={40} strokeWidth={1} />
                <p>Sổ tay trống</p>
                <p className="nb-empty-hint">Thêm từ vựng từ phiên học</p>
              </div>
            ) : (
              <div className="nb-view-cards">
                {viewCards.map((card) => (
                  <div key={card.id} className="nb-mini-card">
                    <button
                      className="nb-mini-remove"
                      onClick={() => activeNotebook && onRemoveCard(activeNotebook.id, card.id)}
                    >
                      <X size={10} />
                    </button>
                    {card.kanji && <div className="nb-mini-kanji">{card.kanji}</div>}
                    <div className="nb-mini-vocab">{card.vocabulary}</div>
                    <div className="nb-mini-meaning">{card.meaning}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* View footer with study button */}
      {view === 'view' && viewCards.length > 0 && (
        <div className="nb-view-footer">
          <button className="nb-study-btn" onClick={handleStudy}>
            <Play size={18} />
            <span>Học {viewCards.length} từ</span>
          </button>
        </div>
      )}
    </ModalShell>
  );
}
