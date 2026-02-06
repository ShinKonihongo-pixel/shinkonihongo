// Word Card Component - Displays the current vocabulary word
import { CheckCircle2, Circle } from 'lucide-react';
import type { Flashcard } from '../../../types/flashcard';
import { DetailNotesButtons } from '../../flashcard/detail-notes-buttons';

interface WordCardProps {
  card: Flashcard;
  currentIndex: number;
  totalCards: number;
  currentRepeat: number;
  repeatCount: number;
  showVocabulary: boolean;
  showKanji: boolean;
  showMeaning: boolean;
  levelGlow: string;
  getLessonName: (lessonId: string) => string;
  onUpdateCard?: (id: string, data: Partial<Flashcard>) => void;
}

export function WordCard({
  card,
  currentIndex,
  totalCards,
  currentRepeat,
  repeatCount,
  showVocabulary,
  showKanji,
  showMeaning,
  levelGlow,
  getLessonName,
  onUpdateCard,
}: WordCardProps) {
  return (
    <div className="current-word-display">
      <div className="word-counter">
        {currentIndex + 1} / {totalCards}
        {repeatCount > 1 && ` (lặp ${currentRepeat + 1}/${repeatCount})`}
      </div>

      <div
        className="word-card"
        style={{ '--level-glow': levelGlow } as React.CSSProperties}
      >
        {showVocabulary && (
          <>
            <div className="vocabulary-text">{card.vocabulary}</div>
            {showKanji && card.kanji && <div className="kanji-text">{card.kanji}</div>}
          </>
        )}
        {showMeaning && (
          <>
            <div className="meaning-text">{card.meaning}</div>
            {card.sinoVietnamese && <div className="sino-text">{card.sinoVietnamese}</div>}
          </>
        )}
        <div className="lesson-info">{getLessonName(card.lessonId)}</div>
      </div>

      {onUpdateCard && (
        <div className="memorization-toggle">
          <button
            className={`mem-btn learned ${card.memorizationStatus === 'memorized' ? 'active' : ''}`}
            onClick={() => onUpdateCard(card.id, { memorizationStatus: 'memorized' })}
          >
            <CheckCircle2 size={18} /> Đã thuộc
          </button>
          <button
            className={`mem-btn not-learned ${card.memorizationStatus !== 'memorized' ? 'active' : ''}`}
            onClick={() => onUpdateCard(card.id, { memorizationStatus: 'not_memorized' })}
          >
            <Circle size={18} /> Chưa thuộc
          </button>
        </div>
      )}

      <DetailNotesButtons flashcard={card} readOnly />
    </div>
  );
}
