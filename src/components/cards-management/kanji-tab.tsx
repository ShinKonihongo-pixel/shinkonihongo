// Kanji Tab - Level-based lesson structure
// Navigation: Level → Parent Lesson → Child Lesson → Cards

import { useState, useRef } from 'react';
import { Download, Upload, BookOpen, FolderOpen, FileText, ChevronRight, Plus, Trash2, Edit2, GripVertical } from 'lucide-react';
import { KanjiCardForm } from '../flashcard/kanji-card-form';
import { KanjiCardList } from '../flashcard/kanji-card-list';
import { LevelGrid } from './level-grid';
import type { JLPTLevel } from './cards-management-types';
import type { KanjiCard, KanjiCardFormData, KanjiLesson } from '../../types/kanji';
import type { CurrentUser } from '../../types/user';

// Seed config for each level
const SEED_CONFIG: Record<JLPTLevel, { start: number; end: number; folders: string[] }> = {
  N5: { start: 1, end: 10, folders: ['Kanji', 'Luyện tập'] },
  N4: { start: 1, end: 15, folders: ['Kanji', 'Luyện tập'] },
  N3: { start: 1, end: 20, folders: ['Kanji', 'Luyện tập'] },
  N2: { start: 1, end: 20, folders: ['Kanji', 'Luyện tập'] },
  N1: { start: 1, end: 20, folders: ['Kanji', 'Luyện tập'] },
};

type NavState =
  | { type: 'root' }
  | { type: 'level'; level: JLPTLevel }
  | { type: 'parent'; level: JLPTLevel; lessonId: string; lessonName: string }
  | { type: 'child'; level: JLPTLevel; parentId: string; parentName: string; lessonId: string; lessonName: string };

function downloadAsJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
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

interface KanjiTabProps {
  kanjiCards: KanjiCard[];
  onAddKanjiCard: (data: KanjiCardFormData, createdBy?: string) => void;
  onUpdateKanjiCard: (id: string, data: Partial<KanjiCard>) => void;
  onDeleteKanjiCard: (id: string) => void;
  kanjiLessons: KanjiLesson[];
  getParentLessonsByLevel: (level: JLPTLevel) => KanjiLesson[];
  getChildLessons: (parentId: string) => KanjiLesson[];
  hasChildren: (lessonId: string) => boolean;
  onAddLesson: (name: string, level: JLPTLevel, parentId: string | null, createdBy: string) => Promise<KanjiLesson>;
  onUpdateLesson: (id: string, name: string) => Promise<void>;
  onDeleteLesson: (id: string) => Promise<void>;
  onSeedLessons: (level: JLPTLevel, startNum: number, endNum: number, childFolders: string[], createdBy: string) => Promise<number>;
  onReorderLessons: (reorderedLessons: { id: string; order: number }[]) => Promise<void>;
  onImportKanjiCard?: (data: Omit<KanjiCard, 'id'>) => Promise<KanjiCard>;
  onSeedKanjiCards?: (level: JLPTLevel, lessonIds: string[], createdBy: string) => Promise<number>;
  getKanjiSeedCount?: (level: JLPTLevel) => number;
  currentUser: CurrentUser;
  isSuperAdmin: boolean;
}

