// Kaiwa active session view - Conversation interface during active session
// Extracted from kaiwa-page.tsx (lines 1339-1751)

import type { RefObject } from 'react';
import type {
  KaiwaMessage,
  JLPTLevel,
  ConversationStyle,
  ConversationTopic,
  PronunciationResult,
  AnswerTemplate,
  SuggestedAnswer,
  KaiwaRole,
  KaiwaEvaluation,
} from '../../../types/kaiwa';
import type { MicMode } from '../../kaiwa/kaiwa-input-area';
import type { SessionMode } from './kaiwa-page-types';
import type { KaiwaAdvancedTopic } from '../../../types/kaiwa-advanced';
import type { CustomTopic } from '../../../types/custom-topic';
import type { AppSettings } from '../../../hooks/use-settings';
import { useSpeech } from '../../../hooks/use-speech';
import { useGroq } from '../../../hooks/use-groq';
import { CONVERSATION_TOPICS, getStyleDisplay } from '../../../constants/kaiwa';
import { removeFurigana } from '../../../lib/furigana-utils';
import { FuriganaText } from '../../common/furigana-text';
import {
  KaiwaMessageItem,
  KaiwaPracticeModal,
  KaiwaReadingPracticeModal,
  KaiwaAnalysisModal,
  KaiwaAnswerTemplate,
  KaiwaEvaluationModal,
} from '../../kaiwa';
import { MicModeSelector } from './mic-mode-selector';
import {
  MessagesSquare,
  Clock,
  Bookmark,
  RefreshCw,
  Gauge,
  Award,
  X,
  Send,
  Mic,
  Volume2,
  Copy,
  Trash2,
  Sparkles,
  CircleHelp,
  Zap,
  BookOpen,
} from 'lucide-react';

interface KaiwaSessionViewProps {
  // State
  messages: KaiwaMessage[];
  level: JLPTLevel;
  style: ConversationStyle;
  topic: ConversationTopic;
  conversationStats: { exchanges: number; duration: number };
  savedSentences: string[];
  showSavedPanel: boolean;
  slowMode: boolean;
  showFurigana: boolean;
  fontSize: number;
  speakingMessageId: string | null;
  speakingMode: 'normal' | 'slow' | null;
  isAiLoading: boolean;
  inputText: string;
  showSuggestionTabs: boolean;
  activeSuggestionTab: 'template' | 'answers' | 'questions' | null;
  answerTemplate: AnswerTemplate | null;
  suggestedAnswers: SuggestedAnswer[];
  suggestedQuestions: string[];
  isPracticeMode: boolean;
  selectedSuggestion: SuggestedAnswer | null;
  pronunciationResult: PronunciationResult | null;
  autoSendCountdown: number | null;
  analysisText: string | null;
  analysisResult: string | null;
  isAnalyzing: boolean;
  showEvaluationModal: boolean;
  evaluation: KaiwaEvaluation | null;
  isEvaluating: boolean;
  micMode: MicMode;
  showReadingPracticeModal: boolean;
  textToRead: string;
  selectedAdvancedTopic: KaiwaAdvancedTopic | null;
  selectedCustomTopic: CustomTopic | null;
  sessionMode: SessionMode;

  // Refs
  messagesEndRef: RefObject<HTMLDivElement>;
  inputRef: RefObject<HTMLInputElement>;

  // Hooks
  speech: ReturnType<typeof useSpeech>;
  groq: ReturnType<typeof useGroq>;

  // Settings
  settings: AppSettings;

  // Setters
  setInputText: (text: string) => void;
  setSlowMode: (slow: boolean) => void;
  setShowFurigana: (show: boolean) => void;
  setFontSize: (size: number) => void;
  setShowSavedPanel: (show: boolean) => void;
  setSavedSentences: React.Dispatch<React.SetStateAction<string[]>>;
  setShowSuggestionTabs: (show: boolean) => void;
  setActiveSuggestionTab: (tab: 'template' | 'answers' | 'questions' | null) => void;
  setAnalysisText: (text: string | null) => void;
  setAnalysisResult: (result: string | null) => void;
  setMicMode: (mode: MicMode) => void;
  setShowReadingPracticeModal: (show: boolean) => void;
  setTextToRead: (text: string) => void;
  setPronunciationAttempts: React.Dispatch<React.SetStateAction<number>>;
  setTotalAccuracy: React.Dispatch<React.SetStateAction<number>>;

