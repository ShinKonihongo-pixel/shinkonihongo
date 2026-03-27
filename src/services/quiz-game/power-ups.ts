// Power-up management for Quiz Game
// Uses Firestore transactions to prevent race conditions with game-flow updates

import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { QuizGame } from '../../types/quiz-game';
import { COLLECTIONS } from './constants';

export async function usePowerUp(
  gameId: string,
  playerId: string,
  powerUpType: string,
  targetPlayerId?: string
): Promise<boolean> {
  const gameRef = doc(db, COLLECTIONS.GAMES, gameId);

  try {
    return await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(gameRef);
      if (!snapshot.exists()) return false;

      const game = { id: snapshot.id, ...snapshot.data() } as QuizGame;
      if (game.status !== 'power_up') return false;

      const player = game.players[playerId];
      if (!player) return false;

      // Build field-level updates only for affected players
      const fields: Record<string, unknown> = {};

      switch (powerUpType) {
        case 'steal_points': {
          if (!targetPlayerId || !game.players[targetPlayerId]) return false;
          const target = game.players[targetPlayerId];
          if (target.hasShield) {
            fields[`players.${targetPlayerId}.hasShield`] = false;
          } else {
            const stolenPoints = Math.min(50, target.score);
            fields[`players.${targetPlayerId}.score`] = target.score - stolenPoints;
            fields[`players.${playerId}.score`] = player.score + stolenPoints;
          }
          break;
        }

        case 'block_player': {
          if (!targetPlayerId || !game.players[targetPlayerId]) return false;
          const target = game.players[targetPlayerId];
          if (target.hasShield) {
            fields[`players.${targetPlayerId}.hasShield`] = false;
          } else {
            fields[`players.${targetPlayerId}.isBlocked`] = true;
          }
          break;
        }

        case 'double_points':
          fields[`players.${playerId}.hasDoublePoints`] = true;
          break;

        case 'shield':
          fields[`players.${playerId}.hasShield`] = true;
          break;

        case 'time_freeze':
          fields[`players.${playerId}.hasTimeFreeze`] = true;
          break;

        default:
          return false;
      }

      // Atomic field-level update within transaction
      transaction.update(gameRef, fields);
      return true;
    });
  } catch {
    return false;
  }
}
