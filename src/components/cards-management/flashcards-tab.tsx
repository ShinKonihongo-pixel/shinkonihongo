// Flashcards Management Tab - Flashcard folder navigation and CRUD

import { useState } from 'react';
import { FlashcardForm } from '../flashcard/flashcard-form';
import { FlashcardList } from '../flashcard/flashcard-list';
import { ConfirmModal } from '../ui/confirm-modal';
import type { FlashcardsTabProps, FlashcardNavState, Flashcard, Lesson, JLPTLevel } from './cards-management-types';
import { JLPT_LEVELS } from './cards-management-types';

export function FlashcardsTab({
  cards,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  getLessonsByLevel,
  getChildLessons,
  onAddLesson,
  onUpdateLesson,
  onDeleteLesson,
  onToggleLock,
  onToggleHide,
  currentUser,
  isSuperAdmin,
}: FlashcardsTabProps) {
  const [navState, setNavState] = useState<FlashcardNavState>({ type: 'root' });
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingLessonName, setEditingLessonName] = useState('');
  const [addingLesson, setAddingLesson] = useState(false);
  const [newLessonName, setNewLessonName] = useState('');
  const [deleteLessonTarget, setDeleteLessonTarget] = useState<Lesson | null>(null);

  const canModifyLesson = (lesson: Lesson) => isSuperAdmin || lesson.createdBy === currentUser.id;
  const canModifyCard = (card: Flashcard) => isSuperAdmin || card.createdBy === currentUser.id;

  const getCurrentLevel = (): JLPTLevel | null => navState.type === 'root' ? null : navState.level;
  const getCurrentLessonId = (): string | null => {
    if (navState.type === 'childLesson') return navState.lessonId;
    if (navState.type === 'parentLesson' && getChildLessons(navState.lessonId).length === 0) return navState.lessonId;
    return null;
  };

  const getCardCountByLevel = (level: JLPTLevel) => cards.filter(c => c.jlptLevel === level).length;
  const getCardCountByLesson = (lessonId: string) => cards.filter(c => c.lessonId === lessonId).length;
  const getCardCountByLessonRecursive = (lessonId: string) => {
    const directCount = cards.filter(c => c.lessonId === lessonId).length;
    const childrenCount = getChildLessons(lessonId).reduce((sum, child) => sum + getCardCountByLesson(child.id), 0);
    return directCount + childrenCount;
  };

  const getCardsForCurrentView = (): Flashcard[] => {
    if (navState.type === 'childLesson') return cards.filter(c => c.lessonId === navState.lessonId);
    if (navState.type === 'parentLesson' && getChildLessons(navState.lessonId).length === 0) return cards.filter(c => c.lessonId === navState.lessonId);
    return [];
  };

  const getBreadcrumb = (): string[] => {
    const crumbs: string[] = ['Tất cả'];
    if (navState.type === 'level') crumbs.push(navState.level);
    if (navState.type === 'parentLesson') crumbs.push(navState.level, navState.lessonName);
    if (navState.type === 'childLesson') crumbs.push(navState.level, navState.parentName, navState.lessonName);
    return crumbs;
  };

  const goBack = () => {
    if (navState.type === 'level') setNavState({ type: 'root' });
    else if (navState.type === 'parentLesson') setNavState({ type: 'level', level: navState.level });
    else if (navState.type === 'childLesson') setNavState({ type: 'parentLesson', level: navState.level, lessonId: navState.parentId, lessonName: navState.parentName });
    setShowForm(false);
    setAddingLesson(false);
  };

  const handleSubmit = (data: any) => {
    if (editingCard) onUpdateCard(editingCard.id, data);
    else onAddCard(data, currentUser.id);
    setShowForm(false);
    setEditingCard(null);
  };

  const handleAddLesson = () => {
    if (!newLessonName.trim()) return;
    if (navState.type === 'level') onAddLesson(newLessonName.trim(), navState.level, null, currentUser.id);
    else if (navState.type === 'parentLesson') onAddLesson(newLessonName.trim(), navState.level, navState.lessonId, currentUser.id);
    setNewLessonName('');
    setAddingLesson(false);
  };

  const handleUpdateLesson = (id: string) => {
    if (editingLessonName.trim()) {
      onUpdateLesson(id, editingLessonName.trim());
      setEditingLessonId(null);
      setEditingLessonName('');
    }
  };

  const breadcrumb = getBreadcrumb();
  const currentCards = getCardsForCurrentView();
  const canAddParentLesson = navState.type === 'level';
  const canAddChildLesson = navState.type === 'parentLesson';
  const parentHasNoChildren = navState.type === 'parentLesson' && getChildLessons(navState.lessonId).length === 0;
  const canAddCard = navState.type === 'childLesson' || parentHasNoChildren;

  const getLessonsForForm = (): Lesson[] => {
    if (navState.type === 'childLesson') return getChildLessons(navState.parentId);
    return [];
  };

  const renderLessonItem = (lesson: Lesson, isChild: boolean = false) => (
    <div
      key={lesson.id}
      className="folder-item"
      onClick={() => {
        if (isChild) {
          setNavState({ type: 'childLesson', level: (navState as any).level, parentId: (navState as any).lessonId, parentName: (navState as any).lessonName, lessonId: lesson.id, lessonName: lesson.name });
        } else {
          setNavState({ type: 'parentLesson', level: (navState as any).level, lessonId: lesson.id, lessonName: lesson.name });
        }
      }}
    >
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
          onChange={(e) => setEditingLessonName(e.target.value)}
          onBlur={() => handleUpdateLesson(lesson.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleUpdateLesson(lesson.id);
            if (e.key === 'Escape') { setEditingLessonId(null); setEditingLessonName(''); }
          }}
          onClick={(e) => e.stopPropagation()}
          autoFocus
        />
      ) : (
        <span className="folder-name" onDoubleClick={(e) => { e.stopPropagation(); setEditingLessonId(lesson.id); setEditingLessonName(lesson.name); }}>{lesson.name}</span>
      )}
      <span className="folder-count">({isChild ? getCardCountByLesson(lesson.id) : getCardCountByLessonRecursive(lesson.id)} thẻ)</span>
      {lesson.isLocked && <span className="locked-badge">Đã khóa</span>}
      {lesson.isHidden && <span className="hidden-badge">Đã ẩn</span>}
      {canModifyLesson(lesson) && (
        <>
          <button className="edit-btn" onClick={(e) => { e.stopPropagation(); setEditingLessonId(lesson.id); setEditingLessonName(lesson.name); }} title="Sửa tên">✎</button>
          <button className="delete-btn" onClick={(e) => { e.stopPropagation(); setDeleteLessonTarget(lesson); }} title="Xóa">×</button>
        </>
      )}
    </div>
  );

  return (
    <>
      <div className="breadcrumb">
        {breadcrumb.map((crumb, idx) => (
          <span key={idx}>
            {idx > 0 && ' / '}
            <span className={idx === breadcrumb.length - 1 ? 'current' : 'clickable'} onClick={() => idx === 0 && setNavState({ type: 'root' })}>{crumb}</span>
          </span>
        ))}
      </div>

      {navState.type !== 'root' && <button className="btn btn-back" onClick={goBack}>← Quay lại</button>}

      {!showForm && !addingLesson && (
        <div className="folder-actions">
          {canAddCard && <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Tạo thẻ</button>}
          {canAddParentLesson && <button className="btn btn-secondary" onClick={() => setAddingLesson(true)}>+ Tạo bài học</button>}
          {canAddChildLesson && <button className="btn btn-secondary" onClick={() => setAddingLesson(true)}>+ Tạo bài học con</button>}
        </div>
      )}

      {addingLesson && (
        <div className="add-category-inline">
          <input type="text" className="category-input" placeholder={canAddChildLesson ? "Tên bài học con..." : "Tên bài học..."} value={newLessonName} onChange={(e) => setNewLessonName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddLesson(); if (e.key === 'Escape') { setAddingLesson(false); setNewLessonName(''); } }} autoFocus />
          <button className="btn btn-primary" onClick={handleAddLesson}>Lưu</button>
          <button className="btn btn-cancel" onClick={() => { setAddingLesson(false); setNewLessonName(''); }}>Hủy</button>
        </div>
      )}

      {showForm && (
        <FlashcardForm onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditingCard(null); }} initialData={editingCard || undefined} lessons={getLessonsForForm()} fixedLevel={getCurrentLevel()} fixedLessonId={getCurrentLessonId()} />
      )}

      {!showForm && !addingLesson && (
        <div className="folder-content">
          {navState.type === 'root' && (
            <div className="folder-list">
              {JLPT_LEVELS.map(level => (
                <div key={level} className="folder-item" onClick={() => setNavState({ type: 'level', level })}>
                  <span className="folder-icon">📁</span>
                  <span className="folder-name">{level}</span>
                  <span className="folder-count">({getCardCountByLevel(level)} thẻ)</span>
                </div>
              ))}
            </div>
          )}

          {navState.type === 'level' && (
            <div className="folder-list">
              {getLessonsByLevel(navState.level).map(lesson => renderLessonItem(lesson))}
              {getLessonsByLevel(navState.level).length === 0 && <p className="empty-message">Chưa có bài học nào. Nhấn "+ Tạo bài học" để thêm.</p>}
            </div>
          )}

          {navState.type === 'parentLesson' && (
            <div className="folder-list">
              {getChildLessons(navState.lessonId).map(lesson => renderLessonItem(lesson, true))}
              {getChildLessons(navState.lessonId).length === 0 && (
                currentCards.length > 0 ? (
                  <FlashcardList cards={currentCards} onEdit={(card) => { setEditingCard(card); setShowForm(true); }} onDelete={onDeleteCard} canEdit={canModifyCard} canDelete={canModifyCard} />
                ) : (
                  <p className="empty-message">Chưa có thẻ nào. Nhấn "+ Tạo thẻ" để thêm hoặc tạo bài học con.</p>
                )
              )}
            </div>
          )}

          {navState.type === 'childLesson' && (
            currentCards.length > 0 ? (
              <FlashcardList cards={currentCards} onEdit={(card) => { setEditingCard(card); setShowForm(true); }} onDelete={onDeleteCard} canEdit={canModifyCard} canDelete={canModifyCard} />
            ) : (
              <p className="empty-message">Chưa có thẻ nào. Nhấn "+ Tạo thẻ" để thêm.</p>
            )
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteLessonTarget !== null}
        title="Xác nhận xóa bài học"
        message={`Bạn có chắc muốn xóa bài học "${deleteLessonTarget?.name || ''}"? Tất cả nội dung bên trong cũng sẽ bị xóa.`}
        confirmText="Xóa"
        onConfirm={() => { if (deleteLessonTarget) { onDeleteLesson(deleteLessonTarget.id); setDeleteLessonTarget(null); } }}
        onCancel={() => setDeleteLessonTarget(null)}
      />
    </>
  );
}
