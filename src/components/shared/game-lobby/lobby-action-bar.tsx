// Lobby Action Bar - Reusable start/wait/leave button pattern
// Leave button shows confirm modal before actually leaving

import { useState } from 'react';
import { Play, LogOut } from 'lucide-react';
import { ConfirmModal } from '../../ui/confirm-modal';

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
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

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

      <button className="leave-btn" onClick={() => setShowLeaveConfirm(true)}>
        <LogOut size={18} />
        {leaveLabel}
      </button>

      <ConfirmModal
        isOpen={showLeaveConfirm}
        title="Rời khỏi phòng?"
        message={isHost
          ? 'Bạn là host. Nếu bạn rời đi, phòng sẽ bị huỷ và tất cả người chơi sẽ bị đuổi ra.'
          : 'Bạn có chắc muốn rời khỏi phòng chơi này?'}
        confirmText="Rời phòng"
        cancelText="Ở lại"
        onConfirm={() => {
          setShowLeaveConfirm(false);
          onLeave();
        }}
        onCancel={() => setShowLeaveConfirm(false)}
      />
    </div>
  );
}
