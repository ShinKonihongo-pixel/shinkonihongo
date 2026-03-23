// Role permission management — matrix view of roles × features

import { useState } from 'react';
import { Check, X, ChevronDown, Shield } from 'lucide-react';
import './role-permissions-page.css';

// Role definitions with Vietnamese labels and hierarchy order
const ROLES = [
  { id: 'super_admin', label: 'Super Admin', description: 'Toàn quyền hệ thống' },
  { id: 'director', label: 'Giám đốc', description: 'Quản lý đa chi nhánh' },
  { id: 'branch_admin', label: 'Admin chi nhánh', description: 'Quản lý 1 chi nhánh' },
  { id: 'admin', label: 'Admin', description: 'Quản lý nội dung' },
  { id: 'main_teacher', label: 'Giáo viên chính', description: 'Dạy & quản lý lớp' },
  { id: 'part_time_teacher', label: 'Giáo viên PT', description: 'Dạy lớp được giao' },
  { id: 'assistant', label: 'Trợ giảng', description: 'Hỗ trợ giáo viên' },
  { id: 'vip_user', label: 'VIP', description: 'Mở khóa toàn bộ nội dung' },
  { id: 'user', label: 'Học viên', description: 'Gói miễn phí' },
] as const;

// Permission categories and their role access
interface Permission {
  label: string;
  section?: boolean; // section header row
  roles: Record<string, boolean>; // roleId -> hasAccess
}

const PERMISSIONS: Permission[] = [
  // Learning
  { label: 'HỌC TẬP', section: true, roles: {} },
  { label: 'Từ vựng N5', roles: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: true, assistant: true, vip_user: true, user: true } },
  { label: 'Từ vựng N4-N1', roles: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: true, assistant: true, vip_user: true, user: false } },
  { label: 'Ngữ pháp', roles: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: true, assistant: true, vip_user: true, user: true } },
  { label: 'Hán tự (Kanji)', roles: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: true, assistant: true, vip_user: true, user: true } },
  { label: 'Đọc hiểu', roles: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: true, assistant: true, vip_user: true, user: true } },
  { label: 'Nghe hiểu', roles: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: true, assistant: true, vip_user: true, user: true } },
  { label: 'Bài tập', roles: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: true, assistant: true, vip_user: true, user: true } },
  { label: 'Bài học bị khóa', roles: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: false, assistant: false, vip_user: true, user: false } },
  { label: 'Hội thoại (会話)', roles: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: false, assistant: false, vip_user: true, user: false } },

  // Games
  { label: 'TRÒ CHƠI', section: true, roles: {} },
  { label: 'Game cơ bản (Quiz, Bingo)', roles: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: true, assistant: true, vip_user: true, user: true } },
  { label: 'Tất cả 11 trò chơi', roles: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: true, assistant: true, vip_user: true, user: false } },
  { label: 'Quiz Battle (ELO)', roles: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: true, assistant: true, vip_user: true, user: true } },

  // JLPT
  { label: 'LUYỆN THI', section: true, roles: {} },
  { label: 'JLPT N5', roles: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: true, assistant: true, vip_user: true, user: true } },
  { label: 'JLPT N4-N1', roles: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: true, assistant: true, vip_user: true, user: false } },

  // Management
  { label: 'QUẢN LÝ', section: true, roles: {} },
  { label: 'Quản lý nội dung (Cards)', roles: { super_admin: true, director: false, branch_admin: false, admin: true, main_teacher: false, part_time_teacher: false, assistant: false, vip_user: false, user: false } },
  { label: 'Quản lý lớp học', roles: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: true, assistant: true, vip_user: false, user: false } },
  { label: 'Quản lý người dùng', roles: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: false, part_time_teacher: false, assistant: false, vip_user: false, user: false } },
  { label: 'Quản lý chi nhánh', roles: { super_admin: true, director: true, branch_admin: true, admin: false, main_teacher: false, part_time_teacher: false, assistant: false, vip_user: false, user: false } },
  { label: 'Quản lý giáo viên', roles: { super_admin: true, director: true, branch_admin: true, admin: false, main_teacher: false, part_time_teacher: false, assistant: false, vip_user: false, user: false } },
  { label: 'Bảng lương', roles: { super_admin: true, director: true, branch_admin: true, admin: false, main_teacher: false, part_time_teacher: false, assistant: false, vip_user: false, user: false } },
  { label: 'Dashboard trung tâm', roles: { super_admin: true, director: true, branch_admin: true, admin: false, main_teacher: false, part_time_teacher: false, assistant: false, vip_user: false, user: false } },

  // System
  { label: 'HỆ THỐNG', section: true, roles: {} },
  { label: 'Theme & giao diện', roles: { super_admin: true, director: false, branch_admin: false, admin: false, main_teacher: false, part_time_teacher: false, assistant: false, vip_user: false, user: false } },
  { label: 'Quản lý phân quyền', roles: { super_admin: true, director: false, branch_admin: false, admin: false, main_teacher: false, part_time_teacher: false, assistant: false, vip_user: false, user: false } },
  { label: 'Cấp VIP cho user', roles: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: false, part_time_teacher: false, assistant: false, vip_user: false, user: false } },
];

