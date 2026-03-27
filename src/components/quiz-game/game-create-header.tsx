/**
 * GameCreateHeader — modal chrome header, room-title input, and source-selection pills.
 */

import { X, Gamepad2, BookOpen } from 'lucide-react';
import type { GameQuestionSource } from '../../types/quiz-game';
import type { JLPTLevel } from '../../types/flashcard';

interface GameCreateHeaderProps {
  title: string;
  source: GameQuestionSource;
  isFlashcardSource: boolean;
  error: string | null;
  onTitleChange: (v: string) => void;
  onSourceChange: (s: GameQuestionSource) => void;
  onCancel: () => void;
  onSelectAllInLevel: (level: JLPTLevel) => void;
  onSelectAllLevels: () => void;
  onClearLessons: () => void;
}

export function GameCreateHeader({
  title,
  source,
  isFlashcardSource,
  error,
  onTitleChange,
  onSourceChange,
  onCancel,
  onSelectAllInLevel,
  onSelectAllLevels,
  onClearLessons,
}: GameCreateHeaderProps) {
  return (
    <>
      <header className="rm-header">
        <div
          className="rm-header-gradient"
          style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)' }}
        />
        <div className="rm-header-icon">
          <Gamepad2 size={24} color="white" />
        </div>
        <div className="rm-header-content">
          <h1 className="rm-title">Tạo Phòng Chơi</h1>
          <span className="rm-subtitle">Đại Chiến Tiếng Nhật</span>
        </div>
        <button className="rm-close-btn" onClick={onCancel} type="button">
          <X size={20} />
        </button>
      </header>

      {error && (
        <div className="rm-error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Room Title */}
      <div className="rm-field">
        <label className="rm-label">
          <Gamepad2 size={16} />
          <span>Tên phòng</span>
        </label>
        <input
          type="text"
          className="rm-input"
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          placeholder={
            source === 'kanji'
              ? 'Đại Chiến Kanji'
              : source === 'vocabulary'
              ? 'Đại Chiến Từ Vựng'
              : 'Đại Chiến JLPT'
          }
        />
      </div>

      {/* Source Selection */}
      <div className="rm-field">
        <label className="rm-label">
          <BookOpen size={16} />
          <span>Đại chiến</span>
        </label>
        <div className="rm-pills">
          <button
            type="button"
            className={`rm-pill lg ${source === 'vocabulary' ? 'active' : ''}`}
            onClick={() => onSourceChange('vocabulary')}
          >
            Từ vựng
          </button>
          <button
            type="button"
            className={`rm-pill lg ${source === 'kanji' ? 'active' : ''}`}
            onClick={() => onSourceChange('kanji')}
          >
            Kanji
          </button>
          <button
            type="button"
            className={`rm-pill lg ${source === 'jlpt' ? 'active' : ''}`}
            onClick={() => onSourceChange('jlpt')}
          >
            JLPT
          </button>
        </div>
        {isFlashcardSource && (
          <div className="rm-quick-select">
            <span className="rm-quick-label">Chọn nhanh:</span>
            <button type="button" className="rm-quick-btn" onClick={() => onSelectAllInLevel('N5')}>
              Tất cả N5
            </button>
            <button type="button" className="rm-quick-btn" onClick={() => onSelectAllInLevel('N4')}>
              Tất cả N4
            </button>
            <button type="button" className="rm-quick-btn" onClick={() => onSelectAllInLevel('N3')}>
              Tất cả N3
            </button>
            <button type="button" className="rm-quick-btn" onClick={onSelectAllLevels}>
              Tất cả
            </button>
            <button type="button" className="rm-quick-btn" onClick={onClearLessons}>
              Bỏ chọn
            </button>
          </div>
        )}
      </div>
    </>
  );
}
