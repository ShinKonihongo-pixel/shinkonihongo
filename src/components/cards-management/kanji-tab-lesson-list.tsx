// KanjiTab - Lesson list sub-component with drag-and-drop

import { GripVertical, FolderOpen, FileText, Edit2, Trash2 } from 'lucide-react';
import type { KanjiLesson } from '../../types/kanji';
import type { JLPTLevel } from './cards-management-types';

interface KanjiLessonListProps {
  lessons: KanjiLesson[];
  isChild: boolean;
  isSuperAdmin: boolean;
  dragOverLessonId: string | null;
  editingLesson: KanjiLesson | null;
  navStateLevel: JLPTLevel;
  navStateType: string;
  getCardCountForLesson: (lessonId: string) => number;
  onDragStart: (lesson: KanjiLesson) => void;
  onDragOver: (e: React.DragEvent, lessonId: string) => void;
  onDragLeave: () => void;
  onDrop: (targetLesson: KanjiLesson) => void;
  onClick: (lesson: KanjiLesson) => void;
  onEditLesson: (lesson: KanjiLesson) => void;
  onEditingNameChange: (lesson: KanjiLesson, name: string) => void;
  onEditingConfirm: (lesson: KanjiLesson) => void;
  onEditingCancel: () => void;
  onDeleteLesson: (id: string, name: string) => void;
}

export function KanjiLessonList({
  lessons,
  isChild,
  isSuperAdmin,
  dragOverLessonId,
  editingLesson,
  getCardCountForLesson,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  onEditLesson,
  onEditingNameChange,
  onEditingConfirm,
  onEditingCancel,
  onDeleteLesson,
}: KanjiLessonListProps) {
  return (
    <div className="lesson-list">
      {lessons.map(lesson => (
        <div
          key={lesson.id}
          className={`lesson-item ${dragOverLessonId === lesson.id ? 'drag-over' : ''}`}
          draggable
          onDragStart={() => onDragStart(lesson)}
          onDragOver={(e) => onDragOver(e, lesson.id)}
          onDragLeave={onDragLeave}
          onDrop={() => onDrop(lesson)}
        >
          <GripVertical size={16} className="grip-icon" />
          {editingLesson?.id === lesson.id ? (
            <input
              className="inline-edit-input"
              autoFocus
              value={editingLesson.name}
              onChange={e => onEditingNameChange(editingLesson, e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') onEditingConfirm(editingLesson);
                if (e.key === 'Escape') onEditingCancel();
              }}
              onBlur={() => onEditingConfirm(editingLesson)}
            />
          ) : (
            <button className="lesson-item-btn" onClick={() => onClick(lesson)}>
              {isChild ? <FileText size={16} /> : <FolderOpen size={16} />}
              <span className="lesson-item-name">{lesson.name}</span>
              <span className="lesson-item-count">{getCardCountForLesson(lesson.id)} chữ</span>
            </button>
          )}
          {isSuperAdmin && (
            <div className="lesson-item-actions">
              <button className="btn btn-icon btn-sm" onClick={() => onEditLesson(lesson)}>
                <Edit2 size={14} />
              </button>
              <button
                className="btn btn-icon btn-sm btn-danger"
                onClick={() => { if (confirm(`Xóa "${lesson.name}"?`)) onDeleteLesson(lesson.id, lesson.name); }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
