// Game results management for Quiz Game

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { GameResults, PlayerResult } from '../../types/quiz-game';
import { COLLECTIONS } from './constants';
import { getGame, updateGame } from './game-crud';

export async function endGame(gameId: string): Promise<void> {
  const game = await getGame(gameId);
  if (!game) return;

  // Calculate rankings
  const playerList = Object.values(game.players);
  const sortedPlayers = [...playerList].sort((a, b) => b.score - a.score);

  const rankings: PlayerResult[] = sortedPlayers.map((player, index) => ({
    playerId: player.id,
    playerName: player.name,
    rank: index + 1,
    score: player.score,
    correctAnswers: 0, // Would need to track this separately
    totalAnswers: game.totalRounds,
    accuracy: 0,
    longestStreak: player.streak,
    powerUpsUsed: 0,
  }));

  const results: GameResults = {
    gameId: game.id,
    gameTitle: game.title,
    totalRounds: game.totalRounds,
    totalPlayers: playerList.length,
    rankings,
    endedAt: new Date().toISOString(),
  };

  // Save results
  await addDoc(collection(db, COLLECTIONS.GAME_RESULTS), results);

  // Update game status
  await updateGame(gameId, { status: 'finished' });
}

export async function getGameResults(gameId: string): Promise<GameResults | null> {
  const q = query(
    collection(db, COLLECTIONS.GAME_RESULTS),
    where('gameId', '==', gameId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as GameResults;
}
