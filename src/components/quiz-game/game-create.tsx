// Game creation form component with unified Room Modal design system

import { useState, useMemo } from 'react';
import {
  X,
  Gamepad2,
  BookOpen,
  Layers,
  Clock,
  HelpCircle,
  Zap,
  Settings,
  Play,
  ChevronRight,
  Check,
} from 'lucide-react';
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
  { value: 'vocabulary', label: '📝 Từ vựng' },
  { value: 'grammar', label: '📖 Ngữ pháp' },
  { value: 'reading', label: '📚 Đọc hiểu' },
  { value: 'listening', label: '🎧 Nghe' },
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
  const [specialRoundEvery, setSpecialRoundEvery] = useState(5);
  const [expandedLevel, setExpandedLevel] = useState<JLPTLevel | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'settings'>('basic');

  // Count available cards from selected lessons
  const availableCards = flashcards.filter(c => selectedLessons.includes(c.lessonId)).length;

  // Get all lessons for lookup
  const allLessonsMap = useMemo(() => {
    const map = new Map<string, string>();
    JLPT_LEVELS.forEach(level => {
      const lessons = getLessonsByLevel(level);
      lessons.forEach(lesson => {
        map.set(lesson.id, lesson.name);
        const children = getChildLessons(lesson.id);
        children.forEach(child => map.set(child.id, child.name));
      });
    });
    return map;
  }, [getLessonsByLevel, getChildLessons]);

  // Get selected lesson names
  const selectedLessonNames = useMemo(() => {
    return selectedLessons.map(id => allLessonsMap.get(id) || id).slice(0, 5);
  }, [selectedLessons, allLessonsMap]);

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
        lessonNames: selectedLessonNames,
        totalRounds: actualRounds,
        timePerQuestion,
        questionContent: gameSettings.gameQuestionContent,
        answerContent: gameSettings.gameAnswerContent,
        settings: { specialRoundEvery },
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
        settings: { specialRoundEvery },
      });
    }
  };

  const availableQuestions = source === 'flashcards' ? availableCards : availableJLPTQuestions;
  const canSubmit = source === 'flashcards'
    ? selectedLessons.length > 0 && availableCards >= 4
    : availableJLPTQuestions >= 4;

  // Calculate slider progress percentages
  const roundsPercent = ((totalRounds - 10) / (50 - 10)) * 100;
  const timePercent = ((timePerQuestion - 5) / (30 - 5)) * 100;
  const specialPercent = ((specialRoundEvery - 1) / (20 - 1)) * 100;

  return (
    <div className="rm-overlay" onClick={onCancel}>
      <div className="rm-modal large" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <header className="rm-header">
          <div
            className="rm-header-gradient"
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)' }}
          />
          <div className="rm-header-icon">
            <Gamepad2 size={24} color="white" />
          </div>
          <div className="rm-header-content">
            <h1 className="rm-title">Tạo phòng mới</h1>
            <span className="rm-subtitle">Quiz Game - Đại Chiến</span>
          </div>
          <button className="rm-close-btn" onClick={onCancel} type="button">
            <X size={20} />
          </button>
        </header>

        {/* Body */}
        <div className="rm-body">
          {/* Tabs */}
          <div className="rm-tabs">
            <button
              type="button"
              className={`rm-tab ${activeTab === 'basic' ? 'active' : ''}`}
              onClick={() => setActiveTab('basic')}
            >
              <BookOpen size={16} />
              Cơ bản
            </button>
            <button
              type="button"
              className={`rm-tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={16} />
              Cài đặt
            </button>
          </div>

          {error && (
            <div className="rm-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'basic' && (
            <>
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
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={source === 'flashcards' ? 'Đại Chiến N5' : 'Đại Chiến JLPT'}
                />
              </div>

              {/* Source Selection */}
              <div className="rm-field">
                <label className="rm-label">
                  <BookOpen size={16} />
                  <span>Nguồn câu hỏi</span>
                </label>
                <div className="rm-pills">
                  <button
                    type="button"
                    className={`rm-pill lg ${source === 'flashcards' ? 'active' : ''}`}
                    onClick={() => setSource('flashcards')}
                  >
                    Flashcards ({flashcards.length})
                  </button>
                  <button
                    type="button"
                    className={`rm-pill lg ${source === 'jlpt' ? 'active' : ''}`}
                    onClick={() => setSource('jlpt')}
                  >
                    JLPT ({jlptQuestions.length})
                  </button>
                </div>
              </div>

              {source === 'flashcards' ? (
                <div className="rm-field">
                  <label className="rm-label">
                    <Layers size={16} />
                    <span>Chọn bài học</span>
                    <span className="rm-label-hint">
                      <span className="rm-label-value">{availableCards} thẻ</span>
                    </span>
                  </label>

                  <div className="rm-lesson-selector">
                    {JLPT_LEVELS.map(level => {
                      const levelLessons = getLessonsByLevel(level);
                      const isExpanded = expandedLevel === level;

                      if (levelLessons.length === 0) return null;

                      // Check if all lessons in this level are selected
                      const allLessonIdsInLevel: string[] = [];
                      levelLessons.forEach(lesson => {
                        allLessonIdsInLevel.push(lesson.id);
                        const children = getChildLessons(lesson.id);
                        children.forEach(child => allLessonIdsInLevel.push(child.id));
                      });
                      const allSelected = allLessonIdsInLevel.length > 0 &&
                        allLessonIdsInLevel.every(id => selectedLessons.includes(id));

                      return (
                        <div key={level} className={`rm-lesson-level ${isExpanded ? 'expanded' : ''}`}>
                          <div
                            className="rm-lesson-level-header"
                            onClick={() => setExpandedLevel(isExpanded ? null : level)}
                          >
                            <ChevronRight size={16} className="rm-expand-icon" />
                            <span className="rm-level-name">{level}</span>
                            <button
                              type="button"
                              className={`rm-btn ${allSelected ? 'rm-btn-primary' : ''}`}
                              style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectAllInLevel(level);
                              }}
                            >
                              {allSelected ? (
                                <>
                                  <Check size={14} />
                                  Đã chọn
                                </>
                              ) : 'Chọn tất cả'}
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="rm-lesson-list">
                              {levelLessons.map(lesson => {
                                const childLessons = getChildLessons(lesson.id);
                                const lessonCards = flashcards.filter(c => c.lessonId === lesson.id).length;

                                return (
                                  <div key={lesson.id} className="rm-lesson-item">
                                    <label className="rm-checkbox-label">
                                      <input
                                        type="checkbox"
                                        checked={selectedLessons.includes(lesson.id)}
                                        onChange={() => handleToggleLesson(lesson.id)}
                                      />
                                      <span>{lesson.name} ({lessonCards} thẻ)</span>
                                    </label>

                                    {childLessons.length > 0 && (
                                      <div className="rm-child-lessons">
                                        {childLessons.map(child => {
                                          const childCards = flashcards.filter(c => c.lessonId === child.id).length;
                                          return (
                                            <label key={child.id} className="rm-checkbox-label">
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
                    <div className="rm-error" style={{ marginTop: 'var(--rm-space-sm)' }}>
                      <span>⚠️</span>
                      <span>Cần ít nhất 4 thẻ để tạo game</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rm-filter-section">
                  <div className="rm-filter-group">
                    <label className="rm-label">
                      <Layers size={16} />
                      <span>Cấp độ JLPT</span>
                      <span className="rm-label-hint">
                        <span className="rm-label-value">{availableJLPTQuestions} câu hỏi</span>
                      </span>
                    </label>
                    <div className="rm-pills">
                      {JLPT_QUESTION_LEVELS.map(level => (
                        <button
                          key={level}
                          type="button"
                          className={`rm-pill ${selectedJLPTLevels.includes(level) ? 'active' : ''}`}
                          onClick={() => handleToggleJLPTLevel(level)}
                          data-level={level}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                    <span className="rm-filter-hint">Không chọn = tất cả cấp độ</span>
                  </div>

                  <div className="rm-filter-group">
                    <label className="rm-label">
                      <HelpCircle size={16} />
                      <span>Danh mục</span>
                    </label>
                    <div className="rm-pills">
                      {QUESTION_CATEGORIES.map(cat => (
                        <button
                          key={cat.value}
                          type="button"
                          className={`rm-pill sm ${selectedCategories.includes(cat.value) ? 'active' : ''}`}
                          onClick={() => handleToggleCategory(cat.value)}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                    <span className="rm-filter-hint">Không chọn = tất cả danh mục</span>
                  </div>

                  {availableJLPTQuestions < 4 && (
                    <div className="rm-error">
                      <span>⚠️</span>
                      <span>Cần ít nhất 4 câu hỏi JLPT để tạo game</span>
                    </div>
                  )}
                </div>
              )}

              {/* Rounds & Time */}
              <div className="rm-field">
                <label className="rm-label">
                  <HelpCircle size={16} />
                  <span>Số câu hỏi</span>
                  <span className="rm-label-hint">
                    <span className="rm-label-value">{totalRounds} câu</span>
                    <span style={{ marginLeft: '8px', color: 'var(--rm-text-dim)' }}>
                      (tối đa {availableQuestions})
                    </span>
                  </span>
                </label>
                <div className="rm-slider-wrap">
                  <input
                    type="range"
                    className="rm-slider"
                    min={10}
                    max={50}
                    step={5}
                    value={totalRounds}
                    onChange={(e) => setTotalRounds(parseInt(e.target.value))}
                    style={{ '--progress': `${roundsPercent}%` } as React.CSSProperties}
                  />
                  <div className="rm-slider-labels">
                    <span>10</span>
                    <span>30</span>
                    <span>50</span>
                  </div>
                </div>
              </div>

              <div className="rm-field">
                <label className="rm-label">
                  <Clock size={16} />
                  <span>Thời gian mỗi câu</span>
                  <span className="rm-label-hint">
                    <span className="rm-label-value">{timePerQuestion}s</span>
                  </span>
                </label>
                <div className="rm-slider-wrap">
                  <input
                    type="range"
                    className="rm-slider"
                    min={5}
                    max={30}
                    step={5}
                    value={timePerQuestion}
                    onChange={(e) => setTimePerQuestion(parseInt(e.target.value))}
                    style={{ '--progress': `${timePercent}%` } as React.CSSProperties}
                  />
                  <div className="rm-slider-labels">
                    <span>5s</span>
                    <span>15s</span>
                    <span>30s</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'settings' && (
            <>
              <div className="rm-field">
                <label className="rm-label">
                  <Zap size={16} />
                  <span>Câu đặc biệt (mỗi N câu)</span>
                  <span className="rm-label-hint">
                    <span className="rm-label-value">{specialRoundEvery}</span>
                  </span>
                </label>
                <div className="rm-slider-wrap">
                  <input
                    type="range"
                    className="rm-slider"
                    min={1}
                    max={20}
                    step={1}
                    value={specialRoundEvery}
                    onChange={(e) => setSpecialRoundEvery(parseInt(e.target.value))}
                    style={{ '--progress': `${specialPercent}%` } as React.CSSProperties}
                  />
                  <div className="rm-slider-labels">
                    <span>1</span>
                    <span>10</span>
                    <span>20</span>
                  </div>
                </div>
                <span className="rm-filter-hint" style={{ marginTop: '8px' }}>
                  Câu {specialRoundEvery}, {specialRoundEvery * 2}, {specialRoundEvery * 3}... sẽ là câu đặc biệt
                </span>
              </div>

              <div className="rm-info-box">
                <p><strong>💡 Câu đặc biệt:</strong> Người chơi có thể nhận power-up khi trả lời đúng câu đặc biệt</p>
                <p style={{ marginTop: '12px' }}><strong>Power-ups:</strong></p>
                <ul>
                  <li>🛡️ Shield - Bảo vệ điểm</li>
                  <li>⚡ Double - Nhân đôi điểm</li>
                  <li>⏱️ Time Freeze - Thêm thời gian</li>
                  <li>💰 Steal - Cướp điểm đối thủ</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="rm-footer">
          <button type="button" className="rm-btn rm-btn-ghost" onClick={onCancel}>
            Hủy
          </button>
          <button
            type="submit"
            className="rm-btn rm-btn-primary rm-btn-lg"
            disabled={loading || !canSubmit}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <span className="rm-spinner" />
                <span>Đang tạo...</span>
              </>
            ) : (
              <>
                <Play size={20} fill="white" />
                <span>Tạo phòng</span>
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
