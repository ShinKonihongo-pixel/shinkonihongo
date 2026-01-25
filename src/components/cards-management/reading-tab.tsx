// Reading Comprehension Management Tab

import { useState } from 'react';
import { Edit2, Trash2, ChevronRight } from 'lucide-react';
import { ConfirmModal } from '../ui/confirm-modal';
import type { ReadingPassage, ReadingPassageFormData, ReadingFolder, ReadingAnswer } from '../../types/reading';
import type { JLPTLevel } from '../../types/flashcard';
import type { CurrentUser } from '../../types/user';

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

type NavState =
  | { type: 'root' }
  | { type: 'level'; level: JLPTLevel }
  | { type: 'folder'; level: JLPTLevel; folderId: string; folderName: string };

interface ReadingTabProps {
  passages: ReadingPassage[];
  folders: ReadingFolder[];
  onAddPassage: (data: ReadingPassageFormData, createdBy?: string) => Promise<ReadingPassage>;
  onUpdatePassage: (id: string, data: Partial<ReadingPassage>) => Promise<void>;
  onDeletePassage: (id: string) => Promise<void>;
  onAddFolder: (name: string, level: JLPTLevel, createdBy?: string) => Promise<ReadingFolder>;
  onUpdateFolder: (id: string, data: Partial<ReadingFolder>) => Promise<void>;
  onDeleteFolder: (id: string) => Promise<void>;
  getFoldersByLevel: (level: JLPTLevel) => ReadingFolder[];
  getPassagesByFolder: (folderId: string) => ReadingPassage[];
  currentUser: CurrentUser;
  isSuperAdmin: boolean;
}

const defaultAnswers: ReadingAnswer[] = [
  { text: '', isCorrect: true },
  { text: '', isCorrect: false },
  { text: '', isCorrect: false },
  { text: '', isCorrect: false },
];

