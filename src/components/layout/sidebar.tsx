// Left sidebar navigation component

import { useState, useMemo, useCallback, useEffect, type ReactNode } from 'react';
import type { Page } from './header';
import { useClassroomNotifications } from '../../hooks/use-classrooms';
import { useFriendNotifications } from '../../hooks/use-friendships';
import { useCenterOptional } from '../../contexts/center-context';
import { useAchievementContextOptional } from '../../contexts/achievement-context';
import {
  regularSections,
  buildCenterSections,
  loadSectionState,
  saveSectionState,
} from './sidebar-nav-data';
import type { NavItem } from './sidebar-nav-data';
import { SidebarSection } from './sidebar-section';
import { SidebarUser } from './sidebar-user';
import { SidebarHeader } from './sidebar-header';
export type { DailyWordsNotification, SidebarProps } from './sidebar-types';
import type { SidebarProps } from './sidebar-types';

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

  const { notifications: classroomNotifications, unreadCount: classroomUnread, markAsRead: markClassroomRead, markAllAsRead: markAllClassroomRead } = useClassroomNotifications(currentUser?.id || null);
  const { notifications: friendNotifications, unreadCount: friendUnread, markAsRead: markFriendRead, markAllAsRead: markAllFriendRead } = useFriendNotifications(currentUser?.id || null);
  const hasDailyWordsReminder = dailyWordsNotification?.showNotification ?? false;
  const totalUnread = classroomUnread + friendUnread + (hasDailyWordsReminder ? 1 : 0);

  const navSections = useMemo(() => {
    if (centerCtx) {
      return buildCenterSections(centerCtx.isAdmin);
    }
    return regularSections;
  }, [centerCtx]);

  const [sectionExpanded, setSectionExpanded] = useState<Record<string, boolean>>(() => {
    const saved = loadSectionState();
    const result: Record<string, boolean> = {};
    for (const section of navSections) {
      result[section.id] = saved[section.id] ?? (section.defaultExpanded ?? false);
    }
    return result;
  });

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

  const canAccessSection = useCallback((section: { roles?: string[] }): boolean => {
    if (!section.roles) return true;
    if (!currentUser) return false;
    return section.roles.some(r => currentUser.role === r);
  }, [currentUser]);

  const renderNavItem = useCallback((item: NavItem): ReactNode => {
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
      <button className="sidebar-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
        <span className={`hamburger-icon ${mobileOpen ? 'open' : ''}`}>
          <span></span><span></span><span></span>
        </span>
      </button>

      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <SidebarHeader
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
          centerName={centerCtx?.center.name}
          centerLogo={centerCtx?.branding.logo}
        />

        {currentUser && (
          <SidebarUser
            currentUser={currentUser}
            isCollapsed={isCollapsed}
            showNotifications={showNotifications}
            showAvatarMenu={showAvatarMenu}
            totalUnread={totalUnread}
            classroomNotifications={classroomNotifications}
            friendNotifications={friendNotifications}
            dailyWordsNotification={dailyWordsNotification}
            hasDailyWordsReminder={hasDailyWordsReminder}
            markClassroomRead={markClassroomRead}
            markAllClassroomRead={markAllClassroomRead}
            markFriendRead={markFriendRead}
            markAllFriendRead={markAllFriendRead}
            onToggleNotifications={() => { setShowNotifications(!showNotifications); setShowAvatarMenu(false); }}
            onToggleAvatarMenu={() => { setShowAvatarMenu(!showAvatarMenu); setShowNotifications(false); }}
            onNavigate={onNavigate}
            onLogout={onLogout}
            onCloseNotifications={() => setShowNotifications(false)}
            onCloseAvatarMenu={() => setShowAvatarMenu(false)}
            onCloseMobile={() => setMobileOpen(false)}
          />
        )}

        <nav className="sidebar-nav">
          {navSections.map(section => {
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
