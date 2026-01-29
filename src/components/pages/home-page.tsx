// Professional Homepage - Modern Dashboard Design
// Features: Clean UI, quick actions, visual stats, intuitive navigation

import { useState, useMemo } from 'react';
import type { JLPTLevel, Lesson, Flashcard } from '../../types/flashcard';
import type { ProgressSummary } from '../../types/progress';
import { DailyWordsTask } from '../home/daily-words-task';
import {
  Play,
  ChevronRight,
  ChevronDown,
  Lock,
  Flame,
  Zap,
  Sparkles,
  Clock,
  CheckCircle2,
  Star,
  BookOpen,
  Headphones,
  FileText,
  Gamepad2,
  Award,
  TrendingUp,
  Target,
  Calendar,
  Trophy,
} from 'lucide-react';

export interface StudySelection {
  levels: JLPTLevel[];
  lessonIds: string[];
}

interface DailyWordsProps {
  todayWords: Flashcard[];
  progress: { completed: number; target: number; percent: number };
  isCompleted: boolean;
  streak: number;
  longestStreak: number;
  markWordLearned: (wordId: string) => void;
  markAllLearned: () => void;
  refreshWords: () => void;
  enabled: boolean;
  justCompleted: boolean;
  completedWordIds: Set<string>;
}

interface HomePageProps {
  statsByLevel: Record<JLPTLevel, number>;
  cards: Flashcard[];
  onStartStudy: () => void;
  onStudyByLevel: (level: JLPTLevel) => void;
  onCustomStudy: (selection: StudySelection) => void;
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
  canAccessLocked?: boolean;
  onPracticeJLPT?: () => void;
  onNavigate?: (page: string) => void;
  userName?: string;
  progress?: ProgressSummary;
  dailyWords?: DailyWordsProps;
  onSpeak?: (text: string) => void;
}

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

