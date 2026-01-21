// Kaiwa Input Area - Bottom input controls with suggestions
// Handles text input, mic button, send, and suggestion tabs

import { forwardRef } from 'react';
import {
  Sparkles,
  MessagesSquare,
  CircleHelp,
  Mic,
  Send,
  Volume2,
  X,
} from 'lucide-react';
import type { AnswerTemplate, SuggestedAnswer, VocabularyHint } from '../../types/kaiwa';
import { KaiwaAnswerTemplate } from './kaiwa-answer-template';
import { FuriganaText } from '../common/furigana-text';
import { removeFurigana } from '../../lib/furigana-utils';

type SuggestionTab = 'template' | 'answers' | 'questions' | null;

interface KaiwaInputAreaProps {
  inputText: string;
  onInputChange: (text: string) => void;
  onSend: (text: string) => void;

  // States
  isLoading: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  interimTranscript: string;
  recognitionSupported: boolean;
  isPracticeMode: boolean;

  // Suggestions
  answerTemplate: AnswerTemplate | null;
  suggestedAnswers: SuggestedAnswer[];
  suggestedQuestions: string[];
  showSuggestionTabs: boolean;
  activeSuggestionTab: SuggestionTab;
  showFurigana: boolean;

  // Error
  error: string | null;

  // Handlers
  onMicClick: () => void;
  onToggleSuggestionTabs: () => void;
  onTabChange: (tab: SuggestionTab) => void;
  onSelectHint: (hint: VocabularyHint) => void;
  onSelectAnswer: (answer: string) => void;
  onSelectQuestion: (question: string) => void;
  onClearError: () => void;
}

export const KaiwaInputArea = forwardRef<HTMLInputElement, KaiwaInputAreaProps>(function KaiwaInputArea({
  inputText,
  onInputChange,
  onSend,
  isLoading,
  isListening,
  isSpeaking,
  interimTranscript,
  recognitionSupported,
  isPracticeMode,
  answerTemplate,
  suggestedAnswers,
  suggestedQuestions,
  showSuggestionTabs,
  activeSuggestionTab,
  showFurigana,
  error,
  onMicClick,
  onToggleSuggestionTabs,
  onTabChange,
  onSelectHint,
  onSelectAnswer,
  onSelectQuestion,
  onClearError,
}, ref) {
  const hasSuggestions = answerTemplate || suggestedAnswers.length > 0 || suggestedQuestions.length > 0;

  return (
    <div className="kaiwa-bottom-section">
      {/* Suggestion tabs */}
      {!isPracticeMode && showSuggestionTabs && hasSuggestions && (
        <div className="kaiwa-suggestion-tabs">
          <div className="kaiwa-tabs-row">
            {answerTemplate && (
              <button
                className={`kaiwa-tab-btn ${activeSuggestionTab === 'template' ? 'active' : ''}`}
                onClick={() => onTabChange(activeSuggestionTab === 'template' ? null : 'template')}
              >
                <span className="tab-icon"><Sparkles size={16} /></span>
                <span className="tab-label">Gợi ý trả lời</span>
              </button>
            )}
            {suggestedAnswers.length > 0 && (
              <button
                className={`kaiwa-tab-btn ${activeSuggestionTab === 'answers' ? 'active' : ''}`}
                onClick={() => onTabChange(activeSuggestionTab === 'answers' ? null : 'answers')}
              >
                <span className="tab-icon"><MessagesSquare size={16} /></span>
                <span className="tab-label">Câu trả lời mẫu</span>
              </button>
            )}
            {suggestedQuestions.length > 0 && (
              <button
                className={`kaiwa-tab-btn ${activeSuggestionTab === 'questions' ? 'active' : ''}`}
                onClick={() => onTabChange(activeSuggestionTab === 'questions' ? null : 'questions')}
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
                    onSelectHint={onSelectHint}
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
                        onClick={() => onSelectAnswer(suggestion.text)}
                        disabled={isLoading}
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
                        onClick={() => onSelectQuestion(question)}
                        disabled={isLoading}
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
      {error && (
        <div className="kaiwa-error">
          {error}
          <button onClick={onClearError}><X size={16} /></button>
        </div>
      )}

      {/* Input controls */}
      <div className="kaiwa-controls">
        <button
          className={`kaiwa-quick-toggle ${showSuggestionTabs ? 'active' : ''}`}
          onClick={onToggleSuggestionTabs}
          title="Gợi ý"
          disabled={!hasSuggestions}
        >
          <Sparkles size={18} />
        </button>

        {recognitionSupported && (
          <button
            className={`kaiwa-mic-btn ${isListening ? 'listening' : ''}`}
            onClick={onMicClick}
            disabled={isLoading}
          >
            <Mic size={18} />
          </button>
        )}

        <div className="kaiwa-input-wrapper">
          {isListening && interimTranscript && (
            <div className="kaiwa-interim">{interimTranscript}</div>
          )}
          <input
            ref={ref}
            type="text"
            value={inputText}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSend(inputText)}
            placeholder="Nhập hoặc nói tiếng Nhật..."
            disabled={isLoading || isListening}
          />
        </div>

        <button
          className="kaiwa-send-btn"
          onClick={() => onSend(inputText)}
          disabled={!inputText.trim() || isLoading}
        >
          <Send size={18} />
        </button>
      </div>

      {/* Voice status */}
      {(isListening || isSpeaking) && (
        <div className="kaiwa-status">
          {isListening && <span className="status-listening"><Mic size={14} /> Đang nghe...</span>}
          {isSpeaking && <span className="status-speaking"><Volume2 size={14} /> Đang nói...</span>}
        </div>
      )}
    </div>
  );
});
