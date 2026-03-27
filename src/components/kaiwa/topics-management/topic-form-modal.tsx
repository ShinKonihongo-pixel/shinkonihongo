// Topic Form Modal - Create/Edit topic with all fields

import { useState } from 'react';
import {
  Plus, Eye, EyeOff, MessageCircle, BookOpen, X,
} from 'lucide-react';
import { ModalShell } from '../../ui/modal-shell';
import type {
  KaiwaAdvancedTopic,
  KaiwaAdvancedTopicFormData,
  KaiwaVocabulary,
  KaiwaQuestionBankItem,
  KaiwaAnswerBankItem,
} from '../../../types/kaiwa-advanced';
import {
  KAIWA_TOPIC_ICONS,
  KAIWA_TOPIC_COLORS,
  KAIWA_TOPIC_TEMPLATES,
} from '../../../types/kaiwa-advanced';
import { JLPT_LEVELS, CONVERSATION_STYLES } from '../../../constants/kaiwa';
import type { JLPTLevel, ConversationStyle } from '../../../types/kaiwa';

interface TopicFormModalProps {
  isOpen: boolean;
  editingTopic: KaiwaAdvancedTopic | null;
  topicForm: KaiwaAdvancedTopicFormData;
  onClose: () => void;
  onSave: () => void;
  onUpdateForm: (updates: Partial<KaiwaAdvancedTopicFormData>) => void;
}

