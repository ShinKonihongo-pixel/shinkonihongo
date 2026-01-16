// Firestore service for friendship and badge system

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  increment,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type {
  FriendRequest,
  Friendship,
  GameInvitation,
  BadgeGift,
  BadgeType,
  UserBadgeStats,
  FriendNotification,
  FriendNotificationType,
} from '../types/friendship';
import { createEmptyBadgeStats } from '../types/friendship';

// Collection names
const COLLECTIONS = {
  FRIEND_REQUESTS: 'friend_requests',
  FRIENDSHIPS: 'friendships',
  GAME_INVITATIONS: 'game_invitations',
  BADGE_GIFTS: 'badge_gifts',
  BADGE_STATS: 'badge_stats',
  FRIEND_NOTIFICATIONS: 'friend_notifications',
} as const;

// ============ FRIEND REQUESTS ============

export async function sendFriendRequest(
  fromUserId: string,
  toUserId: string,
  message?: string
): Promise<FriendRequest> {
  const requestRef = doc(collection(db, COLLECTIONS.FRIEND_REQUESTS));
  const request: FriendRequest = {
    id: requestRef.id,
    fromUserId,
    toUserId,
    status: 'pending',
    message,
    createdAt: new Date().toISOString(),
  };
  await setDoc(requestRef, request);

  // Create notification for recipient
  await createNotification(toUserId, 'friend_request', fromUserId, '', 'đã gửi lời mời kết bạn', request.id);

  return request;
}

export async function respondToFriendRequest(
  requestId: string,
  accept: boolean
): Promise<Friendship | null> {
  const requestRef = doc(db, COLLECTIONS.FRIEND_REQUESTS, requestId);
  const requestDoc = await getDoc(requestRef);

  if (!requestDoc.exists()) return null;

  const request = requestDoc.data() as FriendRequest;

  await updateDoc(requestRef, {
    status: accept ? 'accepted' : 'rejected',
    respondedAt: new Date().toISOString(),
  });

  if (accept) {
    // Create friendship
    const friendship = await createFriendship(request.fromUserId, request.toUserId);

    // Notify sender that request was accepted
    await createNotification(
      request.fromUserId,
      'friend_accepted',
      request.toUserId,
      '',
      'đã chấp nhận lời mời kết bạn',
      friendship.id
    );

    return friendship;
  }

  return null;
}

export async function getPendingRequestsForUser(userId: string): Promise<FriendRequest[]> {
  const q = query(
    collection(db, COLLECTIONS.FRIEND_REQUESTS),
    where('toUserId', '==', userId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as FriendRequest);
}

export async function getSentRequestsForUser(userId: string): Promise<FriendRequest[]> {
  const q = query(
    collection(db, COLLECTIONS.FRIEND_REQUESTS),
    where('fromUserId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as FriendRequest);
}

export function subscribeToPendingRequests(
  userId: string,
  callback: (requests: FriendRequest[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.FRIEND_REQUESTS),
    where('toUserId', '==', userId),
    where('status', '==', 'pending')
  );
  return onSnapshot(q, snapshot => {
    const requests = snapshot.docs.map(doc => doc.data() as FriendRequest);
    requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(requests);
  });
}

export async function cancelFriendRequest(requestId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.FRIEND_REQUESTS, requestId));
}

// Check if request already exists between two users
export async function checkExistingRequest(userId1: string, userId2: string): Promise<FriendRequest | null> {
  const q1 = query(
    collection(db, COLLECTIONS.FRIEND_REQUESTS),
    where('fromUserId', '==', userId1),
    where('toUserId', '==', userId2),
    where('status', '==', 'pending')
  );
  const q2 = query(
    collection(db, COLLECTIONS.FRIEND_REQUESTS),
    where('fromUserId', '==', userId2),
    where('toUserId', '==', userId1),
    where('status', '==', 'pending')
  );

  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  if (!snap1.empty) return snap1.docs[0].data() as FriendRequest;
  if (!snap2.empty) return snap2.docs[0].data() as FriendRequest;
  return null;
}

// ============ FRIENDSHIPS ============

async function createFriendship(userId1: string, userId2: string): Promise<Friendship> {
  // Always store with userId1 < userId2 for consistency
  const [first, second] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

  const friendshipRef = doc(collection(db, COLLECTIONS.FRIENDSHIPS));
  const friendship: Friendship = {
    id: friendshipRef.id,
    userId1: first,
    userId2: second,
    createdAt: new Date().toISOString(),
  };
  await setDoc(friendshipRef, friendship);
  return friendship;
}

export async function getFriendships(userId: string): Promise<Friendship[]> {
  const q1 = query(collection(db, COLLECTIONS.FRIENDSHIPS), where('userId1', '==', userId));
  const q2 = query(collection(db, COLLECTIONS.FRIENDSHIPS), where('userId2', '==', userId));

  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  const friendships = [
    ...snap1.docs.map(doc => doc.data() as Friendship),
    ...snap2.docs.map(doc => doc.data() as Friendship),
  ];
  return friendships;
}

export function subscribeToFriendships(
  userId: string,
  callback: (friendships: Friendship[]) => void
): Unsubscribe {
  // We need to subscribe to both queries and combine results
  let friendships1: Friendship[] = [];
  let friendships2: Friendship[] = [];

  const q1 = query(collection(db, COLLECTIONS.FRIENDSHIPS), where('userId1', '==', userId));
  const q2 = query(collection(db, COLLECTIONS.FRIENDSHIPS), where('userId2', '==', userId));

  const unsub1 = onSnapshot(q1, snapshot => {
    friendships1 = snapshot.docs.map(doc => doc.data() as Friendship);
    callback([...friendships1, ...friendships2]);
  });

  const unsub2 = onSnapshot(q2, snapshot => {
    friendships2 = snapshot.docs.map(doc => doc.data() as Friendship);
    callback([...friendships1, ...friendships2]);
  });

  return () => {
    unsub1();
    unsub2();
  };
}

export async function removeFriendship(friendshipId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.FRIENDSHIPS, friendshipId));
}

