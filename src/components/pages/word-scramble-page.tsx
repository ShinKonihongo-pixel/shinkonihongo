import React from 'react';
import type { WordScramblePageProps } from './word-scramble/word-scramble-types';
import { useWordScrambleGame } from './word-scramble/use-word-scramble-game';
import { useGameTimer } from './word-scramble/use-game-timer';
import { SetupScreen } from './word-scramble/setup-screen';
import { PlayingScreen } from './word-scramble/playing-screen';
import { ResultScreen } from './word-scramble/result-screen';
import { WordScrambleStyles } from './word-scramble/word-scramble-styles';

export const WordScramblePage: React.FC<WordScramblePageProps> = ({
  onClose,
  flashcards,
  currentUser,
}) => {
  const {
    config,
    setConfig,
    gameState,
    setGameState,
    availableFlashcards,
    countByLevel,
    startSoloGame,
    startMultiplayerGame,
    handleLetterClick,
    handleAutoFill,
    getCurrentPenalty,
    checkAnswer,
    nextQuestion,
    resetGame,
    toggleLevel,
  } = useWordScrambleGame({ flashcards, currentUser });

  // Use timer hook
  useGameTimer({
    gameState,
    timePerQuestion: config.timePerQuestion,
    onTimerTick: setGameState,
  });

  const currentQuestion = gameState.questions[gameState.currentQuestionIndex] || null;

  return (
    <div className="ws-page">
      {gameState.phase === 'setup' && (
        <SetupScreen
          config={config}
          availableFlashcardsCount={availableFlashcards.length}
          countByLevel={countByLevel}
          onClose={onClose}
          onStartSolo={startSoloGame}
          onStartMultiplayer={startMultiplayerGame}
          onToggleLevel={toggleLevel}
          onSetTime={(time) => setConfig(prev => ({ ...prev, timePerQuestion: time }))}
          onSetQuestions={(count) => setConfig(prev => ({ ...prev, totalQuestions: count }))}
        />
      )}

      {gameState.phase === 'playing' && (
        <PlayingScreen
          currentQuestion={currentQuestion}
          gameState={gameState}
          timePerQuestion={config.timePerQuestion}
          currentPenalty={getCurrentPenalty()}
          onLetterClick={handleLetterClick}
          onAutoFill={handleAutoFill}
          onCheckAnswer={checkAnswer}
          onNextQuestion={nextQuestion}
          onResetGame={resetGame}
          onSetGameState={setGameState}
        />
      )}

      {gameState.phase === 'result' && (
        <ResultScreen
          gameState={gameState}
          onClose={onClose}
          onResetGame={resetGame}
        />
      )}

      <WordScrambleStyles />
    </div>
  );
};

// Re-export types for external use
export type { WordScramblePageProps } from './word-scramble/word-scramble-types';
