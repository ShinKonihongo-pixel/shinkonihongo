// Shared types for Sidebar components

import type { Page } from './header';
import type { CurrentUser } from '../../types/user';

export interface DailyWordsNotification {
  enabled: boolean;
  isCompleted: boolean;
  progress: {
    completed: number;
    target: number;
    percent: number;
  };
  streak: number;
  showNotification: boolean;
  onDismiss: () => void;
  onOpenModal: () => void;
}

export interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  currentUser: CurrentUser | null;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  dailyWordsNotification?: DailyWordsNotification;
}
