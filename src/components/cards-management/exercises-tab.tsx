// Exercises Management Tab - Updated UI
// Features: Multiple types/levels selection, per-type question count, 3-column list, sentence translation

import { useState, useMemo } from 'react';
import { Plus, Edit3, Trash2, Eye, EyeOff, BookOpen, Headphones, FileText, ChevronLeft, Clock, Check } from 'lucide-react';
import type { Exercise, ExerciseFormData, ExerciseType } from '../../types/exercise';
import type { JLPTLevel, Lesson, Flashcard } from '../../types/flashcard';
import type { CurrentUser } from '../../types/user';
import { EXERCISE_TYPE_LABELS, EXERCISE_TYPE_ICONS, QUESTION_COUNT_OPTIONS, TIME_PER_QUESTION_OPTIONS, getTotalQuestionCount, initQuestionCountByType } from '../../types/exercise';
import { ConfirmModal } from '../ui/confirm-modal';
import { LevelGrid } from './level-grid';
import { JLPT_LEVELS } from '../../constants/jlpt';
import { LEVEL_COLORS_EXTENDED } from '../../constants/themes';

const EXERCISE_TYPES: ExerciseType[] = ['vocabulary', 'meaning', 'kanji_to_vocab', 'vocab_to_kanji', 'listening_write', 'sentence_translation'];

// Level colors for visual distinction
const LEVEL_COLORS = LEVEL_COLORS_EXTENDED;

interface ExercisesTabProps {
  exercises: Exercise[];
  flashcards: Flashcard[];
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
  onAddExercise: (data: ExerciseFormData, createdBy: string) => Promise<Exercise | null>;
  onUpdateExercise: (id: string, data: Partial<Exercise>) => Promise<boolean>;
  onDeleteExercise: (id: string) => Promise<boolean>;
  onTogglePublish: (id: string) => Promise<boolean>;
  currentUser: CurrentUser;
  isSuperAdmin: boolean;
}

