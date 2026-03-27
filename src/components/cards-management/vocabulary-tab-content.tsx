// VocabularyTab - Content/folder view section
// Renders the folder tree (root level grid, lesson lists, flashcard list)

import { LevelGrid } from './level-grid';
import { FlashcardList } from '../flashcard/flashcard-list';
import { VocabLessonItem } from './vocabulary-tab-lesson-item';
import type { Flashcard, Lesson, FlashcardNavState, JLPTLevel } from './cards-management-types';

interface VocabTabContentProps {
  navState: FlashcardNavState;
  currentCards: Flashcard[];
  isSuperAdmin: boolean;
  seeding: boolean;
  editingLessonId: string | null;
  editingLessonName: string;
  draggedLessonId: string | null;
  dragOverLessonId: string | null;
  canModifyLesson: (lesson: Lesson) => boolean;
  canModifyCard: (card: Flashcard) => boolean;
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
  getCardCountByLevel: (level: JLPTLevel) => number;
  getCardCountByLesson: (lessonId: string) => number;
  getCardCountByLessonRecursive: (lessonId: string) => number;
  onSelectLevel: (level: JLPTLevel) => void;
  onSelectParentLesson: (lesson: Lesson) => void;
  onSelectChildLesson: (lesson: Lesson) => void;
  onEditCard: (card: Flashcard) => void;
  onDeleteCard: (id: string) => void;
  onToggleLock: (id: string) => void;
  onToggleHide: (id: string) => void;
  onDragStart: (e: React.DragEvent, lesson: Lesson) => void;
  onDragOver: (e: React.DragEvent, lessonId: string) => void;
  onDragLeave: () => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, lesson: Lesson, lessonList: Lesson[]) => void;
  onSetEditingLesson: (id: string, name: string) => void;
  onEditingNameChange: (name: string) => void;
  onUpdateLesson: (id: string) => void;
  onCancelEdit: () => void;
  onDeleteLessonRequest: (lesson: Lesson) => void;
  onSeedLessons: (level: 'N5' | 'N4') => void;
  onFixBai1Order: () => void;
}

export function VocabTabContent({
  navState,
  currentCards,
  isSuperAdmin,
  seeding,
  editingLessonId,
  editingLessonName,
  draggedLessonId,
  dragOverLessonId,
  canModifyLesson,
  canModifyCard,
  getLessonsByLevel,
  getChildLessons,
  getCardCountByLevel,
  getCardCountByLesson,
  getCardCountByLessonRecursive,
  onSelectLevel,
  onSelectParentLesson,
  onSelectChildLesson,
  onEditCard,
  onDeleteCard,
  onToggleLock,
  onToggleHide,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnd,
  onDrop,
  onSetEditingLesson,
  onEditingNameChange,
  onUpdateLesson,
  onCancelEdit,
  onDeleteLessonRequest,
  onSeedLessons,
  onFixBai1Order,
}: VocabTabContentProps) {
  const sharedLessonItemProps = {
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
    onToggleLock,
    onToggleHide,
    onSetEditingLesson,
    onEditingNameChange,
    onUpdateLesson,
    onCancelEdit,
    onDeleteLesson: onDeleteLessonRequest,
  };

  return (
    <div className="folder-content">
      {navState.type === 'root' && (
        <LevelGrid
          onSelectLevel={onSelectLevel}
          getCount={getCardCountByLevel}
          countLabel="từ"
        />
      )}

      {navState.type === 'level' && (
        <div className="folder-list">
          {getLessonsByLevel(navState.level).map(lesson => (
            <VocabLessonItem
              key={lesson.id}
              lesson={lesson}
              isChild={false}
              lessonList={getLessonsByLevel(navState.level)}
              onClick={onSelectParentLesson}
              {...sharedLessonItemProps}
            />
          ))}
          {getLessonsByLevel(navState.level).length === 0 && (
            <p className="empty-message">Chưa có bài học nào. Nhấn "+ Tạo bài học" để thêm.</p>
          )}
          {isSuperAdmin && navState.level === 'N5' && (
            <div className="admin-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {getLessonsByLevel('N5').length < 25 && (
                <button className="btn btn-seed" onClick={() => onSeedLessons('N5')} disabled={seeding}>
                  {seeding ? 'Đang tạo...' : '🌱 Tạo Bài 2-25'}
                </button>
              )}
              {getLessonsByLevel('N5').some(l => l.name === 'Bài 1' && l.order !== 1) && (
                <button className="btn btn-secondary" onClick={onFixBai1Order}>
                  ⬆️ Đưa Bài 1 lên đầu
                </button>
              )}
            </div>
          )}
          {isSuperAdmin && navState.level === 'N4' && getLessonsByLevel('N4').length < 25 && (
            <button className="btn btn-seed" onClick={() => onSeedLessons('N4')} disabled={seeding} style={{ marginTop: '1rem' }}>
              {seeding ? 'Đang tạo...' : '🌱 Tạo Bài 26-50'}
            </button>
          )}
        </div>
      )}

      {navState.type === 'parentLesson' && (
        <div className="folder-list">
          {getChildLessons(navState.lessonId).map(lesson => (
            <VocabLessonItem
              key={lesson.id}
              lesson={lesson}
              isChild={true}
              lessonList={getChildLessons(navState.lessonId)}
              onClick={onSelectChildLesson}
              {...sharedLessonItemProps}
            />
          ))}
          {getChildLessons(navState.lessonId).length === 0 && (
            currentCards.length > 0 ? (
              <FlashcardList
                cards={currentCards}
                onEdit={onEditCard}
                onDelete={onDeleteCard}
                canEdit={canModifyCard}
                canDelete={canModifyCard}
              />
            ) : (
              <p className="empty-message">Chưa có thẻ nào. Nhấn "+ Tạo thẻ" để thêm hoặc tạo bài học con.</p>
            )
          )}
        </div>
      )}

      {navState.type === 'childLesson' && (
        currentCards.length > 0 ? (
          <FlashcardList
            cards={currentCards}
            onEdit={onEditCard}
            onDelete={onDeleteCard}
            canEdit={canModifyCard}
            canDelete={canModifyCard}
          />
        ) : (
          <p className="empty-message">Chưa có thẻ nào. Nhấn "+ Tạo thẻ" để thêm.</p>
        )
      )}
    </div>
  );
}
