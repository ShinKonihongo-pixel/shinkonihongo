// Kaiwa Topics Management - 会話練習チューマ管理
// Professional UI for creating and managing custom conversation topics

import { useState, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, ArrowLeft, Search, Grid, List,
  Eye, EyeOff, MessageCircle, BookOpen, X,
  GripVertical, Volume2, Copy,
} from 'lucide-react';
import { ConfirmModal } from '../ui/confirm-modal';
import type {
  KaiwaAdvancedTopic,
  KaiwaAdvancedQuestion,
  KaiwaAdvancedTopicFormData,
  KaiwaAdvancedQuestionFormData,
  KaiwaVocabulary,
} from '../../types/kaiwa-advanced';
import {
  KAIWA_TOPIC_ICONS,
  KAIWA_TOPIC_COLORS,
  KAIWA_TOPIC_TEMPLATES,
  DEFAULT_KAIWA_TOPIC_FORM,
  DEFAULT_KAIWA_QUESTION_FORM,
} from '../../types/kaiwa-advanced';
import { JLPT_LEVELS, CONVERSATION_STYLES } from '../../constants/kaiwa';
import type { JLPTLevel, ConversationStyle } from '../../types/kaiwa';

// Navigation state types
type ViewMode = 'grid' | 'list';
type NavType = 'topics' | 'topic-detail';

interface NavState {
  type: NavType;
  topicId?: string;
}

interface KaiwaTopicsManagementProps {
  topics: KaiwaAdvancedTopic[];
  questions: KaiwaAdvancedQuestion[];
  currentUserId: string;
  isSuperAdmin: boolean;
  // Topic CRUD
  onAddTopic: (data: KaiwaAdvancedTopicFormData) => Promise<KaiwaAdvancedTopic | null>;
  onUpdateTopic: (id: string, data: Partial<KaiwaAdvancedTopicFormData>) => Promise<boolean>;
  onDeleteTopic: (id: string) => Promise<boolean>;
  // Question CRUD
  onAddQuestion: (data: KaiwaAdvancedQuestionFormData) => Promise<KaiwaAdvancedQuestion | null>;
  onUpdateQuestion: (id: string, data: Partial<KaiwaAdvancedQuestionFormData>) => Promise<boolean>;
  onDeleteQuestion: (id: string) => Promise<boolean>;
}

