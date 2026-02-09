// Hooks for friendship and badge system

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  FriendRequest,
  Friendship,
  GameInvitation,
  BadgeGift,
  BadgeType,
  UserBadgeStats,
  FriendNotification,
  FriendWithUser,
} from '../types/friendship';
import type { User } from '../types/user';
import * as friendshipService from '../services/friendship-firestore';

// ============ FRIENDSHIPS HOOK ============

export function useFriendships(userId: string | null, users: User[]) {
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to friendships
  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFriendships([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = friendshipService.subscribeToFriendships(userId, (data) => {
      setFriendships(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Subscribe to pending requests
  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPendingRequests([]);
      return;
    }

    const unsubscribe = friendshipService.subscribeToPendingRequests(userId, (data) => {
      setPendingRequests(data);
    });

    return () => unsubscribe();
  }, [userId]);

  // Get friends with user details
  const friendsWithUsers = useMemo((): FriendWithUser[] => {
    if (!userId) return [];

    return friendships.map(f => {
      const friendId = f.userId1 === userId ? f.userId2 : f.userId1;
      const friend = users.find(u => u.id === friendId);
      return {
        friendship: f,
        friendId,
        friendName: friend?.displayName || friend?.username || 'Unknown',
        friendAvatar: friend?.avatar,
      };
    });
  }, [friendships, userId, users]);

  // Get pending requests with user details
  const pendingRequestsWithUsers = useMemo(() => {
    return pendingRequests.map(r => {
      const fromUser = users.find(u => u.id === r.fromUserId);
      return {
        ...r,
        fromUserName: fromUser?.displayName || fromUser?.username || 'Unknown',
        fromUserAvatar: fromUser?.avatar,
      };
    });
  }, [pendingRequests, users]);

  // Send friend request
  const sendRequest = useCallback(async (toUserId: string, message?: string): Promise<{ success: boolean; error?: string }> => {
    if (!userId) return { success: false, error: 'Chưa đăng nhập' };

    // Check if already friends
    const existingFriendship = await friendshipService.checkFriendship(userId, toUserId);
    if (existingFriendship) {
      return { success: false, error: 'Đã là bạn bè' };
    }

    // Check if request already exists
    const existingRequest = await friendshipService.checkExistingRequest(userId, toUserId);
    if (existingRequest) {
      return { success: false, error: 'Đã gửi lời mời trước đó' };
    }

    try {
      await friendshipService.sendFriendRequest(userId, toUserId, message);
      return { success: true };
    } catch (err) {
      console.error('Error sending friend request:', err);
      return { success: false, error: 'Lỗi khi gửi lời mời' };
    }
  }, [userId]);

  // Accept/Reject friend request
  const respondToRequest = useCallback(async (requestId: string, accept: boolean): Promise<boolean> => {
    try {
      await friendshipService.respondToFriendRequest(requestId, accept);
      return true;
    } catch (err) {
      console.error('Error responding to friend request:', err);
      return false;
    }
  }, []);

  // Remove friend
  const removeFriend = useCallback(async (friendshipId: string): Promise<boolean> => {
    try {
      await friendshipService.removeFriendship(friendshipId);
      return true;
    } catch (err) {
      console.error('Error removing friend:', err);
      return false;
    }
  }, []);

  // Check if user is a friend
  const isFriend = useCallback((otherUserId: string): boolean => {
    return friendsWithUsers.some(f => f.friendId === otherUserId);
  }, [friendsWithUsers]);

  return {
    friendships,
    friendsWithUsers,
    pendingRequests: pendingRequestsWithUsers,
    loading,
    sendRequest,
    respondToRequest,
    removeFriend,
    isFriend,
  };
}

// ============ GAME INVITATIONS HOOK ============

export function useGameInvitations(userId: string | null) {
  const [invitations, setInvitations] = useState<GameInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInvitations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = friendshipService.subscribeToGameInvitations(userId, (data) => {
      setInvitations(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const sendInvitation = useCallback(async (
    gameId: string,
    gameCode: string,
    gameTitle: string,
    toUserId: string
  ): Promise<boolean> => {
    if (!userId) return false;
    try {
      await friendshipService.sendGameInvitation(gameId, gameCode, gameTitle, userId, toUserId);
      return true;
    } catch (err) {
      console.error('Error sending game invitation:', err);
      return false;
    }
  }, [userId]);

  const respondToInvitation = useCallback(async (invitationId: string, accept: boolean): Promise<boolean> => {
    try {
      await friendshipService.respondToGameInvitation(invitationId, accept);
      return true;
    } catch (err) {
      console.error('Error responding to invitation:', err);
      return false;
    }
  }, []);

  return {
    invitations,
    loading,
    sendInvitation,
    respondToInvitation,
  };
}

// ============ BADGES HOOK ============

export function useBadges(userId: string | null, users: User[]) {
  const [receivedBadges, setReceivedBadges] = useState<BadgeGift[]>([]);
  const [badgeStats, setBadgeStats] = useState<UserBadgeStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to received badges
  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReceivedBadges([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = friendshipService.subscribeToReceivedBadges(userId, (data) => {
      setReceivedBadges(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Subscribe to badge stats
  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBadgeStats(null);
      return;
    }

    const unsubscribe = friendshipService.subscribeToBadgeStats(userId, (data) => {
      setBadgeStats(data);
    });

    return () => unsubscribe();
  }, [userId]);

  // Get received badges with sender info
  const receivedBadgesWithUsers = useMemo(() => {
    return receivedBadges.map(b => {
      const fromUser = users.find(u => u.id === b.fromUserId);
      return {
        ...b,
        fromUserName: fromUser?.displayName || fromUser?.username || 'Unknown',
        fromUserAvatar: fromUser?.avatar,
      };
    });
  }, [receivedBadges, users]);

  // Send badge to a friend
  const sendBadge = useCallback(async (
    badgeType: BadgeType,
    toUserId: string,
    message?: string
  ): Promise<boolean> => {
    if (!userId) return false;

    const currentUser = users.find(u => u.id === userId);
    const fromUserName = currentUser?.displayName || currentUser?.username || 'Unknown';

    try {
      await friendshipService.sendBadgeGift(badgeType, userId, toUserId, fromUserName, message);
      return true;
    } catch (err) {
      console.error('Error sending badge:', err);
      return false;
    }
  }, [userId, users]);

  return {
    receivedBadges: receivedBadgesWithUsers,
    badgeStats,
    loading,
    sendBadge,
  };
}

// ============ FRIEND NOTIFICATIONS HOOK ============

export function useFriendNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<FriendNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = friendshipService.subscribeToFriendNotifications(userId, (data) => {
      setNotifications(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      await friendshipService.markNotificationAsRead(notificationId);
      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    try {
      await friendshipService.markAllFriendNotificationsAsRead(userId);
      return true;
    } catch (err) {
      console.error('Error marking all as read:', err);
      return false;
    }
  }, [userId]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  };
}
