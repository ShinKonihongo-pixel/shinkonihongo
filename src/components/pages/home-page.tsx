// Dashboard/Home page with Level → Lesson structure

import { useState, useMemo } from 'react';
import type { JLPTLevel, Lesson, Flashcard } from '../../types/flashcard';

export interface StudySelection {
  levels: JLPTLevel[];
  lessonIds: string[];
}

interface HomePageProps {
  statsByLevel: Record<JLPTLevel, number>;
  cards: Flashcard[];
  onStartStudy: () => void;
  onManageCards: () => void;
  onStudyByLevel: (level: JLPTLevel) => void;
  onStudyByCategory: (level: JLPTLevel) => void;
  onCustomStudy: (selection: StudySelection) => void;
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
  canAccessLocked?: boolean;
  isAdmin?: boolean;
  jlptQuestionCount?: number;
  onPracticeJLPT?: () => void;
}

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

export function HomePage({
  statsByLevel,
  cards,
  onStartStudy,
  onManageCards,
  onStudyByLevel,
  onCustomStudy,
  getLessonsByLevel,
  getChildLessons,
  canAccessLocked = false,
  isAdmin = false,
  jlptQuestionCount = 0,
  onPracticeJLPT,
}: HomePageProps) {
  const totalCards = cards.length;
  const [expandedLevel, setExpandedLevel] = useState<JLPTLevel | null>(null);
  const [expandedParent, setExpandedParent] = useState<string | null>(null);
  const [selectedLevels, setSelectedLevels] = useState<JLPTLevel[]>([]);
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [showCustomStudy, setShowCustomStudy] = useState(false);

  // Count cards by lesson
  const getCardCountByLesson = (lessonId: string) => {
    return cards.filter(c => c.lessonId === lessonId).length;
  };

  // Count cards recursively (parent + all children)
  const getCardCountByLessonRecursive = (lessonId: string) => {
    const directCount = cards.filter(c => c.lessonId === lessonId).length;
    const children = getChildLessons(lessonId);
    const childrenCount = children.reduce((sum, child) => sum + getCardCountByLesson(child.id), 0);
    return directCount + childrenCount;
  };

  // Get lessons for selected levels
  const lessonsByLevel = useMemo(() => {
    const result: { level: JLPTLevel; lessons: Lesson[] }[] = [];
    selectedLevels.forEach(level => {
      const lessons = getLessonsByLevel(level);
      if (lessons.length > 0) {
        result.push({ level, lessons });
      }
    });
    return result;
  }, [selectedLevels, getLessonsByLevel]);

  const toggleLevel = (level: JLPTLevel) => {
    setSelectedLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  const toggleLesson = (lessonId: string) => {
    setSelectedLessons(prev =>
      prev.includes(lessonId) ? prev.filter(id => id !== lessonId) : [...prev, lessonId]
    );
  };

  // Count cards for selection
  const selectedCardCount = useMemo(() => {
    return cards.filter(card => {
      if (selectedLevels.length > 0 && !selectedLevels.includes(card.jlptLevel)) return false;
      if (selectedLessons.length > 0 && !selectedLessons.includes(card.lessonId)) return false;
      return true;
    }).length;
  }, [cards, selectedLevels, selectedLessons]);

  const handleCustomStudy = () => {
    onCustomStudy({ levels: selectedLevels, lessonIds: selectedLessons });
  };

  const clearSelection = () => {
    setSelectedLevels([]);
    setSelectedLessons([]);
  };

  return (
    <div className="home-page">
      <div className="welcome-section">
        <h2>日本語 Flashcards</h2>
        <p>Học từ vựng tiếng Nhật hiệu quả</p>
      </div>

      <div className="jlpt-breakdown">
        <h3>Phân bổ theo JLPT</h3>
        <div className="jlpt-tree">
          {JLPT_LEVELS.map(level => {
            const count = statsByLevel[level];
            const isExpanded = expandedLevel === level;
            const levelLessons = getLessonsByLevel(level);

            return (
              <div key={level} className="jlpt-tree-item">
                <div
                  className="jlpt-level-row clickable"
                  onClick={() => {
                    if (levelLessons.length > 0) {
                      setExpandedLevel(isExpanded ? null : level);
                    } else if (count > 0) {
                      onStudyByLevel(level);
                    }
                  }}
                >
                  <span className="expand-btn">
                    {levelLessons.length > 0 ? (isExpanded ? '▼' : '▶') : '•'}
                  </span>
                  <span className="jlpt-level-name">{level}</span>
                  <div className="jlpt-bar">
                    <div
                      className="jlpt-bar-fill"
                      style={{ width: totalCards > 0 ? `${(count / totalCards) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="jlpt-count">{count}</span>
                </div>

                {isExpanded && (
                  <div className="category-list">
                    {levelLessons.map(lesson => {
                      const childLessons = getChildLessons(lesson.id);
                      const isParentExpanded = expandedParent === lesson.id;
                      const hasChildren = childLessons.length > 0;

                      return (
                        <div key={lesson.id} className="parent-lesson-group">
                          <div
                            className={`category-row ${lesson.isLocked && !canAccessLocked ? 'locked' : 'clickable'}`}
                            onClick={() => {
                              if (lesson.isLocked && !canAccessLocked) return;
                              if (hasChildren) {
                                setExpandedParent(isParentExpanded ? null : lesson.id);
                              } else if (getCardCountByLessonRecursive(lesson.id) > 0) {
                                onStudyByLevel(level);
                              }
                            }}
                          >
                            <span className="expand-btn">
                              {hasChildren ? (isParentExpanded ? '▼' : '▶') : '•'}
                            </span>
                            <span className="category-name">{lesson.name}</span>
                            {lesson.isLocked && !canAccessLocked && <span className="lock-icon">🔒</span>}
                            <span className="category-count">({getCardCountByLessonRecursive(lesson.id)})</span>
                          </div>

                          {isParentExpanded && hasChildren && (
                            <div className="child-lesson-list">
                              {childLessons.map(child => {
                                const isChildLocked = child.isLocked && !canAccessLocked;
                                return (
                                  <div
                                    key={child.id}
                                    className={`category-row child ${isChildLocked ? 'locked' : 'clickable'}`}
                                    onClick={() => {
                                      if (isChildLocked) return;
                                      getCardCountByLesson(child.id) > 0 && onStudyByLevel(level);
                                    }}
                                  >
                                    <span className="expand-btn">•</span>
                                    <span className="category-name">{child.name}</span>
                                    {isChildLocked && <span className="lock-icon">🔒</span>}
                                    <span className="category-count">({getCardCountByLesson(child.id)})</span>
                                  </div>
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

          {/* JLPT Practice Section */}
          <div className="jlpt-tree-item">
            <div
              className={`jlpt-level-row ${jlptQuestionCount > 0 && onPracticeJLPT ? 'clickable' : ''}`}
              onClick={() => {
                if (jlptQuestionCount > 0 && onPracticeJLPT) {
                  onPracticeJLPT();
                }
              }}
            >
              <span className="expand-btn">•</span>
              <span className="jlpt-level-name jlpt-test">JLPT</span>
              <div className="jlpt-bar jlpt-test-bar">
                <div
                  className="jlpt-bar-fill jlpt-test-fill"
                  style={{ width: (totalCards + jlptQuestionCount) > 0 ? `${(jlptQuestionCount / (totalCards + jlptQuestionCount)) * 100}%` : '0%' }}
                />
              </div>
              <span className="jlpt-count">{jlptQuestionCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Study Section */}
      <div className="custom-study-section">
        <div
          className="custom-study-header"
          onClick={() => setShowCustomStudy(!showCustomStudy)}
        >
          <span className="expand-btn">{showCustomStudy ? '▼' : '▶'}</span>
          <h3>Học tùy chọn</h3>
          {(selectedLevels.length > 0 || selectedLessons.length > 0) && (
            <span className="selection-badge">{selectedCardCount} thẻ</span>
          )}
        </div>

        {showCustomStudy && (
          <div className="custom-study-content">
            <div className="selection-group">
              <label className="group-label">Chọn JLPT Level:</label>
              <div className="checkbox-group">
                {JLPT_LEVELS.map(level => (
                  <label key={level} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedLevels.includes(level)}
                      onChange={() => toggleLevel(level)}
                    />
                    <span>{level}</span>
                    <span className="item-count">({statsByLevel[level]})</span>
                  </label>
                ))}
              </div>
            </div>

            {lessonsByLevel.length > 0 && (
              <div className="selection-group">
                <label className="group-label">Chọn bài học:</label>
                <div className="checkbox-group categories">
                  {lessonsByLevel.map(({ level, lessons }) => (
                    <div key={level} className="level-group">
                      <div className="level-group-header">{level}</div>
                      {lessons.map(lesson => (
                        <label key={lesson.id} className="checkbox-item parent">
                          <input
                            type="checkbox"
                            checked={selectedLessons.includes(lesson.id)}
                            onChange={() => toggleLesson(lesson.id)}
                          />
                          <span>{lesson.name}</span>
                          <span className="item-count">({getCardCountByLesson(lesson.id)})</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="custom-study-actions">
              <button
                className="btn btn-primary"
                onClick={handleCustomStudy}
                disabled={selectedLevels.length === 0 && selectedLessons.length === 0}
              >
                Học {selectedCardCount} thẻ đã chọn
              </button>
              <button
                className="btn btn-secondary"
                onClick={clearSelection}
                disabled={selectedLevels.length === 0 && selectedLessons.length === 0}
              >
                Xóa lựa chọn
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="action-buttons">
        <button
          className="btn btn-large btn-primary"
          onClick={onStartStudy}
          disabled={totalCards === 0}
        >
          Bắt đầu học
        </button>
        {isAdmin && (
          <button className="btn btn-large btn-secondary" onClick={onManageCards}>
            Quản lý thẻ
          </button>
        )}
      </div>
    </div>
  );
}
