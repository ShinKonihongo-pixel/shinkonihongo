// Hook for managing study state
import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import type { GrammarCard, JLPTLevel, GrammarLesson } from '../../../types/flashcard';
import type { StudyMode } from '../../study/level-lesson-selector/types';
import type { GrammarStudySettings, ViewMode, MemorizationFilter } from './types';
import { DEFAULT_SETTINGS } from './types';

interface UseStudyStateProps {
  grammarCards: GrammarCard[];
  getChildLessons: (parentId: string) => GrammarLesson[];
}

export function useStudyState({ grammarCards, getChildLessons }: UseStudyStateProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('select');
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel>('N5');
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [memorizationFilter, setMemorizationFilter] = useState<MemorizationFilter>('all');

  const [studySettings, setStudySettings] = useState<GrammarStudySettings>(() => {
    const saved = localStorage.getItem('grammarStudySettings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem('grammarStudySettings', JSON.stringify(studySettings));
  }, [studySettings]);

  const lessonFilteredCards = useMemo(() => {
    if (selectedLessonIds.length === 0) return [];

    const allLessonIds = new Set<string>();
    selectedLessonIds.forEach(lessonId => {
      allLessonIds.add(lessonId);
      const children = getChildLessons(lessonId);
      children.forEach(child => allLessonIds.add(child.id));
    });

    return grammarCards.filter(card => allLessonIds.has(card.lessonId));
  }, [grammarCards, selectedLessonIds, getChildLessons]);

  const filteredCards = useMemo(() => {
    if (memorizationFilter === 'all') return lessonFilteredCards;
    if (memorizationFilter === 'memorized') {
      return lessonFilteredCards.filter(card => card.memorizationStatus === 'memorized');
    }
    return lessonFilteredCards.filter(card => card.memorizationStatus !== 'memorized');
  }, [lessonFilteredCards, memorizationFilter]);

  const filteredCardsLengthRef = useRef(filteredCards.length);

  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    if (filteredCardsLengthRef.current !== filteredCards.length) {
      filteredCardsLengthRef.current = filteredCards.length;
      setShuffledIndices(filteredCards.map((_, i) => i));
      setCurrentIndex(0);
    }
  }, [filteredCards]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const displayCards = useMemo(() => {
    if (isShuffled && shuffledIndices.length === filteredCards.length) {
      return shuffledIndices.map(i => filteredCards[i]);
    }
    return filteredCards;
  }, [filteredCards, isShuffled, shuffledIndices]);

  const handleShuffle = () => {
    if (isShuffled) {
      setShuffledIndices(filteredCards.map((_, i) => i));
      setIsShuffled(false);
    } else {
      const indices = filteredCards.map((_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setShuffledIndices(indices);
      setIsShuffled(true);
    }
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleNext = useCallback(() => {
    if (currentIndex < displayCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, displayCards.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleStart = (lessonIds: string[], level: JLPTLevel, _mode: StudyMode) => {
    setSelectedLessonIds(lessonIds);
    setSelectedLevel(level);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsShuffled(false);
    setMemorizationFilter('all');
    setViewMode('study');
  };

  const handleBackToSelect = () => {
    setViewMode('select');
    setSelectedLessonIds([]);
  };

  return {
    viewMode,
    selectedLevel,
    selectedLessonIds,
    memorizationFilter,
    setMemorizationFilter,
    studySettings,
    setStudySettings,
    showSettingsModal,
    setShowSettingsModal,
    currentIndex,
    setCurrentIndex,
    isFlipped,
    setIsFlipped,
    isShuffled,
    displayCards,
    touchStartX,
    touchStartY,
    handleShuffle,
    handleNext,
    handlePrev,
    handleStart,
    handleBackToSelect,
  };
}
