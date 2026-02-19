// Lobby Start Footer — Start button for host, waiting message for non-host
// Reusable across all premium game lobbies

import type { ReactNode } from 'react';

interface LobbyStartFooterProps {
  isHost: boolean;
  canStart: boolean;
  loading?: boolean;
  onStart: () => void;
  /** Icon shown next to start text */
  startIcon: ReactNode;
  /** Label when ready to start */
  startLabel?: string;
  /** Label when not enough players */
  disabledLabel?: string;
}

export function LobbyStartFooter({
  isHost,
  canStart,
  loading = false,
  onStart,
  startIcon,
  startLabel = 'Bắt Đầu Game',
  disabledLabel = 'Cần thêm người chơi',
}: LobbyStartFooterProps) {
  if (!isHost) {
    return <div className="pl-lobby-waiting-msg">Đang chờ host bắt đầu...</div>;
  }

  return (
    <button className="pl-lobby-start-btn" onClick={onStart} disabled={!canStart || loading}>
      {startIcon}
      {loading ? 'Đang tải...' : canStart ? startLabel : disabledLabel}
    </button>
  );
}
