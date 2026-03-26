// Left sidebar navigation component

import { useState, useMemo, useCallback, useEffect, type ReactNode } from 'react';
import type { CurrentUser } from '../../types/user';
import type { Page } from './header';
import { isImageAvatar } from '../../utils/avatar-icons';
import {
  Home,
  Layers,
  Gamepad2,
  Award,
  MessageCircle,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  School,
  Bell,
  Building2,
  BookOpen,
  Headphones,
  FileText,
  BookOpenCheck,
  LayoutGrid,
  User,
  ClipboardList,
  Users,
  BarChart3,
  Crown,
  Shield,
  PenTool,
  Mic,
  TrendingUp,
  MessageSquare,
  GraduationCap,
  DollarSign,
} from 'lucide-react';
import { useClassroomNotifications } from '../../hooks/use-classrooms';
import { useFriendNotifications } from '../../hooks/use-friendships';
import { useCenterOptional } from '../../contexts/center-context';
import { BRANCH_MEMBER_ROLE_LABELS, BRANCH_MEMBER_ROLE_COLORS } from '../../types/branch';
import { useAchievementContextOptional } from '../../contexts/achievement-context';
import { SidebarNotifications } from './sidebar-notifications';

interface DailyWordsNotification {
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

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  currentUser: CurrentUser | null;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  dailyWordsNotification?: DailyWordsNotification;
}

interface NavItem {
  page: Page;
  label: string;
  icon: ReactNode;
  roles?: string[]; // If specified, only show for these roles
}

interface NavSection {
  id: string;
  title: string;
  emoji: string;
  items: NavItem[];
  defaultExpanded?: boolean;
  roles?: string[]; // If specified, entire section only visible for these roles
}

const iconProps = { size: 20, strokeWidth: 1.75 };

// ── Regular (non-center) nav sections ──────────────────────────────────────
const regularSections: NavSection[] = [
  {
    id: 'learning',
    title: 'Học tập',
    emoji: '📚',
    defaultExpanded: true,
    items: [
      { page: 'home', label: 'Trang chủ', icon: <Home {...iconProps} /> },
      { page: 'study', label: 'Từ Vựng', icon: <Layers {...iconProps} /> },
      { page: 'grammar-study', label: 'Ngữ Pháp', icon: <FileText {...iconProps} /> },
      { page: 'kanji-study', label: 'Hán Tự', icon: <BookOpen {...iconProps} /> },
      { page: 'reading', label: 'Đọc Hiểu', icon: <BookOpenCheck {...iconProps} /> },
      { page: 'listening', label: 'Nghe Hiểu', icon: <Headphones {...iconProps} /> },
      { page: 'exercises', label: 'Bài Tập', icon: <ClipboardList {...iconProps} /> },
      { page: 'conjugation' as Page, label: 'Chia Động Từ', icon: <PenTool {...iconProps} /> },
      { page: 'pronunciation' as Page, label: 'Phát Âm', icon: <Mic {...iconProps} /> },
      { page: 'cards', label: 'Quản lý thẻ', icon: <LayoutGrid {...iconProps} />, roles: ['admin', 'super_admin'] },
    ],
  },
  {
    id: 'games',
    title: 'Trò chơi',
    emoji: '🎮',
    defaultExpanded: false,
    items: [
      { page: 'game-hub', label: 'Game Hub', icon: <Gamepad2 {...iconProps} /> },
      { page: 'jlpt', label: 'JLPT Practice', icon: <Award {...iconProps} /> },
    ],
  },
  {
    id: 'communication',
    title: 'Giao tiếp',
    emoji: '💬',
    defaultExpanded: false,
    items: [
      { page: 'kaiwa', label: 'Hội thoại', icon: <MessageCircle {...iconProps} />, roles: ['vip_user', 'admin', 'super_admin', 'director', 'branch_admin', 'main_teacher'] },
      { page: 'classroom', label: 'Lớp Học', icon: <School {...iconProps} /> },
      { page: 'lectures', label: 'Bài giảng', icon: <GraduationCap {...iconProps} /> },
      { page: 'chat', label: 'Chat', icon: <MessageSquare {...iconProps} /> },
    ],
  },
  {
    id: 'management',
    title: 'Quản lý',
    emoji: '🏫',
    defaultExpanded: false,
    roles: ['admin', 'super_admin', 'director', 'branch_admin', 'main_teacher'],
    items: [
      { page: 'branches', label: 'Chi nhánh', icon: <Building2 {...iconProps} />, roles: ['director', 'branch_admin', 'super_admin'] },
      { page: 'teachers', label: 'Quản lý GV', icon: <Users {...iconProps} />, roles: ['admin', 'super_admin', 'director', 'branch_admin'] },
      { page: 'salary', label: 'Lương', icon: <DollarSign {...iconProps} />, roles: ['admin', 'super_admin', 'director', 'branch_admin'] },
      { page: 'permissions', label: 'Phân quyền', icon: <Shield {...iconProps} />, roles: ['super_admin'] },
    ],
  },
  {
    id: 'personal',
    title: 'Cá nhân',
    emoji: '📊',
    defaultExpanded: true,
    items: [
      { page: 'progress', label: 'Tiến độ', icon: <TrendingUp {...iconProps} /> },
      { page: 'analytics' as Page, label: 'Phân tích', icon: <BarChart3 {...iconProps} /> },
      { page: 'notifications', label: 'Thông báo', icon: <Bell {...iconProps} /> },
      { page: 'pricing', label: 'Nâng cấp', icon: <Crown {...iconProps} /> },
      { page: 'settings', label: 'Cài đặt', icon: <Settings {...iconProps} /> },
    ],
  },
];

