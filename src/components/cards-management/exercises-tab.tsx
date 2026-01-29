// Exercises Management Tab - Professional UI for creating vocabulary exercises
// Features: Level-based filtering, exercise CRUD, publish/unpublish

import { useState } from 'react';
import { Plus, Edit3, Trash2, Eye, EyeOff, BookOpen, Headphones, Target, FileText, ChevronLeft } from 'lucide-react';
import type { Exercise, ExerciseFormData, ExerciseType } from '../../types/exercise';
import type { JLPTLevel, Lesson, Flashcard } from '../../types/flashcard';
import type { CurrentUser } from '../../types/user';
import { EXERCISE_TYPE_LABELS, QUESTION_COUNT_OPTIONS } from '../../types/exercise';
import { ConfirmModal } from '../ui/confirm-modal';

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

// Level colors for visual distinction
const LEVEL_COLORS: Record<JLPTLevel, { bg: string; text: string; border: string }> = {
  N5: { bg: '#e8f5e9', text: '#2e7d32', border: '#81c784' },
  N4: { bg: '#e3f2fd', text: '#1565c0', border: '#64b5f6' },
  N3: { bg: '#fff3e0', text: '#ef6c00', border: '#ffb74d' },
  N2: { bg: '#fce4ec', text: '#c2185b', border: '#f06292' },
  N1: { bg: '#f3e5f5', text: '#7b1fa2', border: '#ba68c8' },
};

