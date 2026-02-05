// Back side of grammar card
import { Volume2 } from 'lucide-react';
import type { GrammarCard } from '../../../types/flashcard';
import type { GrammarStudySettings } from './types';
import { parseFurigana, speakJapanese } from './utils';

interface GrammarCardBackProps {
  card: GrammarCard;
  settings: GrammarStudySettings;
}

export function GrammarCardBack({ card, settings }: GrammarCardBackProps) {
  const { backShow } = settings;

  return (
    <div className="grammar-card-back">
      <div className="back-content-wrapper">
        <div className="back-section back-section-left">
          {backShow.title && <h3 className="grammar-title">{card.title}</h3>}
          {backShow.formula && <div className="grammar-formula">{card.formula}</div>}
          {backShow.meaning && (
            <div className="grammar-meaning">
              <strong>Nghĩa:</strong> {card.meaning}
            </div>
          )}
          {backShow.explanation && card.explanation && (
            <div className="grammar-explanation">
              <strong>Giải thích:</strong> {card.explanation}
            </div>
          )}
        </div>

        {backShow.examples && card.examples.length > 0 && (
          <div className="back-section back-section-right">
            <div className="grammar-examples">
              <strong>Ví dụ:</strong>
              {card.examples.map((ex, idx) => (
                <div key={idx} className="grammar-example">
                  <div className="example-japanese">
                    <span className="example-text">{parseFurigana(ex.japanese)}</span>
                    <button
                      className="btn-speak-small"
                      onClick={(e) => { e.stopPropagation(); speakJapanese(ex.japanese); }}
                    >
                      <Volume2 size={14} />
                    </button>
                  </div>
                  <div className="example-vietnamese">{ex.vietnamese}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <p className="flip-hint">Nhấn để lật thẻ</p>
    </div>
  );
}
