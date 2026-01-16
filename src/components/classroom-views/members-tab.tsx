// Members Tab - Classroom members management

import type { MembersTabProps } from './classroom-types';

export function MembersTab({ classroom, students, loading, onInviteClick, onRemoveMember }: MembersTabProps) {
  return (
    <div className="classroom-members">
      <div className="members-header">
        <h3>Danh sách học viên</h3>
        <button className="btn btn-primary" onClick={onInviteClick}>+ Mời học viên</button>
      </div>

      {/* Class code display */}
      <div className="class-code-section">
        <span className="class-code-label">Mã lớp:</span>
        <span className="class-code-value">{classroom.code}</span>
        <button className="btn btn-sm btn-secondary" onClick={() => navigator.clipboard.writeText(classroom.code)}>
          Sao chép
        </button>
      </div>

      {/* Current members */}
      <div className="current-members">
        <h4>Học viên hiện tại ({students.length})</h4>
        {loading ? (
          <p>Đang tải...</p>
        ) : students.length === 0 ? (
          <p className="empty-text">Chưa có học viên</p>
        ) : (
          <div className="members-list">
            {students.map(member => (
              <div key={member.id} className="member-item">
                <div className="member-info">
                  <span className="member-name">{member.user?.displayName || member.user?.username || 'Unknown'}</span>
                  <span className="member-joined">Tham gia: {new Date(member.joinedAt).toLocaleDateString('vi-VN')}</span>
                  <span className="member-method">({member.inviteMethod === 'code' ? 'Mã lớp' : 'Mời trực tiếp'})</span>
                </div>
                <button className="btn btn-sm btn-danger" onClick={() => onRemoveMember(member.id)}>Xóa</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
