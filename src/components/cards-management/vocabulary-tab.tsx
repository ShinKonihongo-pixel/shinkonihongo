// Vocabulary Tab - Flashcard (vocabulary) management only

import { useState, useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { FlashcardForm } from '../flashcard/flashcard-form';
import { FlashcardList } from '../flashcard/flashcard-list';
import { ConfirmModal } from '../ui/confirm-modal';
import type { VocabularyTabProps, FlashcardNavState, Flashcard, Lesson, JLPTLevel } from './cards-management-types';
import { JLPT_LEVELS } from './cards-management-types';
import { seedN5Lessons, seedN4Lessons, fixLessonOrder } from '../../scripts/seed-n5-lessons';
// Simple export/import utilities
function downloadAsJSON(data: unknown, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
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
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result as string));
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function generateExportFilename(prefix: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}-export-${date}.json`;
}

interface VocabularyExportData {
  version: string;
  exportedAt: string;
  type: 'vocabulary';
  flashcards: Omit<Flashcard, 'id'>[];
  lessons: Omit<Lesson, 'id'>[];
  lessonIdMap: Record<string, { name: string; jlptLevel: JLPTLevel }>;
}

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
  onImportLesson,
  onImportFlashcard,
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

  // Export vocabulary data
  const handleExport = () => {
    setIsExporting(true);
    try {
      const lessonIdMap: Record<string, { name: string; jlptLevel: JLPTLevel }> = {};
      lessons.forEach(l => { lessonIdMap[l.id] = { name: l.name, jlptLevel: l.jlptLevel }; });

      const exportData: VocabularyExportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        type: 'vocabulary',
        flashcards: cards.map(({ id, ...rest }) => rest),
        lessons: lessons.map(({ id, ...rest }) => rest),
        lessonIdMap,
      };
      const filename = generateExportFilename('vocabulary');
      downloadAsJSON(exportData, filename);
    } catch (error) {
      console.error('Export error:', error);
      alert('Có lỗi khi xuất dữ liệu');
    } finally {
      setIsExporting(false);
    }
  };

  // Import vocabulary data
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!onImportLesson || !onImportFlashcard) {
      alert('Import chưa được cấu hình');
      return;
    }

    setIsImporting(true);
    setImportStatus('Đang đọc file...');

    try {
      const data = await readJSONFile(file) as VocabularyExportData;

      if (!data.type || (data.type !== 'vocabulary' && data.type !== 'flashcards')) {
        throw new Error('File không phải là dữ liệu từ vựng hợp lệ');
      }

      // Step 1: Import lessons
      setImportStatus(`Đang import ${data.lessons.length} bài học...`);
      const oldToNewLessonIdMap: Record<string, string> = {};

      const sortedLessons = [...data.lessons].sort((a, b) => {
        if (a.parentId === null && b.parentId !== null) return -1;
        if (a.parentId !== null && b.parentId === null) return 1;
        return 0;
      });

      for (const lessonData of sortedLessons) {
        const oldId = Object.keys(data.lessonIdMap).find(
          id => data.lessonIdMap[id].name === lessonData.name &&
                data.lessonIdMap[id].jlptLevel === lessonData.jlptLevel
        );

        const existingLesson = lessons.find(
          l => l.name === lessonData.name &&
               l.jlptLevel === lessonData.jlptLevel &&
               (lessonData.parentId === null
                 ? l.parentId === null
                 : l.parentId !== null && oldToNewLessonIdMap[lessonData.parentId] === l.parentId)
        );

        if (existingLesson) {
          if (oldId) oldToNewLessonIdMap[oldId] = existingLesson.id;
          continue;
        }

        const newLessonData = {
          ...lessonData,
          parentId: lessonData.parentId ? oldToNewLessonIdMap[lessonData.parentId] || null : null,
        };

        const newLesson = await onImportLesson(newLessonData);
        if (oldId) oldToNewLessonIdMap[oldId] = newLesson.id;
      }

      // Step 2: Import flashcards
      setImportStatus(`Đang import ${data.flashcards.length} từ vựng...`);
      let importedCards = 0;
      for (const cardData of data.flashcards) {
        const newLessonId = oldToNewLessonIdMap[cardData.lessonId] || cardData.lessonId;

        const existingCard = cards.find(
          c => c.vocabulary === cardData.vocabulary && c.lessonId === newLessonId
        );
        if (existingCard) continue;

        await onImportFlashcard({ ...cardData, lessonId: newLessonId });
        importedCards++;
      }

      setImportStatus(null);
      alert(`Import thành công!\n- ${Object.keys(oldToNewLessonIdMap).length} bài học\n- ${importedCards} từ vựng`);
    } catch (error) {
      console.error('Import error:', error);
      alert(`Lỗi import: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
      setImportStatus(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Seed lessons - admin only
  const handleSeedLessons = async (level: 'N5' | 'N4') => {
    if (!isSuperAdmin) return;

    const config = {
      N5: { range: 'Bài 2-25', fn: seedN5Lessons },
      N4: { range: 'Bài 26-50', fn: seedN4Lessons },
    };

    const { range, fn } = config[level];
    if (!confirm(`Tạo ${range} cho ${level} với cấu trúc thư mục con?\n(Từ vựng, Kanji, Ngữ pháp, Đọc hiểu, Mở rộng)`)) return;

    setSeeding(true);
    try {
      const result = await fn(currentUser.id);
      if (result.success) {
        alert(`Đã tạo ${result.created} bài học/thư mục thành công!`);
      } else {
        alert('Có lỗi xảy ra khi tạo bài học');
      }
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
    if (!bai1) {
      alert('Không tìm thấy Bài 1');
      return;
    }

    if (bai1.order === 1) {
      alert('Bài 1 đã ở vị trí đầu tiên');
      return;
    }

    try {
      await fixLessonOrder(levelLessons, 'Bài 1', 'N5', 1);
      alert('Đã đưa Bài 1 lên đầu!');
    } catch (error) {
      console.error('Fix order error:', error);
      alert('Có lỗi xảy ra');
    }
  };

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
      <span className="folder-count">({isChild ? getCardCountByLesson(lesson.id) : getCardCountByLessonRecursive(lesson.id)} từ)</span>
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

      {/* Export/Import buttons at root level */}
      {navState.type === 'root' && isSuperAdmin && (
        <div className="export-import-actions" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleImportFile}
            style={{ display: 'none' }}
          />
          <button
            className="btn btn-secondary"
            onClick={handleExport}
            disabled={isExporting}
            title="Xuất tất cả từ vựng và bài học"
          >
            <Download size={16} style={{ marginRight: '0.25rem' }} />
            {isExporting ? 'Đang xuất...' : 'Export'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting || !onImportLesson}
            title="Nhập dữ liệu từ file JSON"
          >
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
                  <span className="folder-count">({getCardCountByLevel(level)} từ)</span>
                </div>
              ))}
            </div>
          )}

          {navState.type === 'level' && (
            <div className="folder-list">
              {getLessonsByLevel(navState.level).map(lesson => renderLessonItem(lesson))}
              {getLessonsByLevel(navState.level).length === 0 && <p className="empty-message">Chưa có bài học nào. Nhấn "+ Tạo bài học" để thêm.</p>}
              {/* Admin buttons */}
              {isSuperAdmin && navState.level === 'N5' && (
                <div className="admin-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {getLessonsByLevel('N5').length < 25 && (
                    <button className="btn btn-seed" onClick={() => handleSeedLessons('N5')} disabled={seeding}>
                      {seeding ? 'Đang tạo...' : '🌱 Tạo Bài 2-25'}
                    </button>
                  )}
                  {getLessonsByLevel('N5').some(l => l.name === 'Bài 1' && l.order !== 1) && (
                    <button className="btn btn-secondary" onClick={handleFixBai1Order}>
                      ⬆️ Đưa Bài 1 lên đầu
                    </button>
                  )}
                </div>
              )}
              {isSuperAdmin && navState.level === 'N4' && getLessonsByLevel('N4').length < 25 && (
                <button className="btn btn-seed" onClick={() => handleSeedLessons('N4')} disabled={seeding} style={{ marginTop: '1rem' }}>
                  {seeding ? 'Đang tạo...' : '🌱 Tạo Bài 26-50'}
                </button>
              )}
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
