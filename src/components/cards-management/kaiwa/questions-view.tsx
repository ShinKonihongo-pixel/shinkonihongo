// Kaiwa Questions View - Question management with folder navigation

import { useState, useMemo } from 'react';
import { Search, Filter, ChevronRight, ChevronLeft, Edit2, Trash2, Plus, FolderOpen, MessageSquare } from 'lucide-react';
import { CONVERSATION_TOPICS, CONVERSATION_STYLES } from '../../../constants/kaiwa';
import { ConfirmModal } from '../../ui/confirm-modal';
import type {
  KaiwaDefaultQuestion,
  KaiwaFolder,
  KaiwaQuestionFormData,
  ConversationStyle,
  KaiwaNavState
} from '../cards-management-types';
import { KAIWA_LEVELS } from '../cards-management-types';

import type { JLPTLevel as KaiwaJLPTLevel, ConversationTopic } from '../../../types/kaiwa';

interface QuestionsViewProps {
  questions: KaiwaDefaultQuestion[];
  onAddQuestion?: (data: KaiwaQuestionFormData, createdBy?: string) => Promise<KaiwaDefaultQuestion>;
  onUpdateQuestion?: (id: string, data: Partial<KaiwaDefaultQuestion>) => Promise<void>;
  onDeleteQuestion?: (id: string) => Promise<void>;
  onAddFolder?: (name: string, level: KaiwaJLPTLevel, topic: ConversationTopic, createdBy?: string) => Promise<KaiwaFolder>;
  onUpdateFolder?: (id: string, data: Partial<KaiwaFolder>) => Promise<void>;
  onDeleteFolder?: (id: string) => Promise<void>;
  getFoldersByLevelAndTopic?: (level: KaiwaJLPTLevel, topic: ConversationTopic) => KaiwaFolder[];
  getQuestionsByFolder?: (folderId: string) => KaiwaDefaultQuestion[];
  currentUser: { id: string };
  isSuperAdmin: boolean;
}

