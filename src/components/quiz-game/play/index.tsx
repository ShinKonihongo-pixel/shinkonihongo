// Game play component - handles all gameplay states
// Professional Kahoot-like game interface

import { useState, useEffect, useRef } from 'react';
import type { QuizGame, GamePlayer, GameQuestion as GameQuestionType, PowerUpType } from '../../../types/quiz-game';
import { useGameSounds } from '../../../hooks/use-game-sounds';
import { useGameTimers } from './use-game-timers';
import { GameStarting } from './game-starting';
import { GameQuestion } from './game-question';
import { GameAnswerReveal } from './game-answer-reveal';
import { GamePowerUp } from './game-power-up';
import { GameLeaderboard } from './game-leaderboard';

export interface GamePlayProps {
  game: QuizGame;
  currentPlayer: GamePlayer | null;
  currentQuestion: GameQuestionType;
  sortedPlayers: GamePlayer[];
  isHost: boolean;
  onSubmitAnswer: (answerIndex: number) => Promise<void>;
  onRevealAnswer: () => Promise<void>;
  onNextRound: () => Promise<void>;
  onContinueFromPowerUp: () => Promise<void>;
  onContinueFromLeaderboard: () => Promise<void>;
  onUsePowerUp: (type: PowerUpType, targetId?: string) => Promise<boolean>;
  onLeaveGame: () => Promise<void>;
  gameQuestionFontSize?: number;
  gameAnswerFontSize?: number;
}

export function GamePlay({
  game,
  currentPlayer,
  currentQuestion,
  sortedPlayers,
  isHost,
  onSubmitAnswer,
  onRevealAnswer,
  onNextRound,
  onContinueFromPowerUp,
  onContinueFromLeaderboard,
  onUsePowerUp,
  onLeaveGame,
  gameQuestionFontSize = 2,
  gameAnswerFontSize = 1.1,
}: GamePlayProps) {
  const [prevScores, setPrevScores] = useState<Record<string, number>>({});

  // Game sounds
  const { playCorrect, playWrong } = useGameSounds();
  const soundPlayedRef = useRef<string>('');

  // Custom hook for all timers
  const { timeLeft, countdown, revealTimer, powerUpTimer } = useGameTimers({
    game,
    currentQuestion,
    isHost,
    onRevealAnswer,
    onNextRound,
    onContinueFromPowerUp,
    onContinueFromLeaderboard,
  });

  // Play sound when answer is revealed
  useEffect(() => {
    if (game.status === 'answer_reveal' && currentPlayer) {
      const soundKey = `reveal-${game.currentRound}`;
      if (soundPlayedRef.current !== soundKey) {
        soundPlayedRef.current = soundKey;
        const answeredCorrectly = currentPlayer.currentAnswer === currentQuestion.correctIndex;
        if (answeredCorrectly) {
          playCorrect();
        } else {
          playWrong();
        }
      }
    }
  }, [game.status, game.currentRound, currentPlayer, currentQuestion.correctIndex, playCorrect, playWrong]);

  // Save previous scores when entering question phase
  useEffect(() => {
    if (game.status === 'question') {
      const scores: Record<string, number> = {};
      Object.values(game.players).forEach(player => {
        scores[player.id] = player.score;
      });
      setPrevScores(scores);
    }
  }, [game.status, game.currentRound]);

  // Starting countdown
  if (game.status === 'starting') {
    return <GameStarting countdown={countdown} onLeaveGame={onLeaveGame} />;
  }

  // Question state
  if (game.status === 'question') {
    return (
      <GameQuestion
        game={game}
        currentPlayer={currentPlayer}
        currentQuestion={currentQuestion}
        sortedPlayers={sortedPlayers}
        timeLeft={timeLeft}
        onSubmitAnswer={onSubmitAnswer}
        onLeaveGame={onLeaveGame}
        gameQuestionFontSize={gameQuestionFontSize}
        gameAnswerFontSize={gameAnswerFontSize}
      />
    );
  }

  // Answer reveal state
  if (game.status === 'answer_reveal') {
    return (
      <GameAnswerReveal
        currentPlayer={currentPlayer}
        currentQuestion={currentQuestion}
        sortedPlayers={sortedPlayers}
        prevScores={prevScores}
        revealTimer={revealTimer}
        onLeaveGame={onLeaveGame}
      />
    );
  }

  // Power-up selection state
  if (game.status === 'power_up') {
    return (
      <GamePowerUp
        currentPlayer={currentPlayer}
        currentQuestion={currentQuestion}
        sortedPlayers={sortedPlayers}
        powerUpTimer={powerUpTimer}
        onUsePowerUp={onUsePowerUp}
        onLeaveGame={onLeaveGame}
      />
    );
  }

  // Leaderboard state
  if (game.status === 'leaderboard') {
    return (
      <GameLeaderboard
        game={game}
        currentPlayer={currentPlayer}
        sortedPlayers={sortedPlayers}
        revealTimer={revealTimer}
        onLeaveGame={onLeaveGame}
      />
    );
  }

  // Fallback
  return (
    <div className="game-fullscreen game-loading-screen">
      <div className="loading-spinner" />
      <p>Đang tải...</p>
      <button className="leave-btn" onClick={onLeaveGame}>
        Rời game
      </button>
    </div>
  );
}
