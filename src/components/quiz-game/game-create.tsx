// Game creation form component

import { useState, useMemo } from 'react';
import type { Flashcard, JLPTLevel, Lesson } from '../../types/flashcard';
import type { JLPTQuestion, QuestionCategory, JLPTLevel as JLPTQuestionLevel } from '../../types/jlpt-question';
import type { CreateGameData, GameQuestionSource } from '../../types/quiz-game';
import type { AppSettings } from '../../hooks/use-settings';

interface GameCreateProps {
  flashcards: Flashcard[];
  jlptQuestions: JLPTQuestion[];
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
  onCreateGame: (data: CreateGameData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
  gameSettings: AppSettings;
}

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
const JLPT_QUESTION_LEVELS: JLPTQuestionLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
const QUESTION_CATEGORIES: { value: QuestionCategory; label: string }[] = [
  { value: 'vocabulary', label: 'Từ vựng' },
  { value: 'grammar', label: 'Ngữ pháp' },
  { value: 'reading', label: 'Đọc hiểu' },
  { value: 'listening', label: 'Nghe' },
];

export function GameCreate({
  flashcards,
  jlptQuestions,
  getLessonsByLevel,
  getChildLessons,
  onCreateGame,
  onCancel,
  loading,
  error,
  gameSettings,
}: GameCreateProps) {
  const [title, setTitle] = useState('');
  const [source, setSource] = useState<GameQuestionSource>('flashcards');
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [selectedJLPTLevels, setSelectedJLPTLevels] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [totalRounds, setTotalRounds] = useState(20);
  const [timePerQuestion, setTimePerQuestion] = useState(15);
  const [expandedLevel, setExpandedLevel] = useState<JLPTLevel | null>(null);

  // Count available cards from selected lessons
  const availableCards = flashcards.filter(c => selectedLessons.includes(c.lessonId)).length;

  // Count available JLPT questions based on filters
  const availableJLPTQuestions = useMemo(() => {
    let filtered = jlptQuestions;
    if (selectedJLPTLevels.length > 0) {
      filtered = filtered.filter(q => selectedJLPTLevels.includes(q.level));
    }
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(q => selectedCategories.includes(q.category));
    }
    return filtered.length;
  }, [jlptQuestions, selectedJLPTLevels, selectedCategories]);