export async function checkFriendship(userId1: string, userId2: string): Promise<Friendship | null> {
  const [first, second] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
  const q = query(
    collection(db, COLLECTIONS.FRIENDSHIPS),
    where('userId1', '==', first),
    where('userId2', '==', second)
  );
  const snapshot = await getDocs(q);
  return snapshot.empty ? null : (snapshot.docs[0].data() as Friendship);
}

// ============ GAME INVITATIONS ============

export async function sendGameInvitation(
  gameId: string,
  gameCode: string,
  gameTitle: string,
  fromUserId: string,
  toUserId: string
): Promise<GameInvitation> {
  const inviteRef = doc(collection(db, COLLECTIONS.GAME_INVITATIONS));
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes

  const invitation: GameInvitation = {
    id: inviteRef.id,
    gameId,
    gameCode,
    gameTitle,
    fromUserId,
    toUserId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt,
  };
  await setDoc(inviteRef, invitation);

  // Create notification
  await createNotification(
    toUserId,
    'game_invitation',
    fromUserId,
    '',
    `mời bạn chơi game "${gameTitle}"`,
    invitation.id
  );

  return invitation;
}

export async function respondToGameInvitation(
  invitationId: string,
  accept: boolean
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.GAME_INVITATIONS, invitationId), {
    status: accept ? 'accepted' : 'declined',
  });
}

export function subscribeToGameInvitations(
  userId: string,
  callback: (invitations: GameInvitation[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.GAME_INVITATIONS),
    where('toUserId', '==', userId),
    where('status', '==', 'pending')
  );
  return onSnapshot(q, snapshot => {
    const invitations = snapshot.docs.map(doc => doc.data() as GameInvitation);
    // Filter out expired
    const now = new Date().toISOString();
    const valid = invitations.filter(i => i.expiresAt > now);
    callback(valid);
  });
}

// ============ BADGE GIFTS ============

export async function sendBadgeGift(
  badgeType: BadgeType,
  fromUserId: string,
  toUserId: string,
  fromUserName: string,
  message?: string
): Promise<BadgeGift> {
  const giftRef = doc(collection(db, COLLECTIONS.BADGE_GIFTS));
  const gift: BadgeGift = {
    id: giftRef.id,
    badgeType,
    fromUserId,
    toUserId,
    message,
    createdAt: new Date().toISOString(),
  };
  await setDoc(giftRef, gift);

  // Update badge stats for both users
  await Promise.all([
    updateBadgeStatsSent(fromUserId, badgeType),
    updateBadgeStatsReceived(toUserId, badgeType),
  ]);

  // Create notification
  await createNotification(
    toUserId,
    'badge_received',
    fromUserId,
    fromUserName,
    `đã tặng bạn huy hiệu`,
    gift.id
  );

  return gift;
}

