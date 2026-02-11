// Daily Vocabulary Learning Modal - Card-by-card flashcard experience
// Features: flip animation, audio, examples, progress tracking, streak, completion celebration

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  BookOpen,
  CheckCircle2,
  RefreshCw,
  Volume2,
  Trophy,
  Flame,
  Sparkles,
  Target,
  Star,
  Zap,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  GraduationCap,
  Languages,
} from 'lucide-react';
import type { Flashcard } from '../../types/flashcard';

// Motivational messages based on progress
const MOTIVATIONAL_MESSAGES = {
  start: ['Hãy bắt đầu nào! 🚀', 'Sẵn sàng chưa? 💪', 'Cùng chinh phục! ⚡'],
  progress25: ['Tốt lắm! Tiếp tục nào!', 'Bạn đang làm rất tốt!', 'Cố lên, đừng dừng lại!'],
  progress50: ['Đã đi được nửa đường rồi!', 'Quá nửa rồi, tuyệt vời!', 'Tiến bộ rõ rệt!'],
  progress75: ['Sắp hoàn thành rồi!', 'Chỉ còn một chút nữa thôi!', 'Gần đến đích rồi!'],
  complete: ['Xuất sắc! 🏆', 'Tuyệt vời! 🌟', 'Hoàn hảo! ✨', 'Siêu đẳng! 🔥'],
};

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

function getStreakTier(streak: number): { label: string; color: string; icon: typeof Flame } {
  if (streak >= 30) return { label: 'Huyền thoại', color: '#9333ea', icon: Star };
  if (streak >= 14) return { label: 'Siêu sao', color: '#f59e0b', icon: Zap };
  if (streak >= 7) return { label: 'Xuất sắc', color: '#10b981', icon: Sparkles };
  if (streak >= 3) return { label: 'Tốt', color: '#3b82f6', icon: Flame };
  return { label: '', color: '#f97316', icon: Flame };
}

export interface DailyWordsTaskProps {
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
  isModalOpen?: boolean;
  onOpenModal?: () => void;
  onCloseModal?: () => void;
}

