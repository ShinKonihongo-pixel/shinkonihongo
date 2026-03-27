/**
 * GameCreateFooter — question pool indicator + submit/cancel buttons.
 */

import { Play } from 'lucide-react';

interface GameCreateFooterProps {
  isFlashcardSource: boolean;
  availableCards: number;
  availableJLPTQuestions: number;
  totalRounds: number;
  loading: boolean;
  canSubmit: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function GameCreateFooter({
  isFlashcardSource,
  availableCards,
  availableJLPTQuestions,
  totalRounds,
  loading,
  canSubmit,
  onCancel,
  onSubmit,
}: GameCreateFooterProps) {
  const available = isFlashcardSource ? availableCards : availableJLPTQuestions;
  const ratio = totalRounds > 0 ? available / totalRounds : 0;
  const fillClass = ratio >= 1.5 ? 'sufficient' : ratio >= 1 ? 'tight' : 'insufficient';

  return (
    <footer className="rm-footer">
      <div className="rm-question-pool">
        <div className="rm-pool-bar">
          <div
            className={`rm-pool-fill ${fillClass}`}
            style={{ width: `${Math.min(ratio * 100, 100)}%` }}
          />
        </div>
        <div className="rm-pool-info">
          <span className="rm-pool-count">{available} câu hỏi có sẵn</span>
          <span className="rm-pool-need">/ cần {totalRounds} câu</span>
        </div>
      </div>
      <button type="button" className="rm-btn rm-btn-ghost" onClick={onCancel}>
        Hủy
      </button>
      <button
        type="submit"
        className="rm-btn rm-btn-primary rm-btn-lg"
        disabled={loading || !canSubmit}
        onClick={onSubmit}
      >
        {loading ? (
          <>
            <span className="rm-spinner" />
            <span>Đang tạo...</span>
          </>
        ) : (
          <>
            <Play size={20} fill="white" />
            <span>Tạo phòng</span>
          </>
        )}
      </button>
    </footer>
  );
}
