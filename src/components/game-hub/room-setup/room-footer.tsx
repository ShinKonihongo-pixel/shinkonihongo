import { Play } from 'lucide-react';
import type { GameInfo } from '../../../types/game-hub';

interface RoomFooterProps {
  gameInfo: GameInfo;
  loading: boolean;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function RoomFooter({ gameInfo, loading, onBack, onSubmit }: RoomFooterProps) {
  return (
    <footer className="rm-footer">
      <button
        type="button"
        className="rm-btn rm-btn-ghost"
        onClick={onBack}
      >
        Hủy
      </button>
      <button
        type="submit"
        className="rm-btn rm-btn-primary rm-btn-lg"
        disabled={loading}
        onClick={onSubmit}
        style={{ background: gameInfo.gradient }}
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
    </footer>
  );
}
