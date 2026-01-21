// Kaiwa Start Screen - Setup UI for starting a conversation session
// Handles level/style/topic selection, default questions, and advanced topics

import { useMemo } from 'react';
import {
  MessagesSquare,
  Star,
  X,
  ListChecks,
  ChevronRight,
  Folder,
  FileText,
  ArrowLeft,
  BookOpen,
  MessageCircle,
} from 'lucide-react';
import type { JLPTLevel, ConversationStyle, ConversationTopic, KaiwaScenario } from '../../types/kaiwa';
import type { KaiwaDefaultQuestion, KaiwaFolder } from '../../types/kaiwa-question';
import type { KaiwaAdvancedTopic, KaiwaAdvancedQuestion } from '../../types/kaiwa-advanced';
import { JLPT_LEVELS, CONVERSATION_STYLES, CONVERSATION_TOPICS } from '../../constants/kaiwa';

// Session mode type
export type SessionMode = 'default' | 'advanced';

// Navigation state for question selector
export type QuestionSelectorState =
  | { type: 'hidden' }
  | { type: 'level' }
  | { type: 'topic'; level: JLPTLevel }
  | { type: 'list'; level: JLPTLevel; topic: ConversationTopic; folderId?: string; folderName?: string };

interface KaiwaStartScreenProps {
  // Settings
  level: JLPTLevel;
  style: ConversationStyle;
  topic: ConversationTopic;
  slowMode: boolean;
  voiceGender: 'male' | 'female';
  recognitionSupported: boolean;

  // Session mode
  sessionMode: SessionMode;
  onSessionModeChange: (mode: SessionMode) => void;

  // Level/style/topic handlers
  onLevelChange: (level: JLPTLevel) => void;
  onStyleChange: (style: ConversationStyle) => void;
  onTopicChange: (topic: ConversationTopic) => void;
  onSlowModeChange: (enabled: boolean) => void;

  // Default questions
  defaultQuestions: KaiwaDefaultQuestion[];
  questionSelectorState: QuestionSelectorState;
  selectedDefaultQuestion: KaiwaDefaultQuestion | null;
  onQuestionSelectorStateChange: (state: QuestionSelectorState) => void;
  onSelectDefaultQuestion: (question: KaiwaDefaultQuestion | null) => void;
  getFoldersByLevelAndTopic?: (level: JLPTLevel, topic: ConversationTopic) => KaiwaFolder[];
  getQuestionsByFolder?: (folderId: string) => KaiwaDefaultQuestion[];
  getQuestionsByLevelAndTopic?: (level: JLPTLevel, topic: ConversationTopic) => KaiwaDefaultQuestion[];

  // Advanced topics
  advancedTopics: KaiwaAdvancedTopic[];
  advancedQuestions: KaiwaAdvancedQuestion[];
  selectedAdvancedTopic: KaiwaAdvancedTopic | null;
  selectedAdvancedQuestion: KaiwaAdvancedQuestion | null;
  onSelectAdvancedTopic: (topic: KaiwaAdvancedTopic | null) => void;
  onSelectAdvancedQuestion: (question: KaiwaAdvancedQuestion | null) => void;
  getAdvancedQuestionsByTopic?: (topicId: string) => KaiwaAdvancedQuestion[];

  // Scenario/role
  selectedScenario: KaiwaScenario | null;
  userRole: string | null;
  onUserRoleChange: (roleId: string) => void;

  // Actions
  onStart: () => void;
}

