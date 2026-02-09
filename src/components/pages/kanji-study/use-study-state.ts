// Study state management hook for kanji study
import { useState, useCallback, useMemo, useEffect } from 'react';
import type { KanjiCard, KanjiLesson } from '../../../types/kanji';
import type { JLPTLevel } from '../../../types/flashcard';
import type { KanjiStudySettings, MemorizationFilter } from './types';
import { DEFAULT_KANJI_SETTINGS } from './types';

const STORAGE_KEY = 'kanji-study-settings';

function loadSettings(): KanjiStudySettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_KANJI_SETTINGS, ...JSON.parse(saved) };
  } catch { /* ignore parse errors */ }
  return DEFAULT_KANJI_SETTINGS;
}

export function useStudyState(
  kanjiCards: KanjiCard[],
  _lessons: KanjiLesson[],
  _getLessonsByLevel: (level: JLPTLevel) => KanjiLesson[],
  getChildLessons: (parentId: string) => KanjiLesson[],
) {
  const [viewMode, setViewMode] = useState<'select' | 'study'>('select');
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel>('N5');
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledCards, setShuffledCards] = useState<KanjiCard[]>([]);
  const [memorizationFilter, setMemorizationFilter] = useState<MemorizationFilter>('all');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [studySettings, setStudySettings] = useState<KanjiStudySettings>(loadSettings);
  // Removed touchStartX and touchStartY - now managed locally in card components

  // Save settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(studySettings));
  }, [studySettings]);

  // Get all lesson IDs including children
  const allSelectedLessonIds = useMemo(() => {
    const ids = new Set<string>();
    selectedLessonIds.forEach(id => {
      ids.add(id);
      const children = getChildLessons(id);
      children.forEach(child => ids.add(child.id));
    });
    return Array.from(ids);
  }, [selectedLessonIds, getChildLessons]);

  // Filter cards
  const filteredCards = useMemo(() => {
    let cards = kanjiCards.filter(
      c => c.jlptLevel === selectedLevel && allSelectedLessonIds.includes(c.lessonId)
    );
    if (memorizationFilter === 'memorized') {
      cards = cards.filter(c => c.memorizationStatus === 'memorized');
    } else if (memorizationFilter === 'learning') {
      cards = cards.filter(c => c.memorizationStatus !== 'memorized');
    }
    return cards;
  }, [kanjiCards, selectedLevel, allSelectedLessonIds, memorizationFilter]);

  const displayCards = isShuffled ? shuffledCards : filteredCards;

  const handleStartStudy = useCallback((level: JLPTLevel, lessonIds: string[]) => {
    setSelectedLevel(level);
    setSelectedLessonIds(lessonIds);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsShuffled(false);
    setViewMode('study');
  }, []);

  const handleBackToSelect = useCallback(() => {
    setViewMode('select');
    setCurrentIndex(0);
    setIsFlipped(false);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < displayCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, displayCards.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleShuffle = useCallback(() => {
    if (isShuffled) {
      setIsShuffled(false);
    } else {
      const shuffled = [...filteredCards].sort(() => Math.random() - 0.5);
      setShuffledCards(shuffled);
      setIsShuffled(true);
    }
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [isShuffled, filteredCards]);

  return {
    viewMode,
    selectedLevel,
    selectedLessonIds,
    currentIndex,
    isFlipped,
    isShuffled,
    memorizationFilter,
    showSettingsModal,
    studySettings,
    displayCards,
    filteredCards,
    // Removed touchStartX and touchStartY
    setIsFlipped,
    setMemorizationFilter,
    setShowSettingsModal,
    setStudySettings,
    handleStartStudy,
    handleBackToSelect,
    handleNext,
    handlePrev,
    handleShuffle,
    setCurrentIndex,
  };
}
