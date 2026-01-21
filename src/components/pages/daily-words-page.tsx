// Daily Words Page - Flashcard-based daily learning
// Displays daily words in flashcard format with flip animations

import { useState, useCallback, useMemo } from 'react';
import type { Flashcard } from '../../types/flashcard';
import type { AppSettings } from '../../hooks/use-settings';
import { FlashcardItem } from '../flashcard/flashcard-item';
import {
  ArrowLeft,
  ArrowRight,
  Target,
  Trophy,
  Flame,
  Star,
  Zap,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Home,
  Volume2,
} from 'lucide-react';

// Streak tier info
function getStreakTier(streak: number): { label: string; color: string; icon: typeof Flame } {
  if (streak >= 30) return { label: 'Huyền thoại', color: '#9333ea', icon: Star };
  if (streak >= 14) return { label: 'Siêu sao', color: '#f59e0b', icon: Zap };
  if (streak >= 7) return { label: 'Xuất sắc', color: '#10b981', icon: Sparkles };
  if (streak >= 3) return { label: 'Tốt', color: '#3b82f6', icon: Flame };
  return { label: '', color: '#f97316', icon: Flame };
}

interface DailyWordsPageProps {
  todayWords: Flashcard[];
  progress: { completed: number; target: number; percent: number };
  isCompleted: boolean;
  streak: number;
  longestStreak: number;
  completedWordIds: Set<string>;
  onMarkLearned: (wordId: string) => void;
  onMarkAllLearned: () => void;
  onRefresh: () => void;
  onGoHome: () => void;
  settings: AppSettings;
  lessons?: Array<{ id: string; name: string }>;
}

