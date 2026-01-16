// Student Overview - Student view of classroom details

import { CLASSROOM_LEVELS, CLASSROOM_LEVEL_COLORS, DAY_OF_WEEK_LABELS } from '../../types/classroom';
import type { StudentOverviewProps } from './classroom-types';

export function StudentOverview({ classroom }: StudentOverviewProps) {
  const formatSchedule = () => {
    if (!classroom.schedule || classroom.schedule.length === 0) {
      return <p className="empty-text">Chưa có lịch học</p>;
    }
    return classroom.schedule.map(s => (
      <div key={`${s.dayOfWeek}-${s.startTime}`} className="schedule-display-item">
        <span className="schedule-day">{DAY_OF_WEEK_LABELS[s.dayOfWeek]}</span>
        <span className="schedule-time">{s.startTime} - {s.endTime}</span>
      </div>
    ));
  };

  return (
    <div className="classroom-overview">
      <div className="overview-card">
        <h3>Thông tin lớp học</h3>
        <div className="overview-info">
          <div className="info-row">
            <span className="info-label">Cấp độ:</span>
            <span className="level-badge" style={{ backgroundColor: CLASSROOM_LEVEL_COLORS[classroom.level] }}>
              {CLASSROOM_LEVELS.find(l => l.value === classroom.level)?.label}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Mã lớp:</span>
            <span className="classroom-code-display">{classroom.code}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Số học viên:</span>
            <span>{classroom.studentCount}</span>
          </div>
          {classroom.description && (
            <div className="info-row">
              <span className="info-label">Mô tả:</span>
              <span>{classroom.description}</span>
            </div>
          )}
        </div>
      </div>

      <div className="overview-card">
        <h3>Thời khóa biểu</h3>
        <div className="schedule-display">{formatSchedule()}</div>
      </div>
    </div>
  );
}
