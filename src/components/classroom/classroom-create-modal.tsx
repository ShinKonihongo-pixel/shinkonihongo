// Classroom create/edit modal with optimized UX

import { useState, useEffect } from 'react';
import type { Classroom, ClassroomFormData, ClassSchedule, ClassroomLevel } from '../../types/classroom';
import { CLASSROOM_LEVELS, DAY_OF_WEEK_LABELS } from '../../types/classroom';

// Schedule templates for quick setup
const SCHEDULE_TEMPLATES = [
  {
    id: 'evening-2',
    label: '2 buổi tối/tuần',
    schedules: [
      { dayOfWeek: 2, startTime: '19:00', endTime: '21:00' }, // Thứ 3
      { dayOfWeek: 5, startTime: '19:00', endTime: '21:00' }, // Thứ 6
    ],
  },
  {
    id: 'evening-3',
    label: '3 buổi tối/tuần',
    schedules: [
      { dayOfWeek: 2, startTime: '19:00', endTime: '21:00' }, // Thứ 3
      { dayOfWeek: 4, startTime: '19:00', endTime: '21:00' }, // Thứ 5
      { dayOfWeek: 6, startTime: '19:00', endTime: '21:00' }, // Thứ 7
    ],
  },
  {
    id: 'weekend',
    label: 'Cuối tuần',
    schedules: [
      { dayOfWeek: 6, startTime: '09:00', endTime: '11:00' }, // Thứ 7
      { dayOfWeek: 0, startTime: '09:00', endTime: '11:00' }, // Chủ nhật
    ],
  },
  {
    id: 'morning-2',
    label: '2 buổi sáng/tuần',
    schedules: [
      { dayOfWeek: 3, startTime: '08:00', endTime: '10:00' }, // Thứ 4
      { dayOfWeek: 6, startTime: '08:00', endTime: '10:00' }, // Thứ 7
    ],
  },
];

// Auto-suggested names based on level
const LEVEL_NAME_SUGGESTIONS: Record<ClassroomLevel, string[]> = {
  basic: ['Lớp N5 - Buổi tối', 'Lớp Cơ bản', 'Lớp Nhập môn', 'Lớp N5 cuối tuần'],
  intermediate: ['Lớp N4 - Buổi tối', 'Lớp Trung cấp', 'Lớp N4-N3', 'Lớp Giao tiếp'],
  advanced: ['Lớp N3 - Buổi tối', 'Lớp Nâng cao', 'Lớp N2-N1', 'Lớp Luyện thi'],
};

interface ClassroomCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ClassroomFormData) => Promise<boolean>;
  classroom?: Classroom; // For editing
}

