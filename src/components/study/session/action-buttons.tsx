// Action buttons for memorization and difficulty
import type { Flashcard, MemorizationStatus, DifficultyLevel } from '../../../types/flashcard';
import type { AppSettings } from '../../../hooks/use-settings';

interface ActionButtonsProps {
  currentCard: Flashcard;
  onSetMemorization: (status: MemorizationStatus) => void;
  onSetDifficulty: (level: DifficultyLevel) => void;
  settings: AppSettings;
  clickCount: number;
  isMobile: boolean;
}

export function ActionButtons({
  currentCard,
  onSetMemorization,
  onSetDifficulty,
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

  const handleDifficultyClick = (level: DifficultyLevel) => {
    if (currentCard.difficultyLevel === level) {
      onSetDifficulty('unset');
    } else {
      onSetDifficulty(level);
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
      <span className="action-separator">|</span>
      <div className="action-group">
        <span>Độ khó:</span>
        <button
          className={`diff-btn super-hard ${currentCard.difficultyLevel === 'super_hard' ? 'active' : ''}`}
          onClick={() => handleDifficultyClick('super_hard')}
        >
          💀
        </button>
        <button
          className={`diff-btn hard ${currentCard.difficultyLevel === 'hard' ? 'active' : ''}`}
          onClick={() => handleDifficultyClick('hard')}
        >
          Khó
        </button>
        <button
          className={`diff-btn medium ${currentCard.difficultyLevel === 'medium' ? 'active' : ''}`}
          onClick={() => handleDifficultyClick('medium')}
        >
          Vừa
        </button>
        <button
          className={`diff-btn easy ${currentCard.difficultyLevel === 'easy' ? 'active' : ''}`}
          onClick={() => handleDifficultyClick('easy')}
        >
          Dễ
        </button>
      </div>
      {settings.autoAdvanceOnThirdClick && (
        <span className="click-count">Nhấp: {clickCount}/{settings.clicksToAdvance}</span>
      )}
    </div>
  );
}
