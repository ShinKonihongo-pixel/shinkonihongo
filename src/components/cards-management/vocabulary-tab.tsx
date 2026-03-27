// Vocabulary Tab - Flashcard (vocabulary) management only
// Features: Drag-and-drop reordering, lock/hide, import/export

import { useState, useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { ConfirmModal } from '../ui/confirm-modal';
import { VocabTabForm } from './vocabulary-tab-form';
import { VocabTabContent } from './vocabulary-tab-content';
import { exportVocabularyData, importVocabularyData, seedVocabularyLessons, fixVocabularyBai1Order } from './vocabulary-tab-import-export';
import type { VocabularyTabProps, FlashcardNavState, Flashcard, FlashcardFormData, Lesson, JLPTLevel } from './cards-management-types';
import './vocabulary-tab.css';

export function VocabularyTab({
  cards,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  lessons,
  getLessonsByLevel,
  getChildLessons,
  onAddLesson,
  onUpdateLesson,
  onDeleteLesson,
  onToggleLock,
  onToggleHide,
  onReorderLessons,
  onImportLesson,
  onImportFlashcard,
  grammarCards = [],
  currentUser,
  isSuperAdmin,
}: VocabularyTabProps) {
  const [navState, setNavState] = useState<FlashcardNavState>({ type: 'root' });
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingLessonName, setEditingLessonName] = useState('');
  const [addingLesson, setAddingLesson] = useState(false);
  const [newLessonName, setNewLessonName] = useState('');
  const [deleteLessonTarget, setDeleteLessonTarget] = useState<Lesson | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formSubTab, setFormSubTab] = useState<'vocabulary' | 'kanji'>('vocabulary');
  const [formKanjiText, setFormKanjiText] = useState('');
  const [draggedLesson, setDraggedLesson] = useState<Lesson | null>(null);
  const [dragOverLesson, setDragOverLesson] = useState<string | null>(null);

  const handleExport = () => {
    setIsExporting(true);
    try { exportVocabularyData(cards, lessons); }
    catch (error) { console.error('Export error:', error); alert('Có lỗi khi xuất dữ liệu'); }
    finally { setIsExporting(false); }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!onImportLesson || !onImportFlashcard) { alert('Import chưa được cấu hình'); return; }
    setIsImporting(true);
    setImportStatus('Đang đọc file...');
    try {
      const { lessonsImported, cardsImported } = await importVocabularyData(
        file, cards, lessons, onImportLesson, onImportFlashcard, setImportStatus
      );
      setImportStatus(null);
      alert(`Import thành công!\n- ${lessonsImported} bài học\n- ${cardsImported} từ vựng`);
    } catch (error) {
      console.error('Import error:', error);
      alert(`Lỗi import: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
      setImportStatus(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSeedLessons = async (level: 'N5' | 'N4') => {
    if (!isSuperAdmin) return;
    const config = {
      N5: { range: 'Bài 2-25', folders: '(Từ vựng, Kanji, Ngữ pháp, Đọc hiểu, Mở rộng)' },
      N4: { range: 'Bài 26-50', folders: '(Từ vựng, Kanji, Mở rộng)' },
    };
    if (!confirm(`Tạo ${config[level].range} cho ${level} với cấu trúc thư mục con?\n${config[level].folders}`)) return;
    setSeeding(true);
    try {
      const result = await seedVocabularyLessons(level, currentUser.id);
      if (result.success) { alert(`Đã tạo ${result.created} bài học/thư mục thành công!`); }
      else { alert('Có lỗi xảy ra khi tạo bài học'); }
    } catch (error) {
      console.error('Seed error:', error);
      alert('Có lỗi xảy ra');
    } finally {
      setSeeding(false);
    }
  };

  const handleFixBai1Order = async () => {
    if (!isSuperAdmin) return;
    const levelLessons = getLessonsByLevel('N5');
    const bai1 = levelLessons.find(l => l.name === 'Bài 1');
    if (!bai1) { alert('Không tìm thấy Bài 1'); return; }
    if (bai1.order === 1) { alert('Bài 1 đã ở vị trí đầu tiên'); return; }
    try {
      await fixVocabularyBai1Order(levelLessons);
      alert('Đã đưa Bài 1 lên đầu!');
    } catch (error) {
      console.error('Fix order error:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const canModifyLesson = (lesson: Lesson) => isSuperAdmin || lesson.createdBy === currentUser.id;
  const canModifyCard = (card: Flashcard) => isSuperAdmin || card.createdBy === currentUser.id;

  const handleDragStart = (e: React.DragEvent, lesson: Lesson) => {
    setDraggedLesson(lesson);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', lesson.id);
  };
  const handleDragOver = (e: React.DragEvent, lessonId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedLesson && draggedLesson.id !== lessonId) setDragOverLesson(lessonId);
  };
  const handleDragLeave = () => setDragOverLesson(null);
  const handleDragEnd = () => { setDraggedLesson(null); setDragOverLesson(null); };
  const handleDrop = async (e: React.DragEvent, targetLesson: Lesson, lessonList: Lesson[]) => {
    e.preventDefault();
    if (!draggedLesson || draggedLesson.id === targetLesson.id) { setDraggedLesson(null); setDragOverLesson(null); return; }
    const sortedLessons = [...lessonList].sort((a, b) => a.order - b.order);
    const draggedIndex = sortedLessons.findIndex(l => l.id === draggedLesson.id);
    const targetIndex = sortedLessons.findIndex(l => l.id === targetLesson.id);
    const reordered = [...sortedLessons];
    reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedLesson);
    const updates = reordered.map((lesson, index) => ({ id: lesson.id, order: index + 1 }));
    try { await onReorderLessons(updates); } catch (err) { console.error('Failed to reorder lessons:', err); }
    setDraggedLesson(null);
    setDragOverLesson(null);
  };

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
    setShowForm(false); setAddingLesson(false); setFormSubTab('vocabulary'); setFormKanjiText('');
  };
  const handleSubmit = (data: Partial<Flashcard>) => {
    if (editingCard) {
      const updateData = { ...data };
      if ('difficultyLevel' in data && data.difficultyLevel) updateData.originalDifficultyLevel = data.difficultyLevel;
      onUpdateCard(editingCard.id, updateData);
    } else {
      onAddCard(data as FlashcardFormData, currentUser.id);
    }
    setShowForm(false); setEditingCard(null); setFormSubTab('vocabulary'); setFormKanjiText('');
  };
  const handleAddLesson = () => {
    if (!newLessonName.trim()) return;
    if (navState.type === 'level') onAddLesson(newLessonName.trim(), navState.level, null, currentUser.id);
    else if (navState.type === 'parentLesson') onAddLesson(newLessonName.trim(), navState.level, navState.lessonId, currentUser.id);
    setNewLessonName(''); setAddingLesson(false);
  };
  const handleUpdateLesson = (id: string) => {
    if (editingLessonName.trim()) {
      onUpdateLesson(id, editingLessonName.trim());
      setEditingLessonId(null); setEditingLessonName('');
    }
  };

  const breadcrumb = getBreadcrumb();
  const currentCards = getCardsForCurrentView();
  const canAddParentLesson = navState.type === 'level';
  const canAddChildLesson = navState.type === 'parentLesson';
  const parentHasNoChildren = navState.type === 'parentLesson' && getChildLessons(navState.lessonId).length === 0;
  const canAddCard = navState.type === 'childLesson' || parentHasNoChildren;
  const getLessonsForForm = (): Lesson[] => navState.type === 'childLesson' ? getChildLessons(navState.parentId) : [];

  const handleSelectParentLesson = (lesson: Lesson) => {
    if (navState.type === 'level') setNavState({ type: 'parentLesson', level: navState.level, lessonId: lesson.id, lessonName: lesson.name });
  };
  const handleSelectChildLesson = (lesson: Lesson) => {
    if (navState.type === 'parentLesson') setNavState({ type: 'childLesson', level: navState.level, parentId: navState.lessonId, parentName: navState.lessonName, lessonId: lesson.id, lessonName: lesson.name });
    else if (navState.type === 'childLesson') setNavState({ type: 'childLesson', level: navState.level, parentId: navState.parentId, parentName: navState.parentName, lessonId: lesson.id, lessonName: lesson.name });
  };

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

      {navState.type === 'root' && isSuperAdmin && (
        <div className="export-import-actions" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
          <input type="file" ref={fileInputRef} accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
          <button className="btn btn-secondary" onClick={handleExport} disabled={isExporting} title="Xuất tất cả từ vựng và bài học">
            <Download size={16} style={{ marginRight: '0.25rem' }} />
            {isExporting ? 'Đang xuất...' : 'Export'}
          </button>
          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={isImporting || !onImportLesson} title="Nhập dữ liệu từ file JSON">
            <Upload size={16} style={{ marginRight: '0.25rem' }} />
            {isImporting ? 'Đang nhập...' : 'Import'}
          </button>
          {importStatus && <span className="import-status" style={{ color: '#666', fontSize: '0.875rem' }}>{importStatus}</span>}
        </div>
      )}

      {!showForm && !addingLesson && (
        <div className="folder-actions">
          {canAddCard && <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Tạo thẻ từ vựng</button>}
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
        <VocabTabForm
          editingCard={editingCard}
          formSubTab={formSubTab}
          formKanjiText={formKanjiText}
          lessons={getLessonsForForm()}
          fixedLevel={getCurrentLevel()}
          fixedLessonId={getCurrentLessonId()}
          grammarCards={grammarCards}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingCard(null); setFormSubTab('vocabulary'); setFormKanjiText(''); }}
          onSubTabChange={setFormSubTab}
          onKanjiTextChange={setFormKanjiText}
        />
      )}

      {!showForm && !addingLesson && (
        <VocabTabContent
          navState={navState}
          currentCards={currentCards}
          isSuperAdmin={isSuperAdmin}
          seeding={seeding}
          editingLessonId={editingLessonId}
          editingLessonName={editingLessonName}
          draggedLessonId={draggedLesson?.id ?? null}
          dragOverLessonId={dragOverLesson}
          canModifyLesson={canModifyLesson}
          canModifyCard={canModifyCard}
          getLessonsByLevel={getLessonsByLevel}
          getChildLessons={getChildLessons}
          getCardCountByLevel={getCardCountByLevel}
          getCardCountByLesson={getCardCountByLesson}
          getCardCountByLessonRecursive={getCardCountByLessonRecursive}
          onSelectLevel={(level) => setNavState({ type: 'level', level })}
          onSelectParentLesson={handleSelectParentLesson}
          onSelectChildLesson={handleSelectChildLesson}
          onEditCard={(card) => { setEditingCard(card); setShowForm(true); }}
          onDeleteCard={onDeleteCard}
          onToggleLock={onToggleLock}
          onToggleHide={onToggleHide}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          onSetEditingLesson={(id, name) => { setEditingLessonId(id); setEditingLessonName(name); }}
          onEditingNameChange={setEditingLessonName}
          onUpdateLesson={handleUpdateLesson}
          onCancelEdit={() => { setEditingLessonId(null); setEditingLessonName(''); }}
          onDeleteLessonRequest={setDeleteLessonTarget}
          onSeedLessons={handleSeedLessons}
          onFixBai1Order={handleFixBai1Order}
        />
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
