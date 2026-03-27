import type { ReactNode } from 'react';
import './tab-bar.css';

export interface Tab<T extends string> {
  key: T;
  label: string;
  icon?: ReactNode;
  badge?: number;
}

interface TabBarProps<T extends string> {
  tabs: Tab<T>[];
  active: T;
  onChange: (tab: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function TabBar<T extends string>({ tabs, active, onChange, className, size = 'md' }: TabBarProps<T>) {
  return (
    <div className={`tb-bar${size === 'sm' ? ' tb-bar--sm' : ''}${className ? ` ${className}` : ''}`}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={`tb-tab${active === tab.key ? ' tb-tab--active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.icon && <span className="tb-icon">{tab.icon}</span>}
          <span>{tab.label}</span>
          {tab.badge !== undefined && tab.badge > 0 && (
            <span className="tb-badge">{tab.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}
