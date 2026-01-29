// Speed Quiz Setup - Using unified GameRoomSetup component

import { GameRoomSetup, SPEED_QUIZ_SETUP_CONFIG } from '../game-hub/game-room-setup';
import type { GameRoomConfig } from '../game-hub/game-room-setup';
import type { CreateSpeedQuizData } from '../../types/speed-quiz';

interface SpeedQuizSetupProps {
  onCreateGame: (data: CreateSpeedQuizData) => void;
  onBack: () => void;
  loading?: boolean;
  error?: string | null;
}

export function SpeedQuizSetup({
  onCreateGame,
  onBack,
  loading = false,
  error,
}: SpeedQuizSetupProps) {
  const handleCreateRoom = (config: GameRoomConfig) => {
    onCreateGame({
      title: config.title,
      totalRounds: config.totalRounds || 15,
      timePerQuestion: config.timePerQuestion || 10,
      maxPlayers: config.maxPlayers,
      skillsEnabled: config.skillsEnabled ?? true,
    });
  };

  return (
    <GameRoomSetup
      gameType="speed-quiz"
      config={SPEED_QUIZ_SETUP_CONFIG}
      onCreateRoom={handleCreateRoom}
      onBack={onBack}
      loading={loading}
      error={error}
    />
  );
}
