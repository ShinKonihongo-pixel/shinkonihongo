// Lobby Action Bar - Reusable start/wait/leave button pattern

import { Play, LogOut } from 'lucide-react';

interface LobbyActionBarProps {
  isHost: boolean;
  canStart: boolean;
  onStart: () => void;
  onLeave: () => void;
  startLabel?: string;
  disabledLabel?: string;
  waitingLabel?: string;
  loading?: boolean;
  className?: string;
  startIcon?: React.ReactNode;
  leaveLabel?: string;
}

export function LobbyActionBar({
  isHost,
  canStart,
  onStart,
  onLeave,
  startLabel = 'Bắt Đầu',
  disabledLabel = 'Cần thêm người chơi',
  waitingLabel = 'Đang chờ host bắt đầu...',
  loading = false,
  className = '',
  startIcon = <Play size={20} />,
  leaveLabel = 'Rời Phòng',
}: LobbyActionBarProps) {

  return (
    <div className={`lobby-actions ${className}`}>
      {isHost ? (
        <button
          className="start-btn"
          onClick={onStart}
          disabled={!canStart || loading}
        >
          {startIcon}
          {loading ? 'Đang tải...' : canStart ? startLabel : disabledLabel}
        </button>
      ) : (
        <div className="waiting-message">
          {waitingLabel}
        </div>
      )}

      <button className="leave-btn" onClick={onLeave}>
        <LogOut size={18} />
        {leaveLabel}
      </button>
    </div>
  );
}
