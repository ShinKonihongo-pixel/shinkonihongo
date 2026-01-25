// Custom Topics Management Tab - 題材拡張管理
// Professional UI for creating and managing custom question sets beyond JLPT

import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, FileQuestion, ArrowLeft, Search, Grid, List, Download, Upload, Settings, Eye, EyeOff, Star, BookOpen, Circle, CheckCircle } from 'lucide-react';
import { ConfirmModal } from '../ui/confirm-modal';
import type {
  CustomTopic,
  CustomTopicFolder,
  CustomTopicQuestion,
  CustomTopicFormData,
  CustomTopicQuestionFormData,
  TopicDifficulty,
} from '../../types/custom-topic';
import type { JLPTLevel } from '../../types/kaiwa';

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
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

import type { Lesson } from '../../types/flashcard';

// Detail session tabs
type DetailSessionTab = 'sources' | 'questions';

interface CustomTopicsTabProps {
  topics: CustomTopic[];
  folders: CustomTopicFolder[];
  questions: CustomTopicQuestion[];
  currentUser: CurrentUser;
  isSuperAdmin: boolean;
  // Flashcard lessons for linking
  lessons?: Lesson[];
  getLessonsByLevel?: (level: JLPTLevel) => Lesson[];
  // Topic CRUD
  onAddTopic: (data: CustomTopicFormData) => Promise<CustomTopic | null>;
  onUpdateTopic: (id: string, data: Partial<CustomTopicFormData>) => Promise<boolean>;
  onDeleteTopic: (id: string) => Promise<boolean>;
  // Folder CRUD (kept for compatibility)
  onAddFolder: (topicId: string, name: string, level?: JLPTLevel) => Promise<CustomTopicFolder | null>;
  onUpdateFolder: (id: string, name: string, level?: JLPTLevel) => Promise<boolean>;
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
  lessons = [],
  getLessonsByLevel,
  onAddTopic,
  onUpdateTopic,
  onDeleteTopic,
  onAddFolder: _onAddFolder,
  onUpdateFolder: _onUpdateFolder,
  onDeleteFolder: _onDeleteFolder,
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

  // Detail session tab
  const [detailSessionTab, setDetailSessionTab] = useState<DetailSessionTab>('sources');
  const [selectedSourceLevel, setSelectedSourceLevel] = useState<JLPTLevel>('N5');

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

