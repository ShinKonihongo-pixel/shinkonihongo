import type { GameSetupConfig } from './types';

export const KANJI_DROP_SETUP_CONFIG: GameSetupConfig = {
  showTitle: true,
  titlePlaceholder: 'Kanji Drop',
  showJLPTLevel: true,
  showLessonPicker: true,
  showMaxPlayers: true,
  maxPlayersSlider: {
    min: 2,
    max: 10,
    step: 1,
    defaultValue: 4,
    labels: ['2', '5', '10'],
  },
  showTotalRounds: true,
  roundsSlider: {
    min: 5,
    max: 100,
    step: 5,
    defaultValue: 10,
    labels: ['5', '50', '100'],
  },
  roundsLabel: 'Số màn tối đa',
  roundsSuffix: ' màn',
  rules: [
    '🀄 Xếp kanji vào hàng, gom 3+ giống nhau để tiêu diệt',
    '🏁 Ai hoàn thành tất cả màn chơi trước → thắng!',
    '⚡ Power-ups: Xáo trộn, Hoàn tác, Thu hồi',
    '📊 Theo dõi tiến độ đối thủ real-time',
  ],
};
