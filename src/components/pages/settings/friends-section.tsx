// Friends section component
import type { FriendsSettingsProps } from './settings-types';
import { FriendsPanel } from '../../friends/friends-panel';
import { BadgeStatsDisplay } from '../../friends/badge-stats-display';
import { BadgeGiftModal } from '../../friends/badge-gift-modal';
import { useState } from 'react';

export function FriendsSection({
  currentUser,
  allUsers = [],
  friends = [],
  pendingRequests = [],
  badgeStats,
  receivedBadges = [],
  friendsLoading = false,
  onSendFriendRequest,
  onRespondFriendRequest,
  onRemoveFriend,
  onSendBadge,
  isFriend = () => false,
}: FriendsSettingsProps) {
  const [badgeGiftTarget, setBadgeGiftTarget] = useState<{ id: string; name: string } | null>(null);

  if (!currentUser) {
    return (
      <div className="settings-tab-content">
        <p className="settings-not-logged-in">Vui lòng đăng nhập để sử dụng tính năng bạn bè.</p>
      </div>
    );
  }

  return (
    <div className="settings-tab-content friends-tab-content">
      <section className="settings-section badge-stats-section">
        <BadgeStatsDisplay
          stats={badgeStats ?? null}
          recentBadges={receivedBadges}
        />
      </section>

      <section className="settings-section friends-panel-section">
        <FriendsPanel
          friends={friends}
          pendingRequests={pendingRequests}
          allUsers={allUsers}
          currentUserId={currentUser.id}
          loading={friendsLoading}
          onSendRequest={onSendFriendRequest || (async () => ({ success: false, error: 'Không khả dụng' }))}
          onRespondRequest={onRespondFriendRequest || (async () => false)}
          onRemoveFriend={onRemoveFriend || (async () => false)}
          onSendBadge={(friendId) => {
            const friend = friends.find(f => f.friendId === friendId);
            if (friend) {
              setBadgeGiftTarget({ id: friendId, name: friend.friendName });
            }
          }}
          isFriend={isFriend}
        />
      </section>

      {badgeGiftTarget && onSendBadge && (
        <BadgeGiftModal
          isOpen={!!badgeGiftTarget}
          onClose={() => setBadgeGiftTarget(null)}
          friendName={badgeGiftTarget.name}
          friendId={badgeGiftTarget.id}
          onSendBadge={onSendBadge}
        />
      )}
    </div>
  );
}
