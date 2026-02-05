// Next question logic
import { useCallback } from 'react';
import type { RacingGame, RacingGameResults } from '../../types/racing-game';
import { calculateGameResults } from './game-end-helpers';

interface UseNextQuestionProps {
  game: RacingGame | null;
  setGame: React.Dispatch<React.SetStateAction<RacingGame | null>>;
  setGameResults: React.Dispatch<React.SetStateAction<RacingGameResults | null>>;
  isHost: boolean;
  timerRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

export function useNextQuestion({
  game,
  setGame,
  setGameResults,
  isHost,
  timerRef,
}: UseNextQuestionProps) {
  const nextQuestion = useCallback(() => {
    if (!game || !isHost) return;

    const nextIndex = game.currentQuestionIndex + 1;
    const allFinished = Object.values(game.players).every(p => p.isFinished);
    const noMoreQuestions = nextIndex >= game.questions.length;

    if (allFinished || noMoreQuestions) {
      const results = calculateGameResults(game);
      setGameResults(results);
      setGame(prev => prev ? { ...prev, status: 'finished', finishedAt: new Date().toISOString() } : null);
      return;
    }

    const nextQ = game.questions[nextIndex];
    const resetPlayers = Object.fromEntries(
      Object.entries(game.players).map(([id, p]) => [id, { ...p, currentAnswer: undefined, answerTime: undefined }])
    );

    if (nextQ.isMysteryBox) {
      setGame(prev => prev ? {
        ...prev,
        currentQuestionIndex: nextIndex,
        status: 'mystery_box',
        questionStartTime: Date.now(),
        players: resetPlayers,
      } : null);
    } else {
      setGame(prev => prev ? {
        ...prev,
        currentQuestionIndex: nextIndex,
        status: 'question',
        questionStartTime: Date.now(),
        players: resetPlayers,
      } : null);

      timerRef.current = setTimeout(() => {
        setGame(prev => prev ? { ...prev, status: 'answering' } : null);
      }, 2000);
    }
  }, [game, isHost, setGame, setGameResults, timerRef]);

  return { nextQuestion };
}
