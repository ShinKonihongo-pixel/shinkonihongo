// Modal for adding/editing a teacher in branch

import { useState, useEffect } from 'react';
import type { BranchMember, BranchMemberFormData, BranchMemberRole, SalaryType } from '../../types/branch';
import type { User } from '../../types/user';
import {
  BRANCH_MEMBER_ROLE_LABELS,
  SALARY_TYPE_LABELS,
} from '../../types/branch';

interface TeacherAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BranchMemberFormData, userId?: string) => Promise<void>;
  existingUsers?: User[]; // Users that can be added
  existingMemberIds?: string[]; // User IDs already in branch
  member?: BranchMember & { user?: User }; // If provided, edit mode
  loading?: boolean;
}

type AddMode = 'existing' | 'new';

export function TeacherAddModal({
  isOpen,
  onClose,
  onSubmit,
  existingUsers = [],
  existingMemberIds = [],
  member,
  loading,
}: TeacherAddModalProps) {
  const [mode, setMode] = useState<AddMode>('existing');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // New user form
  const [newUser, setNewUser] = useState({
    username: '',
    displayName: '',
    password: '',
  });

  // Role and salary
  const [role, setRole] = useState<BranchMemberRole>('main_teacher');
  const [salaryType, setSalaryType] = useState<SalaryType>('hourly');
  const [salaryAmount, setSalaryAmount] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (member) {
        // Edit mode
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMode('existing');
        setSelectedUserId(member.userId);
        setRole(member.role);
        if (member.salary) {
          setSalaryType(member.salary.type);
          setSalaryAmount(member.salary.amount.toString());
        }
      } else {
        // Add mode
        setMode('existing');
        setSelectedUserId('');
        setSearchQuery('');
        setNewUser({ username: '', displayName: '', password: '' });
        setRole('main_teacher');
        setSalaryType('hourly');
        setSalaryAmount('');
      }
      setErrors({});
    }
  }, [isOpen, member]);

  // Filter available users
  const availableUsers = existingUsers.filter(u =>
    !existingMemberIds.includes(u.id) &&
    (u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     u.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (mode === 'existing' && !selectedUserId && !member) {
      newErrors.user = 'Vui lòng chọn giáo viên';
    }

    if (mode === 'new') {
      if (!newUser.username.trim()) {
        newErrors.username = 'Tên đăng nhập không được để trống';
      } else if (newUser.username.length < 3) {
        newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
      }

      if (!newUser.password.trim()) {
        newErrors.password = 'Mật khẩu không được để trống';
      } else if (newUser.password.length < 6) {
        newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      }
    }

    if (salaryAmount && isNaN(Number(salaryAmount))) {
      newErrors.salary = 'Mức lương không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const formData: BranchMemberFormData = {
      role,
      salary: salaryAmount ? {
        type: salaryType,
        amount: Number(salaryAmount),
      } : undefined,
    };

    if (mode === 'new') {
      formData.username = newUser.username;
      formData.displayName = newUser.displayName || newUser.username;
      formData.password = newUser.password;
    } else {
      formData.userId = selectedUserId || member?.userId;
    }

    await onSubmit(formData, mode === 'existing' ? (selectedUserId || member?.userId) : undefined);
  };

  if (!isOpen) return null;

  const roleOptions: BranchMemberRole[] = ['main_teacher', 'part_time_teacher', 'assistant'];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '24px',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>
            {member ? 'Chỉnh sửa giáo viên' : 'Thêm giáo viên'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Mode tabs (only for add mode) */}
          {!member && (
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px',
            }}>
              <ModeTab
                label="Chọn từ danh sách"
                active={mode === 'existing'}
                onClick={() => setMode('existing')}
              />
              <ModeTab
                label="Tạo tài khoản mới"
                active={mode === 'new'}
                onClick={() => setMode('new')}
              />
            </div>
          )}

          {/* Existing user selection */}
          {mode === 'existing' && !member && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Chọn giáo viên
              </label>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  marginBottom: '12px',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{
                maxHeight: '200px',
                overflow: 'auto',
                border: '1px solid #eee',
                borderRadius: '8px',
              }}>
                {availableUsers.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                    Không tìm thấy người dùng
                  </div>
                ) : (
                  availableUsers.map(user => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid #eee',
                        cursor: 'pointer',
                        background: selectedUserId === user.id ? '#f5f0ff' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#667eea',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 600,
                      }}>
                        {user.avatar || (user.displayName || user.username).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {user.displayName || user.username}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          @{user.username}
                        </div>
                      </div>
                      {selectedUserId === user.id && (
                        <span style={{ marginLeft: 'auto', color: '#667eea' }}>✓</span>
                      )}
                    </div>
                  ))
                )}
              </div>
              {errors.user && (
                <span style={{ color: '#e74c3c', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {errors.user}
                </span>
              )}
            </div>
          )}

          {/* New user form */}
          {mode === 'new' && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                  Tên đăng nhập <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="VD: nguyenvana"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: errors.username ? '1px solid #e74c3c' : '1px solid #ddd',
                    boxSizing: 'border-box',
                  }}
                />
                {errors.username && (
                  <span style={{ color: '#e74c3c', fontSize: '12px' }}>{errors.username}</span>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  value={newUser.displayName}
                  onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                  placeholder="VD: Nguyễn Văn A"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                  Mật khẩu <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Ít nhất 6 ký tự"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: errors.password ? '1px solid #e74c3c' : '1px solid #ddd',
                    boxSizing: 'border-box',
                  }}
                />
                {errors.password && (
                  <span style={{ color: '#e74c3c', fontSize: '12px' }}>{errors.password}</span>
                )}
              </div>
            </div>
          )}

          {/* Edit mode - show current user */}
          {member && (
            <div style={{
              marginBottom: '20px',
              padding: '12px',
              background: '#f5f5f5',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#667eea',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}>
                {member.user?.avatar || (member.user?.displayName || member.user?.username || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 500 }}>
                  {member.user?.displayName || member.user?.username}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  @{member.user?.username}
                </div>
              </div>
            </div>
          )}

          {/* Role selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Vai trò
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {roleOptions.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: role === r ? '2px solid #667eea' : '1px solid #ddd',
                    background: role === r ? '#f5f0ff' : '#fff',
                    color: role === r ? '#667eea' : '#333',
                    fontWeight: role === r ? 600 : 400,
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  {BRANCH_MEMBER_ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Salary configuration */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Cấu hình lương
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <select
                  value={salaryType}
                  onChange={(e) => setSalaryType(e.target.value as SalaryType)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                  }}
                >
                  <option value="hourly">{SALARY_TYPE_LABELS.hourly}</option>
                  <option value="monthly">{SALARY_TYPE_LABELS.monthly}</option>
                </select>
              </div>
              <div>
                <input
                  type="text"
                  value={salaryAmount}
                  onChange={(e) => setSalaryAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder={salaryType === 'hourly' ? 'VD: 150000' : 'VD: 8000000'}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: errors.salary ? '1px solid #e74c3c' : '1px solid #ddd',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
            {errors.salary && (
              <span style={{ color: '#e74c3c', fontSize: '12px' }}>{errors.salary}</span>
            )}
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              {salaryType === 'hourly'
                ? 'Nhập số tiền VND/giờ'
                : 'Nhập số tiền VND/tháng'}
            </div>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            marginTop: '24px',
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                background: '#fff',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Đang xử lý...' : (member ? 'Cập nhật' : 'Thêm giáo viên')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ModeTabProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function ModeTab({ label, active, onClick }: ModeTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px',
        borderRadius: '8px',
        border: active ? '2px solid #667eea' : '1px solid #ddd',
        background: active ? '#f5f0ff' : '#fff',
        color: active ? '#667eea' : '#666',
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        fontSize: '13px',
      }}
    >
      {label}
    </button>
  );
}