export function KaiwaStartScreen({
  level,
  style,
  topic,
  slowMode,
  voiceGender,
  recognitionSupported,
  sessionMode,
  onSessionModeChange,
  onLevelChange,
  onStyleChange,
  onTopicChange,
  onSlowModeChange,
  defaultQuestions,
  questionSelectorState,
  selectedDefaultQuestion,
  onQuestionSelectorStateChange,
  onSelectDefaultQuestion,
  getFoldersByLevelAndTopic,
  getQuestionsByFolder,
  getQuestionsByLevelAndTopic,
  advancedTopics,
  advancedQuestions,
  selectedAdvancedTopic,
  selectedAdvancedQuestion,
  onSelectAdvancedTopic,
  onSelectAdvancedQuestion,
  getAdvancedQuestionsByTopic,
  selectedScenario,
  userRole,
  onUserRoleChange,
  onStart,
}: KaiwaStartScreenProps) {
  const hasDefaultQuestions = defaultQuestions.length > 0;

  // Get questions for selector
  const questionsForSelector = useMemo(() => {
    if (questionSelectorState.type !== 'list') return [];
    if (questionSelectorState.folderId && getQuestionsByFolder) {
      return getQuestionsByFolder(questionSelectorState.folderId);
    }
    if (getQuestionsByLevelAndTopic) {
      return getQuestionsByLevelAndTopic(questionSelectorState.level, questionSelectorState.topic);
    }
    return [];
  }, [questionSelectorState, getQuestionsByFolder, getQuestionsByLevelAndTopic]);

  // Get folders for selector
  const foldersForSelector = useMemo(() => {
    if (questionSelectorState.type !== 'list') return [];
    if (getFoldersByLevelAndTopic) {
      return getFoldersByLevelAndTopic(questionSelectorState.level, questionSelectorState.topic);
    }
    return [];
  }, [questionSelectorState, getFoldersByLevelAndTopic]);

  // Get questions for advanced topic
  const advancedQuestionsForTopic = useMemo(() => {
    if (!selectedAdvancedTopic) return [];
    if (getAdvancedQuestionsByTopic) {
      return getAdvancedQuestionsByTopic(selectedAdvancedTopic.id);
    }
    return advancedQuestions.filter(q => q.topicId === selectedAdvancedTopic.id);
  }, [selectedAdvancedTopic, advancedQuestions, getAdvancedQuestionsByTopic]);

  // Check if start is disabled
  const isStartDisabled = sessionMode === 'advanced' && !selectedAdvancedTopic;

  // Get start button text
  const getStartButtonText = () => {
    if (sessionMode === 'advanced' && selectedAdvancedTopic) {
      return `Bắt đầu: ${selectedAdvancedTopic.name}`;
    }
    if (selectedDefaultQuestion) {
      return 'Bắt đầu với câu hỏi đã chọn';
    }
    return 'Bắt đầu hội thoại';
  };

  return (
    <div className="kaiwa-page kaiwa-page-start">
      <div className="kaiwa-container">
        <div className="kaiwa-start-screen">
          <h2>会話練習 - Luyện Hội Thoại</h2>
          <p className="kaiwa-description">
            Luyện tập hội thoại tiếng Nhật với trợ lý AI. Bạn có thể nói hoặc gõ để trả lời.
          </p>

          {/* Session Mode Selector */}
          {advancedTopics.length > 0 && (
            <div className="kaiwa-session-mode-selector">
              <button
                className={`session-mode-btn ${sessionMode === 'default' ? 'active' : ''}`}
                onClick={() => {
                  onSessionModeChange('default');
                  onSelectAdvancedTopic(null);
                  onSelectAdvancedQuestion(null);
                }}
              >
                <MessagesSquare size={18} />
                <span>Hội thoại cơ bản</span>
              </button>
              <button
                className={`session-mode-btn ${sessionMode === 'advanced' ? 'active' : ''}`}
                onClick={() => {
                  onSessionModeChange('advanced');
                  onSelectDefaultQuestion(null);
                  onQuestionSelectorStateChange({ type: 'hidden' });
                }}
              >
                <Star size={18} />
                <span>Session nâng cao</span>
              </button>
            </div>
          )}

          {/* Advanced Session - Topic Selector */}
          {sessionMode === 'advanced' && advancedTopics.length > 0 && (
            <div className="kaiwa-advanced-session">
              <div className="advanced-session-header">
                <h3><Star size={18} /> Chọn chủ đề nâng cao</h3>
                {selectedAdvancedTopic && (
                  <button
                    className="kaiwa-clear-selection-btn"
                    onClick={() => {
                      onSelectAdvancedTopic(null);
                      onSelectAdvancedQuestion(null);
                    }}
                  >
                    <X size={14} /> Bỏ chọn
                  </button>
                )}
              </div>

              {/* Topics Grid */}
              {!selectedAdvancedTopic && (
                <div className="advanced-topics-grid">
                  {advancedTopics.map(t => (
                    <button
                      key={t.id}
                      className="advanced-topic-card"
                      style={{ '--topic-color': t.color } as React.CSSProperties}
                      onClick={() => onSelectAdvancedTopic(t)}
                    >
                      <span className="topic-icon" style={{ backgroundColor: `${t.color}20` }}>
                        {t.icon}
                      </span>
                      <div className="topic-info">
                        <span className="topic-name">{t.name}</span>
                        <span className="topic-meta">
                          <span className="topic-level">{t.level}</span>
                          <span className="topic-count">
                            <MessageCircle size={12} /> {t.questionCount || 0}
                          </span>
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Topic Preview */}
              {selectedAdvancedTopic && (
                <div className="advanced-topic-selected" style={{ '--topic-color': selectedAdvancedTopic.color } as React.CSSProperties}>
                  <div className="selected-topic-header">
                    <span className="topic-icon" style={{ backgroundColor: `${selectedAdvancedTopic.color}20` }}>
                      {selectedAdvancedTopic.icon}
                    </span>
                    <div className="topic-details">
                      <h4>{selectedAdvancedTopic.name}</h4>
                      <p>{selectedAdvancedTopic.description}</p>
                      <div className="topic-badges">
                        <span className="badge">{selectedAdvancedTopic.level}</span>
                        <span className="badge">{CONVERSATION_STYLES.find(s => s.value === selectedAdvancedTopic.style)?.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Topic Vocabulary Preview */}
                  {selectedAdvancedTopic.vocabulary && selectedAdvancedTopic.vocabulary.length > 0 && (
                    <div className="topic-vocab-preview">
                      <h5><BookOpen size={14} /> Từ vựng ({selectedAdvancedTopic.vocabulary.length})</h5>
                      <div className="vocab-chips">
                        {selectedAdvancedTopic.vocabulary.slice(0, 8).map(vocab => (
                          <span key={vocab.id} className="vocab-chip">
                            {vocab.word}
                            <span className="vocab-meaning">{vocab.meaning}</span>
                          </span>
                        ))}
                        {selectedAdvancedTopic.vocabulary.length > 8 && (
                          <span className="vocab-chip more">+{selectedAdvancedTopic.vocabulary.length - 8}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Question Selector */}
                  {advancedQuestionsForTopic.length > 0 && (
                    <div className="topic-questions-selector">
                      <h5><MessageCircle size={14} /> Chọn câu hỏi (hoặc để ngẫu nhiên)</h5>
                      <div className="questions-list">
                        {advancedQuestionsForTopic.map((q, idx) => (
                          <button
                            key={q.id}
                            className={`question-item ${selectedAdvancedQuestion?.id === q.id ? 'selected' : ''}`}
                            onClick={() => onSelectAdvancedQuestion(
                              selectedAdvancedQuestion?.id === q.id ? null : q
                            )}
                          >
                            <span className="question-num">{idx + 1}</span>
                            <div className="question-text">
                              <span className="ja">{q.questionJa}</span>
                              {q.questionVi && <span className="vi">{q.questionVi}</span>}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Default question selector section */}
          {sessionMode === 'default' && hasDefaultQuestions && (
            <div className="kaiwa-question-selector-section">
              <div className="kaiwa-selector-header">
                <button
                  className={`kaiwa-mode-btn ${questionSelectorState.type !== 'hidden' ? 'active' : ''}`}
                  onClick={() => onQuestionSelectorStateChange(
                    questionSelectorState.type === 'hidden' ? { type: 'level' } : { type: 'hidden' }
                  )}
                >
                  <ListChecks size={18} />
                  {questionSelectorState.type === 'hidden' ? 'Chọn câu hỏi mặc định' : 'Ẩn danh sách'}
                </button>
                {selectedDefaultQuestion && (
                  <button
                    className="kaiwa-clear-selection-btn"
                    onClick={() => {
                      onSelectDefaultQuestion(null);
                      onQuestionSelectorStateChange({ type: 'hidden' });
                    }}
                  >
                    <X size={14} /> Bỏ chọn
                  </button>
                )}
              </div>

              {/* Selected question preview */}
              {selectedDefaultQuestion && (
                <div className="kaiwa-selected-question-preview">
                  <div className="selected-question-badges">
                    <span className="badge">{selectedDefaultQuestion.level}</span>
                    <span className="badge">{CONVERSATION_TOPICS.find(t => t.value === selectedDefaultQuestion.topic)?.label}</span>
                    <span className="badge">{CONVERSATION_STYLES.find(s => s.value === selectedDefaultQuestion.style)?.label}</span>
                  </div>
                  <p className="selected-question-text">{selectedDefaultQuestion.questionJa}</p>
                  {selectedDefaultQuestion.questionVi && (
                    <p className="selected-question-vi">{selectedDefaultQuestion.questionVi}</p>
                  )}
                  {selectedDefaultQuestion.situationContext && (
                    <p className="selected-question-context">📍 {selectedDefaultQuestion.situationContext}</p>
                  )}
                </div>
              )}

              {/* Question selector navigation */}
              {questionSelectorState.type !== 'hidden' && (
                <div className="kaiwa-question-selector">
                  {/* Breadcrumb */}
                  <div className="selector-breadcrumb">
                    {questionSelectorState.type === 'level' && (
                      <span>Chọn cấp độ</span>
                    )}
                    {questionSelectorState.type === 'topic' && (
                      <>
                        <button onClick={() => onQuestionSelectorStateChange({ type: 'level' })}>
                          <ArrowLeft size={14} />
                        </button>
                        <span>{questionSelectorState.level}</span>
                        <ChevronRight size={14} />
                        <span>Chọn chủ đề</span>
                      </>
                    )}
                    {questionSelectorState.type === 'list' && (
                      <>
                        <button onClick={() => onQuestionSelectorStateChange({ type: 'topic', level: questionSelectorState.level })}>
                          <ArrowLeft size={14} />
                        </button>
                        <span>{questionSelectorState.level}</span>
                        <ChevronRight size={14} />
                        <span>{CONVERSATION_TOPICS.find(t => t.value === questionSelectorState.topic)?.label}</span>
                        {questionSelectorState.folderName && (
                          <>
                            <ChevronRight size={14} />
                            <span>{questionSelectorState.folderName}</span>
                          </>
                        )}
                      </>
                    )}
                  </div>

                  {/* Level selection */}
                  {questionSelectorState.type === 'level' && (
                    <div className="selector-grid levels">
                      {JLPT_LEVELS.map(l => (
                        <button
                          key={l.value}
                          className="selector-item level"
                          onClick={() => onQuestionSelectorStateChange({ type: 'topic', level: l.value })}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Topic selection */}
                  {questionSelectorState.type === 'topic' && (
                    <div className="selector-grid topics">
                      {CONVERSATION_TOPICS.filter(t => t.value !== 'free').map(t => (
                        <button
                          key={t.value}
                          className="selector-item topic"
                          onClick={() => onQuestionSelectorStateChange({
                            type: 'list',
                            level: questionSelectorState.level,
                            topic: t.value,
                          })}
                        >
                          <span className="topic-icon">{t.icon}</span>
                          <span className="topic-label">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Question list */}
                  {questionSelectorState.type === 'list' && (
                    <div className="selector-question-list">
                      {/* Show folders if not inside a folder */}
                      {!questionSelectorState.folderId && foldersForSelector.length > 0 && (
                        <div className="selector-folders">
                          {foldersForSelector.map(folder => (
                            <button
                              key={folder.id}
                              className="selector-folder-btn"
                              onClick={() => onQuestionSelectorStateChange({
                                ...questionSelectorState,
                                folderId: folder.id,
                                folderName: folder.name,
                              })}
                            >
                              <Folder size={16} />
                              <span>{folder.name}</span>
                              <ChevronRight size={14} />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Show questions */}
                      <div className="selector-questions">
                        {questionsForSelector.map(q => (
                          <button
                            key={q.id}
                            className={`selector-question-btn ${selectedDefaultQuestion?.id === q.id ? 'selected' : ''}`}
                            onClick={() => {
                              onSelectDefaultQuestion(q);
                              onLevelChange(q.level);
                              onStyleChange(q.style);
                              onTopicChange(q.topic);
                              onQuestionSelectorStateChange({ type: 'hidden' });
                            }}
                          >
                            <FileText size={14} />
                            <div className="question-content">
                              <span className="question-ja">{q.questionJa}</span>
                              {q.questionVi && <span className="question-vi">{q.questionVi}</span>}
                            </div>
                          </button>
                        ))}
                        {questionsForSelector.length === 0 && (
                          <p className="no-questions">Chưa có câu hỏi nào trong mục này</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Free conversation setup */}
          {!selectedDefaultQuestion && !(sessionMode === 'advanced' && selectedAdvancedTopic) && (
            <div className="kaiwa-setup">
              <div className="kaiwa-setup-row">
                <div className="kaiwa-setup-item">
                  <label>Cấp độ JLPT</label>
                  <select value={level} onChange={e => onLevelChange(e.target.value as JLPTLevel)}>
                    {JLPT_LEVELS.map(l => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>

                <div className="kaiwa-setup-item">
                  <label>Phong cách nói</label>
                  <select value={style} onChange={e => onStyleChange(e.target.value as ConversationStyle)}>
                    {CONVERSATION_STYLES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="kaiwa-setup-item kaiwa-topic-section">
                <label>Chủ đề hội thoại</label>
                <div className="kaiwa-topic-grid">
                  {CONVERSATION_TOPICS.map(t => (
                    <button
                      key={t.value}
                      className={`kaiwa-topic-btn ${topic === t.value ? 'active' : ''}`}
                      onClick={() => onTopicChange(t.value)}
                    >
                      <span className="topic-icon">{t.icon}</span>
                      <span className="topic-label">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Role Selector - shows when scenario topic is selected */}
              {selectedScenario && (
                <div className="kaiwa-setup-item kaiwa-role-section">
                  <label>
                    Chọn vai trò của bạn
                  </label>
                  <div className="kaiwa-role-grid">
                    {selectedScenario.roles.map(role => (
                      <button
                        key={role.id}
                        className={`kaiwa-role-btn ${userRole === role.id ? 'active' : ''}`}
                        onClick={() => onUserRoleChange(role.id)}
                      >
                        <span className="role-emoji">{role.emoji}</span>
                        <span className="role-name">{role.name}</span>
                        <span className="role-name-vi">{role.nameVi}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="kaiwa-setup-item kaiwa-options-row">
            <label>
              <input
                type="checkbox"
                checked={slowMode}
                onChange={e => onSlowModeChange(e.target.checked)}
              />
              Chế độ chậm (luyện nghe)
            </label>
            <span className="kaiwa-voice-info">
              Giọng: {voiceGender === 'female' ? 'Nữ' : 'Nam'}
            </span>
          </div>

          {!recognitionSupported && (
            <p className="kaiwa-warning">
              Trình duyệt không hỗ trợ nhận dạng giọng nói. Vui lòng dùng Chrome.
            </p>
          )}

          <button
            className="btn btn-primary btn-large"
            onClick={onStart}
            disabled={isStartDisabled}
          >
            {getStartButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
}
