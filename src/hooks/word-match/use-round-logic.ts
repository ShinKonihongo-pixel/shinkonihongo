// Word match round logic - start, end, submit

import { useCallback } from 'react';
import type { WordMatchGame, WordMatchPlayer, WordMatchRoundResult } from '../../types/word-match';
import { shuffleArray } from '../../lib/game-utils';

interface UseRoundLogicProps {
  game: WordMatchGame | null;
  setGame: (game: WordMatchGame | null | ((prev: WordMatchGame | null) => WordMatchGame | null)) => void;
  roundTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  currentUser: {
    id: string;
  };
}

export function useRoundLogic({
  game,
  setGame,
  roundTimerRef,
  currentUser,
}: UseRoundLogicProps) {
  // Schedule bot answers - internal
  const scheduleBotAnswers = useCallback(() => {
    if (!game) return;

    const bots = Object.values(game.players).filter(p => p.isBot && !p.isDisconnected);
    bots.forEach(bot => {
      const delay = 3000 + Math.random() * (game.settings.timePerRound * 1000 - 5000);
      const accuracy = 0.6 + Math.random() * 0.35; // 60-95% accuracy per pair

      setTimeout(() => {
        setGame(prev => {
          if (!prev || prev.status !== 'playing') return prev;
          if (prev.players[bot.odinhId]?.hasSubmitted) return prev;
          if (!prev.currentRoundData) return prev;

          // Generate bot's matches
          const matches: { leftId: string; rightId: string }[] = [];
          const rightIds = prev.currentRoundData.pairs.map(p => p.id);
          const shuffledRightIds = shuffleArray([...rightIds]);

          prev.currentRoundData.pairs.forEach((pair, idx) => {
            const isCorrect = Math.random() < accuracy;
            matches.push({
              leftId: pair.id,
              rightId: isCorrect ? pair.id : shuffledRightIds[idx],
            });
          });

          const newPlayers = { ...prev.players };
          newPlayers[bot.odinhId] = {
            ...newPlayers[bot.odinhId],
            currentMatches: matches,
            hasSubmitted: true,
            submitTime: Date.now(),
          };

          return { ...prev, players: newPlayers };
        });
      }, delay);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- game changes frequently, only called explicitly by startNextRound
  }, []);

  // Start next round
  const startNextRound = useCallback(() => {
    setGame(prev => {
      if (!prev) return null;

      const nextRound = prev.currentRound + 1;
      if (nextRound > prev.rounds.length) {
        return { ...prev, status: 'finished', finishedAt: new Date().toISOString() };
      }

      const roundData = prev.rounds[nextRound - 1];

      // Reset player states for new round
      const newPlayers: Record<string, WordMatchPlayer> = {};
      Object.entries(prev.players).forEach(([id, p]) => {
        // Decrease effect turns
        let shield = p.hasShield;
        let shieldTurns = p.shieldTurns;
        if (shieldTurns > 0) {
          shieldTurns--;
          if (shieldTurns === 0) shield = false;
        }

        let disconnected = p.isDisconnected;
        let disconnectedTurns = p.disconnectedTurns;
        if (disconnectedTurns > 0) {
          disconnectedTurns--;
          if (disconnectedTurns === 0) disconnected = false;
        }

        newPlayers[id] = {
          ...p,
          currentMatches: [],
          hasSubmitted: false,
          submitTime: undefined,
          hasShield: shield,
          shieldTurns,
          isDisconnected: disconnected,
          disconnectedTurns,
          isChallenged: false,
          challengedBy: undefined,
        };
      });

      return {
        ...prev,
        status: 'playing',
        currentRound: nextRound,
        currentRoundData: roundData,
        roundStartTime: Date.now(),
        players: newPlayers,
      };
    });

    // Set round timer
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    roundTimerRef.current = setTimeout(() => {
      endRound();
    }, (game?.settings.timePerRound || 30) * 1000 + 500);

    // Bot auto-answer
    scheduleBotAnswers();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- endRound/scheduleBotAnswers would cause infinite loops
  }, [game?.settings.timePerRound, setGame, roundTimerRef]);

  // End round - internal
  const endRound = useCallback(() => {
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);

    setGame(prev => {
      if (!prev || prev.status === 'result' || prev.status === 'finished') return prev;
      if (!prev.currentRoundData) return prev;

      // Calculate scores
      const newPlayers: Record<string, WordMatchPlayer> = {};
      const roundResult: WordMatchRoundResult = {
        roundId: prev.currentRoundData.id,
        roundNumber: prev.currentRound,
        isSpecial: prev.currentRoundData.isSpecial,
        correctPairs: prev.currentRoundData.pairs.map(p => ({ leftId: p.id, rightId: p.id })),
        playerResults: [],
      };

      let bestScore = -1;
      let wheelWinner: string | undefined;

      Object.entries(prev.players).forEach(([id, player]) => {
        if (player.isDisconnected) {
          newPlayers[id] = { ...player, streak: 0 };
          roundResult.playerResults.push({
            odinhId: id,
            matches: [],
            correctCount: 0,
            allCorrect: false,
            timeMs: 0,
            pointsEarned: 0,
          });
          return;
        }

        // Count correct matches
        let correctCount = 0;
        player.currentMatches.forEach(match => {
          const pair = prev.currentRoundData!.pairs.find(p => p.id === match.leftId);
          if (pair && pair.id === match.rightId) {
            correctCount++;
          }
        });

        const allCorrect = correctCount === prev.settings.pairsPerRound;
        let pointsEarned = correctCount * prev.settings.pointsPerPair;
        if (allCorrect) {
          pointsEarned += prev.settings.bonusAllCorrect;
        }

        // Track for wheel spin winner (special rounds)
        if (prev.currentRoundData!.isSpecial && allCorrect) {
          const responseTime = player.submitTime ? player.submitTime - (prev.roundStartTime || 0) : Infinity;
          if (bestScore === -1 || responseTime < bestScore) {
            bestScore = responseTime;
            wheelWinner = id;
          }
        }

        const newStreak = correctCount > 0 ? player.streak + 1 : 0;

        newPlayers[id] = {
          ...player,
          score: player.score + pointsEarned,
          correctPairs: player.correctPairs + correctCount,
          perfectRounds: player.perfectRounds + (allCorrect ? 1 : 0),
          streak: newStreak,
        };

        roundResult.playerResults.push({
          odinhId: id,
          matches: player.currentMatches,
          correctCount,
          allCorrect,
          timeMs: player.submitTime ? player.submitTime - (prev.roundStartTime || 0) : 0,
          pointsEarned,
        });
      });

      roundResult.wheelWinner = wheelWinner;

      // Check for wheel spin or continue
      const isGameEnd = prev.currentRound >= prev.rounds.length;
      const needsWheelSpin = prev.currentRoundData.isSpecial && wheelWinner && !isGameEnd;

      return {
        ...prev,
        status: isGameEnd ? 'finished' : (needsWheelSpin ? 'wheel_spin' : 'result'),
        players: newPlayers,
        roundResults: [...prev.roundResults, roundResult],
        wheelSpinner: wheelWinner,
        finishedAt: isGameEnd ? new Date().toISOString() : undefined,
      };
    });
  }, [setGame, roundTimerRef]);

  // Submit matches
  const submitMatches = useCallback((matches: { leftId: string; rightId: string }[]) => {
    if (!game) return;
    const currentPlayer = game.players[currentUser.id];
    if (!currentPlayer || game.status !== 'playing') return;
    if (currentPlayer.hasSubmitted || currentPlayer.isDisconnected) return;

    setGame(prev => {
      if (!prev) return null;

      const newPlayers = { ...prev.players };
      newPlayers[currentUser.id] = {
        ...newPlayers[currentUser.id],
        currentMatches: matches,
        hasSubmitted: true,
        submitTime: Date.now(),
      };

      // Check if all players submitted
      const allSubmitted = Object.values(newPlayers).every(
        p => p.hasSubmitted || p.isDisconnected
      );

      return {
        ...prev,
        players: newPlayers,
        status: allSubmitted ? 'result' : 'playing',
      };
    });
  }, [game, currentUser, setGame]);

  return { startNextRound, endRound, submitMatches };
}
