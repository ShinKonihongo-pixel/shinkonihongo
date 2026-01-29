// Homepage - Japanese Learning Dashboard with Authentic Japanese Aesthetic
// Features: Immersive Japanese design, sakura motifs, traditional color palette

import { useState } from 'react';
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
  Clock,
  BookOpen,
  Headphones,
  FileText,
  Gamepad2,
  Award,
  Trophy,
  ArrowRight,
  Sparkles,
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
  onNavigate?: (page: string) => void;
  userName?: string;
  progress?: ProgressSummary;
  dailyWords?: DailyWordsProps;
  onSpeak?: (text: string) => void;
}

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

const LEVEL_COLORS: Record<JLPTLevel, string> = {
  N5: '#22c55e',
  N4: '#06b6d4',
  N3: '#3b82f6',
  N2: '#8b5cf6',
  N1: '#f59e0b',
};

const ACTIVITIES = [
  { id: 'study', icon: BookOpen, label: 'Từ vựng', desc: '単語', color: '#3b82f6' },
  { id: 'grammar-study', icon: FileText, label: 'Ngữ pháp', desc: '文法', color: '#8b5cf6' },
  { id: 'listening', icon: Headphones, label: 'Nghe', desc: '聴解', color: '#06b6d4' },
  { id: 'exercises', icon: Award, label: 'Bài tập', desc: '練習', color: '#f59e0b' },
  { id: 'game-hub', icon: Gamepad2, label: 'Trò chơi', desc: 'ゲーム', color: '#ec4899' },
  { id: 'jlpt', icon: Trophy, label: 'JLPT', desc: '試験', color: '#22c55e' },
];

// Japanese greetings based on time
const getJapaneseGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { jp: 'おはよう', vn: 'Chào buổi sáng' };
  if (hour < 18) return { jp: 'こんにちは', vn: 'Chào buổi chiều' };
  return { jp: 'こんばんは', vn: 'Chào buổi tối' };
};