export function TopicFormModal({
  isOpen,
  editingTopic,
  topicForm,
  onClose,
  onSave,
  onUpdateForm,
}: TopicFormModalProps) {
  // Vocabulary inline add
  const [showVocabInput, setShowVocabInput] = useState(false);
  const [vocabForm, setVocabForm] = useState<Omit<KaiwaVocabulary, 'id'>>({
    word: '',
    reading: '',
    meaning: '',
    example: '',
  });

  // Question bank inline add
  const [showQuestionBankInput, setShowQuestionBankInput] = useState(false);
  const [questionBankForm, setQuestionBankForm] = useState<Omit<KaiwaQuestionBankItem, 'id'>>({
    questionJa: '',
    questionVi: '',
    level: 'N4',
    tags: [],
  });

  // Answer bank inline add
  const [showAnswerBankInput, setShowAnswerBankInput] = useState(false);
  const [answerBankForm, setAnswerBankForm] = useState<Omit<KaiwaAnswerBankItem, 'id'>>({
    answerJa: '',
    answerVi: '',
    level: 'N4',
    tags: [],
  });

  // Handlers
  const handleUseTemplate = (template: typeof KAIWA_TOPIC_TEMPLATES[number]) => {
    onUpdateForm({
      name: template.name,
      description: template.description,
      icon: template.icon,
      color: template.color,
      level: template.level,
    });
  };

  const handleAddVocabulary = () => {
    if (!vocabForm.word.trim() || !vocabForm.meaning.trim()) return;
    const newVocab: KaiwaVocabulary = {
      id: `vocab-${Date.now()}`,
      ...vocabForm,
    };
    onUpdateForm({
      vocabulary: [...topicForm.vocabulary, newVocab],
    });
    setVocabForm({ word: '', reading: '', meaning: '', example: '' });
    setShowVocabInput(false);
  };

  const handleRemoveVocabulary = (vocabId: string) => {
    onUpdateForm({
      vocabulary: topicForm.vocabulary.filter(v => v.id !== vocabId),
    });
  };

  const handleAddQuestionBank = () => {
    if (!questionBankForm.questionJa.trim()) return;
    const newItem: KaiwaQuestionBankItem = {
      id: `qb-${Date.now()}`,
      ...questionBankForm,
    };
    onUpdateForm({
      questionBank: [...(topicForm.questionBank || []), newItem],
    });
    setQuestionBankForm({ questionJa: '', questionVi: '', level: topicForm.level, tags: [] });
    setShowQuestionBankInput(false);
  };

  const handleRemoveQuestionBank = (itemId: string) => {
    onUpdateForm({
      questionBank: (topicForm.questionBank || []).filter(q => q.id !== itemId),
    });
  };

  const handleAddAnswerBank = () => {
    if (!answerBankForm.answerJa.trim()) return;
    const newItem: KaiwaAnswerBankItem = {
      id: `ab-${Date.now()}`,
      ...answerBankForm,
    };
    onUpdateForm({
      answerBank: [...(topicForm.answerBank || []), newItem],
    });
    setAnswerBankForm({ answerJa: '', answerVi: '', level: topicForm.level, tags: [] });
    setShowAnswerBankInput(false);
  };

  const handleRemoveAnswerBank = (itemId: string) => {
    onUpdateForm({
      answerBank: (topicForm.answerBank || []).filter(a => a.id !== itemId),
    });
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={editingTopic ? 'Chỉnh sửa chủ đề' : 'Tạo chủ đề mới'}
      maxWidth={640}
    >
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
                    onClick={() => onUpdateForm({ icon })}
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
                    onClick={() => onUpdateForm({ color: color.value })}
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
              onChange={e => onUpdateForm({ name: e.target.value })}
            />
          </div>
          <div className="form-section">
            <label>Mô tả</label>
            <textarea
              className="form-input"
              placeholder="Mô tả ngắn về nội dung chủ đề..."
              rows={2}
              value={topicForm.description}
              onChange={e => onUpdateForm({ description: e.target.value })}
            />
          </div>

          {/* Level, Style & Visibility */}
          <div className="form-row">
            <div className="form-section third">
              <label>Cấp độ</label>
              <select
                className="form-input"
                value={topicForm.level}
                onChange={e => onUpdateForm({ level: e.target.value as JLPTLevel })}
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
                onChange={e => onUpdateForm({ style: e.target.value as ConversationStyle })}
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
                  onClick={() => onUpdateForm({ isPublic: true })}
                >
                  <Eye size={14} />
                </button>
                <button
                  className={`toggle-btn ${!topicForm.isPublic ? 'active' : ''}`}
                  onClick={() => onUpdateForm({ isPublic: false })}
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

          {/* Question Bank Section */}
          <div className="form-section">
            <label>
              <MessageCircle size={16} />
              Kho câu hỏi ({(topicForm.questionBank || []).length})
            </label>
            <p className="form-hint">AI sẽ dùng các câu hỏi này để bắt đầu hội thoại với người học</p>
            <div className="bank-list">
              {(topicForm.questionBank || []).map(item => (
                <div key={item.id} className="bank-item">
                  <div className="bank-content">
                    <span className="bank-ja">{item.questionJa}</span>
                    {item.questionVi && <span className="bank-vi">{item.questionVi}</span>}
                    <span className="bank-level">{item.level}</span>
                  </div>
                  <button
                    className="btn-icon small danger"
                    onClick={() => handleRemoveQuestionBank(item.id)}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {showQuestionBankInput ? (
                <div className="bank-input-row">
                  <textarea
                    placeholder="Câu hỏi tiếng Nhật"
                    value={questionBankForm.questionJa}
                    onChange={e => setQuestionBankForm({ ...questionBankForm, questionJa: e.target.value })}
                    rows={2}
                  />
                  <input
                    type="text"
                    placeholder="Dịch nghĩa (tùy chọn)"
                    value={questionBankForm.questionVi}
                    onChange={e => setQuestionBankForm({ ...questionBankForm, questionVi: e.target.value })}
                  />
                  <select
                    value={questionBankForm.level}
                    onChange={e => setQuestionBankForm({ ...questionBankForm, level: e.target.value as JLPTLevel })}
                  >
                    {JLPT_LEVELS.map(l => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                  <div className="bank-input-actions">
                    <button className="btn btn-primary btn-small" onClick={handleAddQuestionBank}>
                      Thêm
                    </button>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => {
                        setShowQuestionBankInput(false);
                        setQuestionBankForm({ questionJa: '', questionVi: '', level: topicForm.level, tags: [] });
                      }}
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="btn btn-secondary btn-small add-bank-btn"
                  onClick={() => setShowQuestionBankInput(true)}
                >
                  <Plus size={14} /> Thêm câu hỏi
                </button>
              )}
            </div>
          </div>

          {/* Answer Bank Section */}
          <div className="form-section">
            <label>
              <MessageCircle size={16} />
              Kho câu trả lời ({(topicForm.answerBank || []).length})
            </label>
            <p className="form-hint">Các mẫu câu trả lời để AI hiểu ngữ cảnh và đánh giá người học</p>
            <div className="bank-list">
              {(topicForm.answerBank || []).map(item => (
                <div key={item.id} className="bank-item">
                  <div className="bank-content">
                    <span className="bank-ja">{item.answerJa}</span>
                    {item.answerVi && <span className="bank-vi">{item.answerVi}</span>}
                    <span className="bank-level">{item.level}</span>
                  </div>
                  <button
                    className="btn-icon small danger"
                    onClick={() => handleRemoveAnswerBank(item.id)}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {showAnswerBankInput ? (
                <div className="bank-input-row">
                  <textarea
                    placeholder="Câu trả lời tiếng Nhật"
                    value={answerBankForm.answerJa}
                    onChange={e => setAnswerBankForm({ ...answerBankForm, answerJa: e.target.value })}
                    rows={2}
                  />
                  <input
                    type="text"
                    placeholder="Dịch nghĩa (tùy chọn)"
                    value={answerBankForm.answerVi}
                    onChange={e => setAnswerBankForm({ ...answerBankForm, answerVi: e.target.value })}
                  />
                  <select
                    value={answerBankForm.level}
                    onChange={e => setAnswerBankForm({ ...answerBankForm, level: e.target.value as JLPTLevel })}
                  >
                    {JLPT_LEVELS.map(l => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                  <div className="bank-input-actions">
                    <button className="btn btn-primary btn-small" onClick={handleAddAnswerBank}>
                      Thêm
                    </button>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => {
                        setShowAnswerBankInput(false);
                        setAnswerBankForm({ answerJa: '', answerVi: '', level: topicForm.level, tags: [] });
                      }}
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="btn btn-secondary btn-small add-bank-btn"
                  onClick={() => setShowAnswerBankInput(true)}
                >
                  <Plus size={14} /> Thêm câu trả lời
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
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={onSave} disabled={!topicForm.name.trim()}>
            {editingTopic ? 'Cập nhật' : 'Tạo chủ đề'}
          </button>
        </div>
    </ModalShell>
  );
}
