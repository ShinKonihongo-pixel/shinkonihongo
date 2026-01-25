// Grammar Tab - Grammar card management (similar to VocabularyTab)
// Uses shared lessons from vocabulary but manages grammar cards

import { useState, useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { GrammarCardForm } from '../flashcard/grammar-card-form';
import { GrammarCardList } from '../flashcard/grammar-card-list';
import type { GrammarTabProps, FlashcardNavState, GrammarCard, Lesson, JLPTLevel } from './cards-management-types';
import { JLPT_LEVELS } from './cards-management-types';

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

interface GrammarExportData {
  version: string;
  exportedAt: string;
  type: 'grammar';
  grammarCards: Omit<GrammarCard, 'id'>[];
  lessonIdMap: Record<string, { name: string; jlptLevel: JLPTLevel }>;
}

export function GrammarTab({
  grammarCards,
  onAddGrammarCard,
  onUpdateGrammarCard,
  onDeleteGrammarCard,
  lessons,
  getLessonsByLevel,
  getChildLessons,
  onToggleLock,
  onToggleHide,
  onImportGrammarCard,
  currentUser,
  isSuperAdmin,
}: GrammarTabProps) {
  const [navState, setNavState] = useState<FlashcardNavState>({ type: 'root' });
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<GrammarCard | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export grammar data
  const handleExport = () => {
    setIsExporting(true);
    try {
      const lessonIdMap: Record<string, { name: string; jlptLevel: JLPTLevel }> = {};
      lessons.forEach(l => { lessonIdMap[l.id] = { name: l.name, jlptLevel: l.jlptLevel }; });

      const exportData: GrammarExportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        type: 'grammar',
        grammarCards: grammarCards.map(({ id, ...rest }) => rest),
        lessonIdMap,
      };
      const filename = generateExportFilename('grammar');
      downloadAsJSON(exportData, filename);
    } catch (error) {
      console.error('Export error:', error);
      alert('Có lỗi khi xuất dữ liệu');
    } finally {
      setIsExporting(false);
    }
  };

  // Import grammar data
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!onImportGrammarCard) {
      alert('Import chưa được cấu hình');
      return;
    }

    setIsImporting(true);
    setImportStatus('Đang đọc file...');

    try {
      const data = await readJSONFile(file) as GrammarExportData;

      if (!data.type || data.type !== 'grammar') {
        throw new Error('File không phải là dữ liệu ngữ pháp hợp lệ');
      }

      // Map old lessonId to new lessonId by matching name + jlptLevel
      const oldToNewLessonIdMap: Record<string, string> = {};
      for (const [oldId, info] of Object.entries(data.lessonIdMap)) {
        const existingLesson = lessons.find(
          l => l.name === info.name && l.jlptLevel === info.jlptLevel
        );
        if (existingLesson) {
          oldToNewLessonIdMap[oldId] = existingLesson.id;
        }
      }

      // Import grammar cards
      setImportStatus(`Đang import ${data.grammarCards.length} thẻ ngữ pháp...`);
      let importedCount = 0;
      for (const cardData of data.grammarCards) {
        const newLessonId = oldToNewLessonIdMap[cardData.lessonId] || cardData.lessonId;

        // Check if card already exists
        const existingCard = grammarCards.find(
          g => g.title === cardData.title && g.lessonId === newLessonId
        );
        if (existingCard) continue;

        await onImportGrammarCard({ ...cardData, lessonId: newLessonId });
        importedCount++;
      }

      setImportStatus(null);
      alert(`Import thành công!\n- ${importedCount} thẻ ngữ pháp`);
    } catch (error) {
      console.error('Import error:', error);
      alert(`Lỗi import: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
      setImportStatus(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const canModifyLesson = (lesson: Lesson) => isSuperAdmin || lesson.createdBy === currentUser.id;
  const canModifyCard = (card: GrammarCard) => isSuperAdmin || card.createdBy === currentUser.id;

  const getCurrentLevel = (): JLPTLevel | null => navState.type === 'root' ? null : navState.level;
  const getCurrentLessonId = (): string | null => {
    if (navState.type === 'childLesson') return navState.lessonId;
    if (navState.type === 'parentLesson' && getChildLessons(navState.lessonId).length === 0) return navState.lessonId;
    return null;
  };

  const getCardCountByLevel = (level: JLPTLevel) => grammarCards.filter(c => c.jlptLevel === level).length;
  const getCardCountByLesson = (lessonId: string) => grammarCards.filter(c => c.lessonId === lessonId).length;
  const getCardCountByLessonRecursive = (lessonId: string) => {
    const directCount = grammarCards.filter(c => c.lessonId === lessonId).length;
    const childrenCount = getChildLessons(lessonId).reduce((sum, child) => sum + getCardCountByLesson(child.id), 0);
    return directCount + childrenCount;
  };

  const getCardsForCurrentView = (): GrammarCard[] => {
    if (navState.type === 'childLesson') return grammarCards.filter(c => c.lessonId === navState.lessonId);
    if (navState.type === 'parentLesson' && getChildLessons(navState.lessonId).length === 0) return grammarCards.filter(c => c.lessonId === navState.lessonId);
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
  };

  const handleSubmit = (data: any) => {
    if (editingCard) onUpdateGrammarCard(editingCard.id, data);
    else onAddGrammarCard(data, currentUser.id);
    setShowForm(false);
    setEditingCard(null);
  };

  const breadcrumb = getBreadcrumb();
  const currentCards = getCardsForCurrentView();
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
      {/* Lock/Hide buttons - show if user can modify or has onToggle handlers */}
      {canModifyLesson(lesson) && onToggleLock && onToggleHide && (
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
      <span className="folder-name">{lesson.name}</span>
      <span className="folder-count">({isChild ? getCardCountByLesson(lesson.id) : getCardCountByLessonRecursive(lesson.id)} mẫu)</span>
      {lesson.isLocked && <span className="locked-badge">Đã khóa</span>}
      {lesson.isHidden && <span className="hidden-badge">Đã ẩn</span>}
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
            title="Xuất tất cả ngữ pháp"
          >
            <Download size={16} style={{ marginRight: '0.25rem' }} />
            {isExporting ? 'Đang xuất...' : 'Export'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting || !onImportGrammarCard}
            title="Nhập dữ liệu từ file JSON"
          >
            <Upload size={16} style={{ marginRight: '0.25rem' }} />
            {isImporting ? 'Đang nhập...' : 'Import'}
          </button>
          {importStatus && <span className="import-status" style={{ color: '#666', fontSize: '0.875rem' }}>{importStatus}</span>}
        </div>
      )}

      {!showForm && (
        <div className="folder-actions">
          {canAddCard && <button className="btn btn-grammar" onClick={() => setShowForm(true)}>+ Tạo thẻ ngữ pháp</button>}
        </div>
      )}

      {showForm && (
        <GrammarCardForm onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditingCard(null); }} initialData={editingCard || undefined} lessons={getLessonsForForm()} fixedLevel={getCurrentLevel()} fixedLessonId={getCurrentLessonId()} />
      )}

      {!showForm && (
        <div className="folder-content">
          {navState.type === 'root' && (
            <div className="folder-list">
              {JLPT_LEVELS.map(level => (
                <div key={level} className="folder-item" onClick={() => setNavState({ type: 'level', level })}>
                  <span className="folder-icon">📁</span>
                  <span className="folder-name">{level}</span>
                  <span className="folder-count">({getCardCountByLevel(level)} mẫu)</span>
                </div>
              ))}
            </div>
          )}

          {navState.type === 'level' && (
            <div className="folder-list">
              {getLessonsByLevel(navState.level).map(lesson => renderLessonItem(lesson))}
              {getLessonsByLevel(navState.level).length === 0 && <p className="empty-message">Chưa có bài học nào. Vui lòng tạo bài học ở tab Từ Vựng trước.</p>}
            </div>
          )}

          {navState.type === 'parentLesson' && (
            <div className="folder-list">
              {getChildLessons(navState.lessonId).map(lesson => renderLessonItem(lesson, true))}
              {getChildLessons(navState.lessonId).length === 0 && (
                currentCards.length > 0 ? (
                  <GrammarCardList cards={currentCards} onEdit={(card) => { setEditingCard(card); setShowForm(true); }} onDelete={onDeleteGrammarCard} canEdit={canModifyCard} canDelete={canModifyCard} />
                ) : (
                  <p className="empty-message">Chưa có thẻ ngữ pháp nào. Nhấn "+ Tạo thẻ ngữ pháp" để thêm.</p>
                )
              )}
            </div>
          )}

          {navState.type === 'childLesson' && (
            currentCards.length > 0 ? (
              <GrammarCardList cards={currentCards} onEdit={(card) => { setEditingCard(card); setShowForm(true); }} onDelete={onDeleteGrammarCard} canEdit={canModifyCard} canDelete={canModifyCard} />
            ) : (
              <p className="empty-message">Chưa có thẻ ngữ pháp nào. Nhấn "+ Tạo thẻ ngữ pháp" để thêm.</p>
            )
          )}
        </div>
      )}
    </>
  );
}
