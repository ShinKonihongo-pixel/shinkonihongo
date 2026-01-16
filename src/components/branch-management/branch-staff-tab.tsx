// Branch Staff Tab - Manage branch administrators and staff members

import { BRANCH_MEMBER_ROLE_LABELS } from '../../types/branch';
import type { BranchStaffTabProps } from './branch-management-types';

export function BranchStaffTab({
  members,
  availableUsers,
  isDirector,
  loading,
  onAddAdmin,
  onRemoveMember,
}: BranchStaffTabProps) {
  const handleAddAdmin = () => {
    const select = document.getElementById('add-admin-select') as HTMLSelectElement;
    if (select.value) {
      onAddAdmin(select.value);
      select.value = '';
    }
  };

  return (
    <div className="tab-content-staff">
      <div className="section-header">
        <h3>Nhân sự chi nhánh</h3>
        {isDirector && (
          <div className="add-staff-controls">
            <select id="add-admin-select">
              <option value="">Chọn người dùng...</option>
              {availableUsers.map(u => (
                <option key={u.id} value={u.id}>{u.displayName || u.username}</option>
              ))}
            </select>
            <button className="btn btn-primary" onClick={handleAddAdmin}>
              + Thêm Admin
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-state">Đang tải...</div>
      ) : members.length === 0 ? (
        <div className="empty-state"><p>Chưa có nhân sự</p></div>
      ) : (
        <div className="staff-table">
          <table>
            <thead>
              <tr>
                <th>Tên</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Ngày tham gia</th>
                <th>Trạng thái</th>
                {isDirector && <th></th>}
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr key={member.id}>
                  <td>
                    <div className="member-name">
                      <div className="avatar">
                        {(member.user?.displayName || '?').charAt(0).toUpperCase()}
                      </div>
                      <span>{member.user?.displayName || member.user?.username || '-'}</span>
                    </div>
                  </td>
                  <td className="email">{member.user?.email || '-'}</td>
                  <td>
                    <span className={`role-badge role-${member.role}`}>
                      {BRANCH_MEMBER_ROLE_LABELS[member.role]}
                    </span>
                  </td>
                  <td className="date">{new Date(member.joinedAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <span className={`status-badge status-${member.status}`}>
                      {member.status === 'active' ? 'Hoạt động' : 'Ngưng'}
                    </span>
                  </td>
                  {isDirector && (
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => onRemoveMember(member.id)}>
                        Xóa
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
