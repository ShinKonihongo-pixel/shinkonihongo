// Lightweight auth-only context — consumers that only need auth data
// should use useAuthData() instead of useUserData() to avoid re-renders
// from social/notification updates

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { User, CurrentUser, UserRole } from '../types/user';
import { useAuth } from '../hooks/use-auth';

// ============ TYPE DEFINITIONS ============

export interface AuthContextValue {
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
}

// ============ CONTEXT ============

const AuthContext = createContext<AuthContextValue | null>(null);

// ============ PROVIDER ============

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  const value = useMemo<AuthContextValue>(() => ({
    currentUser: auth.currentUser,
    users: auth.users,
    loading: auth.loading,
    isLoggedIn: auth.isLoggedIn,
    isSuperAdmin: auth.isSuperAdmin,
    isAdmin: auth.isAdmin,
    isVip: auth.currentUser?.role === 'vip_user',
    canAccessLocked: auth.isAdmin || auth.currentUser?.role === 'vip_user',
    login: auth.login,
    logout: auth.logout,
    register: auth.register,
    updateUserRole: auth.updateUserRole,
    deleteUser: auth.deleteUser,
    changePassword: auth.changePassword,
    updateDisplayName: auth.updateDisplayName,
    updateAvatar: auth.updateAvatar,
    updateProfileBackground: auth.updateProfileBackground,
    updateJlptLevel: auth.updateJlptLevel,
    updateVipExpiration: auth.updateVipExpiration,
  }), [
    auth.currentUser, auth.users, auth.loading, auth.isLoggedIn,
    auth.isSuperAdmin, auth.isAdmin,
    auth.login, auth.logout, auth.register,
    auth.updateUserRole, auth.deleteUser, auth.changePassword,
    auth.updateDisplayName, auth.updateAvatar, auth.updateProfileBackground,
    auth.updateJlptLevel, auth.updateVipExpiration,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============ HOOK ============

/** Use this instead of useUserData() when you only need auth/user data.
 *  This context does NOT re-render on friendship, badge, or notification changes. */
export function useAuthData(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthData must be used within AuthProvider');
  }
  return context;
}
