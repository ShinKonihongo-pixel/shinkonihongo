// Grammar card wrapper with flip animation
import { useRef } from 'react';
import type { GrammarCard, JLPTLevel, GrammarLesson } from '../../../types/flashcard';
import type { GrammarStudySettings } from './types';
import { GrammarCardFront } from './grammar-card-front';
import { GrammarCardBack } from './grammar-card-back';
import { LEVEL_THEMES } from './constants';

interface GrammarCardComponentProps {
  card: GrammarCard;
  isFlipped: boolean;
  settings: GrammarStudySettings;
  selectedLevel: JLPTLevel;
  lessons: GrammarLesson[];
  onFlip: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  touchStartX: React.MutableRefObject<number | null>;
  touchStartY: React.MutableRefObject<number | null>;
}

export function GrammarCardComponent({
  card,
  isFlipped,
  settings,
  selectedLevel,
  lessons,
  onFlip,
  onSwipeLeft,
  onSwipeRight,
  touchStartX,
  touchStartY,
}: GrammarCardComponentProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const levelTheme = LEVEL_THEMES[selectedLevel];

  const getLessonName = (lessonId: string): string => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return '';
    if (lesson.parentId) {
      const parent = lessons.find(l => l.id === lesson.parentId);
      return parent ? `${parent.name} > ${lesson.name}` : lesson.name;
    }
    return lesson.name;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartX.current;
    const diffY = touchEndY - touchStartY.current;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div
      ref={cardRef}
      className={`grammar-card-container ${isFlipped ? 'flipped' : ''}`}
      onClick={onFlip}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `scale(${settings.cardScale / 100})`,
        transformOrigin: 'center center',
      }}
    >
      <div
        className="grammar-card"
        style={{
          '--level-glow': levelTheme.glow,
          '--front-font-size': `${settings.frontFontSize}px`,
          '--back-font-size': `${settings.backFontSize}px`,
        } as React.CSSProperties}
      >
        <GrammarCardFront
          card={card}
          settings={settings}
          lessonName={getLessonName(card.lessonId)}
          selectedLevel={selectedLevel}
        />
        <GrammarCardBack card={card} settings={settings} />
      </div>
    </div>
  );
}
