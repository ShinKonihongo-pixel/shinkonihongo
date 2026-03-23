// Conjugation trainer — quiz-style verb conjugation practice

import { useState, useCallback, useRef, useEffect } from 'react';
import { VERB_DATA, CONJUGATION_TYPES, type ConjugationType } from '../../data/conjugation-data';
import './conjugation-trainer-page.css';

function randomVerb() {
  return VERB_DATA[Math.floor(Math.random() * VERB_DATA.length)];
}

export function ConjugationTrainerPage() {
  const [selectedType, setSelectedType] = useState<ConjugationType>('te-form');
  const [currentVerb, setCurrentVerb] = useState(() => randomVerb());
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const correctAnswer = currentVerb.conjugations[selectedType];
  const typeInfo = CONJUGATION_TYPES.find(t => t.type === selectedType)!;

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentVerb, selectedType]);

  const checkAnswer = useCallback(() => {
    if (!input.trim()) return;
    const isCorrect = input.trim() === correctAnswer;
    setResult(isCorrect ? 'correct' : 'wrong');
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      wrong: prev.wrong + (isCorrect ? 0 : 1),
    }));
  }, [input, correctAnswer]);

  const nextQuestion = useCallback(() => {
    setCurrentVerb(randomVerb());
    setInput('');
    setResult(null);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (result) nextQuestion();
      else checkAnswer();
    }
  };

  const groupLabels = { ichidan: '一段 (Ichidan)', godan: '五段 (Godan)', irregular: '不規則 (Bất quy tắc)' };

  return (
    <div className="cj">
      <div className="cj-header">
        <h1 className="cj-title">Luyện Chia Động Từ</h1>
      </div>

      {/* Type selector */}
      <div className="cj-types">
        {CONJUGATION_TYPES.map(t => (
          <button
            key={t.type}
            className={`cj-type-btn ${selectedType === t.type ? 'active' : ''}`}
            onClick={() => { setSelectedType(t.type); nextQuestion(); }}
          >
            {t.nameJp} ({t.nameVi})
          </button>
        ))}
      </div>

      {/* Question card */}
      <div className="cj-card">
        <span className={`cj-group ${currentVerb.group}`}>{groupLabels[currentVerb.group]}</span>
        <div className="cj-verb">{currentVerb.dictionary}</div>
        <div className="cj-reading">{currentVerb.reading}</div>
        <div className="cj-meaning">{currentVerb.meaning}</div>
        <div className="cj-target">→ {typeInfo.nameJp} ({typeInfo.nameVi})</div>

        {/* Input */}
        <div className="cj-input-wrap">
          <input
            ref={inputRef}
            className={`cj-input ${result || ''}`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập câu trả lời..."
            disabled={result !== null}
          />
          {!result && (
            <button className="cj-check-btn" onClick={checkAnswer} disabled={!input.trim()}>
              Kiểm tra
            </button>
          )}
        </div>

        {/* Result */}
        {result && (
          <div>
            <div className={`cj-result ${result}`}>
              {result === 'correct' ? '✓ Chính xác!' : '✗ Sai rồi!'}
            </div>
            {result === 'wrong' && (
              <div className="cj-answer">Đáp án: {correctAnswer}</div>
            )}
            <button className="cj-next-btn" onClick={nextQuestion}>
              Câu tiếp theo →
            </button>
          </div>
        )}

        {/* Score */}
        <div className="cj-score">
          <div className="cj-score-item">
            <div className="cj-score-value green">{score.correct}</div>
            <div className="cj-score-label">Đúng</div>
          </div>
          <div className="cj-score-item">
            <div className="cj-score-value red">{score.wrong}</div>
            <div className="cj-score-label">Sai</div>
          </div>
        </div>
      </div>
    </div>
  );
}
