// Friendship and Badge system types

// ============ FRIENDSHIP ============

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

// Friend request from one user to another
export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  message?: string;
  createdAt: string;
  respondedAt?: string;
}

// Confirmed friendship between two users
export interface Friendship {
  id: string;
  userId1: string;  // Alphabetically first userId
  userId2: string;  // Alphabetically second userId
  createdAt: string;
}

// Game invitation sent to a friend
export interface GameInvitation {
  id: string;
  gameId: string;
  gameCode: string;
  gameTitle: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
}

// ============ BADGES ============

export type BadgeType =
  | 'kanji_champion'       // Chiến thần Kanji
  | 'vocab_champion'       // Chiến thần Từ vựng
  | 'grammar_champion'     // Chiến thần Ngữ pháp
  | 'kaiwa_champion'       // Chiến thần Kaiwa
  | 'listening_champion'   // Chiến thần Nghe hiểu
  | 'attendance_champion'  // Chiến thần Chuyên cần
  | 'reading_champion'     // Chiến thần Đọc hiểu
  | 'smart_champion'       // Chiến thần Thông minh
  | 'helpful_angel';       // Thiên thần Giúp đỡ

export interface BadgeDefinition {
  type: BadgeType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

// All available badges with Vietnamese labels
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    type: 'kanji_champion',
    name: 'Chiến thần Kanji',
    description: 'Bạn giỏi Kanji lắm!',
    icon: '🏆',
    color: '#FF4757', // Vibrant red
  },
  {
    type: 'vocab_champion',
    name: 'Chiến thần Từ vựng',
    description: 'Vốn từ vựng phong phú!',
    icon: '📚',
    color: '#3742FA', // Deep blue
  },
  {
    type: 'grammar_champion',
    name: 'Chiến thần Ngữ pháp',
    description: 'Ngữ pháp chuẩn không cần chỉnh!',
    icon: '📝',
    color: '#A55EEA', // Bright purple
  },
  {
    type: 'kaiwa_champion',
    name: 'Chiến thần Kaiwa',
    description: 'Giao tiếp tiếng Nhật tự nhiên!',
    icon: '🗣️',
    color: '#2BCBBA', // Teal cyan
  },
  {
    type: 'listening_champion',
    name: 'Chiến thần Nghe hiểu',
    description: 'Tai nghe tiếng Nhật siêu tốt!',
    icon: '👂',
    color: '#FF9F43', // Warm orange
  },
  {
    type: 'attendance_champion',
    name: 'Chiến thần Chuyên cần',
    description: 'Đi học đều đặn, không nghỉ buổi nào!',
    icon: '📅',
    color: '#26DE81', // Bright green
  },
  {
    type: 'reading_champion',
    name: 'Chiến thần Đọc hiểu',
    description: 'Đọc hiểu tiếng Nhật xuất sắc!',
    icon: '📖',
    color: '#FC5C65', // Coral pink
  },
  {
    type: 'smart_champion',
    name: 'Chiến thần Thông minh',
    description: 'IQ cao, học gì cũng nhanh!',
    icon: '🧠',
    color: '#5F27CD', // Royal purple
  },
  {
    type: 'helpful_angel',
    name: 'Thiên thần Giúp đỡ',
    description: 'Luôn sẵn sàng giúp đỡ bạn bè!',
    icon: '❤️',
    color: '#FED330', // Golden yellow
  },
];

// Get badge definition by type
export function getBadgeDefinition(type: BadgeType): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find(b => b.type === type);
}

// Badge gift record - when someone sends a badge to another user
export interface BadgeGift {
  id: string;
  badgeType: BadgeType;
  fromUserId: string;
  toUserId: string;
  message?: string;
  createdAt: string;
}

// Badge statistics for a user
export interface UserBadgeStats {
  userId: string;
  receivedCounts: Record<BadgeType, number>;  // Count per badge type
  totalReceived: number;
  sentCounts: Record<BadgeType, number>;
  totalSent: number;
}

// Empty badge stats
export function createEmptyBadgeStats(userId: string): UserBadgeStats {
  const emptyCounts: Record<BadgeType, number> = {
    kanji_champion: 0,
    vocab_champion: 0,
    grammar_champion: 0,
    kaiwa_champion: 0,
    listening_champion: 0,
    attendance_champion: 0,
    reading_champion: 0,
    smart_champion: 0,
    helpful_angel: 0,
  };
  return {
    userId,
    receivedCounts: { ...emptyCounts },
    totalReceived: 0,
    sentCounts: { ...emptyCounts },
    totalSent: 0,
  };
}

// Friend with user details (for display)
export interface FriendWithUser {
  friendship: Friendship;
  friendId: string;
  friendName: string;
  friendAvatar?: string;
}

// Notification types for friendship
export type FriendNotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'game_invitation'
  | 'badge_received';

export interface FriendNotification {
  id: string;
  userId: string;  // Recipient
  type: FriendNotificationType;
  fromUserId: string;
  fromUserName: string;
  message: string;
  relatedId?: string;  // Request ID, Game ID, or Badge Gift ID
  isRead: boolean;
  createdAt: string;
}
