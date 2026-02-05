// Level and lesson selection component for study pages
// Premium UI with Japanese-inspired design and glassmorphism effects

import { useState } from 'react';
import type { LevelLessonSelectorProps, JLPTLevel } from './types';
import {
  useCardCountByLevel,
  useLevelLessons,
  useCardsPerLesson,
  useTotalSelectedCards,
} from './hooks';
import { LevelSelector } from './level-selector';
import { LessonSelector } from './lesson-selector';
import { styles } from './styles';

export function LevelLessonSelector({
  type,
  cards,
  getLessonsByLevel,
  getChildLessons,
  onStart,
}: LevelLessonSelectorProps) {
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | null>(null);
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [hoveredLevel, setHoveredLevel] = useState<JLPTLevel | null>(null);

  const countByLevel = useCardCountByLevel(cards, type);
  const levelLessons = useLevelLessons(selectedLevel, getLessonsByLevel);
  const cardsPerLesson = useCardsPerLesson(levelLessons, cards, getChildLessons, type);
  const totalSelectedCards = useTotalSelectedCards(selectedLessons, cardsPerLesson);

  const toggleLesson = (lessonId: string) => {
    setSelectedLessons(prev =>
      prev.includes(lessonId)
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  const selectAllLessons = () => {
    const availableLessons = levelLessons.filter(l => (cardsPerLesson[l.id] || 0) > 0);
    setSelectedLessons(availableLessons.map(l => l.id));
  };

  const deselectAllLessons = () => {
    setSelectedLessons([]);
  };

  const handleStart = () => {
    if (selectedLevel && selectedLessons.length > 0) {
      onStart(selectedLessons, selectedLevel);
    }
  };

  const backToLevelSelect = () => {
    setSelectedLevel(null);
    setSelectedLessons([]);
  };

  return (
    <div className="premium-selector">
      {/* Animated Background */}
      <div className="bg-aurora" />
      <div className="bg-grid" />

      {/* Level Selection Screen */}
      {!selectedLevel && (
        <LevelSelector
          type={type}
          countByLevel={countByLevel}
          hoveredLevel={hoveredLevel}
          onHover={setHoveredLevel}
          onSelect={setSelectedLevel}
        />
      )}

      {/* Lesson Selection Screen */}
      {selectedLevel && (
        <LessonSelector
          type={type}
          selectedLevel={selectedLevel}
          levelLessons={levelLessons}
          selectedLessons={selectedLessons}
          cardsPerLesson={cardsPerLesson}
          totalSelectedCards={totalSelectedCards}
          onBack={backToLevelSelect}
          onToggleLesson={toggleLesson}
          onSelectAll={selectAllLessons}
          onDeselectAll={deselectAllLessons}
          onStart={handleStart}
        />
      )}

      <style>{styles}</style>
    </div>
  );
}