export function ClassroomCreateModal({
  isOpen,
  onClose,
  onSave,
  classroom,
}: ClassroomCreateModalProps) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState<ClassroomLevel>('basic');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState<ClassSchedule[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (classroom) {
        setName(classroom.name);
        setLevel(classroom.level);
        setDescription(classroom.description || '');
        setSchedule(classroom.schedule || []);
      } else {
        setName('');
        setLevel('basic');
        setDescription('');
        setSchedule([]);
      }
      setError('');
      setShowNameSuggestions(false);
    }
  }, [isOpen, classroom]);

  // Handle level change - show name suggestions for new classroom
  const handleLevelChange = (newLevel: ClassroomLevel) => {
    setLevel(newLevel);
    // Only show suggestions for new classroom and if name is empty or matches a suggestion
    if (!classroom && (!name || Object.values(LEVEL_NAME_SUGGESTIONS).flat().includes(name))) {
      setShowNameSuggestions(true);
    }
  };

  // Apply schedule template
  const handleApplyTemplate = (templateId: string) => {
    const template = SCHEDULE_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSchedule(template.schedules);
    }
  };

  // Toggle day in schedule (add/remove)
  const handleToggleDay = (dayOfWeek: number) => {
    const existing = schedule.find(s => s.dayOfWeek === dayOfWeek);
    if (existing) {
      // Remove this day
      setSchedule(schedule.filter(s => s.dayOfWeek !== dayOfWeek));
    } else {
      // Add this day with default time
      const defaultTime = getDefaultTimeForDay(dayOfWeek);
      setSchedule([...schedule, { dayOfWeek, ...defaultTime }].sort((a, b) => a.dayOfWeek - b.dayOfWeek));
    }
  };

  // Get default time based on day (weekend = morning, weekday = evening)
  const getDefaultTimeForDay = (dayOfWeek: number): { startTime: string; endTime: string } => {
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { startTime: '09:00', endTime: '11:00' };
    }
    return { startTime: '19:00', endTime: '21:00' };
  };

  // Update time for a specific day
  const handleTimeChange = (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedule(schedule.map(s =>
      s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Vui lòng nhập tên lớp học');
      return;
    }

    setSaving(true);
    setError('');

    const data: ClassroomFormData = {
      name: name.trim(),
      level,
      description: description.trim() || undefined,
      schedule,
    };

    const success = await onSave(data);

    if (success) {
      onClose();
    } else {
      setError('Lỗi khi lưu lớp học');
    }

    setSaving(false);
  };

  if (!isOpen) return null;

  const selectedDays = new Set(schedule.map(s => s.dayOfWeek));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content classroom-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{classroom ? 'Sửa lớp học' : 'Tạo lớp học mới'}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}

            {/* Level selection - moved to top for better flow */}
            <div className="form-group">
              <label>Cấp độ *</label>
              <div className="level-buttons">
                {CLASSROOM_LEVELS.map(l => (
                  <button
                    key={l.value}
                    type="button"
                    className={`level-btn ${level === l.value ? 'active' : ''}`}
                    onClick={() => handleLevelChange(l.value)}
                    data-level={l.value}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Name with suggestions */}
            <div className="form-group">
              <label>Tên lớp học *</label>
              <input
                type="text"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  setShowNameSuggestions(false);
                }}
                onFocus={() => !classroom && setShowNameSuggestions(true)}
                placeholder="VD: Lớp N5 - Buổi tối"
                className="form-input"
                autoFocus
              />
              {showNameSuggestions && !classroom && (
                <div className="name-suggestions">
                  {LEVEL_NAME_SUGGESTIONS[level].map(suggestion => (
                    <button
                      key={suggestion}
                      type="button"
                      className="suggestion-btn"
                      onClick={() => {
                        setName(suggestion);
                        setShowNameSuggestions(false);
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description - collapsible for cleaner UI */}
            <div className="form-group">
              <label>Mô tả <span className="optional-label">(tùy chọn)</span></label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Mô tả ngắn về lớp học..."
                className="form-textarea"
                rows={2}
              />
            </div>

            {/* Schedule section with templates */}
            <div className="form-group">
              <label>Thời khóa biểu</label>

              {/* Quick templates */}
              <div className="schedule-templates">
                <span className="template-label">Mẫu nhanh:</span>
                {SCHEDULE_TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    type="button"
                    className="template-btn"
                    onClick={() => handleApplyTemplate(template.id)}
                  >
                    {template.label}
                  </button>
                ))}
              </div>

              {/* Day selector as grid */}
              <div className="day-selector">
                {[1, 2, 3, 4, 5, 6, 0].map(day => (
                  <button
                    key={day}
                    type="button"
                    className={`day-btn ${selectedDays.has(day) ? 'active' : ''}`}
                    onClick={() => handleToggleDay(day)}
                  >
                    {DAY_OF_WEEK_LABELS[day].replace('Thứ ', 'T').replace('Chủ nhật', 'CN')}
                  </button>
                ))}
              </div>

              {/* Time inputs for selected days */}
              {schedule.length > 0 && (
                <div className="schedule-times">
                  {schedule.sort((a, b) => (a.dayOfWeek === 0 ? 7 : a.dayOfWeek) - (b.dayOfWeek === 0 ? 7 : b.dayOfWeek)).map(s => (
                    <div key={s.dayOfWeek} className="schedule-time-row">
                      <span className="day-label">{DAY_OF_WEEK_LABELS[s.dayOfWeek]}</span>
                      <input
                        type="time"
                        value={s.startTime}
                        onChange={e => handleTimeChange(s.dayOfWeek, 'startTime', e.target.value)}
                        className="time-input"
                      />
                      <span className="time-separator">→</span>
                      <input
                        type="time"
                        value={s.endTime}
                        onChange={e => handleTimeChange(s.dayOfWeek, 'endTime', e.target.value)}
                        className="time-input"
                      />
                    </div>
                  ))}
                </div>
              )}

              {schedule.length === 0 && (
                <p className="schedule-hint">Chọn mẫu nhanh hoặc click vào ngày để thêm lịch học</p>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Đang lưu...' : classroom ? 'Cập nhật' : 'Tạo lớp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
