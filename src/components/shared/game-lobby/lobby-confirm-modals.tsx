// Leave + Kick confirmation modals shared across all game lobbies

import { ConfirmModal } from '../../ui/confirm-modal';
import type { BaseLobbyPlayer } from './types';

interface LobbyConfirmModalsProps {
  /** Whether current player is the host */
  isHost: boolean;
  /** Whether the leave confirmation modal is open */
  showLeaveConfirm: boolean;
  /** The player ID being targeted for kick, or null */
  kickTarget: string | null;
  /** All normalized players (for kick target name lookup) */
  normalizedPlayers: BaseLobbyPlayer[];
  /** Called when leave is confirmed */
  onLeaveConfirm: () => void;
  /** Called when leave dialog is cancelled */
  onLeaveCancel: () => void;
  /** Called when kick is confirmed */
  onKickConfirm: () => void;
  /** Called when kick dialog is cancelled */
  onKickCancel: () => void;
}

export function LobbyConfirmModals({
  isHost,
  showLeaveConfirm,
  kickTarget,
  normalizedPlayers,
  onLeaveConfirm,
  onLeaveCancel,
  onKickConfirm,
  onKickCancel,
}: LobbyConfirmModalsProps) {
  return (
    <>
      <ConfirmModal
        isOpen={showLeaveConfirm}
        title="Rời khỏi phòng?"
        message={
          isHost
            ? 'Bạn là host. Nếu bạn rời đi, phòng sẽ bị huỷ và tất cả người chơi sẽ bị đuổi ra.'
            : 'Bạn có chắc muốn rời khỏi phòng chơi này?'
        }
        confirmText="Rời phòng"
        cancelText="Ở lại"
        onConfirm={onLeaveConfirm}
        onCancel={onLeaveCancel}
      />

      <ConfirmModal
        isOpen={!!kickTarget}
        title="Kick người chơi?"
        message={`Bạn có chắc muốn kick "${normalizedPlayers.find(p => p.id === kickTarget)?.displayName || ''}" khỏi phòng?`}
        confirmText="Kick"
        cancelText="Huỷ"
        onConfirm={onKickConfirm}
        onCancel={onKickCancel}
      />
    </>
  );
}
