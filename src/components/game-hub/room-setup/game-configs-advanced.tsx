import { HelpCircle, Sparkles, Zap, Shield, Users } from 'lucide-react';
import type { GameSetupConfig } from './types';

export const GOLDEN_BELL_SETUP_CONFIG: GameSetupConfig = {
  showTitle: true,
  titlePlaceholder: 'Rung Chuông Vàng',
  // Game mode selector — solo vs team
  showGameMode: true,
  gameModeDefault: 'solo',
  gameModeOptions: [
    {
      value: 'solo',
      label: 'Đấu Đơn',
      description: 'Mỗi người tự chiến đấu',
      icon: <Shield size={22} />,
    },
    {
      value: 'team',
      label: 'Đấu Đội',
      description: 'Chia đội cùng chiến đấu',
      icon: <Users size={22} />,
    },
  ],
  teamCountSlider: {
    min: 2,
    max: 6,
    step: 1,
    defaultValue: 3,
    labels: ['2', '4', '6'],
  },
  maxPlayersPerTeamSlider: {
    min: 3,
    max: 6,
    step: 1,
    defaultValue: 4,
    labels: ['3', '4', '5', '6'],
  },
  // Free user limits: max 3 teams, max 3 per team
  teamCountFreeMax: 3,
  maxPlayersPerTeamFreeMax: 3,
  showJLPTLevel: true,
  showCategories: true,
  multiSelectCategories: true,
  categories: [
    { value: 'vocabulary', label: '📝 Từ vựng' },
    { value: 'kanji', label: '漢 Kanji' },
    { value: 'grammar', label: '📖 Ngữ pháp' },
    { value: 'culture', label: '🎌 Văn hóa' },
  ],
  showTotalRounds: true,
  roundsSlider: {
    min: 10,
    max: 50,
    step: 5,
    defaultValue: 20,
    labels: ['10', '30', '50'],
  },
  showTimePerQuestion: true,
  timeSlider: {
    min: 10,
    max: 30,
    step: 5,
    defaultValue: 15,
    labels: ['10s', '20s', '30s'],
  },
  showMaxPlayers: true,
  maxPlayersSlider: {
    min: 10,
    max: 100,
    step: 10,
    defaultValue: 20,
    labels: ['10', '50', '100'],
  },
  // Skills always enabled — no toggle needed (special skill questions)
  rules: [
    'Trả lời sai = Bị loại',
    'Người cuối cùng sống sót chiến thắng',
    'Hết giờ = Tính như sai',
    'Câu đặc biệt: sai không bị loại, chỉ mất lượt quay kỹ năng',
    'Kỹ năng: Khiên, Tự Cứu, 50/50, Gấp Đôi TG',
  ],
};

export const PICTURE_GUESS_SETUP_CONFIG: GameSetupConfig = {
  showTitle: true,
  titlePlaceholder: 'Đuổi Hình Bắt Chữ',
  showJLPTLevel: true,
  showTotalRounds: true,
  roundsLabel: 'Số câu đố',
  roundsSlider: {
    min: 5,
    max: 30,
    step: 5,
    defaultValue: 15,
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
  showMaxPlayers: true,
  maxPlayersSlider: {
    min: 2,
    max: 20,
    step: 1,
    defaultValue: 10,
    labels: ['2', '10', '20'],
  },
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
  ],
  rules: [
    '🖼️ Xem emoji đoán từ tiếng Nhật',
    '💡 Có thể dùng gợi ý (mất điểm)',
    '⚡ Trả lời nhanh = Điểm cao hơn',
  ],
};

export const WORD_MATCH_SETUP_CONFIG: GameSetupConfig = {
  showTitle: true,
  titlePlaceholder: 'Nối Từ Thách Đấu',
  showJLPTLevel: true,
  showTotalRounds: true,
  roundsLabel: 'Số vòng',
  roundsSlider: {
    min: 5,
    max: 20,
    step: 5,
    defaultValue: 10,
    labels: ['5', '10', '20'],
  },
  showTimePerQuestion: true,
  timeSlider: {
    min: 30,
    max: 90,
    step: 15,
    defaultValue: 60,
    labels: ['30s', '60s', '90s'],
  },
  showMaxPlayers: true,
  maxPlayersSlider: {
    min: 2,
    max: 10,
    step: 1,
    defaultValue: 4,
    labels: ['2', '5', '10'],
  },
  toggles: [
    {
      id: 'luckyWheel',
      label: 'Vòng quay may mắn',
      description: 'Quay số ngẫu nhiên mỗi vòng',
      icon: <Sparkles size={18} />,
      defaultEnabled: true,
    },
  ],
  rules: [
    '🔗 Nối 5 cặp từ mỗi vòng',
    '⏱️ Nối nhanh = Điểm cao',
    '🎯 Nối sai bị trừ điểm',
  ],
};
