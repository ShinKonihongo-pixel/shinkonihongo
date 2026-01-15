// Admin dashboard for user management, lesson locking, and lecture management

import { useState } from 'react';
import type { User, UserRole } from '../../types/user';
import type { Lesson, JLPTLevel } from '../../types/flashcard';
import type { Lecture } from '../../types/lecture';
import { ConfirmModal } from '../ui/confirm-modal';
import { useLectures } from '../../hooks/use-lectures';
import { LectureCard } from '../lecture/lecture-card';

interface AdminPageProps {
  users: User[];
  currentUserRole: UserRole;
  currentUserId: string;
  onUpdateUserRole: (userId: string, role: UserRole) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateVipExpiration: (userId: string, expirationDate: string | undefined) => void;
  onRegister: (username: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  onToggleLock: (lessonId: string) => void;
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
  onNavigateToLectureEditor?: (lectureId?: string) => void;
}

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

export function AdminPage({
  users,
  currentUserRole,
  currentUserId,
  onUpdateUserRole,
  onDeleteUser,
  onUpdateVipExpiration,
  onRegister,
  onToggleLock,
  getLessonsByLevel,
  getChildLessons,
  onNavigateToLectureEditor,
}: AdminPageProps) {
  const isSuperAdmin = currentUserRole === 'super_admin';
  const [activeTab, setActiveTab] = useState<'users' | 'lessons' | 'lectures'>('users');

  // Lectures management
  const { lectures, loading: lecturesLoading, deleteLecture } = useLectures(true);
  const [deleteLectureTarget, setDeleteLectureTarget] = useState<Lecture | null>(null);
  const [lectureFilterLevel, setLectureFilterLevel] = useState<JLPTLevel | 'all'>('all');
  const [lectureSearchQuery, setLectureSearchQuery] = useState('');

  // Filter lectures
  const filteredLectures = lectures.filter((lecture) => {
    const matchLevel = lectureFilterLevel === 'all' || lecture.jlptLevel === lectureFilterLevel;
    const matchSearch =
      !lectureSearchQuery ||
      lecture.title.toLowerCase().includes(lectureSearchQuery.toLowerCase()) ||
      lecture.description?.toLowerCase().includes(lectureSearchQuery.toLowerCase());
    return matchLevel && matchSearch;
  });
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
      setError('');
      setShowAddUser(false);
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
          Quản lí bài học
        </button>
        <button
          className={`tab-btn ${activeTab === 'lectures' ? 'active' : ''}`}
          onClick={() => setActiveTab('lectures')}
        >
          Quản lí bài giảng ({lectures.length})
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
            <div className="admin-add-user">
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
                    {isSuperAdmin && <option value="vip_user">VIP User</option>}
                    {isSuperAdmin && <option value="admin">Admin</option>}
                    {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                  </select>
                  <button type="submit" className="btn btn-primary">Thêm</button>
                </div>
                {error && <p className="error-message">{error}</p>}
              </form>
            </div>
          )}

          <table className="users-table">
            <thead>
              <tr>
                <th>Tên đăng nhập</th>
                <th>Quyền</th>
                <th>Ngày hữu hạn VIP</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map(user => {
                const isCurrentUser = user.id === currentUserId;
                const isProtectedSuperAdmin = user.id === 'superadmin'; // Protected super admin cannot be modified

                // Only super_admin can change roles, except:
                // - Cannot change own role
                // - Cannot change the protected superadmin account
                const canChangeRole = isSuperAdmin && !isCurrentUser && !isProtectedSuperAdmin;

                // Same logic for delete
                const canDelete = !isCurrentUser && !isProtectedSuperAdmin && (
                  isSuperAdmin || // Super admin can delete anyone except self and protected
                  user.role === 'user' // Admin can only delete users
                );

                // Check if VIP is expired
                const isVipExpired = user.role === 'vip_user' && user.vipExpirationDate &&
                  new Date(user.vipExpirationDate) < new Date();

                return (
                  <tr key={user.id} className={isVipExpired ? 'vip-expired' : ''}>
                    <td>{user.username}</td>
                    <td>
                      <span className={`role-badge role-${user.role}`}>
                        {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : user.role === 'vip_user' ? 'VIP' : 'User'}
                      </span>
                      {isVipExpired && <span className="expired-badge">Hết hạn</span>}
                    </td>
                    <td>
                      {(user.role === 'vip_user' || canChangeRole) ? (
                        <input
                          type="date"
                          value={user.vipExpirationDate || ''}
                          onChange={(e) => onUpdateVipExpiration(user.id, e.target.value || undefined)}
                          className="expiration-input"
                          disabled={!canChangeRole}
                        />
                      ) : (
                        <span className="no-expiration">-</span>
                      )}
                    </td>
                    <td>{user.createdAt}</td>
                    <td>
                      <div className="action-buttons-row">
                        {canChangeRole && (
                          <select
                            value={user.role}
                            onChange={(e) => onUpdateUserRole(user.id, e.target.value as UserRole)}
                            className="role-select"
                          >
                            <option value="user">User</option>
                            <option value="vip_user">VIP User</option>
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        )}
                        {canDelete && (
                          <button
                            className="btn btn-danger btn-small"
                            onClick={() => setDeleteUserTarget(user)}
                          >
                            Xóa
                          </button>
                        )}
                      </div>
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

      {activeTab === 'lectures' && (
        <div className="admin-lectures">
          <div className="admin-actions">
            <button
              className="btn btn-primary"
              onClick={() => onNavigateToLectureEditor?.()}
            >
              + Tạo bài giảng mới
            </button>
          </div>

          <div className="lecture-filters" style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <input
              type="text"
              placeholder="Tìm kiếm bài giảng..."
              value={lectureSearchQuery}
              onChange={(e) => setLectureSearchQuery(e.target.value)}
              className="search-input"
              style={{ flex: 1 }}
            />
            <select
              value={lectureFilterLevel}
              onChange={(e) => setLectureFilterLevel(e.target.value as JLPTLevel | 'all')}
              className="filter-select"
            >
              <option value="all">Tất cả level</option>
              <option value="N5">N5</option>
              <option value="N4">N4</option>
              <option value="N3">N3</option>
              <option value="N2">N2</option>
              <option value="N1">N1</option>
            </select>
          </div>

          {lecturesLoading ? (
            <div className="loading-state">Đang tải...</div>
          ) : filteredLectures.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
              <p>Chưa có bài giảng nào</p>
            </div>
          ) : (
            <div className="lecture-grid" style={{ marginTop: '1rem' }}>
              {filteredLectures.map((lecture) => (
                <LectureCard
                  key={lecture.id}
                  lecture={lecture}
                  onClick={() => onNavigateToLectureEditor?.(lecture.id)}
                  onEdit={() => onNavigateToLectureEditor?.(lecture.id)}
                  onDelete={() => setDeleteLectureTarget(lecture)}
                  showActions={true}
                />
              ))}
            </div>
          )}
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

      <ConfirmModal
        isOpen={deleteLectureTarget !== null}
        title="Xác nhận xóa bài giảng"
        message={`Bạn có chắc muốn xóa bài giảng "${deleteLectureTarget?.title || ''}"?`}
        confirmText="Xóa"
        onConfirm={async () => {
          if (deleteLectureTarget) {
            await deleteLecture(deleteLectureTarget.id);
            setDeleteLectureTarget(null);
          }
        }}
        onCancel={() => setDeleteLectureTarget(null)}
      />
    </div>
  );
}
