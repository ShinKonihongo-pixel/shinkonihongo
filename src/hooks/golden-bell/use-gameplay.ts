// Golden Bell Gameplay Logic
// Handles answer submission, reveal, and progression

import { useCallback } from 'react';
import type {
  GoldenBellGame,
  GoldenBellPlayer,
  GoldenBellQuestion,
  GoldenBellResults,
} from '../../types/golden-bell';
import { generateResults } from './utils';

interface UseGameplayProps {
  game: GoldenBellGame | null;
  currentPlayer: GoldenBellPlayer | undefined;
  currentQuestion: GoldenBellQuestion | null;
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
  };
  setGame: (updater: (prev: GoldenBellGame | null) => GoldenBellGame | null) => void;
  setGameResults: (results: GoldenBellResults | null) => void;
  isHost: boolean;
}

export function useGameplay({
  game,
  currentPlayer,
  currentQuestion,
  currentUser,
  setGame,
  setGameResults,
  isHost,
}: UseGameplayProps) {
  // Submit answer
  const submitAnswer = useCallback((answerIndex: number) => {
    if (!game || !currentQuestion || game.status !== 'answering') return;
    if (!currentPlayer || currentPlayer.status !== 'alive') return;

    const answerTime = Date.now() - (game.questionStartTime || Date.now());
    const isCorrect = answerIndex === currentQuestion.correctIndex;

    setGame(prev => {
      if (!prev) return null;
      const player = prev.players[currentUser.id];
      if (!player) return prev;

      const newStreak = isCorrect ? player.streak + 1 : 0;

      return {
        ...prev,
        players: {
          ...prev.players,
          [currentUser.id]: {
            ...player,
            currentAnswer: answerIndex,
            answerTime,
            totalAnswers: player.totalAnswers + 1,
            correctAnswers: isCorrect ? player.correctAnswers + 1 : player.correctAnswers,
            streak: newStreak,
          },
        },
      };
    });
  }, [game, currentQuestion, currentPlayer, currentUser, setGame]);

  // Reveal answer and eliminate wrong players (host only)
  const revealAnswer = useCallback(() => {
    if (!game || !isHost || game.status !== 'answering') return;

    const correctIndex = currentQuestion?.correctIndex;
    const eliminated: string[] = [];

    // Find players who answered wrong or didn't answer
    Object.values(game.players).forEach(player => {
      if (player.status === 'alive') {
        const answeredWrong = player.currentAnswer !== correctIndex;
        const didNotAnswer = player.currentAnswer === undefined;

        if (answeredWrong || didNotAnswer) {
          eliminated.push(player.odinhId);
        }
      }
    });

    setGame(prev => {
      if (!prev) return null;

      const updatedPlayers = { ...prev.players };
      eliminated.forEach(id => {
        if (updatedPlayers[id]) {
          updatedPlayers[id] = {
            ...updatedPlayers[id],
            status: 'eliminated',
            eliminatedAt: prev.currentQuestionIndex + 1,
          };
        }
      });

      const newAliveCount = Object.values(updatedPlayers).filter(p => p.status === 'alive').length;

      return {
        ...prev,
        status: 'revealing',
        players: updatedPlayers,
        alivePlayers: newAliveCount,
        eliminatedThisRound: eliminated,
      };
    });
  }, [game, isHost, currentQuestion, setGame]);

  // Move to next question or end game (host only)
  const nextQuestion = useCallback(() => {
    if (!game || !isHost || game.status !== 'revealing') return;

    const alivePlayersCount = Object.values(game.players).filter(p => p.status === 'alive').length;
    const isLastQuestion = game.currentQuestionIndex >= game.questions.length - 1;

    // End game if only 1 player left or no more questions
    if (alivePlayersCount <= 1 || isLastQuestion) {
      // Generate results
      const rankings = generateResults(game);

      setGame(prev => {
        if (!prev) return null;

        // Mark winner if there's exactly one alive
        const updatedPlayers = { ...prev.players };
        const alivePlayers = Object.values(updatedPlayers).filter(p => p.status === 'alive');
        if (alivePlayers.length === 1) {
          updatedPlayers[alivePlayers[0].odinhId] = {
            ...alivePlayers[0],
            status: 'winner',
          };
        }

        return {
          ...prev,
          status: 'finished',
          finishedAt: new Date().toISOString(),
          players: updatedPlayers,
        };
      });

      setGameResults({
        gameId: game.id,
        winner: rankings[0]?.isWinner ? rankings[0] : null,
        rankings,
        totalQuestions: game.currentQuestionIndex + 1,
        totalPlayers: Object.keys(game.players).length,
      });

      return;
    }

    // Move to next question
    setGame(prev => {
      if (!prev) return null;

      // Reset player answers for next round
      const resetPlayers = { ...prev.players };
      Object.keys(resetPlayers).forEach(id => {
        resetPlayers[id] = {
          ...resetPlayers[id],
          currentAnswer: undefined,
          answerTime: undefined,
        };
      });

      return {
        ...prev,
        status: 'question',
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        players: resetPlayers,
        eliminatedThisRound: [],
      };
    });

    // Auto-transition to answering
    setTimeout(() => {
      setGame(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'answering',
          questionStartTime: Date.now(),
        };
      });
    }, 2000);
  }, [game, isHost, setGame, setGameResults]);

  return {
    submitAnswer,
    revealAnswer,
    nextQuestion,
  };
}
