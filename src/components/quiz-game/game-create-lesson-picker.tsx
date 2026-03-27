/**
 * LessonPicker — grouped/searchable lesson selector used in flashcard source modes.
 */

import { ChevronRight, Check, Layers } from 'lucide-react';
import type { JLPTLevel, Lesson } from '../../types/flashcard';
import { JLPT_LEVELS } from '../../constants/jlpt';
import { DIFFICULTY_OPTIONS } from './game-create-types';
import type { GameDifficultyLevel } from '../../types/quiz-game';

interface LessonPickerProps {
  selectedLessons: string[];
  expandedLevel: JLPTLevel | null;
  lessonSearch: string;
  filteredLessons: Lesson[] | null;
  levelCardCount: Record<string, number>;
  availableCards: number;
  selectedDifficulty: GameDifficultyLevel | null;
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  onLessonSearch: (v: string) => void;
  onToggleLesson: (id: string) => void;
  onSelectAllInLevel: (level: JLPTLevel) => void;
  onExpandLevel: (level: JLPTLevel | null) => void;
}

export function LessonPicker({
  selectedLessons,
  expandedLevel,
  lessonSearch,
  filteredLessons,
  levelCardCount,
  availableCards,
  selectedDifficulty,
  getLessonsByLevel,
  onLessonSearch,
  onToggleLesson,
  onSelectAllInLevel,
  onExpandLevel,
}: LessonPickerProps) {
  return (
    <div className="rm-field">
      <label className="rm-label">
        <Layers size={16} />
        <span>Chọn phạm vi câu hỏi</span>
      </label>

      <input
        type="text"
        className="rm-input rm-lesson-search"
        value={lessonSearch}
        onChange={e => onLessonSearch(e.target.value)}
        placeholder="🔍 Tìm bài học..."
      />

      <div className="rm-lesson-selector">
        {filteredLessons !== null ? (
          filteredLessons.length === 0 ? (
            <div style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', textAlign: 'center' }}>
              Không tìm thấy bài học nào
            </div>
          ) : (
            <div className="rm-lesson-grid">
              {filteredLessons.map(lesson => (
                <label key={lesson.id} className="rm-checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedLessons.includes(lesson.id)}
                    onChange={() => onToggleLesson(lesson.id)}
                  />
                  <span>{lesson.name}</span>
                </label>
              ))}
            </div>
          )
        ) : (
          JLPT_LEVELS.map(level => {
            const levelLessons = getLessonsByLevel(level);
            const isExpanded = expandedLevel === level;

            if (levelLessons.length === 0) return null;

            const allSelected =
              levelLessons.length > 0 && levelLessons.every(l => selectedLessons.includes(l.id));

            return (
              <div key={level} className={`rm-lesson-level ${isExpanded ? 'expanded' : ''}`}>
                <div
                  className="rm-lesson-level-header"
                  onClick={() => onExpandLevel(isExpanded ? null : level)}
                >
                  <ChevronRight size={16} className="rm-expand-icon" />
                  <span className="rm-level-name">{level}</span>
                  <span className="rm-level-count">({levelCardCount[level] ?? 0} thẻ)</span>
                  <button
                    type="button"
                    className={`rm-btn ${allSelected ? 'rm-btn-primary' : ''}`}
                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={e => {
                      e.stopPropagation();
                      onSelectAllInLevel(level);
                    }}
                  >
                    {allSelected ? (
                      <>
                        <Check size={14} />
                        Đã chọn
                      </>
                    ) : (
                      'Chọn tất cả'
                    )}
                  </button>
                </div>

                {isExpanded && (
                  <div className="rm-lesson-grid">
                    {levelLessons.map(lesson => (
                      <label key={lesson.id} className="rm-checkbox-label">
                        <input
                          type="checkbox"
                          checked={selectedLessons.includes(lesson.id)}
                          onChange={() => onToggleLesson(lesson.id)}
                        />
                        <span>{lesson.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {selectedLessons.length > 0 && (
        <div className="rm-selected-summary">
          <span className="rm-selected-count">{selectedLessons.length} bài học đã chọn</span>
          <span className="rm-selected-cards">{availableCards} thẻ</span>
          {selectedDifficulty && (
            <span
              className="rm-selected-diff"
              style={{ color: DIFFICULTY_OPTIONS.find(d => d.value === selectedDifficulty)?.color }}
            >
              {DIFFICULTY_OPTIONS.find(d => d.value === selectedDifficulty)?.label}
            </span>
          )}
        </div>
      )}

      {selectedLessons.length > 0 && availableCards < 4 && (
        <div className="rm-error" style={{ marginTop: 'var(--rm-space-sm)' }}>
          <span>⚠️</span>
          <span>Cần ít nhất 4 thẻ để tạo game</span>
        </div>
      )}
    </div>
  );
}
