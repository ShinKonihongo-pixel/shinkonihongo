// Grammar Tab - Level-based lesson structure
// Navigation: Level → Parent Lesson → Child Lesson → Cards

import { useState, useRef } from 'react';
import { Download, Upload, BookOpen, FolderOpen, FileText, ChevronRight, Plus, Trash2, Edit2, GripVertical } from 'lucide-react';
import { GrammarCardForm } from '../flashcard/grammar-card-form';
import { GrammarCardList } from '../flashcard/grammar-card-list';
import { LevelGrid } from './level-grid';
import type { GrammarTabProps, GrammarCard, GrammarLesson, JLPTLevel } from './cards-management-types';

// Seed config for each level
const SEED_CONFIG: Record<JLPTLevel, { start: number; end: number; folders: string[] }> = {
  N5: { start: 1, end: 25, folders: ['Ngữ pháp', 'Mở rộng'] },
  N4: { start: 26, end: 50, folders: ['Ngữ pháp', 'Mở rộng'] },
  N3: { start: 1, end: 20, folders: ['Ngữ pháp', 'Mở rộng'] },
  N2: { start: 1, end: 20, folders: ['Ngữ pháp', 'Mở rộng'] },
  N1: { start: 1, end: 20, folders: ['Ngữ pháp', 'Mở rộng'] },
};

// Navigation state
type NavState =
  | { type: 'root' }
  | { type: 'level'; level: JLPTLevel }
  | { type: 'parent'; level: JLPTLevel; lessonId: string; lessonName: string }
  | { type: 'child'; level: JLPTLevel; parentId: string; parentName: string; lessonId: string; lessonName: string };

