// Main kanji study view with card and controls
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { KanjiCard, KanjiLesson } from '../../../types/kanji';
import type { JLPTLevel } from '../../../types/flashcard';
import type { MemorizationFilter, KanjiStudySettings } from './types';
import { KanjiDisplayCard } from './kanji-display-card';
import { StudyHeaderCompact } from '../../ui/study-header-compact';

interface StudyViewProps {
  displayCards: KanjiCard[];
  currentIndex: number;
  isFlipped: boolean;
  isShuffled: boolean;
  selectedLevel: JLPTLevel;
  memorizationFilter: MemorizationFilter;
  lessons: KanjiLesson[];
  studySettings: KanjiStudySettings;
  touchStartX: React.MutableRefObject<number | null>;
  touchStartY: React.MutableRefObject<number | null>;
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
  displayCards, currentIndex, isFlipped, isShuffled, selectedLevel,
  memorizationFilter, lessons, studySettings, touchStartX, touchStartY,
  onNext, onPrev, onFlip, onShuffle, onRestart, onBack, onOpenSettings,
  onFilterChange, onToggleMemorization,
}: StudyViewProps) {
  const currentCard = displayCards[currentIndex];

  return (
    <>
      <StudyHeaderCompact
        selectedLevel={selectedLevel}
        levelLabel={selectedLevel === 'BT' ? 'Bộ thủ' : undefined}
        memorizationFilter={memorizationFilter}
        isShuffled={isShuffled}
        onFilterChange={onFilterChange}
        onShuffle={onShuffle}
        onRestart={onRestart}
        onBack={onBack}
        onOpenSettings={onOpenSettings}
      />
      <div className="study-content">
        <button className="side-nav-btn side-nav-prev" onClick={onPrev} disabled={currentIndex === 0}><ChevronLeft size={28} /></button>
        {currentCard && (
          <KanjiDisplayCard
            card={currentCard}
            isFlipped={isFlipped}
            settings={studySettings}
            selectedLevel={selectedLevel}
            lessons={lessons}
            onFlip={onFlip}
            onSwipeLeft={onPrev}
            onSwipeRight={onNext}
            touchStartX={touchStartX}
            touchStartY={touchStartY}
          />
        )}
        <button className="side-nav-btn side-nav-next" onClick={onNext} disabled={currentIndex >= displayCards.length - 1}><ChevronRight size={28} /></button>
      </div>
      <div className="study-controls">
        <div className="memorization-buttons">
          <button className={`mem-btn not-learned ${currentCard?.memorizationStatus === 'not_memorized' ? 'active' : ''}`} onClick={() => onToggleMemorization('not_memorized')}>✗ Chưa thuộc</button>
          <button className={`mem-btn learned ${currentCard?.memorizationStatus === 'memorized' ? 'active' : ''}`} onClick={() => onToggleMemorization('memorized')}>✓ Đã thuộc</button>
        </div>
        <div className="card-counter-fixed">{currentIndex + 1} / {displayCards.length}</div>
      </div>
    </>
  );
}