// Single flashcard display - memoized
const FlashcardCard = memo(function FlashcardCard({
  word,
  isFlipped,
  isLearned,
  onFlip,
  onSpeak,
  onMarkLearned,
}: {
  word: Flashcard;
  isFlipped: boolean;
  isLearned: boolean;
  onFlip: () => void;
  onSpeak?: (text: string) => void;
  onMarkLearned: (wordId: string) => void;
}) {
  return (
    <div className={`dw-card ${isFlipped ? 'flipped' : ''} ${isLearned ? 'learned' : ''}`}>
      <div className="dw-card-inner" onClick={onFlip}>
        {/* Front - Japanese */}
        <div className="dw-card-front">
          <div className="dw-card-level-badge">{word.jlptLevel}</div>
          <div className="dw-card-main-text">{word.vocabulary}</div>
          {word.kanji && word.kanji !== word.vocabulary && (
            <div className="dw-card-kanji">{word.kanji}</div>
          )}
          <div className="dw-card-hint">Nhấn để xem nghĩa</div>
        </div>

        {/* Back - Vietnamese + details */}
        <div className="dw-card-back">
          <div className="dw-card-vocab-small">{word.vocabulary}</div>
          <div className="dw-card-meaning">{word.meaning}</div>
          {word.sinoVietnamese && (
            <div className="dw-card-sino">
              <Languages size={14} />
              <span>Hán Việt: {word.sinoVietnamese}</span>
            </div>
          )}
          {word.examples && word.examples.length > 0 && (
            <div className="dw-card-examples">
              <div className="dw-card-examples-title">
                <GraduationCap size={14} />
                <span>Ví dụ</span>
              </div>
              {word.examples.slice(0, 2).map((ex, i) => (
                <div key={i} className="dw-card-example">{ex}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card action buttons - outside the flip area */}
      <div className="dw-card-actions">
        {onSpeak && (
          <button
            className="dw-action-btn speak"
            onClick={(e) => {
              e.stopPropagation();
              const cleanText = word.vocabulary.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
              onSpeak(cleanText);
            }}
            title="Nghe phát âm"
          >
            <Volume2 size={18} />
          </button>
        )}
        <button
          className="dw-action-btn flip"
          onClick={(e) => { e.stopPropagation(); onFlip(); }}
          title="Lật thẻ"
        >
          <RotateCcw size={18} />
        </button>
        <button
          className={`dw-action-btn check ${isLearned ? 'checked' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (!isLearned) onMarkLearned(word.id);
          }}
          title={isLearned ? 'Đã thuộc' : 'Đánh dấu đã thuộc'}
        >
          <CheckCircle2 size={18} />
          <span>{isLearned ? 'Đã thuộc' : 'Đã thuộc?'}</span>
        </button>
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
  justCompleted = false,
  completedWordIds = new Set(),
  isModalOpen: externalModalOpen,
  onOpenModal,
  onCloseModal,
}: DailyWordsTaskProps) {
  // Use parent-controlled modal state if provided, otherwise fallback to internal
  const [internalOpen, setInternalOpen] = useState(false);
  const isModalOpen = externalModalOpen ?? internalOpen;
  const openModal = onOpenModal ?? (() => setInternalOpen(true));
  const closeModal = onCloseModal ?? (() => setInternalOpen(false));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Show confetti on completion
  useEffect(() => {
    if (justCompleted && isModalOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [justCompleted, isModalOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) closeModal();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isModalOpen]);

  // Lock body scroll when modal open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isModalOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrev();
      else if (e.key === 'ArrowRight') goToNext();
      else if (e.key === ' ') { e.preventDefault(); setIsFlipped(f => !f); }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isModalOpen, currentIndex, todayWords.length]);

  const goToNext = useCallback(() => {
    if (currentIndex < todayWords.length - 1) {
      setCurrentIndex(i => i + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, todayWords.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleMarkLearned = useCallback((wordId: string) => {
    if (!completedWordIds.has(wordId)) {
      onMarkLearned(wordId);
    }
  }, [completedWordIds, onMarkLearned]);

  const handleOpenModal = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    openModal();
  }, []);

  const motivationalMessage = useMemo(
    () => getMotivationalMessage(progress.percent),
    [progress.percent]
  );

  const streakTier = useMemo(() => getStreakTier(streak), [streak]);
  const StreakIcon = streakTier.icon;

  const currentWord = todayWords[currentIndex];
  const isCurrentLearned = currentWord ? completedWordIds.has(currentWord.id) : false;

  return (
    <>
      {/* Trigger Button */}
      <button className={`dw-trigger ${isCompleted ? 'completed' : ''}`} onClick={handleOpenModal}>
        <div className="dw-trigger-icon">
          {isCompleted ? <Trophy size={22} /> : <BookOpen size={22} />}
        </div>
        <div className="dw-trigger-info">
          <span className="dw-trigger-title">
            {isCompleted ? 'Hoàn thành hôm nay!' : 'Học từ vựng hôm nay'}
          </span>
          <span className="dw-trigger-sub">
            {progress.completed}/{progress.target} từ đã thuộc
          </span>
        </div>
        <div className="dw-trigger-right">
          {streak > 0 && (
            <span className="dw-trigger-streak" style={{ color: streakTier.color }}>
              <StreakIcon size={14} />
              {streak}
            </span>
          )}
          <div className="dw-trigger-progress-ring">
            <svg viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.5" fill="none"
                stroke={isCompleted ? '#10b981' : '#6366f1'}
                strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${progress.percent * 0.975} 97.5`}
                transform="rotate(-90 18 18)"
              />
            </svg>
            <span className="dw-trigger-percent">{progress.percent}%</span>
          </div>
        </div>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="dw-modal-overlay" onClick={() => closeModal()}>
          <div className="dw-modal" onClick={(e) => e.stopPropagation()}>
            {/* Confetti */}
            {showConfetti && (
              <div className="dw-confetti" aria-hidden="true">
                {Array.from({ length: 24 }).map((_, i) => (
                  <span key={i} className="dw-confetti-piece" style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 0.5}s`,
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)],
                  }} />
                ))}
              </div>
            )}

            {/* Header */}
            <div className="dw-modal-header">
              <div className="dw-modal-header-left">
                <div className={`dw-modal-icon ${isCompleted ? 'completed' : ''}`}>
                  {isCompleted ? <Trophy size={20} /> : <Target size={20} />}
                </div>
                <div>
                  <h3 className="dw-modal-title">
                    {isCompleted ? 'Hoàn thành!' : 'Từ vựng hôm nay'}
                  </h3>
                  <span className="dw-modal-subtitle">{motivationalMessage}</span>
                </div>
              </div>
              <div className="dw-modal-header-right">
                {streak > 0 && (
                  <span className="dw-modal-streak" style={{ background: streakTier.color }}>
                    <StreakIcon size={12} />
                    {streak} ngày
                  </span>
                )}
                <button className="dw-modal-close" onClick={() => closeModal()}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="dw-modal-progress">
              <div className="dw-progress-bar">
                <div
                  className={`dw-progress-fill ${isCompleted ? 'completed' : ''}`}
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <div className="dw-progress-info">
                <span>{progress.completed}/{progress.target} từ đã thuộc</span>
                <span className="dw-progress-percent">{progress.percent}%</span>
              </div>
            </div>

            {/* Content */}
            <div className="dw-modal-content">
              {isCompleted ? (
                <div className="dw-complete">
                  <div className="dw-complete-trophy">
                    <Trophy size={56} />
                    <div className="dw-complete-glow" />
                  </div>
                  <h4>Xuất sắc!</h4>
                  <p>Bạn đã hoàn thành tất cả từ vựng hôm nay</p>

                  {streak > 0 && (
                    <div className="dw-complete-streak" style={{ borderColor: `${streakTier.color}30` }}>
                      <div className="dw-complete-streak-icon" style={{ background: streakTier.color }}>
                        <StreakIcon size={18} />
                      </div>
                      <div className="dw-complete-streak-info">
                        <span className="dw-complete-streak-count">{streak} ngày liên tiếp</span>
                        {streakTier.label && (
                          <span className="dw-complete-streak-tier" style={{ color: streakTier.color }}>
                            {streakTier.label}
                          </span>
                        )}
                      </div>
                      {longestStreak > streak && (
                        <span className="dw-complete-streak-record">Kỷ lục: {longestStreak}</span>
                      )}
                    </div>
                  )}

                  <div className="dw-complete-actions">
                    <button className="dw-btn secondary" onClick={onRefresh}>
                      <RefreshCw size={16} />
                      <span>Học thêm từ mới</span>
                    </button>
                    <button className="dw-btn primary" onClick={() => closeModal()}>
                      <CheckCircle2 size={16} />
                      <span>Xong</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Card counter */}
                  <div className="dw-card-counter">
                    <span>Từ {currentIndex + 1} / {todayWords.length}</span>
                  </div>

                  {/* Flashcard */}
                  {currentWord && (
                    <FlashcardCard
                      key={currentWord.id}
                      word={currentWord}
                      isFlipped={isFlipped}
                      isLearned={isCurrentLearned}
                      onFlip={() => setIsFlipped(f => !f)}
                      onSpeak={onSpeak}
                      onMarkLearned={handleMarkLearned}
                    />
                  )}

                  {/* Navigation */}
                  <div className="dw-navigation">
                    <button
                      className="dw-nav-btn"
                      onClick={goToPrev}
                      disabled={currentIndex === 0}
                    >
                      <ChevronLeft size={20} />
                    </button>

                    {/* Progress dots */}
                    <div className="dw-dots">
                      {todayWords.map((w, i) => (
                        <button
                          key={w.id}
                          className={`dw-dot ${i === currentIndex ? 'active' : ''} ${completedWordIds.has(w.id) ? 'learned' : ''}`}
                          onClick={() => { setCurrentIndex(i); setIsFlipped(false); }}
                        />
                      ))}
                    </div>

                    <button
                      className="dw-nav-btn"
                      onClick={goToNext}
                      disabled={currentIndex === todayWords.length - 1}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>

                  {/* Footer actions */}
                  <div className="dw-modal-footer">
                    <button className="dw-btn secondary" onClick={onRefresh}>
                      <RefreshCw size={14} />
                      <span>Đổi từ</span>
                    </button>
                    <button className="dw-btn primary" onClick={onMarkAllLearned}>
                      <Sparkles size={14} />
                      <span>Thuộc hết</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
