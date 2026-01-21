// JLPT Questions Management Tab - JLPT question folder navigation and CRUD

import { useState } from 'react';
import { ConfirmModal } from '../ui/confirm-modal';
import type { JLPTTabProps, JLPTNavState, JLPTQuestion, JLPTFolder, JLPTQuestionFormData } from './cards-management-types';
import { JLPT_QUESTION_LEVELS, QUESTION_CATEGORIES, defaultAnswers } from './cards-management-types';

export function JLPTTab({
  questions,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onAddFolder,
  onUpdateFolder,
  onDeleteFolder,
  getFoldersByLevelAndCategory,
  getQuestionsByFolder,
  currentUser,
  isSuperAdmin,
}: JLPTTabProps) {
  const [navState, setNavState] = useState<JLPTNavState>({ type: 'root' });
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [formData, setFormData] = useState<JLPTQuestionFormData>({ level: 'N5', category: 'vocabulary', question: '', answers: [...defaultAnswers], explanation: '' });
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<JLPTFolder | null>(null);
  const [deleteQuestionTarget, setDeleteQuestionTarget] = useState<JLPTQuestion | null>(null);

  const canModifyQuestion = (q: JLPTQuestion) => isSuperAdmin || q.createdBy === currentUser.id;
  const canModifyFolder = (f: JLPTFolder) => isSuperAdmin || f.createdBy === currentUser.id;

  const getQuestionCountByLevel = (level: string) => questions.filter(q => q.level === level).length;
  const getQuestionCountByCategory = (level: string, category: string) => questions.filter(q => q.level === level && q.category === category).length;
  const getQuestionCountByFolder = (folderId: string) => questions.filter(q => q.folderId === folderId).length;

  const getQuestionsForCurrentView = (): JLPTQuestion[] => {
    if (navState.type === 'folder') return getQuestionsByFolder(navState.folderId);
    if (navState.type === 'category') {
      const folders = getFoldersByLevelAndCategory(navState.level, navState.category);
      if (folders.length === 0) return questions.filter(q => q.level === navState.level && q.category === navState.category && !q.folderId);
    }
    return [];
  };

  const getFoldersForCurrentView = (): JLPTFolder[] => {
    if (navState.type !== 'category') return [];
    return getFoldersByLevelAndCategory(navState.level, navState.category);
  };

  const categoryHasFolders = () => navState.type === 'category' && getFoldersByLevelAndCategory(navState.level, navState.category).length > 0;

  const getBreadcrumb = (): string[] => {
    const crumbs: string[] = ['Tất cả'];
    if (navState.type === 'level') crumbs.push(navState.level);
    if (navState.type === 'category') crumbs.push(navState.level, navState.categoryLabel);
    if (navState.type === 'folder') crumbs.push(navState.level, navState.categoryLabel, navState.folderName);
    return crumbs;
  };

  const goBack = () => {
    if (navState.type === 'level') setNavState({ type: 'root' });
    else if (navState.type === 'category') setNavState({ type: 'level', level: navState.level });
    else if (navState.type === 'folder') setNavState({ type: 'category', level: navState.level, category: navState.category, categoryLabel: navState.categoryLabel });
    setIsAddingQuestion(false);
    setEditingQuestionId(null);
    setIsAddingFolder(false);
  };

  const resetForm = () => setFormData({ level: 'N5', category: 'vocabulary', question: '', answers: [...defaultAnswers], explanation: '' });

  const handleAddFolder = async () => {
    if (!newFolderName.trim() || navState.type !== 'category') return;
    await onAddFolder(newFolderName.trim(), navState.level, navState.category);
    setNewFolderName('');
    setIsAddingFolder(false);
  };

  const handleUpdateFolder = async (id: string) => {
    if (editingFolderName.trim()) {
      await onUpdateFolder(id, { name: editingFolderName.trim() });
      setEditingFolderId(null);
      setEditingFolderName('');
    }
  };

  const handleAddQuestion = async () => {
    if (!formData.question.trim() || formData.answers.some(a => !a.text.trim())) return;
    await onAddQuestion(formData);
    resetForm();
    setIsAddingQuestion(false);
  };

  const handleEditQuestion = (q: JLPTQuestion) => {
    setEditingQuestionId(q.id);
    setFormData({ level: q.level, category: q.category, question: q.question, answers: [...q.answers], explanation: q.explanation || '' });
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestionId) return;
    await onUpdateQuestion(editingQuestionId, formData);
    resetForm();
    setEditingQuestionId(null);
  };

  const handleAnswerChange = (index: number, text: string) => {
    const newAnswers = [...formData.answers];
    newAnswers[index] = { ...newAnswers[index], text };
    setFormData({ ...formData, answers: newAnswers });
  };

  const handleCorrectAnswerChange = (index: number) => {
    const newAnswers = formData.answers.map((a, i) => ({ ...a, isCorrect: i === index }));
    setFormData({ ...formData, answers: newAnswers });
  };

  const breadcrumb = getBreadcrumb();

  const renderQuestionCard = (question: JLPTQuestion) => (
    <div key={question.id} className="question-card">
      <div className="question-header">
        {canModifyQuestion(question) && (
          <div className="question-actions">
            <button className="btn-icon" onClick={() => handleEditQuestion(question)} title="Sửa">✎</button>
            <button className="btn-icon danger" onClick={() => setDeleteQuestionTarget(question)} title="Xóa">×</button>
          </div>
        )}
      </div>
      <div className="question-content">
        <p className="question-text">{question.question}</p>
        <div className="question-answers">
          {question.answers.map((answer, index) => (
            <div key={index} className={`answer-item ${answer.isCorrect ? 'correct' : ''}`}>
              <span className="answer-letter">{String.fromCharCode(65 + index)}.</span>
              <span className="answer-text">{answer.text}</span>
              {answer.isCorrect && <span className="correct-mark">✓</span>}
            </div>
          ))}
        </div>
        {question.explanation && <div className="question-explanation"><strong>Giải thích:</strong> {question.explanation}</div>}
      </div>
    </div>
  );

  return (
    <div className="jlpt-management">
      <div className="breadcrumb">
        {breadcrumb.map((crumb, idx) => (
          <span key={idx}>{idx > 0 && ' / '}<span className={idx === breadcrumb.length - 1 ? 'current' : 'clickable'} onClick={() => idx === 0 && setNavState({ type: 'root' })}>{crumb}</span></span>
        ))}
      </div>

      {navState.type !== 'root' && <button className="btn btn-back" onClick={goBack}>← Quay lại</button>}

      {isAddingFolder && navState.type === 'category' && (
        <div className="add-category-inline">
          <input type="text" className="category-input" placeholder="Tên thư mục..." value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddFolder(); if (e.key === 'Escape') { setIsAddingFolder(false); setNewFolderName(''); } }} autoFocus />
          <button className="btn btn-primary" onClick={handleAddFolder}>Lưu</button>
          <button className="btn btn-cancel" onClick={() => { setIsAddingFolder(false); setNewFolderName(''); }}>Hủy</button>
        </div>
      )}

      {(isAddingQuestion || editingQuestionId) && (navState.type === 'category' || navState.type === 'folder') && (
        <div className="jlpt-form">
          <h3>{editingQuestionId ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</h3>
          <div className="form-group">
            <label>Câu hỏi</label>
            <textarea value={formData.question} onChange={(e) => setFormData({ ...formData, question: e.target.value })} placeholder="Nhập nội dung câu hỏi..." rows={3} />
          </div>
          <div className="form-group">
            <label>Đáp án (chọn đáp án đúng)</label>
            <div className="answers-grid">
              {formData.answers.map((answer, index) => (
                <div key={index} className="answer-input-row">
                  <input type="radio" name="correctAnswer" checked={answer.isCorrect} onChange={() => handleCorrectAnswerChange(index)} />
                  <input type="text" value={answer.text} onChange={(e) => handleAnswerChange(index, e.target.value)} placeholder={`Đáp án ${index + 1}`} className={answer.isCorrect ? 'correct-answer' : ''} />
                </div>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Giải thích (không bắt buộc)</label>
            <textarea value={formData.explanation} onChange={(e) => setFormData({ ...formData, explanation: e.target.value })} placeholder="Giải thích đáp án đúng..." rows={2} />
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => { resetForm(); setIsAddingQuestion(false); setEditingQuestionId(null); }}>Hủy</button>
            <button className="btn btn-primary" onClick={editingQuestionId ? handleUpdateQuestion : handleAddQuestion}>{editingQuestionId ? 'Cập nhật' : 'Thêm'}</button>
          </div>
        </div>
      )}

      {!isAddingQuestion && !editingQuestionId && (
        <div className="folder-content">
          {navState.type === 'root' && (
            <div className="folder-list">
              {JLPT_QUESTION_LEVELS.map(level => (
                <div key={level} className="folder-item" onClick={() => setNavState({ type: 'level', level })}>
                  <span className="folder-icon">📁</span>
                  <span className="folder-name">{level}</span>
                  <span className="folder-count">({getQuestionCountByLevel(level)} câu hỏi)</span>
                </div>
              ))}
            </div>
          )}

          {navState.type === 'level' && (
            <div className="folder-list">
              {QUESTION_CATEGORIES.map(cat => (
                <div key={cat.value} className="folder-item" onClick={() => setNavState({ type: 'category', level: navState.level, category: cat.value, categoryLabel: cat.label })}>
                  <span className="folder-icon">📂</span>
                  <span className="folder-name">{cat.label}</span>
                  <span className="folder-count">({getQuestionCountByCategory(navState.level, cat.value)} câu hỏi)</span>
                </div>
              ))}
            </div>
          )}

          {navState.type === 'category' && (
            <>
              {!isAddingFolder && (
                <div className="folder-actions">
                  <button className="btn btn-secondary" onClick={() => setIsAddingFolder(true)}>+ Thêm thư mục</button>
                  {!categoryHasFolders() && (
                    <button className="btn btn-primary" onClick={() => { setFormData({ ...formData, level: navState.level, category: navState.category, folderId: undefined }); setIsAddingQuestion(true); }}>+ Thêm câu hỏi</button>
                  )}
                </div>
              )}

              {getFoldersForCurrentView().length > 0 && (
                <div className="folder-list">
                  {getFoldersForCurrentView().map(folder => (
                    <div key={folder.id} className="folder-item" onClick={() => setNavState({ type: 'folder', level: navState.level, category: navState.category, categoryLabel: navState.categoryLabel, folderId: folder.id, folderName: folder.name })}>
                      <span className="folder-icon">📄</span>
                      {editingFolderId === folder.id ? (
                        <input type="text" className="edit-input inline" value={editingFolderName} onChange={(e) => setEditingFolderName(e.target.value)} onBlur={() => handleUpdateFolder(folder.id)} onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateFolder(folder.id); if (e.key === 'Escape') { setEditingFolderId(null); setEditingFolderName(''); } }} onClick={(e) => e.stopPropagation()} autoFocus />
                      ) : (
                        <span className="folder-name" onDoubleClick={(e) => { e.stopPropagation(); setEditingFolderId(folder.id); setEditingFolderName(folder.name); }}>{folder.name}</span>
                      )}
                      <span className="folder-count">({getQuestionCountByFolder(folder.id)} câu hỏi)</span>
                      {canModifyFolder(folder) && (
                        <>
                          <button className="edit-btn" onClick={(e) => { e.stopPropagation(); setEditingFolderId(folder.id); setEditingFolderName(folder.name); }} title="Sửa tên">✎</button>
                          <button className="delete-btn" onClick={(e) => { e.stopPropagation(); setDeleteFolderTarget(folder); }} title="Xóa">×</button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!categoryHasFolders() && (
                <div className="questions-list">
                  {getQuestionsForCurrentView().length === 0 ? (
                    <div className="empty-message">Chưa có câu hỏi nào. Tạo thư mục hoặc thêm câu hỏi trực tiếp.</div>
                  ) : getQuestionsForCurrentView().map(renderQuestionCard)}
                </div>
              )}
            </>
          )}

          {navState.type === 'folder' && (
            <>
              <div className="folder-actions">
                <button className="btn btn-primary" onClick={() => { setFormData({ ...formData, level: navState.level, category: navState.category, folderId: navState.folderId }); setIsAddingQuestion(true); }}>+ Thêm câu hỏi</button>
              </div>
              <div className="questions-list">
                {getQuestionsForCurrentView().length === 0 ? (
                  <div className="empty-message">Chưa có câu hỏi nào. Nhấn "+ Thêm câu hỏi" để thêm.</div>
                ) : getQuestionsForCurrentView().map(renderQuestionCard)}
              </div>
            </>
          )}
        </div>
      )}

      <ConfirmModal isOpen={deleteFolderTarget !== null} title="Xác nhận xóa thư mục" message={`Xóa thư mục "${deleteFolderTarget?.name || ''}"? Tất cả câu hỏi bên trong cũng sẽ bị xóa.`} confirmText="Xóa" onConfirm={() => { if (deleteFolderTarget) { onDeleteFolder(deleteFolderTarget.id); setDeleteFolderTarget(null); } }} onCancel={() => setDeleteFolderTarget(null)} />
      <ConfirmModal isOpen={deleteQuestionTarget !== null} title="Xác nhận xóa câu hỏi" message={`Xóa câu hỏi "${deleteQuestionTarget?.question?.slice(0, 50) || ''}..."?`} confirmText="Xóa" onConfirm={async () => { if (deleteQuestionTarget) { await onDeleteQuestion(deleteQuestionTarget.id); setDeleteQuestionTarget(null); } }} onCancel={() => setDeleteQuestionTarget(null)} />
    </div>
  );
}
