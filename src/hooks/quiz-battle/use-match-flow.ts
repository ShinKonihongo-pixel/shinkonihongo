// Quiz Battle match flow — host drives: playing → answer_reveal → next round / finished

import { useEffect, useRef, useCallback } from 'react';
import type {
  QuizBattleGame, QuizBattlePlayer, QuizBattleResults, QuizBattleParticipantResult,
} from '../../components/pages/quiz-battle/quiz-battle-types';
import type { SetGame } from '../shared/game-types';
import { updateGameRoom } from '../../services/game-rooms';
import { calculateRatingChanges } from '../../utils/elo-rating';
import { calculateQuestionScore } from '../../utils/quiz-battle-scoring';
import { updateRatingAfterMatch } from '../../services/quiz-battle/quiz-battle-service';

interface UseMatchFlowProps {
  game: QuizBattleGame | null;
  isHost: boolean;
  currentUserId: string;
  setGame: SetGame<QuizBattleGame>;
  setGameResults: (results: QuizBattleResults | null) => void;
}

const ROUND_TIME_LIMIT_MS = 15_000;
const REVEAL_DELAY_MS = 3_000;

export function useMatchFlow({ game, isHost, currentUserId: _currentUserId, setGame, setGameResults }: UseMatchFlowProps) {
  const roundTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingRef = useRef(false);
  const finishedRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (roundTimerRef.current) { clearTimeout(roundTimerRef.current); roundTimerRef.current = null; }
    if (revealTimerRef.current) { clearTimeout(revealTimerRef.current); revealTimerRef.current = null; }
  }, []);

  const applyRoundScores = useCallback((g: QuizBattleGame): QuizBattleGame => {
    const question = g.questions[g.currentRound];
    if (!question) return g;
    const timeLimitMs = question.timeLimit * 1000;
    const updatedPlayers: Record<string, QuizBattlePlayer> = {};
    for (const [id, player] of Object.entries(g.players)) {
      const isCorrect = player.currentAnswer === question.correctIndex;
      const answerTimeMs = player.answerTime ?? timeLimitMs;
      const points = calculateQuestionScore(isCorrect, answerTimeMs, timeLimitMs);
      updatedPlayers[id] = { ...player, score: player.score + points, correctCount: isCorrect ? player.correctCount + 1 : player.correctCount };
    }
    return { ...g, players: updatedPlayers };
  }, []);

  const revealAnswer = useCallback((g: QuizBattleGame) => {
    if (!g.id) return;
    const scored = applyRoundScores(g);
    updateGameRoom(g.id, { status: 'answer_reveal', players: scored.players }).catch(console.error);
    setGame(() => ({ ...scored, status: 'answer_reveal' }));
  }, [applyRoundScores, setGame]);

  const startNextRound = useCallback((g: QuizBattleGame) => {
    if (!g.id) return;
    const nextRound = g.currentRound + 1;
    const now = Date.now();
    const resetPlayers: Record<string, QuizBattlePlayer> = {};
    for (const [id, player] of Object.entries(g.players)) {
      resetPlayers[id] = { ...player, currentAnswer: null, answerTime: null };
    }
    updateGameRoom(g.id, { status: 'playing', currentRound: nextRound, roundStartTime: now, players: resetPlayers }).catch(console.error);
    setGame(() => ({ ...g, status: 'playing', currentRound: nextRound, roundStartTime: now, players: resetPlayers }));
  }, [setGame]);

  const finishMatch = useCallback(async (g: QuizBattleGame) => {
    if (!g.id || finishedRef.current) return;
    finishedRef.current = true;
    const playerList = Object.values(g.players);
    if (playerList.length < 2) return;
    const [p1, p2] = playerList;
    const isDraw = p1.score === p2.score;
    const winner = isDraw ? null : (p1.score > p2.score ? p1 : p2);
    const loser = isDraw ? null : (p1.score > p2.score ? p2 : p1);
    const eloChanges = calculateRatingChanges(winner?.rating ?? p1.rating, loser?.rating ?? p2.rating, isDraw);
    const mkResult = (p: QuizBattlePlayer, change: number, newR: number): QuizBattleParticipantResult =>
      ({ odinhId: p.odinhId, displayName: p.displayName, score: p.score, ratingChange: change, newRating: newR });
    const results: QuizBattleResults = {
      gameId: g.id, jlptLevel: g.jlptLevel,
      winner: winner ? mkResult(winner, eloChanges.winnerChange, eloChanges.winnerNew) : null,
      loser: loser ? mkResult(loser, eloChanges.loserChange, eloChanges.loserNew) : null,
      isDraw,
    };
    const finishedAt = new Date().toISOString();
    await updateGameRoom(g.id, { status: 'finished', finishedAt, results }).catch(console.error);
    setGame(prev => prev ? { ...prev, status: 'finished', finishedAt } : null);
    setGameResults(results);
    await updateRatingAfterMatch(
      winner?.odinhId ?? p1.odinhId, loser?.odinhId ?? p2.odinhId,
      g.jlptLevel, eloChanges.winnerChange, eloChanges.loserChange, isDraw,
    ).catch(console.error);
  }, [setGame, setGameResults]);

  const answerKey = Object.values(game?.players ?? {}).map(p => p.currentAnswer).join(',');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!game || !isHost || processingRef.current) return;
    if (game.status !== 'playing' && game.status !== 'answer_reveal') return;

    if (game.status === 'playing') {
      clearTimers();
      processingRef.current = true;
      const allAnswered = Object.values(game.players).length >= 2 && Object.values(game.players).every(p => p.currentAnswer !== null);
      if (allAnswered) { revealAnswer(game); processingRef.current = false; return; }
      const elapsed = game.roundStartTime ? Date.now() - game.roundStartTime : 0;
      roundTimerRef.current = setTimeout(() => {
        processingRef.current = false;
        setGame(prev => { if (prev?.status === 'playing') revealAnswer(prev); return prev; });
      }, Math.max(0, ROUND_TIME_LIMIT_MS - elapsed));
    }

    if (game.status === 'answer_reveal') {
      clearTimers();
      processingRef.current = true;
      revealTimerRef.current = setTimeout(() => {
        processingRef.current = false;
        setGame(prev => {
          if (!prev || prev.status !== 'answer_reveal') return prev;
          if (prev.currentRound >= 19) finishMatch(prev).catch(console.error);
          else startNextRound(prev);
          return prev;
        });
      }, REVEAL_DELAY_MS);
    }

    return () => { clearTimers(); processingRef.current = false; };
  }, [game?.status, game?.currentRound, answerKey, isHost, clearTimers, revealAnswer, startNextRound, finishMatch, setGame]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return { clearTimers };
}
