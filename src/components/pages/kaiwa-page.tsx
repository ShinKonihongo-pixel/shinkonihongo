// Kaiwa (Japanese conversation) practice page with AI assistant

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { AppSettings } from '../../hooks/use-settings';
import type { KaiwaMessage, KaiwaContext, JLPTLevel, ConversationStyle, ConversationTopic, PronunciationResult, AnswerTemplate, SuggestedAnswer } from '../../types/kaiwa';
import type { KaiwaDefaultQuestion, KaiwaFolder } from '../../types/kaiwa-question';
import { useSpeech, comparePronunciation } from '../../hooks/use-speech';
import { useGroq } from '../../hooks/use-groq';
import { JLPT_LEVELS, CONVERSATION_STYLES, CONVERSATION_TOPICS, getStyleDisplay } from '../../constants/kaiwa';
import { KaiwaMessageItem, KaiwaPracticeModal, KaiwaAnalysisModal, KaiwaAnswerTemplate } from '../kaiwa';
import type { VocabularyHint } from '../../types/kaiwa';
import { removeFurigana } from '../../lib/furigana-utils';
import { FuriganaText } from '../common/furigana-text';
import {
  Sparkles,
  MessagesSquare,
  CircleHelp,
  Mic,
  Volume2,
  Copy,
  Trash2,
  X,
  Send,
  Gauge,
  Bookmark,
  RefreshCw,
  Clock,
  ChevronRight,
  Folder,
  FileText,
  ArrowLeft,
  ListChecks,
} from 'lucide-react';

interface KaiwaPageProps {
  settings: AppSettings;
  defaultQuestions?: KaiwaDefaultQuestion[];
  kaiwaFolders?: KaiwaFolder[];
  getFoldersByLevelAndTopic?: (level: JLPTLevel, topic: ConversationTopic) => KaiwaFolder[];
  getQuestionsByFolder?: (folderId: string) => KaiwaDefaultQuestion[];
  getQuestionsByLevelAndTopic?: (level: JLPTLevel, topic: ConversationTopic) => KaiwaDefaultQuestion[];
}

// Navigation state for question selector
type QuestionSelectorState =
  | { type: 'hidden' }
  | { type: 'level' }
  | { type: 'topic'; level: JLPTLevel }
  | { type: 'list'; level: JLPTLevel; topic: ConversationTopic; folderId?: string; folderName?: string };

