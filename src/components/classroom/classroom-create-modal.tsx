// Classroom create/edit modal with unified Room Modal design system

import { useState, useEffect } from 'react';
import { X, GraduationCap, Calendar, Clock, Sparkles } from 'lucide-react';
import type { Classroom, ClassroomFormData, ClassSchedule, ClassroomLevel } from '../../types/classroom';
import { CLASSROOM_LEVELS, DAY_OF_WEEK_LABELS } from '../../types/classroom';

// Schedule templates for quick setup
const SCHEDULE_TEMPLATES = [
  {
    id: 'evening-2',
    label: '2 buổi tối/tuần',
    schedules: [
      { dayOfWeek: 2, startTime: '19:00', endTime: '21:00' },
      { dayOfWeek: 5, startTime: '19:00', endTime: '21:00' },
    ],
  },
  {
    id: 'evening-3',
    label: '3 buổi tối/tuần',
    schedules: [
      { dayOfWeek: 2, startTime: '19:00', endTime: '21:00' },
      { dayOfWeek: 4, startTime: '19:00', endTime: '21:00' },
      { dayOfWeek: 6, startTime: '19:00', endTime: '21:00' },
    ],
  },
  {
    id: 'weekend',
    label: 'Cuối tuần',
    schedules: [
      { dayOfWeek: 6, startTime: '09:00', endTime: '11:00' },
      { dayOfWeek: 0, startTime: '09:00', endTime: '11:00' },
    ],
  },
  {
    id: 'morning-2',
    label: '2 buổi sáng/tuần',
    schedules: [
      { dayOfWeek: 3, startTime: '08:00', endTime: '10:00' },
      { dayOfWeek: 6, startTime: '08:00', endTime: '10:00' },
    ],
  },
];

// Auto-suggested names based on level
const LEVEL_NAME_SUGGESTIONS: Record<ClassroomLevel, string[]> = {
  basic: ['Lớp N5 - Buổi tối', 'Lớp Cơ bản', 'Lớp Nhập môn', 'Lớp N5 cuối tuần'],
  intermediate: ['Lớp N4 - Buổi tối', 'Lớp Trung cấp', 'Lớp N4-N3', 'Lớp Giao tiếp'],
  advanced: ['Lớp N3 - Buổi tối', 'Lớp Nâng cao', 'Lớp N2-N1', 'Lớp Luyện thi'],
};

// Level colors for pills
const LEVEL_COLORS: Record<ClassroomLevel, string> = {
  basic: '#22c55e',
  intermediate: '#3b82f6',
  advanced: '#f59e0b',
};

