// Reading Comprehension Management Tab - Premium Professional UI

import { useState } from 'react';
import { Edit2, Trash2, ChevronRight, BookOpen, FolderOpen, Plus, FileText, HelpCircle, CheckCircle2, Sparkles, ArrowLeft } from 'lucide-react';
import { ConfirmModal } from '../ui/confirm-modal';
import type { ReadingPassage, ReadingPassageFormData, ReadingFolder, ReadingAnswer } from '../../types/reading';
import type { JLPTLevel } from '../../types/flashcard';
import type { CurrentUser } from '../../types/user';

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

// Level theme configurations
const LEVEL_THEMES: Record<JLPTLevel, { gradient: string; glow: string; icon: string; light: string }> = {
  N5: { gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', glow: 'rgba(16, 185, 129, 0.15)', icon: '🌱', light: '#ecfdf5' },
  N4: { gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', glow: 'rgba(59, 130, 246, 0.15)', icon: '📘', light: '#eff6ff' },
  N3: { gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', glow: 'rgba(139, 92, 246, 0.15)', icon: '📖', light: '#f5f3ff' },
  N2: { gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', glow: 'rgba(245, 158, 11, 0.15)', icon: '📚', light: '#fffbeb' },
  N1: { gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', glow: 'rgba(239, 68, 68, 0.15)', icon: '👑', light: '#fef2f2' },
};

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

  const currentFolders = navState.type === 'level' ? getFoldersByLevel(navState.level) : [];
  const currentPassages = navState.type === 'folder' ? getPassagesByFolder(navState.folderId) : [];
  const currentTheme = navState.type !== 'root' ? LEVEL_THEMES[navState.level] : null;

  return (
    <div className="reading-tab-pro">
      {/* Premium Header */}
      <div className="rt-header">
        <div className="rt-header-content">
          <div className="rt-header-icon">
            <BookOpen size={24} />
            <Sparkles className="rt-sparkle" size={12} />
          </div>
          <div className="rt-header-text">
            <h2>Quản Lý Đọc Hiểu</h2>
            <p>
              {navState.type === 'root' && 'Chọn cấp độ JLPT'}
              {navState.type === 'level' && `Thư mục ${navState.level}`}
              {navState.type === 'folder' && `${navState.level} / ${navState.folderName}`}
            </p>
          </div>
        </div>
        {navState.type !== 'root' && (
          <button className="rt-back-btn" onClick={goBack}>
            <ArrowLeft size={18} />
            <span>Quay lại</span>
          </button>
        )}
      </div>

      {/* Actions */}
      {!showForm && !addingFolder && (
        <div className="rt-actions">
          {navState.type === 'folder' && (
            <button className="rt-btn rt-btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus size={18} />
              <span>Tạo bài đọc</span>
            </button>
          )}
          {navState.type === 'level' && (
            <button className="rt-btn rt-btn-secondary" onClick={() => setAddingFolder(true)}>
              <FolderOpen size={18} />
              <span>Tạo thư mục</span>
            </button>
          )}
        </div>
      )}

      {/* Add folder form */}
      {addingFolder && (
        <div className="rt-add-folder">
          <div className="rt-folder-form">
            <FolderOpen size={20} className="rt-folder-icon" />
            <input
              type="text"
              placeholder="Nhập tên thư mục..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddFolder();
                if (e.key === 'Escape') { setAddingFolder(false); setNewFolderName(''); }
              }}
              autoFocus
            />
            <button className="rt-btn rt-btn-primary rt-btn-sm" onClick={handleAddFolder}>Lưu</button>
            <button className="rt-btn rt-btn-ghost rt-btn-sm" onClick={() => { setAddingFolder(false); setNewFolderName(''); }}>Hủy</button>
          </div>
        </div>
      )}

      {/* Passage form */}
      {showForm && (
        <div className="rt-form-container">
          <form className="rt-form" onSubmit={handleSubmit}>
            <div className="rt-form-header">
              <FileText size={20} />
              <h3>{editingPassage ? 'Chỉnh sửa bài đọc' : 'Tạo bài đọc mới'}</h3>
            </div>

            <div className="rt-form-group">
              <label>
                <span className="rt-label-icon">📝</span>
                Tiêu đề
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Nhập tiêu đề bài đọc..."
                className="rt-input"
                required
              />
            </div>

            <div className="rt-form-group">
              <label>
                <span className="rt-label-icon">📖</span>
                Nội dung đoạn văn
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Nhập nội dung đoạn văn tiếng Nhật..."
                className="rt-textarea"
                rows={8}
                required
              />
            </div>

            <div className="rt-form-group">
              <label className="rt-questions-label">
                <span className="rt-label-icon">❓</span>
                Câu hỏi ({formData.questions.length})
                <button type="button" className="rt-btn rt-btn-add-q" onClick={addQuestion}>
                  <Plus size={14} /> Thêm câu
                </button>
              </label>

              <div className="rt-questions-list">
                {formData.questions.map((q, qIdx) => (
                  <div key={qIdx} className="rt-question-card">
                    <div className="rt-question-header">
                      <div className="rt-question-num">
                        <HelpCircle size={16} />
                        <span>Câu {qIdx + 1}</span>
                      </div>
                      {formData.questions.length > 1 && (
                        <button type="button" className="rt-btn-remove" onClick={() => removeQuestion(qIdx)}>×</button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                      placeholder="Nội dung câu hỏi..."
                      className="rt-input rt-question-input"
                    />

                    <div className="rt-answers-grid">
                      {q.answers.map((a, aIdx) => (
                        <div key={aIdx} className={`rt-answer-row ${a.isCorrect ? 'rt-correct' : ''}`}>
                          <label className="rt-radio-label">
                            <input
                              type="radio"
                              name={`correct-${qIdx}`}
                              checked={a.isCorrect}
                              onChange={() => setCorrectAnswer(qIdx, aIdx)}
                              className="rt-radio"
                            />
                            <span className="rt-radio-custom">
                              {a.isCorrect && <CheckCircle2 size={14} />}
                            </span>
                          </label>
                          <span className="rt-answer-letter">{String.fromCharCode(65 + aIdx)}</span>
                          <input
                            type="text"
                            value={a.text}
                            onChange={(e) => updateAnswer(qIdx, aIdx, e.target.value)}
                            placeholder={`Đáp án ${String.fromCharCode(65 + aIdx)}`}
                            className="rt-input rt-answer-input"
                          />
                        </div>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={q.explanation || ''}
                      onChange={(e) => updateQuestion(qIdx, 'explanation', e.target.value)}
                      placeholder="💡 Giải thích (tùy chọn)..."
                      className="rt-input rt-explanation-input"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rt-form-actions">
              <button type="button" className="rt-btn rt-btn-ghost" onClick={() => { setShowForm(false); resetForm(); }}>Hủy</button>
              <button type="submit" className="rt-btn rt-btn-primary">
                {editingPassage ? 'Cập nhật' : 'Tạo bài đọc'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Content */}
      {!showForm && !addingFolder && (
        <div className="rt-content">
          {/* Root - show levels */}
          {navState.type === 'root' && (
            <div className="rt-levels-grid">
              {JLPT_LEVELS.map((level, idx) => {
                const theme = LEVEL_THEMES[level];
                const count = getPassageCountByLevel(level);
                return (
                  <div
                    key={level}
                    className="rt-level-card"
                    onClick={() => setNavState({ type: 'level', level })}
                    style={{ '--card-delay': `${idx * 0.08}s`, '--level-gradient': theme.gradient, '--level-glow': theme.glow, '--level-light': theme.light } as React.CSSProperties}
                  >
                    <div className="rt-level-icon">{theme.icon}</div>
                    <div className="rt-level-info">
                      <h3>{level}</h3>
                      <span>{count} bài đọc</span>
                    </div>
                    <ChevronRight size={20} className="rt-level-arrow" />
                    <div className="rt-level-shine" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Level - show folders */}
          {navState.type === 'level' && (
            <div className="rt-folders-list">
              {currentFolders.map((folder, idx) => (
                <div
                  key={folder.id}
                  className="rt-folder-card"
                  style={{ '--card-delay': `${idx * 0.05}s`, '--level-gradient': currentTheme?.gradient } as React.CSSProperties}
                >
                  {editingFolderId === folder.id ? (
                    <div className="rt-folder-edit">
                      <input
                        type="text"
                        className="rt-input"
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
                    </div>
                  ) : (
                    <>
                      <div className="rt-folder-main" onClick={() => setNavState({ type: 'folder', level: navState.level, folderId: folder.id, folderName: folder.name })}>
                        <div className="rt-folder-icon-wrap">
                          <FolderOpen size={22} />
                        </div>
                        <div className="rt-folder-info">
                          <h4>{folder.name}</h4>
                          <span>{getPassageCountByFolder(folder.id)} bài đọc</span>
                        </div>
                        <ChevronRight size={18} className="rt-folder-arrow" />
                      </div>
                      {canModify(folder.createdBy) && (
                        <div className="rt-folder-actions">
                          <button className="rt-action-btn" onClick={(e) => { e.stopPropagation(); setEditingFolderId(folder.id); setEditingFolderName(folder.name); }}>
                            <Edit2 size={14} />
                          </button>
                          <button className="rt-action-btn rt-action-danger" onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'folder', id: folder.id, name: folder.name }); }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
              {currentFolders.length === 0 && (
                <div className="rt-empty">
                  <FolderOpen size={48} />
                  <h4>Chưa có thư mục</h4>
                  <p>Nhấn "Tạo thư mục" để bắt đầu</p>
                </div>
              )}
            </div>
          )}

          {/* Folder - show passages */}
          {navState.type === 'folder' && (
            <div className="rt-passages-grid">
              {currentPassages.map((passage, idx) => (
                <div
                  key={passage.id}
                  className="rt-passage-card"
                  style={{ '--card-delay': `${idx * 0.05}s`, '--level-gradient': currentTheme?.gradient, '--level-glow': currentTheme?.glow } as React.CSSProperties}
                >
                  <div className="rt-passage-header">
                    <div className="rt-passage-badge" style={{ background: currentTheme?.gradient }}>
                      {passage.jlptLevel}
                    </div>
                    <span className="rt-passage-count">{passage.questions.length} câu hỏi</span>
                  </div>
                  <h4 className="rt-passage-title">{passage.title}</h4>
                  <p className="rt-passage-preview">{passage.content.substring(0, 120)}...</p>
                  {canModify(passage.createdBy) && (
                    <div className="rt-passage-actions">
                      <button className="rt-btn rt-btn-sm rt-btn-secondary" onClick={() => handleEditPassage(passage)}>
                        <Edit2 size={14} /> Sửa
                      </button>
                      <button className="rt-btn rt-btn-sm rt-btn-danger" onClick={() => setDeleteTarget({ type: 'passage', id: passage.id, name: passage.title })}>
                        <Trash2 size={14} /> Xóa
                      </button>
                    </div>
                  )}
                  <div className="rt-passage-shine" />
                </div>
              ))}
              {currentPassages.length === 0 && (
                <div className="rt-empty rt-empty-wide">
                  <FileText size={48} />
                  <h4>Chưa có bài đọc</h4>
                  <p>Nhấn "Tạo bài đọc" để thêm mới</p>
                </div>
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
        .reading-tab-pro {
          padding: 1.5rem;
          min-height: 100%;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }

        /* Header */
        .rt-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          margin-bottom: 1.5rem;
        }

        .rt-header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .rt-header-icon {
          position: relative;
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
        }

        .rt-sparkle {
          position: absolute;
          top: -4px;
          right: -4px;
          color: #fbbf24;
          animation: sparkle 2s ease-in-out infinite;
        }

        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }

        .rt-header-text h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
        }

        .rt-header-text p {
          margin: 0.25rem 0 0;
          font-size: 0.875rem;
          color: #64748b;
        }

        .rt-back-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          background: #f1f5f9;
          border: none;
          border-radius: 10px;
          color: #475569;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .rt-back-btn:hover {
          background: #e2e8f0;
          color: #1e293b;
        }

        /* Actions */
        .rt-actions {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        /* Buttons */
        .rt-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .rt-btn-primary {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
        }

        .rt-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
        }

        .rt-btn-secondary {
          background: white;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        .rt-btn-secondary:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .rt-btn-ghost {
          background: transparent;
          color: #64748b;
        }

        .rt-btn-ghost:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        .rt-btn-danger {
          background: #fef2f2;
          color: #ef4444;
          border: 1px solid #fecaca;
        }

        .rt-btn-danger:hover {
          background: #fee2e2;
        }

        .rt-btn-sm {
          padding: 0.5rem 0.875rem;
          font-size: 0.8rem;
        }

        .rt-btn-add-q {
          margin-left: auto;
          padding: 0.4rem 0.75rem;
          font-size: 0.8rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }

        /* Add Folder */
        .rt-add-folder {
          margin-bottom: 1.5rem;
        }

        .rt-folder-form {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        }

        .rt-folder-form .rt-folder-icon {
          color: #6366f1;
        }

        .rt-folder-form input {
          flex: 1;
          padding: 0.625rem 0.875rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.9rem;
        }

        .rt-folder-form input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        /* Form */
        .rt-form-container {
          margin-bottom: 1.5rem;
        }

        .rt-form {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }

        .rt-form-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding-bottom: 1rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid #f1f5f9;
          color: #6366f1;
        }

        .rt-form-header h3 {
          margin: 0;
          font-size: 1.1rem;
          color: #1e293b;
        }

        .rt-form-group {
          margin-bottom: 1.25rem;
        }

        .rt-form-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-weight: 600;
          font-size: 0.9rem;
          color: #475569;
        }

        .rt-label-icon {
          font-size: 1rem;
        }

        .rt-questions-label {
          margin-bottom: 1rem !important;
        }

        .rt-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        .rt-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .rt-textarea {
          width: 100%;
          padding: 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.95rem;
          font-family: inherit;
          resize: vertical;
          min-height: 180px;
          line-height: 1.8;
          transition: all 0.2s;
        }

        .rt-textarea:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        /* Questions */
        .rt-questions-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .rt-question-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.25rem;
        }

        .rt-question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .rt-question-num {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: #6366f1;
        }

        .rt-btn-remove {
          width: 28px;
          height: 28px;
          border: none;
          background: #fef2f2;
          color: #ef4444;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .rt-btn-remove:hover {
          background: #fee2e2;
        }

        .rt-question-input {
          margin-bottom: 0.75rem;
        }

        .rt-answers-grid {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .rt-answer-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: white;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }

        .rt-answer-row.rt-correct {
          background: #f0fdf4;
          border-color: #86efac;
        }

        .rt-radio-label {
          display: flex;
          cursor: pointer;
        }

        .rt-radio {
          display: none;
        }

        .rt-radio-custom {
          width: 22px;
          height: 22px;
          border: 2px solid #d1d5db;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .rt-radio:checked + .rt-radio-custom {
          background: #22c55e;
          border-color: #22c55e;
          color: white;
        }

        .rt-answer-letter {
          width: 24px;
          height: 24px;
          background: #f1f5f9;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.8rem;
          color: #64748b;
        }

        .rt-answer-row.rt-correct .rt-answer-letter {
          background: #dcfce7;
          color: #16a34a;
        }

        .rt-answer-input {
          flex: 1;
          border: none;
          background: transparent;
          padding: 0.5rem;
        }

        .rt-answer-input:focus {
          box-shadow: none;
        }

        .rt-explanation-input {
          font-size: 0.875rem;
          color: #64748b;
          background: #fffbeb;
          border-color: #fde68a;
        }

        .rt-form-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          padding-top: 1rem;
          border-top: 1px solid #f1f5f9;
          margin-top: 0.5rem;
        }

        /* Levels Grid */
        .rt-levels-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }

        .rt-level-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          background: white;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: cardAppear 0.4s ease backwards;
          animation-delay: var(--card-delay);
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        }

        @keyframes cardAppear {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .rt-level-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px var(--level-glow);
        }

        .rt-level-card:hover .rt-level-shine {
          transform: translateX(100%);
        }

        .rt-level-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          transition: transform 0.5s ease;
          pointer-events: none;
        }

        .rt-level-icon {
          font-size: 2rem;
        }

        .rt-level-info {
          flex: 1;
        }

        .rt-level-info h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
        }

        .rt-level-info span {
          font-size: 0.875rem;
          color: #64748b;
        }

        .rt-level-arrow {
          color: #94a3b8;
          transition: all 0.2s;
        }

        .rt-level-card:hover .rt-level-arrow {
          color: #6366f1;
          transform: translateX(4px);
        }

        /* Folders List */
        .rt-folders-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .rt-folder-card {
          display: flex;
          align-items: center;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s;
          animation: cardAppear 0.3s ease backwards;
          animation-delay: var(--card-delay);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
        }

        .rt-folder-card:hover {
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
        }

        .rt-folder-main {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          cursor: pointer;
        }

        .rt-folder-icon-wrap {
          width: 44px;
          height: 44px;
          background: var(--level-gradient);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .rt-folder-info {
          flex: 1;
        }

        .rt-folder-info h4 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
        }

        .rt-folder-info span {
          font-size: 0.8rem;
          color: #64748b;
        }

        .rt-folder-arrow {
          color: #94a3b8;
        }

        .rt-folder-actions {
          display: flex;
          gap: 0.25rem;
          padding-right: 1rem;
        }

        .rt-action-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: #f1f5f9;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }

        .rt-action-btn:hover {
          background: #e2e8f0;
          color: #1e293b;
        }

        .rt-action-btn.rt-action-danger:hover {
          background: #fef2f2;
          color: #ef4444;
        }

        .rt-folder-edit {
          flex: 1;
          padding: 0.75rem 1.25rem;
        }

        /* Passages Grid */
        .rt-passages-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.25rem;
        }

        .rt-passage-card {
          position: relative;
          background: white;
          border-radius: 16px;
          padding: 1.25rem;
          transition: all 0.3s;
          animation: cardAppear 0.4s ease backwards;
          animation-delay: var(--card-delay);
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        }

        .rt-passage-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px var(--level-glow);
        }

        .rt-passage-card:hover .rt-passage-shine {
          transform: translateX(100%);
        }

        .rt-passage-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
          transition: transform 0.5s ease;
          pointer-events: none;
        }

        .rt-passage-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .rt-passage-badge {
          padding: 0.35rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
        }

        .rt-passage-count {
          font-size: 0.8rem;
          color: #64748b;
        }

        .rt-passage-title {
          margin: 0 0 0.5rem;
          font-size: 1.05rem;
          font-weight: 600;
          color: #1e293b;
          line-height: 1.4;
        }

        .rt-passage-preview {
          margin: 0 0 1rem;
          font-size: 0.875rem;
          color: #64748b;
          line-height: 1.6;
        }

        .rt-passage-actions {
          display: flex;
          gap: 0.5rem;
        }

        /* Empty State */
        .rt-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 3rem 2rem;
          background: white;
          border-radius: 16px;
          color: #94a3b8;
        }

        .rt-empty-wide {
          grid-column: 1 / -1;
        }

        .rt-empty h4 {
          margin: 1rem 0 0.5rem;
          color: #475569;
        }

        .rt-empty p {
          margin: 0;
          color: #94a3b8;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .reading-tab-pro {
            padding: 1rem;
          }

          .rt-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .rt-back-btn {
            width: 100%;
            justify-content: center;
          }

          .rt-actions {
            flex-direction: column;
          }

          .rt-btn {
            width: 100%;
            justify-content: center;
          }

          .rt-levels-grid,
          .rt-passages-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
