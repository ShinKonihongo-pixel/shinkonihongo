// Hook for managing study session with spaced repetition

import { useState, useCallback, useMemo } from 'react';
import type { Flashcard, StudyStats, JLPTLevel, MemorizationStatus, DifficultyLevel } from '../types/flashcard';
import { getCardsForReview } from '../lib/spaced-repetition';

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface UseStudySessionProps {
  cards: Flashcard[];
  updateCard: (id: string, data: Partial<Flashcard>) => void;
  filterLevel?: JLPTLevel | 'all';
  filterMemorization?: MemorizationStatus | 'all';
  filterDifficulty?: DifficultyLevel | 'all';
  autoAdvance?: boolean;
  clicksToAdvance?: number;
}

export function useStudySession({
  cards,
  updateCard,
  filterLevel = 'all',
  filterMemorization = 'all',
  filterDifficulty = 'all',
  autoAdvance = true,
  clicksToAdvance = 3,
}: UseStudySessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledOrder, setShuffledOrder] = useState<string[]>([]);
  const [clickCount, setClickCount] = useState(0);
  const [stats, setStats] = useState<StudyStats>({
    totalCards: 0,
    cardsStudied: 0,
    correctCount: 0,
    againCount: 0,
  });
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  // Get cards due for review, filtered by level, memorization status, and difficulty
  const filteredDueCards = useMemo(() => {
    let filtered = filterLevel === 'all'
      ? cards
      : cards.filter(c => c.jlptLevel === filterLevel);

    // Filter by memorization status
    if (filterMemorization !== 'all') {
      filtered = filtered.filter(c => c.memorizationStatus === filterMemorization);
    }

    // Filter by difficulty level
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(c => c.difficultyLevel === filterDifficulty);
    }

    return getCardsForReview(filtered);
  }, [cards, filterLevel, filterMemorization, filterDifficulty]);

  // Apply shuffle order if active
  const dueCards = useMemo(() => {
    if (!isShuffled || shuffledOrder.length === 0) {
      return filteredDueCards;
    }
    // Reorder based on shuffled IDs
    const cardMap = new Map(filteredDueCards.map(c => [c.id, c]));
    return shuffledOrder
      .map(id => cardMap.get(id))
      .filter((c): c is Flashcard => c !== undefined);
  }, [filteredDueCards, isShuffled, shuffledOrder]);

  // Current card being studied
  const currentCard = dueCards[currentIndex];

  // Start/reset session
  const startSession = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsSessionComplete(false);
    setClickCount(0);
    setStats({
      totalCards: dueCards.length,
      cardsStudied: 0,
      correctCount: 0,
      againCount: 0,
    });
  }, [dueCards.length]);

  // Shuffle cards randomly
  const shuffleCards = useCallback(() => {
    const ids = filteredDueCards.map(c => c.id);
    setShuffledOrder(shuffleArray(ids));
    setIsShuffled(true);
    setCurrentIndex(0);
    setIsFlipped(false);
    setClickCount(0);
  }, [filteredDueCards]);

  // Reset to original order
  const resetOrder = useCallback(() => {
    setIsShuffled(false);
    setShuffledOrder([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setClickCount(0);
  }, []);

  // Move to next card helper
  const moveToNextCard = useCallback(() => {
    if (currentIndex < dueCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setClickCount(0);
    } else {
      setIsSessionComplete(true);
    }
  }, [currentIndex, dueCards.length]);

  // Go to next card (manual navigation)
  const goToNext = useCallback(() => {
    if (currentIndex < dueCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setClickCount(0);
    }
  }, [currentIndex, dueCards.length]);

  // Go to previous card
  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
      setClickCount(0);
    }
  }, [currentIndex]);

  // Flip card - optionally auto advance after N clicks
  const flipCard = useCallback(() => {
    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);

    // Auto advance if enabled and reached click threshold
    if (autoAdvance && newClickCount >= clicksToAdvance) {
      moveToNextCard();
      return;
    }

    setIsFlipped(prev => !prev);
  }, [clickCount, moveToNextCard, autoAdvance, clicksToAdvance]);

  // Set memorization status for current card
  const setMemorizationStatus = useCallback((status: MemorizationStatus) => {
    if (!currentCard) return;

    updateCard(currentCard.id, { memorizationStatus: status });

    // Update stats
    setStats(prev => ({
      ...prev,
      cardsStudied: prev.cardsStudied + 1,
      correctCount: prev.correctCount + (status === 'memorized' ? 1 : 0),
      againCount: prev.againCount + (status === 'not_memorized' ? 1 : 0),
    }));
  }, [currentCard, updateCard]);

  // Set difficulty level for current card (persisted to DB, preserves original)
  const setDifficultyLevel = useCallback((level: DifficultyLevel) => {
    if (!currentCard) return;
    const update: Partial<Flashcard> = { difficultyLevel: level };
    // Save original difficulty on first change (so reset can restore it)
    if (!currentCard.originalDifficultyLevel) {
      update.originalDifficultyLevel = currentCard.difficultyLevel;
    }
    updateCard(currentCard.id, update);
  }, [currentCard, updateCard]);

  // Reset everything: unshuffle + reset ALL cards' difficulty & memorization
  const resetAll = useCallback(() => {
    // Reset shuffle order
    setIsShuffled(false);
    setShuffledOrder([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setClickCount(0);
    // Reset all cards back to admin defaults
    for (const card of dueCards) {
      const needsReset = card.memorizationStatus !== 'unset' ||
        (card.originalDifficultyLevel && card.difficultyLevel !== card.originalDifficultyLevel);
      if (needsReset) {
        updateCard(card.id, {
          difficultyLevel: card.originalDifficultyLevel || 'unset',
          memorizationStatus: 'unset',
        });
      }
    }
  }, [dueCards, updateCard]);

  return {
    currentCard,
    currentIndex,
    totalDueCards: dueCards.length,
    isFlipped,
    isSessionComplete,
    stats,
    startSession,
    flipCard,
    setMemorizationStatus,
    setDifficultyLevel,
    resetAll,
    shuffleCards,
    resetOrder,
    isShuffled,
    clickCount,
    goToNext,
    goToPrev,
    canGoNext: currentIndex < dueCards.length - 1,
    canGoPrev: currentIndex > 0,
    hasCardsToStudy: dueCards.length > 0,
  };
}
