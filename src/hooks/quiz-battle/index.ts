// Main Quiz Battle multiplayer hook — orchestrates all modules

import { useEffect, useRef } from 'react';
import type { GameUser } from '../shared/game-types';
import type { JLPTQuestion } from '../../types/jlpt-question';
import type { CreateQuizBattleRoomData, QuizBattlePlayer } from '../../components/pages/quiz-battle/quiz-battle-types';
import { useGameState } from './use-game-state';
import { useGameCreation } from './use-game-creation';
import { useGameActions } from './use-game-actions';
import { useMatchFlow } from './use-match-flow';
import { useRatingSync } from './use-rating-sync';
import { generateBots } from '../../types/game-hub';
import { generateId } from '../../lib/game-utils';
import { updateGameRoom } from '../../services/game-rooms';

interface UseQuizBattleProps {
  currentUser: GameUser;
  jlptQuestions: JLPTQuestion[];
}

export function useQuizBattle({ currentUser, jlptQuestions }: UseQuizBattleProps) {
  const {
    game, setGame,
    gameResults, setGameResults,
    loading, setLoading,
    error, setError,
    roomId, setRoomId,
    isHost, currentPlayer,
    sortedPlayers,
    deleteCurrentRoom,
    clearLocalGameState,
  } = useGameState({ currentUserId: currentUser.id });

  const { createGame: createGameInner } = useGameCreation({
    currentUser, setGame, setGameResults, setLoading, setError, setRoomId,
  });

  // Bind jlptQuestions into createGame
  const createGame = (data: CreateQuizBattleRoomData) =>
    createGameInner(data, jlptQuestions);

  const {
    joinGame, leaveGame, kickPlayer, startGame, resetGame, submitAnswer,
  } = useGameActions({
    game, currentUser, setGame, setGameResults,
    setLoading, setError, setRoomId, roomId,
    isHost, deleteCurrentRoom, clearLocalGameState,
  });

  // Host drives the match flow
  useMatchFlow({
    game, isHost, currentUserId: currentUser.id, setGame, setGameResults,
  });

  const { myRating, getRatingForLevel } = useRatingSync({ currentUser });

  // Auto-add AI opponent after random 15-60s — write directly to Firestore
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  const botScheduledRef = useRef<string | null>(null);
  const gameRef = useRef(game); // always-current game reference
  gameRef.current = game;

  useEffect(() => {
    if (!game || !isHost || game.status !== 'waiting' || !game.id) return;
    const playerCount = Object.keys(game.players).length;

    // Already has opponent → clear timer
    if (playerCount >= 2) {
      if (botTimerRef.current) { clearTimeout(botTimerRef.current); botTimerRef.current = null; }
      botScheduledRef.current = null;
      return;
    }

    // Already scheduled for this game
    if (botScheduledRef.current === game.id) return;
    botScheduledRef.current = game.id;

    const gameId = game.id;
    const delay = 15000 + Math.floor(Math.random() * 45000); // 15-60s
    botTimerRef.current = setTimeout(() => {
      // Read latest game state from ref
      const currentGame = gameRef.current;
      if (!currentGame || currentGame.id !== gameId || currentGame.status !== 'waiting') return;
      if (Object.keys(currentGame.players).length >= 2) return;

      const [bot] = generateBots(1);
      const botId = `bot-${generateId()}`;
      const botPlayer: QuizBattlePlayer = {
        odinhId: botId,
        displayName: bot.name,
        avatar: bot.avatar,
        role: 'bot',
        isBot: true,
        score: 0,
        correctCount: 0,
        currentAnswer: null,
        answerTime: null,
        isReady: true,
        rating: 800 + Math.floor(Math.random() * 400),
      };

      // Write to Firestore with latest players — subscription picks it up
      const updatedPlayers = { ...currentGame.players, [botId]: botPlayer };
      updateGameRoom(gameId, { players: updatedPlayers }).catch(console.error);
    }, delay);

    return () => {
      if (botTimerRef.current) { clearTimeout(botTimerRef.current); botTimerRef.current = null; }
    };
  }, [game?.id, game?.status, isHost]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, []);

  return {
    game,
    gameResults,
    loading,
    error,
    roomId,
    isHost,
    currentPlayer,
    sortedPlayers,
    createGame,
    joinGame,
    leaveGame,
    kickPlayer,
    startGame,
    resetGame,
    submitAnswer,
    myRating,
    getRatingForLevel,
    setError,
  };
}

export type { CreateQuizBattleRoomData };
