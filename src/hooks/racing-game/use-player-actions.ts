// Player actions hook - wrapper that combines join, leave, and submit actions
import type {
  RacingGame,
  RacingPlayer,
  RacingQuestion,
  RacingVehicle,
} from '../../types/racing-game';
import { useJoinGame } from './use-join-game';
import { useLeaveGame } from './use-leave-game';
import { useSubmitAnswer } from './use-submit-answer';

interface UsePlayerActionsProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  selectedVehicle: RacingVehicle;
  game: RacingGame | null;
  setGame: React.Dispatch<React.SetStateAction<RacingGame | null>>;
  setGameResults: React.Dispatch<React.SetStateAction<unknown>>;
  availableRooms: RacingGame[];
  setAvailableRooms: React.Dispatch<React.SetStateAction<RacingGame[]>>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  isHost: boolean;
  currentPlayer?: RacingPlayer;
  currentQuestion: RacingQuestion | null;
  botTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  botTimer2Ref: React.MutableRefObject<NodeJS.Timeout | null>;
}

export function usePlayerActions(props: UsePlayerActionsProps) {
  const { joinGame } = useJoinGame({
    currentUser: props.currentUser,
    selectedVehicle: props.selectedVehicle,
    availableRooms: props.availableRooms,
    setGame: props.setGame,
    setAvailableRooms: props.setAvailableRooms,
    setLoading: props.setLoading,
    setError: props.setError,
  });

  const { leaveGame } = useLeaveGame({
    game: props.game,
    setGame: props.setGame,
    setGameResults: props.setGameResults,
    setAvailableRooms: props.setAvailableRooms,
    currentUserId: props.currentUser.id,
    isHost: props.isHost,
    botTimerRef: props.botTimerRef,
    botTimer2Ref: props.botTimer2Ref,
  });

  const { submitAnswer } = useSubmitAnswer({
    game: props.game,
    setGame: props.setGame,
    currentUserId: props.currentUser.id,
    currentPlayer: props.currentPlayer,
    currentQuestion: props.currentQuestion,
  });

  return { joinGame, leaveGame, submitAnswer };
}
