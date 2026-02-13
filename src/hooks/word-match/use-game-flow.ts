// Word match game flow - continue, apply effect (wheel spin)

import { useCallback } from 'react';
import type {
  WordMatchGame,
  WordMatchPlayer,
  WordMatchResults,
  WordMatchPlayerResult,
  WordMatchEffectType,
} from '../../types/word-match';

interface UseGameFlowProps {
  game: WordMatchGame | null;
  isHost: boolean;
  sortedPlayers: WordMatchPlayer[];
  setGame: (game: WordMatchGame | null | ((prev: WordMatchGame | null) => WordMatchGame | null)) => void;
  setGameResults: (results: WordMatchResults | null) => void;
  startNextRound: () => void;
}

export function useGameFlow({
  game,
  isHost,
  sortedPlayers,
  setGame,
  setGameResults,
  startNextRound,
}: UseGameFlowProps) {
  // Continue to next round
  const continueGame = useCallback(() => {
    if (!game || !isHost) return;

    if (game.status === 'finished') {
      // Generate results
      const rankings: WordMatchPlayerResult[] = sortedPlayers.map((p, idx) => ({
        odinhId: p.odinhId,
        displayName: p.displayName,
        avatar: p.avatar,
        rank: idx + 1,
        score: p.score,
        correctPairs: p.correctPairs,
        perfectRounds: p.perfectRounds,
        accuracy: p.correctPairs > 0
          ? Math.round((p.correctPairs / (game.currentRound * game.settings.pairsPerRound)) * 100)
          : 0,
        isWinner: idx === 0,
      }));

      setGameResults({
        gameId: game.id,
        winner: rankings[0] || null,
        rankings,
        totalRounds: game.currentRound,
        totalPairs: game.currentRound * game.settings.pairsPerRound,
      });
    } else {
      startNextRound();
    }
  }, [game, isHost, sortedPlayers, setGameResults, startNextRound]);

  // Apply wheel effect
  const applyEffect = useCallback((effectType: WordMatchEffectType, targetId?: string) => {
    if (!game) return;

    setGame(prev => {
      if (!prev) return null;

      const newPlayers = { ...prev.players };

      switch (effectType) {
        case 'challenge':
          if (targetId && newPlayers[targetId]) {
            // Mark target as challenged (will get hard pairs next round)
            newPlayers[targetId].isChallenged = true;
            newPlayers[targetId].challengedBy = prev.wheelSpinner;
            // Steal points
            const stolen = Math.min(prev.settings.challengePointsSteal, newPlayers[targetId].score);
            newPlayers[targetId].score -= stolen;
            if (prev.wheelSpinner) {
              newPlayers[prev.wheelSpinner].score += stolen;
            }
          }
          break;

        case 'disconnect':
          if (targetId && newPlayers[targetId]) {
            if (!newPlayers[targetId].hasShield) {
              newPlayers[targetId].isDisconnected = true;
              newPlayers[targetId].disconnectedTurns = 1;
            }
          }
          break;

        case 'shield':
          if (prev.wheelSpinner) {
            newPlayers[prev.wheelSpinner].hasShield = true;
            newPlayers[prev.wheelSpinner].shieldTurns = 1;
          }
          break;
      }

      return {
        ...prev,
        status: 'result',
        players: newPlayers,
        selectedEffect: effectType,
        effectTarget: targetId,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- game changes frequently, only called by user interaction
  }, []);

  return { continueGame, applyEffect };
}
