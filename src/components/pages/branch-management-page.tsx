// Branch management page - For directors to manage branches

import { useState, useCallback } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { useBranches, useBranchMembers, useBranchStats, useCurrentBranch } from '../../hooks/use-branches';
import { BranchCard } from '../branch/branch-card';
import { BranchCreateModal } from '../branch/branch-create-modal';
import { ConfirmModal } from '../ui/confirm-modal';
import type { Branch, BranchFormData } from '../../types/branch';
import { BRANCH_MEMBER_ROLE_LABELS, BRANCH_STATUS_LABELS } from '../../types/branch';
import type { User } from '../../types/user';
import type { Page } from '../layout/header';

type ViewMode = 'list' | 'detail' | 'members' | 'settings';

interface BranchManagementPageProps {
  users: User[];
  onNavigate?: (page: Page) => void;
}

export function BranchManagementPage({ users, onNavigate }: BranchManagementPageProps) {
  const { currentUser } = useAuth();
  const isDirector = currentUser?.role === 'director' || currentUser?.role === 'super_admin';
  const { setCurrentBranch } = useCurrentBranch();

  const {
    branches,
    loading,
    createBranch,
    updateBranch,
    deleteBranch,
  } = useBranches(currentUser?.id || null, isDirector);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<Branch | null>(null);

  // Branch members hook
  const {
    membersWithUsers,
    loading: membersLoading,
    addMember,
    removeMember,
  } = useBranchMembers(selectedBranch?.id || null, users);

  // Branch stats
  const { stats } = useBranchStats(selectedBranch?.id || null);

  // Handle create branch
  const handleCreateBranch = useCallback(async (data: BranchFormData): Promise<boolean> => {
    if (!currentUser) return false;
    const result = await createBranch(data);
    return !!result;
  }, [createBranch, currentUser]);

  // Handle update branch
  const handleUpdateBranch = useCallback(async (data: BranchFormData): Promise<boolean> => {
    if (!editingBranch) return false;
    return await updateBranch(editingBranch.id, data);
  }, [editingBranch, updateBranch]);

  // Handle delete branch
  const handleDeleteBranch = useCallback(async () => {
    if (!deleteConfirm) return;
    await deleteBranch(deleteConfirm.id);
    if (selectedBranch?.id === deleteConfirm.id) {
      setSelectedBranch(null);
      setViewMode('list');
    }
    setDeleteConfirm(null);
  }, [deleteBranch, deleteConfirm, selectedBranch]);

  // Handle select branch
  const handleSelectBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    setViewMode('detail');
  };

  // Handle back to list
  const handleBack = () => {
    setSelectedBranch(null);
    setViewMode('list');
  };

  // Handle edit branch
  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setShowCreateModal(true);
  };

  // Handle add admin
  const handleAddAdmin = async (userId: string): Promise<boolean> => {
    if (!selectedBranch) return false;
    const result = await addMember(userId, 'branch_admin');
    return !!result;
  };

  // Handle remove member
  const handleRemoveMember = async (memberId: string) => {
    await removeMember(memberId);
  };

  // Get users not in branch
  const availableAdmins = users.filter(
    u => !membersWithUsers.some(m => m.userId === u.id) && u.id !== currentUser?.id
  );

  if (loading) {
    return <div className="loading-state">Đang tải...</div>;
  }

  // ============ LIST VIEW ============
  if (viewMode === 'list') {
    return (
      <div className="branch-page">
        <div className="page-header">
          <h1>Quản lý Chi nhánh</h1>
          {isDirector && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingBranch(undefined);
                setShowCreateModal(true);
              }}
            >
              + Tạo chi nhánh
            </button>
          )}
        </div>

        {/* Summary cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <SummaryCard label="Tổng chi nhánh" value={branches.length} icon="🏢" />
          <SummaryCard
            label="Đang hoạt động"
            value={branches.filter(b => b.status === 'active').length}
            icon="✅"
            color="#27ae60"
          />
          <SummaryCard
            label="Tạm ngưng"
            value={branches.filter(b => b.status === 'inactive').length}
            icon="⏸️"
            color="#e74c3c"
          />
        </div>

        {/* Branch list */}
        {branches.length === 0 ? (
          <div className="empty-state">
            <p>Chưa có chi nhánh nào</p>
            {isDirector && <p className="hint">Bấm "Tạo chi nhánh" để bắt đầu</p>}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}>
            {branches.map(branch => (
              <BranchCard
                key={branch.id}
                branch={branch}
                onClick={() => handleSelectBranch(branch)}
                onEdit={isDirector ? () => handleEdit(branch) : undefined}
                onDelete={isDirector ? () => setDeleteConfirm(branch) : undefined}
              />
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <BranchCreateModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setEditingBranch(undefined);
          }}
          onSubmit={async (data) => {
            if (editingBranch) {
              await handleUpdateBranch(data);
            } else {
              await handleCreateBranch(data);
            }
            setShowCreateModal(false);
          }}
          branch={editingBranch}
        />

        {/* Delete Confirm Modal */}
        <ConfirmModal
          isOpen={!!deleteConfirm}
          title="Xóa chi nhánh"
          message={`Bạn có chắc muốn xóa chi nhánh "${deleteConfirm?.name}"? Hành động này không thể hoàn tác.`}
          confirmText="Xóa"
          onConfirm={handleDeleteBranch}
          onCancel={() => setDeleteConfirm(null)}
        />
      </div>
    );
  }

  // ============ DETAIL VIEW ============
  if (!selectedBranch) {
    return null;
  }

  return (
    <div className="branch-page">
      <div className="page-header">
        <button className="btn btn-back" onClick={handleBack}>
          ← Quay lại
        </button>
        <h1>{selectedBranch.name}</h1>
        <span className={`status-badge status-${selectedBranch.status}`}>
          {BRANCH_STATUS_LABELS[selectedBranch.status]}
        </span>
        {isDirector && (
          <button
            className="btn btn-secondary"
            onClick={() => handleEdit(selectedBranch)}
          >
            Sửa
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="page-tabs">
        <button
          className={`tab-btn ${viewMode === 'detail' ? 'active' : ''}`}
          onClick={() => setViewMode('detail')}
        >
          Tổng quan
        </button>
        <button
          className={`tab-btn ${viewMode === 'members' ? 'active' : ''}`}
          onClick={() => setViewMode('members')}
        >
          Nhân sự ({membersWithUsers.length})
        </button>
        {isDirector && (
          <button
            className={`tab-btn ${viewMode === 'settings' ? 'active' : ''}`}
            onClick={() => setViewMode('settings')}
          >
            Cài đặt
          </button>
        )}
      </div>

      {/* Tab content */}
      <div className="page-content">
        {/* Overview Tab */}
        {viewMode === 'detail' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Branch Info */}
            <div className="card">
              <h3>Thông tin chi nhánh</h3>
              <div className="info-list">
                <InfoRow label="Mã chi nhánh" value={selectedBranch.code} />
                <InfoRow label="Địa chỉ" value={selectedBranch.address || '-'} />
                <InfoRow label="Điện thoại" value={selectedBranch.phone || '-'} />
                <InfoRow label="Email" value={selectedBranch.email || '-'} />
                <InfoRow
                  label="Ngày tạo"
                  value={new Date(selectedBranch.createdAt).toLocaleDateString('vi-VN')}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="card">
              <h3>Thống kê</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
              }}>
                <StatBox label="Lớp học" value={stats?.totalClasses || 0} />
                <StatBox label="Đang hoạt động" value={stats?.activeClasses || 0} />
                <StatBox label="Học viên" value={stats?.totalStudents || 0} />
                <StatBox label="Giáo viên" value={stats?.totalTeachers || 0} />
              </div>
            </div>

            {/* Quick actions */}
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <h3>Truy cập nhanh</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <QuickLink
                  icon="👥"
                  label="Quản lý giáo viên"
                  onClick={() => {
                    if (selectedBranch) setCurrentBranch(selectedBranch);
                    onNavigate?.('teachers');
                  }}
                />
                <QuickLink
                  icon="📚"
                  label="Lớp học"
                  onClick={() => {
                    if (selectedBranch) setCurrentBranch(selectedBranch);
                    onNavigate?.('classroom');
                  }}
                />
                <QuickLink
                  icon="💰"
                  label="Bảng lương"
                  onClick={() => {
                    if (selectedBranch) setCurrentBranch(selectedBranch);
                    onNavigate?.('salary');
                  }}
                />
                <QuickLink
                  icon="📊"
                  label="Báo cáo"
                  onClick={() => {
                    if (selectedBranch) setCurrentBranch(selectedBranch);
                    onNavigate?.('salary');
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Members Tab */}
        {viewMode === 'members' && (
          <div>
            <div className="section-header">
              <h3>Nhân sự chi nhánh</h3>
              {isDirector && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    id="add-admin-select"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                    }}
                  >
                    <option value="">Chọn người dùng...</option>
                    {availableAdmins.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.displayName || u.username}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      const select = document.getElementById('add-admin-select') as HTMLSelectElement;
                      if (select.value) {
                        handleAddAdmin(select.value);
                        select.value = '';
                      }
                    }}
                  >
                    + Thêm Admin
                  </button>
                </div>
              )}
            </div>

            {membersLoading ? (
              <p>Đang tải...</p>
            ) : membersWithUsers.length === 0 ? (
              <div className="empty-state">
                <p>Chưa có nhân sự</p>
              </div>
            ) : (
              <div className="members-table">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>Tên</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>Email</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Vai trò</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Ngày tham gia</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Trạng thái</th>
                      {isDirector && <th style={{ padding: '12px 16px' }}></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {membersWithUsers.map(member => (
                      <tr key={member.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: '#667eea',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600,
                            }}>
                              {(member.user?.displayName || '?').charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 500 }}>
                              {member.user?.displayName || member.user?.username || '-'}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#666' }}>
                          {member.user?.email || '-'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 500,
                            background: member.role === 'branch_admin' ? '#667eea20' : '#27ae6020',
                            color: member.role === 'branch_admin' ? '#667eea' : '#27ae60',
                          }}>
                            {BRANCH_MEMBER_ROLE_LABELS[member.role]}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px' }}>
                          {new Date(member.joinedAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            background: member.status === 'active' ? '#27ae6020' : '#e74c3c20',
                            color: member.status === 'active' ? '#27ae60' : '#e74c3c',
                          }}>
                            {member.status === 'active' ? 'Hoạt động' : 'Ngưng'}
                          </span>
                        </td>
                        {isDirector && (
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleRemoveMember(member.id)}
                            >
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
        )}

        {/* Settings Tab */}
        {viewMode === 'settings' && isDirector && (
          <div>
            <div className="card">
              <h3>Cài đặt chi nhánh</h3>
              <div className="settings-section">
                <div className="setting-item">
                  <div>
                    <strong>Trạng thái hoạt động</strong>
                    <p style={{ color: '#666', fontSize: '13px', margin: '4px 0 0' }}>
                      Tạm ngưng hoặc kích hoạt chi nhánh
                    </p>
                  </div>
                  <button
                    className={`btn ${selectedBranch.status === 'active' ? 'btn-warning' : 'btn-success'}`}
                    onClick={() => {
                      updateBranch(selectedBranch.id, {
                        name: selectedBranch.name,
                        code: selectedBranch.code,
                        status: selectedBranch.status === 'active' ? 'inactive' : 'active',
                      });
                    }}
                  >
                    {selectedBranch.status === 'active' ? 'Tạm ngưng' : 'Kích hoạt'}
                  </button>
                </div>

                <div className="setting-item" style={{ borderTop: '1px solid #eee', paddingTop: '16px', marginTop: '16px' }}>
                  <div>
                    <strong style={{ color: '#e74c3c' }}>Xóa chi nhánh</strong>
                    <p style={{ color: '#666', fontSize: '13px', margin: '4px 0 0' }}>
                      Xóa vĩnh viễn chi nhánh và tất cả dữ liệu
                    </p>
                  </div>
                  <button
                    className="btn btn-danger"
                    onClick={() => setDeleteConfirm(selectedBranch)}
                  >
                    Xóa chi nhánh
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <BranchCreateModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingBranch(undefined);
        }}
        onSubmit={async (data) => {
          if (editingBranch) {
            await handleUpdateBranch(data);
          } else {
            await handleCreateBranch(data);
          }
          setShowCreateModal(false);
        }}
        branch={editingBranch}
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="Xóa chi nhánh"
        message={`Bạn có chắc muốn xóa chi nhánh "${deleteConfirm?.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        onConfirm={handleDeleteBranch}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}

// Helper components
function SummaryCard({ label, value, icon, color }: { label: string; value: number; icon: string; color?: string }) {
  return (
    <div style={{
      padding: '16px 20px',
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <span style={{ fontSize: '12px', color: '#999' }}>{label}</span>
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: color || '#333' }}>{value}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
      <span style={{ color: '#666' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      padding: '16px',
      background: '#f9f9f9',
      borderRadius: '8px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '24px', fontWeight: 700, color: '#667eea' }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{label}</div>
    </div>
  );
}

function QuickLink({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 20px',
        background: '#f5f5f5',
        borderRadius: '8px',
        border: 'none',
        color: '#333',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'background 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#eee'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = '#f5f5f5'; }}
    >
      <span style={{ fontSize: '18px' }}>{icon}</span>
      {label}
    </button>
  );
}
