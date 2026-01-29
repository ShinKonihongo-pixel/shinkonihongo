// Study session page - Vocabulary flashcard study with level/lesson selection

import { useState, useEffect, useRef, useMemo } from 'react';
import type { Flashcard, JLPTLevel, MemorizationStatus, DifficultyLevel, Lesson } from '../../types/flashcard';
import type { AppSettings } from '../../hooks/use-settings';
import type { StudySession as StudySessionType } from '../../types/user';
import { useStudySession } from '../../hooks/use-study-session';
import { StudySession } from '../study/study-session';
import { StudyResult } from '../study/study-result';
import { LevelLessonSelector } from '../study/level-lesson-selector';

interface StudyPageProps {
  cards: Flashcard[];
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
  updateCard: (id: string, data: Partial<Flashcard>) => void;
  onGoHome: () => void;
  settings: AppSettings;
  onSaveStudySession?: (data: Omit<StudySessionType, 'id' | 'userId'>) => void;
}

type ViewMode = 'select' | 'study' | 'result';

export function StudyPage({
  cards,
  getLessonsByLevel,
  getChildLessons,
  updateCard,
  onGoHome,
  settings,
  onSaveStudySession,
}: StudyPageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('select');
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel>('N5');
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [filterMemorization, setFilterMemorization] = useState<MemorizationStatus | 'all'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const sessionStartTime = useRef<number>(Date.now());
  const sessionSaved = useRef<boolean>(false);

  // Filter cards based on selected lessons
  const filteredCards = useMemo(() => {
    if (selectedLessonIds.length === 0) return [];

    // Get all child lesson IDs for each selected lesson
    const allLessonIds = new Set<string>();
    selectedLessonIds.forEach(lessonId => {
      allLessonIds.add(lessonId);
      const children = getChildLessons(lessonId);
      children.forEach(child => allLessonIds.add(child.id));
    });

    return cards.filter(card => allLessonIds.has(card.lessonId));
  }, [cards, selectedLessonIds, getChildLessons]);

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
    cards: filteredCards,
    updateCard,
    filterLevel: selectedLevel, // Pass level for reference but cards already filtered
    filterMemorization,
    filterDifficulty,
    autoAdvance: settings.autoAdvanceOnThirdClick,
    clicksToAdvance: settings.clicksToAdvance,
  });

  // Start session when entering study mode
  useEffect(() => {
    if (viewMode === 'study') {
      sessionStartTime.current = Date.now();
      sessionSaved.current = false;
      startSession();
    }
  }, [viewMode, startSession]);

  // Save session when complete
  useEffect(() => {
    if (isSessionComplete && !sessionSaved.current && onSaveStudySession && stats.cardsStudied > 0) {
      sessionSaved.current = true;
      const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      onSaveStudySession({
        date: new Date().toISOString().split('T')[0],
        cardsStudied: stats.cardsStudied,
        correctCount: stats.correctCount,
        duration,
        lessonIds: selectedLessonIds,
      });
    }
  }, [isSessionComplete, onSaveStudySession, stats, selectedLessonIds]);

  // Handle transition to result when session complete
  useEffect(() => {
    if (isSessionComplete && viewMode === 'study') {
      setViewMode('result');
    }
  }, [isSessionComplete, viewMode]);

  // Handle start from level selector
  const handleStart = (lessonIds: string[], level: JLPTLevel) => {
    setSelectedLessonIds(lessonIds);
    setSelectedLevel(level);
    setViewMode('study');
  };

  // Handle restart
  const handleRestart = () => {
    sessionStartTime.current = Date.now();
    sessionSaved.current = false;
    startSession();
    setViewMode('study');
  };

  // Handle back to selection
  const handleBackToSelect = () => {
    setViewMode('select');
    setSelectedLessonIds([]);
  };

  // Level selection screen
  if (viewMode === 'select') {
    return (
      <LevelLessonSelector
        type="vocabulary"
        cards={cards}
        getLessonsByLevel={getLessonsByLevel}
        getChildLessons={getChildLessons}
        onStart={handleStart}
        onGoHome={onGoHome}
      />
    );
  }

  // Result screen
  if (viewMode === 'result') {
    return (
      <StudyResult
        stats={stats}
        onRestart={handleRestart}
        onGoHome={handleBackToSelect}
      />
    );
  }

  // Study session
  return (
    <StudySession
      currentCard={currentCard}
      currentIndex={currentIndex}
      totalCards={totalDueCards}
      isFlipped={isFlipped}
      onFlip={flipCard}
      onSetMemorization={setMemorizationStatus}
      onSetDifficulty={setDifficultyLevel}
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
      onBack={handleBackToSelect}
      selectedLevel={selectedLevel}
    />
  );
}
