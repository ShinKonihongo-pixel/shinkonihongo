// Suggestions box component for Kaiwa conversation

import type { SuggestedAnswer } from '../../types/kaiwa';

interface KaiwaSuggestionsBoxProps {
  suggestions: SuggestedAnswer[];
  onPractice: (suggestion: SuggestedAnswer) => void;
  onSendDirect: (suggestion: SuggestedAnswer) => void;
}

export function KaiwaSuggestionsBox({
  suggestions,
  onPractice,
  onSendDirect,
}: KaiwaSuggestionsBoxProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="kaiwa-suggestions-box">
      <div className="kaiwa-suggestions-header">
        <span className="kaiwa-suggestions-title">💡 Gợi ý câu trả lời</span>
        <span className="kaiwa-suggestions-hint">Click để luyện phát âm • → để gửi ngay</span>
      </div>
      <div className="kaiwa-suggestions-list">
        {suggestions.map(s => (
          <div key={s.id} className="kaiwa-suggestion-item">
            <button
              className="kaiwa-suggestion-chip"
              onClick={() => onPractice(s)}
              title="Click để luyện phát âm"
            >
              {s.text}
            </button>
            <button
              className="kaiwa-suggestion-send"
              onClick={() => onSendDirect(s)}
              title="Gửi ngay"
            >
              →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
