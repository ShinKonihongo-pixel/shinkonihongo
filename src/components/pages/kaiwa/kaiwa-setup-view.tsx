// Kaiwa setup/configuration UI component
// Extracted from kaiwa-page.tsx - handles mode selection, topic selection, and start button

import {
  MessagesSquare,
  Mic,
  X,
  ChevronRight,
  Folder,
  FileText,
  ArrowLeft,
  ListChecks,
  Users,
  Star,
  BookOpen,
  MessageCircle,
  Sparkles,
  Play,
  Volume2,
  Zap,
} from 'lucide-react';
import type { JLPTLevel, ConversationStyle, ConversationTopic } from '../../../types/kaiwa';
import type { SessionMode } from './kaiwa-types';
import { JLPT_LEVELS, CONVERSATION_STYLES, CONVERSATION_TOPICS } from '../../../constants/kaiwa';
import { SpeakingPracticeMode } from '../../kaiwa';

interface KaiwaSetupViewProps {
  // State from hook
  sessionMode: SessionMode;
  level: JLPTLevel;
  style: ConversationStyle;
  topic: ConversationTopic;
  slowMode: boolean;
  questionSelectorState: any;
  selectedDefaultQuestion: any;
  selectedAdvancedTopic: any;
  selectedAdvancedQuestion: any;
  selectedCustomTopic: any;
  selectedScenario: any;
  userRole: string | null;

  // Data
  defaultQuestions: any[];
  advancedTopics: any[];
  customTopics: any[];
  settings: any;

  // Setters
  setSessionMode: (mode: SessionMode) => void;
  setLevel: (level: JLPTLevel) => void;
  setStyle: (style: ConversationStyle) => void;
  setSlowMode: (slow: boolean) => void;
  setQuestionSelectorState: (state: any) => void;
  setSelectedDefaultQuestion: (q: any) => void;
  setSelectedAdvancedTopic: (t: any) => void;
  setSelectedAdvancedQuestion: (q: any) => void;
  setSelectedCustomTopic: (t: any) => void;
  setSelectedCustomQuestion: (q: any) => void;
  setUserRole: (role: string | null) => void;

  // Handlers
  handleTopicChange: (topic: ConversationTopic) => void;
  handleStart: () => void;

  // Computed
  getQuestionsForSelector: () => any[];
  getFoldersForSelector: () => any[];
  getAdvancedQuestionsForTopic: () => any[];
  getCustomQuestionsForTopic: () => any[];

  // Speech support
  recognitionSupported: boolean;
}

