// Classroom List View - Grid of classroom cards with join functionality

import { School, Plus } from 'lucide-react';
import { ClassroomCard } from '../classroom/classroom-card';
import type { ClassroomListViewProps } from './classroom-types';
import { EmptyState } from '../ui/empty-state';

export function ClassroomListView({
  classrooms, isAdmin, unreadCount,
  joinCode, joinError, joining,
  onJoinCodeChange, onJoinByCode,
  onSelectClassroom, onCreateClick, onEdit, onDelete,
}: ClassroomListViewProps) {
  return (
    <div className="classroom-page">
      <div className="classroom-header">
        <h1>Lớp học</h1>
        {unreadCount > 0 && <span className="notification-badge-inline">{unreadCount} thông báo mới</span>}
        {isAdmin && <button className="btn btn-primary" onClick={onCreateClick}>+ Tạo lớp học</button>}
      </div>

      {/* Join by code section for students */}
      {!isAdmin && (
        <div className="join-classroom-section">
          <h3>Tham gia lớp học</h3>
          <div className="join-form">
            <input
              type="text"
              placeholder="Nhập mã lớp học..."
              value={joinCode}
              onChange={e => onJoinCodeChange(e.target.value.toUpperCase())}
              className="join-input"
              maxLength={6}
            />
            <button className="btn btn-primary" onClick={onJoinByCode} disabled={joining}>
              {joining ? 'Đang tham gia...' : 'Tham gia'}
            </button>
          </div>
          {joinError && <p className="error-text">{joinError}</p>}
        </div>
      )}

      {/* Classroom list */}
      {classrooms.length === 0 ? (
        <EmptyState
          icon={<School size={52} strokeWidth={1.2} />}
          title={isAdmin ? 'Chưa có lớp học nào' : 'Bạn chưa tham gia lớp học nào'}
          description={isAdmin ? 'Tạo lớp học đầu tiên để bắt đầu giảng dạy' : 'Nhập mã lớp để tham gia hoặc liên hệ giáo viên để được mời'}
          action={isAdmin ? { label: 'Tạo lớp học', onClick: onCreateClick } : undefined}
        />
      ) : (
        <div className="classroom-grid">
          {classrooms.map(classroom => (
            <ClassroomCard
              key={classroom.id}
              classroom={classroom}
              onClick={() => onSelectClassroom(classroom)}
              showActions={isAdmin}
              onEdit={() => onEdit(classroom)}
              onDelete={() => onDelete(classroom)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
