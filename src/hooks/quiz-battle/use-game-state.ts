// Quiz Battle game state — thin wrapper around shared useGameRoomState

import type {
  QuizBattleGame,
  QuizBattleResults,
  QuizBattlePlayer,
} from '../../components/pages/quiz-battle/quiz-battle-types';
import { useGameRoomState } from '../shared/use-game-room-state';

export function useGameState({ currentUserId }: { currentUserId: string }) {
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
  } = useGameRoomState<QuizBattleGame, QuizBattleResults>(
    currentUserId,
    {
      gameLabel: 'quiz-battle',
      sortPlayers: (players) =>
        [...players].sort((a, b) => {
          const pa = a as unknown as QuizBattlePlayer;
          const pb = b as unknown as QuizBattlePlayer;
          return (pb.score ?? 0) - (pa.score ?? 0);
        }),
    },
  );

  return {
    game, setGame,
    gameResults, setGameResults,
    loading, setLoading,
    error, setError,
    roomId, setRoomId,
    isHost, currentPlayer,
    sortedPlayers,
    deleteCurrentRoom,
    clearLocalGameState,
  };
}
