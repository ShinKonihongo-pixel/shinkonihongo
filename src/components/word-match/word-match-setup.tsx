// Word Match Setup - Using unified GameRoomSetup component

import { GameRoomSetup, WORD_MATCH_SETUP_CONFIG } from '../game-hub/game-room-setup';
import type { GameRoomConfig } from '../game-hub/game-room-setup';
import type { CreateWordMatchData } from '../../types/word-match';

interface WordMatchSetupProps {
  onCreateGame: (data: CreateWordMatchData) => void;
  onBack: () => void;
  loading?: boolean;
  error?: string | null;
}

export function WordMatchSetup({
  onCreateGame,
  onBack,
  loading = false,
  error,
}: WordMatchSetupProps) {
  const handleCreateRoom = (config: GameRoomConfig) => {
    onCreateGame({
      title: config.title,
      totalRounds: config.totalRounds || 10,
      timePerRound: config.timePerQuestion || 60,
      maxPlayers: config.maxPlayers,
    });
  };

  return (
    <GameRoomSetup
      gameType="word-match"
      config={WORD_MATCH_SETUP_CONFIG}
      onCreateRoom={handleCreateRoom}
      onBack={onBack}
      loading={loading}
      error={error}
    />
  );
}
