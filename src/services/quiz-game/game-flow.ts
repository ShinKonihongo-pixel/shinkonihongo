// Game flow management for Quiz Game

import type { GameStatus } from '../../types/quiz-game';
import { getGame, updateGame } from './game-crud';
import { endGame } from './game-results';

export async function startGame(gameId: string, hostId: string): Promise<boolean> {
  const game = await getGame(gameId);
  if (!game || game.hostId !== hostId) return false;
  if (game.status !== 'waiting') return false;

  const playerCount = Object.keys(game.players).length;
  if (playerCount < game.settings.minPlayers) return false;

  await updateGame(gameId, {
    status: 'starting',
  });

  // After 3 second countdown, move to first question
  setTimeout(async () => {
    await updateGame(gameId, {
      status: 'question',
      currentRound: 0,
      roundStartTime: Date.now(),
    });
  }, 3000);

  return true;
}

export async function submitAnswer(
  gameId: string,
  playerId: string,
  answerIndex: number
): Promise<void> {
  const game = await getGame(gameId);
  if (!game || game.status !== 'question') return;

  const player = game.players[playerId];
  if (!player || player.isBlocked || player.currentAnswer !== null) return;

  const answerTime = Date.now() - (game.roundStartTime || Date.now());

  await updateGame(gameId, {
    players: {
      ...game.players,
      [playerId]: {
        ...player,
        currentAnswer: answerIndex,
        answerTime,
      },
    },
  });
}

export async function revealAnswer(gameId: string, hostId: string): Promise<void> {
  const game = await getGame(gameId);
  if (!game || game.hostId !== hostId || game.status !== 'question') return;

  const currentQuestion = game.questions[game.currentRound];
  const updatedPlayers = { ...game.players };

  // Calculate scores
  for (const playerId of Object.keys(updatedPlayers)) {
    const player = updatedPlayers[playerId];

    if (player.isBlocked) {
      // Reset blocked status for next round
      updatedPlayers[playerId] = { ...player, isBlocked: false };
      continue;
    }

    const isCorrect = player.currentAnswer === currentQuestion.correctIndex;

    if (isCorrect) {
      let points = game.settings.basePoints;

      // Time bonus (faster = more points)
      if (game.settings.timeBonus && player.answerTime) {
        const timeRatio = 1 - (player.answerTime / (currentQuestion.timeLimit * 1000));
        points += Math.floor(points * timeRatio * 0.5); // Up to 50% bonus
      }

      // Streak bonus
      const newStreak = player.streak + 1;
      points += newStreak * game.settings.streakBonus;

      // Double points power-up
      if (player.hasDoublePoints) {
        points *= 2;
      }

      updatedPlayers[playerId] = {
        ...player,
        score: player.score + points,
        streak: newStreak,
        hasDoublePoints: false, // Reset after use
        hasTimeFreeze: false,
      };
    } else {
      // Reset streak on wrong answer
      updatedPlayers[playerId] = {
        ...player,
        streak: 0,
        hasDoublePoints: false,
        hasTimeFreeze: false,
      };
    }
  }

  const nextStatus: GameStatus = 'answer_reveal';

  await updateGame(gameId, {
    status: nextStatus,
    players: updatedPlayers,
  });
}

export async function nextRound(gameId: string, hostId: string): Promise<void> {
  const game = await getGame(gameId);
  if (!game || game.hostId !== hostId) return;

  const currentQuestion = game.questions[game.currentRound];
  const isSpecialRound = currentQuestion.isSpecialRound;
  const isLastRound = game.currentRound >= game.totalRounds - 1;
  const showLeaderboard = (game.currentRound + 1) % game.settings.showLeaderboardEvery === 0;

  if (isLastRound) {
    // End game
    await endGame(gameId);
    return;
  }

  let nextStatus: GameStatus;
  if (isSpecialRound) {
    nextStatus = 'power_up';
  } else if (showLeaderboard) {
    nextStatus = 'leaderboard';
  } else {
    nextStatus = 'question';
  }

  // Only reset player answers if NOT going to power_up phase
  // Power-up phase needs currentAnswer to check who answered correctly
  const updatedPlayers = { ...game.players };
  if (nextStatus !== 'power_up') {
    for (const playerId of Object.keys(updatedPlayers)) {
      updatedPlayers[playerId] = {
        ...updatedPlayers[playerId],
        currentAnswer: null,
        answerTime: null,
      };
    }
  }

  await updateGame(gameId, {
    status: nextStatus,
    currentRound: nextStatus === 'question' ? game.currentRound + 1 : game.currentRound,
    roundStartTime: nextStatus === 'question' ? Date.now() : null,
    players: updatedPlayers,
  });
}

export async function continueFromSpecial(gameId: string, hostId: string): Promise<void> {
  const game = await getGame(gameId);
  if (!game || game.hostId !== hostId || game.status !== 'power_up') return;

  // Reset player answers when leaving power-up phase
  const resetPlayers = { ...game.players };
  for (const playerId of Object.keys(resetPlayers)) {
    resetPlayers[playerId] = {
      ...resetPlayers[playerId],
      currentAnswer: null,
      answerTime: null,
    };
  }

  const showLeaderboard = (game.currentRound + 1) % game.settings.showLeaderboardEvery === 0;

  if (showLeaderboard) {
    await updateGame(gameId, { status: 'leaderboard', players: resetPlayers });
  } else {
    await startNextQuestion(gameId);
  }
}

export async function continueFromLeaderboard(gameId: string, hostId: string): Promise<void> {
  const game = await getGame(gameId);
  if (!game || game.hostId !== hostId || game.status !== 'leaderboard') return;

  await startNextQuestion(gameId);
}

async function startNextQuestion(gameId: string): Promise<void> {
  const game = await getGame(gameId);
  if (!game) return;

  // Reset player answers
  const resetPlayers = { ...game.players };
  for (const playerId of Object.keys(resetPlayers)) {
    resetPlayers[playerId] = {
      ...resetPlayers[playerId],
      currentAnswer: null,
      answerTime: null,
    };
  }

  await updateGame(gameId, {
    status: 'question',
    currentRound: game.currentRound + 1,
    roundStartTime: Date.now(),
    players: resetPlayers,
  });
}
