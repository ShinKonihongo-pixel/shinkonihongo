// Import modal for selecting flashcards or JLPT questions

import { useState } from 'react';
import { X, Import } from 'lucide-react';
import { JLPT_LEVELS } from '../../../constants/jlpt';
import type { Flashcard } from '../../../types/flashcard';
import type { JLPTQuestion } from '../../../types/jlpt-question';
import type { DifficultyLevel } from '../../../types/classroom';
import { DIFFICULTY_OPTIONS } from './test-bank-types';

interface ImportModalProps {
  show: boolean;
  source: 'flashcard' | 'jlpt';
  flashcards: Flashcard[];
  jlptQuestions: JLPTQuestion[];
  onImport: (selectedIds: string[], level: string, difficulty: DifficultyLevel) => void;
  onClose: () => void;
}

export function ImportModal({
  show,
  source,
  flashcards,
  jlptQuestions,
  onImport,
  onClose,
}: ImportModalProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [level, setLevel] = useState<string>('N5');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');

  if (!show) return null;

  const filteredFlashcards = flashcards.filter(f => f.jlptLevel === level);
  const filteredJlptQuestions = jlptQuestions.filter(j => j.level === level);

  const handleImport = () => {
    onImport(selectedItems, level, difficulty);
    setSelectedItems([]);
  };

  const handleClose = () => {
    setSelectedItems([]);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="import-modal">
        <div className="modal-header">
          <h4>Nhập từ {source === 'flashcard' ? 'Flashcard' : 'JLPT'}</h4>
          <button className="btn-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Level and difficulty filter */}
          <div className="import-filter-row">
            <div className="import-filter">
              <label>Cấp độ:</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)}>
                {JLPT_LEVELS.map(lvl => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>
            <div className="import-filter">
              <label>Độ khó:</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="difficulty-select"
                style={{
                  backgroundColor: DIFFICULTY_OPTIONS.find(d => d.value === difficulty)?.color + '20',
                  borderColor: DIFFICULTY_OPTIONS.find(d => d.value === difficulty)?.color
                }}
              >
                {DIFFICULTY_OPTIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Item list */}
          <div className="import-list">
            {source === 'flashcard' ? (
              filteredFlashcards.length === 0 ? (
                <p className="empty-text">Không có flashcard nào ở cấp độ {level}</p>
              ) : (
                filteredFlashcards.slice(0, 50).map(card => (
                  <label key={card.id} className="import-item">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(card.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(prev => [...prev, card.id]);
                        } else {
                          setSelectedItems(prev => prev.filter(id => id !== card.id));
                        }
                      }}
                    />
                    <span className="item-text">
                      <strong>{card.vocabulary}</strong>
                      {card.kanji && <span className="kanji">({card.kanji})</span>}
                      <span className="meaning">{card.meaning}</span>
                    </span>
                  </label>
                ))
              )
            ) : (
              filteredJlptQuestions.length === 0 ? (
                <p className="empty-text">Không có câu hỏi JLPT nào ở cấp độ {level}</p>
              ) : (
                filteredJlptQuestions.slice(0, 50).map(q => (
                  <label key={q.id} className="import-item">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(q.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(prev => [...prev, q.id]);
                        } else {
                          setSelectedItems(prev => prev.filter(id => id !== q.id));
                        }
                      }}
                    />
                    <span className="item-text">
                      <span className="question-text">{q.question}</span>
                    </span>
                  </label>
                ))
              )
            )}
          </div>
        </div>

        <div className="modal-footer">
          <span className="selected-count">Đã chọn: {selectedItems.length}</span>
          <button className="btn btn-secondary" onClick={handleClose}>
            Hủy
          </button>
          <button
            className="btn btn-primary"
            onClick={handleImport}
            disabled={selectedItems.length === 0}
          >
            <Import size={16} />
            Nhập ({selectedItems.length})
          </button>
        </div>
      </div>
    </div>
  );
}
