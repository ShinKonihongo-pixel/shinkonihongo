// Answer template component showing sentence pattern and vocabulary hints

import type { AnswerTemplate, VocabularyHint } from '../../types/kaiwa';
import { FuriganaText } from '../common/furigana-text';

interface KaiwaAnswerTemplateProps {
  template: AnswerTemplate;
  showFurigana: boolean;
  onSelectHint: (hint: VocabularyHint) => void;
}

export function KaiwaAnswerTemplate({ template, showFurigana, onSelectHint }: KaiwaAnswerTemplateProps) {
  if (!template.pattern) return null;

  return (
    <div className="kaiwa-template-box">
      <div className="kaiwa-template-header">
        <span className="kaiwa-template-icon">💡</span>
        <span className="kaiwa-template-title">Gợi ý câu trả lời</span>
      </div>

      <div className="kaiwa-template-pattern">
        <FuriganaText text={template.pattern} showFurigana={showFurigana} />
      </div>

      {template.hints.length > 0 && (
        <div className="kaiwa-template-hints">
          <div className="kaiwa-hints-label">Từ gợi ý:</div>
          <div className="kaiwa-hints-list">
            {template.hints.map((hint, index) => (
              <button
                key={index}
                className="kaiwa-hint-chip"
                onClick={() => onSelectHint(hint)}
                title={`Click để dùng: ${hint.word}`}
              >
                <span className="hint-word">
                  <FuriganaText text={hint.word} showFurigana={showFurigana} />
                </span>
                <span className="hint-meaning">{hint.meaning}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
