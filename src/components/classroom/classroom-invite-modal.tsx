// Classroom invite modal - invite users to classroom

import { useState, useMemo } from 'react';
import type { User } from '../../types/user';
import type { ClassroomMember } from '../../types/classroom';
import { SearchInput } from '../ui/search-input';
import { ModalShell } from '../ui/modal-shell';

interface ClassroomInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroomCode: string;
  users: User[];
  existingMemberIds: string[];
  onInviteUser: (userId: string) => Promise<ClassroomMember | null>;
}

export function ClassroomInviteModal({
  isOpen,
  onClose,
  classroomCode,
  users,
  existingMemberIds,
  onInviteUser,
}: ClassroomInviteModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [inviting, setInviting] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Filter users that are not already members
  const availableUsers = useMemo(() => {
    return users.filter(u => !existingMemberIds.includes(u.id));
  }, [users, existingMemberIds]);

  // Search filter
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return availableUsers;
    const query = searchQuery.toLowerCase();
    return availableUsers.filter(
      u =>
        u.username.toLowerCase().includes(query) ||
        (u.displayName && u.displayName.toLowerCase().includes(query))
    );
  }, [availableUsers, searchQuery]);

  const handleInvite = async (userId: string) => {
    setInviting(userId);
    await onInviteUser(userId);
    setInviting(null);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(classroomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Mời học viên" maxWidth={480}>
        <div className="modal-body">
          {/* Share code section */}
          <div className="invite-section">
            <h3>Chia sẻ mã lớp</h3>
            <p className="invite-description">
              Học viên có thể nhập mã này để tham gia lớp học
            </p>
            <div className="invite-code-box">
              <span className="invite-code">{classroomCode}</span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleCopyCode}
              >
                {copiedCode ? 'Đã sao chép!' : 'Sao chép'}
              </button>
            </div>
          </div>

          {/* Direct invite section */}
          <div className="invite-section">
            <h3>Mời trực tiếp</h3>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Tìm kiếm người dùng..."
              className="form-input"
            />

            <div className="invite-user-list">
              {filteredUsers.length === 0 ? (
                <p className="empty-message">
                  {availableUsers.length === 0
                    ? 'Tất cả người dùng đã là thành viên'
                    : 'Không tìm thấy người dùng'}
                </p>
              ) : (
                filteredUsers.map(user => (
                  <div key={user.id} className="invite-user-item">
                    <div className="invite-user-info">
                      <div className="invite-user-avatar">
                        {user.avatar || (user.displayName || user.username).charAt(0).toUpperCase()}
                      </div>
                      <div className="invite-user-details">
                        <span className="invite-user-name">
                          {user.displayName || user.username}
                        </span>
                        <span className="invite-user-role">
                          {user.role === 'vip_user' ? 'VIP' : user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleInvite(user.id)}
                      disabled={inviting === user.id}
                    >
                      {inviting === user.id ? 'Đang mời...' : 'Mời'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
    </ModalShell>
  );
}
