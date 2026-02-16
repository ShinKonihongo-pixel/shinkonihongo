/* eslint-disable react-hooks/preserve-manual-memoization */
// Test bank panel - orchestrator with state management and view routing
// Structure: Level → Folder → Tests/Assignments
// Supports import from Flashcard and JLPT questions

import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, FolderOpen, ArrowLeft } from 'lucide-react';
import { JLPT_LEVELS } from '../../../constants/jlpt';
import { DEFAULT_QUESTION_POINTS } from '../../../types/classroom';
import type { TestTemplate, TestType, TestQuestion, DifficultyLevel } from '../../../types/classroom';
import type { TestTemplateFormData } from '../../../services/classroom-firestore';
import type { TestBankPanelProps, NavState } from './test-bank-types';
import { flashcardToQuestion, jlptToQuestion } from './test-bank-types';
import { TemplateListView } from './template-list-view';
import { ImportModal } from './import-modal';
import { AutoGenerateModal } from './auto-generate-modal';
import { TestFormModal } from './test-form-modal';
import './test-bank.css';

export function TestBankPanel({
  templates,
  folders,
  loading,
  onCreate,
  onUpdate,
  onDelete,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  getTemplatesByFolder,
  flashcards = [],
  jlptQuestions = [],
}: TestBankPanelProps) {
  // Active tab: tests or assignments
  const [activeTab] = useState<TestType>('test');

  // Navigation state
  const [navState, setNavState] = useState<NavState>({ type: 'root' });

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAutoGenerate, setShowAutoGenerate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TestTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [importSource, setImportSource] = useState<'flashcard' | 'jlpt'>('flashcard');

  // Folder states
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [deleteFolderConfirm, setDeleteFolderConfirm] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState<TestTemplateFormData>({
    title: '',
    description: '',
    type: 'test',
    folderId: undefined,
    questions: [],
    timeLimit: 30,
    tags: [],
    level: '',
    sourceType: 'custom',
  });

  // Current folder's templates
  const currentTemplates = useMemo(() => {
    if (navState.type === 'folder') {
      return getTemplatesByFolder(navState.folderId);
    }
    return [];
  }, [navState, getTemplatesByFolder]);

  // Breadcrumb
  const breadcrumb = useMemo(() => {
    const crumbs = ['Ngân hàng đề'];
    if (navState.type === 'level' || navState.type === 'folder') {
      crumbs.push(navState.level);
    }
    if (navState.type === 'folder') {
      crumbs.push(navState.folderName);
    }
    return crumbs;
  }, [navState]);

  // Count templates by level
  const getTemplateCountByLevel = (level: string): number => {
    return templates.filter(t => t.level === level).length;
  };

  // Go back navigation
  const goBack = () => {
    if (navState.type === 'folder') {
      setNavState({ type: 'level', level: navState.level });
    } else if (navState.type === 'level') {
      setNavState({ type: 'root' });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: activeTab,
      folderId: navState.type === 'folder' ? navState.folderId : undefined,
      questions: [],
      timeLimit: activeTab === 'test' ? 30 : undefined,
      tags: [],
      level: navState.type === 'folder' || navState.type === 'level' ? navState.level : '',
      sourceType: 'custom',
    });
    setShowForm(false);
    setEditingTemplate(null);
  };

  // Open edit form
  const openEdit = (template: TestTemplate) => {
    setFormData({
      title: template.title,
      description: template.description || '',
      type: template.type,
      folderId: template.folderId,
      questions: template.questions,
      timeLimit: template.timeLimit,
      tags: template.tags || [],
      level: template.level || '',
      sourceType: template.sourceType || 'custom',
    });
    setEditingTemplate(template);
    setShowForm(true);
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || formData.questions.length === 0) return;

    setSaving(true);

    if (editingTemplate) {
      const success = await onUpdate(editingTemplate.id, formData);
      if (success) resetForm();
    } else {
      const result = await onCreate(formData);
      if (result) resetForm();
    }

    setSaving(false);
  };

  // Handle delete template
  const handleDeleteTemplate = async (id: string) => {
    setSaving(true);
    await onDelete(id);
    setSaving(false);
  };

  // Handle add folder
  const handleAddFolder = async () => {
    if (!newFolderName.trim() || navState.type !== 'level') return;
    setSaving(true);
    await onCreateFolder(newFolderName.trim(), navState.level, 'test');
    setNewFolderName('');
    setAddingFolder(false);
    setSaving(false);
  };

  // Handle update folder
  const handleUpdateFolder = async (folderId: string) => {
    if (!editingFolderName.trim()) return;
    setSaving(true);
    await onUpdateFolder(folderId, { name: editingFolderName.trim() });
    setEditingFolderId(null);
    setEditingFolderName('');
    setSaving(false);
  };

  // Handle delete folder
  const handleDeleteFolder = async (folderId: string) => {
    setSaving(true);
    await onDeleteFolder(folderId);
    setDeleteFolderConfirm(null);
    setSaving(false);
  };

  // Handle import
  const handleImport = (selectedIds: string[], _level: string, difficulty: DifficultyLevel) => {
    let newQuestions: TestQuestion[] = [];

    if (importSource === 'flashcard') {
      const selectedCards = flashcards.filter(f => selectedIds.includes(f.id));
      newQuestions = selectedCards.map(card => flashcardToQuestion(card, difficulty, DEFAULT_QUESTION_POINTS));
    } else {
      const selectedJlpt = jlptQuestions.filter(j => selectedIds.includes(j.id));
      newQuestions = selectedJlpt.map(q => jlptToQuestion(q, difficulty, DEFAULT_QUESTION_POINTS));
    }

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, ...newQuestions],
      sourceType: importSource,
    }));

    setShowImportModal(false);
  };

  // Handle auto-generate
  const handleAutoGenerate = (questions: TestQuestion[], sourceType: 'flashcard' | 'jlpt' | 'custom') => {
    setFormData(prev => ({
      ...prev,
      questions,
      sourceType,
    }));
    setShowAutoGenerate(false);
  };

  if (loading) {
    return <div className="loading-state">Đang tải...</div>;
  }

  return (
    <div className="test-bank-panel">
      {/* Header */}
      <div className="test-bank-header">
        <h3 className="panel-title">Ngân hàng đề kiểm tra</h3>
      </div>

      {/* Breadcrumb */}
      <div className="breadcrumb">
        {breadcrumb.map((crumb, idx) => (
          <span key={idx}>
            {idx > 0 && ' / '}
            <span
              className={idx === breadcrumb.length - 1 ? 'current' : 'clickable'}
              onClick={() => {
                if (idx === 0) setNavState({ type: 'root' });
                else if (idx === 1 && navState.type === 'folder') {
                  setNavState({ type: 'level', level: navState.level });
                }
              }}
            >
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Back button */}
      {navState.type !== 'root' && (
        <button className="btn btn-back" onClick={goBack}>
          <ArrowLeft size={16} />
          Quay lại
        </button>
      )}

      {/* Actions */}
      {!addingFolder && navState.type !== 'root' && (
        <div className="folder-actions">
          {navState.type === 'folder' && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setFormData(prev => ({ ...prev, type: 'test' }));
                setShowForm(true);
              }}
            >
              <Plus size={16} />
              Tạo bài kiểm tra
            </button>
          )}
          {navState.type === 'level' && (
            <button className="btn btn-secondary" onClick={() => setAddingFolder(true)}>
              <Plus size={16} />
              Tạo thư mục
            </button>
          )}
        </div>
      )}

      {/* Add folder inline */}
      {addingFolder && (
        <div className="add-folder-inline">
          <input
            type="text"
            className="folder-input"
            placeholder="Tên thư mục..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddFolder();
              if (e.key === 'Escape') { setAddingFolder(false); setNewFolderName(''); }
            }}
            autoFocus
          />
          <button className="btn btn-primary btn-sm" onClick={handleAddFolder} disabled={saving}>Lưu</button>
          <button className="btn btn-secondary btn-sm" onClick={() => { setAddingFolder(false); setNewFolderName(''); }}>Hủy</button>
        </div>
      )}

      {/* Content */}
      <div className="test-bank-content">
        {/* Root: show levels */}
        {navState.type === 'root' && (
          <div className="folder-list">
            {JLPT_LEVELS.map(level => (
              <div
                key={level}
                className="folder-item"
                onClick={() => setNavState({ type: 'level', level })}
              >
                <span className="folder-icon">📁</span>
                <span className="folder-name">{level}</span>
                <span className="folder-count">({getTemplateCountByLevel(level)} bài)</span>
              </div>
            ))}
          </div>
        )}

        {/* Level: show folders */}
        {navState.type === 'level' && (
          <div className="folder-list">
            {folders.filter(f => f.level === navState.level).map(folder => (
              <div key={folder.id} className="folder-item-wrapper">
                {editingFolderId === folder.id ? (
                  <div className="edit-folder-inline">
                    <input
                      type="text"
                      value={editingFolderName}
                      onChange={(e) => setEditingFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateFolder(folder.id);
                        if (e.key === 'Escape') { setEditingFolderId(null); setEditingFolderName(''); }
                      }}
                      autoFocus
                    />
                    <button className="btn btn-sm btn-primary" onClick={() => handleUpdateFolder(folder.id)}>Lưu</button>
                    <button className="btn btn-sm" onClick={() => { setEditingFolderId(null); setEditingFolderName(''); }}>Hủy</button>
                  </div>
                ) : (
                  <div
                    className="folder-item"
                    onClick={() => setNavState({ type: 'folder', level: navState.level, folderId: folder.id, folderName: folder.name })}
                  >
                    <FolderOpen size={20} className="folder-icon-svg" />
                    <span className="folder-name">{folder.name}</span>
                    <span className="folder-count">({getTemplatesByFolder(folder.id).length} bài)</span>
                    <div className="folder-actions-inline" onClick={e => e.stopPropagation()}>
                      <button
                        className="btn btn-sm btn-icon"
                        onClick={() => { setEditingFolderId(folder.id); setEditingFolderName(folder.name); }}
                        title="Sửa tên"
                      >
                        <Edit2 size={14} />
                      </button>
                      {deleteFolderConfirm === folder.id ? (
                        <>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDeleteFolder(folder.id)} disabled={saving}>Xóa</button>
                          <button className="btn btn-sm" onClick={() => setDeleteFolderConfirm(null)}>Hủy</button>
                        </>
                      ) : (
                        <button
                          className="btn btn-sm btn-icon danger"
                          onClick={() => setDeleteFolderConfirm(folder.id)}
                          title="Xóa"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {folders.filter(f => f.level === navState.level).length === 0 && (
              <p className="empty-message">Chưa có thư mục nào. Nhấn "+ Tạo thư mục" để thêm.</p>
            )}
          </div>
        )}

        {/* Folder: show templates */}
        {navState.type === 'folder' && (
          <TemplateListView
            templates={currentTemplates}
            onEdit={openEdit}
            onDelete={handleDeleteTemplate}
            saving={saving}
          />
        )}
      </div>

      {/* Create/Edit Form Modal */}
      <TestFormModal
        show={showForm}
        editingTemplate={editingTemplate}
        formData={formData}
        saving={saving}
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
        onClose={resetForm}
        onOpenImport={(source) => {
          setImportSource(source);
          setShowImportModal(true);
        }}
        onOpenAutoGenerate={() => setShowAutoGenerate(true)}
      />

      {/* Import Modal */}
      <ImportModal
        show={showImportModal}
        source={importSource}
        flashcards={flashcards}
        jlptQuestions={jlptQuestions}
        onImport={handleImport}
        onClose={() => setShowImportModal(false)}
      />

      {/* Auto-Generate Modal */}
      <AutoGenerateModal
        show={showAutoGenerate}
        activeTab={activeTab}
        flashcards={flashcards}
        jlptQuestions={jlptQuestions}
        templates={templates}
        onGenerate={handleAutoGenerate}
        onClose={() => setShowAutoGenerate(false)}
      />
    </div>
  );
}
