// Kaiwa (Japanese conversation) practice page with AI assistant

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { AppSettings } from '../../hooks/use-settings';
import type { KaiwaMessage, KaiwaContext, JLPTLevel, ConversationStyle, ConversationTopic, PronunciationResult, AnswerTemplate, SuggestedAnswer } from '../../types/kaiwa';
import { useSpeech, comparePronunciation } from '../../hooks/use-speech';
import { useGroq } from '../../hooks/use-groq';
import { JLPT_LEVELS, CONVERSATION_STYLES, CONVERSATION_TOPICS, getStyleDisplay } from '../../constants/kaiwa';
import { KaiwaMessageItem, KaiwaPracticeModal, KaiwaAnalysisModal, KaiwaAnswerTemplate } from '../kaiwa';
import type { VocabularyHint } from '../../types/kaiwa';
import { removeFurigana } from '../../lib/furigana-utils';
import { FuriganaText } from '../common/furigana-text';

// Quick response phrases for common replies
const QUICK_PHRASES = [
  { text: 'はい', label: 'Vâng' },
  { text: 'いいえ', label: 'Không' },
  { text: 'そうですね', label: 'Đúng vậy' },
  { text: 'わかりました', label: 'Hiểu rồi' },
  { text: 'もう一度お願いします', label: 'Nói lại' },
  { text: 'ちょっと待ってください', label: 'Chờ chút' },
];

interface KaiwaPageProps {
  settings: AppSettings;
}

export function KaiwaPage({ settings }: KaiwaPageProps) {
  // Conversation state
  const [messages, setMessages] = useState<KaiwaMessage[]>([]);
  const [answerTemplate, setAnswerTemplate] = useState<AnswerTemplate | null>(null);
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
  const [showQuickPhrases, setShowQuickPhrases] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('kaiwaFontSize');
    return saved ? parseInt(saved, 10) : 16;
  });
  const [showSavedPanel, setShowSavedPanel] = useState(false);

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

    const response = await groq.startConversation(getContext());
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
    setSuggestedQuestions([]);

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
    setSuggestedQuestions([]);
    setSavedSentences([]);
    setIsPracticeMode(false);
    setSelectedSuggestion(null);
    setPronunciationResult(null);
    setShowQuickPhrases(false);
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
      // Replace ... with the selected word (remove furigana for input)
      const cleanPattern = removeFurigana(answerTemplate.pattern);
      const cleanWord = removeFurigana(hint.word);
      const filledText = cleanPattern.replace('...', cleanWord);
      setInputText(filledText);
    }
  };

  // Handle suggested question click - fill input (not auto-send)
  const handleSuggestedQuestion = (question: string) => {
    const cleanQuestion = removeFurigana(question);
    setInputText(cleanQuestion);
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

  // Render start screen
  if (!isStarted) {
    return (
      <div className="kaiwa-page">
        <div className="kaiwa-start-screen">
          <h2>会話練習 - Luyện Hội Thoại</h2>
          <p className="kaiwa-description">
            Luyện tập hội thoại tiếng Nhật với trợ lý AI. Bạn có thể nói hoặc gõ để trả lời.
          </p>

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
          </div>

          {!speech.recognitionSupported && (
            <p className="kaiwa-warning">
              Trình duyệt không hỗ trợ nhận dạng giọng nói. Vui lòng dùng Chrome.
            </p>
          )}

          <button className="btn btn-primary btn-large" onClick={handleStart}>
            Bắt đầu hội thoại
          </button>
        </div>
      </div>
    );
  }

  // Get current topic info
  const currentTopic = CONVERSATION_TOPICS.find(t => t.value === topic);

  // Render conversation screen
  return (
    <div className="kaiwa-page">
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
            <span className="kaiwa-stat" title="Số lượt trao đổi">💬 {conversationStats.exchanges}</span>
            <span className="kaiwa-stat" title="Thời gian">⏱️ {conversationStats.duration}m</span>
            {savedSentences.length > 0 && (
              <button
                className={`kaiwa-stat saved ${showSavedPanel ? 'active' : ''}`}
                onClick={() => setShowSavedPanel(!showSavedPanel)}
                title="Xem câu đã lưu"
              >
                ⭐ {savedSentences.length}
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
            🔄 Lại từ đầu
          </button>
          <button
            className={`kaiwa-slow-btn ${slowMode ? 'active' : ''}`}
            onClick={() => setSlowMode(!slowMode)}
            title={slowMode ? 'Tắt chế độ chậm' : 'Bật chế độ chậm'}
          >
            🐢 {slowMode ? 'Chậm' : 'Thường'}
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
          <button className="btn btn-secondary btn-small" onClick={handleEnd}>
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
            <h3>⭐ Câu đã lưu ({savedSentences.length})</h3>
            <button className="kaiwa-saved-close" onClick={() => setShowSavedPanel(false)}>✕</button>
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
                    🔊
                  </button>
                  <button
                    className="kaiwa-saved-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(removeFurigana(sentence));
                    }}
                    title="Sao chép"
                  >
                    📋
                  </button>
                  <button
                    className="kaiwa-saved-btn delete"
                    onClick={() => setSavedSentences(prev => prev.filter((_, i) => i !== idx))}
                    title="Xóa"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom section: template + questions + input */}
      <div className="kaiwa-bottom-section">
        {/* Answer Template with vocabulary hints */}
        {answerTemplate && !isPracticeMode && (
          <KaiwaAnswerTemplate
            template={answerTemplate}
            showFurigana={showFurigana}
            onSelectHint={handleSelectHint}
          />
        )}

        {/* Suggested questions to ask AI back */}
        {suggestedQuestions.length > 0 && !isPracticeMode && (
          <div className="kaiwa-questions-box">
            <div className="kaiwa-questions-header">
              <span className="kaiwa-questions-icon">❓</span>
              <span className="kaiwa-questions-title">Hỏi lại AI</span>
            </div>
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

        {/* Error display */}
        {(groq.error || speech.error) && (
          <div className="kaiwa-error">
            {groq.error || speech.error}
            <button onClick={() => { groq.clearError(); speech.clearError(); }}>✕</button>
          </div>
        )}

        {/* Quick phrases toggle */}
        {showQuickPhrases && (
          <div className="kaiwa-quick-phrases">
            {QUICK_PHRASES.map((phrase, idx) => (
              <button
                key={idx}
                className="kaiwa-quick-btn"
                onClick={() => handleSend(phrase.text)}
                disabled={groq.isLoading}
              >
                <span className="quick-jp">{phrase.text}</span>
                <span className="quick-vi">{phrase.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input controls */}
        <div className="kaiwa-controls">
          <button
            className={`kaiwa-quick-toggle ${showQuickPhrases ? 'active' : ''}`}
            onClick={() => setShowQuickPhrases(!showQuickPhrases)}
            title="Câu nói nhanh"
          >
            ⚡
          </button>

          {speech.recognitionSupported && (
            <button
              className={`kaiwa-mic-btn ${speech.isListening ? 'listening' : ''}`}
              onClick={handleMicClick}
              disabled={groq.isLoading}
            >
              {speech.isListening ? '🔴' : '🎤'}
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
            Gửi
          </button>
        </div>

        {/* Voice status */}
        {(speech.isListening || speech.isSpeaking) && (
          <div className="kaiwa-status">
            {speech.isListening && <span className="status-listening">🎤 Đang nghe...</span>}
            {speech.isSpeaking && <span className="status-speaking">🔊 Đang nói...</span>}
          </div>
        )}
      </div>
    </div>
  );
}