interface ClassroomCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ClassroomFormData) => Promise<boolean>;
  classroom?: Classroom;
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
      setSchedule(schedule.filter(s => s.dayOfWeek !== dayOfWeek));
    } else {
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
    <div className="rm-overlay" onClick={onClose}>
      <div className="rm-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <header className="rm-header">
          <div
            className="rm-header-gradient"
            style={{ background: `linear-gradient(135deg, ${LEVEL_COLORS[level]} 0%, ${LEVEL_COLORS[level]}80 100%)` }}
          />
          <div className="rm-header-icon" style={{ background: LEVEL_COLORS[level] }}>
            <GraduationCap size={24} color="white" />
          </div>
          <div className="rm-header-content">
            <h1 className="rm-title">{classroom ? 'Sửa lớp học' : 'Tạo lớp học mới'}</h1>
            <span className="rm-subtitle">Quản lý lớp học của bạn</span>
          </div>
          <button className="rm-close-btn" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </header>

        {/* Body */}
        <form className="rm-body" onSubmit={handleSubmit}>
          {error && (
            <div className="rm-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Level Selection */}
          <div className="rm-field">
            <label className="rm-label">
              <GraduationCap size={16} />
              <span>Cấp độ</span>
            </label>
            <div className="rm-pills">
              {CLASSROOM_LEVELS.map(l => (
                <button
                  key={l.value}
                  type="button"
                  className={`rm-pill ${level === l.value ? 'active' : ''}`}
                  onClick={() => handleLevelChange(l.value)}
                  style={level === l.value ? {
                    background: LEVEL_COLORS[l.value],
                    borderColor: LEVEL_COLORS[l.value],
                    boxShadow: `0 0 15px ${LEVEL_COLORS[l.value]}40`
                  } : undefined}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Name with suggestions */}
          <div className="rm-field">
            <label className="rm-label">
              <Sparkles size={16} />
              <span>Tên lớp học</span>
            </label>
            <input
              type="text"
              className="rm-input"
              value={name}
              onChange={e => {
                setName(e.target.value);
                setShowNameSuggestions(false);
              }}
              onFocus={() => !classroom && setShowNameSuggestions(true)}
              placeholder="VD: Lớp N5 - Buổi tối"
              autoFocus
            />
            {showNameSuggestions && !classroom && (
              <div className="rm-suggestions">
                {LEVEL_NAME_SUGGESTIONS[level].map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    className="rm-suggestion-btn"
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

          {/* Description */}
          <div className="rm-field">
            <label className="rm-label">
              <span>Mô tả</span>
              <span className="rm-label-hint">(tùy chọn)</span>
            </label>
            <textarea
              className="rm-textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về lớp học..."
              rows={2}
            />
          </div>

          {/* Schedule Section */}
          <div className="rm-section">
            <div className="rm-section-title">
              <Calendar size={16} />
              <span>Thời khóa biểu</span>
            </div>

            {/* Quick templates */}
            <div className="rm-templates">
              <span className="rm-template-label">Mẫu nhanh:</span>
              {SCHEDULE_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  type="button"
                  className="rm-template-btn"
                  onClick={() => handleApplyTemplate(template.id)}
                >
                  {template.label}
                </button>
              ))}
            </div>

            {/* Day selector as grid */}
            <div className="rm-day-grid">
              {[1, 2, 3, 4, 5, 6, 0].map(day => (
                <button
                  key={day}
                  type="button"
                  className={`rm-day-btn ${selectedDays.has(day) ? 'active' : ''}`}
                  onClick={() => handleToggleDay(day)}
                >
                  {DAY_OF_WEEK_LABELS[day].replace('Thứ ', 'T').replace('Chủ nhật', 'CN')}
                </button>
              ))}
            </div>

            {/* Time inputs for selected days */}
            {schedule.length > 0 && (
              <div className="rm-schedule-times">
                {schedule.sort((a, b) => (a.dayOfWeek === 0 ? 7 : a.dayOfWeek) - (b.dayOfWeek === 0 ? 7 : b.dayOfWeek)).map(s => (
                  <div key={s.dayOfWeek} className="rm-time-row">
                    <span className="rm-time-label">{DAY_OF_WEEK_LABELS[s.dayOfWeek]}</span>
                    <input
                      type="time"
                      value={s.startTime}
                      onChange={e => handleTimeChange(s.dayOfWeek, 'startTime', e.target.value)}
                      className="rm-time-input"
                    />
                    <span className="rm-time-separator">→</span>
                    <input
                      type="time"
                      value={s.endTime}
                      onChange={e => handleTimeChange(s.dayOfWeek, 'endTime', e.target.value)}
                      className="rm-time-input"
                    />
                  </div>
                ))}
              </div>
            )}

            {schedule.length === 0 && (
              <div className="rm-info-box" style={{ marginTop: 'var(--rm-space-md)' }}>
                <p>
                  <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  Chọn mẫu nhanh hoặc click vào ngày để thêm lịch học
                </p>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <footer className="rm-footer">
          <button type="button" className="rm-btn rm-btn-ghost" onClick={onClose}>
            Hủy
          </button>
          <button
            type="submit"
            className="rm-btn rm-btn-primary rm-btn-lg"
            disabled={saving}
            onClick={handleSubmit}
            style={{ background: LEVEL_COLORS[level] }}
          >
            {saving ? (
              <>
                <span className="rm-spinner" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <span>{classroom ? 'Cập nhật' : 'Tạo lớp'}</span>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