export function RolePermissionsPage() {
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const permRows = PERMISSIONS.filter(p => !p.section);

  return (
    <div className="rp">
      <div className="rp-header">
        <h1 className="rp-title">
          <Shield size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
          Quản Lý Phân Quyền
        </h1>
        <p className="rp-subtitle">Ma trận quyền truy cập theo từng vai trò trong hệ thống</p>
      </div>
      <div className="rp-divider" />

      {/* Desktop: Table view */}
      <div className="rp-table-wrap">
        <table className="rp-table">
          <thead>
            <tr>
              <th>Chức năng</th>
              {ROLES.map(r => (
                <th key={r.id}>
                  <span className={`rp-role-badge rp-role-${r.id}`}>{r.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((perm, i) => {
              if (perm.section) {
                return (
                  <tr key={i} className="rp-section-row">
                    <td colSpan={ROLES.length + 1}>{perm.label}</td>
                  </tr>
                );
              }
              return (
                <tr key={i}>
                  <td>{perm.label}</td>
                  {ROLES.map(r => (
                    <td key={r.id}>
                      {perm.roles[r.id] ? (
                        <Check size={14} className="rp-table-check" />
                      ) : (
                        <X size={14} className="rp-table-x" />
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: Card view */}
      <div className="rp-cards">
        {ROLES.map(role => {
          const isExpanded = expandedRole === role.id;
          const permCount = permRows.filter(p => p.roles[role.id]).length;

          return (
            <div key={role.id} className="rp-card">
              <div
                className="rp-card-header"
                onClick={() => setExpandedRole(isExpanded ? null : role.id)}
              >
                <div className="rp-card-role">
                  <span className={`rp-role-badge rp-role-${role.id}`}>{role.label}</span>
                  <div>
                    <div className="rp-role-name">{role.description}</div>
                    <div className="rp-role-count">{permCount}/{permRows.length} quyền</div>
                  </div>
                </div>
                <ChevronDown size={16} className={`rp-card-chevron ${isExpanded ? 'open' : ''}`} />
              </div>
              {isExpanded && (
                <div className="rp-card-perms">
                  {permRows.map((perm, i) => {
                    const hasAccess = perm.roles[role.id];
                    return (
                      <div key={i} className={`rp-perm ${!hasAccess ? 'disabled' : ''}`}>
                        <span className={`rp-perm-icon ${hasAccess ? 'yes' : 'no'}`}>
                          {hasAccess ? <Check size={13} /> : <X size={13} />}
                        </span>
                        <span className="rp-perm-label">{perm.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
