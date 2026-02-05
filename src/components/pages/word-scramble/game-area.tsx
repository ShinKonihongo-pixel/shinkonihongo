import React from 'react';
import { Lightbulb, Check, X, ChevronRight } from 'lucide-react';
import type { Question, GameState } from './word-scramble-types';

interface GameAreaProps {
  currentQuestion: Question;
  gameState: GameState;
  currentPenalty: number;
  onLetterClick: (index: number) => void;
  onAutoFill: () => void;
  onCheckAnswer: () => void;
  onNextQuestion: () => void;
  onSlotClick: (index: number) => void;
}

export const GameArea: React.FC<GameAreaProps> = ({
  currentQuestion,
  gameState,
  currentPenalty,
  onLetterClick,
  onAutoFill,
  onCheckAnswer,
  onNextQuestion,
  onSlotClick,
}) => {
  const correctWord = currentQuestion.word.vocabulary || '';

  return (
    <div className="ws-question-area">
      {/* Word count info */}
      <div className="ws-word-info">
        <span className="ws-word-count">{correctWord.length} chữ cái</span>
      </div>

      {/* Scrambled letters - 3x bigger */}
      <div className="ws-letters-container-big">
        {currentQuestion.scrambledLetters.map((letter, index) => {
          const isSelected = gameState.selectedLetters.includes(index);
          return (
            <button
              key={index}
              className={`ws-letter-big ${isSelected ? 'selected' : ''}`}
              onClick={() => onLetterClick(index)}
              disabled={gameState.showResult}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Answer slots - closer to result */}
      <div className="ws-answer-section">
        <div className="ws-slots-container">
          {correctWord.split('').map((_, index) => {
            const selectedLetterIndex = gameState.selectedLetters[index];
            const selectedLetter = selectedLetterIndex !== undefined && selectedLetterIndex >= 0
              ? currentQuestion.scrambledLetters[selectedLetterIndex]
              : null;
            const correctLetter = correctWord[index];
            const isCorrectSlot = gameState.showResult && selectedLetter === correctLetter;
            const isWrongSlot = gameState.showResult && selectedLetter && selectedLetter !== correctLetter;
            const isAutoFilled = gameState.autoFilledPositions.includes(index);

            return (
              <div
                key={index}
                className={`ws-slot ${selectedLetter ? 'filled' : ''} ${isCorrectSlot ? 'correct' : ''} ${isWrongSlot ? 'wrong' : ''} ${isAutoFilled ? 'auto-filled' : ''}`}
                onClick={() => onSlotClick(index)}
              >
                {gameState.showResult && !selectedLetter ? (
                  <span className="slot-correct">{correctLetter}</span>
                ) : (
                  selectedLetter || ''
                )}
              </div>
            );
          })}
        </div>

        {/* Auto-fill button */}
        {!gameState.showResult && (
          <div className="ws-autofill-section">
            <button
              className="ws-autofill-btn"
              onClick={onAutoFill}
              disabled={gameState.autoFillUsed >= 3}
            >
              <Lightbulb size={18} />
              <span>Điền tự động</span>
              <span className="autofill-count">({3 - gameState.autoFillUsed}/3)</span>
            </button>
            {gameState.autoFillUsed > 0 && (
              <span className="ws-penalty-info">
                -{Math.round(currentPenalty * 100)}% điểm
              </span>
            )}
          </div>
        )}

        {/* Result display - close to answer */}
        {gameState.showResult && (
          <div className="ws-result-inline">
            <div className={`ws-feedback ${gameState.isCorrect ? 'correct' : 'wrong'}`}>
              {gameState.isCorrect ? (
                <><Check size={18} /> Chính xác!</>
              ) : (
                <><X size={18} /> Sai! Đáp án: <strong>{correctWord}</strong></>
              )}
            </div>
            <button className="ws-btn ws-btn-next" onClick={onNextQuestion}>
              {gameState.currentQuestionIndex < gameState.questions.length - 1 ? 'Câu tiếp' : 'Xem kết quả'}
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Check button */}
        {!gameState.showResult && (
          <button
            className="ws-btn ws-btn-check"
            onClick={onCheckAnswer}
            disabled={gameState.selectedLetters.filter(l => l >= 0).length !== correctWord.length}
          >
            <Check size={20} /> Kiểm tra
          </button>
        )}
      </div>
    </div>
  );
};
