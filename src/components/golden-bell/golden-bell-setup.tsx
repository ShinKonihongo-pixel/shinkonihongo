// Golden Bell Setup - Using unified GameRoomSetup component

import { GameRoomSetup, GOLDEN_BELL_SETUP_CONFIG } from '../game-hub/game-room-setup';
import type { GameRoomConfig } from '../game-hub/game-room-setup';
import type { CreateGoldenBellData, QuestionCategory } from '../../types/golden-bell';
import type { JLPTLevel } from '../../types/flashcard';

interface GoldenBellSetupProps {
  onCreateGame: (data: CreateGoldenBellData) => void;
  onBack: () => void;
  loading: boolean;
  error?: string | null;
}

export function GoldenBellSetup({
  onCreateGame,
  onBack,
  loading,
  error,
}: GoldenBellSetupProps) {
  const handleCreateRoom = (config: GameRoomConfig) => {
    onCreateGame({
      title: config.title,
      jlptLevel: (config.jlptLevel || 'N5') as JLPTLevel,
      contentSource: 'flashcard',
      questionCount: config.totalRounds || 20,
      timePerQuestion: config.timePerQuestion || 15,
      maxPlayers: config.maxPlayers,
      categories: (config.categories || ['vocabulary', 'kanji']) as QuestionCategory[],
      difficultyProgression: config.difficultyProgression ?? true,
    });
  };

  return (
    <GameRoomSetup
      gameType="golden-bell"
      config={GOLDEN_BELL_SETUP_CONFIG}
      onCreateRoom={handleCreateRoom}
      onBack={onBack}
      loading={loading}
      error={error}
    />
  );
}