// ── Center-mode sections ────────────────────────────────────────────────────
const centerLearningSectionItems: NavItem[] = [
  { page: 'home', label: 'Trang chủ', icon: <Home {...iconProps} /> },
  { page: 'study', label: 'Từ Vựng', icon: <Layers {...iconProps} /> },
  { page: 'grammar-study', label: 'Ngữ Pháp', icon: <FileText {...iconProps} /> },
  { page: 'kanji-study', label: 'Hán Tự', icon: <BookOpen {...iconProps} /> },
  { page: 'reading', label: 'Đọc Hiểu', icon: <BookOpenCheck {...iconProps} /> },
  { page: 'listening', label: 'Nghe Hiểu', icon: <Headphones {...iconProps} /> },
  { page: 'exercises', label: 'Bài Tập', icon: <ClipboardList {...iconProps} /> },
];

const centerActivitySectionItems: NavItem[] = [
  { page: 'classroom', label: 'Lớp Học', icon: <School {...iconProps} /> },
  { page: 'jlpt', label: 'JLPT', icon: <Award {...iconProps} /> },
  { page: 'game-hub', label: 'Game', icon: <Gamepad2 {...iconProps} /> },
  { page: 'center-members', label: 'Thành viên', icon: <Users {...iconProps} /> },
];

const centerAdminSectionItems: NavItem[] = [
  { page: 'center-dashboard', label: 'Dashboard TT', icon: <BarChart3 {...iconProps} /> },
  { page: 'cards', label: 'Quản lý nội dung', icon: <LayoutGrid {...iconProps} /> },
];

// Build center nav sections
function buildCenterSections(isCenterAdmin: boolean): NavSection[] {
  const sections: NavSection[] = [
    {
      id: 'learning',
      title: 'Học tập',
      emoji: '📚',
      defaultExpanded: true,
      items: centerLearningSectionItems,
    },
    {
      id: 'activities',
      title: 'Hoạt động',
      emoji: '🎮',
      defaultExpanded: true,
      items: centerActivitySectionItems,
    },
  ];
  if (isCenterAdmin) {
    sections.push({
      id: 'centerAdmin',
      title: 'Quản lý TT',
      emoji: '🏫',
      defaultExpanded: false,
      items: centerAdminSectionItems,
    });
  }
  return sections;
}

// ── localStorage helpers ────────────────────────────────────────────────────
const LS_KEY = 'sidebar-sections-state';

