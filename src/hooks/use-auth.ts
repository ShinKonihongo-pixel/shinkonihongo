// Hook for authentication with Firestore

import { useState, useCallback, useEffect, useRef } from 'react';
import type { User, CurrentUser, UserRole } from '../types/user';
import * as firestoreService from '../services/firestore';
import { handleError } from '../utils/error-handler';
import { authReady } from '../lib/firebase';
import { hashPassword, verifyPassword } from '../utils/password-hash';

const CURRENT_USER_KEY = 'flashcard-current-user';

// SHA-256 of 'shinko_v1_superadmin' — pre-computed to avoid async at module level
// Generated via: hashPassword('superadmin')
// This is replaced at runtime if the account doesn't exist yet
const DEFAULT_SUPER_ADMIN_PASSWORD_PLAINTEXT = 'superadmin';

export function useAuth() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  });

  // Wait for Firebase anonymous auth before subscribing to Firestore
  const unsubRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    setLoading(true);
    let cancelled = false;

    authReady.then(() => {
      if (cancelled) return;
      unsubRef.current = firestoreService.subscribeToUsers(async (usersData) => {
        // Check if default super admin exists
        const superAdminExists = usersData.some(u => u.username === 'superadmin');
        if (!superAdminExists) {
          try {
            const hashedPw = await hashPassword(DEFAULT_SUPER_ADMIN_PASSWORD_PLAINTEXT);
            const defaultSuperAdmin: Omit<User, 'id'> = {
              username: 'superadmin',
              password: hashedPw,
              role: 'super_admin',
              createdAt: '2024-01-01',
            };
            await firestoreService.addUser(defaultSuperAdmin);
          } catch (err) {
            console.error('Error creating default super admin:', err);
          }
        }
        setUsers(usersData);
        setLoading(false);
      });
    });

    return () => {
      cancelled = true;
      unsubRef.current?.();
    };
  }, []);

  // Save current user to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }, [currentUser]);

  // Login
  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const user = users.find(u => u.username === username);
    if (!user) {
      return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng' };
    }

    // Try hash comparison first, then fall back to plaintext (backward compat for old accounts)
    const hashed = await hashPassword(password);
    const matchesHash = await verifyPassword(password, user.password);
    const matchesPlaintext = !matchesHash && user.password === password;

    if (!matchesHash && !matchesPlaintext) {
      return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng' };
    }

    // Silent migration: upgrade plaintext password to hash
    if (matchesPlaintext) {
      try {
        await firestoreService.updateUser(user.id, { password: hashed });
      } catch (err) {
        handleError(err, { context: 'useAuth/passwordMigration', silent: true });
      }
    }

    setCurrentUser({
      id: user.id,
      username: user.username,
      role: user.role,
      displayName: user.displayName,
      avatar: user.avatar,
      profileBackground: user.profileBackground,
      jlptLevel: user.jlptLevel,
      branchId: user.branchId,
      branchIds: user.branchIds,
    });
    return { success: true };
  }, [users]);

  // Logout
  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  // Register new user
  const register = useCallback(async (
    username: string,
    password: string,
    role: UserRole = 'user',
    createdBy?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (users.find(u => u.username === username)) {
      return { success: false, error: 'Tên đăng nhập đã tồn tại' };
    }
    if (username.length < 3) {
      return { success: false, error: 'Tên đăng nhập phải có ít nhất 3 ký tự' };
    }
    if (password.length < 4) {
      return { success: false, error: 'Mật khẩu phải có ít nhất 4 ký tự' };
    }

    try {
      // Ensure Firebase auth is ready before writing to Firestore
      await authReady;
      const hashedPw = await hashPassword(password);
      const newUserData: Omit<User, 'id'> = {
        username,
        password: hashedPw,
        role,
        createdBy,
        createdAt: new Date().toISOString().split('T')[0],
      };
      await firestoreService.addUser(newUserData);
      return { success: true };
    } catch (err) {
      const msg = handleError(err, { context: 'useAuth/register' });
      return { success: false, error: msg };
    }
  }, [users]);

  // Update user role (super_admin can change all, admin can only change users)
  const updateUserRole = useCallback(async (userId: string, role: UserRole) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    // Can't change super_admin role
    if (targetUser.role === 'super_admin') return;

    // Only super_admin can assign admin or super_admin role
    if (currentUser?.role !== 'super_admin' && (role === 'admin' || role === 'super_admin')) {
      return;
    }

    // Admin can only change user role, not other admins
    if (currentUser?.role === 'admin' && targetUser.role === 'admin') {
      return;
    }

    try {
      await firestoreService.updateUser(userId, { role });
    } catch (err) {
      handleError(err, { context: 'useAuth/updateRole' });
    }
  }, [users, currentUser]);

  // Delete user (can't delete super_admin, admin can't delete other admins)
  const deleteUser = useCallback(async (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    // Can't delete super_admin
    if (targetUser.role === 'super_admin') return;

    // Admin can't delete other admins
    if (currentUser?.role === 'admin' && targetUser.role === 'admin') {
      return;
    }

    try {
      await firestoreService.deleteUser(userId);
    } catch (err) {
      handleError(err, { context: 'useAuth/deleteUser' });
    }
  }, [users, currentUser]);

  // Change password
  const changePassword = useCallback(async (userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (newPassword.length < 4) {
      return { success: false, error: 'Mật khẩu phải có ít nhất 4 ký tự' };
    }
    try {
      const hashedPw = await hashPassword(newPassword);
      await firestoreService.updateUser(userId, { password: hashedPw });
      return { success: true };
    } catch (err) {
      const msg = handleError(err, { context: 'useAuth/changePassword', userMessage: 'Đổi mật khẩu thất bại' });
      return { success: false, error: msg };
    }
  }, []);

  // Update display name
  const updateDisplayName = useCallback(async (userId: string, displayName: string): Promise<{ success: boolean; error?: string }> => {
    if (displayName.length < 2) {
      return { success: false, error: 'Tên hiển thị phải có ít nhất 2 ký tự' };
    }
    try {
      await firestoreService.updateUser(userId, { displayName });
      // Update current user state
      if (currentUser?.id === userId) {
        setCurrentUser(prev => prev ? { ...prev, displayName } : null);
      }
      return { success: true };
    } catch (err) {
      const msg = handleError(err, { context: 'useAuth/updateDisplayName', userMessage: 'Cập nhật tên thất bại' });
      return { success: false, error: msg };
    }
  }, [currentUser]);

  // Update avatar
  const updateAvatar = useCallback(async (userId: string, avatar: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await firestoreService.updateUser(userId, { avatar });
      // Update current user state
      if (currentUser?.id === userId) {
        setCurrentUser(prev => prev ? { ...prev, avatar } : null);
      }
      return { success: true };
    } catch (err) {
      const msg = handleError(err, { context: 'useAuth/updateAvatar', userMessage: 'Cập nhật avatar thất bại' });
      return { success: false, error: msg };
    }
  }, [currentUser]);

  // Update profile background
  const updateProfileBackground = useCallback(async (userId: string, profileBackground: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await firestoreService.updateUser(userId, { profileBackground });
      // Update current user state
      if (currentUser?.id === userId) {
        setCurrentUser(prev => prev ? { ...prev, profileBackground } : null);
      }
      return { success: true };
    } catch (err) {
      const msg = handleError(err, { context: 'useAuth/updateProfileBackground', userMessage: 'Cập nhật background thất bại' });
      return { success: false, error: msg };
    }
  }, [currentUser]);

  // Update JLPT level
  const updateJlptLevel = useCallback(async (userId: string, jlptLevel: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await firestoreService.updateUser(userId, { jlptLevel: jlptLevel as 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | undefined });
      // Update current user state
      if (currentUser?.id === userId) {
        setCurrentUser(prev => prev ? { ...prev, jlptLevel: jlptLevel as 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | undefined } : null);
      }
      return { success: true };
    } catch (err) {
      const msg = handleError(err, { context: 'useAuth/updateJlptLevel', userMessage: 'Cập nhật cấp độ thất bại' });
      return { success: false, error: msg };
    }
  }, [currentUser]);

  // Update VIP expiration date
  const updateVipExpiration = useCallback(async (userId: string, expirationDate: string | undefined) => {
    try {
      await firestoreService.updateUser(userId, { vipExpirationDate: expirationDate || undefined });
    } catch (err) {
      handleError(err, { context: 'useAuth/updateVipExpiration' });
    }
  }, []);

  // Check and convert expired VIP users to regular users
  useEffect(() => {
    const checkExpiredVips = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const user of users) {
        if (user.role === 'vip_user' && user.vipExpirationDate) {
          const expirationDate = new Date(user.vipExpirationDate);
          expirationDate.setHours(0, 0, 0, 0);

          if (expirationDate < today) {
            // VIP has expired, convert to regular user
            try {
              await firestoreService.updateUser(user.id, { role: 'user' });
              console.log(`VIP expired for user ${user.username}, converted to regular user`);
            } catch (err) {
              handleError(err, { context: 'useAuth/expireVip', silent: true });
            }
          }
        }
      }
    };

    if (users.length > 0) {
      checkExpiredVips();
    }
  }, [users]);

  return {
    currentUser,
    users,
    loading,
    isLoggedIn: !!currentUser,
    isSuperAdmin: currentUser?.role === 'super_admin',
    isAdmin: currentUser?.role === 'admin' || currentUser?.role === 'super_admin',
    login,
    logout,
    register,
    updateUserRole,
    deleteUser,
    changePassword,
    updateDisplayName,
    updateAvatar,
    updateProfileBackground,
    updateJlptLevel,
    updateVipExpiration,
  };
}