const LEVEL_CONFIG: Record<JLPTLevel, { color: string; gradient: string; emoji: string; label: string }> = {
  N5: { color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', emoji: '🌱', label: 'Sơ cấp' },
  N4: { color: '#06b6d4', gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', emoji: '📚', label: 'Cơ bản' },
  N3: { color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', emoji: '🎯', label: 'Trung cấp' },
  N2: { color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', emoji: '🚀', label: 'Cao cấp' },
  N1: { color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', emoji: '👑', label: 'Thành thạo' },
};

export function HomePage({
  statsByLevel,
  cards,
  onStartStudy,
  onStudyByLevel,
  onCustomStudy,
  getLessonsByLevel,
  getChildLessons,
  canAccessLocked = false,
  onNavigate,
  userName,
  progress,
  dailyWords,
  onSpeak,
}: HomePageProps) {
  const totalCards = cards.length;
  const [expandedLevel, setExpandedLevel] = useState<JLPTLevel | null>(null);
  const [expandedParent, setExpandedParent] = useState<string | null>(null);
  const [selectedLevels, setSelectedLevels] = useState<JLPTLevel[]>([]);
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [showCustomStudy, setShowCustomStudy] = useState(false);

  const streak = progress?.streak;
  const levelProgress = progress?.levelProgress || [];
  const cardsDue = progress?.cardsDueToday || 0;
  const currentLevel = progress?.currentLevel || 1;
  const totalXP = progress?.totalXP || 0;

  const getCardCountByLesson = (lessonId: string) => cards.filter(c => c.lessonId === lessonId).length;
  const getCardCountByLessonRecursive = (lessonId: string) => {
    const directCount = cards.filter(c => c.lessonId === lessonId).length;
    const children = getChildLessons(lessonId);
    return directCount + children.reduce((sum, child) => sum + getCardCountByLesson(child.id), 0);
  };

  const lessonsByLevel = useMemo(() => {
    return selectedLevels
      .map(level => ({ level, lessons: getLessonsByLevel(level) }))
      .filter(({ lessons }) => lessons.length > 0);
  }, [selectedLevels, getLessonsByLevel]);

  const toggleLevel = (level: JLPTLevel) => {
    setSelectedLevels(prev => prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]);
  };

  const toggleLesson = (lessonId: string) => {
    setSelectedLessons(prev => prev.includes(lessonId) ? prev.filter(id => id !== lessonId) : [...prev, lessonId]);
  };

  const selectedCardCount = useMemo(() => {
    return cards.filter(card => {
      if (selectedLevels.length > 0 && !selectedLevels.includes(card.jlptLevel)) return false;
      if (selectedLessons.length > 0 && !selectedLessons.includes(card.lessonId)) return false;
      return true;
    }).length;
  }, [cards, selectedLevels, selectedLessons]);

  const totalMemorized = levelProgress.reduce((s, l) => s + l.memorized, 0);
  const masteryPercent = totalCards > 0 ? Math.round((totalMemorized / totalCards) * 100) : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Chào buổi sáng', icon: '🌅' };
    if (hour < 18) return { text: 'Chào buổi chiều', icon: '☀️' };
    return { text: 'Chào buổi tối', icon: '🌙' };
  };

  const greeting = getGreeting();

  // Get current date in Vietnamese
  const today = new Date();
  const dateStr = today.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="home-dashboard">
      {/* Welcome Section */}
      <header className="home-welcome">
        <div className="home-welcome-content">
          <span className="home-date">
            <Calendar size={14} />
            {dateStr}
          </span>
          <h1 className="home-greeting">
            <span className="greeting-icon">{greeting.icon}</span>
            {greeting.text}, <span className="greeting-name">{userName || 'Bạn'}</span>
          </h1>
          <p className="home-slogan">Mỗi từ vựng học được là một bước tiến gần hơn đến mục tiêu!</p>
        </div>
        <div className="home-user-stats">
          <div className="user-stat streak" title="Streak">
            <Flame size={18} />
            <span className="user-stat-value">{streak?.currentStreak || 0}</span>
            <span className="user-stat-label">ngày</span>
          </div>
          <div className="user-stat xp" title="Kinh nghiệm">
            <Zap size={18} />
            <span className="user-stat-value">{totalXP.toLocaleString()}</span>
            <span className="user-stat-label">XP</span>
          </div>
          <div className="user-stat level" title="Cấp độ">
            <Star size={18} />
            <span className="user-stat-value">Lv.{currentLevel}</span>
          </div>
        </div>
      </header>

      {/* Daily Task */}
      {dailyWords && dailyWords.enabled && dailyWords.todayWords.length > 0 && (
        <DailyWordsTask
          todayWords={dailyWords.todayWords}
          progress={dailyWords.progress}
          isCompleted={dailyWords.isCompleted}
          streak={dailyWords.streak}
          longestStreak={dailyWords.longestStreak}
          onMarkLearned={dailyWords.markWordLearned}
          onMarkAllLearned={dailyWords.markAllLearned}
          onRefresh={dailyWords.refreshWords}
          onSpeak={onSpeak}
          justCompleted={dailyWords.justCompleted}
          completedWordIds={dailyWords.completedWordIds}
        />
      )}

      {/* Main CTA */}
      <section className="home-main-cta">
        <button className="home-cta-button" onClick={onStartStudy} disabled={totalCards === 0}>
          <div className="cta-icon-wrapper">
            <Play size={28} />
          </div>
          <div className="cta-content">
            <span className="cta-title">Bắt đầu học ngay</span>
            <span className="cta-subtitle">
              {totalCards.toLocaleString()} thẻ • {masteryPercent}% hoàn thành
            </span>
          </div>
          {cardsDue > 0 && (
            <div className="cta-badge pulse">
              <Clock size={14} />
              <span>{cardsDue} cần ôn</span>
            </div>
          )}
          <ChevronRight size={24} className="cta-arrow" />
        </button>
      </section>

      {/* Stats Grid */}
      <section className="home-stats-grid">
        <div className="home-stat-card total">
          <div className="stat-card-icon">
            <Sparkles size={24} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-value">{totalCards.toLocaleString()}</span>
            <span className="stat-card-label">Tổng thẻ</span>
          </div>
        </div>
        <div className="home-stat-card memorized">
          <div className="stat-card-icon">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-value">{totalMemorized.toLocaleString()}</span>
            <span className="stat-card-label">Đã thuộc</span>
          </div>
        </div>
        <div className="home-stat-card progress">
          <div className="stat-card-ring">
            <svg viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.5" fill="none" stroke="var(--primary)" strokeWidth="3"
                strokeDasharray={`${masteryPercent} 100`}
                strokeLinecap="round"
                transform="rotate(-90 18 18)"
              />
            </svg>
            <span className="ring-value">{masteryPercent}%</span>
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Tiến độ</span>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="home-quick-actions">
        <h2 className="home-section-title">
          <Target size={20} />
          Hoạt động
        </h2>
        <div className="quick-actions-grid">
          <button className="quick-action-card" onClick={() => onNavigate?.('study')}>
            <div className="quick-action-icon vocabulary">
              <BookOpen size={22} />
            </div>
            <span className="quick-action-label">Từ vựng</span>
          </button>
          <button className="quick-action-card" onClick={() => onNavigate?.('grammar-study')}>
            <div className="quick-action-icon grammar">
              <FileText size={22} />
            </div>
            <span className="quick-action-label">Ngữ pháp</span>
          </button>
          <button className="quick-action-card" onClick={() => onNavigate?.('listening')}>
            <div className="quick-action-icon listening">
              <Headphones size={22} />
            </div>
            <span className="quick-action-label">Nghe</span>
          </button>
          <button className="quick-action-card" onClick={() => onNavigate?.('exercises')}>
            <div className="quick-action-icon exercises">
              <Award size={22} />
            </div>
            <span className="quick-action-label">Bài tập</span>
          </button>
          <button className="quick-action-card" onClick={() => onNavigate?.('game-hub')}>
            <div className="quick-action-icon games">
              <Gamepad2 size={22} />
            </div>
            <span className="quick-action-label">Game</span>
          </button>
          <button className="quick-action-card" onClick={() => onNavigate?.('jlpt')}>
            <div className="quick-action-icon jlpt">
              <Trophy size={22} />
            </div>
            <span className="quick-action-label">JLPT</span>
          </button>
        </div>
      </section>

      {/* JLPT Levels */}
      <section className="home-levels-section">
        <h2 className="home-section-title">
          <TrendingUp size={20} />
          Cấp độ JLPT
        </h2>
        <div className="home-levels-list">
          {JLPT_LEVELS.map(level => {
            const count = statsByLevel[level];
            const lp = levelProgress.find(l => l.level === level);
            const memorized = lp?.memorized || 0;
            const percent = count > 0 ? Math.round((memorized / count) * 100) : 0;
            const config = LEVEL_CONFIG[level];
            const isExpanded = expandedLevel === level;

            return (
              <div key={level} className={`home-level-item ${isExpanded ? 'expanded' : ''} ${count === 0 ? 'empty' : ''}`}>
                <button
                  className="home-level-header"
                  onClick={() => count > 0 && setExpandedLevel(isExpanded ? null : level)}
                  disabled={count === 0}
                >
                  <div className="level-left">
                    <div className="level-badge" style={{ background: config.gradient }}>
                      <span className="level-emoji">{config.emoji}</span>
                      <span className="level-name">{level}</span>
                    </div>
                    <div className="level-info">
                      <span className="level-label">{config.label}</span>
                      <span className="level-count">{count} thẻ</span>
                    </div>
                  </div>
                  <div className="level-right">
                    <div className="level-progress-bar">
                      <div
                        className="level-progress-fill"
                        style={{ width: `${percent}%`, background: config.color }}
                      />
                    </div>
                    <span className="level-percent" style={{ color: config.color }}>{percent}%</span>
                    {count > 0 && (
                      <ChevronDown size={18} className={`level-chevron ${isExpanded ? 'open' : ''}`} />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="home-level-content">
                    <div className="level-lessons">
                      {getLessonsByLevel(level).map(lesson => {
                        const childLessons = getChildLessons(lesson.id);
                        const isParentExpanded = expandedParent === lesson.id;
                        const hasChildren = childLessons.length > 0;
                        const lessonCount = getCardCountByLessonRecursive(lesson.id);
                        const isLocked = lesson.isLocked && !canAccessLocked;

                        return (
                          <div key={lesson.id} className="level-lesson-group">
                            <button
                              className={`level-lesson-item ${isLocked ? 'locked' : ''}`}
                              onClick={() => {
                                if (isLocked) return;
                                if (hasChildren) setExpandedParent(isParentExpanded ? null : lesson.id);
                                else if (lessonCount > 0) onStudyByLevel(level);
                              }}
                              disabled={isLocked}
                            >
                              {hasChildren && (
                                <ChevronRight size={14} className={`lesson-expand ${isParentExpanded ? 'open' : ''}`} />
                              )}
                              <span className="lesson-name">{lesson.name}</span>
                              {isLocked && <Lock size={12} className="lesson-lock" />}
                              <span className="lesson-badge">{lessonCount}</span>
                            </button>

                            {isParentExpanded && hasChildren && (
                              <div className="level-sub-lessons">
                                {childLessons.map(child => {
                                  const childLocked = child.isLocked && !canAccessLocked;
                                  const childCount = getCardCountByLesson(child.id);
                                  return (
                                    <button
                                      key={child.id}
                                      className={`level-lesson-item sub ${childLocked ? 'locked' : ''}`}
                                      onClick={() => !childLocked && childCount > 0 && onStudyByLevel(level)}
                                      disabled={childLocked}
                                    >
                                      <span className="lesson-name">{child.name}</span>
                                      {childLocked && <Lock size={12} className="lesson-lock" />}
                                      <span className="lesson-badge">{childCount}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button
                      className="level-study-all"
                      onClick={() => onStudyByLevel(level)}
                      style={{ background: config.gradient }}
                    >
                      <Play size={16} />
                      Học tất cả {level}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Custom Study */}
      <section className="home-custom-section">
        <button
          className="home-custom-toggle"
          onClick={() => {
            setShowCustomStudy(!showCustomStudy);
            if (!showCustomStudy && selectedLevels.length === 0) setSelectedLevels(['N5']);
          }}
        >
          <div className="custom-toggle-left">
            <Sparkles size={20} />
            <div className="custom-toggle-text">
              <span className="custom-toggle-title">Học tùy chọn</span>
              <span className="custom-toggle-subtitle">Chọn bài học cụ thể</span>
            </div>
          </div>
          {selectedCardCount > 0 && showCustomStudy && (
            <span className="custom-count-badge">{selectedCardCount}</span>
          )}
          <ChevronRight size={20} className={`custom-chevron ${showCustomStudy ? 'open' : ''}`} />
        </button>

        {showCustomStudy && (
          <div className="home-custom-content">
            <div className="custom-level-chips">
              {JLPT_LEVELS.map(level => {
                const config = LEVEL_CONFIG[level];
                const isSelected = selectedLevels.includes(level);
                return (
                  <button
                    key={level}
                    className={`custom-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => toggleLevel(level)}
                    style={isSelected ? { background: config.gradient, borderColor: 'transparent' } : undefined}
                  >
                    {level}
                  </button>
                );
              })}
            </div>

            {lessonsByLevel.length > 0 && (
              <div className="custom-lessons-container">
                {lessonsByLevel.map(({ level, lessons }) => (
                  <div key={level} className="custom-level-group">
                    <span className="custom-group-label">{level}</span>
                    <div className="custom-lessons-row">
                      {lessons.map(lesson => (
                        <label key={lesson.id} className="custom-lesson-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedLessons.includes(lesson.id)}
                            onChange={() => toggleLesson(lesson.id)}
                          />
                          <span className="checkbox-visual" />
                          <span className="checkbox-text">{lesson.name}</span>
                          <span className="checkbox-count">{getCardCountByLesson(lesson.id)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="custom-actions">
              <button
                className="custom-btn secondary"
                onClick={() => { setSelectedLevels([]); setSelectedLessons([]); setShowCustomStudy(false); }}
              >
                Hủy
              </button>
              <button
                className="custom-btn primary"
                onClick={() => onCustomStudy({ levels: selectedLevels, lessonIds: selectedLessons })}
                disabled={selectedCardCount === 0}
              >
                <Play size={16} />
                Học {selectedCardCount} thẻ
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
