// Exercise types for vocabulary practice

import type { JLPTLevel } from './flashcard';

export type ExerciseType = 'vocabulary' | 'kanji' | 'meaning' | 'listening';

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  type: ExerciseType;
  jlptLevel: JLPTLevel;
  lessonIds: string[]; // Selected lessons for this exercise
  questionCount: number; // 10-20 questions
  createdBy: string;
  createdAt: string;
  isPublished: boolean; // Show in exercise tab for users
}

export interface ExerciseFormData {
  name: string;
  description?: string;
  type: ExerciseType;
  jlptLevel: JLPTLevel;
  lessonIds: string[];
  questionCount: number;
}

export interface ExerciseQuestion {
  id: string;
  vocabularyId: string;
  vocabulary: string;
  kanji: string;
  meaning: string;
  options: string[]; // 4 answer options
  correctIndex: number;
}

export interface ExerciseSession {
  exerciseId: string;
  questions: ExerciseQuestion[];
  currentIndex: number;
  answers: (number | null)[]; // User's selected answers
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
  kanji: 'Kanji → Đọc',
  meaning: 'Nghĩa → Từ vựng',
  listening: 'Nghe → Chọn từ',
};

export const QUESTION_COUNT_OPTIONS = [10, 15, 20];