export function QuestionsView({
  questions,
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
}: QuestionsViewProps) {
  // Navigation state
  const [navState, setNavState] = useState<KaiwaNavState>({ type: 'root' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterTopic, setFilterTopic] = useState<string>('all');

  // Form states
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [formData, setFormData] = useState<KaiwaQuestionFormData>({
    level: 'N5',
    topic: 'greetings',
    questionJa: '',
    questionVi: '',
    situationContext: '',
    suggestedAnswers: ['', ''],
    style: 'polite'
  });

  // Folder states
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');

  // Delete confirmation states
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<KaiwaFolder | null>(null);
  const [deleteQuestionTarget, setDeleteQuestionTarget] = useState<KaiwaDefaultQuestion | null>(null);

  // Permission helpers
  const canModifyQuestion = (q: KaiwaDefaultQuestion) => isSuperAdmin || q.createdBy === currentUser.id;
  const canModifyFolder = (f: KaiwaFolder) => isSuperAdmin || f.createdBy === currentUser.id;

  // Filter questions
  const filteredQuestions = useMemo(() => {
    let result = questions;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(q =>
        q.questionJa.toLowerCase().includes(query) ||
        (q.questionVi && q.questionVi.toLowerCase().includes(query)) ||
        (q.situationContext && q.situationContext.toLowerCase().includes(query))
      );
    }

    if (filterLevel !== 'all') {
      result = result.filter(q => q.level === filterLevel);
    }

    if (filterTopic !== 'all') {
      result = result.filter(q => q.topic === filterTopic);
    }

    return result;
  }, [questions, searchQuery, filterLevel, filterTopic]);

  // Navigation helpers
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

  const resetForm = () => setFormData({
    level: 'N5',
    topic: 'greetings',
    questionJa: '',
    questionVi: '',
    situationContext: '',
    suggestedAnswers: ['', ''],
    style: 'polite'
  });

  // Folder handlers
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

  // Question handlers
  const handleAddQuestion = async () => {
    if (!formData.questionJa.trim() || !onAddQuestion) return;
    const data = { ...formData };
    if (navState.type === 'topic') {
      data.level = navState.level;
      data.topic = navState.topic;
    } else if (navState.type === 'folder') {
      data.level = navState.level;
      data.topic = navState.topic;
      data.folderId = navState.folderId;
    }
    data.suggestedAnswers = data.suggestedAnswers?.filter(a => a.trim()) || [];
    await onAddQuestion(data, currentUser.id);
    resetForm();
    setIsAddingQuestion(false);
  };

  const handleEditQuestion = (q: KaiwaDefaultQuestion) => {
    setEditingQuestionId(q.id);
    setFormData({
      level: q.level,
      topic: q.topic,
      folderId: q.folderId,
      questionJa: q.questionJa,
      questionVi: q.questionVi || '',
      situationContext: q.situationContext || '',
      suggestedAnswers: q.suggestedAnswers?.length ? [...q.suggestedAnswers] : ['', ''],
      style: q.style
    });
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

  // Render question item
  const renderQuestionItem = (question: KaiwaDefaultQuestion) => (
    <div key={question.id} className="kaiwa-question-item">
      <div className="kaiwa-question-content">
        <div className="kaiwa-question-ja">{question.questionJa}</div>
        {question.questionVi && <div className="kaiwa-question-vi">{question.questionVi}</div>}
        <div className="kaiwa-question-meta">
          <span className="meta-badge level">{question.level}</span>
          <span className="meta-badge style">
            {question.style === 'casual' ? 'タメ口' : question.style === 'polite' ? 'です/ます' : '敬語'}
          </span>
          {question.situationContext && <span className="meta-context">{question.situationContext}</span>}
        </div>
        {question.suggestedAnswers && question.suggestedAnswers.length > 0 && (
          <div className="kaiwa-suggested-answers">
            <span className="answers-label">Gợi ý:</span>
            {question.suggestedAnswers.map((answer, idx) => (
              <span key={idx} className="answer-item">{answer}</span>
            ))}
          </div>
        )}
      </div>
      {canModifyQuestion(question) && (
        <div className="kaiwa-question-actions">
          <button className="btn-icon" onClick={() => handleEditQuestion(question)} title="Sửa">
            <Edit2 size={16} />
          </button>
          <button className="btn-icon danger" onClick={() => setDeleteQuestionTarget(question)} title="Xóa">
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );

  // Render question form
  const renderQuestionForm = () => (
    <div className="kaiwa-question-form">
      <div className="form-header">
        <h3>{editingQuestionId ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</h3>
      </div>

      <div className="form-grid">
        <div className="form-group full">
          <label>Câu hỏi (tiếng Nhật) <span className="required">*</span></label>
          <textarea
            value={formData.questionJa}
            onChange={(e) => setFormData({ ...formData, questionJa: e.target.value })}
            placeholder="Nhập câu hỏi tiếng Nhật..."
            rows={2}
          />
        </div>

        <div className="form-group full">
          <label>Dịch nghĩa (tiếng Việt)</label>
          <input
            type="text"
            value={formData.questionVi}
            onChange={(e) => setFormData({ ...formData, questionVi: e.target.value })}
            placeholder="Nhập dịch nghĩa..."
          />
        </div>

        <div className="form-group">
          <label>Cấp độ</label>
          <select
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value as typeof formData.level })}
            disabled={navState.type !== 'root'}
          >
            {KAIWA_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Chủ đề</label>
          <select
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value as typeof formData.topic })}
            disabled={navState.type !== 'root'}
          >
            {CONVERSATION_TOPICS.filter(t => t.value !== 'free').map(t => (
              <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Phong cách nói</label>
          <select
            value={formData.style}
            onChange={(e) => setFormData({ ...formData, style: e.target.value as ConversationStyle })}
          >
            {CONVERSATION_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Ngữ cảnh tình huống</label>
          <input
            type="text"
            value={formData.situationContext}
            onChange={(e) => setFormData({ ...formData, situationContext: e.target.value })}
            placeholder="Mô tả tình huống..."
          />
        </div>

        <div className="form-group full">
          <label>Gợi ý trả lời</label>
          <div className="suggested-answers-list">
            {(formData.suggestedAnswers || []).map((answer, idx) => (
              <div key={idx} className="suggested-answer-row">
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => handleSuggestedAnswerChange(idx, e.target.value)}
                  placeholder={`Gợi ý ${idx + 1}...`}
                />
                <button
                  type="button"
                  className="btn-icon danger"
                  onClick={() => setFormData({
                    ...formData,
                    suggestedAnswers: (formData.suggestedAnswers || []).filter((_, i) => i !== idx)
                  })}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => setFormData({
                ...formData,
                suggestedAnswers: [...(formData.suggestedAnswers || []), '']
              })}
            >
              <Plus size={14} /> Thêm gợi ý
            </button>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button className="btn btn-primary" onClick={editingQuestionId ? handleUpdateQuestion : handleAddQuestion}>
          {editingQuestionId ? 'Cập nhật' : 'Thêm câu hỏi'}
        </button>
        <button className="btn btn-secondary" onClick={() => {
          resetForm();
          setIsAddingQuestion(false);
          setEditingQuestionId(null);
        }}>
          Hủy
        </button>
      </div>
    </div>
  );

  return (
    <div className="kaiwa-questions-tab">
      {/* Search & Filter Bar */}
      <div className="questions-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm câu hỏi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={18} />
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
            <option value="all">Tất cả cấp độ</option>
            {KAIWA_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)}>
            <option value="all">Tất cả chủ đề</option>
            {CONVERSATION_TOPICS.filter(t => t.value !== 'free').map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="breadcrumb">
        {getBreadcrumb().map((crumb, idx) => (
          <span key={idx}>
            {idx > 0 && <ChevronRight size={14} />}
            <span
              className={idx === getBreadcrumb().length - 1 ? 'current' : 'clickable'}
              onClick={() => idx === 0 && setNavState({ type: 'root' })}
            >
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {navState.type !== 'root' && (
        <button className="btn btn-back" onClick={goBack}>
          <ChevronLeft size={16} /> Quay lại
        </button>
      )}

      {/* Root Level - Show all levels */}
      {navState.type === 'root' && !searchQuery && filterLevel === 'all' && filterTopic === 'all' && (
        <div className="level-grid">
          {KAIWA_LEVELS.map(level => (
            <div
              key={level}
              className={`level-card level-${level.toLowerCase()}`}
              onClick={() => setNavState({ type: 'level', level })}
            >
              <span className="level-badge">{level}</span>
              <span className="level-count">{getQuestionCountByLevel(level)} câu hỏi</span>
              <ChevronRight size={20} className="level-arrow" />
            </div>
          ))}
        </div>
      )}

      {/* Level View - Show topics */}
      {navState.type === 'level' && (
        <div className="category-grid">
          {CONVERSATION_TOPICS.filter(t => t.value !== 'free').map(topic => (
            <div
              key={topic.value}
              className="category-card"
              onClick={() => setNavState({
                type: 'topic',
                level: navState.level,
                topic: topic.value,
                topicLabel: topic.label
              })}
            >
              <span className="category-icon">{topic.icon}</span>
              <span className="category-name">{topic.label}</span>
              <span className="category-count">{getQuestionCountByTopic(navState.level, topic.value)} câu</span>
            </div>
          ))}
        </div>
      )}

      {/* Topic View - Show folders and questions */}
      {navState.type === 'topic' && (
        <div className="folder-view">
          <div className="folder-actions">
            <button className="btn btn-secondary" onClick={() => setIsAddingFolder(true)}>
              <FolderOpen size={16} /> Tạo thư mục
            </button>
            {!topicHasFolders() && (
              <button className="btn btn-primary" onClick={() => setIsAddingQuestion(true)}>
                <Plus size={16} /> Tạo câu hỏi
              </button>
            )}
          </div>

          {isAddingFolder && (
            <div className="add-folder-inline">
              <input
                type="text"
                placeholder="Tên thư mục..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddFolder();
                  if (e.key === 'Escape') { setIsAddingFolder(false); setNewFolderName(''); }
                }}
                autoFocus
              />
              <button className="btn btn-primary btn-small" onClick={handleAddFolder}>Thêm</button>
              <button className="btn btn-secondary btn-small" onClick={() => {
                setIsAddingFolder(false);
                setNewFolderName('');
              }}>Hủy</button>
            </div>
          )}

          {getFoldersForCurrentView().length > 0 && (
            <div className="folder-list">
              {getFoldersForCurrentView().map(folder => (
                <div key={folder.id} className="folder-item">
                  {editingFolderId === folder.id ? (
                    <div className="folder-edit">
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
                      <button className="btn btn-primary btn-small" onClick={() => handleUpdateFolder(folder.id)}>Lưu</button>
                      <button className="btn btn-secondary btn-small" onClick={() => {
                        setEditingFolderId(null);
                        setEditingFolderName('');
                      }}>Hủy</button>
                    </div>
                  ) : (
                    <>
                      <div
                        className="folder-info"
                        onClick={() => setNavState({
                          type: 'folder',
                          level: navState.level,
                          topic: navState.topic,
                          topicLabel: navState.topicLabel,
                          folderId: folder.id,
                          folderName: folder.name
                        })}
                      >
                        <FolderOpen size={18} className="folder-icon" />
                        <span className="folder-name">{folder.name}</span>
                        <span className="folder-count">{getQuestionCountByFolder(folder.id)} câu</span>
                        <ChevronRight size={16} />
                      </div>
                      {canModifyFolder(folder) && (
                        <div className="folder-actions-inline">
                          <button
                            className="btn-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFolderId(folder.id);
                              setEditingFolderName(folder.name);
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn-icon danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteFolderTarget(folder);
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {!topicHasFolders() && getQuestionsForCurrentView().length > 0 && (
            <div className="kaiwa-questions-list">
              {getQuestionsForCurrentView().map(renderQuestionItem)}
            </div>
          )}
        </div>
      )}

      {/* Folder View - Show questions in folder */}
      {navState.type === 'folder' && (
        <div className="folder-view">
          <div className="folder-actions">
            <button className="btn btn-primary" onClick={() => setIsAddingQuestion(true)}>
              <Plus size={16} /> Tạo câu hỏi
            </button>
          </div>
          <div className="kaiwa-questions-list">
            {getQuestionsForCurrentView().map(renderQuestionItem)}
          </div>
          {getQuestionsForCurrentView().length === 0 && (
            <div className="empty-state">
              <MessageSquare size={48} />
              <p>Chưa có câu hỏi nào trong thư mục này</p>
            </div>
          )}
        </div>
      )}

      {/* Filtered Results */}
      {(searchQuery || filterLevel !== 'all' || filterTopic !== 'all') && navState.type === 'root' && (
        <div className="filtered-results">
          <p className="results-count">Tìm thấy {filteredQuestions.length} câu hỏi</p>
          <div className="kaiwa-questions-list">
            {filteredQuestions.map(renderQuestionItem)}
          </div>
        </div>
      )}

      {/* Question Form Modal */}
      {(isAddingQuestion || editingQuestionId) && renderQuestionForm()}

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={deleteFolderTarget !== null}
        title="Xác nhận xóa thư mục"
        message={`Xóa thư mục "${deleteFolderTarget?.name || ''}"? Tất cả câu hỏi bên trong cũng sẽ bị xóa.`}
        confirmText="Xóa"
        onConfirm={async () => {
          if (deleteFolderTarget && onDeleteFolder) {
            await onDeleteFolder(deleteFolderTarget.id);
            setDeleteFolderTarget(null);
          }
        }}
        onCancel={() => setDeleteFolderTarget(null)}
      />

      <ConfirmModal
        isOpen={deleteQuestionTarget !== null}
        title="Xác nhận xóa câu hỏi"
        message="Bạn có chắc muốn xóa câu hỏi này?"
        confirmText="Xóa"
        onConfirm={async () => {
          if (deleteQuestionTarget && onDeleteQuestion) {
            await onDeleteQuestion(deleteQuestionTarget.id);
            setDeleteQuestionTarget(null);
          }
        }}
        onCancel={() => setDeleteQuestionTarget(null)}
      />
    </div>
  );
}
