// Main study view with card and controls
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { GrammarCard, JLPTLevel, GrammarLesson } from '../../../types/flashcard';
import type { MemorizationFilter } from './types';
import { StudyHeader } from './study-header';
import { GrammarCardComponent } from './grammar-card';
import { StudyControls } from './study-controls';
import { useStudyState } from './use-study-state';

interface StudyViewProps {
  displayCards: GrammarCard[];
  currentIndex: number;
  isFlipped: boolean;
  isShuffled: boolean;
  selectedLevel: JLPTLevel;
  memorizationFilter: MemorizationFilter;
  lessons: GrammarLesson[];
  studySettings: ReturnType<typeof useStudyState>['studySettings'];
  // Removed touchStartX and touchStartY - managed locally in card
  onNext: () => void;
  onPrev: () => void;
  onFlip: () => void;
  onShuffle: () => void;
  onRestart: () => void;
  onBack: () => void;
  onOpenSettings: () => void;
  onFilterChange: (filter: MemorizationFilter) => void;
  onToggleMemorization: (status: 'memorized' | 'not_memorized') => void;
}

export function StudyView({
  displayCards,
  currentIndex,
  isFlipped,
  isShuffled,
  selectedLevel,
  memorizationFilter,
  lessons,
  studySettings,
  onNext,
  onPrev,
  onFlip,
  onShuffle,
  onRestart,
  onBack,
  onOpenSettings,
  onFilterChange,
  onToggleMemorization,
}: StudyViewProps) {
  const currentCard = displayCards[currentIndex];

  return (
    <>
      <StudyHeader
        selectedLevel={selectedLevel}
        memorizationFilter={memorizationFilter}
        isShuffled={isShuffled}
        onFilterChange={onFilterChange}
        onShuffle={onShuffle}
        onRestart={onRestart}
        onBack={onBack}
        onOpenSettings={onOpenSettings}
      />

      <div className="study-content">
        <button
          className="side-nav-btn side-nav-prev"
          onClick={onPrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft size={28} />
        </button>

        {currentCard && (
          <GrammarCardComponent
            card={currentCard}
            isFlipped={isFlipped}
            settings={studySettings}
            selectedLevel={selectedLevel}
            lessons={lessons}
            onFlip={onFlip}
            onSwipeLeft={onPrev}
            onSwipeRight={onNext}
          />
        )}

        <button
          className="side-nav-btn side-nav-next"
          onClick={onNext}
          disabled={currentIndex >= displayCards.length - 1}
        >
          <ChevronRight size={28} />
        </button>
      </div>

      <StudyControls
        currentCard={currentCard}
        currentIndex={currentIndex}
        totalCards={displayCards.length}
        onToggleMemorization={onToggleMemorization}
      />
    </>
  );
}