export function KaiwaTopicsManagement({
  topics,
  questions,
  currentUserId,
  isSuperAdmin,
  onAddTopic,
  onUpdateTopic,
  onDeleteTopic,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
}: KaiwaTopicsManagementProps) {
  // Navigation & view state
  const [navState, setNavState] = useState<NavState>({ type: 'topics' });
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<KaiwaAdvancedTopic | null>(null);
  const [topicForm, setTopicForm] = useState<KaiwaAdvancedTopicFormData>(DEFAULT_KAIWA_TOPIC_FORM);

  // Question states
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<KaiwaAdvancedQuestion | null>(null);
  const [questionForm, setQuestionForm] = useState<KaiwaAdvancedQuestionFormData>(DEFAULT_KAIWA_QUESTION_FORM);

  // Vocabulary inline add
  const [showVocabInput, setShowVocabInput] = useState(false);
  const [vocabForm, setVocabForm] = useState<Omit<KaiwaVocabulary, 'id'>>({
    word: '',
    reading: '',
    meaning: '',
    example: '',
  });

  // Delete confirmation
  const [deleteTopicTarget, setDeleteTopicTarget] = useState<KaiwaAdvancedTopic | null>(null);
  const [deleteQuestionTarget, setDeleteQuestionTarget] = useState<KaiwaAdvancedQuestion | null>(null);

  // Permissions
  const canModifyTopic = (t: KaiwaAdvancedTopic) => isSuperAdmin || t.createdBy === currentUserId;
  const canModifyQuestion = (q: KaiwaAdvancedQuestion) => {
    const topic = topics.find(t => t.id === q.topicId);
    return isSuperAdmin || (topic && topic.createdBy === currentUserId);
  };

  // Get current topic
  const currentTopic = useMemo(() => {
    if (navState.topicId) return topics.find(t => t.id === navState.topicId);
    return null;
  }, [navState.topicId, topics]);

  // Get questions for current topic
  const currentQuestions = useMemo(() => {
    if (!navState.topicId) return [];
    return questions
      .filter(q => q.topicId === navState.topicId)
      .sort((a, b) => a.order - b.order);
  }, [navState.topicId, questions]);

  // Filter topics by search
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return topics;
    const query = searchQuery.toLowerCase();
    return topics.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query)
    );
  }, [topics, searchQuery]);

  // ==================== HANDLERS ====================

  // Topic handlers
  const handleOpenTopicModal = (topic?: KaiwaAdvancedTopic) => {
    if (topic) {
      setEditingTopic(topic);
      setTopicForm({
        name: topic.name,
        description: topic.description,
        icon: topic.icon,
        color: topic.color,
        level: topic.level,
        style: topic.style,
        vocabulary: topic.vocabulary || [],
        isPublic: topic.isPublic,
      });
    } else {
      setEditingTopic(null);
      setTopicForm(DEFAULT_KAIWA_TOPIC_FORM);
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
    setTopicForm(DEFAULT_KAIWA_TOPIC_FORM);
  };

  const handleUseTemplate = (template: typeof KAIWA_TOPIC_TEMPLATES[number]) => {
    setTopicForm({
      ...topicForm,
      name: template.name,
      description: template.description,
      icon: template.icon,
      color: template.color,
      level: template.level,
    });
  };

  // Question handlers
  const handleOpenQuestionModal = (question?: KaiwaAdvancedQuestion) => {
    if (question) {
      setEditingQuestion(question);
      setQuestionForm({
        topicId: question.topicId,
        questionJa: question.questionJa,
        questionVi: question.questionVi || '',
        situationContext: question.situationContext || '',
        suggestedAnswers: question.suggestedAnswers || [],
        vocabulary: question.vocabulary || [],
      });
    } else {
      setEditingQuestion(null);
      setQuestionForm({
        ...DEFAULT_KAIWA_QUESTION_FORM,
        topicId: navState.topicId || '',
      });
    }
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.questionJa.trim()) return;
    if (editingQuestion) {
      await onUpdateQuestion(editingQuestion.id, questionForm);
    } else {
      await onAddQuestion(questionForm);
    }
    setShowQuestionModal(false);
    setEditingQuestion(null);
    setQuestionForm(DEFAULT_KAIWA_QUESTION_FORM);
  };

  // Vocabulary handlers
  const handleAddVocabulary = () => {
    if (!vocabForm.word.trim() || !vocabForm.meaning.trim()) return;
    const newVocab: KaiwaVocabulary = {
      id: `vocab-${Date.now()}`,
      ...vocabForm,
    };
    setTopicForm({
      ...topicForm,
      vocabulary: [...topicForm.vocabulary, newVocab],
    });
    setVocabForm({ word: '', reading: '', meaning: '', example: '' });
    setShowVocabInput(false);
  };

  const handleRemoveVocabulary = (vocabId: string) => {
    setTopicForm({
      ...topicForm,
      vocabulary: topicForm.vocabulary.filter(v => v.id !== vocabId),
    });
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
    setNavState({ type: 'topics' });
    setShowQuestionModal(false);
  };

  // ==================== RENDER ====================

  // Topic Card
  const renderTopicCard = (topic: KaiwaAdvancedTopic) => {
    const questionCount = questions.filter(q => q.topicId === topic.id).length;

    return (
      <div
        key={topic.id}
        className={`kaiwa-topic-card ${viewMode}`}
        style={{ '--topic-color': topic.color } as React.CSSProperties}
        onClick={() => setNavState({ type: 'topic-detail', topicId: topic.id })}
      >
        <div className="topic-card-header">
          <span className="topic-icon" style={{ backgroundColor: `${topic.color}20` }}>
            {topic.icon}
          </span>
          {canModifyTopic(topic) && (
            <div className="topic-card-actions" onClick={e => e.stopPropagation()}>
              <button className="btn-icon" onClick={() => handleOpenTopicModal(topic)} title="Sửa">
                <Edit2 size={14} />
              </button>
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
            <span className="topic-level">{topic.level}</span>
            <span className="topic-count">
              <MessageCircle size={14} /> {questionCount} câu hỏi
            </span>
            <span className="topic-vocab">
              <BookOpen size={14} /> {topic.vocabulary?.length || 0} từ vựng
            </span>
            <span className="topic-visibility">
              {topic.isPublic ? <Eye size={14} /> : <EyeOff size={14} />}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Question Card
  const renderQuestionCard = (question: KaiwaAdvancedQuestion, index: number) => (
    <div key={question.id} className="kaiwa-question-card">
      <div className="question-order">
        <GripVertical size={16} />
        <span>{index + 1}</span>
      </div>
      <div className="question-content">
        <p className="question-ja">{question.questionJa}</p>
        {question.questionVi && (
          <p className="question-vi">{question.questionVi}</p>
        )}
        {question.situationContext && (
          <p className="question-context">
            <span className="context-label">Tình huống:</span> {question.situationContext}
          </p>
        )}
        {question.suggestedAnswers && question.suggestedAnswers.length > 0 && (
          <div className="question-answers">
            <span className="answers-label">Gợi ý trả lời:</span>
            <ul>
              {question.suggestedAnswers.map((answer, i) => (
                <li key={i}>{answer}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {canModifyQuestion(question) && (
        <div className="question-actions">
          <button className="btn-icon" onClick={() => handleOpenQuestionModal(question)} title="Sửa">
            <Edit2 size={14} />
          </button>
          <button className="btn-icon danger" onClick={() => setDeleteQuestionTarget(question)} title="Xóa">
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
      <div className="kaiwa-topics-management">
        {/* Header */}
        <div className="topics-header">
          <div className="topics-title">
            <h2>
              <MessageCircle size={24} />
              Chủ đề hội thoại
            </h2>
            <p className="topics-subtitle">Tạo chủ đề và câu hỏi riêng cho luyện tập hội thoại</p>
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
            <button className="btn btn-primary" onClick={() => handleOpenTopicModal()}>
              <Plus size={16} /> Tạo chủ đề
            </button>
          </div>
        </div>

        {/* Topics Grid/List */}
        {filteredTopics.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3>Chưa có chủ đề nào</h3>
            <p>Tạo chủ đề đầu tiên để bắt đầu luyện tập hội thoại theo chủ đề riêng</p>
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
            <div className="kaiwa-topic-modal" onClick={e => e.stopPropagation()}>
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
                      {KAIWA_TOPIC_TEMPLATES.map((template, i) => (
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
                      {KAIWA_TOPIC_ICONS.map((icon, i) => (
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
                      {KAIWA_TOPIC_COLORS.map(color => (
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
                    placeholder="VD: Phỏng vấn xin việc"
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

                {/* Level, Style & Visibility */}
                <div className="form-row">
                  <div className="form-section third">
                    <label>Cấp độ</label>
                    <select
                      className="form-input"
                      value={topicForm.level}
                      onChange={e => setTopicForm({ ...topicForm, level: e.target.value as JLPTLevel })}
                    >
                      {JLPT_LEVELS.map(l => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-section third">
                    <label>Phong cách</label>
                    <select
                      className="form-input"
                      value={topicForm.style}
                      onChange={e => setTopicForm({ ...topicForm, style: e.target.value as ConversationStyle })}
                    >
                      {CONVERSATION_STYLES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-section third">
                    <label>Hiển thị</label>
                    <div className="toggle-group compact">
                      <button
                        className={`toggle-btn ${topicForm.isPublic ? 'active' : ''}`}
                        onClick={() => setTopicForm({ ...topicForm, isPublic: true })}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className={`toggle-btn ${!topicForm.isPublic ? 'active' : ''}`}
                        onClick={() => setTopicForm({ ...topicForm, isPublic: false })}
                      >
                        <EyeOff size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Vocabulary Section */}
                <div className="form-section">
                  <label>
                    <BookOpen size={16} />
                    Từ vựng chung ({topicForm.vocabulary.length})
                  </label>
                  <div className="vocabulary-list">
                    {topicForm.vocabulary.map(vocab => (
                      <div key={vocab.id} className="vocab-item">
                        <span className="vocab-word">{vocab.word}</span>
                        {vocab.reading && <span className="vocab-reading">({vocab.reading})</span>}
                        <span className="vocab-meaning">{vocab.meaning}</span>
                        <button
                          className="btn-icon small danger"
                          onClick={() => handleRemoveVocabulary(vocab.id)}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {showVocabInput ? (
                      <div className="vocab-input-row">
                        <input
                          type="text"
                          placeholder="Từ tiếng Nhật"
                          value={vocabForm.word}
                          onChange={e => setVocabForm({ ...vocabForm, word: e.target.value })}
                        />
                        <input
                          type="text"
                          placeholder="Cách đọc"
                          value={vocabForm.reading}
                          onChange={e => setVocabForm({ ...vocabForm, reading: e.target.value })}
                        />
                        <input
                          type="text"
                          placeholder="Nghĩa tiếng Việt"
                          value={vocabForm.meaning}
                          onChange={e => setVocabForm({ ...vocabForm, meaning: e.target.value })}
                        />
                        <button className="btn btn-primary btn-small" onClick={handleAddVocabulary}>
                          Thêm
                        </button>
                        <button
                          className="btn btn-secondary btn-small"
                          onClick={() => {
                            setShowVocabInput(false);
                            setVocabForm({ word: '', reading: '', meaning: '', example: '' });
                          }}
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-secondary btn-small add-vocab-btn"
                        onClick={() => setShowVocabInput(true)}
                      >
                        <Plus size={14} /> Thêm từ vựng
                      </button>
                    )}
                  </div>
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
                      <span className="preview-level">{topicForm.level}</span>
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
          message={`Xóa chủ đề "${deleteTopicTarget?.name}"? Tất cả câu hỏi bên trong cũng sẽ bị xóa.`}
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
      <div className="kaiwa-topics-management">
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
          {canModifyTopic(currentTopic) && (
            <div className="detail-actions">
              <button className="btn btn-secondary" onClick={() => handleOpenTopicModal(currentTopic)}>
                <Edit2 size={16} /> Sửa chủ đề
              </button>
            </div>
          )}
        </div>

        {/* Topic Stats & Vocabulary */}
        <div className="topic-detail-info">
          <div className="topic-stats">
            <div className="stat-item">
              <span className="stat-value">{currentQuestions.length}</span>
              <span className="stat-label">Câu hỏi</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{currentTopic.vocabulary?.length || 0}</span>
              <span className="stat-label">Từ vựng</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{currentTopic.level}</span>
              <span className="stat-label">Cấp độ</span>
            </div>
          </div>

          {/* Vocabulary Display */}
          {currentTopic.vocabulary && currentTopic.vocabulary.length > 0 && (
            <div className="topic-vocabulary-section">
              <h4><BookOpen size={16} /> Từ vựng chủ đề</h4>
              <div className="vocabulary-grid">
                {currentTopic.vocabulary.map(vocab => (
                  <div key={vocab.id} className="vocab-card">
                    <div className="vocab-main">
                      <span className="vocab-word">{vocab.word}</span>
                      {vocab.reading && <span className="vocab-reading">{vocab.reading}</span>}
                    </div>
                    <span className="vocab-meaning">{vocab.meaning}</span>
                    <div className="vocab-actions">
                      <button className="btn-icon small" title="Nghe">
                        <Volume2 size={14} />
                      </button>
                      <button
                        className="btn-icon small"
                        title="Sao chép"
                        onClick={() => navigator.clipboard.writeText(vocab.word)}
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Questions Section */}
        <div className="questions-section">
          <div className="questions-header">
            <h3><MessageCircle size={18} /> Câu hỏi luyện tập</h3>
            <button className="btn btn-primary" onClick={() => handleOpenQuestionModal()}>
              <Plus size={16} /> Thêm câu hỏi
            </button>
          </div>

          {currentQuestions.length === 0 ? (
            <div className="empty-questions">
              <p>Chưa có câu hỏi. Nhấn "Thêm câu hỏi" để bắt đầu.</p>
            </div>
          ) : (
            <div className="questions-list">
              {currentQuestions.map((q, i) => renderQuestionCard(q, i))}
            </div>
          )}
        </div>

        {/* Question Modal */}
        {showQuestionModal && (
          <div className="modal-overlay" onClick={() => setShowQuestionModal(false)}>
            <div className="kaiwa-question-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingQuestion ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</h3>
                <button className="btn-close" onClick={() => setShowQuestionModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-section">
                  <label>Câu hỏi tiếng Nhật *</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="VD: お名前を教えていただけますか？"
                    value={questionForm.questionJa}
                    onChange={e => setQuestionForm({ ...questionForm, questionJa: e.target.value })}
                  />
                </div>
                <div className="form-section">
                  <label>Dịch nghĩa tiếng Việt</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VD: Cho tôi biết tên của bạn được không?"
                    value={questionForm.questionVi}
                    onChange={e => setQuestionForm({ ...questionForm, questionVi: e.target.value })}
                  />
                </div>
                <div className="form-section">
                  <label>Tình huống / Ngữ cảnh</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VD: Khi bắt đầu phỏng vấn"
                    value={questionForm.situationContext}
                    onChange={e => setQuestionForm({ ...questionForm, situationContext: e.target.value })}
                  />
                </div>
                <div className="form-section">
                  <label>Gợi ý câu trả lời ({questionForm.suggestedAnswers?.length || 0})</label>
                  <div className="suggested-answers-list">
                    {(questionForm.suggestedAnswers || []).map((answer, index) => (
                      <div key={index} className="suggested-answer-row">
                        <span className="answer-number">{index + 1}.</span>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Nhập gợi ý trả lời..."
                          value={answer}
                          onChange={e => handleUpdateSuggestedAnswer(index, e.target.value)}
                        />
                        <button
                          className="btn-icon danger"
                          onClick={() => handleRemoveSuggestedAnswer(index)}
                        >
                          <X size={14} />
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
                <button className="btn btn-secondary" onClick={() => setShowQuestionModal(false)}>Hủy</button>
                <button
                  className="btn btn-primary"
                  onClick={handleSaveQuestion}
                  disabled={!questionForm.questionJa.trim()}
                >
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
          message="Xóa câu hỏi này?"
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
