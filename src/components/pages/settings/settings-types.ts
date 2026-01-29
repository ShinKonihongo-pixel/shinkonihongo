// Settings page types - All TypeScript interfaces and types
// Extracted from settings-page.tsx for better maintainability

import type { AppSettings, GlobalTheme } from '../../../hooks/use-settings';
import type { CurrentUser, StudySession, GameSession, JLPTSession, UserStats, User } from '../../../types/user';
import type { Flashcard, Lesson } from '../../../types/flashcard';
import type { BadgeType, FriendWithUser, UserBadgeStats, BadgeGift } from '../../../types/friendship';
import type { ExportData } from '../../../lib/data-export';

// Device type for responsive font sizing
export type DeviceType = 'desktop' | 'tablet' | 'mobile';

// Settings tab types
export type SettingsTab = 'general' | 'profile' | 'friends';
export type GeneralSubTab = 'flashcard' | 'study' | 'grammar' | 'game' | 'kaiwa' | 'system';

// Theme preset interface
export interface ThemePreset {
  name: string;
  primary: string;
  dark: string;
  gradient: string;
}

// Pending friend request interface
export interface PendingFriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  message?: string;
  createdAt: string;
}

// Main settings page props
export interface SettingsPageProps {
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onReset: () => void;
  // Initial tab to show (for navigation from profile page)
  initialTab?: SettingsTab;
  // Profile management props
  currentUser?: CurrentUser | null;
  onUpdateDisplayName?: (displayName: string) => Promise<{ success: boolean; error?: string }>;
  onChangePassword?: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateAvatar?: (avatar: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateProfileBackground?: (background: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateJlptLevel?: (level: string) => Promise<{ success: boolean; error?: string }>;
  // History props
  studySessions?: StudySession[];
  gameSessions?: GameSession[];
  jlptSessions?: JLPTSession[];
  stats?: UserStats;
  historyLoading?: boolean;
  // Theme settings (super_admin only)
  theme?: GlobalTheme;
  themePresets?: ThemePreset[];
  onApplyThemePreset?: (preset: ThemePreset) => void;
  onResetTheme?: () => void;
  // Export/Import props
  flashcards?: Flashcard[];
  lessons?: Lesson[];
  onImportData?: (data: ExportData) => Promise<void>;
  // Friends & Badges props
  allUsers?: User[];
  friends?: FriendWithUser[];
  pendingRequests?: PendingFriendRequest[];
  badgeStats?: UserBadgeStats | null;
  receivedBadges?: Array<BadgeGift & { fromUserName: string }>;
  friendsLoading?: boolean;
  onSendFriendRequest?: (toUserId: string, message?: string) => Promise<{ success: boolean; error?: string }>;
  onRespondFriendRequest?: (requestId: string, accept: boolean) => Promise<boolean>;
  onRemoveFriend?: (friendshipId: string) => Promise<boolean>;
  onSendBadge?: (badgeType: BadgeType, toUserId: string, message?: string) => Promise<boolean>;
  isFriend?: (userId: string) => boolean;
}

// Flashcard settings tab props
export interface FlashcardSettingsProps {
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

// Study settings tab props
export interface StudySettingsProps {
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

// Grammar settings tab props
export interface GrammarSettingsProps {
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

// Game settings tab props
export interface GameSettingsProps {
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

// Kaiwa settings tab props
export interface KaiwaSettingsProps {
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

// System settings tab props
export interface SystemSettingsProps {
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onReset: () => void;
  currentUser?: CurrentUser | null;
  theme?: GlobalTheme;
  themePresets?: ThemePreset[];
  onApplyThemePreset?: (preset: ThemePreset) => void;
  onResetTheme?: () => void;
  flashcards?: Flashcard[];
  lessons?: Lesson[];
  onImportData?: (data: ExportData) => Promise<void>;
}

// Profile tab props
export interface ProfileSettingsProps {
  currentUser?: CurrentUser | null;
  stats?: UserStats;
  historyLoading?: boolean;
  studySessions?: StudySession[];
  gameSessions?: GameSession[];
  jlptSessions?: JLPTSession[];
  onUpdateDisplayName?: (displayName: string) => Promise<{ success: boolean; error?: string }>;
  onChangePassword?: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateAvatar?: (avatar: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateProfileBackground?: (background: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateJlptLevel?: (level: string) => Promise<{ success: boolean; error?: string }>;
}

// Friends tab props
export interface FriendsSettingsProps {
  currentUser?: CurrentUser | null;
  allUsers?: User[];
  friends?: FriendWithUser[];
  pendingRequests?: PendingFriendRequest[];
  badgeStats?: UserBadgeStats | null;
  receivedBadges?: Array<BadgeGift & { fromUserName: string }>;
  friendsLoading?: boolean;
  onSendFriendRequest?: (toUserId: string, message?: string) => Promise<{ success: boolean; error?: string }>;
  onRespondFriendRequest?: (requestId: string, accept: boolean) => Promise<boolean>;
  onRemoveFriend?: (friendshipId: string) => Promise<boolean>;
  onSendBadge?: (badgeType: BadgeType, toUserId: string, message?: string) => Promise<boolean>;
  isFriend?: (userId: string) => boolean;
}
