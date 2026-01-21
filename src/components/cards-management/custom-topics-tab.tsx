// Custom Topics Management Tab - 題材拡張管理
// Professional UI for creating and managing custom question sets beyond JLPT

import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, FolderPlus, FileQuestion, ArrowLeft, Search, Grid, List, Download, Upload, Settings, Eye, EyeOff, Star } from 'lucide-react';
import { ConfirmModal } from '../ui/confirm-modal';
import type {
  CustomTopic,
  CustomTopicFolder,
  CustomTopicQuestion,
  CustomTopicFormData,
  CustomTopicQuestionFormData,
  TopicDifficulty,
} from '../../types/custom-topic';
import {
  TOPIC_ICONS,
  TOPIC_COLORS,
  TOPIC_TEMPLATES,
  DIFFICULTY_LABELS,
  DEFAULT_TOPIC_FORM,
  DEFAULT_QUESTION_FORM,
} from '../../types/custom-topic';
import type { CurrentUser } from '../../types/user';

// Navigation state types
type ViewMode = 'grid' | 'list';
type NavType = 'topics' | 'topic-detail' | 'folder-detail';

interface NavState {
  type: NavType;
  topicId?: string;
  folderId?: string;
}

interface CustomTopicsTabProps {
  topics: CustomTopic[];
  folders: CustomTopicFolder[];
  questions: CustomTopicQuestion[];
  currentUser: CurrentUser;
  isSuperAdmin: boolean;
  // Topic CRUD
  onAddTopic: (data: CustomTopicFormData) => Promise<CustomTopic | null>;
  onUpdateTopic: (id: string, data: Partial<CustomTopicFormData>) => Promise<boolean>;
  onDeleteTopic: (id: string) => Promise<boolean>;
  // Folder CRUD
  onAddFolder: (topicId: string, name: string) => Promise<CustomTopicFolder | null>;
  onUpdateFolder: (id: string, name: string) => Promise<boolean>;
  onDeleteFolder: (id: string) => Promise<boolean>;
  // Question CRUD
  onAddQuestion: (data: CustomTopicQuestionFormData) => Promise<CustomTopicQuestion | null>;
  onUpdateQuestion: (id: string, data: Partial<CustomTopicQuestionFormData>) => Promise<boolean>;
  onDeleteQuestion: (id: string) => Promise<boolean>;
  // Import/Export
  onExportTopic?: (topicId: string) => void;
  onImportTopic?: (data: unknown) => Promise<boolean>;
}

