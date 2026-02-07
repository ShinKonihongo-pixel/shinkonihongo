import { Sparkles, Zap } from 'lucide-react';
import type { GameSetupConfig } from './types';

export const BINGO_SETUP_CONFIG: GameSetupConfig = {
  showTitle: true,
  titlePlaceholder: 'Bingo Vui Vẻ',
  showMaxPlayers: true,
  maxPlayersOptions: [4, 6, 8, 10, 15, 20],
  toggles: [
    {
      id: 'skills',
      label: 'Kỹ năng đặc biệt',
      description: 'Mở khóa kỹ năng sau mỗi 5 lượt',
      icon: <Sparkles size={18} />,
      defaultEnabled: true,
    },
  ],
  rules: [
    '🎯 Mỗi người chơi có 6 dãy, mỗi dãy 5 số (1-99)',
    '🎰 Bốc số ngẫu nhiên, đánh dấu số trùng',
    '🏆 Ai có đủ 5 số trong một dãy nhấn BINGO trước thắng!',
  ],
};

export const KANJI_BATTLE_SETUP_CONFIG: GameSetupConfig = {
  showTitle: true,
  titlePlaceholder: 'Đại Chiến Kanji',
  showMaxPlayers: true,
  maxPlayersSlider: {
    min: 2,
    max: 20,
    step: 1,
    defaultValue: 10,
    labels: ['2', '10', '20'],
  },
  showTotalRounds: true,
  roundsSlider: {
    min: 5,
    max: 30,
    step: 5,
    defaultValue: 15,
    labels: ['5', '15', '30'],
  },
  showTimePerQuestion: true,
  timeSlider: {
    min: 5,
    max: 30,
    step: 5,
    defaultValue: 15,
    labels: ['5s', '15s', '30s'],
  },
  toggles: [
    {
      id: 'skills',
      label: 'Kỹ năng đặc biệt',
      description: 'Mở khóa kỹ năng mỗi 5 câu',
      icon: <Zap size={18} />,
      defaultEnabled: true,
    },
  ],
  rules: [
    '⚔️ Đọc hoặc viết kanji nhanh nhất để ghi điểm',
    '💡 Có 3 lượt gợi ý miễn phí',
    '🏆 Người có điểm cao nhất thắng',
  ],
};
