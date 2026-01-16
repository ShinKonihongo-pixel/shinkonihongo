// Teacher schedule component - Weekly view of teaching schedule

import { useState, useMemo } from 'react';
import type { TeacherSchedule } from '../../types/teacher';
import type { Classroom } from '../../types/classroom';
import type { User } from '../../types/user';
import { BRANCH_MEMBER_ROLE_LABELS, BRANCH_MEMBER_ROLE_COLORS, type BranchMemberRole } from '../../types/branch';
import { DAY_OF_WEEK_LABELS } from '../../types/classroom';

interface ScheduleWithDetails extends TeacherSchedule {
  classroom?: Classroom;
  teacher?: User;
}

interface TeacherScheduleViewProps {
  schedules: ScheduleWithDetails[];
  classrooms: Classroom[];
  teachers: (User & { role?: BranchMemberRole })[];
  onAdd?: () => void;
  onEdit?: (schedule: ScheduleWithDetails) => void;
  onDelete?: (schedule: ScheduleWithDetails) => void;
  viewMode?: 'week' | 'teacher' | 'classroom';
  loading?: boolean;
}

export function TeacherScheduleView({
  schedules,
  classrooms,
  teachers,
  onAdd,
  onEdit,
  onDelete,
  viewMode: _viewMode = 'week',
  loading,
}: TeacherScheduleViewProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Enrich schedules with details
  const enrichedSchedules = useMemo(() => {
    return schedules.map(s => ({
      ...s,
      classroom: classrooms.find(c => c.id === s.classroomId),
      teacher: teachers.find(t => t.id === s.teacherId),
    }));
  }, [schedules, classrooms, teachers]);

  // Group by day of week
  const schedulesByDay = useMemo(() => {
    const grouped = new Map<number, ScheduleWithDetails[]>();
    for (let i = 0; i < 7; i++) {
      const daySchedules = enrichedSchedules
        .filter(s => s.dayOfWeek === i)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      grouped.set(i, daySchedules);
    }
    return grouped;
  }, [enrichedSchedules]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        Đang tải lịch dạy...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>Lịch dạy trong tuần</h3>
        {onAdd && (
          <button
            onClick={onAdd}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>+</span>
            Thêm lịch dạy
          </button>
        )}
      </div>

      {/* Week view */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px',
        marginBottom: '20px',
      }}>
        {[1, 2, 3, 4, 5, 6, 0].map(day => {
          const daySchedules = schedulesByDay.get(day) || [];
          const isSelected = selectedDay === day;
          const isToday = new Date().getDay() === day;

          return (
            <div
              key={day}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              style={{
                padding: '12px',
                borderRadius: '12px',
                background: isSelected
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : isToday
                    ? '#f5f0ff'
                    : '#fff',
                border: isToday && !isSelected ? '2px solid #667eea' : '1px solid #eee',
                cursor: 'pointer',
                minHeight: '80px',
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '8px',
                color: isSelected ? '#fff' : (isToday ? '#667eea' : '#666'),
              }}>
                {DAY_OF_WEEK_LABELS[day]}
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                color: isSelected ? '#fff' : '#333',
              }}>
                {daySchedules.length}
              </div>
              <div style={{
                fontSize: '11px',
                color: isSelected ? 'rgba(255,255,255,0.7)' : '#999',
              }}>
                tiết học
              </div>
            </div>
          );
        })}
      </div>

      {/* Schedule details */}
      {selectedDay !== null && (
        <div style={{
          background: '#f9f9f9',
          borderRadius: '12px',
          padding: '16px',
        }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>
            {DAY_OF_WEEK_LABELS[selectedDay]}
          </h4>

          {(schedulesByDay.get(selectedDay) || []).length === 0 ? (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#999',
              background: '#fff',
              borderRadius: '8px',
            }}>
              Không có tiết học nào
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(schedulesByDay.get(selectedDay) || []).map(schedule => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* All schedules list (when no day selected) */}
      {selectedDay === null && enrichedSchedules.length > 0 && (
        <div style={{
          background: '#f9f9f9',
          borderRadius: '12px',
          padding: '16px',
        }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>
            Tất cả lịch dạy ({enrichedSchedules.length})
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '12px',
          }}>
            {enrichedSchedules
              .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
              .map(schedule => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  showDay
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {enrichedSchedules.length === 0 && (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          background: '#f9f9f9',
          borderRadius: '12px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
          <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>Chưa có lịch dạy</h4>
          <p style={{ margin: 0, color: '#999', fontSize: '14px' }}>
            Bấm "Thêm lịch dạy" để tạo lịch dạy cho giáo viên
          </p>
        </div>
      )}
    </div>
  );
}

interface ScheduleCardProps {
  schedule: ScheduleWithDetails;
  showDay?: boolean;
  onEdit?: (schedule: ScheduleWithDetails) => void;
  onDelete?: (schedule: ScheduleWithDetails) => void;
}

function ScheduleCard({ schedule, showDay, onEdit, onDelete }: ScheduleCardProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      style={{
        padding: '14px',
        borderRadius: '10px',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        position: 'relative',
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div style={{ display: 'flex', gap: '12px' }}>
        {/* Time */}
        <div style={{
          padding: '8px 12px',
          background: `${BRANCH_MEMBER_ROLE_COLORS[schedule.role]}15`,
          borderRadius: '8px',
          textAlign: 'center',
          minWidth: '80px',
        }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: BRANCH_MEMBER_ROLE_COLORS[schedule.role] }}>
            {schedule.startTime}
          </div>
          <div style={{ fontSize: '11px', color: '#999' }}>
            - {schedule.endTime}
          </div>
        </div>

        {/* Details */}
        <div style={{ flex: 1 }}>
          {showDay && (
            <div style={{
              fontSize: '11px',
              color: '#667eea',
              fontWeight: 600,
              marginBottom: '4px',
            }}>
              {DAY_OF_WEEK_LABELS[schedule.dayOfWeek]}
            </div>
          )}
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
            {schedule.classroom?.name || 'Lớp học'}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: '#666',
            }}>
              👤 {schedule.teacher?.displayName || schedule.teacher?.username || 'Giáo viên'}
            </span>
            <span style={{
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 500,
              background: `${BRANCH_MEMBER_ROLE_COLORS[schedule.role]}20`,
              color: BRANCH_MEMBER_ROLE_COLORS[schedule.role],
            }}>
              {BRANCH_MEMBER_ROLE_LABELS[schedule.role]}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (onEdit || onDelete) && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          display: 'flex',
          gap: '4px',
        }}>
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(schedule);
              }}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: 'none',
                background: '#f5f5f5',
                cursor: 'pointer',
                fontSize: '12px',
              }}
              title="Chỉnh sửa"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(schedule);
              }}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: 'none',
                background: '#fff5f5',
                cursor: 'pointer',
                fontSize: '12px',
              }}
              title="Xóa"
            >
              🗑️
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Schedule add/edit modal
interface ScheduleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    teacherId: string;
    classroomId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    role: BranchMemberRole;
  }) => Promise<void>;
  teachers: (User & { role?: BranchMemberRole })[];
  classrooms: Classroom[];
  schedule?: ScheduleWithDetails;
  loading?: boolean;
}

