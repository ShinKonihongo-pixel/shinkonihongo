// Exercise types for vocabulary practice
// Updated: Support multiple types, multiple levels, per-type question counts

import type { JLPTLevel } from './flashcard';

// Updated exercise types
export type ExerciseType =
  | 'vocabulary'      // Từ vựng → Nghĩa
  | 'meaning'         // Nghĩa → Từ vựng
  | 'kanji_to_vocab'  // Kanji → Từ vựng
  | 'vocab_to_kanji'  // Từ vựng → Kanji
  | 'listening_write'; // Nghe → Viết từ (dictation)

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  types: ExerciseType[]; // Multiple types allowed
  jlptLevels: JLPTLevel[]; // Multiple levels allowed
  lessonIds: string[]; // Selected lessons for this exercise
  questionCountByType: Record<ExerciseType, number>; // Questions per type
  timePerQuestion?: number; // Seconds per question (0 = no limit)
  createdBy: string;
  createdAt: string;
  isPublished: boolean; // Show in exercise tab for users
  // Legacy support
  type?: ExerciseType;
  jlptLevel?: JLPTLevel;
  questionCount?: number;
}

export interface ExerciseFormData {
  name: string;
  description?: string;
  types: ExerciseType[];
  jlptLevels: JLPTLevel[];
  lessonIds: string[];
  questionCountByType: Record<ExerciseType, number>;
  timePerQuestion?: number;
}

export interface ExerciseQuestion {
  id: string;
  type: ExerciseType; // Which type this question is
  vocabularyId: string;
  vocabulary: string;
  kanji: string;
  meaning: string;
  options?: string[]; // For multiple choice (not used in listening_write)
  correctIndex?: number; // For multiple choice
  correctAnswer?: string; // For listening_write (text input)
}

export interface ExerciseSession {
  exerciseId: string;
  questions: ExerciseQuestion[];
  currentIndex: number;
  answers: (number | string | null)[]; // number for MC, string for text input
  startedAt: string;
  completedAt?: string;
}

export interface ExerciseResult {
  exerciseId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  answers: { questionId: string; correct: boolean }[];
  completedAt: string;
}

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  vocabulary: 'Từ vựng → Nghĩa',
  meaning: 'Nghĩa → Từ vựng',
  kanji_to_vocab: 'Kanji → Từ vựng',
  vocab_to_kanji: 'Từ vựng → Kanji',
  listening_write: 'Nghe → Viết từ',
};

export const EXERCISE_TYPE_ICONS: Record<ExerciseType, string> = {
  vocabulary: '📖',
  meaning: '🎯',
  kanji_to_vocab: '漢→あ',
  vocab_to_kanji: 'あ→漢',
  listening_write: '🎧',
};

export const DEFAULT_QUESTION_COUNT = 5;

export const QUESTION_COUNT_OPTIONS = [3, 5, 10, 15, 20];

export const TIME_PER_QUESTION_OPTIONS = [
  { value: 0, label: 'Không giới hạn' },
  { value: 10, label: '10 giây' },
  { value: 15, label: '15 giây' },
  { value: 20, label: '20 giây' },
  { value: 30, label: '30 giây' },
];

// Get total question count from questionCountByType
export const getTotalQuestionCount = (questionCountByType: Record<ExerciseType, number>, types: ExerciseType[]): number => {
  return types.reduce((sum, type) => sum + (questionCountByType[type] || 0), 0);
};

// Initialize question count by type with defaults
export const initQuestionCountByType = (): Record<ExerciseType, number> => ({
  vocabulary: DEFAULT_QUESTION_COUNT,
  meaning: DEFAULT_QUESTION_COUNT,
  kanji_to_vocab: DEFAULT_QUESTION_COUNT,
  vocab_to_kanji: DEFAULT_QUESTION_COUNT,
  listening_write: DEFAULT_QUESTION_COUNT,
});