export function HomePage({
  statsByLevel,
  cards,
  onStartStudy,
  onStudyByLevel,
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

  const streak = progress?.streak;
  const levelProgress = progress?.levelProgress || [];
  const cardsDue = progress?.cardsDueToday || 0;
  const currentLevel = progress?.currentLevel || 1;
  const totalXP = progress?.totalXP || 0;

  const totalMemorized = levelProgress.reduce((s, l) => s + l.memorized, 0);
  const masteryPercent = totalCards > 0 ? Math.round((totalMemorized / totalCards) * 100) : 0;

  const getCardCountByLesson = (lessonId: string) => cards.filter(c => c.lessonId === lessonId).length;
  const getCardCountByLessonRecursive = (lessonId: string) => {
    const directCount = cards.filter(c => c.lessonId === lessonId).length;
    const children = getChildLessons(lessonId);
    return directCount + children.reduce((sum, child) => sum + getCardCountByLesson(child.id), 0);
  };

  const greeting = getJapaneseGreeting();

  return (
    <div className="hp">
      {/* ===== PREMIUM HERO SECTION ===== */}
      <div className="hp-hero">
        {/* Animated background elements */}
        <div className="hp-hero-bg">
          <div className="hp-orb hp-orb-1" />
          <div className="hp-orb hp-orb-2" />
          <div className="hp-orb hp-orb-3" />
        </div>

        {/* Bottom wave transition */}
        <div className="hp-wave-pattern" />

        {/* Top bar with stats */}
        <header className="hp-header">
          <div className="hp-logo">
            <span className="hp-logo-icon">鶴</span>
            <span className="hp-logo-text">Nihongo</span>
          </div>
          <div className="hp-header-stats">
            <div className="hp-stat-badge">
              <Flame size={16} className="hp-stat-icon fire" />
              <span>{streak?.currentStreak || 0}</span>
            </div>
            <div className="hp-stat-badge">
              <Zap size={16} className="hp-stat-icon bolt" />
              <span>{totalXP.toLocaleString()}</span>
            </div>
          </div>
        </header>

        {/* Main hero content */}
        <div className="hp-hero-content">
          {/* Greeting */}
          <div className="hp-greeting">
            <span className="hp-greeting-jp">{greeting.jp}</span>
            <span className="hp-greeting-vn">{greeting.vn}, {userName || 'Bạn'}</span>
          </div>

          {/* Main title with slogan */}
          <div className="hp-hero-title">
            <h1 className="hp-title-main">
              <span className="hp-title-jp">日本語マスター</span>
              <span className="hp-title-en">Japanese Master</span>
            </h1>
            <p className="hp-slogan">
              <span className="hp-slogan-text">Chinh phục tiếng Nhật mỗi ngày</span>
              <span className="hp-slogan-jp">毎日、日本語を極める</span>
            </p>
          </div>

          {/* Stats cards */}
          <div className="hp-hero-stats">
            <div className="hp-hero-stat">
              <span className="hp-hero-stat-value">{totalCards.toLocaleString()}</span>
              <span className="hp-hero-stat-label">Từ vựng</span>
            </div>
            <div className="hp-hero-stat-divider" />
            <div className="hp-hero-stat">
              <span className="hp-hero-stat-value">{masteryPercent}%</span>
              <span className="hp-hero-stat-label">Tiến độ</span>
            </div>
            <div className="hp-hero-stat-divider" />
            <div className="hp-hero-stat">
              <span className="hp-hero-stat-value">Lv.{currentLevel}</span>
              <span className="hp-hero-stat-label">Cấp độ</span>
            </div>
          </div>
        </div>

        {/* Decorative accent */}
        <div className="hp-torii" />
      </div>

      {/* ===== MAIN CTA BUTTON ===== */}
      <section className="hp-cta-section">
        <button className="hp-cta" onClick={onStartStudy} disabled={totalCards === 0}>
          <div className="hp-cta-left">
            <div className="hp-cta-icon">
              <Sparkles size={24} />
            </div>
            <div className="hp-cta-info">
              <span className="hp-cta-title">学習開始</span>
              <span className="hp-cta-subtitle">Bắt đầu học ngay</span>
            </div>
          </div>
          <div className="hp-cta-right">
            {cardsDue > 0 && (
              <span className="hp-cta-badge">
                <Clock size={12} />
                {cardsDue} cần ôn
              </span>
            )}
            <ArrowRight size={20} />
          </div>
        </button>
      </section>

      {/* ===== CONTENT ZONE ===== */}
      <div className="hp-content">
        {/* Daily Words Task */}
        {dailyWords && dailyWords.enabled && dailyWords.todayWords.length > 0 && (
          <section className="hp-section">
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
          </section>
        )}

        {/* ===== ACTIVITIES GRID ===== */}
        <section className="hp-section">
          <div className="hp-section-header">
            <h2 className="hp-section-title">
              <span className="hp-section-jp">活動</span>
              Hoạt động
            </h2>
          </div>
          <div className="hp-activities">
            {ACTIVITIES.map(activity => {
              const Icon = activity.icon;
              return (
                <button
                  key={activity.id}
                  className="hp-activity"
                  onClick={() => onNavigate?.(activity.id)}
                >
                  <div className="hp-activity-icon" style={{ backgroundColor: activity.color }}>
                    <Icon size={22} />
                  </div>
                  <div className="hp-activity-text">
                    <span className="hp-activity-name">{activity.label}</span>
                    <span className="hp-activity-jp">{activity.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ===== JLPT LEVELS ===== */}
        <section className="hp-section">
          <div className="hp-section-header">
            <h2 className="hp-section-title">
              <span className="hp-section-jp">レベル</span>
              Cấp độ JLPT
            </h2>
          </div>
          <div className="hp-levels">
            {JLPT_LEVELS.map(level => {
              const count = statsByLevel[level];
              const lp = levelProgress.find(l => l.level === level);
              const memorized = lp?.memorized || 0;
              const percent = count > 0 ? Math.round((memorized / count) * 100) : 0;
              const color = LEVEL_COLORS[level];
              const isExpanded = expandedLevel === level;
              const isEmpty = count === 0;

              return (
                <div key={level} className={`hp-level ${isExpanded ? 'expanded' : ''} ${isEmpty ? 'empty' : ''}`}>
                  <button
                    className="hp-level-header"
                    onClick={() => !isEmpty && setExpandedLevel(isExpanded ? null : level)}
                    disabled={isEmpty}
                  >
                    <div className="hp-level-badge" style={{ backgroundColor: color }}>{level}</div>
                    <div className="hp-level-info">
                      <span className="hp-level-count">{count} từ</span>
                      <div className="hp-level-bar">
                        <div className="hp-level-fill" style={{ width: `${percent}%`, backgroundColor: color }} />
                      </div>
                    </div>
                    <span className="hp-level-percent" style={{ color }}>{percent}%</span>
                    {!isEmpty && <ChevronDown size={18} className={`hp-level-chevron ${isExpanded ? 'open' : ''}`} />}
                  </button>

                  {isExpanded && (
                    <div className="hp-level-content">
                      {getLessonsByLevel(level).map(lesson => {
                        const childLessons = getChildLessons(lesson.id);
                        const isParentExpanded = expandedParent === lesson.id;
                        const hasChildren = childLessons.length > 0;
                        const lessonCount = getCardCountByLessonRecursive(lesson.id);
                        const isLocked = lesson.isLocked && !canAccessLocked;

                        return (
                          <div key={lesson.id} className="hp-lesson-group">
                            <button
                              className={`hp-lesson ${isLocked ? 'locked' : ''}`}
                              onClick={() => {
                                if (isLocked) return;
                                if (hasChildren) setExpandedParent(isParentExpanded ? null : lesson.id);
                                else if (lessonCount > 0) onStudyByLevel(level);
                              }}
                              disabled={isLocked}
                            >
                              {hasChildren && (
                                <ChevronRight size={14} className={`hp-lesson-chevron ${isParentExpanded ? 'open' : ''}`} />
                              )}
                              <span className="hp-lesson-name">{lesson.name}</span>
                              {isLocked && <Lock size={12} />}
                              <span className="hp-lesson-count">{lessonCount}</span>
                            </button>

                            {isParentExpanded && hasChildren && (
                              <div className="hp-sub-lessons">
                                {childLessons.map(child => {
                                  const childLocked = child.isLocked && !canAccessLocked;
                                  const childCount = getCardCountByLesson(child.id);
                                  return (
                                    <button
                                      key={child.id}
                                      className={`hp-lesson sub ${childLocked ? 'locked' : ''}`}
                                      onClick={() => !childLocked && childCount > 0 && onStudyByLevel(level)}
                                      disabled={childLocked}
                                    >
                                      <span className="hp-lesson-name">{child.name}</span>
                                      {childLocked && <Lock size={12} />}
                                      <span className="hp-lesson-count">{childCount}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <button
                        className="hp-level-study"
                        onClick={() => onStudyByLevel(level)}
                        style={{ backgroundColor: color }}
                      >
                        <Play size={16} fill="white" />
                        Học tất cả {level}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
