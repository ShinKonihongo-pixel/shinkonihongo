// Classroom create/edit modal

import { useState, useEffect } from 'react';
import type { Classroom, ClassroomFormData, ClassSchedule, ClassroomLevel } from '../../types/classroom';
import { CLASSROOM_LEVELS, DAY_OF_WEEK_LABELS } from '../../types/classroom';

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
    }
  }, [isOpen, classroom]);

  const handleAddSchedule = () => {
    setSchedule([
      ...schedule,
      { dayOfWeek: 1, startTime: '19:00', endTime: '21:00' },
    ]);
  };

  const handleRemoveSchedule = (index: number) => {
    setSchedule(schedule.filter((_, i) => i !== index));
  };

  const handleScheduleChange = (
    index: number,
    field: keyof ClassSchedule,
    value: string | number
  ) => {
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setSchedule(newSchedule);
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

            <div className="form-group">
              <label>Tên lớp học *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="VD: Lớp N5 - Buổi tối"
                className="form-input"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Cấp độ *</label>
              <select
                value={level}
                onChange={e => setLevel(e.target.value as ClassroomLevel)}
                className="form-select"
              >
                {CLASSROOM_LEVELS.map(l => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Mô tả</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Mô tả về lớp học..."
                className="form-textarea"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Thời khóa biểu</label>
              <div className="schedule-list">
                {schedule.map((s, index) => (
                  <div key={index} className="schedule-item">
                    <select
                      value={s.dayOfWeek}
                      onChange={e => handleScheduleChange(index, 'dayOfWeek', parseInt(e.target.value))}
                      className="form-select schedule-day"
                    >
                      {Object.entries(DAY_OF_WEEK_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={s.startTime}
                      onChange={e => handleScheduleChange(index, 'startTime', e.target.value)}
                      className="form-input schedule-time"
                    />
                    <span className="schedule-separator">-</span>
                    <input
                      type="time"
                      value={s.endTime}
                      onChange={e => handleScheduleChange(index, 'endTime', e.target.value)}
                      className="form-input schedule-time"
                    />
                    <button
                      type="button"
                      className="btn btn-icon btn-danger"
                      onClick={() => handleRemoveSchedule(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleAddSchedule}
                >
                  + Thêm lịch học
                </button>
              </div>
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