function loadSectionState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function saveSectionState(state: Record<string, boolean>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

// ── SidebarSection sub-component ───────────────────────────────────────────
interface SidebarSectionProps {
  section: NavSection;
  currentPage: Page;
  isCollapsed: boolean; // sidebar icon-only mode
  canAccess: (item: NavItem) => boolean;
  renderNavItem: (item: NavItem) => ReactNode;
  expanded: boolean;
  onToggle: () => void;
}

function SidebarSection({
  section,
  currentPage,
  isCollapsed,
  canAccess,
  renderNavItem,
  expanded,
  onToggle,
}: SidebarSectionProps) {
  const visibleItems = section.items.filter(canAccess);
  if (visibleItems.length === 0) return null;

  // Check if any item in section is currently active
  const hasActiveItem = visibleItems.some(item => item.page === currentPage);

  // In collapsed (icon-only) mode, show items without headers
  if (isCollapsed) {
    return (
      <div className="sidebar-section sidebar-section--collapsed">
        <div className="sidebar-nav-separator" />
        {visibleItems.map(item => renderNavItem(item))}
      </div>
    );
  }

  return (
    <div className={`sidebar-section ${hasActiveItem ? 'sidebar-section--has-active' : ''}`}>
      <button
        className="sidebar-section-header"
        onClick={onToggle}
        aria-expanded={expanded}
        title={section.title}
      >
        <span className="sidebar-section-title">
          {section.title}
        </span>
        <ChevronDown
          size={14}
          className={`sidebar-section-chevron ${expanded ? 'expanded' : ''}`}
        />
      </button>

      <div
        className={`sidebar-section-content ${expanded ? 'expanded' : ''}`}
        aria-hidden={!expanded}
      >
        {visibleItems.map(item => renderNavItem(item))}
      </div>
    </div>
  );
}

// ── Main Sidebar component ──────────────────────────────────────────────────
export function Sidebar({
  currentPage,
  onNavigate,
  currentUser,
  onLogout,
  isCollapsed,
  onToggleCollapse,
  dailyWordsNotification,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const centerCtx = useCenterOptional();
  const achievementCtx = useAchievementContextOptional();

  // Classroom notifications
  const { notifications: classroomNotifications, unreadCount: classroomUnread, markAsRead: markClassroomRead, markAllAsRead: markAllClassroomRead } = useClassroomNotifications(currentUser?.id || null);

  // Friend notifications (including badge received)
  const { notifications: friendNotifications, unreadCount: friendUnread, markAsRead: markFriendRead, markAllAsRead: markAllFriendRead } = useFriendNotifications(currentUser?.id || null);

  // Daily words notification flag - use new showNotification prop
  const hasDailyWordsReminder = dailyWordsNotification?.showNotification ?? false;

  // Combined notifications
  const totalUnread = classroomUnread + friendUnread + (hasDailyWordsReminder ? 1 : 0);

  // Determine nav sections based on center context
  const navSections = useMemo(() => {
    if (centerCtx) {
      return buildCenterSections(centerCtx.isAdmin);
    }
    return regularSections;
  }, [centerCtx]);

  // Section expanded/collapsed state — initialized from localStorage + defaults
  const [sectionExpanded, setSectionExpanded] = useState<Record<string, boolean>>(() => {
    const saved = loadSectionState();
    const result: Record<string, boolean> = {};
    for (const section of navSections) {
      result[section.id] = saved[section.id] ?? (section.defaultExpanded ?? false);
    }
    return result;
  });

  // When sidebar is collapsed (icon-only) or on mobile-open, we don't need section state
  // Re-sync when navSections change (center vs regular)
  useEffect(() => {
    setSectionExpanded(prev => {
      const saved = loadSectionState();
      const result: Record<string, boolean> = {};
      for (const section of navSections) {
        result[section.id] = prev[section.id] ?? saved[section.id] ?? (section.defaultExpanded ?? false);
      }
      return result;
    });
  }, [navSections]);

  const toggleSection = useCallback((sectionId: string) => {
    setSectionExpanded(prev => {
      const next = { ...prev, [sectionId]: !prev[sectionId] };
      saveSectionState(next);
      return next;
    });
  }, []);

  const handleNavigate = (page: Page) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  const canAccess = useCallback((item: NavItem): boolean => {
    if (!item.roles) return true;
    if (!currentUser) return false;
    return item.roles.includes(currentUser.role);
  }, [currentUser]);

  const canAccessSection = useCallback((section: NavSection): boolean => {
    if (!section.roles) return true;
    if (!currentUser) return false;
    return section.roles.some(r => currentUser.role === r);
  }, [currentUser]);

  // Get avatar value for display
  const avatarValue = currentUser?.avatar;
  const isAvatarImage = avatarValue ? isImageAvatar(avatarValue) : false;

  const renderNavItem = useCallback((item: NavItem) => {
    // In center mode, skip role checks on user's app role (center role determines access)
    if (!centerCtx && !canAccess(item)) return null;
    return (
      <button
        key={item.page}
        className={`sidebar-nav-btn ${currentPage === item.page ? 'active' : ''}`}
        onClick={() => handleNavigate(item.page)}
        title={isCollapsed ? item.label : undefined}
      >
        <span className="sidebar-nav-icon">{item.icon}</span>
        {!isCollapsed && <span className="sidebar-nav-label">{item.label}</span>}
        {/* Daily mission progress badge on Home */}
        {item.page === 'home' && achievementCtx && achievementCtx.missions.length > 0 && !achievementCtx.allMissionsCompleted && !isCollapsed && (
          <span className="sidebar-mission-badge">
            {achievementCtx.missions.filter(m => m.isCompleted).length}/{achievementCtx.missions.length}
          </span>
        )}
      </button>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, isCollapsed, centerCtx, canAccess, achievementCtx]);

  return (
    <>
      {/* Mobile hamburger — fixed top-left, no title bar */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        <span className={`hamburger-icon ${mobileOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo/Title */}
        <div className="sidebar-header">
          {centerCtx && centerCtx.branding.logo && !isCollapsed ? (
            <img src={centerCtx.branding.logo} alt={centerCtx.center.name} className="sidebar-center-logo" />
          ) : (
            <h1 className="sidebar-title">
              {centerCtx ? (isCollapsed ? centerCtx.center.name.charAt(0) : centerCtx.center.name) : (isCollapsed ? 'S' : 'Shinko 日本語')}
            </h1>
          )}
          <button
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* User info */}
        {currentUser && (
          <div className={`sidebar-user ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Notification bell - only show when sidebar is expanded */}
            {!isCollapsed && (
              <button
                className="sidebar-notification-btn"
                onClick={() => { setShowNotifications(!showNotifications); setShowAvatarMenu(false); }}
                title="Thông báo"
                aria-label={`Thông báo${totalUnread > 0 ? `, ${totalUnread} chưa đọc` : ''}`}
              >
                <Bell size={18} />
                {totalUnread > 0 && (
                  <span className="notification-badge-count">{totalUnread > 9 ? '9+' : totalUnread}</span>
                )}
              </button>
            )}

            {/* Avatar - centered, clickable */}
            <div className="sidebar-avatar-wrapper">
              <button
                className={`sidebar-user-avatar ${isAvatarImage ? 'has-image' : ''}`}
                onClick={() => { setShowAvatarMenu(!showAvatarMenu); setShowNotifications(false); }}
                title={isCollapsed ? (currentUser.displayName || currentUser.username) : undefined}
                aria-label={`Menu tài khoản của ${currentUser.displayName || currentUser.username}`}
                style={isAvatarImage ? { backgroundImage: `url(${avatarValue})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
              >
                {!isAvatarImage && (avatarValue || (currentUser.displayName || currentUser.username).charAt(0).toUpperCase())}
              </button>

              {/* Avatar dropdown menu */}
              {showAvatarMenu && (
                <div className="sidebar-avatar-menu">
                  <button
                    className="avatar-menu-item"
                    onClick={() => { onNavigate('settings'); setShowAvatarMenu(false); setMobileOpen(false); }}
                  >
                    <Settings size={16} /> Cài đặt
                  </button>
                  <button
                    className="avatar-menu-item"
                    onClick={() => { onNavigate('profile'); setShowAvatarMenu(false); setMobileOpen(false); }}
                  >
                    <User size={16} /> Cá nhân
                  </button>
                  <button
                    className="avatar-menu-item logout"
                    onClick={() => { onLogout(); setShowAvatarMenu(false); }}
                  >
                    <LogOut size={16} /> Đăng xuất
                  </button>
                </div>
              )}
            </div>

            {/* Username + center role badge - below avatar */}
            {!isCollapsed && (
              <span className={`sidebar-username role-name-${currentUser.role}`}>
                {currentUser.displayName || currentUser.username}
                {centerCtx && centerCtx.userRole && (
                  <span
                    className="sidebar-center-role-badge"
                    style={{
                      backgroundColor: centerCtx.userRole === 'director'
                        ? '#e74c3c'
                        : BRANCH_MEMBER_ROLE_COLORS[centerCtx.userRole as keyof typeof BRANCH_MEMBER_ROLE_COLORS] || '#888',
                    }}
                  >
                    {centerCtx.userRole === 'director'
                      ? 'Giám đốc'
                      : BRANCH_MEMBER_ROLE_LABELS[centerCtx.userRole as keyof typeof BRANCH_MEMBER_ROLE_LABELS] || centerCtx.userRole}
                  </span>
                )}
              </span>
            )}

            {/* Notification dropdown — extracted to sidebar-notifications.tsx */}
            {showNotifications && (
              <SidebarNotifications
                classroomNotifications={classroomNotifications}
                friendNotifications={friendNotifications}
                dailyWordsNotification={dailyWordsNotification ? {
                  progress: dailyWordsNotification.progress,
                  streak: dailyWordsNotification.streak,
                  onDismiss: dailyWordsNotification.onDismiss,
                  onOpenModal: dailyWordsNotification.onOpenModal,
                } : null}
                hasDailyWordsReminder={hasDailyWordsReminder}
                totalUnread={totalUnread}
                onMarkAllClassroomRead={markAllClassroomRead}
                onMarkAllFriendRead={markAllFriendRead}
                onMarkClassroomRead={markClassroomRead}
                onMarkFriendRead={markFriendRead}
                onNavigate={onNavigate}
                onClose={() => setShowNotifications(false)}
              />
        )}
          </div>
        )}

        {/* Navigation - grouped collapsible sections */}
        <nav className="sidebar-nav">
          {navSections.map(section => {
            // Section-level role check (non-center mode only)
            if (!centerCtx && !canAccessSection(section)) return null;
            return (
              <SidebarSection
                key={section.id}
                section={section}
                currentPage={currentPage}
                isCollapsed={isCollapsed}
                canAccess={canAccess}
                renderNavItem={renderNavItem}
                expanded={sectionExpanded[section.id] ?? (section.defaultExpanded ?? false)}
                onToggle={() => toggleSection(section.id)}
              />
            );
          })}
        </nav>

      </aside>
    </>
  );
}
