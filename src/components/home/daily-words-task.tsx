// Daily Words Task - Professional daily learning component
// Features: progress tracking, streak display, animations, motivational feedback

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Volume2,
  Trophy,
  Flame,
  Play,
  Sparkles,
  Target,
  Star,
  Zap,
} from 'lucide-react';
import type { Flashcard } from '../../types/flashcard';

// Motivational messages based on progress
const MOTIVATIONAL_MESSAGES = {
  start: ['Hãy bắt đầu nào!', 'Sẵn sàng học chưa?', 'Cùng chinh phục!'],
  progress25: ['Tốt lắm! Tiếp tục!', 'Bạn đang làm tốt!', 'Cố lên!'],
  progress50: ['Đã đi được nửa đường!', 'Quá nửa rồi!', 'Tuyệt vời!'],
  progress75: ['Sắp hoàn thành!', 'Chỉ còn một chút!', 'Gần đến rồi!'],
  complete: ['Xuất sắc!', 'Tuyệt vời!', 'Hoàn hảo!', 'Siêu đẳng!'],
};

// Get random message from category
function getMotivationalMessage(percent: number): string {
  let category: keyof typeof MOTIVATIONAL_MESSAGES;
  if (percent === 0) category = 'start';
  else if (percent < 50) category = 'progress25';
  else if (percent < 75) category = 'progress50';
  else if (percent < 100) category = 'progress75';
  else category = 'complete';

  const messages = MOTIVATIONAL_MESSAGES[category];
  return messages[Math.floor(Math.random() * messages.length)];
}

// Streak tier info
function getStreakTier(streak: number): { label: string; color: string; icon: typeof Flame } {
  if (streak >= 30) return { label: 'Huyền thoại', color: '#9333ea', icon: Star };
  if (streak >= 14) return { label: 'Siêu sao', color: '#f59e0b', icon: Zap };
  if (streak >= 7) return { label: 'Xuất sắc', color: '#10b981', icon: Sparkles };
  if (streak >= 3) return { label: 'Tốt', color: '#3b82f6', icon: Flame };
  return { label: '', color: '#f97316', icon: Flame };
}

interface DailyWordsTaskProps {
  todayWords: Flashcard[];
  progress: { completed: number; target: number; percent: number };
  isCompleted: boolean;
  streak: number;
  longestStreak?: number;
  onMarkLearned: (wordId: string) => void;
  onMarkAllLearned: () => void;
  onRefresh: () => void;
  onSpeak?: (text: string) => void;
  onStudyWord?: (word: Flashcard) => void;
  justCompleted?: boolean;
  completedWordIds?: Set<string>;
}

