// SidebarSection sub-component — collapsible nav group

import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Page } from './header';
import type { NavItem, NavSection } from './sidebar-nav-data';

export interface SidebarSectionProps {
  section: NavSection;
  currentPage: Page;
  isCollapsed: boolean; // sidebar icon-only mode
  canAccess: (item: NavItem) => boolean;
  renderNavItem: (item: NavItem) => ReactNode;
  expanded: boolean;
  onToggle: () => void;
}

export function SidebarSection({
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
