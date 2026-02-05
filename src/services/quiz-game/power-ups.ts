// Power-up management for Quiz Game

import { getGame, updateGame } from './game-crud';

export async function usePowerUp(
  gameId: string,
  playerId: string,
  powerUpType: string,
  targetPlayerId?: string
): Promise<boolean> {
  const game = await getGame(gameId);
  if (!game || game.status !== 'power_up') return false;

  const player = game.players[playerId];
  if (!player) return false;

  const updatedPlayers = { ...game.players };

  switch (powerUpType) {
    case 'steal_points':
      if (!targetPlayerId || !updatedPlayers[targetPlayerId]) return false;
      if (updatedPlayers[targetPlayerId].hasShield) {
        // Target has shield, remove their shield but don't steal
        updatedPlayers[targetPlayerId] = {
          ...updatedPlayers[targetPlayerId],
          hasShield: false,
        };
      } else {
        const stolenPoints = Math.min(50, updatedPlayers[targetPlayerId].score);
        updatedPlayers[targetPlayerId] = {
          ...updatedPlayers[targetPlayerId],
          score: updatedPlayers[targetPlayerId].score - stolenPoints,
        };
        updatedPlayers[playerId] = {
          ...updatedPlayers[playerId],
          score: updatedPlayers[playerId].score + stolenPoints,
        };
      }
      break;

    case 'block_player':
      if (!targetPlayerId || !updatedPlayers[targetPlayerId]) return false;
      if (updatedPlayers[targetPlayerId].hasShield) {
        updatedPlayers[targetPlayerId] = {
          ...updatedPlayers[targetPlayerId],
          hasShield: false,
        };
      } else {
        updatedPlayers[targetPlayerId] = {
          ...updatedPlayers[targetPlayerId],
          isBlocked: true,
        };
      }
      break;

    case 'double_points':
      updatedPlayers[playerId] = {
        ...updatedPlayers[playerId],
        hasDoublePoints: true,
      };
      break;

    case 'shield':
      updatedPlayers[playerId] = {
        ...updatedPlayers[playerId],
        hasShield: true,
      };
      break;

    case 'time_freeze':
      updatedPlayers[playerId] = {
        ...updatedPlayers[playerId],
        hasTimeFreeze: true,
      };
      break;

    default:
      return false;
  }

  await updateGame(gameId, { players: updatedPlayers });
  return true;
}
