// Topic Modal Component
import { BookOpen, Eye, EyeOff, Circle, CheckCircle } from 'lucide-react';
import { JLPT_LEVELS } from '../../../constants/jlpt';
import {
  TOPIC_ICONS,
  TOPIC_COLORS,
  TOPIC_ICON_LABELS,
  DIFFICULTY_LABELS,
} from '../../../types/custom-topic';
import type { TopicDifficulty } from '../../../types/custom-topic';
import type { JLPTLevel } from '../../../types/kaiwa';
import type { Lesson, GrammarLesson } from '../../../types/flashcard';
import type { CustomTopic, CustomTopicFormData } from './custom-topics-types';
import { renderTopicIcon } from './custom-topics-types';

interface TopicModalProps {
  isOpen: boolean;
  editingTopic: CustomTopic | null;
  formData: CustomTopicFormData;
  selectedSourceLevel: JLPTLevel;
  selectedSourceType: 'vocabulary' | 'grammar';
  lessons: Lesson[];
  grammarLessons: GrammarLesson[];
  getLessonsByLevel?: (level: JLPTLevel) => Lesson[];
  getGrammarLessonsByLevel?: (level: JLPTLevel) => GrammarLesson[];
  onClose: () => void;
  onSave: () => void;
  onFormChange: (data: CustomTopicFormData) => void;
  onSourceLevelChange: (level: JLPTLevel) => void;
  onSourceTypeChange: (type: 'vocabulary' | 'grammar') => void;
}

