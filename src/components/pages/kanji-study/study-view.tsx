// Main kanji study view with card and controls
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { KanjiCard, KanjiLesson } from '../../../types/kanji';
import type { JLPTLevel } from '../../../types/flashcard';
import type { MemorizationFilter, KanjiStudySettings } from './types';
import { KanjiDisplayCard } from './kanji-display-card';

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

const LEVEL_COLORS: Record<JLPTLevel, string> = {
  BT: '#8b5cf6', N5: '#22c55e', N4: '#3b82f6', N3: '#f59e0b', N2: '#a855f7', N1: '#ef4444',
};

export function StudyView({
  displayCards, currentIndex, isFlipped, isShuffled, selectedLevel,
  memorizationFilter, lessons, studySettings, touchStartX, touchStartY,
  onNext, onPrev, onFlip, onShuffle, onRestart, onBack, onOpenSettings,
  onFilterChange, onToggleMemorization,
}: StudyViewProps) {
  const currentCard = displayCards[currentIndex];

  return (
    <>
      <div className="study-header-compact">
        <div className="header-left-group">
          <button className="btn-back" onClick={onBack}><ChevronLeft size={18} /></button>
          <span className="level-badge" style={{ background: LEVEL_COLORS[selectedLevel] }}>{selectedLevel === 'BT' ? 'Bộ thủ' : selectedLevel}</span>
          <div className="filter-chips">
            <button className={`filter-chip ${memorizationFilter === 'all' ? 'active' : ''}`} onClick={() => onFilterChange('all')}>Tất cả</button>
            <button className={`filter-chip learned ${memorizationFilter === 'memorized' ? 'active' : ''}`} onClick={() => onFilterChange('memorized')}>Đã thuộc</button>
            <button className={`filter-chip learning ${memorizationFilter === 'learning' ? 'active' : ''}`} onClick={() => onFilterChange('learning')}>Đang học</button>
          </div>
        </div>
        <div className="header-actions">
          <button className={`action-btn shuffle-btn ${isShuffled ? 'active' : ''}`} onClick={onShuffle}>🔀 <span className="btn-text">Trộn</span></button>
          <button className="action-btn" onClick={onRestart}>↺ <span className="btn-text">Lại</span></button>
          <button className="header-btn" onClick={onOpenSettings}>⚙</button>
        </div>
      </div>
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
