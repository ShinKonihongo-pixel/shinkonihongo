// VocabularyTab - LessonItem sub-component
// Handles rendering a single lesson folder row with drag-and-drop, lock/hide, edit, delete

import { GripVertical } from 'lucide-react';
import type { Lesson } from './cards-management-types';

interface VocabLessonItemProps {
  lesson: Lesson;
  isChild: boolean;
  lessonList: Lesson[];
  canModifyLesson: (lesson: Lesson) => boolean;
  editingLessonId: string | null;
  editingLessonName: string;
  draggedLessonId: string | null;
  dragOverLessonId: string | null;
  getCardCountByLesson: (lessonId: string) => number;
  getCardCountByLessonRecursive: (lessonId: string) => number;
  onDragStart: (e: React.DragEvent, lesson: Lesson) => void;
  onDragOver: (e: React.DragEvent, lessonId: string) => void;
  onDragLeave: () => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, lesson: Lesson, lessonList: Lesson[]) => void;
  onClick: (lesson: Lesson) => void;
  onToggleLock: (id: string) => void;
  onToggleHide: (id: string) => void;
  onSetEditingLesson: (id: string, name: string) => void;
  onEditingNameChange: (name: string) => void;
  onUpdateLesson: (id: string) => void;
  onCancelEdit: () => void;
  onDeleteLesson: (lesson: Lesson) => void;
}

export function VocabLessonItem({
  lesson,
  isChild,
  lessonList,
  canModifyLesson,
  editingLessonId,
  editingLessonName,
  draggedLessonId,
  dragOverLessonId,
  getCardCountByLesson,
  getCardCountByLessonRecursive,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnd,
  onDrop,
  onClick,
  onToggleLock,
  onToggleHide,
  onSetEditingLesson,
  onEditingNameChange,
  onUpdateLesson,
  onCancelEdit,
  onDeleteLesson,
}: VocabLessonItemProps) {
  const isDragging = draggedLessonId === lesson.id;
  const isDragOver = dragOverLessonId === lesson.id;

  return (
    <div
      key={lesson.id}
      className={`folder-item ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
      draggable={canModifyLesson(lesson)}
      onDragStart={(e) => onDragStart(e, lesson)}
      onDragOver={(e) => onDragOver(e, lesson.id)}
      onDragLeave={onDragLeave}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop(e, lesson, lessonList)}
      onClick={() => onClick(lesson)}
    >
      {canModifyLesson(lesson) && (
        <span className="drag-handle" title="Kéo để thay đổi vị trí">
          <GripVertical size={16} />
        </span>
      )}
      {canModifyLesson(lesson) && (
        <>
          <button className={`lock-btn ${lesson.isLocked ? 'locked' : ''}`} onClick={(e) => { e.stopPropagation(); onToggleLock(lesson.id); }} title={lesson.isLocked ? 'Mở khóa' : 'Khóa'}>
            {lesson.isLocked ? '🔒' : '🔓'}
          </button>
          <button className={`hide-btn ${lesson.isHidden ? 'hidden' : ''}`} onClick={(e) => { e.stopPropagation(); onToggleHide(lesson.id); }} title={lesson.isHidden ? 'Hiện' : 'Ẩn'}>
            {lesson.isHidden ? '👁️‍🗨️' : '👁️'}
          </button>
        </>
      )}
      <span className="folder-icon">{isChild ? '📄' : '📂'}</span>
      {editingLessonId === lesson.id ? (
        <input
          type="text"
          className="edit-input inline"
          value={editingLessonName}
          onChange={(e) => onEditingNameChange(e.target.value)}
          onBlur={() => onUpdateLesson(lesson.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onUpdateLesson(lesson.id);
            if (e.key === 'Escape') onCancelEdit();
          }}
          onClick={(e) => e.stopPropagation()}
          autoFocus
        />
      ) : (
        <span
          className="folder-name"
          onDoubleClick={(e) => { e.stopPropagation(); onSetEditingLesson(lesson.id, lesson.name); }}
        >
          {lesson.name}
        </span>
      )}
      <span className="folder-count">
        ({isChild ? getCardCountByLesson(lesson.id) : getCardCountByLessonRecursive(lesson.id)} từ)
      </span>
      {lesson.isLocked && <span className="locked-badge">Đã khóa</span>}
      {lesson.isHidden && <span className="hidden-badge">Đã ẩn</span>}
      {canModifyLesson(lesson) && (
        <>
          <button className="edit-btn" onClick={(e) => { e.stopPropagation(); onSetEditingLesson(lesson.id, lesson.name); }} title="Sửa tên">✎</button>
          <button className="delete-btn" onClick={(e) => { e.stopPropagation(); onDeleteLesson(lesson); }} title="Xóa">×</button>
        </>
      )}
    </div>
  );
}
