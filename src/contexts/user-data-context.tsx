// Context for user data: auth + history + social + notifications
// For auth-only consumers, prefer useAuthData() from auth-context.tsx

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { User, CurrentUser, UserRole, StudySession, GameSession, JLPTSession, UserStats } from '../types/user';
import type { FriendWithUser, BadgeGift, UserBadgeStats, BadgeType, FriendNotification, FriendRequest } from '../types/friendship';
import type { ClassroomNotification } from '../types/classroom';
import { AuthProvider, useAuthData } from './auth-context';
import { useUserHistory } from '../hooks/use-user-history';
import { useFriendships, useBadges, useGameInvitations, useFriendNotifications } from '../hooks/use-friendships';
import { useClassroomNotifications } from '../hooks/use-classrooms';

// ============ TYPE DEFINITIONS ============

export interface UserDataContextValue {
  // Auth
  currentUser: CurrentUser | null;
  users: User[];
  loading: boolean;
  isLoggedIn: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isVip: boolean;
  canAccessLocked: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (username: string, password: string, role?: UserRole, createdBy?: string) => Promise<{ success: boolean; error?: string }>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  changePassword: (userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateDisplayName: (userId: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  updateAvatar: (userId: string, avatar: string) => Promise<{ success: boolean; error?: string }>;
  updateProfileBackground: (userId: string, profileBackground: string) => Promise<{ success: boolean; error?: string }>;
  updateJlptLevel: (userId: string, jlptLevel: string) => Promise<{ success: boolean; error?: string }>;
  updateVipExpiration: (userId: string, expirationDate: string | undefined) => Promise<void>;

  // User history
  studySessions: StudySession[];
  gameSessions: GameSession[];
  jlptSessions: JLPTSession[];
  userStats: UserStats;
  historyLoading: boolean;
  addStudySession: (data: Omit<StudySession, 'id' | 'userId'>) => Promise<void>;
  addGameSession: (data: Omit<GameSession, 'id' | 'userId'>) => Promise<void>;
  addJLPTSession: (data: Omit<JLPTSession, 'id' | 'userId'>) => Promise<void>;

  // Friendships
  friendsWithUsers: FriendWithUser[];
  pendingRequests: Array<FriendRequest & {
    fromUserName: string;
    fromUserAvatar?: string;
  }>;
  friendsLoading: boolean;
  sendFriendRequest: (toUserId: string, message?: string) => Promise<{ success: boolean; error?: string }>;
  respondFriendRequest: (requestId: string, accept: boolean) => Promise<boolean>;
  removeFriend: (friendshipId: string) => Promise<boolean>;
  isFriend: (otherUserId: string) => boolean;

  // Badges
  receivedBadges: Array<BadgeGift & { fromUserName: string; fromUserAvatar?: string }>;
  badgeStats: UserBadgeStats | null;
  sendBadge: (badgeType: BadgeType, toUserId: string, message?: string) => Promise<boolean>;

  // Game invitations
  sendGameInvitation: (gameId: string, gameCode: string, gameTitle: string, toUserId: string) => Promise<boolean>;

  // Classroom notifications
  classroomNotifications: ClassroomNotification[];
  markClassroomRead: (notificationId: string) => Promise<boolean>;
  markAllClassroomRead: () => Promise<boolean>;

  // Friend notifications
  friendNotifications: FriendNotification[];
  markFriendRead: (notificationId: string) => Promise<boolean>;
  markAllFriendRead: () => Promise<boolean>;
}

// ============ CONTEXT ============

const UserDataContext = createContext<UserDataContextValue | null>(null);

// ============ PROVIDER ============

interface UserDataProviderProps {
  children: ReactNode;
}

/** Inner provider that reads from AuthContext and adds history/social/notification data */
function UserDataInnerProvider({ children }: UserDataProviderProps) {
  const auth = useAuthData();

  // History + social hooks (depend on auth.currentUser)
  const userHistory = useUserHistory(auth.currentUser?.id);
  const friendships = useFriendships(auth.currentUser?.id ?? null, auth.users);
  const badges = useBadges(auth.currentUser?.id ?? null, auth.users);
  const gameInvitations = useGameInvitations(auth.currentUser?.id ?? null);
  const classroomNotifs = useClassroomNotifications(auth.currentUser?.id ?? null);
  const friendNotifs = useFriendNotifications(auth.currentUser?.id ?? null);

  const value = useMemo<UserDataContextValue>(() => ({
    // Auth (pass-through from AuthContext)
    ...auth,

    // User history
    studySessions: userHistory.studySessions,
    gameSessions: userHistory.gameSessions,
    jlptSessions: userHistory.jlptSessions,
    userStats: userHistory.stats,
    historyLoading: userHistory.loading,
    addStudySession: userHistory.addStudySession,
    addGameSession: userHistory.addGameSession,
    addJLPTSession: userHistory.addJLPTSession,

    // Friendships
    friendsWithUsers: friendships.friendsWithUsers,
    pendingRequests: friendships.pendingRequests,
    friendsLoading: friendships.loading,
    sendFriendRequest: friendships.sendRequest,
    respondFriendRequest: friendships.respondToRequest,
    removeFriend: friendships.removeFriend,
    isFriend: friendships.isFriend,

    // Badges
    receivedBadges: badges.receivedBadges,
    badgeStats: badges.badgeStats,
    sendBadge: badges.sendBadge,

    // Game invitations
    sendGameInvitation: gameInvitations.sendInvitation,

    // Classroom notifications
    classroomNotifications: classroomNotifs.notifications,
    markClassroomRead: classroomNotifs.markAsRead,
    markAllClassroomRead: classroomNotifs.markAllAsRead,

    // Friend notifications
    friendNotifications: friendNotifs.notifications,
    markFriendRead: friendNotifs.markAsRead,
    markAllFriendRead: friendNotifs.markAllAsRead,
  }), [
    auth,
    userHistory,
    friendships,
    badges,
    gameInvitations,
    classroomNotifs,
    friendNotifs,
  ]);

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
}

/** Wraps children with AuthProvider + UserDataContext.
 *  Auth-only consumers can use useAuthData() to avoid social/notification re-renders. */
export function UserDataProvider({ children }: UserDataProviderProps) {
  return (
    <AuthProvider>
      <UserDataInnerProvider>{children}</UserDataInnerProvider>
    </AuthProvider>
  );
}

// ============ HOOK ============

export function useUserData(): UserDataContextValue {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within UserDataProvider');
  }
  return context;
}
