// Card display area with navigation
import { useState } from 'react';
import type { Flashcard } from '../../../types/flashcard';
import type { AppSettings } from '../../../hooks/use-settings';
import { FlashcardItem } from '../../flashcard/flashcard-item';

interface CardAreaProps {
  currentCard: Flashcard;
  currentIndex: number;
  totalCards: number;
  isFlipped: boolean;
  onFlip: () => void;
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  settings: AppSettings;
  isMobile: boolean;
}

export function CardArea({
  currentCard,
  currentIndex,
  totalCards,
  isFlipped,
  onFlip,
  onNext,
  onPrev,
  canGoNext,
  canGoPrev,
  settings,
  isMobile,
}: CardAreaProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && canGoNext) {
      onNext();
    } else if (isRightSwipe && canGoPrev) {
      onPrev();
    }
  };

  return (
    <div
      className="study-card-area"
      onTouchStart={isMobile ? onTouchStart : undefined}
      onTouchMove={isMobile ? onTouchMove : undefined}
      onTouchEnd={isMobile ? onTouchEnd : undefined}
    >
      <div className="card-navigation">
        {!isMobile && (
          <button
            className="card-nav-btn"
            onClick={onPrev}
            disabled={!canGoPrev}
            title="Từ trước"
          >
            &lt;
          </button>
        )}
        <div
          className="card-wrapper"
          style={{
            transform: `scale(${(settings.cardScale || 100) / 100})`,
            transformOrigin: 'center center',
          }}
        >
          <FlashcardItem
            card={currentCard}
            isFlipped={isFlipped}
            onFlip={onFlip}
            settings={settings}
          />
          <div className="card-counter-badge">
            {currentIndex + 1} / {totalCards}
          </div>
        </div>
        {!isMobile && (
          <button
            className="card-nav-btn"
            onClick={onNext}
            disabled={!canGoNext}
            title="Từ tiếp"
          >
            &gt;
          </button>
        )}
      </div>
      {isMobile && <p className="swipe-hint">← Vuốt để chuyển thẻ →</p>}
    </div>
  );
}
