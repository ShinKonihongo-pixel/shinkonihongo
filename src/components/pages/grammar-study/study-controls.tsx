// Study controls (memorization buttons and card counter)
import { CheckCircle2, Circle } from 'lucide-react';
import type { GrammarCard } from '../../../types/flashcard';

interface StudyControlsProps {
  currentCard: GrammarCard | undefined;
  currentIndex: number;
  totalCards: number;
  onToggleMemorization: (status: 'memorized' | 'not_memorized') => void;
}

export function StudyControls({
  currentCard,
  currentIndex,
  totalCards,
  onToggleMemorization,
}: StudyControlsProps) {
  return (
    <div className="study-controls">
      <div className="memorization-buttons">
        <button
          className={`mem-btn not-learned ${currentCard?.memorizationStatus !== 'memorized' ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleMemorization('not_memorized'); }}
        >
          <Circle size={18} />
          Chưa thuộc
        </button>
        <button
          className={`mem-btn learned ${currentCard?.memorizationStatus === 'memorized' ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleMemorization('memorized'); }}
        >
          <CheckCircle2 size={18} />
          Đã thuộc
        </button>
      </div>

      <div className="card-counter-fixed">
        {currentIndex + 1} / {totalCards}
      </div>

      <p className="swipe-hint">Vuốt trái/phải để chuyển thẻ</p>
    </div>
  );
}