  // Question handlers
  const handleOpenQuestionForm = (question?: CustomTopicQuestion) => {
    if (question) {
      setEditingQuestion(question);
      setQuestionForm({
        topicId: question.topicId,
        folderId: question.folderId,
        questionJa: question.questionJa,
        questionVi: question.questionVi || '',
        situationContext: question.situationContext || '',
        suggestedAnswers: question.suggestedAnswers || [],
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
    if (!questionForm.questionJa.trim()) return;
    if (editingQuestion) {
      await onUpdateQuestion(editingQuestion.id, questionForm);
    } else {
      await onAddQuestion(questionForm);
    }
    setShowQuestionForm(false);
    setEditingQuestion(null);
    setQuestionForm(DEFAULT_QUESTION_FORM);
  };

  // Suggested answers handlers
  const handleAddSuggestedAnswer = () => {
    setQuestionForm({
      ...questionForm,
      suggestedAnswers: [...(questionForm.suggestedAnswers || []), ''],
    });
  };

  const handleUpdateSuggestedAnswer = (index: number, value: string) => {
    const newAnswers = [...(questionForm.suggestedAnswers || [])];
    newAnswers[index] = value;
    setQuestionForm({ ...questionForm, suggestedAnswers: newAnswers });
  };

  const handleRemoveSuggestedAnswer = (index: number) => {
    const newAnswers = (questionForm.suggestedAnswers || []).filter((_, i) => i !== index);
    setQuestionForm({ ...questionForm, suggestedAnswers: newAnswers });
  };

  // Navigation
  const goBack = () => {
    if (navState.type === 'folder-detail') {
      setNavState({ type: 'topic-detail', topicId: navState.topicId });
    } else if (navState.type === 'topic-detail') {
      setNavState({ type: 'topics' });
    }
    setShowQuestionForm(false);
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
    );
  };

  // Question Card Component - Conversation format
  const renderQuestionCard = (question: CustomTopicQuestion, index: number) => (
    <div key={question.id} className="question-list-item">
      <span className="question-number">{index + 1}.</span>
      <span className="question-text">{question.questionJa}</span>
      {question.questionVi && <span className="question-vi">({question.questionVi})</span>}
      {canModifyQuestion(question) && (
        <div className="question-actions">
          <button className="btn-icon-sm" onClick={() => handleOpenQuestionForm(question)} title="Sửa">
            <Edit2 size={14} />
          </button>
          <button className="btn-icon-sm danger" onClick={() => setDeleteQuestionTarget(question)} title="Xóa">
            <Trash2 size={14} />
          </button>
        </div>
      )}
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

        {/* Session Tabs */}
        <div className="detail-session-tabs">
          <button
            className={`session-tab-btn ${detailSessionTab === 'sources' ? 'active' : ''}`}
            onClick={() => setDetailSessionTab('sources')}
          >
            <BookOpen size={16} /> Nguồn từ vựng / Ngữ pháp
          </button>
          <button
            className={`session-tab-btn ${detailSessionTab === 'questions' ? 'active' : ''}`}
            onClick={() => setDetailSessionTab('questions')}
          >
            <FileQuestion size={16} /> Câu hỏi ({getTopicQuestionCount(currentTopic.id)})
          </button>
        </div>

        {/* Sources Session */}
        {detailSessionTab === 'sources' && (
          <div className="sources-session">
            <div className="sources-header">
              <p className="sources-description">
                Chọn các bài học từ vựng, ngữ pháp để AI sử dụng khi hội thoại với bạn.
              </p>
              <div className="level-filter">
                <label>Cấp độ:</label>
                <select
                  value={selectedSourceLevel}
                  onChange={e => setSelectedSourceLevel(e.target.value as JLPTLevel)}
                >
                  {JLPT_LEVELS.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lessons Grid */}
            <div className="lessons-source-grid">
              {(getLessonsByLevel ? getLessonsByLevel(selectedSourceLevel) : lessons.filter(l => l.jlptLevel === selectedSourceLevel && !l.parentId))
                .map(lesson => {
                  const isLinked = currentTopic.linkedLessonIds?.includes(lesson.id);
                  return (
                    <div
                      key={lesson.id}
                      className={`lesson-source-item ${isLinked ? 'linked' : ''}`}
                      onClick={() => {
                        const currentLinked = currentTopic.linkedLessonIds || [];
                        const newLinked = isLinked
                          ? currentLinked.filter(id => id !== lesson.id)
                          : [...currentLinked, lesson.id];
                        onUpdateTopic(currentTopic.id, { linkedLessonIds: newLinked });
                      }}
                    >
                      <div className="lesson-checkbox">
                        {isLinked ? <CheckCircle size={20} /> : <Circle size={20} />}
                      </div>
                      <div className="lesson-info">
                        <span className="lesson-name">{lesson.name}</span>
                        <span className="lesson-level">{lesson.jlptLevel}</span>
                      </div>
                    </div>
                  );
                })}
              {(getLessonsByLevel ? getLessonsByLevel(selectedSourceLevel) : lessons.filter(l => l.jlptLevel === selectedSourceLevel && !l.parentId)).length === 0 && (
                <div className="empty-message">
                  Chưa có bài học nào ở cấp độ {selectedSourceLevel}
                </div>
              )}
            </div>

            {/* Linked Summary */}
            {(currentTopic.linkedLessonIds?.length || 0) > 0 && (
              <div className="linked-summary">
                <span className="linked-count">
                  Đã liên kết: {currentTopic.linkedLessonIds?.length} bài học
                </span>
              </div>
            )}
          </div>
        )}

        {/* Questions Session */}
        {detailSessionTab === 'questions' && (
          <div className="questions-session">
            <div className="questions-header">
              <p className="questions-description">
                Tạo câu hỏi để AI sử dụng khi bắt đầu hội thoại với bạn.
              </p>
              <button className="btn btn-primary" onClick={() => handleOpenQuestionForm()}>
                <Plus size={16} /> Thêm câu hỏi
              </button>
            </div>

            <div className="questions-list">
              {currentQuestions.length === 0 ? (
                <div className="empty-message">
                  Chưa có câu hỏi. Bấm "Thêm câu hỏi" để tạo.
                </div>
              ) : (
                currentQuestions.map((q, i) => renderQuestionCard(q, i))
              )}
            </div>
          </div>
        )}

        {/* Question Form Modal - Conversation Format */}
        {showQuestionForm && (
          <div className="modal-overlay" onClick={() => setShowQuestionForm(false)}>
            <div className="question-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingQuestion ? 'Sửa câu hỏi hội thoại' : 'Thêm câu hỏi hội thoại'}</h3>
                <button className="btn-close" onClick={() => setShowQuestionForm(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-section">
                  <label>Câu hỏi tiếng Nhật *</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="VD: 今日の調子はどうですか？"
                    value={questionForm.questionJa}
                    onChange={e => setQuestionForm({ ...questionForm, questionJa: e.target.value })}
                  />
                </div>
                <div className="form-section">
                  <label>Dịch nghĩa tiếng Việt</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VD: Hôm nay bạn thấy thế nào?"
                    value={questionForm.questionVi || ''}
                    onChange={e => setQuestionForm({ ...questionForm, questionVi: e.target.value })}
                  />
                </div>
                <div className="form-section">
                  <label>Tình huống / Ngữ cảnh</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VD: Khi gặp đồng nghiệp vào buổi sáng"
                    value={questionForm.situationContext || ''}
                    onChange={e => setQuestionForm({ ...questionForm, situationContext: e.target.value })}
                  />
                </div>
                <div className="form-section">
                  <label>Gợi ý câu trả lời ({(questionForm.suggestedAnswers || []).length})</label>
                  <p className="form-hint">Các mẫu câu trả lời để AI tham khảo khi đánh giá</p>
                  <div className="suggested-answers-list">
                    {(questionForm.suggestedAnswers || []).map((answer, index) => (
                      <div key={index} className="suggested-answer-row">
                        <span className="answer-number">{index + 1}.</span>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="VD: 元気です、ありがとうございます"
                          value={answer}
                          onChange={e => handleUpdateSuggestedAnswer(index, e.target.value)}
                        />
                        <button className="btn-icon danger" onClick={() => handleRemoveSuggestedAnswer(index)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button className="btn btn-secondary btn-small" onClick={handleAddSuggestedAnswer}>
                      <Plus size={14} /> Thêm gợi ý
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowQuestionForm(false)}>Hủy</button>
                <button className="btn btn-primary" onClick={handleSaveQuestion} disabled={!questionForm.questionJa.trim()}>
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
              await _onDeleteFolder(deleteFolderTarget.id);
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
            currentQuestions.map((q, i) => renderQuestionCard(q, i))
          )}
        </div>

        {/* Question Form Modal - Conversation Format */}
        {showQuestionForm && (
          <div className="modal-overlay" onClick={() => setShowQuestionForm(false)}>
            <div className="question-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingQuestion ? 'Sửa câu hỏi hội thoại' : 'Thêm câu hỏi hội thoại'}</h3>
                <button className="btn-close" onClick={() => setShowQuestionForm(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-section">
                  <label>Câu hỏi tiếng Nhật *</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="VD: 今日の調子はどうですか？"
                    value={questionForm.questionJa}
                    onChange={e => setQuestionForm({ ...questionForm, questionJa: e.target.value })}
                  />
                </div>
                <div className="form-section">
                  <label>Dịch nghĩa tiếng Việt</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VD: Hôm nay bạn thấy thế nào?"
                    value={questionForm.questionVi || ''}
                    onChange={e => setQuestionForm({ ...questionForm, questionVi: e.target.value })}
                  />
                </div>
                <div className="form-section">
                  <label>Tình huống / Ngữ cảnh</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VD: Khi gặp đồng nghiệp vào buổi sáng"
                    value={questionForm.situationContext || ''}
                    onChange={e => setQuestionForm({ ...questionForm, situationContext: e.target.value })}
                  />
                </div>
                <div className="form-section">
                  <label>Gợi ý câu trả lời ({(questionForm.suggestedAnswers || []).length})</label>
                  <p className="form-hint">Các mẫu câu trả lời để AI tham khảo khi đánh giá</p>
                  <div className="suggested-answers-list">
                    {(questionForm.suggestedAnswers || []).map((answer, index) => (
                      <div key={index} className="suggested-answer-row">
                        <span className="answer-number">{index + 1}.</span>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="VD: 元気です、ありがとうございます"
                          value={answer}
                          onChange={e => handleUpdateSuggestedAnswer(index, e.target.value)}
                        />
                        <button className="btn-icon danger" onClick={() => handleRemoveSuggestedAnswer(index)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button className="btn btn-secondary btn-small" onClick={handleAddSuggestedAnswer}>
                      <Plus size={14} /> Thêm gợi ý
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowQuestionForm(false)}>Hủy</button>
                <button className="btn btn-primary" onClick={handleSaveQuestion} disabled={!questionForm.questionJa.trim()}>
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
