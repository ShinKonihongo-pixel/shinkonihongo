// SidebarHeader — logo/title area and collapse toggle button

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  centerName?: string;
  centerLogo?: string;
}

export function SidebarHeader({
  isCollapsed,
  onToggleCollapse,
  centerName,
  centerLogo,
}: SidebarHeaderProps) {
  return (
    <div className="sidebar-header">
      {centerLogo && !isCollapsed ? (
        <img src={centerLogo} alt={centerName} className="sidebar-center-logo" />
      ) : (
        <h1 className="sidebar-title">
          {centerName
            ? (isCollapsed ? centerName.charAt(0) : centerName)
            : (isCollapsed ? 'S' : 'Shinko 日本語')}
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
  );
}
