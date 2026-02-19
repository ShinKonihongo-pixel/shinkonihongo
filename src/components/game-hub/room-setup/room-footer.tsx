import { Play } from 'lucide-react';
import type { GameInfo } from '../../../types/game-hub';

interface RoomFooterProps {
  gameInfo: GameInfo;
  loading: boolean;
  onBack: () => void;
  onSubmit: () => void;
  disabled?: boolean;
  availableCount?: number;
  requiredCount?: number;
}

export function RoomFooter({
  gameInfo,
  loading,
  onBack,
  onSubmit,
  disabled,
  availableCount,
  requiredCount,
}: RoomFooterProps) {
  const notEnough = disabled && availableCount !== undefined && requiredCount !== undefined;

  return (
    <footer className="rm-footer">
      {notEnough && (
        <div className="rm-footer-warning">
          Chỉ có <strong>{availableCount}</strong> câu hỏi, cần <strong>{requiredCount}</strong>
        </div>
      )}
      <div className="rm-footer-actions">
        <button
          type="button"
          className="rm-btn rm-btn-ghost"
          onClick={onBack}
        >
          Hủy
        </button>
        <button
          type="button"
          className="rm-btn rm-btn-primary rm-btn-lg"
          disabled={loading || disabled}
          onClick={onSubmit}
          style={{ background: disabled ? undefined : gameInfo.gradient }}
        >
          {loading ? (
            <>
              <span className="rm-spinner" />
              <span>Đang tạo...</span>
            </>
          ) : (
            <>
              <Play size={20} fill="white" />
              <span>Tạo Phòng</span>
            </>
          )}
        </button>
      </div>
    </footer>
  );
}
