// Round management and scoring logic

import { useCallback } from 'react';
import type {
  KanjiBattleGame,
  KanjiBattlePlayer,
  KanjiBattleRoundResult,
} from '../../types/kanji-battle';

interface UseRoundLogicProps {
  game: KanjiBattleGame | null;
  setGame: (game: KanjiBattleGame | null | ((prev: KanjiBattleGame | null) => KanjiBattleGame | null)) => void;
  roundTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  scheduleBotAnswers: () => void;
}

export function useRoundLogic({
  game,
  setGame,
  roundTimerRef,
  scheduleBotAnswers,
}: UseRoundLogicProps) {
  const startNextRound = useCallback(() => {
    setGame(prev => {
      if (!prev) return null;
      const nextRound = prev.currentRound + 1;
      if (nextRound > prev.questions.length) {
        return { ...prev, status: 'finished', finishedAt: new Date().toISOString() };
      }
      const question = prev.questions[nextRound - 1];
      const newPlayers: Record<string, KanjiBattlePlayer> = {};
      Object.entries(prev.players).forEach(([id, p]) => {
        let shield = p.hasShield;
        let shieldTurns = p.shieldTurns;
        if (shieldTurns > 0) { shieldTurns--; if (shieldTurns === 0) shield = false; }
        let double = p.hasDoublePoints;
        let doubleTurns = p.doublePointsTurns;
        if (doubleTurns > 0) { doubleTurns--; if (doubleTurns === 0) double = false; }
        let slowed = p.isSlowed;
        let slowedTurns = p.slowedTurns;
        if (slowedTurns > 0) { slowedTurns--; if (slowedTurns === 0) slowed = false; }
        newPlayers[id] = {
          ...p,
          hasAnswered: false,
          currentAnswer: undefined,
          answerTime: undefined,
          isCorrect: undefined,
          hasShield: shield,
          shieldTurns,
          hasDoublePoints: double,
          doublePointsTurns: doubleTurns,
          isSlowed: slowed,
          slowedTurns,
          drawnStrokes: undefined,
          strokeScore: undefined,
          drawingTimeMs: undefined,
        };
      });
      return {
        ...prev,
        status: 'playing',
        currentRound: nextRound,
        currentQuestion: question,
        roundStartTime: Date.now(),
        players: newPlayers,
      };
    });

    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    roundTimerRef.current = setTimeout(() => {
      endRound();
    }, (game?.settings.timePerQuestion || 15) * 1000 + 500);

    scheduleBotAnswers();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- endRound is defined after, circular dependency
  }, [game?.settings.timePerQuestion, setGame, roundTimerRef, scheduleBotAnswers]);

  const endRound = useCallback(() => {
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);

    setGame(prev => {
      if (!prev || prev.status === 'result' || prev.status === 'finished') return prev;

      const newPlayers: Record<string, KanjiBattlePlayer> = {};
      const roundResult: KanjiBattleRoundResult = {
        questionId: prev.currentQuestion?.id || '',
        correctAnswer: prev.currentQuestion?.meaning || '',
        playerResults: [],
      };

      let fastestTime = Infinity;
      let fastestPlayer: string | undefined;

      Object.entries(prev.players).forEach(([id, player]) => {
        let pointsEarned = 0;

        if (player.isCorrect) {
          pointsEarned = prev.settings.pointsCorrect;

          // In write mode, scale points by stroke score
          if (prev.settings.gameMode === 'write' && player.strokeScore !== undefined) {
            pointsEarned = Math.round(pointsEarned * (player.strokeScore / 100));
          }

          if (player.hasDoublePoints) pointsEarned *= 2;

          if (player.answerTime && player.answerTime < fastestTime) {
            fastestTime = player.answerTime;
            fastestPlayer = id;
          }
        } else if (player.hasAnswered && !player.isCorrect) {
          if (!player.hasShield) {
            pointsEarned = -prev.settings.pointsPenalty;
          }
        }

        const newScore = Math.max(0, player.score + pointsEarned);
        const newStreak = player.isCorrect ? player.streak + 1 : 0;

        newPlayers[id] = {
          ...player,
          score: newScore,
          correctAnswers: player.correctAnswers + (player.isCorrect ? 1 : 0),
          wrongAnswers: player.wrongAnswers + (!player.isCorrect && player.hasAnswered ? 1 : 0),
          streak: newStreak,
        };

        roundResult.playerResults.push({
          odinhId: id,
          answer: player.currentAnswer || '',
          isCorrect: !!player.isCorrect,
          timeMs: player.answerTime || 0,
          pointsEarned,
          strokeScore: player.strokeScore,
        });
      });

      if (fastestPlayer && newPlayers[fastestPlayer]) {
        newPlayers[fastestPlayer].score += 20;
        const result = roundResult.playerResults.find(r => r.odinhId === fastestPlayer);
        if (result) result.pointsEarned += 20;
      }
      roundResult.fastestPlayer = fastestPlayer;

      const nextRound = prev.currentRound + 1;
      const isGameEnd = nextRound > prev.questions.length;
      const isSkill = prev.settings.skillsEnabled &&
        prev.currentRound % prev.settings.skillInterval === 0 &&
        !isGameEnd;

      return {
        ...prev,
        status: isGameEnd ? 'finished' : (isSkill ? 'skill_phase' : 'result'),
        players: newPlayers,
        roundResults: [...prev.roundResults, roundResult],
        finishedAt: isGameEnd ? new Date().toISOString() : undefined,
      };
    });
  }, [setGame, roundTimerRef]);

  return { startNextRound, endRound };
}