// Exercise type icons
const EXERCISE_TYPE_ICONS: Record<ExerciseType, React.ReactNode> = {
  vocabulary: <BookOpen size={16} />,
  kanji: <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>漢</span>,
  meaning: <Target size={16} />,
  listening: <Headphones size={16} />,
};

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
  // Navigation state - null means showing all levels
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);

  // Form state - use selected level if available
  const [formData, setFormData] = useState<ExerciseFormData>({
    name: '',
    description: '',
    type: 'vocabulary',
    jlptLevel: selectedLevel || 'N5',
    lessonIds: [],
    questionCount: 10,
  });

  // Get exercises filtered by level
  const getExercisesByLevel = (level: JLPTLevel) => exercises.filter(e => e.jlptLevel === level);
  const getExerciseCountByLevel = (level: JLPTLevel) => getExercisesByLevel(level).length;
  const filteredExercises = selectedLevel ? getExercisesByLevel(selectedLevel) : exercises;

  const canModify = (exercise: Exercise) => isSuperAdmin || exercise.createdBy === currentUser.id;

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'vocabulary',
      jlptLevel: selectedLevel || 'N5',
      lessonIds: [],
      questionCount: 10,
    });
    setEditingExercise(null);
    setShowForm(false);
  };

  // Open form with selected level preset
  const handleShowForm = () => {
    setFormData(prev => ({
      ...prev,
      jlptLevel: selectedLevel || 'N5',
      lessonIds: [],
    }));
    setShowForm(true);
  };

  const handleEdit = (exercise: Exercise) => {
    setFormData({
      name: exercise.name,
      description: exercise.description || '',
      type: exercise.type,
      jlptLevel: exercise.jlptLevel,
      lessonIds: exercise.lessonIds,
      questionCount: exercise.questionCount,
    });
    setEditingExercise(exercise);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.lessonIds.length === 0) return;

    if (editingExercise) {
      await onUpdateExercise(editingExercise.id, formData);
    } else {
      await onAddExercise(formData, currentUser.id);
    }
    resetForm();
  };

  const handleLessonToggle = (lessonId: string) => {
    setFormData(prev => ({
      ...prev,
      lessonIds: prev.lessonIds.includes(lessonId)
        ? prev.lessonIds.filter(id => id !== lessonId)
        : [...prev.lessonIds, lessonId],
    }));
  };

  // Select all lessons in current level
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

  // Clear all selections
  const handleClearAll = () => {
    setFormData(prev => ({ ...prev, lessonIds: [] }));
  };

  // Get available lessons for selected level
  const parentLessons = getLessonsByLevel(formData.jlptLevel);

  // Count cards in selected lessons
  const getCardCount = (lessonIds: string[]) => {
    return flashcards.filter(c => lessonIds.includes(c.lessonId)).length;
  };

  const selectedCardCount = getCardCount(formData.lessonIds);

  // Stats - use filtered exercises when level is selected
  const statsExercises = filteredExercises;
  const publishedCount = statsExercises.filter(e => e.isPublished).length;
  const draftCount = statsExercises.length - publishedCount;

  return (
    <div className="exercises-tab">
      {/* Level Navigation - Root view */}
      {!selectedLevel && !showForm && (
        <div className="exercises-level-nav">
          <h3 className="level-nav-title">Chọn cấp độ</h3>
          <div className="level-folders">
            {JLPT_LEVELS.map(level => {
              const count = getExerciseCountByLevel(level);
              const publishedInLevel = getExercisesByLevel(level).filter(e => e.isPublished).length;
              const colors = LEVEL_COLORS[level];
              return (
                <div
                  key={level}
                  className="level-folder"
                  style={{
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                  }}
                  onClick={() => setSelectedLevel(level)}
                >
                  <span className="level-folder-icon">📂</span>
                  <div className="level-folder-info">
                    <span className="level-folder-name" style={{ color: colors.text }}>{level}</span>
                    <span className="level-folder-count">
                      {count} bài tập {publishedInLevel > 0 && <span className="published-mini">({publishedInLevel} đã xuất bản)</span>}
                    </span>
                  </div>
                  <span className="level-folder-arrow" style={{ color: colors.text }}>→</span>
                </div>
              );
            })}
          </div>
        </div>
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
          </div>

          {/* Header with stats */}
          <div className="exercises-tab-header">
            <div className="exercises-stats">
              <div className="stat-item">
                <span className="stat-value">{statsExercises.length}</span>
                <span className="stat-label">Tổng bài tập</span>
              </div>
              <div className="stat-item published">
                <span className="stat-value">{publishedCount}</span>
                <span className="stat-label">Đã xuất bản</span>
              </div>
              <div className="stat-item draft">
                <span className="stat-value">{draftCount}</span>
                <span className="stat-label">Bản nháp</span>
              </div>
            </div>

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

            <div className="form-grid-3">
              <div className="form-section">
                <label className="form-label">Loại bài tập <span className="required">*</span></label>
                <div className="type-selector">
                  {(Object.keys(EXERCISE_TYPE_LABELS) as ExerciseType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      className={`type-option ${formData.type === type ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, type })}
                    >
                      <span className="type-icon">{EXERCISE_TYPE_ICONS[type]}</span>
                      <span className="type-name">{EXERCISE_TYPE_LABELS[type]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <label className="form-label">Cấp độ <span className="required">*</span></label>
                <select
                  className="form-select"
                  value={formData.jlptLevel}
                  onChange={e => setFormData({ ...formData, jlptLevel: e.target.value as JLPTLevel, lessonIds: [] })}
                >
                  {JLPT_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div className="form-section">
                <label className="form-label">Số câu hỏi <span className="required">*</span></label>
                <select
                  className="form-select"
                  value={formData.questionCount}
                  onChange={e => setFormData({ ...formData, questionCount: Number(e.target.value) })}
                >
                  {QUESTION_COUNT_OPTIONS.map(count => (
                    <option key={count} value={count}>{count} câu</option>
                  ))}
                </select>
              </div>
            </div>

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
                  <p className="empty-lessons">Không có bài học nào ở cấp độ {formData.jlptLevel}</p>
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

            {formData.type === 'listening' && (
              <div className="info-box-pro">
                <Headphones size={20} />
                <div>
                  <strong>Bài tập nghe</strong>
                  <p>Từ vựng sẽ được đọc tự động 3 lần, mỗi lần cách nhau 2 giây. Học sinh nghe và chọn từ đúng.</p>
                </div>
              </div>
            )}

            {selectedCardCount < formData.questionCount && (
              <div className="warning-box-pro">
                <span className="warning-icon">⚠️</span>
                <span>
                  Số từ vựng ({selectedCardCount}) ít hơn số câu hỏi ({formData.questionCount}).
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
              disabled={selectedCardCount < formData.questionCount || !formData.name.trim()}
            >
              {editingExercise ? 'Lưu thay đổi' : 'Tạo bài tập'}
            </button>
          </div>
        </form>
      )}

      {/* Exercise List - only show when level is selected */}
      {!showForm && selectedLevel && (
        <div className="exercises-list-pro">
          {filteredExercises.length === 0 ? (
            <div className="empty-state-pro">
              <BookOpen size={48} strokeWidth={1.5} />
              <h3>Chưa có bài tập nào cho {selectedLevel}</h3>
              <p>Nhấn "Tạo bài tập mới" để bắt đầu</p>
            </div>
          ) : (
            filteredExercises.map(exercise => (
              <div key={exercise.id} className={`exercise-item-pro ${exercise.isPublished ? 'published' : 'draft'}`}>
                <div className="exercise-icon-wrapper">
                  {EXERCISE_TYPE_ICONS[exercise.type]}
                </div>

                <div className="exercise-content">
                  <div className="exercise-title-row">
                    <h4>{exercise.name}</h4>
                    <span className={`publish-badge ${exercise.isPublished ? 'published' : 'draft'}`}>
                      {exercise.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                    </span>
                  </div>
                  {exercise.description && <p className="exercise-desc-pro">{exercise.description}</p>}
                  <div className="exercise-tags">
                    <span className="tag type">{EXERCISE_TYPE_LABELS[exercise.type]}</span>
                    <span className="tag level">{exercise.jlptLevel}</span>
                    <span className="tag count">{exercise.questionCount} câu</span>
                    <span className="tag lessons">{exercise.lessonIds.length} bài học</span>
                  </div>
                </div>

                {canModify(exercise) && (
                  <div className="exercise-actions-pro">
                    <button
                      className={`action-btn ${exercise.isPublished ? 'unpublish' : 'publish'}`}
                      onClick={() => onTogglePublish(exercise.id)}
                      title={exercise.isPublished ? 'Ẩn bài tập' : 'Xuất bản'}
                    >
                      {exercise.isPublished ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button className="action-btn edit" onClick={() => handleEdit(exercise)} title="Chỉnh sửa">
                      <Edit3 size={18} />
                    </button>
                    <button className="action-btn delete" onClick={() => setDeleteTarget(exercise)} title="Xóa">
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            ))
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
