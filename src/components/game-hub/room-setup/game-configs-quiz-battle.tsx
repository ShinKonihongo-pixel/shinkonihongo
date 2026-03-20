import type { GameSetupConfig } from './types';

export const QUIZ_BATTLE_SETUP_CONFIG: GameSetupConfig = {
  showTitle: true,
  titlePlaceholder: 'Đấu Trí',
  showJLPTLevel: false,  // Auto from user settings, not selectable
  showLessonPicker: false,
  showMaxPlayers: false,  // Fixed at 2
  showTotalRounds: false, // Fixed at 20
  rules: [
    '⚔️ Đối đầu 1v1 — 20 câu hỏi ngẫu nhiên',
    '⏱️ Trả lời nhanh hơn = nhiều điểm hơn',
    '🏆 Thắng: cộng điểm xếp hạng, Thua: trừ điểm',
    '📊 Bảng xếp hạng riêng cho từng cấp độ JLPT',
  ],
};
