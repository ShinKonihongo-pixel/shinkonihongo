import type { GameSetupConfig } from './types';

export const IMAGE_WORD_SETUP_CONFIG: GameSetupConfig = {
  showTitle: true,
  titlePlaceholder: 'Nối Hình - Từ',
  showMaxPlayers: true,
  maxPlayersSlider: {
    min: 2,
    max: 10,
    step: 1,
    defaultValue: 4,
    labels: ['2', '5', '10'],
  },
  showTotalRounds: true,
  roundsLabel: 'Số vòng',
  roundsSlider: {
    min: 5,
    max: 20,
    step: 5,
    defaultValue: 10,
    labels: ['5', '10', '20'],
  },
  rules: [
    '🖼️ Nối hình ảnh với từ vựng tương ứng',
    '⏱️ Hoàn thành nhanh = Điểm cao hơn',
    '🎯 Nối sai bị trừ điểm',
  ],
};

export const WORD_SCRAMBLE_SETUP_CONFIG: GameSetupConfig = {
  showTitle: true,
  titlePlaceholder: 'Sắp Xếp Từ',
  showJLPTLevel: true,
  showMaxPlayers: true,
  maxPlayersSlider: {
    min: 2,
    max: 10,
    step: 1,
    defaultValue: 4,
    labels: ['2', '5', '10'],
  },
  showTimePerQuestion: true,
  timeSlider: {
    min: 15,
    max: 60,
    step: 5,
    defaultValue: 30,
    labels: ['15s', '30s', '60s'],
  },
  showTotalRounds: true,
  roundsLabel: 'Số câu hỏi',
  roundsSlider: {
    min: 5,
    max: 20,
    step: 5,
    defaultValue: 10,
    labels: ['5', '10', '20'],
  },
  rules: [
    '🔀 Sắp xếp chữ cái bị xáo trộn thành từ đúng',
    '💡 Có gợi ý thông minh',
    '⏱️ Điểm tính theo thời gian',
  ],
};
