// Reusable stat display widget — value + label pattern
// Used across game results, dashboards, manager views, modals

import type { ReactNode } from 'react';
import './stat-card.css';

interface StatCardProps {
  value: ReactNode;
  label: string;
  icon?: ReactNode;
  className?: string;
}

/** Stat display: value on top, label below. Wrap in a container div for card styling. */
export function StatCard({ value, label, icon, className }: StatCardProps) {
  return (
    <div className={`sc-stat${className ? ` ${className}` : ''}`}>
      {icon && <span className="sc-icon">{icon}</span>}
      <span className="sc-value">{value}</span>
      <span className="sc-label">{label}</span>
    </div>
  );
}
