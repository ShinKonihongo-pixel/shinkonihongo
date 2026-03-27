// Player management for Quiz Game

import type { QuizGame, GamePlayer } from '../../types/quiz-game';
import { getGame, getGameByCode, updateGame, updateGameFields, deleteGame } from './game-crud';

export async function joinGame(
  gameCode: string,
  playerId: string,
  playerName: string,
  playerAvatar?: string,
  playerRole?: string
): Promise<{ game: QuizGame; error?: string }> {
  const game = await getGameByCode(gameCode);

  if (!game) {
    return { game: null as unknown as QuizGame, error: 'Không tìm thấy game' };
  }

  if (game.status !== 'waiting') {
    return { game, error: 'Game đã bắt đầu' };
  }

  const playerCount = Object.keys(game.players).length;
  if (playerCount >= game.settings.maxPlayers) {
    return { game, error: 'Game đã đầy' };
  }

  // If player already in game, allow rejoin (no error)
  if (game.players[playerId]) {
    return { game };
  }

  const newPlayer: GamePlayer = {
    id: playerId,
    name: playerName,
    avatar: playerAvatar || '',
    role: playerRole,
    score: 0,
    isHost: false,
    isBlocked: false,
    hasDoublePoints: false,
    hasShield: false,
    hasTimeFreeze: false,
    currentAnswer: null,
    answerTime: null,
    streak: 0,
    correctAnswers: 0,
    joinedAt: new Date().toISOString(),
  };

  // Field-level: only write the new player, not entire players object
  await updateGameFields(game.id, {
    [`players.${playerId}`]: newPlayer,
  });

  return { game: { ...game, players: { ...game.players, [playerId]: newPlayer } } };
}

export async function leaveGame(gameId: string, playerId: string): Promise<void> {
  const game = await getGame(gameId);
  if (!game) return;

  const { [playerId]: _removed, ...remainingPlayers } = game.players;
  const remainingCount = Object.keys(remainingPlayers).length;

  // If no players left after removal, delete the game
  if (remainingCount === 0) {
    await deleteGame(gameId);
    return;
  }

  // If host leaves, destroy the entire room
  if (playerId === game.hostId) {
    await deleteGame(gameId);
    return;
  }

  await updateGame(gameId, { players: remainingPlayers });
}

export async function kickPlayer(gameId: string, hostId: string, playerId: string): Promise<boolean> {
  const game = await getGame(gameId);
  if (!game || game.hostId !== hostId) return false;
  if (playerId === hostId) return false; // Can't kick yourself

  const { [playerId]: _removed, ...remainingPlayers } = game.players;
  await updateGame(gameId, { players: remainingPlayers });
  return true;
}
