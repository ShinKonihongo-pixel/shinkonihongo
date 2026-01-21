// Professional Homepage - Pro Designer Edition v2
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
} from 'lucide-react';

export interface StudySelection {
  levels: JLPTLevel[];
  lessonIds: string[];
}

// Daily words props type
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
  // Daily words
  dailyWords?: DailyWordsProps;
  onSpeak?: (text: string) => void;
}

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

const LEVEL_CONFIG: Record<JLPTLevel, { gradient: string; emoji: string; label: string }> = {
  N5: { gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', emoji: '🌱', label: 'Beginner' },
  N4: { gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', emoji: '📚', label: 'Elementary' },
  N3: { gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', emoji: '🎯', label: 'Intermediate' },
  N2: { gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', emoji: '🚀', label: 'Advanced' },
  N1: { gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', emoji: '👑', label: 'Master' },
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
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <div className="hp-pro edge">
      {/* Hero Section with Slogan */}
      <header className="hp-hero">
        <div className="hp-hero-content">
          <div className="hp-hero-text">
            <span className="hp-greeting-label">{getGreeting()}</span>
            <h1 className="hp-hero-title">{userName || 'Bạn'}</h1>
            <p className="hp-slogan">学んだ単語の一つ一つが、目標に近づく一歩です。</p>
          </div>
          <div className="hp-hero-stats">
            <div className="hp-hero-stat fire">
              <Flame size={18} />
              <span className="stat-val">{streak?.currentStreak || 0}</span>
              <span className="stat-unit">ngày</span>
            </div>
            <div className="hp-hero-stat xp">
              <Zap size={18} />
              <span className="stat-val">{totalXP.toLocaleString()}</span>
            </div>
            <div className="hp-hero-stat level">
              <Star size={16} />
              <span className="stat-val">Lv.{currentLevel}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Daily Words Task */}
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

      {/* Main CTA Card */}
      <div className="hp-cta-card">
        <button className="hp-cta-btn" onClick={onStartStudy} disabled={totalCards === 0}>
          <div className="hp-cta-icon">
            <Play size={28} />
          </div>
          <div className="hp-cta-info">
            <span className="hp-cta-title">Bắt đầu học ngay</span>
            <span className="hp-cta-meta">
              <span>{totalCards.toLocaleString()} thẻ</span>
              <span className="dot">•</span>
              <span>{masteryPercent}% hoàn thành</span>
            </span>
          </div>
          {cardsDue > 0 && (
            <div className="hp-cta-badge">
              <Clock size={14} />
              <span>{cardsDue} cần ôn</span>
            </div>
          )}
        </button>
      </div>

      {/* Stats Row */}
      <div className="hp-stats-row">
        <div className="hp-stat-item">
          <div className="hp-stat-icon total">
            <Sparkles size={20} />
          </div>
          <div className="hp-stat-data">
            <span className="hp-stat-value">{totalCards.toLocaleString()}</span>
            <span className="hp-stat-label">Tổng thẻ</span>
          </div>
        </div>
        <div className="hp-stat-item">
          <div className="hp-stat-icon done">
            <CheckCircle2 size={20} />
          </div>
          <div className="hp-stat-data">
            <span className="hp-stat-value">{totalMemorized.toLocaleString()}</span>
            <span className="hp-stat-label">Đã thuộc</span>
          </div>
        </div>
        <div className="hp-stat-item">
          <div className="hp-stat-icon progress">
            <div className="mini-ring">
              <svg viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3"
                  strokeDasharray={`${masteryPercent} 100`}
                  strokeLinecap="round"
                  transform="rotate(-90 18 18)"
                />
              </svg>
            </div>
          </div>
          <div className="hp-stat-data">
            <span className="hp-stat-value">{masteryPercent}%</span>
            <span className="hp-stat-label">Tiến độ</span>
          </div>
        </div>
      </div>

      {/* JLPT Levels Grid */}
      <section className="hp-section-pro">
        <div className="hp-section-header styled">
          <h2>Cấp độ JLPT</h2>
          <span className="hp-section-sub">Chọn cấp độ để bắt đầu</span>
        </div>
        <div className="hp-levels-grid">
          {JLPT_LEVELS.map(level => {
            const count = statsByLevel[level];
            const lp = levelProgress.find(l => l.level === level);
            const memorized = lp?.memorized || 0;
            const percent = count > 0 ? Math.round((memorized / count) * 100) : 0;
            const config = LEVEL_CONFIG[level];
            const isExpanded = expandedLevel === level;

            return (
              <div key={level} className={`hp-level-card ${isExpanded ? 'expanded' : ''} ${count === 0 ? 'empty' : ''}`}>
                <button
                  className="hp-level-card-btn"
                  onClick={() => count > 0 && setExpandedLevel(isExpanded ? null : level)}
                  disabled={count === 0}
                  style={{ '--level-gradient': config.gradient } as React.CSSProperties}
                >
                  <div className="hp-level-emoji">{config.emoji}</div>
                  <div className="hp-level-badge">{level}</div>
                  <div className="hp-level-label">{config.label}</div>
                  <div className="hp-level-count">{count} thẻ</div>
                  <div className="hp-level-progress-ring">
                    <svg viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" />
                      <circle
                        cx="18" cy="18" r="15.5" fill="none" stroke="white" strokeWidth="2.5"
                        strokeDasharray={`${percent} 100`}
                        strokeLinecap="round"
                        transform="rotate(-90 18 18)"
                      />
                    </svg>
                    <span className="ring-percent">{percent}%</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="hp-level-dropdown">
                    {getLessonsByLevel(level).map(lesson => {
                      const childLessons = getChildLessons(lesson.id);
                      const isParentExpanded = expandedParent === lesson.id;
                      const hasChildren = childLessons.length > 0;
                      const lessonCount = getCardCountByLessonRecursive(lesson.id);
                      const isLocked = lesson.isLocked && !canAccessLocked;

                      return (
                        <div key={lesson.id} className="hp-lesson-item">
                          <button
                            className={`hp-lesson-row ${isLocked ? 'locked' : ''}`}
                            onClick={() => {
                              if (isLocked) return;
                              if (hasChildren) setExpandedParent(isParentExpanded ? null : lesson.id);
                              else if (lessonCount > 0) onStudyByLevel(level);
                            }}
                            disabled={isLocked}
                          >
                            {hasChildren && (
                              <span className="lesson-chevron">
                                {isParentExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </span>
                            )}
                            <span className="lesson-name">{lesson.name}</span>
                            {isLocked && <Lock size={12} className="lock-icon" />}
                            <span className="lesson-badge">{lessonCount}</span>
                          </button>

                          {isParentExpanded && hasChildren && (
                            <div className="hp-sub-lessons">
                              {childLessons.map(child => {
                                const childLocked = child.isLocked && !canAccessLocked;
                                const childCount = getCardCountByLesson(child.id);
                                return (
                                  <button
                                    key={child.id}
                                    className={`hp-lesson-row sub ${childLocked ? 'locked' : ''}`}
                                    onClick={() => !childLocked && childCount > 0 && onStudyByLevel(level)}
                                    disabled={childLocked}
                                  >
                                    <span className="lesson-name">{child.name}</span>
                                    {childLocked && <Lock size={12} className="lock-icon" />}
                                    <span className="lesson-badge">{childCount}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <button
                      className="hp-study-level-btn"
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

      {/* Custom Study Section */}
      <section className="hp-section-pro">
        <button
          className="hp-custom-header styled"
          onClick={() => setSelectedLevels(prev => prev.length > 0 ? [] : ['N5'])}
        >
          <div className="hp-custom-header-left">
            <h2>Học tùy chọn</h2>
            <span className="hp-custom-sub">Chọn bài học cụ thể</span>
          </div>
          {selectedCardCount > 0 && selectedLevels.length > 0 && (
            <span className="hp-custom-count">{selectedCardCount}</span>
          )}
          <ChevronRight size={20} className={`hp-custom-chevron ${selectedLevels.length > 0 ? 'open' : ''}`} />
        </button>

        {selectedLevels.length > 0 && (
          <div className="hp-custom-body">
            <div className="hp-custom-chips">
              {JLPT_LEVELS.map(level => {
                const config = LEVEL_CONFIG[level];
                const isSelected = selectedLevels.includes(level);
                return (
                  <button
                    key={level}
                    className={`hp-custom-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => toggleLevel(level)}
                    style={isSelected ? { background: config.gradient } : undefined}
                  >
                    {level}
                  </button>
                );
              })}
            </div>

            {lessonsByLevel.length > 0 && (
              <div className="hp-custom-lessons horizontal">
                {lessonsByLevel.map(({ level, lessons }) => (
                  <div key={level} className="hp-custom-group horizontal">
                    <span className="hp-custom-group-label">{level}</span>
                    <div className="hp-custom-lessons-row">
                      {lessons.map(lesson => (
                        <label key={lesson.id} className="hp-custom-checkbox compact">
                          <input
                            type="checkbox"
                            checked={selectedLessons.includes(lesson.id)}
                            onChange={() => toggleLesson(lesson.id)}
                          />
                          <span className="checkbox-box" />
                          <span className="checkbox-text">{lesson.name}</span>
                          <span className="checkbox-count">{getCardCountByLesson(lesson.id)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="hp-custom-footer">
              <button className="hp-btn-secondary" onClick={() => { setSelectedLevels([]); setSelectedLessons([]); }}>
                Xóa chọn
              </button>
              <button
                className="hp-btn-primary"
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