export function ScheduleFormModal({
  isOpen,
  onClose,
  onSubmit,
  teachers,
  classrooms,
  schedule,
  loading,
}: ScheduleFormModalProps) {
  const [teacherId, setTeacherId] = useState(schedule?.teacherId || '');
  const [classroomId, setClassroomId] = useState(schedule?.classroomId || '');
  const [dayOfWeek, setDayOfWeek] = useState(schedule?.dayOfWeek ?? 1);
  const [startTime, setStartTime] = useState(schedule?.startTime || '09:00');
  const [endTime, setEndTime] = useState(schedule?.endTime || '10:30');
  const [role, setRole] = useState<BranchMemberRole>(schedule?.role || 'main_teacher');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId || !classroomId) return;

    await onSubmit({
      teacherId,
      classroomId,
      dayOfWeek,
      startTime,
      endTime,
      role,
    });
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
        maxWidth: '480px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>{schedule ? 'Sửa lịch dạy' : 'Thêm lịch dạy'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Teacher */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Giáo viên</label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            >
              <option value="">-- Chọn giáo viên --</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.displayName || t.username}</option>
              ))}
            </select>
          </div>

          {/* Classroom */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Lớp học</label>
            <select
              value={classroomId}
              onChange={(e) => setClassroomId(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            >
              <option value="">-- Chọn lớp học --</option>
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Day of week */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Ngày trong tuần</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            >
              {[1, 2, 3, 4, 5, 6, 0].map(d => (
                <option key={d} value={d}>{DAY_OF_WEEK_LABELS[d]}</option>
              ))}
            </select>
          </div>

          {/* Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Giờ bắt đầu</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Giờ kết thúc</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Role */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Vai trò</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {roleOptions.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: role === r ? '2px solid #667eea' : '1px solid #ddd',
                    background: role === r ? '#f5f0ff' : '#fff',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  {BRANCH_MEMBER_ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Đang lưu...' : (schedule ? 'Cập nhật' : 'Thêm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Export aliases for backward compatibility
export { TeacherScheduleView as TeacherSchedule };
export { ScheduleFormModal as ScheduleModal };
