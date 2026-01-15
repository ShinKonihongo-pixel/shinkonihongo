// Study session page

import { useState, useEffect, useRef } from 'react';
import type { Flashcard, JLPTLevel, MemorizationStatus, DifficultyLevel } from '../../types/flashcard';
import type { AppSettings } from '../../hooks/use-settings';
import type { StudySession as StudySessionType } from '../../types/user';
import { useStudySession } from '../../hooks/use-study-session';
import { StudySession } from '../study/study-session';
import { StudyResult } from '../study/study-result';

interface StudyPageProps {
  cards: Flashcard[];
  updateCard: (id: string, data: Partial<Flashcard>) => void;
  onGoHome: () => void;
  initialFilterLevel?: JLPTLevel | 'all';
  settings: AppSettings;
  onSaveStudySession?: (data: Omit<StudySessionType, 'id' | 'userId'>) => void;
}

export function StudyPage({ cards, updateCard, onGoHome, initialFilterLevel = 'all', settings, onSaveStudySession }: StudyPageProps) {
  const [filterLevel, setFilterLevel] = useState<JLPTLevel | 'all'>(initialFilterLevel);
  const [filterMemorization, setFilterMemorization] = useState<MemorizationStatus | 'all'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const sessionStartTime = useRef<number>(Date.now());
  const sessionSaved = useRef<boolean>(false);

  const {
    currentCard,
    currentIndex,
    totalDueCards,
    isFlipped,
    isSessionComplete,
    stats,
    startSession,
    flipCard,
    setMemorizationStatus,
    setDifficultyLevel,
    shuffleCards,
    resetOrder,
    isShuffled,
    clickCount,
    goToNext,
    goToPrev,
    canGoNext,
    canGoPrev,
  } = useStudySession({
    cards,
    updateCard,
    filterLevel,
    filterMemorization,
    filterDifficulty,
    autoAdvance: settings.autoAdvanceOnThirdClick,
    clicksToAdvance: settings.clicksToAdvance,
  });

  // Start session on mount and when filter changes
  useEffect(() => {
    sessionStartTime.current = Date.now();
    sessionSaved.current = false;
    startSession();
  }, [startSession]);

  // Save session when complete
  useEffect(() => {
    if (isSessionComplete && !sessionSaved.current && onSaveStudySession && stats.cardsStudied > 0) {
      sessionSaved.current = true;
      const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      onSaveStudySession({
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        cardsStudied: stats.cardsStudied,
        correctCount: stats.correctCount,
        duration,
        lessonIds: [], // Could track which lessons were studied
      });
    }
  }, [isSessionComplete, onSaveStudySession, stats]);

  if (isSessionComplete) {
    return (
      <StudyResult
        stats={stats}
        onRestart={() => {
          sessionStartTime.current = Date.now();
          sessionSaved.current = false;
          startSession();
        }}
        onGoHome={onGoHome}
      />
    );
  }

  return (
    <StudySession
      currentCard={currentCard}
      currentIndex={currentIndex}
      totalCards={totalDueCards}
      isFlipped={isFlipped}
      onFlip={flipCard}
      onSetMemorization={setMemorizationStatus}
      onSetDifficulty={setDifficultyLevel}
      filterLevel={filterLevel}
      onFilterChange={setFilterLevel}
      filterMemorization={filterMemorization}
      onFilterMemorizationChange={setFilterMemorization}
      filterDifficulty={filterDifficulty}
      onFilterDifficultyChange={setFilterDifficulty}
      onShuffle={shuffleCards}
      onResetOrder={resetOrder}
      isShuffled={isShuffled}
      clickCount={clickCount}
      onNext={goToNext}
      onPrev={goToPrev}
      canGoNext={canGoNext}
      canGoPrev={canGoPrev}
      settings={settings}
    />
  );
}