export async function getReceivedBadges(userId: string): Promise<BadgeGift[]> {
  const q = query(
    collection(db, COLLECTIONS.BADGE_GIFTS),
    where('toUserId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as BadgeGift);
}

export async function getSentBadges(userId: string): Promise<BadgeGift[]> {
  const q = query(
    collection(db, COLLECTIONS.BADGE_GIFTS),
    where('fromUserId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as BadgeGift);
}

export function subscribeToReceivedBadges(
  userId: string,
  callback: (badges: BadgeGift[]) => void
): Unsubscribe {
  // Query without orderBy to avoid composite index requirement
  const q = query(
    collection(db, COLLECTIONS.BADGE_GIFTS),
    where('toUserId', '==', userId)
  );
  return onSnapshot(q, snapshot => {
    // Sort client-side by createdAt descending
    const badges = snapshot.docs
      .map(doc => doc.data() as BadgeGift)
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    callback(badges);
  });
}

// ============ BADGE STATS ============

async function updateBadgeStatsReceived(userId: string, badgeType: BadgeType): Promise<void> {
  const statsRef = doc(db, COLLECTIONS.BADGE_STATS, userId);
  const statsDoc = await getDoc(statsRef);

  if (statsDoc.exists()) {
    await updateDoc(statsRef, {
      [`receivedCounts.${badgeType}`]: increment(1),
      totalReceived: increment(1),
    });
  } else {
    const stats = createEmptyBadgeStats(userId);
    stats.receivedCounts[badgeType] = 1;
    stats.totalReceived = 1;
    await setDoc(statsRef, stats);
  }
}

async function updateBadgeStatsSent(userId: string, badgeType: BadgeType): Promise<void> {
  const statsRef = doc(db, COLLECTIONS.BADGE_STATS, userId);
  const statsDoc = await getDoc(statsRef);

  if (statsDoc.exists()) {
    await updateDoc(statsRef, {
      [`sentCounts.${badgeType}`]: increment(1),
      totalSent: increment(1),
    });
  } else {
    const stats = createEmptyBadgeStats(userId);
    stats.sentCounts[badgeType] = 1;
    stats.totalSent = 1;
    await setDoc(statsRef, stats);
  }
}

export async function getBadgeStats(userId: string): Promise<UserBadgeStats> {
  const statsRef = doc(db, COLLECTIONS.BADGE_STATS, userId);
  const statsDoc = await getDoc(statsRef);

  if (statsDoc.exists()) {
    return statsDoc.data() as UserBadgeStats;
  }
  return createEmptyBadgeStats(userId);
}

export function subscribeToBadgeStats(
  userId: string,
  callback: (stats: UserBadgeStats) => void
): Unsubscribe {
  const statsRef = doc(db, COLLECTIONS.BADGE_STATS, userId);
  return onSnapshot(statsRef, snapshot => {
    if (snapshot.exists()) {
      callback(snapshot.data() as UserBadgeStats);
    } else {
      callback(createEmptyBadgeStats(userId));
    }
  });
}

// ============ NOTIFICATIONS ============

async function createNotification(
  userId: string,
  type: FriendNotificationType,
  fromUserId: string,
  fromUserName: string,
  message: string,
  relatedId?: string
): Promise<void> {
  const notifRef = doc(collection(db, COLLECTIONS.FRIEND_NOTIFICATIONS));
  const notification: FriendNotification = {
    id: notifRef.id,
    userId,
    type,
    fromUserId,
    fromUserName,
    message,
    relatedId,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  await setDoc(notifRef, notification);
}

export function subscribeToFriendNotifications(
  userId: string,
  callback: (notifications: FriendNotification[]) => void
): Unsubscribe {
  // Query without orderBy to avoid composite index requirement
  const q = query(
    collection(db, COLLECTIONS.FRIEND_NOTIFICATIONS),
    where('userId', '==', userId)
  );
  return onSnapshot(q, snapshot => {
    // Sort client-side by createdAt descending
    const notifications = snapshot.docs
      .map(doc => doc.data() as FriendNotification)
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    callback(notifications);
  });
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.FRIEND_NOTIFICATIONS, notificationId), {
    isRead: true,
  });
}

export async function markAllFriendNotificationsAsRead(userId: string): Promise<void> {
  const q = query(
    collection(db, COLLECTIONS.FRIEND_NOTIFICATIONS),
    where('userId', '==', userId),
    where('isRead', '==', false)
  );
  const snapshot = await getDocs(q);

  await Promise.all(
    snapshot.docs.map(doc => updateDoc(doc.ref, { isRead: true }))
  );
}