// Export/Import utilities
function downloadAsJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function readJSONFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(JSON.parse(reader.result as string));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function GrammarTab({
  grammarCards,
  onAddGrammarCard,
  onUpdateGrammarCard,
  onDeleteGrammarCard,
  grammarLessons,
  getParentLessonsByLevel,
  getChildLessons,
  hasChildren,
  onAddLesson,
  onUpdateLesson,
  onDeleteLesson,
  onSeedLessons,
  onReorderLessons,
  onImportGrammarCard,
  vocabularyCards = [],
  currentUser,
  isSuperAdmin,
}: GrammarTabProps) {
  const [navState, setNavState] = useState<NavState>({ type: 'root' });
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<GrammarCard | null>(null);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [newLessonName, setNewLessonName] = useState('');
  const [editingLesson, setEditingLesson] = useState<GrammarLesson | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag-and-drop state
  const [draggedLesson, setDraggedLesson] = useState<GrammarLesson | null>(null);
  const [dragOverLesson, setDragOverLesson] = useState<string | null>(null);

  // Get current lesson ID for adding cards
  const getCurrentLessonId = (): string | null => {
    if (navState.type === 'child') return navState.lessonId;
    if (navState.type === 'parent' && !hasChildren(navState.lessonId)) return navState.lessonId;
    return null;
  };

  // Get cards for current view
  const getCardsForCurrentView = (): GrammarCard[] => {
    const lessonId = getCurrentLessonId();
    if (!lessonId) return [];
    return grammarCards.filter(c => c.lessonId === lessonId);
  };

  // Get card count for a level
  const getCardCountByLevel = (level: JLPTLevel): number => {
    return grammarCards.filter(c => c.jlptLevel === level).length;
  };

  // Get card count for a lesson (recursive)
  const getCardCount = (lessonId: string): number => {
    const direct = grammarCards.filter(c => c.lessonId === lessonId).length;
    const children = getChildLessons(lessonId);
    return direct + children.reduce((sum, child) => sum + getCardCount(child.id), 0);
  };

  // Navigation
  const goBack = () => {
    if (navState.type === 'level') setNavState({ type: 'root' });
    else if (navState.type === 'parent') setNavState({ type: 'level', level: navState.level });
    else if (navState.type === 'child') {
      setNavState({ type: 'parent', level: navState.level, lessonId: navState.parentId, lessonName: navState.parentName });
    }
    setShowForm(false);
    setShowAddLesson(false);
  };

  // Seed lessons for current level
  const handleSeed = async () => {
    if (navState.type !== 'level') return;
    const config = SEED_CONFIG[navState.level];
    if (!confirm(`Tạo Bài ${config.start} đến Bài ${config.end} cho ${navState.level}?`)) return;

    setIsSeeding(true);
    try {
      const count = await onSeedLessons(navState.level, config.start, config.end, config.folders, currentUser.id);
      alert(`Đã tạo ${count} bài học mới`);
    } catch (err) {
      console.error(err);
      alert('Có lỗi khi tạo bài học');
    }
    setIsSeeding(false);
  };

  // Add lesson
  const handleAddLesson = async () => {
    if (!newLessonName.trim() || navState.type === 'root') return;
    const level = navState.type === 'level' ? navState.level : navState.level;
    const parentId = navState.type === 'parent' ? navState.lessonId : null;
    await onAddLesson(newLessonName.trim(), level, parentId, currentUser.id);
    setNewLessonName('');
    setShowAddLesson(false);
  };

  // Update lesson
  const handleUpdateLesson = async () => {
    if (!editingLesson || !newLessonName.trim()) return;
    await onUpdateLesson(editingLesson.id, newLessonName.trim());
    setEditingLesson(null);
    setNewLessonName('');
  };

  // Delete lesson
  const handleDeleteLesson = async (lesson: GrammarLesson) => {
    if (!confirm(`Xoá "${lesson.name}" và tất cả nội dung bên trong?`)) return;
    await onDeleteLesson(lesson.id);
  };

  // Submit grammar card
  const handleSubmit = (data: any) => {
    if (editingCard) {
      onUpdateGrammarCard(editingCard.id, data);
    } else {
      onAddGrammarCard(data, currentUser.id);
    }
    setShowForm(false);
    setEditingCard(null);
  };

  // Export
  const handleExport = () => {
    setIsExporting(true);
    try {
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        type: 'grammar',
        grammarCards: grammarCards.map(({ id, ...rest }) => rest),
        grammarLessons: grammarLessons.map(({ id, ...rest }) => rest),
      };
      downloadAsJSON(exportData, `grammar-export-${new Date().toISOString().split('T')[0]}.json`);
    } catch (err) {
      alert('Có lỗi khi xuất dữ liệu');
    }
    setIsExporting(false);
  };

  // Import
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImportGrammarCard) return;

    setIsImporting(true);
    try {
      const data = await readJSONFile(file) as any;
      if (data.type !== 'grammar') throw new Error('File không hợp lệ');
      let count = 0;
      for (const card of data.grammarCards) {
        await onImportGrammarCard(card);
        count++;
      }
      alert(`Import thành công ${count} thẻ`);
    } catch (err) {
      alert(`Lỗi: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
    setIsImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const canModifyCard = (card: GrammarCard) => isSuperAdmin || card.createdBy === currentUser.id;
  const canModifyLesson = (lesson: GrammarLesson) => isSuperAdmin || lesson.createdBy === currentUser.id;
  const currentCards = getCardsForCurrentView();
  const canAddCard = getCurrentLessonId() !== null;

  // Drag-and-drop handlers
  const handleDragStart = (e: React.DragEvent, lesson: GrammarLesson) => {
    setDraggedLesson(lesson);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', lesson.id);
  };

  const handleDragOver = (e: React.DragEvent, lessonId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedLesson && draggedLesson.id !== lessonId) {
      setDragOverLesson(lessonId);
    }
  };

  const handleDragLeave = () => {
    setDragOverLesson(null);
  };

  const handleDragEnd = () => {
    setDraggedLesson(null);
    setDragOverLesson(null);
  };

  const handleDrop = async (e: React.DragEvent, targetLesson: GrammarLesson, lessonList: GrammarLesson[]) => {
    e.preventDefault();
    if (!draggedLesson || draggedLesson.id === targetLesson.id) {
      setDraggedLesson(null);
      setDragOverLesson(null);
      return;
    }

    // Calculate new order
    const sortedLessons = [...lessonList].sort((a, b) => a.order - b.order);
    const draggedIndex = sortedLessons.findIndex(l => l.id === draggedLesson.id);
    const targetIndex = sortedLessons.findIndex(l => l.id === targetLesson.id);

    // Remove dragged and insert at target position
    const reordered = [...sortedLessons];
    reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedLesson);

    // Create update array with new order values
    const updates = reordered.map((lesson, index) => ({
      id: lesson.id,
      order: index + 1,
    }));

    try {
      await onReorderLessons(updates);
    } catch (err) {
      console.error('Failed to reorder lessons:', err);
    }

    setDraggedLesson(null);
    setDragOverLesson(null);
  };

  // Render breadcrumb
  const renderBreadcrumb = () => (
    <div className="grammar-breadcrumb">
      <span
        className={`grammar-breadcrumb-chip ${navState.type === 'root' ? 'current' : 'clickable'}`}
        onClick={() => navState.type !== 'root' && setNavState({ type: 'root' })}
      >
        <BookOpen size={14} />
        Ngữ pháp
      </span>

      {navState.type !== 'root' && (
        <>
          <ChevronRight size={14} className="grammar-breadcrumb-separator" />
          <span
            className={`grammar-breadcrumb-chip level-${navState.level.toLowerCase()} ${navState.type === 'level' ? 'current' : 'clickable'}`}
            onClick={() => navState.type !== 'level' && setNavState({ type: 'level', level: navState.level })}
          >
            {navState.level}
          </span>
        </>
      )}

      {(navState.type === 'parent' || navState.type === 'child') && (
        <>
          <ChevronRight size={14} className="grammar-breadcrumb-separator" />
          <span
            className={`grammar-breadcrumb-chip ${navState.type === 'parent' ? 'current' : 'clickable'}`}
            onClick={() => navState.type === 'child' && setNavState({ type: 'parent', level: navState.level, lessonId: navState.parentId, lessonName: navState.parentName })}
          >
            <FolderOpen size={14} />
            {navState.type === 'parent' ? navState.lessonName : navState.parentName}
          </span>
        </>
      )}

      {navState.type === 'child' && (
        <>
          <ChevronRight size={14} className="grammar-breadcrumb-separator" />
          <span className="grammar-breadcrumb-chip current">
            <FileText size={14} />
            {navState.lessonName}
          </span>
        </>
      )}
    </div>
  );

  // Render lesson card
  const renderLessonCard = (lesson: GrammarLesson, isChild: boolean = false, lessonList: GrammarLesson[] = []) => {
    const cardCount = getCardCount(lesson.id);
    const childrenCount = getChildLessons(lesson.id).length;
    const levelClass = `level-${lesson.jlptLevel.toLowerCase()}`;
    const isDragging = draggedLesson?.id === lesson.id;
    const isDragOver = dragOverLesson === lesson.id;

    return (
      <div
        key={lesson.id}
        className={`grammar-lesson-card ${levelClass} ${isChild ? 'is-child' : 'is-parent'} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
        draggable={canModifyLesson(lesson)}
        onDragStart={(e) => handleDragStart(e, lesson)}
        onDragOver={(e) => handleDragOver(e, lesson.id)}
        onDragLeave={handleDragLeave}
        onDragEnd={handleDragEnd}
        onDrop={(e) => handleDrop(e, lesson, lessonList)}
        onClick={() => {
          if (isChild) {
            setNavState({
              type: 'child',
              level: navState.type === 'parent' ? navState.level : (navState as any).level,
              parentId: (navState as any).lessonId,
              parentName: (navState as any).lessonName,
              lessonId: lesson.id,
              lessonName: lesson.name
            });
          } else if (navState.type === 'level') {
            setNavState({ type: 'parent', level: navState.level, lessonId: lesson.id, lessonName: lesson.name });
          }
        }}
      >
        {canModifyLesson(lesson) && (
          <span className="drag-handle" title="Kéo để thay đổi vị trí">
            <GripVertical size={16} />
          </span>
        )}

        <div className="lesson-icon">
          {isChild ? <FileText size={20} /> : <FolderOpen size={20} />}
        </div>

        <div className="lesson-info">
          <div className="lesson-name">{lesson.name}</div>
          <div className="lesson-count">
            {cardCount} thẻ{!isChild && childrenCount > 0 && ` • ${childrenCount} thư mục`}
          </div>
        </div>

        {canModifyLesson(lesson) && (
          <div className="lesson-actions" onClick={e => e.stopPropagation()}>
            <button
              className="lesson-action-btn"
              onClick={() => { setEditingLesson(lesson); setNewLessonName(lesson.name); }}
              title="Sửa"
            >
              <Edit2 size={16} />
            </button>
            <button
              className="lesson-action-btn danger"
              onClick={() => handleDeleteLesson(lesson)}
              title="Xoá"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}

        <ChevronRight size={20} className="lesson-arrow" />
      </div>
    );
  };

  // Render add lesson form
  const renderAddLessonForm = () => (
    <div className="add-lesson-form">
      <input
        type="text"
        value={newLessonName}
        onChange={e => setNewLessonName(e.target.value)}
        placeholder={navState.type === 'level' ? 'Tên bài học...' : 'Tên thư mục con...'}
        className="input"
        autoFocus
        onKeyDown={e => e.key === 'Enter' && handleAddLesson()}
      />
      <button className="btn btn-primary" onClick={handleAddLesson} disabled={!newLessonName.trim()}>
        Thêm
      </button>
      <button className="btn btn-secondary" onClick={() => { setShowAddLesson(false); setNewLessonName(''); }}>
        Huỷ
      </button>
    </div>
  );

  // Render edit lesson modal
  const renderEditLessonModal = () => editingLesson && (
    <div className="modal-overlay" onClick={() => setEditingLesson(null)}>
      <div className="modal-content small" onClick={e => e.stopPropagation()}>
        <h3>Sửa tên</h3>
        <input
          type="text"
          value={newLessonName}
          onChange={e => setNewLessonName(e.target.value)}
          className="input"
          autoFocus
          onKeyDown={e => e.key === 'Enter' && handleUpdateLesson()}
        />
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => { setEditingLesson(null); setNewLessonName(''); }}>
            Huỷ
          </button>
          <button className="btn btn-primary" onClick={handleUpdateLesson} disabled={!newLessonName.trim()}>
            Lưu
          </button>
        </div>
      </div>
    </div>
  );

  // Empty state
  const renderEmptyState = (message: string, description?: string) => (
    <div className="grammar-empty-state">
      <BookOpen size={64} className="empty-icon" />
      <div className="empty-title">{message}</div>
      {description && <div className="empty-desc">{description}</div>}
    </div>
  );

  return (
    <div className="grammar-tab-container">
      {/* Header */}
      <div className="grammar-header-actions">
        <div className="action-group">
          {renderBreadcrumb()}
        </div>

        <div className="action-group">
          {navState.type !== 'root' && (
            <button className="btn btn-secondary" onClick={goBack}>
              ← Quay lại
            </button>
          )}

          {/* Seed button for level view */}
          {navState.type === 'level' && isSuperAdmin && (
            <button className="btn btn-secondary" onClick={handleSeed} disabled={isSeeding}>
              {isSeeding ? 'Đang tạo...' : `Tạo Bài ${SEED_CONFIG[navState.level].start}-${SEED_CONFIG[navState.level].end}`}
            </button>
          )}

          {/* Add lesson button */}
          {(navState.type === 'level' || (navState.type === 'parent' && (hasChildren(navState.lessonId) || getChildLessons(navState.lessonId).length === 0))) && !showAddLesson && !showForm && (
            <button className="btn btn-primary" onClick={() => setShowAddLesson(true)}>
              <Plus size={16} />
              {navState.type === 'level' ? 'Thêm bài' : 'Thêm thư mục'}
            </button>
          )}

          {/* Add grammar card button */}
          {canAddCard && !showForm && !showAddLesson && (
            <button className="btn btn-grammar" onClick={() => setShowForm(true)}>
              <Plus size={16} />
              Tạo thẻ ngữ pháp
            </button>
          )}

          {/* Export/Import at root */}
          {navState.type === 'root' && isSuperAdmin && (
            <>
              <input type="file" ref={fileInputRef} accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
              <button className="btn btn-secondary" onClick={handleExport} disabled={isExporting}>
                <Download size={16} />
                Export
              </button>
              <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
                <Upload size={16} />
                Import
              </button>
            </>
          )}
        </div>
      </div>

      {/* Add lesson form */}
      {showAddLesson && renderAddLessonForm()}

      {/* Grammar card form */}
      {showForm && (
        <GrammarCardForm
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingCard(null); }}
          initialData={editingCard || undefined}
          lessons={[]}
          fixedLevel={navState.type !== 'root' ? navState.level : null}
          fixedLessonId={getCurrentLessonId()}
          vocabularyCards={vocabularyCards}
        />
      )}

      {/* Content */}
      {!showForm && !showAddLesson && (
        <>
          {/* Root: Level Grid */}
          {navState.type === 'root' && (
            <LevelGrid
              onSelectLevel={(level) => setNavState({ type: 'level', level })}
              getCount={getCardCountByLevel}
              countLabel="mẫu"
            />
          )}

          {/* Level: Lesson List */}
          {navState.type === 'level' && (
            <div className="grammar-lesson-list">
              {getParentLessonsByLevel(navState.level).map(lesson => renderLessonCard(lesson, false, getParentLessonsByLevel(navState.level)))}
              {getParentLessonsByLevel(navState.level).length === 0 && renderEmptyState(
                'Chưa có bài học',
                isSuperAdmin ? `Nhấn "Tạo Bài ${SEED_CONFIG[navState.level].start}-${SEED_CONFIG[navState.level].end}" để tạo tự động` : 'Chưa có bài học nào'
              )}
            </div>
          )}

          {/* Parent Lesson: Child folders or cards */}
          {navState.type === 'parent' && (
            <div className="grammar-lesson-list">
              {hasChildren(navState.lessonId) ? (
                getChildLessons(navState.lessonId).map(lesson => renderLessonCard(lesson, true, getChildLessons(navState.lessonId)))
              ) : (
                currentCards.length > 0 ? (
                  <GrammarCardList
                    cards={currentCards}
                    onEdit={card => { setEditingCard(card); setShowForm(true); }}
                    onDelete={onDeleteGrammarCard}
                    canEdit={canModifyCard}
                    canDelete={canModifyCard}
                  />
                ) : (
                  renderEmptyState('Chưa có nội dung', 'Thêm thư mục con hoặc tạo thẻ ngữ pháp')
                )
              )}
            </div>
          )}

          {/* Child Lesson: Cards only */}
          {navState.type === 'child' && (
            currentCards.length > 0 ? (
              <GrammarCardList
                cards={currentCards}
                onEdit={card => { setEditingCard(card); setShowForm(true); }}
                onDelete={onDeleteGrammarCard}
                canEdit={canModifyCard}
                canDelete={canModifyCard}
              />
            ) : (
              renderEmptyState('Chưa có thẻ ngữ pháp', 'Nhấn "Tạo thẻ ngữ pháp" để thêm')
            )
          )}
        </>
      )}

      {/* Edit lesson modal */}
      {renderEditLessonModal()}
    </div>
  );
}