export function ReadingTab({
  passages,
  folders: _folders,
  onAddPassage,
  onUpdatePassage,
  onDeletePassage,
  onAddFolder,
  onUpdateFolder,
  onDeleteFolder,
  getFoldersByLevel,
  getPassagesByFolder,
  currentUser,
  isSuperAdmin,
}: ReadingTabProps) {
  const [navState, setNavState] = useState<NavState>({ type: 'root' });
  const [showForm, setShowForm] = useState(false);
  const [editingPassage, setEditingPassage] = useState<ReadingPassage | null>(null);
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'passage' | 'folder'; id: string; name: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    questions: { question: string; answers: ReadingAnswer[]; explanation?: string }[];
    jlptLevel: JLPTLevel;
    folderId?: string;
  }>({
    title: '',
    content: '',
    questions: [{ question: '', answers: [...defaultAnswers], explanation: '' }],
    jlptLevel: 'N5',
    folderId: undefined,
  });

  const canModify = (createdBy?: string) => isSuperAdmin || createdBy === currentUser.id;

  const getPassageCountByLevel = (level: JLPTLevel) => passages.filter(p => p.jlptLevel === level).length;

  const getPassageCountByFolder = (folderId: string) => passages.filter(p => p.folderId === folderId).length;

  const getBreadcrumb = (): string[] => {
    const crumbs: string[] = ['Tất cả'];
    if (navState.type === 'level') crumbs.push(navState.level);
    if (navState.type === 'folder') crumbs.push(navState.level, navState.folderName);
    return crumbs;
  };

  const goBack = () => {
    if (navState.type === 'folder') setNavState({ type: 'level', level: navState.level });
    else if (navState.type === 'level') setNavState({ type: 'root' });
    setShowForm(false);
    setAddingFolder(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      questions: [{ question: '', answers: [...defaultAnswers], explanation: '' }],
      jlptLevel: navState.type === 'level' || navState.type === 'folder' ? navState.level : 'N5',
      folderId: navState.type === 'folder' ? navState.folderId : undefined,
    });
    setEditingPassage(null);
  };

  const handleEditPassage = (passage: ReadingPassage) => {
    setEditingPassage(passage);
    setFormData({
      title: passage.title,
      content: passage.content,
      questions: passage.questions.map(q => ({
        question: q.question,
        answers: [...q.answers],
        explanation: q.explanation,
      })),
      jlptLevel: passage.jlptLevel,
      folderId: passage.folderId,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Vui lòng nhập tiêu đề và nội dung!');
      return;
    }

    // Validate questions
    for (let i = 0; i < formData.questions.length; i++) {
      const q = formData.questions[i];
      if (!q.question.trim()) {
        alert(`Câu hỏi ${i + 1} chưa có nội dung!`);
        return;
      }
      const hasCorrect = q.answers.some(a => a.isCorrect && a.text.trim());
      if (!hasCorrect) {
        alert(`Câu hỏi ${i + 1} chưa có đáp án đúng!`);
        return;
      }
    }

    try {
      if (editingPassage) {
        await onUpdatePassage(editingPassage.id, {
          title: formData.title,
          content: formData.content,
          questions: formData.questions.map((q, idx) => ({
            id: editingPassage.questions[idx]?.id || `q_${Date.now()}_${idx}`,
            ...q,
          })),
          jlptLevel: formData.jlptLevel,
          folderId: formData.folderId,
        });
      } else {
        await onAddPassage(formData, currentUser.id);
      }
      setShowForm(false);
      resetForm();
    } catch (error) {
      alert('Có lỗi xảy ra!');
      console.error(error);
    }
  };

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return;
    if (navState.type !== 'level') return;

    try {
      await onAddFolder(newFolderName.trim(), navState.level, currentUser.id);
      setNewFolderName('');
      setAddingFolder(false);
    } catch (error) {
      alert('Có lỗi xảy ra!');
      console.error(error);
    }
  };

  const handleUpdateFolder = async (id: string) => {
    if (!editingFolderName.trim()) return;
    try {
      await onUpdateFolder(id, { name: editingFolderName.trim() });
      setEditingFolderId(null);
      setEditingFolderName('');
    } catch (error) {
      alert('Có lỗi xảy ra!');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'passage') {
        await onDeletePassage(deleteTarget.id);
      } else {
        await onDeleteFolder(deleteTarget.id);
      }
      setDeleteTarget(null);
    } catch (error) {
      alert('Có lỗi xảy ra!');
      console.error(error);
    }
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { question: '', answers: [...defaultAnswers], explanation: '' }],
    }));
  };

  const removeQuestion = (idx: number) => {
    if (formData.questions.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx),
    }));
  };

  const updateQuestion = (idx: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === idx ? { ...q, [field]: value } : q),
    }));
  };

  const updateAnswer = (qIdx: number, aIdx: number, text: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === qIdx ? {
        ...q,
        answers: q.answers.map((a, j) => j === aIdx ? { ...a, text } : a),
      } : q),
    }));
  };

  const setCorrectAnswer = (qIdx: number, aIdx: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === qIdx ? {
        ...q,
        answers: q.answers.map((a, j) => ({ ...a, isCorrect: j === aIdx })),
      } : q),
    }));
  };

  const breadcrumb = getBreadcrumb();
  const currentFolders = navState.type === 'level' ? getFoldersByLevel(navState.level) : [];
  const currentPassages = navState.type === 'folder' ? getPassagesByFolder(navState.folderId) : [];

  return (
    <div className="reading-tab">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        {breadcrumb.map((crumb, idx) => (
          <span key={idx}>
            {idx > 0 && ' / '}
            <span className={idx === breadcrumb.length - 1 ? 'current' : 'clickable'}
              onClick={() => idx === 0 && setNavState({ type: 'root' })}
            >
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {navState.type !== 'root' && (
        <button className="btn btn-back" onClick={goBack}>← Quay lại</button>
      )}

      {/* Actions */}
      {!showForm && !addingFolder && (
        <div className="folder-actions">
          {navState.type === 'folder' && (
            <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
              + Tạo bài đọc
            </button>
          )}
          {navState.type === 'level' && (
            <button className="btn btn-secondary" onClick={() => setAddingFolder(true)}>
              + Tạo thư mục
            </button>
          )}
        </div>
      )}

      {/* Add folder form */}
      {addingFolder && (
        <div className="add-category-inline">
          <input
            type="text"
            className="category-input"
            placeholder="Tên thư mục..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddFolder();
              if (e.key === 'Escape') { setAddingFolder(false); setNewFolderName(''); }
            }}
            autoFocus
          />
          <button className="btn btn-primary" onClick={handleAddFolder}>Lưu</button>
          <button className="btn btn-cancel" onClick={() => { setAddingFolder(false); setNewFolderName(''); }}>Hủy</button>
        </div>
      )}

      {/* Passage form */}
      {showForm && (
        <form className="reading-form" onSubmit={handleSubmit}>
          <h3>{editingPassage ? 'Sửa bài đọc' : 'Tạo bài đọc mới'}</h3>

          <div className="form-group">
            <label>Tiêu đề *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Tiêu đề bài đọc..."
              required
            />
          </div>

          <div className="form-group">
            <label>Nội dung đoạn văn *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Nhập nội dung đoạn văn tiếng Nhật..."
              rows={8}
              required
            />
          </div>

          <div className="form-group">
            <label>
              Câu hỏi ({formData.questions.length})
              <button type="button" className="btn-add-question" onClick={addQuestion}>+ Thêm câu hỏi</button>
            </label>
            {formData.questions.map((q, qIdx) => (
              <div key={qIdx} className="question-block">
                <div className="question-header">
                  <span>Câu {qIdx + 1}</span>
                  {formData.questions.length > 1 && (
                    <button type="button" className="btn-remove" onClick={() => removeQuestion(qIdx)}>×</button>
                  )}
                </div>
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                  placeholder="Nội dung câu hỏi..."
                  className="question-input"
                />
                <div className="answers-grid">
                  {q.answers.map((a, aIdx) => (
                    <div key={aIdx} className="answer-row">
                      <input
                        type="radio"
                        name={`correct-${qIdx}`}
                        checked={a.isCorrect}
                        onChange={() => setCorrectAnswer(qIdx, aIdx)}
                      />
                      <input
                        type="text"
                        value={a.text}
                        onChange={(e) => updateAnswer(qIdx, aIdx, e.target.value)}
                        placeholder={`Đáp án ${aIdx + 1}`}
                        className={a.isCorrect ? 'correct-answer' : ''}
                      />
                    </div>
                  ))}
                </div>
                <input
                  type="text"
                  value={q.explanation || ''}
                  onChange={(e) => updateQuestion(qIdx, 'explanation', e.target.value)}
                  placeholder="Giải thích (tùy chọn)..."
                  className="explanation-input"
                />
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>Hủy</button>
            <button type="submit" className="btn btn-primary">{editingPassage ? 'Cập nhật' : 'Tạo bài đọc'}</button>
          </div>
        </form>
      )}

      {/* Content */}
      {!showForm && !addingFolder && (
        <div className="folder-content">
          {/* Root - show levels */}
          {navState.type === 'root' && (
            <div className="folder-list">
              {JLPT_LEVELS.map(level => (
                <div key={level} className="folder-item" onClick={() => setNavState({ type: 'level', level })}>
                  <span className="folder-icon">📁</span>
                  <span className="folder-name">{level}</span>
                  <span className="folder-count">({getPassageCountByLevel(level)} bài)</span>
                  <ChevronRight size={16} className="folder-arrow" />
                </div>
              ))}
            </div>
          )}

          {/* Level - show folders */}
          {navState.type === 'level' && (
            <div className="folder-list">
              {currentFolders.map(folder => (
                <div key={folder.id} className="folder-item">
                  {editingFolderId === folder.id ? (
                    <input
                      type="text"
                      className="edit-input inline"
                      value={editingFolderName}
                      onChange={(e) => setEditingFolderName(e.target.value)}
                      onBlur={() => handleUpdateFolder(folder.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateFolder(folder.id);
                        if (e.key === 'Escape') { setEditingFolderId(null); setEditingFolderName(''); }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    <>
                      <span className="folder-icon" onClick={() => setNavState({ type: 'folder', level: navState.level, folderId: folder.id, folderName: folder.name })}>📂</span>
                      <span className="folder-name" onClick={() => setNavState({ type: 'folder', level: navState.level, folderId: folder.id, folderName: folder.name })}>{folder.name}</span>
                      <span className="folder-count">({getPassageCountByFolder(folder.id)} bài)</span>
                      {canModify(folder.createdBy) && (
                        <>
                          <button className="edit-btn" onClick={(e) => { e.stopPropagation(); setEditingFolderId(folder.id); setEditingFolderName(folder.name); }}>
                            <Edit2 size={14} />
                          </button>
                          <button className="delete-btn" onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'folder', id: folder.id, name: folder.name }); }}>
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                      <ChevronRight size={16} className="folder-arrow" onClick={() => setNavState({ type: 'folder', level: navState.level, folderId: folder.id, folderName: folder.name })} />
                    </>
                  )}
                </div>
              ))}
              {currentFolders.length === 0 && (
                <p className="empty-message">Chưa có thư mục nào. Nhấn "+ Tạo thư mục" để thêm.</p>
              )}
            </div>
          )}

          {/* Folder - show passages */}
          {navState.type === 'folder' && (
            <div className="passage-list">
              {currentPassages.map(passage => (
                <div key={passage.id} className="passage-item">
                  <div className="passage-header">
                    <h4>{passage.title}</h4>
                    <span className="question-count">{passage.questions.length} câu hỏi</span>
                  </div>
                  <p className="passage-preview">{passage.content.substring(0, 150)}...</p>
                  {canModify(passage.createdBy) && (
                    <div className="passage-actions">
                      <button className="btn btn-sm" onClick={() => handleEditPassage(passage)}>
                        <Edit2 size={14} /> Sửa
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget({ type: 'passage', id: passage.id, name: passage.title })}>
                        <Trash2 size={14} /> Xóa
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {currentPassages.length === 0 && (
                <p className="empty-message">Chưa có bài đọc nào. Nhấn "+ Tạo bài đọc" để thêm.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Confirm delete modal */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        title={`Xác nhận xóa ${deleteTarget?.type === 'folder' ? 'thư mục' : 'bài đọc'}`}
        message={`Bạn có chắc muốn xóa "${deleteTarget?.name}"?${deleteTarget?.type === 'folder' ? ' Tất cả bài đọc trong thư mục cũng sẽ bị xóa.' : ''}`}
        confirmText="Xóa"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <style>{`
        .reading-tab {
          padding: 1rem;
        }

        .reading-form {
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }

        .reading-form h3 {
          margin: 0 0 1rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .form-group input[type="text"],
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border-color, #ddd);
          border-radius: 8px;
          font-size: 1rem;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 150px;
          font-family: inherit;
        }

        .btn-add-question {
          margin-left: auto;
          padding: 0.25rem 0.75rem;
          background: var(--primary-color, #4a90d9);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .question-block {
          background: var(--bg-secondary, #f8f9fa);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .btn-remove {
          width: 24px;
          height: 24px;
          border: none;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1rem;
          line-height: 1;
        }

        .question-input {
          width: 100%;
          margin-bottom: 0.75rem;
        }

        .answers-grid {
          display: grid;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .answer-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .answer-row input[type="text"] {
          flex: 1;
        }

        .answer-row input[type="text"].correct-answer {
          border-color: var(--success-color, #22c55e);
          background: rgba(34, 197, 94, 0.1);
        }

        .explanation-input {
          width: 100%;
          font-size: 0.875rem;
          color: var(--text-secondary, #666);
        }

        .form-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        .passage-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .passage-item {
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 8px;
          padding: 1rem;
        }

        .passage-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .passage-header h4 {
          margin: 0;
        }

        .question-count {
          font-size: 0.875rem;
          color: var(--text-secondary, #666);
          background: var(--bg-secondary, #f1f5f9);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        .passage-preview {
          color: var(--text-secondary, #666);
          font-size: 0.9rem;
          margin-bottom: 0.75rem;
          line-height: 1.5;
        }

        .passage-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-sm {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
        }

        .folder-arrow {
          margin-left: auto;
          color: var(--text-secondary, #999);
        }
      `}</style>
    </div>
  );
}