export function ExercisesTab({
  exercises,
  flashcards,
  getLessonsByLevel,
  getChildLessons,
  onAddExercise,
  onUpdateExercise,
  onDeleteExercise,
  onTogglePublish,
  currentUser,
  isSuperAdmin,
}: ExercisesTabProps) {
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);

  // Form state with multiple types and levels
  const [formData, setFormData] = useState<ExerciseFormData>({
    name: '',
    description: '',
    types: [],
    jlptLevels: selectedLevel ? [selectedLevel] : [],
    lessonIds: [],
    questionCountByType: initQuestionCountByType(),
    timePerQuestion: 0,
  });

  // Get exercises filtered by level (check both new jlptLevels array and legacy jlptLevel)
  const getExercisesByLevel = (level: JLPTLevel) => exercises.filter(e =>
    e.jlptLevels?.includes(level) || e.jlptLevel === level
  );
  const getExerciseCountByLevel = (level: JLPTLevel) => getExercisesByLevel(level).length;
  const filteredExercises = selectedLevel ? getExercisesByLevel(selectedLevel) : exercises;

  const canModify = (exercise: Exercise) => isSuperAdmin || exercise.createdBy === currentUser.id;

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      types: [],
      jlptLevels: selectedLevel ? [selectedLevel] : [],
      lessonIds: [],
      questionCountByType: initQuestionCountByType(),
      timePerQuestion: 0,
    });
    setEditingExercise(null);
    setShowForm(false);
  };

  const handleShowForm = () => {
    setFormData(prev => ({
      ...prev,
      jlptLevels: selectedLevel ? [selectedLevel] : [],
      lessonIds: [],
    }));
    setShowForm(true);
  };

  const handleEdit = (exercise: Exercise) => {
    setFormData({
      name: exercise.name,
      description: exercise.description || '',
      types: exercise.types || (exercise.type ? [exercise.type] : []),
      jlptLevels: exercise.jlptLevels || (exercise.jlptLevel ? [exercise.jlptLevel] : []),
      lessonIds: exercise.lessonIds,
      questionCountByType: exercise.questionCountByType || initQuestionCountByType(),
      timePerQuestion: exercise.timePerQuestion || 0,
    });
    setEditingExercise(exercise);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.lessonIds.length === 0 || formData.types.length === 0) return;

    if (editingExercise) {
      await onUpdateExercise(editingExercise.id, formData);
    } else {
      await onAddExercise(formData, currentUser.id);
    }
    resetForm();
  };

  const handleTypeToggle = (type: ExerciseType) => {
    setFormData(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type],
    }));
  };

  const handleLevelToggle = (level: JLPTLevel) => {
    setFormData(prev => {
      const newLevels = prev.jlptLevels.includes(level)
        ? prev.jlptLevels.filter(l => l !== level)
        : [...prev.jlptLevels, level];
      return {
        ...prev,
        jlptLevels: newLevels,
        lessonIds: [], // Reset lessons when levels change
      };
    });
  };

  const handleQuestionCountChange = (type: ExerciseType, count: number) => {
    setFormData(prev => ({
      ...prev,
      questionCountByType: {
        ...prev.questionCountByType,
        [type]: count,
      },
    }));
  };

  const handleLessonToggle = (lessonId: string) => {
    setFormData(prev => ({
      ...prev,
      lessonIds: prev.lessonIds.includes(lessonId)
        ? prev.lessonIds.filter(id => id !== lessonId)
        : [...prev.lessonIds, lessonId],
    }));
  };

  // Get all parent lessons for selected levels
  const parentLessons = useMemo(() => {
    const lessons: Lesson[] = [];
    formData.jlptLevels.forEach(level => {
      lessons.push(...getLessonsByLevel(level));
    });
    return lessons;
  }, [formData.jlptLevels, getLessonsByLevel]);

  const handleSelectAll = () => {
    const allLessonIds: string[] = [];
    parentLessons.forEach(parent => {
      const children = getChildLessons(parent.id);
      if (children.length === 0 && flashcards.some(c => c.lessonId === parent.id)) {
        allLessonIds.push(parent.id);
      } else {
        children.forEach(child => allLessonIds.push(child.id));
      }
    });
    setFormData(prev => ({ ...prev, lessonIds: allLessonIds }));
  };

  const handleClearAll = () => {
    setFormData(prev => ({ ...prev, lessonIds: [] }));
  };

  const getCardCount = (lessonIds: string[]) => {
    return flashcards.filter(c => lessonIds.includes(c.lessonId)).length;
  };

  const selectedCardCount = getCardCount(formData.lessonIds);
  const totalQuestionCount = getTotalQuestionCount(formData.questionCountByType, formData.types);

  // Get display types for an exercise (handle legacy)
  const getExerciseTypes = (ex: Exercise): ExerciseType[] => {
    return ex.types || (ex.type ? [ex.type] : []);
  };

  // Get display levels for an exercise (handle legacy)
  const getExerciseLevels = (ex: Exercise): JLPTLevel[] => {
    return ex.jlptLevels || (ex.jlptLevel ? [ex.jlptLevel] : []);
  };

  // Get total questions for an exercise (handle legacy)
  const getExerciseTotalQuestions = (ex: Exercise): number => {
    if (ex.questionCountByType && ex.types) {
      return getTotalQuestionCount(ex.questionCountByType, ex.types);
    }
    return ex.questionCount || 0;
  };

  return (
    <div className="exercises-tab">
      {/* Level Navigation - Root view */}
      {!selectedLevel && !showForm && (
        <LevelGrid
          onSelectLevel={setSelectedLevel}
          getCount={getExerciseCountByLevel}
          countLabel="bài tập"
        />
      )}

      {/* Back button and header when level is selected */}
      {selectedLevel && (
        <>
          <button className="btn btn-back exercises-back" onClick={() => { setSelectedLevel(null); setShowForm(false); }}>
            <ChevronLeft size={18} />
            Quay lại
          </button>

          <div className="exercises-level-header" style={{ borderLeftColor: LEVEL_COLORS[selectedLevel].border }}>
            <h3 style={{ color: LEVEL_COLORS[selectedLevel].text }}>
              Bài tập {selectedLevel}
            </h3>
            {!showForm && (
              <button className="btn btn-primary create-btn" onClick={handleShowForm}>
                <Plus size={18} />
                Tạo bài tập mới
              </button>
            )}
          </div>
        </>
      )}

      {/* Form - only show when level is selected */}
      {showForm && selectedLevel && (
        <form className="exercise-form-pro" onSubmit={handleSubmit}>
          <div className="form-header">
            <FileText size={24} />
            <h3>{editingExercise ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}</h3>
          </div>

          <div className="form-body">
            <div className="form-section">
              <label className="form-label">Tên bài tập <span className="required">*</span></label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Ôn tập từ vựng Bài 1-5"
                required
              />
            </div>

            <div className="form-section">
              <label className="form-label">Mô tả</label>
              <textarea
                className="form-input"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả ngắn về nội dung bài tập..."
                rows={2}
              />
            </div>

            {/* Exercise Types - Multiple selection with question count */}
            <div className="form-section">
              <label className="form-label">Loại bài tập <span className="required">*</span> (chọn nhiều)</label>
              <div className="type-selector-multi">
                {EXERCISE_TYPES.map(type => {
                  const isSelected = formData.types.includes(type);
                  return (
                    <div key={type} className={`type-option-multi ${isSelected ? 'active' : ''}`}>
                      <label className="type-checkbox">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleTypeToggle(type)}
                        />
                        <span className="type-icon">{EXERCISE_TYPE_ICONS[type]}</span>
                        <span className="type-name">{EXERCISE_TYPE_LABELS[type]}</span>
                        {isSelected && <Check size={16} className="check-icon" />}
                      </label>
                      {isSelected && (
                        <div className="type-question-count">
                          <label>Số câu:</label>
                          <select
                            value={formData.questionCountByType[type]}
                            onChange={e => handleQuestionCountChange(type, Number(e.target.value))}
                            onClick={e => e.stopPropagation()}
                          >
                            {QUESTION_COUNT_OPTIONS.map(count => (
                              <option key={count} value={count}>{count}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {formData.types.length > 0 && (
                <div className="total-questions-info">
                  Tổng: <strong>{totalQuestionCount}</strong> câu hỏi
                </div>
              )}
            </div>

            {/* JLPT Levels - Multiple selection */}
            <div className="form-section">
              <label className="form-label">Cấp độ <span className="required">*</span> (chọn nhiều)</label>
              <div className="level-selector-multi">
                {JLPT_LEVELS.map(level => {
                  const isSelected = formData.jlptLevels.includes(level);
                  const colors = LEVEL_COLORS[level];
                  return (
                    <label
                      key={level}
                      className={`level-option-multi ${isSelected ? 'active' : ''}`}
                      style={isSelected ? { backgroundColor: colors.bg, borderColor: colors.border } : undefined}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleLevelToggle(level)}
                      />
                      <span style={{ color: isSelected ? colors.text : undefined }}>{level}</span>
                      {isSelected && <Check size={14} className="check-icon" />}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Time per question */}
            <div className="form-section">
              <label className="form-label">
                <Clock size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                Thời gian mỗi câu
              </label>
              <select
                className="form-select"
                value={formData.timePerQuestion || 0}
                onChange={e => setFormData({ ...formData, timePerQuestion: Number(e.target.value) })}
              >
                {TIME_PER_QUESTION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Lesson selector */}
            {formData.jlptLevels.length > 0 && (
              <div className="form-section">
                <div className="lesson-selector-header">
                  <label className="form-label">
                    Chọn bài học <span className="required">*</span>
                    <span className="selection-count">
                      ({formData.lessonIds.length} bài • {selectedCardCount} từ vựng)
                    </span>
                  </label>
                  <div className="selector-actions">
                    <button type="button" className="btn btn-xs btn-outline" onClick={handleSelectAll}>
                      Chọn tất cả
                    </button>
                    <button type="button" className="btn btn-xs btn-outline" onClick={handleClearAll}>
                      Bỏ chọn
                    </button>
                  </div>
                </div>
                <div className="lesson-selector-pro">
                  {parentLessons.length === 0 ? (
                    <p className="empty-lessons">Không có bài học nào ở cấp độ đã chọn</p>
                  ) : (
                    parentLessons.map(parent => {
                      const children = getChildLessons(parent.id);
                      const hasDirectCards = flashcards.some(c => c.lessonId === parent.id);

                      return (
                        <div key={parent.id} className="lesson-group-pro">
                          {children.length === 0 && hasDirectCards ? (
                            <label className="lesson-item">
                              <input
                                type="checkbox"
                                checked={formData.lessonIds.includes(parent.id)}
                                onChange={() => handleLessonToggle(parent.id)}
                              />
                              <span className="lesson-name">{parent.name}</span>
                              <span className="lesson-count">{getCardCount([parent.id])} từ</span>
                            </label>
                          ) : children.length > 0 && (
                            <>
                              <div className="parent-label-pro">📂 {parent.name}</div>
                              <div className="children-list">
                                {children.map(child => (
                                  <label key={child.id} className="lesson-item">
                                    <input
                                      type="checkbox"
                                      checked={formData.lessonIds.includes(child.id)}
                                      onChange={() => handleLessonToggle(child.id)}
                                    />
                                    <span className="lesson-name">{child.name}</span>
                                    <span className="lesson-count">{getCardCount([child.id])} từ</span>
                                  </label>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {formData.types.includes('listening_write') && (
              <div className="info-box-pro">
                <Headphones size={20} />
                <div>
                  <strong>Nghe viết từ</strong>
                  <p>Từ vựng sẽ được đọc tự động. Học sinh nghe và gõ từ đúng vào ô trả lời trong thời gian quy định.</p>
                </div>
              </div>
            )}

            {formData.types.includes('sentence_translation') && (
              <div className="info-box-pro sentence-translation">
                <span style={{ fontSize: '1.5rem' }}>🔄</span>
                <div>
                  <strong>Dịch câu (Việt → Nhật)</strong>
                  <p>Hiển thị câu tiếng Việt ngẫu nhiên hoặc tự nhập. Học sinh gõ câu tiếng Nhật tương ứng. Chấm điểm thông minh: đúng hoàn toàn hoặc gần đúng nghĩa đều được tính.</p>
                </div>
              </div>
            )}

            {selectedCardCount < totalQuestionCount && formData.types.length > 0 && (
              <div className="warning-box-pro">
                <span className="warning-icon">⚠️</span>
                <span>
                  Số từ vựng ({selectedCardCount}) ít hơn tổng số câu hỏi ({totalQuestionCount}).
                  Chọn thêm bài học hoặc giảm số câu hỏi.
                </span>
              </div>
            )}
          </div>

          <div className="form-footer">
            <button type="button" className="btn btn-cancel" onClick={resetForm}>
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                selectedCardCount < totalQuestionCount ||
                !formData.name.trim() ||
                formData.types.length === 0 ||
                formData.jlptLevels.length === 0 ||
                formData.lessonIds.length === 0
              }
            >
              {editingExercise ? 'Lưu thay đổi' : 'Tạo bài tập'}
            </button>
          </div>
        </form>
      )}

      {/* Exercise List - 3 column layout */}
      {!showForm && selectedLevel && (
        <div className="exercises-list-grid">
          {filteredExercises.length === 0 ? (
            <div className="empty-state-pro">
              <BookOpen size={48} strokeWidth={1.5} />
              <h3>Chưa có bài tập nào cho {selectedLevel}</h3>
              <p>Nhấn "Tạo bài tập mới" để bắt đầu</p>
            </div>
          ) : (
            filteredExercises.map(exercise => {
              const types = getExerciseTypes(exercise);
              const levels = getExerciseLevels(exercise);
              const totalQ = getExerciseTotalQuestions(exercise);

              return (
                <div key={exercise.id} className={`exercise-item-card ${exercise.isPublished ? 'published' : 'draft'}`}>
                  <div className="exercise-card-header">
                    <div className="exercise-types-icons">
                      {types.map(t => (
                        <span key={t} className="type-icon-small" title={EXERCISE_TYPE_LABELS[t]}>
                          {EXERCISE_TYPE_ICONS[t]}
                        </span>
                      ))}
                    </div>
                    <span className={`publish-badge ${exercise.isPublished ? 'published' : 'draft'}`}>
                      {exercise.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                    </span>
                  </div>

                  <h4 className="exercise-card-title">{exercise.name}</h4>
                  {exercise.description && <p className="exercise-card-desc">{exercise.description}</p>}

                  <div className="exercise-card-tags">
                    {levels.map(l => (
                      <span key={l} className="tag level" style={{ backgroundColor: LEVEL_COLORS[l].bg, color: LEVEL_COLORS[l].text }}>
                        {l}
                      </span>
                    ))}
                    <span className="tag count">{totalQ} câu</span>
                    {exercise.timePerQuestion ? (
                      <span className="tag time">⏱ {exercise.timePerQuestion}s</span>
                    ) : null}
                  </div>

                  <div className="exercise-card-types">
                    {types.map(t => (
                      <span key={t} className="type-tag">{EXERCISE_TYPE_LABELS[t]}</span>
                    ))}
                  </div>

                  {canModify(exercise) && (
                    <div className="exercise-card-actions">
                      <button
                        className={`action-btn ${exercise.isPublished ? 'unpublish' : 'publish'}`}
                        onClick={() => onTogglePublish(exercise.id)}
                        title={exercise.isPublished ? 'Ẩn bài tập' : 'Xuất bản'}
                      >
                        {exercise.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button className="action-btn edit" onClick={() => handleEdit(exercise)} title="Chỉnh sửa">
                        <Edit3 size={16} />
                      </button>
                      <button className="action-btn delete" onClick={() => setDeleteTarget(exercise)} title="Xóa">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Xác nhận xóa"
        message={`Bạn có chắc muốn xóa bài tập "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        onConfirm={async () => {
          if (deleteTarget) {
            await onDeleteExercise(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
