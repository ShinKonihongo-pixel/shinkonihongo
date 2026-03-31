// Main kanji study view with card and controls
import { useState, lazy, Suspense } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import type { KanjiCard, KanjiLesson } from '../../../types/kanji';
import type { JLPTLevel } from '../../../types/flashcard';
import type { MemorizationFilter, KanjiStudySettings } from './types';
import { KanjiDisplayCard } from './kanji-display-card';

const KanjiDecomposerModal = lazy(() => import('../../flashcard/kanji-decomposer-modal').then(m => ({ default: m.KanjiDecomposerModal })));
import { StudyHeaderCompact } from '../../ui/study-header-compact';

interface StudyViewProps {
  displayCards: KanjiCard[];
  allCards?: KanjiCard[];
  currentIndex: number;
  isFlipped: boolean;
  isShuffled: boolean;
  selectedLevel: JLPTLevel;
  memorizationFilter: MemorizationFilter;
  lessons: KanjiLesson[];
  studySettings: KanjiStudySettings;
  onNext: () => void;
  onPrev: () => void;
  onFlip: () => void;
  onShuffle: () => void;
  onRestart: () => void;
  onBack: () => void;
  onOpenSettings: () => void;
  onFilterChange: (filter: MemorizationFilter) => void;
  onToggleMemorization: (status: 'memorized' | 'not_memorized') => void;
  onUpdateCard?: (id: string, data: Partial<KanjiCard>) => void;
}


export function StudyView({
  displayCards, allCards, currentIndex, isFlipped, isShuffled, selectedLevel,
  memorizationFilter, lessons, studySettings,
  onNext, onPrev, onFlip, onShuffle, onRestart, onBack, onOpenSettings,
  onFilterChange, onToggleMemorization, onUpdateCard: _onUpdateCard,
}: StudyViewProps) {
  const currentCard = displayCards[currentIndex];
  const [showDecomposer, setShowDecomposer] = useState(false);

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
            allCards={allCards}
            onFlip={onFlip}
            onSwipeLeft={onPrev}
            onSwipeRight={onNext}
          />
        )}
        <button className="side-nav-btn side-nav-next" onClick={onNext} disabled={currentIndex >= displayCards.length - 1}><ChevronRight size={28} /></button>
      </div>
      <div className="study-controls">
        <div className="study-progress-bar">
          <div className="study-progress-fill" style={{ width: `${((currentIndex + 1) / displayCards.length) * 100}%` }} />
        </div>
        <div className="memorization-buttons">
          <button className={`mem-btn not-learned ${currentCard?.memorizationStatus === 'not_memorized' ? 'active' : ''}`} onClick={() => onToggleMemorization('not_memorized')}>✗ Chưa thuộc</button>
          <button
            className="mem-btn decompose-btn"
            onClick={() => setShowDecomposer(true)}
            disabled={!currentCard}
            title="Phân tích bộ thủ"
          >
            <Sparkles size={14} /> Chi tiết
          </button>
          <button className={`mem-btn learned ${currentCard?.memorizationStatus === 'memorized' ? 'active' : ''}`} onClick={() => onToggleMemorization('memorized')}>✓ Đã thuộc</button>
        </div>
        <p className="swipe-hint">Vuốt trái/phải để chuyển thẻ</p>
        <div className="card-counter-fixed">{currentIndex + 1} / {displayCards.length}</div>
      </div>

      {/* Kanji radical decomposer modal — read-only in study view */}
      {showDecomposer && currentCard && (
        <Suspense fallback={null}>
          <KanjiDecomposerModal
            kanjiCard={currentCard}
            onClose={() => setShowDecomposer(false)}
            readOnly
            allCards={allCards}
          />
        </Suspense>
      )}
    </>
  );
}
