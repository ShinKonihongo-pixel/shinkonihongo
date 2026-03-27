// Bottom input controls + voice status for kaiwa-session-view

import type { RefObject } from 'react';
import type { AnswerTemplate, SuggestedAnswer } from '../../../types/kaiwa';
import type { MicMode } from '../../kaiwa/kaiwa-input-area';
import { useSpeech } from '../../../hooks/use-speech';
import { useGroq } from '../../../hooks/use-groq';
import { MicModeSelector } from './mic-mode-selector';
import { Sparkles, Send, Mic, Volume2, BookOpen, X } from 'lucide-react';

interface KaiwaSessionInputAreaProps {
  messages: any[];
  inputText: string;
  isAiLoading: boolean;
  showSuggestionTabs: boolean;
  answerTemplate: AnswerTemplate | null;
  suggestedAnswers: SuggestedAnswer[];
  suggestedQuestions: string[];
  micMode: MicMode;
  inputRef: RefObject<HTMLInputElement>;
  speech: ReturnType<typeof useSpeech>;
  groq: ReturnType<typeof useGroq>;
  setInputText: (text: string) => void;
  setShowSuggestionTabs: (show: boolean) => void;
  setMicMode: (mode: MicMode) => void;
  setTextToRead: (text: string) => void;
  setShowReadingPracticeModal: (show: boolean) => void;
  handleSend: (text: string) => void;
  handleMicClick: () => void;
}

export function KaiwaSessionInputArea({
  messages,
  inputText,
  isAiLoading,
  showSuggestionTabs,
  answerTemplate,
  suggestedAnswers,
  suggestedQuestions,
  micMode,
  inputRef,
  speech,
  groq,
  setInputText,
  setShowSuggestionTabs,
  setMicMode,
  setTextToRead,
  setShowReadingPracticeModal,
  handleSend,
  handleMicClick,
}: KaiwaSessionInputAreaProps) {
  return (
    <>
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
                  const lastAiMessage = messages.filter((m: any) => m.role === 'assistant').pop();
                  const readingText = suggestedAnswers[0]?.text || lastAiMessage?.content || '';
                  if (readingText) {
                    setTextToRead(readingText);
                    setShowReadingPracticeModal(true);
                  }
                } else {
                  handleMicClick();
                }
              }}
              disabled={isAiLoading || (micMode === 'reading-practice' && suggestedAnswers.length === 0 && messages.filter((m: any) => m.role === 'assistant').length === 0)}
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
    </>
  );
}