export function DailyWordsPage({
  todayWords,
  progress,
  isCompleted,
  streak,
  longestStreak,
  completedWordIds,
  onMarkLearned,
  onMarkAllLearned,
  onRefresh,
  onGoHome,
  settings,
  lessons = [],
}: DailyWordsPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Current word
  const currentWord = todayWords[currentIndex];
  const isCurrentLearned = currentWord ? completedWordIds.has(currentWord.id) : false;

  // Get lesson name for current card
  const lessonName = useMemo(() => {
    if (!currentWord?.lessonId) return undefined;
    const lesson = lessons.find(l => l.id === currentWord.lessonId);
    return lesson?.name;
  }, [currentWord?.lessonId, lessons]);

  // Streak tier
  const streakTier = useMemo(() => getStreakTier(streak), [streak]);
  const StreakIcon = streakTier.icon;

  // Navigation
  const goNext = useCallback(() => {
    if (currentIndex < todayWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, todayWords.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  // Mark current word as learned
  const handleMarkLearned = useCallback(() => {
    if (currentWord && !isCurrentLearned) {
      onMarkLearned(currentWord.id);
      // Auto advance to next card after marking
      setTimeout(() => {
        if (currentIndex < todayWords.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setIsFlipped(false);
        }
      }, 300);
    }
  }, [currentWord, isCurrentLearned, onMarkLearned, currentIndex, todayWords.length]);

  // Speak current word
  const handleSpeak = useCallback(() => {
    if (currentWord) {
      const utterance = new SpeechSynthesisUtterance(currentWord.vocabulary);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  }, [currentWord]);

  // Completed state
  if (isCompleted) {
    return (
      <div className="daily-words-page completed">
        <div className="daily-words-page-complete">
          <div className="complete-trophy-large">
            <Trophy size={80} />
            <div className="trophy-glow-large" />
          </div>
          <h1>Xuất sắc!</h1>
          <p>Bạn đã hoàn thành nhiệm vụ học từ hôm nay</p>

          {streak > 0 && (
            <div className="streak-display-large" style={{ borderColor: streakTier.color }}>
              <div className="streak-icon-wrapper" style={{ background: streakTier.color }}>
                <StreakIcon size={32} />
              </div>
              <div className="streak-info-large">
                <span className="streak-count-large">{streak} ngày liên tiếp</span>
                {streakTier.label && (
                  <span className="streak-tier-large" style={{ color: streakTier.color }}>
                    {streakTier.label}
                  </span>
                )}
              </div>
              {longestStreak > streak && (
                <span className="streak-record-large">Kỷ lục: {longestStreak}</span>
              )}
            </div>
          )}

          <div className="complete-actions">
            <button className="btn btn-secondary" onClick={onRefresh}>
              <RefreshCw size={18} />
              Làm lại với từ mới
            </button>
            <button className="btn btn-primary" onClick={onGoHome}>
              <Home size={18} />
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No words available
  if (todayWords.length === 0) {
    return (
      <div className="daily-words-page empty">
        <div className="daily-words-page-empty">
          <Target size={64} />
          <h2>Chưa có từ nào</h2>
          <p>Hãy thêm flashcard để bắt đầu nhiệm vụ hôm nay</p>
          <button className="btn btn-primary" onClick={onGoHome}>
            <Home size={18} />
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-words-page">
      {/* Header */}
      <header className="daily-words-page-header">
        <button className="btn btn-back" onClick={onGoHome}>
          <ArrowLeft size={20} />
          <span>Trang chủ</span>
        </button>
        <div className="daily-words-page-title">
          <Target size={24} />
          <h1>Nhiệm vụ hôm nay</h1>
        </div>
        {streak > 0 && (
          <div className="daily-words-page-streak" style={{ background: streakTier.color }}>
            <StreakIcon size={16} />
            <span>{streak}</span>
          </div>
        )}
      </header>

      {/* Progress bar */}
      <div className="daily-words-page-progress">
        <div className="progress-info">
          <span className="progress-text">
            {progress.completed}/{progress.target} từ đã học
          </span>
          <span className="progress-percent">{progress.percent}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress.percent}%` }} />
        </div>
        <div className="progress-dots">
          {todayWords.map((word, idx) => (
            <button
              key={word.id}
              className={`progress-dot ${idx === currentIndex ? 'active' : ''} ${completedWordIds.has(word.id) ? 'completed' : ''}`}
              onClick={() => { setCurrentIndex(idx); setIsFlipped(false); }}
              title={word.vocabulary}
            />
          ))}
        </div>
      </div>

      {/* Flashcard */}
      <div className="daily-words-page-card">
        <FlashcardItem
          card={currentWord}
          isFlipped={isFlipped}
          onFlip={handleFlip}
          settings={settings}
          lessonName={lessonName}
        />

        {/* Learned badge */}
        {isCurrentLearned && (
          <div className="card-learned-badge">
            <CheckCircle2 size={20} />
            <span>Đã học</span>
          </div>
        )}
      </div>

      {/* Navigation & Actions */}
      <div className="daily-words-page-controls">
        <button
          className="btn btn-nav"
          onClick={goPrev}
          disabled={currentIndex === 0}
        >
          <ArrowLeft size={24} />
        </button>

        <div className="control-actions">
          <button className="btn btn-speak" onClick={handleSpeak} title="Nghe phát âm">
            <Volume2 size={20} />
          </button>

          {!isCurrentLearned ? (
            <button
              className="btn btn-mark-learned"
              onClick={handleMarkLearned}
            >
              <CheckCircle2 size={20} />
              <span>Đánh dấu đã học</span>
            </button>
          ) : (
            <span className="already-learned">
              <CheckCircle2 size={20} />
              Đã hoàn thành
            </span>
          )}
        </div>

        <button
          className="btn btn-nav"
          onClick={goNext}
          disabled={currentIndex === todayWords.length - 1}
        >
          <ArrowRight size={24} />
        </button>
      </div>

      {/* Quick actions */}
      <div className="daily-words-page-actions">
        <button className="btn btn-secondary" onClick={onRefresh}>
          <RefreshCw size={16} />
          Đổi từ khác
        </button>
        <button className="btn btn-primary" onClick={onMarkAllLearned}>
          <Sparkles size={16} />
          Hoàn thành tất cả
        </button>
      </div>

      {/* Card counter */}
      <div className="daily-words-page-counter">
        {currentIndex + 1} / {todayWords.length}
      </div>
    </div>
  );
}