export function KanjiTab({
  kanjiCards, onAddKanjiCard, onUpdateKanjiCard, onDeleteKanjiCard,
  kanjiLessons, getParentLessonsByLevel, getChildLessons, hasChildren,
  onAddLesson, onUpdateLesson, onDeleteLesson, onSeedLessons, onReorderLessons,
  onImportKanjiCard, onSeedKanjiCards, getKanjiSeedCount, currentUser, isSuperAdmin,
}: KanjiTabProps) {
  const [navState, setNavState] = useState<NavState>({ type: 'root' });
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<KanjiCard | null>(null);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [newLessonName, setNewLessonName] = useState('');
  const [editingLesson, setEditingLesson] = useState<KanjiLesson | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSeedingCards, setIsSeedingCards] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedLesson, setDraggedLesson] = useState<KanjiLesson | null>(null);
  const [dragOverLesson, setDragOverLesson] = useState<string | null>(null);

  const getCurrentLessonId = (): string | null => {
    if (navState.type === 'child') return navState.lessonId;
    if (navState.type === 'parent' && !hasChildren(navState.lessonId)) return navState.lessonId;
    return null;
  };

  const getCardsForCurrentView = (): KanjiCard[] => {
    const lessonId = getCurrentLessonId();
    if (!lessonId) return [];
    return kanjiCards.filter(c => c.lessonId === lessonId);
  };

  const getCardCountByLevel = (level: JLPTLevel): number => {
    return kanjiCards.filter(c => c.jlptLevel === level).length;
  };

  const getCardCountForLesson = (lessonId: string): number => {
    const direct = kanjiCards.filter(c => c.lessonId === lessonId).length;
    const children = getChildLessons(lessonId);
    const childCount = children.reduce((sum, child) => sum + kanjiCards.filter(c => c.lessonId === child.id).length, 0);
    return direct + childCount;
  };

  const handleSeed = async () => {
    if (navState.type !== 'level') return;
    setIsSeeding(true);
    try {
      const config = SEED_CONFIG[navState.level];
      const count = await onSeedLessons(navState.level, config.start, config.end, config.folders, currentUser.id);
      alert(`Đã tạo ${count} bài mới!`);
    } catch { alert('Lỗi khi tạo bài!'); }
    setIsSeeding(false);
  };

  // Seed kanji cards from built-in data
  const handleSeedKanjiCards = async () => {
    if (navState.type !== 'level' || !onSeedKanjiCards) return;
    const parentLessons = getParentLessonsByLevel(navState.level);
    // Collect all "Kanji" child lesson IDs (or parent lesson IDs if no children)
    const kanjiLessonIds: string[] = [];
    parentLessons.forEach(parent => {
      const children = getChildLessons(parent.id);
      const kanjiChild = children.find(c => c.name === 'Kanji');
      if (kanjiChild) {
        kanjiLessonIds.push(kanjiChild.id);
      } else if (children.length === 0) {
        kanjiLessonIds.push(parent.id);
      }
    });
    if (kanjiLessonIds.length === 0) {
      alert('Chưa có bài học! Hãy "Tạo bài tự động" trước.');
      return;
    }
    const seedCount = getKanjiSeedCount?.(navState.level) ?? 0;
    if (!confirm(`Tạo ${seedCount} chữ Kanji ${navState.level} vào ${kanjiLessonIds.length} bài?`)) return;
    setIsSeedingCards(true);
    try {
      const count = await onSeedKanjiCards(navState.level, kanjiLessonIds, currentUser.id);
      alert(`Đã tạo ${count} chữ Kanji mới! (bỏ qua trùng lặp)`);
    } catch { alert('Lỗi khi tạo Kanji!'); }
    setIsSeedingCards(false);
  };

  const handleExport = () => {
    setIsExporting(true);
    try {
      const data = { kanjiCards, kanjiLessons };
      downloadAsJSON(data, `kanji-export-${new Date().toISOString().split('T')[0]}.json`);
    } catch { alert('Lỗi khi xuất dữ liệu!'); }
    setIsExporting(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImportKanjiCard) return;
    setIsImporting(true);
    try {
      const data = await readJSONFile(file) as { kanjiCards?: Omit<KanjiCard, 'id'>[] };
      let imported = 0;
      for (const card of data.kanjiCards || []) {
        await onImportKanjiCard(card);
        imported++;
      }
      alert(`Đã nhập ${imported} thẻ kanji!`);
    } catch { alert('Lỗi khi nhập dữ liệu!'); }
    setIsImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddCard = (data: KanjiCardFormData) => {
    const lessonId = getCurrentLessonId();
    if (!lessonId) return;
    onAddKanjiCard({ ...data, lessonId }, currentUser.id);
    setShowForm(false);
  };

  const handleUpdateCard = (data: KanjiCardFormData) => {
    if (!editingCard) return;
    onUpdateKanjiCard(editingCard.id, data);
    setEditingCard(null);
  };

  const handleAddLesson = async () => {
    if (!newLessonName.trim()) return;
    const parentId = navState.type === 'parent' ? navState.lessonId : null;
    const level = navState.type === 'level' ? navState.level : navState.type === 'parent' ? navState.level : 'N5';
    await onAddLesson(newLessonName.trim(), level as JLPTLevel, parentId, currentUser.id);
    setNewLessonName('');
    setShowAddLesson(false);
  };

  const handleDragStart = (lesson: KanjiLesson) => setDraggedLesson(lesson);
  const handleDragOver = (e: React.DragEvent, lessonId: string) => { e.preventDefault(); setDragOverLesson(lessonId); };
  const handleDragLeave = () => setDragOverLesson(null);
  const handleDrop = async (targetLesson: KanjiLesson) => {
    if (!draggedLesson || draggedLesson.id === targetLesson.id) { setDraggedLesson(null); setDragOverLesson(null); return; }
    const lessons = navState.type === 'parent' ? getChildLessons(navState.lessonId) : navState.type === 'level' ? getParentLessonsByLevel(navState.level) : [];
    const reordered = lessons.filter(l => l.id !== draggedLesson.id);
    const targetIdx = reordered.findIndex(l => l.id === targetLesson.id);
    reordered.splice(targetIdx, 0, draggedLesson);
    await onReorderLessons(reordered.map((l, i) => ({ id: l.id, order: i + 1 })));
    setDraggedLesson(null);
    setDragOverLesson(null);
  };

  // Breadcrumb
  const renderBreadcrumb = () => {
    const crumbs: { label: string; onClick: () => void }[] = [
      { label: 'Hán Tự', onClick: () => setNavState({ type: 'root' }) },
    ];
    if (navState.type !== 'root') {
      crumbs.push({ label: navState.level, onClick: () => setNavState({ type: 'level', level: navState.level }) });
    }
    if (navState.type === 'parent' || navState.type === 'child') {
      const name = navState.type === 'parent' ? navState.lessonName : navState.parentName;
      const id = navState.type === 'parent' ? navState.lessonId : navState.parentId;
      crumbs.push({ label: name, onClick: () => setNavState({ type: 'parent', level: navState.level, lessonId: id, lessonName: name }) });
    }
    if (navState.type === 'child') {
      crumbs.push({ label: navState.lessonName, onClick: () => {} });
    }

    return (
      <div className="breadcrumb">
        {crumbs.map((c, i) => (
          <span key={i}>
            {i > 0 && <ChevronRight size={14} className="breadcrumb-sep" />}
            <button className={`breadcrumb-item ${i === crumbs.length - 1 ? 'active' : ''}`} onClick={c.onClick}>{c.label}</button>
          </span>
        ))}
      </div>
    );
  };

  // Lesson list with drag-and-drop
  const renderLessonList = (lessons: KanjiLesson[], isChild: boolean) => (
    <div className="lesson-list">
      {lessons.map(lesson => (
        <div
          key={lesson.id}
          className={`lesson-item ${dragOverLesson === lesson.id ? 'drag-over' : ''}`}
          draggable
          onDragStart={() => handleDragStart(lesson)}
          onDragOver={(e) => handleDragOver(e, lesson.id)}
          onDragLeave={handleDragLeave}
          onDrop={() => handleDrop(lesson)}
        >
          <GripVertical size={16} className="grip-icon" />
          {editingLesson?.id === lesson.id ? (
            <input className="inline-edit-input" autoFocus value={editingLesson.name}
              onChange={e => setEditingLesson({ ...editingLesson, name: e.target.value })}
              onKeyDown={e => { if (e.key === 'Enter') { onUpdateLesson(lesson.id, editingLesson.name); setEditingLesson(null); } if (e.key === 'Escape') setEditingLesson(null); }}
              onBlur={() => { onUpdateLesson(lesson.id, editingLesson.name); setEditingLesson(null); }}
            />
          ) : (
            <button className="lesson-item-btn" onClick={() => {
              if (isChild) {
                const parentName = navState.type === 'parent' ? navState.lessonName : '';
                const parentId = navState.type === 'parent' ? navState.lessonId : '';
                setNavState({ type: 'child', level: navState.type === 'parent' ? navState.level : 'N5' as JLPTLevel, parentId, parentName, lessonId: lesson.id, lessonName: lesson.name });
              } else {
                setNavState({ type: 'parent', level: navState.type === 'level' ? navState.level : 'N5' as JLPTLevel, lessonId: lesson.id, lessonName: lesson.name });
              }
            }}>
              {isChild ? <FileText size={16} /> : <FolderOpen size={16} />}
              <span className="lesson-item-name">{lesson.name}</span>
              <span className="lesson-item-count">{getCardCountForLesson(lesson.id)} chữ</span>
            </button>
          )}
          {isSuperAdmin && (
            <div className="lesson-item-actions">
              <button className="btn btn-icon btn-sm" onClick={() => setEditingLesson(lesson)}><Edit2 size={14} /></button>
              <button className="btn btn-icon btn-sm btn-danger" onClick={() => { if (confirm(`Xóa "${lesson.name}"?`)) onDeleteLesson(lesson.id); }}><Trash2 size={14} /></button>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // Main render
  return (
    <div className="management-tab">
      {renderBreadcrumb()}

      <div className="tab-actions">
        {isSuperAdmin && (
          <>
            <button className="btn btn-secondary btn-sm" onClick={handleExport} disabled={isExporting}>
              <Download size={14} /> Xuất
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
              <Upload size={14} /> Nhập
            </button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </>
        )}
      </div>

      {/* Root: Level Grid */}
      {navState.type === 'root' && (
        <LevelGrid onSelectLevel={(level) => setNavState({ type: 'level', level })} getCount={getCardCountByLevel} countLabel="chữ" />
      )}

      {/* Level: Lesson List */}
      {navState.type === 'level' && (
        <>
          <div className="section-header-row">
            <h3><BookOpen size={18} /> {navState.level} - Bài học</h3>
            {isSuperAdmin && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddLesson(true)}><Plus size={14} /> Thêm bài</button>
                <button className="btn btn-secondary btn-sm" onClick={handleSeed} disabled={isSeeding}>
                  {isSeeding ? 'Đang tạo...' : 'Tạo bài tự động'}
                </button>
                {onSeedKanjiCards && (
                  <button className="btn btn-secondary btn-sm" onClick={handleSeedKanjiCards} disabled={isSeedingCards} style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: 'white', border: 'none' }}>
                    {isSeedingCards ? 'Đang tạo Kanji...' : `Tạo Kanji tự động (${getKanjiSeedCount?.(navState.level) ?? 0})`}
                  </button>
                )}
              </div>
            )}
          </div>
          {showAddLesson && (
            <div className="inline-add-form">
              <input placeholder="Tên bài..." value={newLessonName} onChange={e => setNewLessonName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddLesson()} autoFocus />
              <button className="btn btn-primary btn-sm" onClick={handleAddLesson}>Tạo</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { setShowAddLesson(false); setNewLessonName(''); }}>Huỷ</button>
            </div>
          )}
          {renderLessonList(getParentLessonsByLevel(navState.level), false)}
        </>
      )}

      {/* Parent: Child Lessons or Cards */}
      {navState.type === 'parent' && (
        <>
          {hasChildren(navState.lessonId) ? (
            <>
              <div className="section-header-row">
                <h3><FolderOpen size={18} /> {navState.lessonName}</h3>
                {isSuperAdmin && (
                  <button className="btn btn-primary btn-sm" onClick={() => setShowAddLesson(true)}><Plus size={14} /> Thêm thư mục</button>
                )}
              </div>
              {showAddLesson && (
                <div className="inline-add-form">
                  <input placeholder="Tên thư mục..." value={newLessonName} onChange={e => setNewLessonName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddLesson()} autoFocus />
                  <button className="btn btn-primary btn-sm" onClick={handleAddLesson}>Tạo</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setShowAddLesson(false); setNewLessonName(''); }}>Huỷ</button>
                </div>
              )}
              {renderLessonList(getChildLessons(navState.lessonId), true)}
            </>
          ) : (
            <>
              <div className="section-header-row">
                <h3><FileText size={18} /> {navState.lessonName} ({getCardsForCurrentView().length} chữ)</h3>
                {isSuperAdmin && (
                  <button className="btn btn-primary btn-sm" onClick={() => { setEditingCard(null); setShowForm(true); }}><Plus size={14} /> Thêm Kanji</button>
                )}
              </div>
              {showForm && <KanjiCardForm onSubmit={handleAddCard} onCancel={() => setShowForm(false)} fixedLevel={navState.level} fixedLessonId={getCurrentLessonId()} />}
              {editingCard && <KanjiCardForm onSubmit={handleUpdateCard} onCancel={() => setEditingCard(null)} initialData={editingCard} fixedLevel={navState.level} fixedLessonId={getCurrentLessonId()} />}
              <KanjiCardList cards={getCardsForCurrentView()} onEdit={card => { setEditingCard(card); setShowForm(false); }} onDelete={onDeleteKanjiCard} canEdit={isSuperAdmin} />
            </>
          )}
        </>
      )}

      {/* Child: Cards */}
      {navState.type === 'child' && (
        <>
          <div className="section-header-row">
            <h3><FileText size={18} /> {navState.lessonName} ({getCardsForCurrentView().length} chữ)</h3>
            {isSuperAdmin && (
              <button className="btn btn-primary btn-sm" onClick={() => { setEditingCard(null); setShowForm(true); }}><Plus size={14} /> Thêm Kanji</button>
            )}
          </div>
          {showForm && <KanjiCardForm onSubmit={handleAddCard} onCancel={() => setShowForm(false)} fixedLevel={navState.level} fixedLessonId={getCurrentLessonId()} />}
          {editingCard && <KanjiCardForm onSubmit={handleUpdateCard} onCancel={() => setEditingCard(null)} initialData={editingCard} fixedLevel={navState.level} fixedLessonId={getCurrentLessonId()} />}
          <KanjiCardList cards={getCardsForCurrentView()} onEdit={card => { setEditingCard(card); setShowForm(false); }} onDelete={onDeleteKanjiCard} canEdit={isSuperAdmin} />
        </>
      )}
    </div>
  );
}