export function KaiwaPage({
  settings,
  defaultQuestions = [],
  kaiwaFolders: _kaiwaFolders = [],
  getFoldersByLevelAndTopic,
  getQuestionsByFolder,
  getQuestionsByLevelAndTopic,
}: KaiwaPageProps) {
  // Conversation state
  const [messages, setMessages] = useState<KaiwaMessage[]>([]);
  const [answerTemplate, setAnswerTemplate] = useState<AnswerTemplate | null>(null);
  const [suggestedAnswers, setSuggestedAnswers] = useState<SuggestedAnswer[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [savedSentences, setSavedSentences] = useState<string[]>([]);

  // Pronunciation practice state
  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestedAnswer | null>(null);
  const [pronunciationResult, setPronunciationResult] = useState<PronunciationResult | null>(null);
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  // Context state
  const [level, setLevel] = useState<JLPTLevel>(settings.kaiwaDefaultLevel);
  const [style, setStyle] = useState<ConversationStyle>(settings.kaiwaDefaultStyle);
  const [topic, setTopic] = useState<ConversationTopic>('free');

  // UI state
  const [slowMode, setSlowMode] = useState(false);
  const [showFurigana, setShowFurigana] = useState(settings.kaiwaShowFurigana);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [speakingMode, setSpeakingMode] = useState<'normal' | 'slow' | null>(null);
  const [showSuggestionTabs, setShowSuggestionTabs] = useState(true);
  const [activeSuggestionTab, setActiveSuggestionTab] = useState<'template' | 'answers' | 'questions' | null>(null);
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('kaiwaFontSize');
    return saved ? parseInt(saved, 10) : 16;
  });
  const [showSavedPanel, setShowSavedPanel] = useState(false);

  // Default question selector state
  const [questionSelectorState, setQuestionSelectorState] = useState<QuestionSelectorState>({ type: 'hidden' });
  const [selectedDefaultQuestion, setSelectedDefaultQuestion] = useState<KaiwaDefaultQuestion | null>(null);

  // Analysis state
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Computed stats
  const conversationStats = useMemo(() => {
    const userMessages = messages.filter(m => m.role === 'user').length;
    const duration = startTime ? Math.floor((Date.now() - startTime.getTime()) / 60000) : 0;
    return { exchanges: userMessages, duration };
  }, [messages, startTime]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSpokenMessageIdRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const speech = useSpeech({
    voiceGender: settings.kaiwaVoiceGender,
    voiceRate: settings.kaiwaVoiceRate,
  });
  const groq = useGroq();

  // Get current speech rate
  const getSpeechRate = useCallback(() => slowMode ? 0.6 : settings.kaiwaVoiceRate, [slowMode, settings.kaiwaVoiceRate]);

  // Build context
  const getContext = useCallback((): KaiwaContext => ({ level, style, topic }), [level, style, topic]);

  // Update voice when settings change
  useEffect(() => {
    speech.setVoiceByGender(settings.kaiwaVoiceGender);
  }, [settings.kaiwaVoiceGender, speech.setVoiceByGender]);

  // Scroll to bottom and focus input when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Auto-focus input after AI responds
    if (!groq.isLoading) {
      inputRef.current?.focus();
    }
  }, [messages, groq.isLoading]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to stop speaking
      if (e.key === 'Escape' && speech.isSpeaking) {
        speech.stopSpeaking();
        setSpeakingMessageId(null);
        setSpeakingMode(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [speech.isSpeaking, speech.stopSpeaking]);

  // Save font size to localStorage
  useEffect(() => {
    localStorage.setItem('kaiwaFontSize', fontSize.toString());
  }, [fontSize]);

  // Auto-speak assistant messages
  useEffect(() => {
    if (settings.kaiwaAutoSpeak && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.id !== lastSpokenMessageIdRef.current) {
        lastSpokenMessageIdRef.current = lastMessage.id;
        speech.speak(removeFurigana(lastMessage.content), { rate: getSpeechRate() });
      }
    }
  }, [messages, settings.kaiwaAutoSpeak, getSpeechRate, speech]);

  // Reset speaking state when speech ends
  useEffect(() => {
    if (!speech.isSpeaking && speakingMessageId) {
      setSpeakingMessageId(null);
      setSpeakingMode(null);
    }
  }, [speech.isSpeaking, speakingMessageId]);

  // Handle voice input complete
  useEffect(() => {
    if (speech.transcript && !speech.isListening) {
      if (isPracticeMode && selectedSuggestion) {
        const result = comparePronunciation(speech.transcript, selectedSuggestion.text);
        setPronunciationResult(result);
      } else {
        handleSend(speech.transcript);
      }
      speech.resetTranscript();
    }
  }, [speech.transcript, speech.isListening, isPracticeMode, selectedSuggestion]);

  // Start conversation
  const handleStart = async () => {
    setIsStarted(true);
    setStartTime(new Date());
    setMessages([]);
    setAnswerTemplate(null);
    setSuggestedQuestions([]);
    setSavedSentences([]);
    groq.clearConversation();

    // If a default question is selected, use its context
    const contextToUse = getContext();
    if (selectedDefaultQuestion) {
      contextToUse.level = selectedDefaultQuestion.level;
      contextToUse.style = selectedDefaultQuestion.style;
      contextToUse.topic = selectedDefaultQuestion.topic;
    }

    // Start conversation with optional default question
    const response = await groq.startConversation(
      contextToUse,
      selectedDefaultQuestion ? {
        questionJa: selectedDefaultQuestion.questionJa,
        questionVi: selectedDefaultQuestion.questionVi,
        situationContext: selectedDefaultQuestion.situationContext,
        suggestedAnswers: selectedDefaultQuestion.suggestedAnswers,
      } : undefined
    );
    if (response) {
      const assistantMessage: KaiwaMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response.text,
        timestamp: new Date().toISOString(),
      };
      setMessages([assistantMessage]);
      if (response.answerTemplate) {
        setAnswerTemplate(response.answerTemplate);
      }
      if (response.suggestions) {
        setSuggestedAnswers(response.suggestions);
      }
      if (response.suggestedQuestions) {
        setSuggestedQuestions(response.suggestedQuestions);
      }
    }
  };

  // Send user message
  const handleSend = async (text: string) => {
    if (!text.trim() || groq.isLoading) return;

    const userMessage: KaiwaMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setAnswerTemplate(null);
    setSuggestedAnswers([]);
    setSuggestedQuestions([]);
    setActiveSuggestionTab(null);

    const response = await groq.sendMessage(text.trim(), getContext());
    if (response) {
      const assistantMessage: KaiwaMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: response.text,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      if (response.answerTemplate) {
        setAnswerTemplate(response.answerTemplate);
      }
      if (response.suggestions) {
        setSuggestedAnswers(response.suggestions);
      }
      if (response.suggestedQuestions) {
        setSuggestedQuestions(response.suggestedQuestions);
      }
    }
  };

  // Handle mic button
  const handleMicClick = () => {
    speech.isListening ? speech.stopListening() : speech.startListening();
  };

  // End conversation
  const handleEnd = () => {
    setIsStarted(false);
    setStartTime(null);
    setMessages([]);
    setAnswerTemplate(null);
    setSuggestedAnswers([]);
    setSuggestedQuestions([]);
    setSavedSentences([]);
    setIsPracticeMode(false);
    setSelectedSuggestion(null);
    setPronunciationResult(null);
    setActiveSuggestionTab(null);
    setSelectedDefaultQuestion(null);
    setQuestionSelectorState({ type: 'hidden' });
    speech.stopSpeaking();
    groq.clearConversation();
  };

  // Save sentence to favorites
  const handleSaveSentence = (text: string) => {
    if (!savedSentences.includes(text)) {
      setSavedSentences(prev => [...prev, text]);
    }
  };

  // Quick translate function
  const handleQuickTranslate = async (text: string): Promise<string> => {
    return groq.quickTranslate(text);
  };

  // Handle vocabulary hint selection - fill template pattern with selected word
  const handleSelectHint = (hint: VocabularyHint) => {
    if (answerTemplate) {
      const cleanWord = removeFurigana(hint.word);

      // If input already has content, find next unfilled blank and replace
      if (inputText.trim()) {
        // Check for numbered blanks ①②③ first
        const blankMarkers = ['①', '②', '③', '④', '⑤'];
        let filled = false;
        let newText = inputText;

        for (const marker of blankMarkers) {
          if (newText.includes(marker)) {
            newText = newText.replace(marker, cleanWord);
            filled = true;
            break;
          }
        }

        // If no numbered blank, try ... placeholder
        if (!filled && newText.includes('...')) {
          newText = newText.replace('...', cleanWord);
        }

        setInputText(newText);
      } else {
        // Start fresh with template pattern
        const cleanPattern = removeFurigana(answerTemplate.pattern);
        // Replace first blank (①, ②, ③ or ...)
        let filledText = cleanPattern;
        const blankMarkers = ['①', '②', '③', '④', '⑤', '...'];

        for (const marker of blankMarkers) {
          if (filledText.includes(marker)) {
            filledText = filledText.replace(marker, cleanWord);
            break;
          }
        }

        setInputText(filledText);
      }
    }
  };

  // Handle suggested answer click - fill input
  const handleSuggestedAnswer = (answer: string) => {
    // Remove strategy labels like 【直接＋理由】 and furigana
    const cleanAnswer = removeFurigana(answer.replace(/【[^】]+】/g, '').trim());
    setInputText(cleanAnswer);
  };

  // Handle suggested question click - append to input if has content, otherwise replace
  const handleSuggestedQuestion = (question: string) => {
    // Remove strategy labels and furigana
    const cleanQuestion = removeFurigana(question.replace(/【[^】]+】/g, '').trim());
    if (inputText.trim()) {
      // Append to existing input
      setInputText(prev => prev.trim() + ' ' + cleanQuestion);
    } else {
      setInputText(cleanQuestion);
    }
  };

  // Speak message with tracking
  const handleSpeak = (messageId: string, text: string, mode: 'normal' | 'slow') => {
    if (speakingMessageId === messageId && speakingMode === mode && speech.isSpeaking) {
      speech.stopSpeaking();
      setSpeakingMessageId(null);
      setSpeakingMode(null);
    } else {
      if (speech.isSpeaking) speech.stopSpeaking();
      speech.speak(text, { rate: mode === 'slow' ? 0.6 : getSpeechRate() });
      setSpeakingMessageId(messageId);
      setSpeakingMode(mode);
    }
  };

  // Analyze sentence
  const handleAnalyze = async (text: string) => {
    setAnalysisText(text);
    setAnalysisResult(null);
    setIsAnalyzing(true);
    try {
      const result = await groq.analyzeJapaneseSentence(text);
      setAnalysisResult(result);
    } catch {
      setAnalysisResult('Có lỗi xảy ra khi phân tích câu.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Practice mode handlers
  const handleCancelPractice = () => {
    setIsPracticeMode(false);
    setSelectedSuggestion(null);
    setPronunciationResult(null);
  };

  const handleRetryPractice = () => {
    setPronunciationResult(null);
    speech.resetTranscript();
  };

  const handleAcceptPronunciation = () => {
    if (selectedSuggestion) handleSend(selectedSuggestion.text);
    setIsPracticeMode(false);
    setSelectedSuggestion(null);
    setPronunciationResult(null);
  };

  // Helper function to get questions for current selector state
  const getQuestionsForSelector = (): KaiwaDefaultQuestion[] => {
    if (questionSelectorState.type !== 'list') return [];
    if (questionSelectorState.folderId && getQuestionsByFolder) {
      return getQuestionsByFolder(questionSelectorState.folderId);
    }
    if (getQuestionsByLevelAndTopic) {
      return getQuestionsByLevelAndTopic(questionSelectorState.level, questionSelectorState.topic);
    }
    return [];
  };

  // Helper function to get folders for current selector state
  const getFoldersForSelector = (): KaiwaFolder[] => {
    if (questionSelectorState.type !== 'list') return [];
    if (getFoldersByLevelAndTopic) {
      return getFoldersByLevelAndTopic(questionSelectorState.level, questionSelectorState.topic);
    }
    return [];
  };

  // Render start screen
  if (!isStarted) {
    // Check if there are any default questions
    const hasDefaultQuestions = defaultQuestions.length > 0;

    return (
      <div className="kaiwa-page kaiwa-page-start">
        <div className="kaiwa-container">
        <div className="kaiwa-start-screen">
          <h2>会話練習 - Luyện Hội Thoại</h2>
          <p className="kaiwa-description">
            Luyện tập hội thoại tiếng Nhật với trợ lý AI. Bạn có thể nói hoặc gõ để trả lời.
          </p>

          {/* Default question selector section */}
          {hasDefaultQuestions && (
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
                          {getFoldersForSelector().map(folder => (
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
                        {getQuestionsForSelector().map(q => (
                          <button
                            key={q.id}
                            className={`selector-question-btn ${selectedDefaultQuestion?.id === q.id ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedDefaultQuestion(q);
                              setLevel(q.level);
                              setStyle(q.style);
                              setTopic(q.topic);
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

          {/* Free conversation setup (only show if no default question selected) */}
          {!selectedDefaultQuestion && (
            <div className="kaiwa-setup">
              <div className="kaiwa-setup-row">
                <div className="kaiwa-setup-item">
                  <label>Cấp độ JLPT</label>
                  <select value={level} onChange={e => setLevel(e.target.value as JLPTLevel)}>
                    {JLPT_LEVELS.map(l => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>

                <div className="kaiwa-setup-item">
                  <label>Phong cách nói</label>
                  <select value={style} onChange={e => setStyle(e.target.value as ConversationStyle)}>
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
                      onClick={() => setTopic(t.value)}
                    >
                      <span className="topic-icon">{t.icon}</span>
                      <span className="topic-label">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="kaiwa-setup-item kaiwa-options-row">
            <label>
              <input
                type="checkbox"
                checked={slowMode}
                onChange={e => setSlowMode(e.target.checked)}
              />
              Chế độ chậm (luyện nghe)
            </label>
            <span className="kaiwa-voice-info">
              Giọng: {settings.kaiwaVoiceGender === 'female' ? 'Nữ' : 'Nam'}
            </span>
          </div>

          {!speech.recognitionSupported && (
            <p className="kaiwa-warning">
              Trình duyệt không hỗ trợ nhận dạng giọng nói. Vui lòng dùng Chrome.
            </p>
          )}

          <button className="btn btn-primary btn-large" onClick={handleStart}>
            {selectedDefaultQuestion ? 'Bắt đầu với câu hỏi đã chọn' : 'Bắt đầu hội thoại'}
          </button>
        </div>
        </div>
      </div>
    );
  }

  // Get current topic info
  const currentTopic = CONVERSATION_TOPICS.find(t => t.value === topic);

  // Render conversation screen
  return (
    <div className="kaiwa-page">
      <div className="kaiwa-container">
      <div className="kaiwa-header">
        <div className="kaiwa-header-left">
          <h2>会話練習</h2>
          <div className="kaiwa-info">
            <span className="kaiwa-badge">{level}</span>
            <span className="kaiwa-badge">{getStyleDisplay(style)}</span>
            <span className="kaiwa-badge topic">{currentTopic?.icon} {currentTopic?.label.split(' ')[0]}</span>
          </div>
        </div>
        <div className="kaiwa-header-center">
          <div className="kaiwa-stats">
            <span className="kaiwa-stat" title="Số lượt trao đổi"><MessagesSquare size={14} /> {conversationStats.exchanges}</span>
            <span className="kaiwa-stat" title="Thời gian"><Clock size={14} /> {conversationStats.duration}m</span>
            {savedSentences.length > 0 && (
              <button
                className={`kaiwa-stat saved ${showSavedPanel ? 'active' : ''}`}
                onClick={() => setShowSavedPanel(!showSavedPanel)}
                title="Xem câu đã lưu"
              >
                <Bookmark size={14} /> {savedSentences.length}
              </button>
            )}
          </div>
        </div>
        <div className="kaiwa-header-right">
          <button
            className="kaiwa-restart-btn"
            onClick={handleStart}
            disabled={groq.isLoading}
            title="Bắt đầu lại từ đầu"
          >
            <RefreshCw size={14} /> Lại từ đầu
          </button>
          <button
            className={`kaiwa-slow-btn ${slowMode ? 'active' : ''}`}
            onClick={() => setSlowMode(!slowMode)}
            title={slowMode ? 'Tắt chế độ chậm' : 'Bật chế độ chậm'}
          >
            <Gauge size={14} /> {slowMode ? 'Chậm' : 'Thường'}
          </button>
          <button
            className={`kaiwa-furigana-btn ${showFurigana ? 'active' : ''}`}
            onClick={() => setShowFurigana(!showFurigana)}
            title={showFurigana ? 'Ẩn furigana' : 'Hiện furigana'}
          >
            あ {showFurigana ? 'ON' : 'OFF'}
          </button>
          <div className="kaiwa-fontsize-control">
            <button
              className="kaiwa-fontsize-btn"
              onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
              title="Giảm cỡ chữ"
            >
              A-
            </button>
            <span className="kaiwa-fontsize-value">{fontSize}</span>
            <button
              className="kaiwa-fontsize-btn"
              onClick={() => setFontSize(prev => Math.min(28, prev + 2))}
              title="Tăng cỡ chữ"
            >
              A+
            </button>
          </div>
          <button className="btn btn-danger btn-small kaiwa-end-btn" onClick={handleEnd}>
            Kết thúc
          </button>
        </div>
      </div>

      <div className="kaiwa-messages">
        {messages.map(msg => (
          <KaiwaMessageItem
            key={msg.id}
            message={msg}
            speakingMessageId={speakingMessageId}
            speakingMode={speakingMode}
            showFurigana={showFurigana}
            fontSize={fontSize}
            onSpeak={handleSpeak}
            onAnalyze={handleAnalyze}
            onTranslate={handleQuickTranslate}
            onSaveSentence={handleSaveSentence}
          />
        ))}

        {groq.isLoading && (
          <div className="kaiwa-message assistant">
            <div className="kaiwa-message-avatar">🤖</div>
            <div className="kaiwa-message-content">
              <div className="kaiwa-typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pronunciation Practice Modal */}
      {isPracticeMode && selectedSuggestion && (
        <KaiwaPracticeModal
          suggestion={selectedSuggestion}
          result={pronunciationResult}
          isListening={speech.isListening}
          isSpeaking={speech.isSpeaking}
          onMicClick={handleMicClick}
          onListen={() => speech.speak(selectedSuggestion.text, { rate: settings.kaiwaVoiceRate })}
          onRetry={handleRetryPractice}
          onAccept={handleAcceptPronunciation}
          onClose={handleCancelPractice}
        />
      )}

      {/* Analysis Modal */}
      {analysisText && (
        <KaiwaAnalysisModal
          text={analysisText}
          result={analysisResult}
          isLoading={isAnalyzing}
          onClose={() => { setAnalysisText(null); setAnalysisResult(null); }}
        />
      )}

      {/* Saved Sentences Panel */}
      {showSavedPanel && savedSentences.length > 0 && (
        <div className="kaiwa-saved-panel">
          <div className="kaiwa-saved-header">
            <h3><Bookmark size={16} /> Câu đã lưu ({savedSentences.length})</h3>
            <button className="kaiwa-saved-close" onClick={() => setShowSavedPanel(false)}><X size={16} /></button>
          </div>
          <div className="kaiwa-saved-list">
            {savedSentences.map((sentence, idx) => (
              <div key={idx} className="kaiwa-saved-item">
                <p className="kaiwa-saved-text" style={{ fontSize: `${fontSize}px` }}>
                  <FuriganaText text={sentence} showFurigana={showFurigana} />
                </p>
                <div className="kaiwa-saved-actions">
                  <button
                    className="kaiwa-saved-btn"
                    onClick={() => speech.speak(removeFurigana(sentence), { rate: getSpeechRate() })}
                    title="Nghe"
                  >
                    <Volume2 size={14} />
                  </button>
                  <button
                    className="kaiwa-saved-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(removeFurigana(sentence));
                    }}
                    title="Sao chép"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    className="kaiwa-saved-btn delete"
                    onClick={() => setSavedSentences(prev => prev.filter((_, i) => i !== idx))}
                    title="Xóa"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom section: tabs + input */}
      <div className="kaiwa-bottom-section">
        {/* Suggestion tabs - controlled by button in input area */}
        {!isPracticeMode && showSuggestionTabs && (answerTemplate || suggestedAnswers.length > 0 || suggestedQuestions.length > 0) && (
          <div className="kaiwa-suggestion-tabs">
            <div className="kaiwa-tabs-row">
                {answerTemplate && (
                  <button
                    className={`kaiwa-tab-btn ${activeSuggestionTab === 'template' ? 'active' : ''}`}
                    onClick={() => setActiveSuggestionTab(activeSuggestionTab === 'template' ? null : 'template')}
                  >
                    <span className="tab-icon"><Sparkles size={16} /></span>
                    <span className="tab-label">Gợi ý trả lời</span>
                  </button>
                )}
                {suggestedAnswers.length > 0 && (
                  <button
                    className={`kaiwa-tab-btn ${activeSuggestionTab === 'answers' ? 'active' : ''}`}
                    onClick={() => setActiveSuggestionTab(activeSuggestionTab === 'answers' ? null : 'answers')}
                  >
                    <span className="tab-icon"><MessagesSquare size={16} /></span>
                    <span className="tab-label">Câu trả lời mẫu</span>
                  </button>
                )}
                {suggestedQuestions.length > 0 && (
                  <button
                    className={`kaiwa-tab-btn ${activeSuggestionTab === 'questions' ? 'active' : ''}`}
                    onClick={() => setActiveSuggestionTab(activeSuggestionTab === 'questions' ? null : 'questions')}
                  >
                    <span className="tab-icon"><CircleHelp size={16} /></span>
                    <span className="tab-label">Gợi ý câu hỏi</span>
                  </button>
                )}
              </div>

            {/* Tab content - only show when tabs are visible */}
            {showSuggestionTabs && (
              <>
                {activeSuggestionTab === 'template' && answerTemplate && (
                  <div className="kaiwa-tab-content">
                    <KaiwaAnswerTemplate
                      template={answerTemplate}
                      showFurigana={showFurigana}
                      onSelectHint={handleSelectHint}
                    />
                  </div>
                )}

                {activeSuggestionTab === 'answers' && suggestedAnswers.length > 0 && (
                  <div className="kaiwa-tab-content">
                    <div className="kaiwa-suggestions-list">
                      {suggestedAnswers.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          className={`kaiwa-suggestion-btn ${inputText.includes(removeFurigana(suggestion.text.replace(/【[^】]+】/g, '').trim()).substring(0, 20)) ? 'selected' : ''}`}
                          onClick={() => handleSuggestedAnswer(suggestion.text)}
                          disabled={groq.isLoading}
                        >
                          <FuriganaText text={suggestion.text} showFurigana={showFurigana} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeSuggestionTab === 'questions' && suggestedQuestions.length > 0 && (
                  <div className="kaiwa-tab-content">
                    <div className="kaiwa-questions-list">
                      {suggestedQuestions.map((question, idx) => (
                        <button
                          key={idx}
                          className="kaiwa-question-btn"
                          onClick={() => handleSuggestedQuestion(question)}
                          disabled={groq.isLoading}
                        >
                          <FuriganaText text={question} showFurigana={showFurigana} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Error display */}
        {(groq.error || speech.error) && (
          <div className="kaiwa-error">
            {groq.error || speech.error}
            <button onClick={() => { groq.clearError(); speech.clearError(); }}><X size={16} /></button>
          </div>
        )}

        {/* Input controls */}
        <div className="kaiwa-controls">
          <button
            className={`kaiwa-quick-toggle ${showSuggestionTabs ? 'active' : ''}`}
            onClick={() => setShowSuggestionTabs(!showSuggestionTabs)}
            title="Gợi ý"
            disabled={!answerTemplate && suggestedAnswers.length === 0 && suggestedQuestions.length === 0}
          >
            <Sparkles size={18} />
          </button>

          {speech.recognitionSupported && (
            <button
              className={`kaiwa-mic-btn ${speech.isListening ? 'listening' : ''}`}
              onClick={handleMicClick}
              disabled={groq.isLoading}
            >
              <Mic size={18} />
            </button>
          )}

          <div className="kaiwa-input-wrapper">
            {speech.isListening && speech.interimTranscript && (
              <div className="kaiwa-interim">{speech.interimTranscript}</div>
            )}
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend(inputText)}
              placeholder="Nhập hoặc nói tiếng Nhật..."
              disabled={groq.isLoading || speech.isListening}
            />
          </div>

          <button
            className="kaiwa-send-btn"
            onClick={() => handleSend(inputText)}
            disabled={!inputText.trim() || groq.isLoading}
          >
            <Send size={18} />
          </button>
        </div>

        {/* Voice status */}
        {(speech.isListening || speech.isSpeaking) && (
          <div className="kaiwa-status">
            {speech.isListening && <span className="status-listening"><Mic size={14} /> Đang nghe...</span>}
            {speech.isSpeaking && <span className="status-speaking"><Volume2 size={14} /> Đang nói...</span>}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
