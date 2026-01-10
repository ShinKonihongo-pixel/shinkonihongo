// Admin dashboard for user management and lesson locking

import { useState } from 'react';
import type { User, UserRole } from '../../types/user';
import type { Lesson, JLPTLevel } from '../../types/flashcard';
import { ConfirmModal } from '../ui/confirm-modal';

interface AdminPageProps {
  users: User[];
  currentUserRole: UserRole;
  currentUserId: string;
  onUpdateUserRole: (userId: string, role: UserRole) => void;
  onDeleteUser: (userId: string) => void;
  onRegister: (username: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  onToggleLock: (lessonId: string) => void;
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
}

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

export function AdminPage({
  users,
  currentUserRole,
  currentUserId,
  onUpdateUserRole,
  onDeleteUser,
  onRegister,
  onToggleLock,
  getLessonsByLevel,
  getChildLessons,
}: AdminPageProps) {
  const isSuperAdmin = currentUserRole === 'super_admin';
  const [activeTab, setActiveTab] = useState<'users' | 'lessons'>('users');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [error, setError] = useState('');
  const [expandedLevel, setExpandedLevel] = useState<JLPTLevel | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<User | null>(null);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onRegister(newUsername, newPassword, newRole);
    if (result.success) {
      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
      setShowAddUser(false);
      setError('');
    } else {
      setError(result.error || 'Thêm user thất bại');
    }
  };

  // Filter users based on current user's role
  // Super Admin sees everyone, Admin sees users and VIP users
  const visibleUsers = isSuperAdmin
    ? users
    : users.filter(u => u.role === 'user' || u.role === 'vip_user');

  return (
    <div className="admin-page">
      <h2>Quản trị</h2>

      <div className="tab-buttons">
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          {isSuperAdmin ? 'Quản lý tài khoản' : 'Người dùng'} ({visibleUsers.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'lessons' ? 'active' : ''}`}
          onClick={() => setActiveTab('lessons')}
        >
          Khóa bài học
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="admin-users">
          <div className="admin-actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowAddUser(!showAddUser)}
            >
              {showAddUser ? 'Hủy' : '+ Thêm người dùng'}
            </button>
          </div>

          {showAddUser && (
            <form className="add-user-form" onSubmit={handleAddUser}>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Tên đăng nhập"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Mật khẩu"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                >
                  <option value="user">User</option>
                  <option value="vip_user">VIP User</option>
                  {isSuperAdmin && <option value="admin">Admin</option>}
                  {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                </select>
                <button type="submit" className="btn btn-primary">Thêm</button>
              </div>
              {error && <p className="error-message">{error}</p>}
            </form>
          )}

          <table className="users-table">
            <thead>
              <tr>
                <th>Tên đăng nhập</th>
                <th>Quyền</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map(user => {
                const isCurrentUser = user.id === currentUserId;

                // Super admin can manage everyone except themselves
                // Admin can only manage users (not admin or super_admin)
                const canChangeRole = !isCurrentUser && (
                  isSuperAdmin || // Super admin can change anyone except self
                  user.role === 'user' // Admin can only change users
                );

                // Same logic for delete
                const canDelete = !isCurrentUser && (
                  isSuperAdmin || // Super admin can delete anyone except self
                  user.role === 'user' // Admin can only delete users
                );

                return (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>
                      {canChangeRole ? (
                        <select
                          value={user.role}
                          onChange={(e) => onUpdateUserRole(user.id, e.target.value as UserRole)}
                          className="role-select"
                        >
                          <option value="user">User</option>
                          <option value="vip_user">VIP User</option>
                          {isSuperAdmin && <option value="admin">Admin</option>}
                          {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                        </select>
                      ) : (
                        <span className={`role-badge role-${user.role}`}>
                          {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : user.role === 'vip_user' ? 'VIP' : 'User'}
                        </span>
                      )}
                    </td>
                    <td>{user.createdAt}</td>
                    <td>
                      {canDelete && (
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => setDeleteUserTarget(user)}
                        >
                          Xóa
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'lessons' && (
        <div className="admin-lessons">
          <p className="admin-hint">Bấm vào ổ khóa để khóa/mở bài học. Bài học bị khóa sẽ không hiển thị cho user thường.</p>

          <div className="lesson-tree">
            {JLPT_LEVELS.map(level => {
              const levelLessons = getLessonsByLevel(level);
              const isExpanded = expandedLevel === level;

              return (
                <div key={level} className="lesson-level">
                  <div
                    className="lesson-level-header"
                    onClick={() => setExpandedLevel(isExpanded ? null : level)}
                  >
                    <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                    <span className="level-name">{level}</span>
                    <span className="level-count">({levelLessons.length} bài)</span>
                  </div>

                  {isExpanded && (
                    <div className="lesson-list">
                      {levelLessons.length === 0 ? (
                        <p className="no-lessons">Chưa có bài học nào</p>
                      ) : (
                        levelLessons.map(lesson => {
                          const childLessons = getChildLessons(lesson.id);
                          return (
                            <div key={lesson.id} className="lesson-group">
                              <div className="lesson-row">
                                <button
                                  className={`lock-btn ${lesson.isLocked ? 'locked' : ''}`}
                                  onClick={() => onToggleLock(lesson.id)}
                                  title={lesson.isLocked ? 'Mở khóa' : 'Khóa'}
                                >
                                  {lesson.isLocked ? '🔒' : '🔓'}
                                </button>
                                <span className="lesson-name">{lesson.name}</span>
                                {lesson.isLocked && <span className="locked-badge">Đã khóa</span>}
                              </div>
                              {childLessons.length > 0 && (
                                <div className="child-lessons">
                                  {childLessons.map(child => (
                                    <div key={child.id} className="lesson-row child">
                                      <button
                                        className={`lock-btn ${child.isLocked ? 'locked' : ''}`}
                                        onClick={() => onToggleLock(child.id)}
                                        title={child.isLocked ? 'Mở khóa' : 'Khóa'}
                                      >
                                        {child.isLocked ? '🔒' : '🔓'}
                                      </button>
                                      <span className="lesson-name">{child.name}</span>
                                      {child.isLocked && <span className="locked-badge">Đã khóa</span>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteUserTarget !== null}
        title="Xác nhận xóa người dùng"
        message={`Bạn có chắc muốn xóa người dùng "${deleteUserTarget?.username || ''}"?`}
        confirmText="Xóa"
        onConfirm={() => {
          if (deleteUserTarget) {
            onDeleteUser(deleteUserTarget.id);
            setDeleteUserTarget(null);
          }
        }}
        onCancel={() => setDeleteUserTarget(null)}
      />
    </div>
  );
}
