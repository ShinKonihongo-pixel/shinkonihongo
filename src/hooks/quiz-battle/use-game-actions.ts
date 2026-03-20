// Quiz Battle game actions — join, leave, start + submitAnswer

import { useCallback } from 'react';
import type {
  QuizBattleGame,
  QuizBattlePlayer,
  QuizBattleResults,
} from '../../components/pages/quiz-battle/quiz-battle-types';
import type { GameUser, SetGame } from '../shared/game-types';
import { useGameRoomActions } from '../shared/use-game-room-actions';
import { updateGameRoom } from '../../services/game-rooms';
import { getOrCreateRating } from '../../services/quiz-battle/quiz-battle-service';

interface UseGameActionsProps {
  game: QuizBattleGame | null;
  currentUser: GameUser;
  setGame: SetGame<QuizBattleGame>;
  setGameResults: (results: QuizBattleResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRoomId: (id: string | null) => void;
  roomId?: string | null;
  isHost: boolean;
  deleteCurrentRoom: () => void;
  clearLocalGameState?: () => void;
}

export function useGameActions({
  game, currentUser, setGame, setGameResults,
  setLoading, setError, setRoomId, roomId,
  isHost, deleteCurrentRoom, clearLocalGameState,
}: UseGameActionsProps) {
  const { joinGame, leaveGame, kickPlayer, startGame, resetGame } = useGameRoomActions<
    QuizBattleGame,
    QuizBattlePlayer,
    QuizBattleResults
  >(
    {
      game, currentUser, setGame, setGameResults,
      setLoading, setError, setRoomId, roomId,
      isHost, deleteCurrentRoom, clearLocalGameState,
    },
    {
      gameType: 'quiz-battle',
      gameName: 'Đấu Trí',
      leaveStrategy: 'remove-self',
      createJoinPlayer: async (user: GameUser, roomData: QuizBattleGame) => {
        const ratingData = await getOrCreateRating(user.id, user.displayName, user.avatar);
        const rating = ratingData.ratings[roomData.jlptLevel] ?? 1000;
        return {
          odinhId: user.id,
          displayName: user.displayName,
          avatar: user.avatar,
          role: user.role,
          score: 0,
          correctCount: 0,
          currentAnswer: null,
          answerTime: null,
          isReady: false,
          rating,
        } as QuizBattlePlayer;
      },
    },
  );

  // Submit answer for current player
  const submitAnswer = useCallback(async (answerIndex: number, answerTimeMs: number) => {
    if (!game || game.status !== 'playing') return;
    const player = game.players[currentUser.id];
    if (!player || player.currentAnswer !== null) return; // already answered

    const updatedPlayer: QuizBattlePlayer = {
      ...player,
      currentAnswer: answerIndex,
      answerTime: answerTimeMs,
    };

    setGame(prev => {
      if (!prev) return null;
      return {
        ...prev,
        players: { ...prev.players, [currentUser.id]: updatedPlayer },
      };
    });

    // Also write to Firestore so opponent sees the answer
    if (game.id) {
      await updateGameRoom(game.id, {
        [`players.${currentUser.id}.currentAnswer`]: answerIndex,
        [`players.${currentUser.id}.answerTime`]: answerTimeMs,
      } as Record<string, unknown>);
    }
  }, [game, currentUser.id, setGame]);

  return { joinGame, leaveGame, kickPlayer, startGame, resetGame, submitAnswer };
}