  // Handlers
  handleStart: () => void;
  handleEnd: (skipEvaluation?: boolean) => void;
  handleSend: (text: string) => void;
  handleSpeak: (messageId: string, text: string, mode: 'normal' | 'slow') => void;
  handleAnalyze: (text: string) => void;
  handleQuickTranslate: (text: string) => Promise<string>;
  handleSaveSentence: (text: string) => void;
  handleSelectHint: (hint: { word: string; meaning: string }) => void;
  handleSuggestedAnswer: (answer: string) => void;
  handleSuggestedQuestion: (question: string) => void;
  handleMicClick: () => void;
  handleCancelPractice: () => void;
  handleRetryPractice: () => void;
  handleAcceptPronunciation: () => void;
  handleEvaluationClose: () => void;

  // Computed
  getSpeechRate: () => number;
  getUserRoleInfo: () => KaiwaRole | null;
}

export function KaiwaSessionView(props: KaiwaSessionViewProps) {
  const {
    messages,
    level,
    style,
    topic,
    conversationStats,
    savedSentences,
    showSavedPanel,
    slowMode,
    showFurigana,
    fontSize,
    speakingMessageId,
    speakingMode,
    isAiLoading,
    inputText,
    showSuggestionTabs,
    activeSuggestionTab,
    answerTemplate,
    suggestedAnswers,
    suggestedQuestions,
    isPracticeMode,
    selectedSuggestion,
    pronunciationResult,
    autoSendCountdown,
    analysisText,
    analysisResult,
    isAnalyzing,
    showEvaluationModal,
    evaluation,
    isEvaluating,
    micMode,
    showReadingPracticeModal,
    textToRead,
    selectedAdvancedTopic,
    selectedCustomTopic,
    messagesEndRef,
    inputRef,
    speech,
    groq,
    settings,
    setInputText,
    setSlowMode,
    setShowFurigana,
    setFontSize,
    setShowSavedPanel,
    setSavedSentences,
    setShowSuggestionTabs,
    setActiveSuggestionTab,
    setAnalysisText,
    setAnalysisResult,
    setMicMode,
    setShowReadingPracticeModal,
    setTextToRead,
    setPronunciationAttempts,
    setTotalAccuracy,
    handleStart,
    handleEnd,
    handleSend,
    handleSpeak,
    handleAnalyze,
    handleQuickTranslate,
    handleSaveSentence,
    handleSelectHint,
    handleSuggestedAnswer,
    handleSuggestedQuestion,
    handleMicClick,
    handleCancelPractice,
    handleRetryPractice,
    handleAcceptPronunciation,
    handleEvaluationClose,
    getSpeechRate,
    getUserRoleInfo,
  } = props;

  const currentTopic = CONVERSATION_TOPICS.find(t => t.value === topic);

  return (
    <div className="kaiwa-page">
      <div className="kaiwa-container">
        <div className="kaiwa-header">
          <div className="kaiwa-header-left">
            <h2>会話練習</h2>
            <div className="kaiwa-info">
              <span className="kaiwa-badge">{level}</span>
              <span className="kaiwa-badge">{getStyleDisplay(style)}</span>
              {selectedAdvancedTopic ? (
                <span className="kaiwa-badge topic advanced" style={{ borderColor: selectedAdvancedTopic.color }}>
                  {selectedAdvancedTopic.icon} {selectedAdvancedTopic.name}
                </span>
              ) : selectedCustomTopic ? (
                <span className="kaiwa-badge topic custom" style={{ borderColor: selectedCustomTopic.color }}>
                  {selectedCustomTopic.icon} {selectedCustomTopic.name}
                </span>
              ) : (
                <span className="kaiwa-badge topic">{currentTopic?.icon} {currentTopic?.label.split(' ')[0]}</span>
              )}
              {getUserRoleInfo() && (
                <span className="kaiwa-badge role">
                  {getUserRoleInfo()?.emoji} {getUserRoleInfo()?.nameVi}
                </span>
              )}
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
              onClick={() => handleStart()}
              disabled={isAiLoading}
              title="Bắt đầu lại từ đầu"
            >
              <RefreshCw size={14} /> Lại từ đầu
            </button>
            <button
              className={`kaiwa-send-mode-btn ${settings.kaiwaSendMode === 'auto' ? 'active' : ''}`}
              onClick={() => {
                // Toggle send mode (only in settings page, but show status here)
              }}
              title={settings.kaiwaSendMode === 'auto' ? 'Chế độ tự động gửi' : 'Chế độ gửi thủ công'}
            >
              <Zap size={14} /> {settings.kaiwaSendMode === 'auto' ? 'Auto' : 'Manual'}
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
                onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                title="Giảm cỡ chữ"
              >
                A-
              </button>
              <span className="kaiwa-fontsize-value">{fontSize}</span>
              <button
                className="kaiwa-fontsize-btn"
                onClick={() => setFontSize(Math.min(28, fontSize + 2))}
                title="Tăng cỡ chữ"
              >
                A+
              </button>
            </div>
            {messages.length >= 4 && (
              <button
                className="kaiwa-eval-btn"
                onClick={() => handleEnd(false)}
                disabled={isAiLoading || isEvaluating}
                title="Đánh giá và kết thúc"
              >
                <Award size={14} /> Đánh giá
              </button>
            )}
            <button className="btn btn-danger btn-small kaiwa-end-btn" onClick={() => handleEnd(true)}>
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

          {isAiLoading && (
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
          <>
            <KaiwaPracticeModal
              suggestion={selectedSuggestion}
              result={pronunciationResult}
              isListening={speech.isListening}
              isSpeaking={speech.isSpeaking}
              interimTranscript={speech.interimTranscript}
              onMicClick={handleMicClick}
              onListen={() => speech.speak(selectedSuggestion.text, { rate: settings.kaiwaVoiceRate })}
              onRetry={handleRetryPractice}
              onAccept={handleAcceptPronunciation}
              onClose={handleCancelPractice}
            />
            {/* Auto-send countdown overlay */}
            {autoSendCountdown !== null && autoSendCountdown > 0 && (
              <div className="kaiwa-auto-send-countdown">
                <Zap size={18} />
                <span>Tự động gửi trong</span>
                <span className="countdown-number">{autoSendCountdown}</span>
                <span>giây</span>
              </div>
            )}
          </>
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

        {/* Evaluation Modal */}
        {showEvaluationModal && (
          <KaiwaEvaluationModal
            evaluation={evaluation}
            isLoading={isEvaluating}
            onClose={handleEvaluationClose}
          />
        )}

        {/* Reading Practice Modal */}
        <KaiwaReadingPracticeModal
          isOpen={showReadingPracticeModal}
          onClose={() => setShowReadingPracticeModal(false)}
          textToRead={textToRead}
          level={level}
          onComplete={(result) => {
            setPronunciationAttempts(prev => prev + 1);
            setTotalAccuracy(prev => prev + result.accuracy);
          }}
        />

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
          {/* Suggestion tabs */}
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

              {/* Tab content */}
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
                            disabled={isAiLoading}
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
                            disabled={isAiLoading}
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
              <div className="kaiwa-mic-group">
                <MicModeSelector
                  micMode={micMode}
                  onMicModeChange={setMicMode}
                />

                <button
                  className={`kaiwa-mic-btn ${speech.isListening ? 'listening' : ''} ${micMode === 'reading-practice' ? 'reading-mode' : ''}`}
                  onClick={() => {
                    if (micMode === 'reading-practice') {
                      const lastAiMessage = messages.filter(m => m.role === 'assistant').pop();
                      const readingText = suggestedAnswers[0]?.text || lastAiMessage?.content || '';
                      if (readingText) {
                        setTextToRead(readingText);
                        setShowReadingPracticeModal(true);
                      }
                    } else {
                      handleMicClick();
                    }
                  }}
                  disabled={isAiLoading || (micMode === 'reading-practice' && suggestedAnswers.length === 0 && messages.filter(m => m.role === 'assistant').length === 0)}
                  title={micMode === 'reading-practice' ? 'Mở luyện đọc' : 'Bắt đầu nói'}
                >
                  {micMode === 'reading-practice' ? <BookOpen size={18} /> : <Mic size={18} />}
                </button>
              </div>
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
                disabled={isAiLoading || speech.isListening}
              />
            </div>

            <button
              className="kaiwa-send-btn"
              onClick={() => handleSend(inputText)}
              disabled={!inputText.trim() || isAiLoading}
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
