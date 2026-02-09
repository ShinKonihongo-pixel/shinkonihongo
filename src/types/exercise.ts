// Exercise types for vocabulary practice
// Updated: Support multiple types, multiple levels, per-type question counts

import type { JLPTLevel } from './flashcard';

// Updated exercise types
export type ExerciseType =
  | 'vocabulary'           // Từ vựng → Nghĩa
  | 'meaning'              // Nghĩa → Từ vựng
  | 'kanji_to_vocab'       // Kanji → Từ vựng
  | 'vocab_to_kanji'       // Từ vựng → Kanji
  | 'listening_write'      // Nghe → Viết từ (dictation)
  | 'sentence_translation'; // Dịch câu (Việt → Nhật)

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
  // Sentence translation fields
  vietnameseSentence?: string;
  japaneseSentence?: string;
  alternativeAnswers?: string[];
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
  sentence_translation: 'Dịch câu (Việt → Nhật)',
};

export const EXERCISE_TYPE_ICONS: Record<ExerciseType, string> = {
  vocabulary: '📖',
  meaning: '🎯',
  kanji_to_vocab: '漢→あ',
  vocab_to_kanji: 'あ→漢',
  listening_write: '🎧',
  sentence_translation: '🔄',
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
  sentence_translation: DEFAULT_QUESTION_COUNT,
});

// Sentence translation types
export interface SentenceTranslationQuestion {
  id: string;
  vietnameseSentence: string; // Câu tiếng Việt để dịch
  japaneseSentence: string; // Câu đúng tiếng Nhật
  alternativeAnswers?: string[]; // Các câu trả lời thay thế được chấp nhận
  hints?: string[]; // Gợi ý từ vựng
  grammarPattern?: string; // Mẫu ngữ pháp liên quan
  jlptLevel: JLPTLevel;
  createdBy: string;
  createdAt: string;
}

export interface SentenceTranslationFormData {
  vietnameseSentence: string;
  japaneseSentence: string;
  alternativeAnswers?: string[];
  hints?: string[];
  grammarPattern?: string;
  jlptLevel: JLPTLevel;
}

// Helper: Normalize Japanese text for comparison (remove spaces, convert to lowercase/hiragana etc.)
export const normalizeJapaneseText = (text: string): string => {
  return text
    .trim()
    .replace(/\s+/g, '') // Remove all spaces
    .replace(/\u3000/g, '') // Remove full-width spaces
    .replace(/[。、！？]/g, '') // Remove punctuation
    .toLowerCase();
};

// Helper: Check if user answer is close to correct answer (for sentence translation)
// Returns: { isCorrect: boolean, isClose: boolean, similarity: number }
export const checkSentenceAnswer = (
  userAnswer: string,
  correctAnswer: string,
  alternativeAnswers?: string[]
): { isCorrect: boolean; isClose: boolean; similarity: number } => {
  const normalizedUser = normalizeJapaneseText(userAnswer);
  const normalizedCorrect = normalizeJapaneseText(correctAnswer);

  // Exact match
  if (normalizedUser === normalizedCorrect) {
    return { isCorrect: true, isClose: false, similarity: 100 };
  }

  // Check alternative answers
  if (alternativeAnswers) {
    for (const alt of alternativeAnswers) {
      if (normalizedUser === normalizeJapaneseText(alt)) {
        return { isCorrect: true, isClose: false, similarity: 100 };
      }
    }
  }

  // Calculate similarity using Levenshtein-like approach (character match percentage)
  const similarity = calculateSimilarity(normalizedUser, normalizedCorrect);

  // If similarity >= 80%, consider it "close" (gần đúng)
  if (similarity >= 80) {
    return { isCorrect: false, isClose: true, similarity };
  }

  return { isCorrect: false, isClose: false, similarity };
};

// Simple character-based similarity calculation
const calculateSimilarity = (str1: string, str2: string): number => {
  if (str1 === str2) return 100;
  if (str1.length === 0 || str2.length === 0) return 0;

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  let matches = 0;
  const longerChars = [...longer];
  const shorterChars = [...shorter];

  // Count matching characters
  for (const char of shorterChars) {
    const idx = longerChars.indexOf(char);
    if (idx !== -1) {
      matches++;
      longerChars.splice(idx, 1); // Remove matched char
    }
  }

  // Calculate similarity based on matches vs longer string length
  return Math.round((matches / longer.length) * 100);
};