export function KaiwaSetupView(props: KaiwaSetupViewProps) {
  const {
    sessionMode,
    level,
    style,
    topic,
    slowMode,
    questionSelectorState,
    selectedDefaultQuestion,
    selectedAdvancedTopic,
    selectedAdvancedQuestion,
    selectedCustomTopic,
    selectedScenario,
    userRole,
    defaultQuestions,
    advancedTopics,
    customTopics,
    settings,
    setSessionMode,
    setLevel,
    setStyle,
    setSlowMode,
    setQuestionSelectorState,
    setSelectedDefaultQuestion,
    setSelectedAdvancedTopic,
    setSelectedAdvancedQuestion,
    setSelectedCustomTopic,
    setSelectedCustomQuestion,
    setUserRole,
    handleTopicChange,
    handleStart,
    getQuestionsForSelector,
    getFoldersForSelector,
    getAdvancedQuestionsForTopic,
    getCustomQuestionsForTopic,
    recognitionSupported,
  } = props;

  const hasDefaultQuestions = defaultQuestions.length > 0;

  return (
    <div className="kaiwa-page kaiwa-page-start">
      <div className="kaiwa-container">
        <div className="kaiwa-start-screen">
          {/* Hero section */}
          <div className="kaiwa-hero">
            <div className="kaiwa-hero-icon-wrap">
              <div className="kaiwa-hero-ring" />
              <div className="kaiwa-hero-ring ring-2" />
              <div className="kaiwa-hero-icon">💬</div>
            </div>
            <h2>会話練習</h2>
            <span className="kaiwa-hero-subtitle">Luyện Hội Thoại</span>
            <p className="kaiwa-description">
              Luyện tập hội thoại tiếng Nhật với trợ lý AI
            </p>
          </div>

          {/* Section: Chọn chế độ */}
          <div className="kaiwa-section">
            <div className="kaiwa-section-header">
              <div className="kaiwa-section-line" />
              <span className="kaiwa-section-label">
                <span className="kaiwa-step-badge">1</span>
                Chọn chế độ
              </span>
              <div className="kaiwa-section-line" />
            </div>

            <div className="kaiwa-mode-cards">
              <button
                className={`kaiwa-mode-card ${sessionMode === 'default' ? 'active' : ''}`}
                onClick={() => {
                  setSessionMode('default');
                  setSelectedAdvancedTopic(null);
                  setSelectedAdvancedQuestion(null);
                  setSelectedCustomTopic(null);
                  setSelectedCustomQuestion(null);
                }}
              >
                <div className="mode-card-icon"><MessagesSquare size={22} /></div>
                <span className="mode-card-title">Hội thoại</span>
                <span className="mode-card-desc">Luyện giao tiếp tự nhiên</span>
              </button>
              <button
                className={`kaiwa-mode-card ${sessionMode === 'speaking' ? 'active' : ''}`}
                onClick={() => {
                  setSessionMode('speaking');
                  setSelectedDefaultQuestion(null);
                  setQuestionSelectorState({ type: 'hidden' });
                  setSelectedAdvancedTopic(null);
                  setSelectedAdvancedQuestion(null);
                  setSelectedCustomTopic(null);
                  setSelectedCustomQuestion(null);
                }}
              >
                <div className="mode-card-icon"><Mic size={22} /></div>
                <span className="mode-card-title">Luyện nói</span>
                <span className="mode-card-desc">Luyện phát âm theo mẫu</span>
              </button>
              {advancedTopics.length > 0 && (
                <button
                  className={`kaiwa-mode-card ${sessionMode === 'advanced' ? 'active' : ''}`}
                  onClick={() => {
                    setSessionMode('advanced');
                    setSelectedDefaultQuestion(null);
                    setQuestionSelectorState({ type: 'hidden' });
                    setSelectedCustomTopic(null);
                    setSelectedCustomQuestion(null);
                  }}
                >
                  <div className="mode-card-icon"><Sparkles size={22} /></div>
                  <span className="mode-card-title">Nâng cao</span>
                  <span className="mode-card-desc">Chủ đề chuyên sâu</span>
                </button>
              )}
              {customTopics.length > 0 && (
                <button
                  className={`kaiwa-mode-card ${sessionMode === 'custom' ? 'active' : ''}`}
                  onClick={() => {
                    setSessionMode('custom');
                    setSelectedDefaultQuestion(null);
                    setQuestionSelectorState({ type: 'hidden' });
                    setSelectedAdvancedTopic(null);
                    setSelectedAdvancedQuestion(null);
                  }}
                >
                  <div className="mode-card-icon"><BookOpen size={22} /></div>
                  <span className="mode-card-title">Mở rộng</span>
                  <span className="mode-card-desc">Chủ đề tùy chỉnh</span>
                </button>
              )}
            </div>
          </div>

          {/* Speaking Practice Mode */}
          {sessionMode === 'speaking' && (
            <SpeakingPracticeMode
              defaultLevel={settings.kaiwaDefaultLevel}
              voiceGender={settings.kaiwaVoiceGender}
              voiceRate={settings.kaiwaVoiceRate}
              showFurigana={settings.kaiwaShowFurigana}
              onClose={() => setSessionMode('default')}
            />
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
                      setSelectedAdvancedTopic(null);
                      setSelectedAdvancedQuestion(null);
                    }}
                  >
                    <X size={14} /> Bỏ chọn
                  </button>
                )}
              </div>

              {/* Topics Grid */}
              {!selectedAdvancedTopic && (
                <div className="advanced-topics-grid">
                  {advancedTopics.map((topic: any) => (
                    <button
                      key={topic.id}
                      className="advanced-topic-card"
                      style={{ '--topic-color': topic.color } as React.CSSProperties}
                      onClick={() => setSelectedAdvancedTopic(topic)}
                    >
                      <span className="topic-icon" style={{ backgroundColor: `${topic.color}20` }}>
                        {topic.icon}
                      </span>
                      <div className="topic-info">
                        <span className="topic-name">{topic.name}</span>
                        <span className="topic-meta">
                          <span className="topic-level">{topic.level}</span>
                          <span className="topic-count">
                            <MessageCircle size={12} /> {topic.questionCount || 0}
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
                        {selectedAdvancedTopic.vocabulary.slice(0, 8).map((vocab: any) => (
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
                  {getAdvancedQuestionsForTopic().length > 0 && (
                    <div className="topic-questions-selector">
                      <h5><MessageCircle size={14} /> Chọn câu hỏi (hoặc để ngẫu nhiên)</h5>
                      <div className="questions-list">
                        {getAdvancedQuestionsForTopic().map((q: any, idx: number) => (
                          <button
                            key={q.id}
                            className={`question-item ${selectedAdvancedQuestion?.id === q.id ? 'selected' : ''}`}
                            onClick={() => setSelectedAdvancedQuestion(
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

          {/* Custom Topics Session Selector */}
          {sessionMode === 'custom' && customTopics.length > 0 && (
            <div className="kaiwa-custom-session">
              <div className="custom-session-header">
                <h3><BookOpen size={18} /> Chọn chủ đề mở rộng</h3>
              </div>

              {/* Custom Topics Grid */}
              <div className="custom-topics-grid">
                {customTopics.map((topic: any) => (
                  <button
                    key={topic.id}
                    className={`custom-topic-card ${selectedCustomTopic?.id === topic.id ? 'selected' : ''}`}
                    style={{ '--topic-color': topic.color } as React.CSSProperties}
                    onClick={() => setSelectedCustomTopic(
                      selectedCustomTopic?.id === topic.id ? null : topic
                    )}
                  >
                    <span className="topic-icon" style={{ backgroundColor: `${topic.color}20` }}>
                      {topic.icon}
                    </span>
                    <div className="topic-info">
                      <span className="topic-name">{topic.name}</span>
                      <span className="topic-meta">
                        <span className="topic-count">
                          <MessageCircle size={12} /> {topic.questionCount || 0}
                        </span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Start Conversation Button */}
              <div className="custom-start-section">
                <button
                  className={`kaiwa-start-btn ${selectedCustomTopic ? 'active' : 'disabled'}`}
                  disabled={!selectedCustomTopic}
                  onClick={() => {
                    if (selectedCustomTopic) {
                      const topicQuestions = getCustomQuestionsForTopic();
                      if (topicQuestions.length > 0) {
                        const randomQuestion = topicQuestions[Math.floor(Math.random() * topicQuestions.length)];
                        setSelectedCustomQuestion(randomQuestion);
                      }
                      handleStart();
                    }
                  }}
                >
                  <MessagesSquare size={20} />
                  Bắt đầu hội thoại
                </button>
                {selectedCustomTopic && (
                  <p className="start-hint">
                    AI sẽ ngẫu nhiên chọn câu hỏi hoặc sử dụng nguồn từ vựng để luyện giao tiếp
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Default question selector section */}
          {sessionMode === 'default' && hasDefaultQuestions && (
            <div className="kaiwa-question-selector-section">
              <div className="kaiwa-selector-header">
                <button
                  className={`kaiwa-mode-btn ${questionSelectorState.type !== 'hidden' ? 'active' : ''}`}
                  onClick={() => setQuestionSelectorState(
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
                      setSelectedDefaultQuestion(null);
                      setQuestionSelectorState({ type: 'hidden' });
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
                        <button onClick={() => setQuestionSelectorState({ type: 'level' })}>
                          <ArrowLeft size={14} />
                        </button>
                        <span>{questionSelectorState.level}</span>
                        <ChevronRight size={14} />
                        <span>Chọn chủ đề</span>
                      </>
                    )}
                    {questionSelectorState.type === 'list' && (
                      <>
                        <button onClick={() => setQuestionSelectorState({ type: 'topic', level: questionSelectorState.level })}>
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
                          onClick={() => setQuestionSelectorState({ type: 'topic', level: l.value })}
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
                          onClick={() => setQuestionSelectorState({
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
                      {!questionSelectorState.folderId && getFoldersForSelector().length > 0 && (
                        <div className="selector-folders">
                          {getFoldersForSelector().map((folder: any) => (
                            <button
                              key={folder.id}
                              className="selector-folder-btn"
                              onClick={() => setQuestionSelectorState({
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
                        {getQuestionsForSelector().map((q: any) => (
                          <button
                            key={q.id}
                            className={`selector-question-btn ${selectedDefaultQuestion?.id === q.id ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedDefaultQuestion(q);
                              setLevel(q.level);
                              setStyle(q.style);
                              handleTopicChange(q.topic);
                              setQuestionSelectorState({ type: 'hidden' });
                            }}
                          >
                            <FileText size={14} />
                            <div className="question-content">
                              <span className="question-ja">{q.questionJa}</span>
                              {q.questionVi && <span className="question-vi">{q.questionVi}</span>}
                            </div>
                          </button>
                        ))}
                        {getQuestionsForSelector().length === 0 && (
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
          {!selectedDefaultQuestion && sessionMode !== 'advanced' && sessionMode !== 'custom' && sessionMode !== 'speaking' && (
            <>
              <div className="kaiwa-section-header">
                <div className="kaiwa-section-line" />
                <span className="kaiwa-section-label">
                  <span className="kaiwa-step-badge">2</span>
                  Tùy chỉnh
                </span>
                <div className="kaiwa-section-line" />
              </div>
              <div className="kaiwa-setup">
              <div className="kaiwa-setup-row-inline">
                <div className="kaiwa-setup-col">
                  <label>Cấp độ JLPT</label>
                  <div className="kaiwa-level-pills">
                    {JLPT_LEVELS.map(l => (
                      <button
                        key={l.value}
                        className={`kaiwa-pill ${level === l.value ? 'active' : ''}`}
                        onClick={() => setLevel(l.value as JLPTLevel)}
                      >{l.label}</button>
                    ))}
                  </div>
                </div>
                <div className="kaiwa-setup-col">
                  <label>Phong cách nói</label>
                  <div className="kaiwa-style-pills">
                    {CONVERSATION_STYLES.map(s => (
                      <button
                        key={s.value}
                        className={`kaiwa-pill ${style === s.value ? 'active' : ''}`}
                        onClick={() => setStyle(s.value as ConversationStyle)}
                      >{s.label}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="kaiwa-setup-divider" />

              <div className="kaiwa-setup-item kaiwa-topic-section">
                <label>Chủ đề hội thoại</label>
                <div className="kaiwa-topic-grid">
                  {CONVERSATION_TOPICS.map(t => (
                    <button
                      key={t.value}
                      className={`kaiwa-topic-btn ${topic === t.value ? 'active' : ''}`}
                      onClick={() => handleTopicChange(t.value)}
                    >
                      <span className="topic-icon">{t.icon}</span>
                      <span className="topic-label">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Role Selector */}
              {selectedScenario && (
                <div className="kaiwa-setup-item kaiwa-role-section">
                  <label>
                    <Users size={16} />
                    Chọn vai trò của bạn
                  </label>
                  <div className="kaiwa-role-grid">
                    {selectedScenario.roles.map((role: any) => (
                      <button
                        key={role.id}
                        className={`kaiwa-role-btn ${userRole === role.id ? 'active' : ''}`}
                        onClick={() => setUserRole(role.id)}
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
            </>
          )}

          {/* Launch section */}
          {sessionMode !== 'custom' && sessionMode !== 'speaking' && (
            <>
              <div className="kaiwa-section-header">
                <div className="kaiwa-section-line" />
                <span className="kaiwa-section-label">
                  <span className="kaiwa-step-badge">3</span>
                  Bắt đầu
                </span>
                <div className="kaiwa-section-line" />
              </div>
              <div className="kaiwa-launch-section">
              <div className="kaiwa-options-bar">
                <button
                  className={`kaiwa-toggle-option ${slowMode ? 'active' : ''}`}
                  onClick={() => setSlowMode(!slowMode)}
                >
                  <Volume2 size={15} />
                  <span>Chế độ chậm</span>
                  <div className={`kaiwa-toggle-switch ${slowMode ? 'on' : ''}`}>
                    <div className="kaiwa-toggle-thumb" />
                  </div>
                </button>
                <div className="kaiwa-voice-badge">
                  <Mic size={13} />
                  {settings.kaiwaVoiceGender === 'female' ? 'Nữ' : 'Nam'}
                </div>
              </div>

              {!recognitionSupported && (
                <div className="kaiwa-warning">
                  <Zap size={16} />
                  <span>Trình duyệt không hỗ trợ nhận dạng giọng nói. Vui lòng dùng Chrome.</span>
                </div>
              )}

              <button
                className="kaiwa-cta-btn"
                onClick={handleStart}
                disabled={sessionMode === 'advanced' && !selectedAdvancedTopic}
              >
                <span className="kaiwa-cta-shimmer" />
                <Play size={20} />
                <span>
                  {sessionMode === 'advanced' && selectedAdvancedTopic
                    ? `Bắt đầu: ${selectedAdvancedTopic.name}`
                    : selectedDefaultQuestion
                      ? 'Bắt đầu với câu hỏi đã chọn'
                      : 'Bắt đầu hội thoại'}
                </span>
              </button>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
