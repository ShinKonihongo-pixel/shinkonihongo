// Hook for authentication with Firestore

import { useState, useCallback, useEffect } from 'react';
import type { User, CurrentUser, UserRole } from '../types/user';
import * as firestoreService from '../services/firestore';

const CURRENT_USER_KEY = 'flashcard-current-user';

// Default super admin account
const DEFAULT_SUPER_ADMIN: Omit<User, 'id'> = {
  username: 'superadmin',
  password: 'superadmin', // Demo only - never do this in production!
  role: 'super_admin',
  createdAt: '2024-01-01',
};

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

  // Subscribe to real-time updates and ensure default super admin exists
  useEffect(() => {
    setLoading(true);
    const unsubscribe = firestoreService.subscribeToUsers(async (usersData) => {
      // Check if default super admin exists
      const superAdminExists = usersData.some(u => u.username === 'superadmin');
      if (!superAdminExists) {
        // Create default super admin
        try {
          await firestoreService.addUser(DEFAULT_SUPER_ADMIN);
        } catch (err) {
          console.error('Error creating default super admin:', err);
        }
      }
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
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
  const login = useCallback((username: string, password: string): { success: boolean; error?: string } => {
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
      return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng' };
    }
    setCurrentUser({
      id: user.id,
      username: user.username,
      role: user.role,
      displayName: user.displayName,
      avatar: user.avatar,
      profileBackground: user.profileBackground,
      jlptLevel: user.jlptLevel,
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
      const newUserData: Omit<User, 'id'> = {
        username,
        password,
        role,
        createdBy,
        createdAt: new Date().toISOString().split('T')[0],
      };
      await firestoreService.addUser(newUserData);
      return { success: true };
    } catch (err) {
      console.error('Error registering user:', err);
      return { success: false, error: 'Đăng ký thất bại' };
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
      console.error('Error updating user role:', err);
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
      console.error('Error deleting user:', err);
    }
  }, [users, currentUser]);

  // Change password
  const changePassword = useCallback(async (userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (newPassword.length < 4) {
      return { success: false, error: 'Mật khẩu phải có ít nhất 4 ký tự' };
    }
    try {
      await firestoreService.updateUser(userId, { password: newPassword });
      return { success: true };
    } catch (err) {
      console.error('Error changing password:', err);
      return { success: false, error: 'Đổi mật khẩu thất bại' };
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
      console.error('Error updating display name:', err);
      return { success: false, error: 'Cập nhật tên thất bại' };
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
      console.error('Error updating avatar:', err);
      return { success: false, error: 'Cập nhật avatar thất bại' };
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
      console.error('Error updating profile background:', err);
      return { success: false, error: 'Cập nhật background thất bại' };
    }
  }, [currentUser]);

  // Update JLPT level
  const updateJlptLevel = useCallback(async (userId: string, jlptLevel: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await firestoreService.updateUser(userId, { jlptLevel });
      // Update current user state
      if (currentUser?.id === userId) {
        setCurrentUser(prev => prev ? { ...prev, jlptLevel: jlptLevel as any } : null);
      }
      return { success: true };
    } catch (err) {
      console.error('Error updating JLPT level:', err);
      return { success: false, error: 'Cập nhật cấp độ thất bại' };
    }
  }, [currentUser]);

  // Update VIP expiration date
  const updateVipExpiration = useCallback(async (userId: string, expirationDate: string | undefined) => {
    try {
      await firestoreService.updateUser(userId, { vipExpirationDate: expirationDate || undefined });
    } catch (err) {
      console.error('Error updating VIP expiration:', err);
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
              console.error('Error converting expired VIP:', err);
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
