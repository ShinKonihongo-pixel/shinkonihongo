// Picture Guess Setup - Using unified GameRoomSetup component

import { useMemo } from 'react';
import { HelpCircle, Zap, AlertTriangle } from 'lucide-react';
import { GameRoomSetup } from '../game-hub/game-room-setup';
import type { GameRoomConfig, GameSetupConfig } from '../game-hub/game-room-setup';
import type { CreatePictureGuessData, PictureGuessMode } from '../../types/picture-guess';
import type { JLPTLevel } from '../../types/flashcard';

interface PictureGuessSetupProps {
  mode: PictureGuessMode;
  onBack: () => void;
  onCreate: (data: CreatePictureGuessData) => void;
  loading: boolean;
  error?: string | null;
}

export function PictureGuessSetup({
  mode,
  onBack,
  onCreate,
  loading,
  error,
}: PictureGuessSetupProps) {
  // Dynamic config based on mode
  const config = useMemo<GameSetupConfig>(() => ({
    showTitle: true,
    titlePlaceholder: mode === 'single' ? 'Luyện tập' : 'Phòng đuổi hình',
    showJLPTLevel: true,
    showTotalRounds: true,
    roundsLabel: 'Số câu đố',
    roundsSlider: {
      min: 5,
      max: 30,
      step: 5,
      defaultValue: 10,
      labels: ['5', '15', '30'],
    },
    showTimePerQuestion: true,
    timeSlider: {
      min: 10,
      max: 60,
      step: 10,
      defaultValue: 30,
      labels: ['10s', '30s', '60s'],
    },
    showMaxPlayers: mode === 'multiplayer',
    maxPlayersSlider: mode === 'multiplayer' ? {
      min: 2,
      max: 20,
      step: 1,
      defaultValue: 10,
      labels: ['2', '10', '20'],
    } : undefined,
    toggles: [
      {
        id: 'hints',
        label: 'Cho phép gợi ý',
        description: 'Người chơi có thể xin gợi ý',
        icon: <HelpCircle size={18} />,
        defaultEnabled: true,
      },
      {
        id: 'speedBonus',
        label: 'Điểm tốc độ',
        description: 'Trả lời nhanh được thêm điểm',
        icon: <Zap size={18} />,
        defaultEnabled: true,
      },
      {
        id: 'penaltyWrongAnswer',
        label: 'Trừ điểm sai',
        description: 'Mất điểm khi trả lời sai',
        icon: <AlertTriangle size={18} />,
        defaultEnabled: false,
      },
    ],
    rules: [
      '🖼️ Xem emoji đoán từ tiếng Nhật',
      '💡 Có thể dùng gợi ý (mất điểm)',
      '⚡ Trả lời nhanh = Điểm cao hơn',
    ],
  }), [mode]);

  const handleCreateRoom = (roomConfig: GameRoomConfig) => {
    onCreate({
      title: roomConfig.title,
      mode,
      jlptLevel: (roomConfig.jlptLevel || 'N5') as JLPTLevel,
      contentSource: 'flashcard',
      puzzleCount: roomConfig.totalRounds || 10,
      timePerPuzzle: roomConfig.timePerQuestion || 30,
      maxPlayers: mode === 'single' ? 1 : (roomConfig.maxPlayers || 10),
      allowHints: (roomConfig as { hints?: boolean }).hints ?? true,
      speedBonus: (roomConfig as { speedBonus?: boolean }).speedBonus ?? true,
      penaltyWrongAnswer: (roomConfig as { penaltyWrongAnswer?: boolean }).penaltyWrongAnswer ?? false,
    });
  };

  return (
    <GameRoomSetup
      gameType="picture-guess"
      config={config}
      onCreateRoom={handleCreateRoom}
      onBack={onBack}
      loading={loading}
      error={error}
    />
  );
}
