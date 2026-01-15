// Friend invite modal for quiz game

import { useState } from 'react';
import type { FriendWithUser } from '../../types/friendship';
import { X, UserPlus, Send, Check } from 'lucide-react';

interface GameFriendInviteProps {
  isOpen: boolean;
  onClose: () => void;
  friends: FriendWithUser[];
  gameCode: string;
  gameTitle: string;
  gameId: string;
  onInviteFriend: (gameId: string, gameCode: string, gameTitle: string, friendId: string) => Promise<boolean>;
}

export function GameFriendInvite({
  isOpen,
  onClose,
  friends,
  gameCode,
  gameTitle,
  gameId,
  onInviteFriend,
}: GameFriendInviteProps) {
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState<string | null>(null);

  const handleInvite = async (friendId: string) => {
    setSending(friendId);
    const success = await onInviteFriend(gameId, gameCode, gameTitle, friendId);
    if (success) {
      setInvitedIds(prev => new Set([...prev, friendId]));
    }
    setSending(null);
  };

  const handleClose = () => {
    setInvitedIds(new Set());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="game-friend-invite-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <UserPlus size={20} />
            Mời bạn bè chơi game
          </h3>
          <button className="btn-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="invite-info">
          <p className="game-title">{gameTitle || 'Quiz Game'}</p>
          <div className="game-code-display">
            <span className="label">Mã phòng:</span>
            <span className="code">{gameCode}</span>
          </div>
        </div>

        <div className="friends-invite-list">
          {friends.length === 0 ? (
            <div className="empty-friends">
              <p>Bạn chưa có bạn bè nào</p>
              <p className="hint">Hãy thêm bạn bè trong trang Cài đặt → Bạn bè & Huy hiệu</p>
            </div>
          ) : (
            friends.map(f => {
              const isInvited = invitedIds.has(f.friendId);
              const isSending = sending === f.friendId;

              return (
                <div key={f.friendId} className="friend-invite-item">
                  <div className="friend-avatar">
                    {f.friendAvatar || f.friendName.charAt(0).toUpperCase()}
                  </div>
                  <span className="friend-name">{f.friendName}</span>
                  {isInvited ? (
                    <span className="invited-badge">
                      <Check size={16} />
                      Đã mời
                    </span>
                  ) : (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleInvite(f.friendId)}
                      disabled={isSending}
                    >
                      <Send size={14} />
                      {isSending ? '...' : 'Mời'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="modal-footer">
          <p className="share-hint">
            Hoặc chia sẻ mã phòng <strong>{gameCode}</strong> cho bạn bè để tham gia
          </p>
        </div>
      </div>
    </div>
  );
}
