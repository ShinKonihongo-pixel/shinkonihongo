// Users Management Tab - User account management

import { useState } from 'react';
import { ConfirmModal } from '../ui/confirm-modal';
import type { UsersTabProps, User, UserRole } from './cards-management-types';

export function UsersTab({
  users,
  currentUser,
  isSuperAdmin,
  onUpdateRole,
  onDeleteUser,
  onUpdateVipExpiration,
  onRegister,
}: UsersTabProps) {
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [userError, setUserError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const visibleUsers = isSuperAdmin
    ? users
    : users.filter(u => u.role === 'user' || u.role === 'vip_user');

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onRegister(newUsername, newPassword, newRole, currentUser.id);
    if (result.success) {
      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
      setUserError('');
      setShowAddUser(false);
    } else {
      setUserError(result.error || 'Thêm user thất bại');
    }
  };

  return (
    <div className="admin-users">
      <div className="admin-actions">
        <button className="btn btn-primary" onClick={() => setShowAddUser(!showAddUser)}>
          {showAddUser ? 'Hủy' : '+ Thêm người dùng'}
        </button>
      </div>

      {showAddUser && (
        <div className="admin-add-user">
          <form className="add-user-form" onSubmit={handleAddUser}>
            <div className="form-row">
              <input type="text" placeholder="Tên đăng nhập" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required />
              <input type="password" placeholder="Mật khẩu" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              <select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)}>
                <option value="user">User</option>
                {isSuperAdmin && <option value="vip_user">VIP User</option>}
                {isSuperAdmin && <option value="admin">Admin</option>}
                {isSuperAdmin && <option value="super_admin">Super Admin</option>}
              </select>
              <button type="submit" className="btn btn-primary">Thêm</button>
            </div>
            {userError && <p className="error-message">{userError}</p>}
          </form>
        </div>
      )}

      <table className="users-table">
        <thead>
          <tr>
            <th>Tên đăng nhập</th>
            <th>Quyền</th>
            <th>Ngày hữu hạn</th>
            <th>Ngày tạo</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {visibleUsers.map(user => {
            const isCurrentUser = user.id === currentUser.id;
            const isProtectedSuperAdmin = user.id === 'superadmin';
            const canChangeRole = isSuperAdmin && !isCurrentUser && !isProtectedSuperAdmin;
            const canDelete = !isCurrentUser && !isProtectedSuperAdmin && (
              isSuperAdmin || (currentUser.role === 'admin' && user.createdBy === currentUser.id)
            );
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
                      <select value={user.role} onChange={(e) => onUpdateRole(user.id, e.target.value as UserRole)} className="role-select">
                        <option value="user">User</option>
                        <option value="vip_user">VIP User</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    )}
                    {canDelete && (
                      <button className="btn btn-danger btn-small" onClick={() => setDeleteTarget(user)}>Xóa</button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Xác nhận xóa người dùng"
        message={`Bạn có chắc muốn xóa người dùng "${deleteTarget?.username || ''}"?`}
        confirmText="Xóa"
        onConfirm={() => { if (deleteTarget) { onDeleteUser(deleteTarget.id); setDeleteTarget(null); } }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