// Word item component - memoized for performance
const WordItem = memo(function WordItem({
  word,
  index,
  isLearned,
  isAnimating,
  onSpeak,
  onStudyWord,
  onMarkLearned,
}: {
  word: Flashcard;
  index: number;
  isLearned: boolean;
  isAnimating: boolean;
  onSpeak?: (text: string) => void;
  onStudyWord?: (word: Flashcard) => void;
  onMarkLearned: (wordId: string) => void;
}) {
  const handleSpeak = useCallback(() => {
    if (onSpeak) {
      const cleanText = word.vocabulary.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      onSpeak(cleanText);
    }
  }, [onSpeak, word.vocabulary]);

  return (
    <div
      className={`daily-word-item ${isLearned ? 'learned' : ''} ${isAnimating ? 'animating' : ''}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <span className="daily-word-index">
        {isLearned ? <CheckCircle2 size={14} /> : index + 1}
      </span>
      <div className="daily-word-content">
        <span className="daily-word-vocabulary">
          {word.vocabulary}
          {word.kanji && word.kanji !== word.vocabulary && (
            <span className="daily-word-kanji">({word.kanji})</span>
          )}
        </span>
        <span className="daily-word-meaning">{word.meaning}</span>
        {word.sinoVietnamese && (
          <span className="daily-word-sino">{word.sinoVietnamese}</span>
        )}
      </div>
      <div className="daily-word-actions">
        {onSpeak && (
          <button
            className="daily-word-btn speak"
            onClick={(e) => { e.stopPropagation(); handleSpeak(); }}
            title="Nghe phát âm"
            aria-label="Nghe phát âm"
          >
            <Volume2 size={16} />
          </button>
        )}
        {onStudyWord && (
          <button
            className="daily-word-btn study"
            onClick={(e) => { e.stopPropagation(); onStudyWord(word); }}
            title="Học từ này"
            aria-label="Học chi tiết"
          >
            <Play size={16} />
          </button>
        )}
        {!isLearned ? (
          <button
            className="daily-word-btn check"
            onClick={(e) => { e.stopPropagation(); onMarkLearned(word.id); }}
            title="Đánh dấu đã học"
            aria-label="Hoàn thành"
          >
            <CheckCircle2 size={16} />
          </button>
        ) : (
          <span className="daily-word-done" aria-label="Đã hoàn thành">
            <CheckCircle2 size={16} />
          </span>
        )}
      </div>
    </div>
  );
});

export function DailyWordsTask({
  todayWords,
  progress,
  isCompleted,
  streak,
  longestStreak = 0,
  onMarkLearned,
  onMarkAllLearned,
  onRefresh,
  onSpeak,
  onStudyWord,
  justCompleted = false,
  completedWordIds = new Set(),
}: DailyWordsTaskProps) {
  const [isExpanded, setIsExpanded] = useState(!isCompleted);
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Show confetti on completion
  useEffect(() => {
    if (justCompleted) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [justCompleted]);

  // Handle mark learned with animation
  const handleMarkLearned = useCallback((wordId: string) => {
    // Use completedWordIds from hook (persisted)
    if (completedWordIds.has(wordId)) return;

    setAnimatingId(wordId);

    // Delay to allow animation then call hook
    setTimeout(() => {
      onMarkLearned(wordId);
      setAnimatingId(null);
    }, 300);
  }, [completedWordIds, onMarkLearned]);

  // Motivational message
  const motivationalMessage = useMemo(
    () => getMotivationalMessage(progress.percent),
    [progress.percent]
  );

  // Streak tier info
  const streakTier = useMemo(() => getStreakTier(streak), [streak]);
  const StreakIcon = streakTier.icon;

  // Progress segments for visual indicator
  const progressSegments = useMemo(() => {
    return Array.from({ length: progress.target }, (_, i) => i < progress.completed);
  }, [progress.target, progress.completed]);

  return (
    <div className={`daily-words-task ${isCompleted ? 'completed' : ''} ${justCompleted ? 'just-completed' : ''}`}>
      {/* Confetti effect */}
      {showConfetti && (
        <div className="daily-words-confetti" aria-hidden="true">
          {Array.from({ length: 30 }).map((_, i) => (
            <span key={i} className="confetti-piece" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 0.5}s`,
              backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)],
            }} />
          ))}
        </div>
      )}

      {/* Header */}
      <button
        className="daily-words-header"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="daily-words-content"
      >
        <div className="daily-words-icon-wrapper">
          <div className={`daily-words-icon ${isCompleted ? 'completed' : ''}`}>
            {isCompleted ? <Trophy size={22} /> : <Target size={22} />}
          </div>
          {streak > 0 && (
            <div className="daily-words-streak-mini" style={{ background: streakTier.color }}>
              <StreakIcon size={10} />
              <span>{streak}</span>
            </div>
          )}
        </div>

        <div className="daily-words-info">
          <span className="daily-words-title">
            {isCompleted ? 'Hoàn thành!' : 'Nhiệm vụ hôm nay'}
          </span>
          <div className="daily-words-meta">
            <span className="daily-words-progress-text">
              {progress.completed}/{progress.target} từ
            </span>
            <span className="daily-words-motivation">{motivationalMessage}</span>
          </div>
        </div>

        <div className="daily-words-right">
          <div className="daily-words-percent" data-complete={isCompleted}>
            {progress.percent}%
          </div>
          <span className="daily-words-chevron" aria-hidden="true">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </span>
        </div>
      </button>

      {/* Progress bar with segments */}
      <div className="daily-words-progress" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="daily-words-progress-segments">
          {progressSegments.map((filled, i) => (
            <div key={i} className={`progress-segment ${filled ? 'filled' : ''}`} />
          ))}
        </div>
        <div className="daily-words-progress-fill" style={{ width: `${progress.percent}%` }} />
      </div>

      {/* Expanded content */}
      <div
        id="daily-words-content"
        className={`daily-words-content ${isExpanded ? 'expanded' : ''}`}
        aria-hidden={!isExpanded}
      >
        {isCompleted ? (
          <div className="daily-words-complete">
            <div className="complete-trophy">
              <Trophy size={56} />
              <div className="trophy-glow" />
            </div>
            <h3>Xuất sắc!</h3>
            <p>Bạn đã hoàn thành nhiệm vụ học từ hôm nay</p>

            {streak > 0 && (
              <div className="daily-words-streak-display" style={{ borderColor: streakTier.color }}>
                <div className="streak-icon-large" style={{ background: streakTier.color }}>
                  <StreakIcon size={24} />
                </div>
                <div className="streak-info">
                  <span className="streak-count">{streak} ngày liên tiếp</span>
                  {streakTier.label && (
                    <span className="streak-tier" style={{ color: streakTier.color }}>
                      {streakTier.label}
                    </span>
                  )}
                </div>
                {longestStreak > streak && (
                  <span className="streak-record">Kỷ lục: {longestStreak}</span>
                )}
              </div>
            )}

            <button
              className="daily-words-action review"
              onClick={() => setIsExpanded(false)}
            >
              <BookOpen size={16} />
              <span>Thu gọn</span>
            </button>
          </div>
        ) : (
          <>
            {/* Words list */}
            <div className="daily-words-list" role="list">
              {todayWords.map((word, index) => {
                const isLearned = completedWordIds.has(word.id);
                const isAnimating = animatingId === word.id;

                return (
                  <WordItem
                    key={word.id}
                    word={word}
                    index={index}
                    isLearned={isLearned}
                    isAnimating={isAnimating}
                    onSpeak={onSpeak}
                    onStudyWord={onStudyWord}
                    onMarkLearned={handleMarkLearned}
                  />
                );
              })}
            </div>

            {/* Actions */}
            <div className="daily-words-actions">
              <button
                className="daily-words-action secondary"
                onClick={onRefresh}
                title="Đổi từ khác"
              >
                <RefreshCw size={16} />
                <span>Đổi từ</span>
              </button>
              <button
                className="daily-words-action primary"
                onClick={onMarkAllLearned}
              >
                <Sparkles size={16} />
                <span>Hoàn thành tất cả</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
