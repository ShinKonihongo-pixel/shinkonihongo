// Action buttons for memorization status
import type { Flashcard, MemorizationStatus } from '../../../types/flashcard';
import type { AppSettings } from '../../../hooks/use-settings';

interface ActionButtonsProps {
  currentCard: Flashcard;
  onSetMemorization: (status: MemorizationStatus) => void;
  settings: AppSettings;
  clickCount: number;
  isMobile: boolean;
}

export function ActionButtons({
  currentCard,
  onSetMemorization,
  settings,
  clickCount,
  isMobile,
}: ActionButtonsProps) {
  const handleMemorizationClick = (status: MemorizationStatus) => {
    if (currentCard.memorizationStatus === status) {
      onSetMemorization('unset');
    } else {
      onSetMemorization(status);
    }
  };

  return (
    <div className="action-buttons-inline">
      <div className="action-group">
        <span>Trạng thái:</span>
        <button
          className={`memo-btn memorized ${currentCard.memorizationStatus === 'memorized' ? 'active' : ''}`}
          onClick={() => handleMemorizationClick('memorized')}
        >
          ✓ {!isMobile && 'Đã '}thuộc
        </button>
        <button
          className={`memo-btn not-memorized ${currentCard.memorizationStatus === 'not_memorized' ? 'active' : ''}`}
          onClick={() => handleMemorizationClick('not_memorized')}
        >
          ✗ {!isMobile && 'Chưa '}thuộc
        </button>
      </div>
      {settings.autoAdvanceOnThirdClick && (
        <span className="click-count">Nhấp: {clickCount}/{settings.clicksToAdvance}</span>
      )}
    </div>
  );
}
