// Suggestion tabs (template / sample answers / questions) for kaiwa-session-view

import type { AnswerTemplate, SuggestedAnswer } from '../../../types/kaiwa';
import { FuriganaText } from '../../common/furigana-text';
import { removeFurigana } from '../../../lib/furigana-utils';
import { KaiwaAnswerTemplate } from '../../kaiwa';
import { MessagesSquare, Sparkles, CircleHelp } from 'lucide-react';

interface KaiwaSessionSuggestionTabsProps {
  showFurigana: boolean;
  isAiLoading: boolean;
  inputText: string;
  activeSuggestionTab: 'template' | 'answers' | 'questions' | null;
  answerTemplate: AnswerTemplate | null;
  suggestedAnswers: SuggestedAnswer[];
  suggestedQuestions: string[];
  setActiveSuggestionTab: (tab: 'template' | 'answers' | 'questions' | null) => void;
  handleSelectHint: (hint: { word: string; meaning: string }) => void;
  handleSuggestedAnswer: (answer: string) => void;
  handleSuggestedQuestion: (question: string) => void;
}

export function KaiwaSessionSuggestionTabs({
  showFurigana,
  isAiLoading,
  inputText,
  activeSuggestionTab,
  answerTemplate,
  suggestedAnswers,
  suggestedQuestions,
  setActiveSuggestionTab,
  handleSelectHint,
  handleSuggestedAnswer,
  handleSuggestedQuestion,
}: KaiwaSessionSuggestionTabsProps) {
  return (
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
    </div>
  );
}
