import { DAY_OF_WEEK_LABELS } from '../../../types/classroom';
import { BRANCH_MEMBER_ROLE_COLORS } from '../../../types/branch';
import type { TeacherSchedule } from '../../../types/teacher';

interface ScheduleViewProps {
  schedules: TeacherSchedule[];
  schedulesLoading: boolean;
  schedulesByDay: Map<number, TeacherSchedule[]>;
}

export function ScheduleView({ schedules, schedulesLoading, schedulesByDay }: ScheduleViewProps) {
  const today = new Date().getDay();

  return (
    <div>
      <h3 style={{ margin: '0 0 20px 0' }}>Lịch dạy trong tuần</h3>

      {schedulesLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Đang tải...</div>
      ) : schedules.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có lịch dạy</p>
          <p className="hint">Liên hệ Admin để được phân công lịch dạy</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '12px',
        }}>
          {[1, 2, 3, 4, 5, 6, 0].map(day => {
            const daySchedules = schedulesByDay.get(day) || [];
            const isToday = today === day;

            return (
              <div
                key={day}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: isToday ? '#f5f0ff' : '#fff',
                  border: isToday ? '2px solid #667eea' : '1px solid #eee',
                  minHeight: '120px',
                }}
              >
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '12px',
                  color: isToday ? '#667eea' : '#666',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  {DAY_OF_WEEK_LABELS[day]}
                  {isToday && <span style={{ fontSize: '10px', background: '#667eea', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>Hôm nay</span>}
                </div>

                {daySchedules.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#ccc', textAlign: 'center', padding: '20px 0' }}>
                    Nghỉ
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {daySchedules.map(s => (
                      <div
                        key={s.id}
                        style={{
                          padding: '8px',
                          background: `${BRANCH_MEMBER_ROLE_COLORS[s.role]}15`,
                          borderRadius: '6px',
                          borderLeft: `3px solid ${BRANCH_MEMBER_ROLE_COLORS[s.role]}`,
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 600, color: BRANCH_MEMBER_ROLE_COLORS[s.role] }}>
                          {s.startTime} - {s.endTime}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                          {s.classroomId ? 'Lớp học' : 'Chưa xác định'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
