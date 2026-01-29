// Bingo Game Setup - Using unified GameRoomSetup component

import { GameRoomSetup, BINGO_SETUP_CONFIG } from '../game-hub/game-room-setup';
import type { GameRoomConfig } from '../game-hub/game-room-setup';
import type { CreateBingoGameData } from '../../types/bingo-game';

interface BingoGameSetupProps {
  loading: boolean;
  error: string | null;
  onCreateGame: (data: CreateBingoGameData) => void;
  onCancel: () => void;
}

export function BingoGameSetup({
  loading,
  error,
  onCreateGame,
  onCancel,
}: BingoGameSetupProps) {
  const handleCreateRoom = (config: GameRoomConfig) => {
    onCreateGame({
      title: config.title,
      maxPlayers: config.maxPlayers,
      skillsEnabled: config.skillsEnabled ?? true,
    });
  };

  return (
    <GameRoomSetup
      gameType="bingo"
      config={BINGO_SETUP_CONFIG}
      onCreateRoom={handleCreateRoom}
      onBack={onCancel}
      loading={loading}
      error={error}
    />
  );
}
