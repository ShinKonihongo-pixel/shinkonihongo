// Kaiwa Questions Management Tab - Kaiwa conversation questions management

import { useState } from 'react';
import { CONVERSATION_TOPICS, CONVERSATION_STYLES } from '../../constants/kaiwa';
import { ConfirmModal } from '../ui/confirm-modal';
import type { KaiwaTabProps, KaiwaNavState, KaiwaDefaultQuestion, KaiwaFolder, KaiwaQuestionFormData, ConversationStyle } from './cards-management-types';
import { KAIWA_LEVELS } from './cards-management-types';

export function KaiwaTab({
  questions,
  folders: _folders,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onAddFolder,
  onUpdateFolder,
  onDeleteFolder,
  getFoldersByLevelAndTopic,
  getQuestionsByFolder,
  currentUser,
  isSuperAdmin,
}: KaiwaTabProps) {
  const [navState, setNavState] = useState<KaiwaNavState>({ type: 'root' });
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [formData, setFormData] = useState<KaiwaQuestionFormData>({ level: 'N5', topic: 'greetings', questionJa: '', questionVi: '', situationContext: '', suggestedAnswers: ['', ''], style: 'polite' });
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<KaiwaFolder | null>(null);
  const [deleteQuestionTarget, setDeleteQuestionTarget] = useState<KaiwaDefaultQuestion | null>(null);

  const canModifyQuestion = (q: KaiwaDefaultQuestion) => isSuperAdmin || q.createdBy === currentUser.id;
  const canModifyFolder = (f: KaiwaFolder) => isSuperAdmin || f.createdBy === currentUser.id;

  const getQuestionCountByLevel = (level: string) => questions.filter(q => q.level === level).length;
  const getQuestionCountByTopic = (level: string, topic: string) => questions.filter(q => q.level === level && q.topic === topic).length;
  const getQuestionCountByFolder = (folderId: string) => questions.filter(q => q.folderId === folderId).length;

  const getQuestionsForCurrentView = (): KaiwaDefaultQuestion[] => {
    if (navState.type === 'folder' && getQuestionsByFolder) return getQuestionsByFolder(navState.folderId);
    if (navState.type === 'topic' && getFoldersByLevelAndTopic) {
      const folders = getFoldersByLevelAndTopic(navState.level, navState.topic);
      if (folders.length === 0) return questions.filter(q => q.level === navState.level && q.topic === navState.topic && !q.folderId);
    }
    return [];
  };

  const getFoldersForCurrentView = (): KaiwaFolder[] => {
    if (navState.type !== 'topic' || !getFoldersByLevelAndTopic) return [];
    return getFoldersByLevelAndTopic(navState.level, navState.topic);
  };

  const topicHasFolders = () => navState.type === 'topic' && getFoldersByLevelAndTopic && getFoldersByLevelAndTopic(navState.level, navState.topic).length > 0;

  const getBreadcrumb = (): string[] => {
    const crumbs: string[] = ['Tất cả'];
    if (navState.type === 'level') crumbs.push(navState.level);
    if (navState.type === 'topic') crumbs.push(navState.level, navState.topicLabel);
    if (navState.type === 'folder') crumbs.push(navState.level, navState.topicLabel, navState.folderName);
    return crumbs;
  };

  const goBack = () => {
    if (navState.type === 'level') setNavState({ type: 'root' });
    else if (navState.type === 'topic') setNavState({ type: 'level', level: navState.level });
    else if (navState.type === 'folder') setNavState({ type: 'topic', level: navState.level, topic: navState.topic, topicLabel: navState.topicLabel });
    setIsAddingQuestion(false);
    setEditingQuestionId(null);
  };

  const resetForm = () => setFormData({ level: 'N5', topic: 'greetings', questionJa: '', questionVi: '', situationContext: '', suggestedAnswers: ['', ''], style: 'polite' });

  const handleAddFolder = async () => {
    if (!newFolderName.trim() || navState.type !== 'topic' || !onAddFolder) return;
    await onAddFolder(newFolderName.trim(), navState.level, navState.topic, currentUser.id);
    setNewFolderName('');
    setIsAddingFolder(false);
  };

  const handleUpdateFolder = async (id: string) => {
    if (editingFolderName.trim() && onUpdateFolder) {
      await onUpdateFolder(id, { name: editingFolderName.trim() });
      setEditingFolderId(null);
      setEditingFolderName('');
    }
  };

  const handleAddQuestion = async () => {
    if (!formData.questionJa.trim() || !onAddQuestion) return;
    const data = { ...formData };
    if (navState.type === 'topic') { data.level = navState.level; data.topic = navState.topic; }
    else if (navState.type === 'folder') { data.level = navState.level; data.topic = navState.topic; data.folderId = navState.folderId; }
    data.suggestedAnswers = data.suggestedAnswers?.filter(a => a.trim()) || [];
    await onAddQuestion(data, currentUser.id);
    resetForm();
    setIsAddingQuestion(false);
  };

  const handleEditQuestion = (q: KaiwaDefaultQuestion) => {
    setEditingQuestionId(q.id);
    setFormData({ level: q.level, topic: q.topic, folderId: q.folderId, questionJa: q.questionJa, questionVi: q.questionVi || '', situationContext: q.situationContext || '', suggestedAnswers: q.suggestedAnswers?.length ? [...q.suggestedAnswers] : ['', ''], style: q.style });
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestionId || !onUpdateQuestion) return;
    const data = { ...formData };
    data.suggestedAnswers = data.suggestedAnswers?.filter(a => a.trim()) || [];
    await onUpdateQuestion(editingQuestionId, data);
    resetForm();
    setEditingQuestionId(null);
  };

  const handleSuggestedAnswerChange = (idx: number, value: string) => {
    const newAnswers = [...(formData.suggestedAnswers || ['', ''])];
    newAnswers[idx] = value;
    setFormData({ ...formData, suggestedAnswers: newAnswers });
  };

  const breadcrumb = getBreadcrumb();

  const renderQuestionItem = (question: KaiwaDefaultQuestion) => (
    <div key={question.id} className="kaiwa-question-item">
      <div className="kaiwa-question-content">
        <div className="kaiwa-question-ja">{question.questionJa}</div>
        {question.questionVi && <div className="kaiwa-question-vi">{question.questionVi}</div>}
        <div className="kaiwa-question-meta">
          <span className="meta-badge">{question.style === 'casual' ? 'タメ口' : question.style === 'polite' ? 'です/ます' : '敬語'}</span>
          {question.situationContext && <span className="meta-context">{question.situationContext}</span>}
        </div>
        {question.suggestedAnswers && question.suggestedAnswers.length > 0 && (
          <div className="kaiwa-suggested-answers">
            <span className="answers-label">Gợi ý trả lời:</span>
            {question.suggestedAnswers.map((answer, idx) => <span key={idx} className="answer-item">{answer}</span>)}
          </div>
        )}
      </div>
      {canModifyQuestion(question) && (
        <div className="kaiwa-question-actions">
          <button className="btn btn-small" onClick={() => handleEditQuestion(question)}>Sửa</button>
          <button className="btn btn-danger btn-small" onClick={() => setDeleteQuestionTarget(question)}>Xóa</button>
        </div>
      )}
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

      {navState.type === 'root' && (
        <div className="level-grid">
          {KAIWA_LEVELS.map(level => (
            <div key={level} className="level-card" onClick={() => setNavState({ type: 'level', level })}>
              <span className="level-name">{level}</span>
              <span className="level-count">{getQuestionCountByLevel(level)} câu</span>
            </div>
          ))}
        </div>
      )}

      {navState.type === 'level' && (
        <div className="category-grid">
          {CONVERSATION_TOPICS.filter(t => t.value !== 'free').map(topic => (
            <div key={topic.value} className="category-card" onClick={() => setNavState({ type: 'topic', level: navState.level, topic: topic.value, topicLabel: topic.label })}>
              <span className="category-icon">{topic.icon}</span>
              <span className="category-name">{topic.label}</span>
              <span className="category-count">{getQuestionCountByTopic(navState.level, topic.value)} câu</span>
            </div>
          ))}
        </div>
      )}

      {navState.type === 'topic' && (
        <div className="folder-view">
          <div className="folder-actions">
            <button className="btn btn-secondary" onClick={() => setIsAddingFolder(true)}>+ Tạo thư mục</button>
            {!topicHasFolders() && <button className="btn btn-primary" onClick={() => setIsAddingQuestion(true)}>+ Tạo câu hỏi</button>}
          </div>

          {isAddingFolder && (
            <div className="add-category-inline">
              <input type="text" className="category-input" placeholder="Tên thư mục..." value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddFolder(); if (e.key === 'Escape') { setIsAddingFolder(false); setNewFolderName(''); } }} autoFocus />
              <button className="btn btn-primary btn-small" onClick={handleAddFolder}>Thêm</button>
              <button className="btn btn-secondary btn-small" onClick={() => { setIsAddingFolder(false); setNewFolderName(''); }}>Hủy</button>
            </div>
          )}

          {getFoldersForCurrentView().length > 0 && (
            <div className="folder-list">
              {getFoldersForCurrentView().map(folder => (
                <div key={folder.id} className="folder-item">
                  {editingFolderId === folder.id ? (
                    <div className="folder-edit">
                      <input type="text" value={editingFolderName} onChange={(e) => setEditingFolderName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateFolder(folder.id); if (e.key === 'Escape') { setEditingFolderId(null); setEditingFolderName(''); } }} autoFocus />
                      <button className="btn btn-primary btn-small" onClick={() => handleUpdateFolder(folder.id)}>Lưu</button>
                      <button className="btn btn-secondary btn-small" onClick={() => { setEditingFolderId(null); setEditingFolderName(''); }}>Hủy</button>
                    </div>
                  ) : (
                    <>
                      <div className="folder-info" onClick={() => setNavState({ type: 'folder', level: navState.level, topic: navState.topic, topicLabel: navState.topicLabel, folderId: folder.id, folderName: folder.name })}>
                        <span className="folder-icon">📁</span>
                        <span className="folder-name">{folder.name}</span>
                        <span className="folder-count">{getQuestionCountByFolder(folder.id)} câu</span>
                      </div>
                      {canModifyFolder(folder) && (
                        <div className="folder-actions-inline">
                          <button className="btn btn-small" onClick={(e) => { e.stopPropagation(); setEditingFolderId(folder.id); setEditingFolderName(folder.name); }}>Sửa</button>
                          <button className="btn btn-danger btn-small" onClick={(e) => { e.stopPropagation(); setDeleteFolderTarget(folder); }}>Xóa</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {!topicHasFolders() && getQuestionsForCurrentView().length > 0 && (
            <div className="kaiwa-questions-list">{getQuestionsForCurrentView().map(renderQuestionItem)}</div>
          )}
        </div>
      )}

      {navState.type === 'folder' && (
        <div className="folder-view">
          <div className="folder-actions">
            <button className="btn btn-primary" onClick={() => setIsAddingQuestion(true)}>+ Tạo câu hỏi</button>
          </div>
          <div className="kaiwa-questions-list">{getQuestionsForCurrentView().map(renderQuestionItem)}</div>
        </div>
      )}

      {(isAddingQuestion || editingQuestionId) && (
        <div className="kaiwa-question-form">
          <h3>{editingQuestionId ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</h3>
          <div className="form-group">
            <label>Câu hỏi (tiếng Nhật) *</label>
            <textarea value={formData.questionJa} onChange={(e) => setFormData({ ...formData, questionJa: e.target.value })} placeholder="Nhập câu hỏi tiếng Nhật..." rows={2} />
          </div>
          <div className="form-group">
            <label>Dịch nghĩa (tiếng Việt)</label>
            <input type="text" value={formData.questionVi} onChange={(e) => setFormData({ ...formData, questionVi: e.target.value })} placeholder="Nhập dịch nghĩa..." />
          </div>
          <div className="form-group">
            <label>Ngữ cảnh tình huống</label>
            <input type="text" value={formData.situationContext} onChange={(e) => setFormData({ ...formData, situationContext: e.target.value })} placeholder="Mô tả tình huống..." />
          </div>
          <div className="form-group">
            <label>Phong cách nói</label>
            <select value={formData.style} onChange={(e) => setFormData({ ...formData, style: e.target.value as ConversationStyle })}>
              {CONVERSATION_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Gợi ý trả lời</label>
            {(formData.suggestedAnswers || []).map((answer, idx) => (
              <div key={idx} className="suggested-answer-row">
                <input type="text" value={answer} onChange={(e) => handleSuggestedAnswerChange(idx, e.target.value)} placeholder={`Gợi ý ${idx + 1}...`} />
                <button type="button" className="btn btn-danger btn-small" onClick={() => setFormData({ ...formData, suggestedAnswers: (formData.suggestedAnswers || []).filter((_, i) => i !== idx) })}>×</button>
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-small" onClick={() => setFormData({ ...formData, suggestedAnswers: [...(formData.suggestedAnswers || []), ''] })}>+ Thêm gợi ý</button>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={editingQuestionId ? handleUpdateQuestion : handleAddQuestion}>{editingQuestionId ? 'Cập nhật' : 'Thêm'}</button>
            <button className="btn btn-secondary" onClick={() => { resetForm(); setIsAddingQuestion(false); setEditingQuestionId(null); }}>Hủy</button>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={deleteFolderTarget !== null} title="Xác nhận xóa thư mục" message={`Xóa thư mục "${deleteFolderTarget?.name || ''}"? Tất cả câu hỏi bên trong cũng sẽ bị xóa.`} confirmText="Xóa" onConfirm={async () => { if (deleteFolderTarget && onDeleteFolder) { await onDeleteFolder(deleteFolderTarget.id); setDeleteFolderTarget(null); } }} onCancel={() => setDeleteFolderTarget(null)} />
      <ConfirmModal isOpen={deleteQuestionTarget !== null} title="Xác nhận xóa câu hỏi" message="Bạn có chắc muốn xóa câu hỏi này?" confirmText="Xóa" onConfirm={async () => { if (deleteQuestionTarget && onDeleteQuestion) { await onDeleteQuestion(deleteQuestionTarget.id); setDeleteQuestionTarget(null); } }} onCancel={() => setDeleteQuestionTarget(null)} />
    </div>
  );
}