  // Toggle JLPT level selection
  const handleToggleJLPTLevel = (level: string) => {
    setSelectedJLPTLevels(prev =>
      prev.includes(level)
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  };

  // Toggle category selection
  const handleToggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleToggleLesson = (lessonId: string) => {
    setSelectedLessons(prev =>
      prev.includes(lessonId)
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  const handleSelectAllInLevel = (level: JLPTLevel) => {
    const levelLessons = getLessonsByLevel(level);
    const allLessonIds: string[] = [];

    levelLessons.forEach(lesson => {
      allLessonIds.push(lesson.id);
      const children = getChildLessons(lesson.id);
      children.forEach(child => allLessonIds.push(child.id));
    });

    const allSelected = allLessonIds.every(id => selectedLessons.includes(id));

    if (allSelected) {
      setSelectedLessons(prev => prev.filter(id => !allLessonIds.includes(id)));
    } else {
      setSelectedLessons(prev => [...new Set([...prev, ...allLessonIds])]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (source === 'flashcards') {
      if (selectedLessons.length === 0) {
        return;
      }
      if (availableCards < 4) {
        return;
      }
      const actualRounds = Math.min(totalRounds, availableCards);
      await onCreateGame({
        title: title || 'Đại Chiến N5',
        source: 'flashcards',
        lessonIds: selectedLessons,
        totalRounds: actualRounds,
        timePerQuestion,
        questionContent: gameSettings.gameQuestionContent,
        answerContent: gameSettings.gameAnswerContent,
      });
    } else {
      if (availableJLPTQuestions < 4) {
        return;
      }
      const actualRounds = Math.min(totalRounds, availableJLPTQuestions);
      await onCreateGame({
        title: title || 'Đại Chiến JLPT',
        source: 'jlpt',
        lessonIds: [],
        jlptLevels: selectedJLPTLevels.length > 0 ? selectedJLPTLevels : undefined,
        jlptCategories: selectedCategories.length > 0 ? selectedCategories : undefined,
        totalRounds: actualRounds,
        timePerQuestion,
      });
    }
  };

  const availableQuestions = source === 'flashcards' ? availableCards : availableJLPTQuestions;
  const canSubmit = source === 'flashcards'
    ? selectedLessons.length > 0 && availableCards >= 4
    : availableJLPTQuestions >= 4;

  return (
    <div className="quiz-game-page">
      <div className="game-create">
        <h2>Tạo phòng mới</h2>

        <form onSubmit={handleSubmit} className="create-game-form">
          <div className="form-group">
            <label htmlFor="title">Tên phòng</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={source === 'flashcards' ? 'Đại Chiến N5' : 'Đại Chiến JLPT'}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Nguồn câu hỏi</label>
            <div className="source-selector">
              <button
                type="button"
                className={`source-btn ${source === 'flashcards' ? 'active' : ''}`}
                onClick={() => setSource('flashcards')}
              >
                Flashcards ({flashcards.length})
              </button>
              <button
                type="button"
                className={`source-btn ${source === 'jlpt' ? 'active' : ''}`}
                onClick={() => setSource('jlpt')}
              >
                JLPT ({jlptQuestions.length})
              </button>
            </div>
          </div>

          {source === 'flashcards' ? (
            <div className="form-group">
              <label>Chọn bài học ({availableCards} thẻ)</label>
              <div className="lesson-selector">
                {JLPT_LEVELS.map(level => {
                  const levelLessons = getLessonsByLevel(level);
                  const isExpanded = expandedLevel === level;

                  if (levelLessons.length === 0) return null;

                  return (
                    <div key={level} className="lesson-level">
                      <div
                        className="lesson-level-header"
                        onClick={() => setExpandedLevel(isExpanded ? null : level)}
                      >
                        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                        <span className="level-name">{level}</span>
                        <button
                          type="button"
                          className="btn btn-small btn-outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAllInLevel(level);
                          }}
                        >
                          Chọn tất cả
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="lesson-list">
                          {levelLessons.map(lesson => {
                            const childLessons = getChildLessons(lesson.id);
                            const lessonCards = flashcards.filter(c => c.lessonId === lesson.id).length;

                            return (
                              <div key={lesson.id} className="lesson-item">
                                <label className="checkbox-label">
                                  <input
                                    type="checkbox"
                                    checked={selectedLessons.includes(lesson.id)}
                                    onChange={() => handleToggleLesson(lesson.id)}
                                  />
                                  <span>{lesson.name} ({lessonCards} thẻ)</span>
                                </label>

                                {childLessons.length > 0 && (
                                  <div className="child-lessons">
                                    {childLessons.map(child => {
                                      const childCards = flashcards.filter(c => c.lessonId === child.id).length;
                                      return (
                                        <label key={child.id} className="checkbox-label child">
                                          <input
                                            type="checkbox"
                                            checked={selectedLessons.includes(child.id)}
                                            onChange={() => handleToggleLesson(child.id)}
                                          />
                                          <span>{child.name} ({childCards} thẻ)</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {selectedLessons.length > 0 && availableCards < 4 && (
                <p className="error-message">Cần ít nhất 4 thẻ để tạo game</p>
              )}
            </div>
          ) : (
            <div className="form-group">
              <label>Chọn cấp độ và danh mục ({availableJLPTQuestions} câu hỏi)</label>
              <div className="jlpt-filter-section">
                <div className="filter-group">
                  <label className="filter-label">Cấp độ JLPT:</label>
                  <div className="filter-chips">
                    {JLPT_QUESTION_LEVELS.map(level => (
                      <button
                        key={level}
                        type="button"
                        className={`filter-chip ${selectedJLPTLevels.includes(level) ? 'active' : ''}`}
                        onClick={() => handleToggleJLPTLevel(level)}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <small className="filter-hint">Không chọn = tất cả cấp độ</small>
                </div>
                <div className="filter-group">
                  <label className="filter-label">Danh mục:</label>
                  <div className="filter-chips">
                    {QUESTION_CATEGORIES.map(cat => (
                      <button
                        key={cat.value}
                        type="button"
                        className={`filter-chip ${selectedCategories.includes(cat.value) ? 'active' : ''}`}
                        onClick={() => handleToggleCategory(cat.value)}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <small className="filter-hint">Không chọn = tất cả danh mục</small>
                </div>
              </div>
              {availableJLPTQuestions < 4 && (
                <p className="error-message">Cần ít nhất 4 câu hỏi JLPT để tạo game</p>
              )}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="rounds">Số câu hỏi</label>
              <input
                type="number"
                id="rounds"
                value={totalRounds}
                onChange={(e) => setTotalRounds(Math.max(10, Math.min(50, parseInt(e.target.value) || 20)))}
                min={10}
                max={50}
                className="form-input"
              />
              <small>10-50 câu (tối đa {availableQuestions} có sẵn)</small>
            </div>

            <div className="form-group">
              <label htmlFor="time">Thời gian mỗi câu (giây)</label>
              <input
                type="number"
                id="time"
                value={timePerQuestion}
                onChange={(e) => setTimePerQuestion(Math.max(5, Math.min(30, parseInt(e.target.value) || 15)))}
                min={5}
                max={30}
                className="form-input"
              />
              <small>5-30 giây</small>
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}

          <div className="form-buttons">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !canSubmit}
            >
              {loading ? 'Đang tạo...' : 'Tạo phòng'}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onCancel}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