export function TopicModal({
  isOpen,
  editingTopic,
  formData,
  selectedSourceLevel,
  selectedSourceType,
  lessons,
  grammarLessons,
  getLessonsByLevel,
  getGrammarLessonsByLevel,
  onClose,
  onSave,
  onFormChange,
  onSourceLevelChange,
  onSourceTypeChange,
}: TopicModalProps) {
  if (!isOpen) return null;

  const handleLessonToggle = (lessonId: string) => {
    const currentLinked = formData.linkedLessonIds || [];
    const isLinked = currentLinked.includes(lessonId);
    const newLinked = isLinked
      ? currentLinked.filter(id => id !== lessonId)
      : [...currentLinked, lessonId];
    onFormChange({ ...formData, linkedLessonIds: newLinked });
  };

  const vocabLessons = getLessonsByLevel
    ? getLessonsByLevel(selectedSourceLevel)
    : lessons.filter(l => l.jlptLevel === selectedSourceLevel && !l.parentId);

  const grammarLessonsList = getGrammarLessonsByLevel
    ? getGrammarLessonsByLevel(selectedSourceLevel)
    : grammarLessons.filter(l => l.jlptLevel === selectedSourceLevel && !l.parentId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="topic-modal topic-modal-large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingTopic ? 'Chỉnh sửa chủ đề' : 'Tạo chủ đề mới'}</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Name & Description */}
          <div className="form-section">
            <label>Tên chủ đề *</label>
            <input
              type="text"
              className="form-input"
              placeholder="VD: Tiếng Nhật Kinh Doanh"
              value={formData.name}
              onChange={e => onFormChange({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="form-section">
            <label>Mô tả</label>
            <textarea
              className="form-input"
              placeholder="Mô tả ngắn về nội dung chủ đề..."
              rows={2}
              value={formData.description}
              onChange={e => onFormChange({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Icon & Color */}
          <div className="form-row">
            <div className="form-section half">
              <label>Biểu tượng</label>
              <select
                className="form-input icon-select"
                value={formData.icon}
                onChange={e => onFormChange({ ...formData, icon: e.target.value })}
              >
                {TOPIC_ICONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {TOPIC_ICON_LABELS[icon] || icon}
                  </option>
                ))}
              </select>
              <div className="icon-preview" style={{ backgroundColor: `${formData.color}15`, color: formData.color }}>
                {renderTopicIcon(formData.icon, 28)}
              </div>
            </div>
            <div className="form-section half">
              <label>Màu sắc</label>
              <select
                className="form-input color-select"
                value={formData.color}
                onChange={e => onFormChange({ ...formData, color: e.target.value })}
                style={{ borderLeftColor: formData.color, borderLeftWidth: 4 }}
              >
                {TOPIC_COLORS.map(color => (
                  <option key={color.id} value={color.value}>
                    {color.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Difficulty & Visibility */}
          <div className="form-row">
            <div className="form-section half">
              <label>Độ khó</label>
              <select
                className="form-input"
                value={formData.difficulty}
                onChange={e => onFormChange({ ...formData, difficulty: e.target.value as TopicDifficulty })}
              >
                {Object.entries(DIFFICULTY_LABELS).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            <div className="form-section half">
              <label>Hiển thị</label>
              <div className="toggle-group">
                <button
                  className={`toggle-btn ${formData.isPublic ? 'active' : ''}`}
                  onClick={() => onFormChange({ ...formData, isPublic: true })}
                >
                  <Eye size={14} /> Công khai
                </button>
                <button
                  className={`toggle-btn ${!formData.isPublic ? 'active' : ''}`}
                  onClick={() => onFormChange({ ...formData, isPublic: false })}
                >
                  <EyeOff size={14} /> Riêng tư
                </button>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="form-section">
            <label>Tags (cách nhau bởi dấu phẩy)</label>
            <input
              type="text"
              className="form-input"
              placeholder="VD: kinh doanh, email, họp"
              value={formData.tags.join(', ')}
              onChange={e => onFormChange({
                ...formData,
                tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean),
              })}
            />
          </div>

          {/* Lesson Sources Selection */}
          <div className="form-section">
            <label>
              <BookOpen size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Nguồn từ vựng / Ngữ pháp tham khảo
            </label>
            <p className="form-hint">Chọn bài học để AI sử dụng khi hội thoại với bạn</p>

            {/* Source Type Tabs */}
            <div className="source-type-tabs">
              <button
                className={`type-tab ${selectedSourceType === 'vocabulary' ? 'active' : ''}`}
                onClick={() => onSourceTypeChange('vocabulary')}
              >
                📚 Từ vựng
              </button>
              <button
                className={`type-tab ${selectedSourceType === 'grammar' ? 'active' : ''}`}
                onClick={() => onSourceTypeChange('grammar')}
              >
                📖 Ngữ pháp
              </button>
            </div>

            {/* Level Tabs */}
            <div className="source-level-tabs">
              {JLPT_LEVELS.map(level => (
                <button
                  key={level}
                  className={`level-tab ${selectedSourceLevel === level ? 'active' : ''}`}
                  onClick={() => onSourceLevelChange(level)}
                >
                  {level}
                </button>
              ))}
            </div>

            {/* Lessons Grid */}
            <div className="lessons-source-compact">
              {selectedSourceType === 'vocabulary' ? (
                <>
                  {vocabLessons.slice(0, 10).map(lesson => {
                    const isLinked = (formData.linkedLessonIds || []).includes(lesson.id);
                    return (
                      <div
                        key={lesson.id}
                        className={`lesson-source-chip ${isLinked ? 'linked' : ''}`}
                        onClick={() => handleLessonToggle(lesson.id)}
                      >
                        {isLinked ? <CheckCircle size={14} /> : <Circle size={14} />}
                        <span>{lesson.name}</span>
                      </div>
                    );
                  })}
                  {vocabLessons.length === 0 && (
                    <span className="no-lessons">Chưa có bài từ vựng ở cấp độ này</span>
                  )}
                </>
              ) : (
                <>
                  {grammarLessonsList.slice(0, 10).map(lesson => {
                    const isLinked = (formData.linkedLessonIds || []).includes(lesson.id);
                    return (
                      <div
                        key={lesson.id}
                        className={`lesson-source-chip grammar ${isLinked ? 'linked' : ''}`}
                        onClick={() => handleLessonToggle(lesson.id)}
                      >
                        {isLinked ? <CheckCircle size={14} /> : <Circle size={14} />}
                        <span>{lesson.name}</span>
                      </div>
                    );
                  })}
                  {grammarLessonsList.length === 0 && (
                    <span className="no-lessons">Chưa có bài ngữ pháp ở cấp độ này</span>
                  )}
                </>
              )}
            </div>

            {(formData.linkedLessonIds?.length || 0) > 0 && (
              <div className="linked-count-badge">
                Đã chọn: {formData.linkedLessonIds?.length} bài học
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="form-section">
            <label>Xem trước</label>
            <div className="topic-preview" style={{ '--topic-color': formData.color } as React.CSSProperties}>
              <span className="preview-icon" style={{ backgroundColor: `${formData.color}20`, color: formData.color }}>
                {renderTopicIcon(formData.icon, 24)}
              </span>
              <div className="preview-info">
                <strong>{formData.name || 'Tên chủ đề'}</strong>
                <span style={{ color: DIFFICULTY_LABELS[formData.difficulty].color }}>
                  {DIFFICULTY_LABELS[formData.difficulty].label}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={onSave} disabled={!formData.name.trim()}>
            {editingTopic ? 'Cập nhật' : 'Tạo chủ đề'}
          </button>
        </div>
      </div>
    </div>
  );
}
