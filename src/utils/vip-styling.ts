// VIP Styling Utility - Shared helper functions for VIP/admin name effects
// Provides consistent styling across lobbies, leaderboards, results, and modals

import type { UserRole } from '../types/user';

// Roles that receive special VIP styling
export const VIP_ROLES: UserRole[] = ['vip_user', 'super_admin', 'director', 'admin'];

// Extended VIP roles including staff
export const STAFF_ROLES: UserRole[] = ['super_admin', 'director', 'branch_admin', 'main_teacher', 'part_time_teacher', 'assistant', 'admin'];

// Check if a role is VIP (special styling)
export function isVipRole(role?: string): boolean {
  return !!role && VIP_ROLES.includes(role as UserRole);
}

// Check if a role is staff
export function isStaffRole(role?: string): boolean {
  return !!role && STAFF_ROLES.includes(role as UserRole);
}

// Get CSS class names for VIP player container
export function getVipPlayerClasses(role?: string, baseClass?: string): string {
  const classes: string[] = [];
  if (baseClass) classes.push(baseClass);
  if (isVipRole(role)) {
    classes.push('vip-player');
    classes.push(`role-${role}`);
  }
  return classes.join(' ');
}

// Get CSS class names for VIP avatar
export function getVipAvatarClasses(role?: string, baseClass: string = 'player-avatar'): string {
  const classes: string[] = [baseClass];
  if (isVipRole(role)) {
    classes.push('vip-avatar');
    classes.push(`role-${role}`);
  }
  return classes.join(' ');
}

// Get CSS class names for VIP name text
export function getVipNameClasses(role?: string, baseClass: string = 'player-name'): string {
  const classes: string[] = [baseClass];
  if (isVipRole(role)) {
    classes.push('vip-name');
    classes.push(`role-name-${role}`);
  }
  return classes.join(' ');
}

// Get inline style for VIP effects (fallback when CSS classes aren't available)
export function getVipNameStyle(role?: string): React.CSSProperties | undefined {
  if (!role) return undefined;

  switch (role) {
    case 'super_admin':
      return {
        background: 'linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #9b59b6)',
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: 'rainbow-text 3s linear infinite',
        fontWeight: 700,
      };
    case 'director':
      return {
        background: 'linear-gradient(90deg, #ffd700, #ffb347)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontWeight: 700,
        textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
      };
    case 'admin':
      return {
        color: '#e34234',
        fontWeight: 700,
        textShadow: '0 0 8px rgba(227, 66, 52, 0.4)',
      };
    case 'vip_user':
      return {
        background: 'linear-gradient(90deg, #a855f7, #ec4899)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontWeight: 600,
      };
    default:
      return undefined;
  }
}

// Get VIP badge/icon based on role
export function getVipBadge(role?: string): string | null {
  if (!role) return null;

  switch (role) {
    case 'super_admin':
      return '👑';
    case 'director':
      return '🌟';
    case 'admin':
      return '⚡';
    case 'vip_user':
      return '💎';
    default:
      return null;
  }
}

// Interface for player with optional role
export interface PlayerWithRole {
  displayName: string;
  role?: string;
  avatar?: string;
  odinhId?: string;
  id?: string;
}

// Helper to render player name with VIP styling
export function renderVipName(
  player: PlayerWithRole,
  options?: {
    showBadge?: boolean;
    className?: string;
  }
): { className: string; badge: string | null; style?: React.CSSProperties } {
  const className = getVipNameClasses(player.role, options?.className);
  const badge = options?.showBadge !== false ? getVipBadge(player.role) : null;
  const style = getVipNameStyle(player.role);

  return { className, badge, style };
}
