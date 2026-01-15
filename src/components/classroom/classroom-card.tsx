// Classroom card component

import type { Classroom } from '../../types/classroom';
import { CLASSROOM_LEVEL_LABELS, CLASSROOM_LEVEL_COLORS, DAY_OF_WEEK_LABELS } from '../../types/classroom';

interface ClassroomCardProps {
  classroom: Classroom;
  onClick: () => void;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ClassroomCard({
  classroom,
  onClick,
  showActions = false,
  onEdit,
  onDelete,
}: ClassroomCardProps) {
  const levelColor = CLASSROOM_LEVEL_COLORS[classroom.level];
  const levelLabel = CLASSROOM_LEVEL_LABELS[classroom.level];

  // Format schedule display
  const formatSchedule = () => {
    if (!classroom.schedule || classroom.schedule.length === 0) {
      return 'Chưa có lịch học';
    }

    return classroom.schedule.map(s => {
      const day = DAY_OF_WEEK_LABELS[s.dayOfWeek];
      return `${day} ${s.startTime}-${s.endTime}`;
    }).join(', ');
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc muốn xóa lớp học này? Tất cả dữ liệu sẽ bị xóa.')) {
      onDelete?.();
    }
  };

  return (
    <div className="classroom-card" onClick={onClick}>
      <div
        className="classroom-card-header"
        style={{ backgroundColor: levelColor }}
      >
        <span className="classroom-level-badge">{levelLabel}</span>
        {!classroom.isActive && (
          <span className="classroom-inactive-badge">Đã đóng</span>
        )}
      </div>

      <div className="classroom-card-body">
        <h3 className="classroom-card-title">{classroom.name}</h3>

        {classroom.description && (
          <p className="classroom-card-description">{classroom.description}</p>
        )}

        <div className="classroom-card-info">
          <div className="classroom-info-item">
            <span className="info-icon">👥</span>
            <span>{classroom.studentCount} học viên</span>
          </div>

          <div className="classroom-info-item">
            <span className="info-icon">📅</span>
            <span>{formatSchedule()}</span>
          </div>
        </div>

        <div className="classroom-card-footer">
          <span className="classroom-code">Mã lớp: {classroom.code}</span>

          {showActions && (
            <div className="classroom-card-actions">
              {onEdit && (
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={handleEdit}
                >
                  Sửa
                </button>
              )}
              {onDelete && (
                <button
                  className="btn btn-sm btn-danger"
                  onClick={handleDelete}
                >
                  Xóa
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