export function CustomTopicsTab({
  topics,
  folders,
  questions,
  currentUser,
  isSuperAdmin,
  onAddTopic,
  onUpdateTopic,
  onDeleteTopic,
  onAddFolder,
  onUpdateFolder,
  onDeleteFolder,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onExportTopic,
  onImportTopic,
}: CustomTopicsTabProps) {
  // Navigation & view state
  const [navState, setNavState] = useState<NavState>({ type: 'topics' });
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<CustomTopic | null>(null);
  const [topicForm, setTopicForm] = useState<CustomTopicFormData>(DEFAULT_TOPIC_FORM);

  // Folder states
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');

  // Question states
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<CustomTopicQuestion | null>(null);
  const [questionForm, setQuestionForm] = useState<CustomTopicQuestionFormData>(DEFAULT_QUESTION_FORM);

  // Delete confirmation
  const [deleteTopicTarget, setDeleteTopicTarget] = useState<CustomTopic | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<CustomTopicFolder | null>(null);
  const [deleteQuestionTarget, setDeleteQuestionTarget] = useState<CustomTopicQuestion | null>(null);

  // Permissions
  const canModifyTopic = (t: CustomTopic) => isSuperAdmin || t.createdBy === currentUser.id;
  const canModifyFolder = (f: CustomTopicFolder) => isSuperAdmin || f.createdBy === currentUser.id;
  const canModifyQuestion = (q: CustomTopicQuestion) => isSuperAdmin || q.createdBy === currentUser.id;

  // Get current topic
  const currentTopic = useMemo(() => {
    if (navState.topicId) return topics.find(t => t.id === navState.topicId);
    return null;
  }, [navState.topicId, topics]);

  // Get folders for current topic
  const currentFolders = useMemo(() => {
    if (!navState.topicId) return [];
    return folders.filter(f => f.topicId === navState.topicId).sort((a, b) => a.order - b.order);
  }, [navState.topicId, folders]);

  // Get questions for current view
  const currentQuestions = useMemo(() => {
    if (navState.type === 'folder-detail' && navState.folderId) {
      return questions.filter(q => q.folderId === navState.folderId);
    }
    if (navState.type === 'topic-detail' && navState.topicId) {
      // Show questions without folder if topic has no folders
      if (currentFolders.length === 0) {
        return questions.filter(q => q.topicId === navState.topicId && !q.folderId);
      }
    }
    return [];
  }, [navState, questions, currentFolders]);

  // Filter topics by search
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return topics;
    const query = searchQuery.toLowerCase();
    return topics.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      t.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [topics, searchQuery]);

  // Get question count for topic
  const getTopicQuestionCount = (topicId: string) => questions.filter(q => q.topicId === topicId).length;

  // Get question count for folder
  const getFolderQuestionCount = (folderId: string) => questions.filter(q => q.folderId === folderId).length;

  // ==================== HANDLERS ====================

  // Topic handlers
  const handleOpenTopicModal = (topic?: CustomTopic) => {
    if (topic) {
      setEditingTopic(topic);
      setTopicForm({
        name: topic.name,
        description: topic.description,
        icon: topic.icon,
        color: topic.color,
        difficulty: topic.difficulty,
        tags: topic.tags,
        isPublic: topic.isPublic,
      });
    } else {
      setEditingTopic(null);
      setTopicForm(DEFAULT_TOPIC_FORM);
    }
    setShowTopicModal(true);
  };

  const handleSaveTopic = async () => {
    if (!topicForm.name.trim()) return;
    if (editingTopic) {
      await onUpdateTopic(editingTopic.id, topicForm);
    } else {
      await onAddTopic(topicForm);
    }
    setShowTopicModal(false);
    setEditingTopic(null);
    setTopicForm(DEFAULT_TOPIC_FORM);
  };

  const handleUseTemplate = (template: typeof TOPIC_TEMPLATES[number]) => {
    setTopicForm({
      ...topicForm,
      name: template.name,
      description: template.description,
      icon: template.icon,
      color: template.color,
    });
  };

  // Folder handlers
  const handleAddFolder = async () => {
    if (!newFolderName.trim() || !navState.topicId) return;
    await onAddFolder(navState.topicId, newFolderName.trim());
    setNewFolderName('');
    setShowAddFolder(false);
  };

  const handleUpdateFolder = async (id: string) => {
    if (!editingFolderName.trim()) return;
    await onUpdateFolder(id, editingFolderName.trim());
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  // Question handlers
  const handleOpenQuestionForm = (question?: CustomTopicQuestion) => {
    if (question) {
      setEditingQuestion(question);
      setQuestionForm({
        topicId: question.topicId,
        folderId: question.folderId,
        question: question.question,
        answers: [...question.answers],
        explanation: question.explanation || '',
        difficulty: question.difficulty,
        tags: question.tags || [],
      });
    } else {
      setEditingQuestion(null);
      setQuestionForm({
        ...DEFAULT_QUESTION_FORM,
        topicId: navState.topicId || '',
        folderId: navState.folderId,
      });
    }
    setShowQuestionForm(true);
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.question.trim() || questionForm.answers.some(a => !a.text.trim())) return;
    if (editingQuestion) {
      await onUpdateQuestion(editingQuestion.id, questionForm);
    } else {
      await onAddQuestion(questionForm);
    }
    setShowQuestionForm(false);
    setEditingQuestion(null);
    setQuestionForm(DEFAULT_QUESTION_FORM);
  };

  const handleAnswerChange = (index: number, text: string) => {
    const newAnswers = [...questionForm.answers];
    newAnswers[index] = { ...newAnswers[index], text };
    setQuestionForm({ ...questionForm, answers: newAnswers });
  };

  const handleCorrectAnswerChange = (index: number) => {
    const newAnswers = questionForm.answers.map((a, i) => ({ ...a, isCorrect: i === index }));
    setQuestionForm({ ...questionForm, answers: newAnswers });
  };

  // Navigation
  const goBack = () => {
    if (navState.type === 'folder-detail') {
      setNavState({ type: 'topic-detail', topicId: navState.topicId });
    } else if (navState.type === 'topic-detail') {
      setNavState({ type: 'topics' });
    }
    setShowQuestionForm(false);
    setShowAddFolder(false);
  };

  // ==================== RENDER ====================

  // Topic Card Component
  const renderTopicCard = (topic: CustomTopic) => {
    const questionCount = getTopicQuestionCount(topic.id);
    const diffLabel = DIFFICULTY_LABELS[topic.difficulty];

    return (
      <div
        key={topic.id}
        className={`custom-topic-card ${viewMode}`}
        style={{ '--topic-color': topic.color } as React.CSSProperties}
        onClick={() => setNavState({ type: 'topic-detail', topicId: topic.id })}
      >
        <div className="topic-card-header">
          <span className="topic-icon" style={{ backgroundColor: `${topic.color}20` }}>
            {topic.icon}
          </span>
          {canModifyTopic(topic) && (
            <div className="topic-card-actions" onClick={e => e.stopPropagation()}>
              <button className="btn-icon" onClick={() => handleOpenTopicModal(topic)} title="Chỉnh sửa">
                <Edit2 size={14} />
              </button>
              {onExportTopic && (
                <button className="btn-icon" onClick={() => onExportTopic(topic.id)} title="Xuất">
                  <Download size={14} />
                </button>
              )}
              <button className="btn-icon danger" onClick={() => setDeleteTopicTarget(topic)} title="Xóa">
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
        <div className="topic-card-body">
          <h3 className="topic-name">{topic.name}</h3>
          <p className="topic-description">{topic.description}</p>
          <div className="topic-meta">
            <span className="topic-difficulty" style={{ color: diffLabel.color }}>
              {diffLabel.label}
            </span>
            <span className="topic-count">
              <FileQuestion size={14} /> {questionCount} câu
            </span>
            <span className="topic-visibility">
              {topic.isPublic ? <Eye size={14} /> : <EyeOff size={14} />}
            </span>
          </div>
          {topic.tags.length > 0 && (
            <div className="topic-tags">
              {topic.tags.slice(0, 3).map((tag, i) => (
                <span key={i} className="topic-tag">{tag}</span>
              ))}
              {topic.tags.length > 3 && <span className="topic-tag more">+{topic.tags.length - 3}</span>}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Question Card Component
  const renderQuestionCard = (question: CustomTopicQuestion) => (
    <div key={question.id} className="question-card">
      <div className="question-header">
        {canModifyQuestion(question) && (
          <div className="question-actions">
            <button className="btn-icon" onClick={() => handleOpenQuestionForm(question)} title="Sửa">
              <Edit2 size={14} />
            </button>
            <button className="btn-icon danger" onClick={() => setDeleteQuestionTarget(question)} title="Xóa">
              <Trash2 size={14} />
            </button>
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
        {question.explanation && (
          <div className="question-explanation">
            <strong>Giải thích:</strong> {question.explanation}
          </div>
        )}
      </div>
    </div>
  );

  // ==================== VIEWS ====================

  // Topics List View
  if (navState.type === 'topics') {
    return (
      <div className="custom-topics-management">
        {/* Header */}
        <div className="topics-header">
          <div className="topics-title">
            <h2>
              <Star size={24} />
              Chủ đề mở rộng
            </h2>
            <p className="topics-subtitle">Tạo bộ câu hỏi theo chủ đề riêng ngoài JLPT</p>
          </div>
          <div className="topics-actions">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Tìm chủ đề..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="view-toggle">
              <button
                className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Lưới"
              >
                <Grid size={18} />
              </button>
              <button
                className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Danh sách"
              >
                <List size={18} />
              </button>
            </div>
            {onImportTopic && (
              <button className="btn btn-secondary" title="Nhập chủ đề">
                <Upload size={16} /> Nhập
              </button>
            )}
            <button className="btn btn-primary" onClick={() => handleOpenTopicModal()}>
              <Plus size={16} /> Tạo chủ đề
            </button>
          </div>
        </div>

        {/* Topics Grid/List */}
        {filteredTopics.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>Chưa có chủ đề nào</h3>
            <p>Tạo chủ đề đầu tiên để bắt đầu xây dựng bộ câu hỏi riêng của bạn</p>
            <button className="btn btn-primary" onClick={() => handleOpenTopicModal()}>
              <Plus size={16} /> Tạo chủ đề mới
            </button>
          </div>
        ) : (
          <div className={`topics-grid ${viewMode}`}>
            {filteredTopics.map(renderTopicCard)}
          </div>
        )}

        {/* Topic Modal */}
        {showTopicModal && (
          <div className="modal-overlay" onClick={() => setShowTopicModal(false)}>
            <div className="topic-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingTopic ? 'Chỉnh sửa chủ đề' : 'Tạo chủ đề mới'}</h3>
                <button className="btn-close" onClick={() => setShowTopicModal(false)}>×</button>
              </div>

              <div className="modal-body">
                {/* Quick Templates */}
                {!editingTopic && (
                  <div className="form-section">
                    <label>Mẫu có sẵn</label>
                    <div className="templates-grid">
                      {TOPIC_TEMPLATES.map((template, i) => (
                        <button
                          key={i}
                          className="template-btn"
                          style={{ borderColor: template.color }}
                          onClick={() => handleUseTemplate(template)}
                        >
                          <span className="template-icon">{template.icon}</span>
                          <span className="template-name">{template.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Icon & Color Picker */}
                <div className="form-row">
                  <div className="form-section half">
                    <label>Biểu tượng</label>
                    <div className="icon-picker">
                      {TOPIC_ICONS.map((icon, i) => (
                        <button
                          key={i}
                          className={`icon-btn ${topicForm.icon === icon ? 'selected' : ''}`}
                          onClick={() => setTopicForm({ ...topicForm, icon })}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-section half">
                    <label>Màu sắc</label>
                    <div className="color-picker">
                      {TOPIC_COLORS.map(color => (
                        <button
                          key={color.id}
                          className={`color-btn ${topicForm.color === color.value ? 'selected' : ''}`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => setTopicForm({ ...topicForm, color: color.value })}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Name & Description */}
                <div className="form-section">
                  <label>Tên chủ đề *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VD: Tiếng Nhật Kinh Doanh"
                    value={topicForm.name}
                    onChange={e => setTopicForm({ ...topicForm, name: e.target.value })}
                  />
                </div>
                <div className="form-section">
                  <label>Mô tả</label>
                  <textarea
                    className="form-input"
                    placeholder="Mô tả ngắn về nội dung chủ đề..."
                    rows={2}
                    value={topicForm.description}
                    onChange={e => setTopicForm({ ...topicForm, description: e.target.value })}
                  />
                </div>

                {/* Difficulty & Visibility */}
                <div className="form-row">
                  <div className="form-section half">
                    <label>Độ khó</label>
                    <select
                      className="form-input"
                      value={topicForm.difficulty}
                      onChange={e => setTopicForm({ ...topicForm, difficulty: e.target.value as TopicDifficulty })}
                    >
                      {Object.entries(DIFFICULTY_LABELS).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-section half">
                    <label>Hiển thị</label>
                    <div className="toggle-group">
                      <button
                        className={`toggle-btn ${topicForm.isPublic ? 'active' : ''}`}
                        onClick={() => setTopicForm({ ...topicForm, isPublic: true })}
                      >
                        <Eye size={14} /> Công khai
                      </button>
                      <button
                        className={`toggle-btn ${!topicForm.isPublic ? 'active' : ''}`}
                        onClick={() => setTopicForm({ ...topicForm, isPublic: false })}
                      >
                        <EyeOff size={14} /> Riêng tư
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="form-section">
                  <label>Tags (cách nhau bởi dấu phẩy)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VD: kinh doanh, email, họp"
                    value={topicForm.tags.join(', ')}
                    onChange={e => setTopicForm({
                      ...topicForm,
                      tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean),
                    })}
                  />
                </div>

                {/* Preview */}
                <div className="form-section">
                  <label>Xem trước</label>
                  <div className="topic-preview" style={{ '--topic-color': topicForm.color } as React.CSSProperties}>
                    <span className="preview-icon" style={{ backgroundColor: `${topicForm.color}20` }}>
                      {topicForm.icon}
                    </span>
                    <div className="preview-info">
                      <strong>{topicForm.name || 'Tên chủ đề'}</strong>
                      <span style={{ color: DIFFICULTY_LABELS[topicForm.difficulty].color }}>
                        {DIFFICULTY_LABELS[topicForm.difficulty].label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowTopicModal(false)}>Hủy</button>
                <button className="btn btn-primary" onClick={handleSaveTopic} disabled={!topicForm.name.trim()}>
                  {editingTopic ? 'Cập nhật' : 'Tạo chủ đề'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        <ConfirmModal
          isOpen={deleteTopicTarget !== null}
          title="Xác nhận xóa chủ đề"
          message={`Xóa chủ đề "${deleteTopicTarget?.name}"? Tất cả câu hỏi bên trong cũng sẽ bị xóa vĩnh viễn.`}
          confirmText="Xóa"
          onConfirm={async () => {
            if (deleteTopicTarget) {
              await onDeleteTopic(deleteTopicTarget.id);
              setDeleteTopicTarget(null);
            }
          }}
          onCancel={() => setDeleteTopicTarget(null)}
        />
      </div>
    );
  }

  // Topic Detail View
  if (navState.type === 'topic-detail' && currentTopic) {
    return (
      <div className="custom-topics-management">
        {/* Header */}
        <div className="detail-header">
          <button className="btn btn-back" onClick={goBack}>
            <ArrowLeft size={18} /> Quay lại
          </button>
          <div className="detail-title">
            <span className="detail-icon" style={{ backgroundColor: `${currentTopic.color}20` }}>
              {currentTopic.icon}
            </span>
            <div>
              <h2>{currentTopic.name}</h2>
              <p>{currentTopic.description}</p>
            </div>
          </div>
          <div className="detail-actions">
            {canModifyTopic(currentTopic) && (
              <button className="btn btn-secondary" onClick={() => handleOpenTopicModal(currentTopic)}>
                <Settings size={16} /> Cài đặt
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="topic-stats">
          <div className="stat-item">
            <span className="stat-value">{getTopicQuestionCount(currentTopic.id)}</span>
            <span className="stat-label">Câu hỏi</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{currentFolders.length}</span>
            <span className="stat-label">Thư mục</span>
          </div>
          <div className="stat-item">
            <span className="stat-value" style={{ color: DIFFICULTY_LABELS[currentTopic.difficulty].color }}>
              {DIFFICULTY_LABELS[currentTopic.difficulty].label}
            </span>
            <span className="stat-label">Độ khó</span>
          </div>
        </div>

        {/* Actions */}
        <div className="folder-actions">
          <button className="btn btn-secondary" onClick={() => setShowAddFolder(true)}>
            <FolderPlus size={16} /> Thêm thư mục
          </button>
          {currentFolders.length === 0 && (
            <button className="btn btn-primary" onClick={() => handleOpenQuestionForm()}>
              <Plus size={16} /> Thêm câu hỏi
            </button>
          )}
        </div>

        {/* Add Folder Inline */}
        {showAddFolder && (
          <div className="add-folder-inline">
            <input
              type="text"
              placeholder="Tên thư mục mới..."
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddFolder();
                if (e.key === 'Escape') { setShowAddFolder(false); setNewFolderName(''); }
              }}
              autoFocus
            />
            <button className="btn btn-primary" onClick={handleAddFolder}>Tạo</button>
            <button className="btn btn-secondary" onClick={() => { setShowAddFolder(false); setNewFolderName(''); }}>Hủy</button>
          </div>
        )}

        {/* Folders List */}
        {currentFolders.length > 0 && (
          <div className="folders-list">
            {currentFolders.map(folder => (
              <div
                key={folder.id}
                className="folder-item"
                onClick={() => setNavState({ type: 'folder-detail', topicId: navState.topicId, folderId: folder.id })}
              >
                <span className="folder-icon">📁</span>
                {editingFolderId === folder.id ? (
                  <input
                    type="text"
                    className="edit-input inline"
                    value={editingFolderName}
                    onChange={e => setEditingFolderName(e.target.value)}
                    onBlur={() => handleUpdateFolder(folder.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleUpdateFolder(folder.id);
                      if (e.key === 'Escape') { setEditingFolderId(null); setEditingFolderName(''); }
                    }}
                    onClick={e => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <span className="folder-name">{folder.name}</span>
                )}
                <span className="folder-count">({getFolderQuestionCount(folder.id)} câu)</span>
                {canModifyFolder(folder) && (
                  <div className="folder-actions-inline" onClick={e => e.stopPropagation()}>
                    <button
                      className="btn-icon"
                      onClick={() => { setEditingFolderId(folder.id); setEditingFolderName(folder.name); }}
                      title="Sửa tên"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn-icon danger"
                      onClick={() => setDeleteFolderTarget(folder)}
                      title="Xóa"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Questions without folder */}
        {currentFolders.length === 0 && (
          <div className="questions-list">
            {currentQuestions.length === 0 ? (
              <div className="empty-message">
                Chưa có câu hỏi. Tạo thư mục để tổ chức hoặc thêm câu hỏi trực tiếp.
              </div>
            ) : (
              currentQuestions.map(renderQuestionCard)
            )}
          </div>
        )}

        {/* Question Form Modal */}
        {showQuestionForm && (
          <div className="modal-overlay" onClick={() => setShowQuestionForm(false)}>
            <div className="question-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingQuestion ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</h3>
                <button className="btn-close" onClick={() => setShowQuestionForm(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-section">
                  <label>Câu hỏi *</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Nhập nội dung câu hỏi..."
                    value={questionForm.question}
                    onChange={e => setQuestionForm({ ...questionForm, question: e.target.value })}
                  />
                </div>
                <div className="form-section">
                  <label>Đáp án (chọn đáp án đúng)</label>
                  <div className="answers-grid">
                    {questionForm.answers.map((answer, index) => (
                      <div key={index} className="answer-input-row">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={answer.isCorrect}
                          onChange={() => handleCorrectAnswerChange(index)}
                        />
                        <input
                          type="text"
                          placeholder={`Đáp án ${index + 1}`}
                          value={answer.text}
                          onChange={e => handleAnswerChange(index, e.target.value)}
                          className={answer.isCorrect ? 'correct-answer' : ''}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="form-section">
                  <label>Giải thích (không bắt buộc)</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Giải thích đáp án đúng..."
                    value={questionForm.explanation}
                    onChange={e => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowQuestionForm(false)}>Hủy</button>
                <button className="btn btn-primary" onClick={handleSaveQuestion}>
                  {editingQuestion ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmations */}
        <ConfirmModal
          isOpen={deleteFolderTarget !== null}
          title="Xác nhận xóa thư mục"
          message={`Xóa thư mục "${deleteFolderTarget?.name}"? Tất cả câu hỏi bên trong cũng sẽ bị xóa.`}
          confirmText="Xóa"
          onConfirm={async () => {
            if (deleteFolderTarget) {
              await onDeleteFolder(deleteFolderTarget.id);
              setDeleteFolderTarget(null);
            }
          }}
          onCancel={() => setDeleteFolderTarget(null)}
        />

        <ConfirmModal
          isOpen={deleteQuestionTarget !== null}
          title="Xác nhận xóa câu hỏi"
          message={`Xóa câu hỏi này?`}
          confirmText="Xóa"
          onConfirm={async () => {
            if (deleteQuestionTarget) {
              await onDeleteQuestion(deleteQuestionTarget.id);
              setDeleteQuestionTarget(null);
            }
          }}
          onCancel={() => setDeleteQuestionTarget(null)}
        />
      </div>
    );
  }

  // Folder Detail View
  if (navState.type === 'folder-detail' && navState.folderId) {
    const currentFolder = currentFolders.find(f => f.id === navState.folderId);
    if (!currentFolder || !currentTopic) return null;

    return (
      <div className="custom-topics-management">
        {/* Header */}
        <div className="detail-header">
          <button className="btn btn-back" onClick={goBack}>
            <ArrowLeft size={18} /> Quay lại
          </button>
          <div className="detail-title">
            <span className="detail-icon folder">📁</span>
            <div>
              <h2>{currentFolder.name}</h2>
              <p>{currentTopic.icon} {currentTopic.name}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="folder-actions">
          <button className="btn btn-primary" onClick={() => handleOpenQuestionForm()}>
            <Plus size={16} /> Thêm câu hỏi
          </button>
        </div>

        {/* Questions List */}
        <div className="questions-list">
          {currentQuestions.length === 0 ? (
            <div className="empty-message">Chưa có câu hỏi. Nhấn "Thêm câu hỏi" để thêm.</div>
          ) : (
            currentQuestions.map(renderQuestionCard)
          )}
        </div>

        {/* Question Form Modal */}
        {showQuestionForm && (
          <div className="modal-overlay" onClick={() => setShowQuestionForm(false)}>
            <div className="question-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingQuestion ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</h3>
                <button className="btn-close" onClick={() => setShowQuestionForm(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-section">
                  <label>Câu hỏi *</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Nhập nội dung câu hỏi..."
                    value={questionForm.question}
                    onChange={e => setQuestionForm({ ...questionForm, question: e.target.value })}
                  />
                </div>
                <div className="form-section">
                  <label>Đáp án (chọn đáp án đúng)</label>
                  <div className="answers-grid">
                    {questionForm.answers.map((answer, index) => (
                      <div key={index} className="answer-input-row">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={answer.isCorrect}
                          onChange={() => handleCorrectAnswerChange(index)}
                        />
                        <input
                          type="text"
                          placeholder={`Đáp án ${index + 1}`}
                          value={answer.text}
                          onChange={e => handleAnswerChange(index, e.target.value)}
                          className={answer.isCorrect ? 'correct-answer' : ''}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="form-section">
                  <label>Giải thích (không bắt buộc)</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Giải thích đáp án đúng..."
                    value={questionForm.explanation}
                    onChange={e => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowQuestionForm(false)}>Hủy</button>
                <button className="btn btn-primary" onClick={handleSaveQuestion}>
                  {editingQuestion ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        <ConfirmModal
          isOpen={deleteQuestionTarget !== null}
          title="Xác nhận xóa câu hỏi"
          message={`Xóa câu hỏi này?`}
          confirmText="Xóa"
          onConfirm={async () => {
            if (deleteQuestionTarget) {
              await onDeleteQuestion(deleteQuestionTarget.id);
              setDeleteQuestionTarget(null);
            }
          }}
          onCancel={() => setDeleteQuestionTarget(null)}
        />
      </div>
    );
  }

  return null;
}
