// Daily mission template pool — pick 4 per day

import {
  BookOpen,
  Layers,
  Gamepad2,
  BookOpenCheck,
  FileText,
  Headphones,
  ClipboardList,
  Award,
} from 'lucide-react';
import type { MissionTemplate } from '../types/achievements';

export const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    type: 'study_words',
    titleTemplate: 'Học {target} từ vựng mới',
    descriptionVi: 'Học từ mới qua flashcard',
    icon: BookOpen,
    xpReward: 20,
    targetRange: { min: 5, max: 15 },
  },
  {
    type: 'review_cards',
    titleTemplate: 'Ôn tập {target} thẻ',
    descriptionVi: 'Ôn lại các thẻ đã học',
    icon: Layers,
    xpReward: 15,
    targetRange: { min: 10, max: 30 },
  },
  {
    type: 'play_game',
    titleTemplate: 'Chơi {target} trò chơi',
    descriptionVi: 'Tham gia trò chơi học tập',
    icon: Gamepad2,
    xpReward: 25,
    targetRange: { min: 1, max: 3 },
  },
  {
    type: 'read_passage',
    titleTemplate: 'Đọc {target} bài đọc hiểu',
    descriptionVi: 'Luyện đọc hiểu tiếng Nhật',
    icon: BookOpenCheck,
    xpReward: 20,
    targetRange: { min: 1, max: 2 },
  },
  {
    type: 'grammar_study',
    titleTemplate: 'Học {target} mẫu ngữ pháp',
    descriptionVi: 'Ôn luyện ngữ pháp',
    icon: FileText,
    xpReward: 20,
    targetRange: { min: 3, max: 8 },
  },
  {
    type: 'listening',
    titleTemplate: 'Nghe {target} bài luyện nghe',
    descriptionVi: 'Luyện nghe hiểu',
    icon: Headphones,
    xpReward: 20,
    targetRange: { min: 1, max: 3 },
  },
  {
    type: 'kanji_study',
    titleTemplate: 'Học {target} chữ Kanji',
    descriptionVi: 'Luyện viết và nhớ Kanji',
    icon: ClipboardList,
    xpReward: 20,
    targetRange: { min: 3, max: 10 },
  },
  {
    type: 'jlpt_practice',
    titleTemplate: 'Làm {target} câu JLPT',
    descriptionVi: 'Ôn luyện đề thi JLPT',
    icon: Award,
    xpReward: 25,
    targetRange: { min: 5, max: 20 },
  },
];

// Number of missions generated per day
export const DAILY_MISSION_COUNT = 4;

// Bonus XP for completing all daily missions
export const ALL_COMPLETE_BONUS_XP = 50;
