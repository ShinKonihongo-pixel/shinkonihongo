import React from 'react';
import { Trophy } from 'lucide-react';
import type { Question, GameState } from './word-scramble-types';
import type { JLPTLevel } from '../../../types/flashcard';
import { HintsPanel } from './hints-panel';
import { LeaderboardPanel } from './leaderboard-panel';
import { GameHeader } from './game-header';
import { TimerBar } from './timer-bar';
import { GameArea } from './game-area';

interface PlayingScreenProps {
  currentQuestion: Question | null;
  gameState: GameState;
  timePerQuestion: number;
  currentPenalty: number;
  onLetterClick: (index: number) => void;
  onAutoFill: () => void;
  onCheckAnswer: () => void;
  onNextQuestion: () => void;
  onResetGame: () => void;
  onSetGameState: (callback: (prev: GameState) => GameState) => void;
}

export const PlayingScreen: React.FC<PlayingScreenProps> = ({
  currentQuestion,
  gameState,
  timePerQuestion,
  currentPenalty,
  onLetterClick,
  onAutoFill,
  onCheckAnswer,
  onNextQuestion,
  onResetGame,
  onSetGameState,
}) => {
  if (!currentQuestion) return null;

  const handleSlotClick = (index: number) => {
    if (gameState.showResult) return;
    const selectedLetter = gameState.selectedLetters[index];
    const isAutoFilled = gameState.autoFilledPositions.includes(index);
    if (selectedLetter !== undefined && !isAutoFilled) {
      onSetGameState(prev => ({
        ...prev,
        selectedLetters: prev.selectedLetters.filter((_, i) => i !== index),
      }));
    }
  };

  return (
    <div className="ws-game-layout">
      {/* Left Panel - Hints & Leaderboard */}
      <div className="ws-left-panel">
        <HintsPanel gameState={gameState} />
        <LeaderboardPanel players={gameState.players} isSoloMode={gameState.isSoloMode} />
      </div>

      {/* Center - Game Area */}
      <div className="ws-center-panel">
        <GameHeader
          currentQuestionIndex={gameState.currentQuestionIndex}
          totalQuestions={gameState.questions.length}
          jlptLevel={currentQuestion.word.jlptLevel as JLPTLevel}
          onClose={onResetGame}
        />

        <TimerBar timeRemaining={gameState.timeRemaining} timePerQuestion={timePerQuestion} />

        <GameArea
          currentQuestion={currentQuestion}
          gameState={gameState}
          currentPenalty={currentPenalty}
          onLetterClick={onLetterClick}
          onAutoFill={onAutoFill}
          onCheckAnswer={onCheckAnswer}
          onNextQuestion={onNextQuestion}
          onSlotClick={handleSlotClick}
        />

        {/* Footer score display */}
        <div className="ws-game-footer">
          <div className="ws-score-display">
            <Trophy size={20} />
            <span className="score-value">{gameState.score}</span>
            <span className="score-label">điểm</span>
          </div>
        </div>
      </div>
    </div>
  );
};
