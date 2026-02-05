// Bingo Game Hook Types

export interface UseBingoGameProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
}

export interface BingoGameState {
  game: import('../../types/bingo-game').BingoGame | null;
  gameResults: import('../../types/bingo-game').BingoResults | null;
  availableRooms: import('../../types/bingo-game').BingoGame[];
  loading: boolean;
  error: string | null;
}

export interface BingoGameRefs {
  botTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  botTimer2Ref: React.MutableRefObject<NodeJS.Timeout | null>;
  botDrawTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
}
