// Front side of grammar card
import { Volume2 } from 'lucide-react';
import type { GrammarCard, JLPTLevel } from '../../../types/flashcard';
import type { GrammarStudySettings } from './types';
import { parseFurigana, speakJapanese } from './utils';
import { LEVEL_THEMES } from './constants';

interface GrammarCardFrontProps {
  card: GrammarCard;
  settings: GrammarStudySettings;
  lessonName: string;
  selectedLevel: JLPTLevel;
}

export function GrammarCardFront({ card, settings, lessonName, selectedLevel }: GrammarCardFrontProps) {
  const { frontShow } = settings;
  const levelTheme = LEVEL_THEMES[selectedLevel];

  return (
    <div className="grammar-card-front">
      {frontShow.level && (
        <div className="card-level-badge" style={{ background: levelTheme.gradient }}>
          {card.jlptLevel}
        </div>
      )}
      {frontShow.lesson && (
        <div className="card-lesson-badge">{lessonName}</div>
      )}
      <div className="card-main-content">
        {frontShow.title && <h3 className="grammar-title">{card.title}</h3>}
        {frontShow.formula && <div className="grammar-formula">{card.formula}</div>}
        {frontShow.meaning && (
          <div className="grammar-meaning">
            <strong>Nghĩa:</strong> {card.meaning}
          </div>
        )}
        {frontShow.explanation && card.explanation && (
          <div className="grammar-explanation">
            <strong>Giải thích:</strong> {card.explanation}
          </div>
        )}
        {frontShow.examples && card.examples.length > 0 && (
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
        )}
      </div>
      <p className="flip-hint">Nhấn để lật thẻ</p>
    </div>
  );
}
