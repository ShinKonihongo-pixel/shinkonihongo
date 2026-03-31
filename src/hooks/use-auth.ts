// Hook for authentication with Firestore

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { User, CurrentUser, UserRole } from '../types/user';
import * as firestoreService from '../services/firestore';
import { handleError } from '../utils/error-handler';
import { authReady } from '../lib/firebase';
import { hashPassword, verifyPassword, isLegacyHash } from '../utils/password-hash';

const CURRENT_USER_KEY = 'flashcard-current-user';

// Default admin password — env var required; falls back to 'superadmin' ONLY in dev
const DEFAULT_ADMIN_PW = import.meta.env.VITE_DEFAULT_ADMIN_PW
  || (import.meta.env.DEV ? 'superadmin' : '');

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
            const hashedPw = await hashPassword(DEFAULT_ADMIN_PW);
            const defaultSuperAdmin: Omit<User, 'id'> = {
              username: 'superadmin',
              password: hashedPw,
              role: 'super_admin',
              createdAt: '2024-01-01',
            };
            await firestoreService.addUser(defaultSuperAdmin);
          } catch (err) {
            handleError(err, { context: 'useAuth/createDefaultAdmin', silent: true });
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

  // Re-validate cached user against Firestore on load (prevents localStorage role tampering)
  useEffect(() => {
    if (!currentUser || !users.length) return;
    const freshUser = users.find(u => u.id === currentUser.id);
    if (!freshUser) {
      // User deleted from Firestore — force logout
      setCurrentUser(null);
      return;
    }
    // Sync role + profile from Firestore truth
    if (freshUser.role !== currentUser.role || freshUser.displayName !== currentUser.displayName) {
      setCurrentUser(prev => prev ? {
        ...prev,
        role: freshUser.role,
        displayName: freshUser.displayName,
        avatar: freshUser.avatar,
        profileBackground: freshUser.profileBackground,
        jlptLevel: freshUser.jlptLevel,
        branchId: freshUser.branchId,
        branchIds: freshUser.branchIds,
      } : null);
    }
  }, [users]); // Only re-run when Firestore users update, not on currentUser change

  // Login
  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const user = users.find(u => u.username === username);
    if (!user) {
      return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng' };
    }

    // Read password from private subcollection first, fallback to legacy field
    const storedPassword = await firestoreService.getUserPassword(user.id) || user.password;
    if (!storedPassword) {
      return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng' };
    }

    // Verify password (supports PBKDF2, legacy SHA-256, and plaintext fallback)
    const matchesHash = await verifyPassword(password, storedPassword);
    const matchesPlaintext = !matchesHash && storedPassword === password;

    if (!matchesHash && !matchesPlaintext) {
      return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng' };
    }

    // Silent migration: upgrade to PBKDF2 in private subcollection
    if (matchesPlaintext || isLegacyHash(storedPassword)) {
      try {
        const newHash = await hashPassword(password);
        await firestoreService.updateUser(user.id, { password: newHash });
      } catch (err) {
        handleError(err, { context: 'useAuth/passwordMigration', silent: true });
      }
    }

    // Force password change if still using default password
    if (matchesPlaintext && password === DEFAULT_ADMIN_PW && user.role === 'super_admin') {
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
      return { success: true, error: 'FORCE_PASSWORD_CHANGE' };
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
    if (password.length < 8) {
      return { success: false, error: 'Mật khẩu phải có ít nhất 8 ký tự' };
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

  // Change password — only own password or admin can change any
  const changePassword = useCallback(async (userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Chưa đăng nhập' };
    const isAdminRole = ['admin', 'super_admin'].includes(currentUser.role);
    if (currentUser.id !== userId && !isAdminRole) {
      return { success: false, error: 'Không có quyền đổi mật khẩu người khác' };
    }
    if (newPassword.length < 8) {
      return { success: false, error: 'Mật khẩu phải có ít nhất 8 ký tự' };
    }
    try {
      const hashedPw = await hashPassword(newPassword);
      await firestoreService.updateUser(userId, { password: hashedPw });
      return { success: true };
    } catch (err) {
      const msg = handleError(err, { context: 'useAuth/changePassword', userMessage: 'Đổi mật khẩu thất bại' });
      return { success: false, error: msg };
    }
  }, [currentUser]);

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

  // Check and convert expired VIP users — only runs for admin users
  // VIP expiration check — only super_admin runs this to avoid N admin clients × M users writes
  const isSuperAdminUser = currentUser?.role === 'super_admin';
  useEffect(() => {
    if (!isSuperAdminUser || users.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Use a session flag to run only once per browser session
    const sessionKey = `vip_expiry_checked_${today.toISOString().split('T')[0]}`;
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, '1');

    for (const user of users) {
      if (user.role === 'vip_user' && user.vipExpirationDate) {
        const expirationDate = new Date(user.vipExpirationDate);
        expirationDate.setHours(0, 0, 0, 0);

        if (expirationDate < today) {
          firestoreService.updateUser(user.id, { role: 'user' }).catch(err => {
            handleError(err, { context: 'useAuth/expireVip', silent: true });
          });
        }
      }
    }
  }, [users, isSuperAdminUser]);

  return useMemo(() => ({
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
  }), [currentUser, users, loading, login, logout, register, updateUserRole, deleteUser, changePassword, updateDisplayName, updateAvatar, updateProfileBackground, updateJlptLevel, updateVipExpiration]);
}
