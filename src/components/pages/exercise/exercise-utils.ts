// Exercise Page Utility Functions

import type { Exercise, ExerciseQuestion, ExerciseType } from '../../../types/exercise';
import type { Flashcard, JLPTLevel } from '../../../types/flashcard';
import { getTotalQuestionCount } from '../../../types/exercise';

// Helper to get exercise types (handle legacy)
export const getExerciseTypes = (ex: Exercise): ExerciseType[] => {
  return ex.types || (ex.type ? [ex.type as ExerciseType] : []);
};

// Helper to get exercise levels (handle legacy)
export const getExerciseLevels = (ex: Exercise): JLPTLevel[] => {
  return ex.jlptLevels || (ex.jlptLevel ? [ex.jlptLevel] : []);
};

// Helper to get total question count (handle legacy)
export const getExerciseQuestionCount = (ex: Exercise): number => {
  if (ex.questionCountByType && ex.types) {
    return getTotalQuestionCount(ex.questionCountByType, ex.types);
  }
  return ex.questionCount || 10;
};

// Generate questions from flashcards
export const generateQuestions = (exercise: Exercise, flashcards: Flashcard[]): ExerciseQuestion[] => {
  const availableCards = flashcards.filter(c => exercise.lessonIds.includes(c.lessonId));
  const types = getExerciseTypes(exercise);
  const totalCount = getExerciseQuestionCount(exercise);

  if (availableCards.length < 4) return [];

  const questions: ExerciseQuestion[] = [];
  const shuffledCards = [...availableCards].sort(() => Math.random() - 0.5);

  const questionsPerType: Record<ExerciseType, number> = {} as Record<ExerciseType, number>;
  if (exercise.questionCountByType) {
    types.forEach(type => {
      questionsPerType[type] = exercise.questionCountByType[type] || 0;
    });
  } else {
    const perType = Math.ceil(totalCount / types.length);
    types.forEach(type => {
      questionsPerType[type] = perType;
    });
  }

  let cardIndex = 0;
  types.forEach(type => {
    const count = Math.min(questionsPerType[type], shuffledCards.length - cardIndex);

    for (let i = 0; i < count && cardIndex < shuffledCards.length; i++, cardIndex++) {
      const card = shuffledCards[cardIndex];
      const otherCards = availableCards.filter(c => c.id !== card.id);
      const wrongOptions = otherCards.sort(() => Math.random() - 0.5).slice(0, 3);

      if (type === 'listening_write') {
        questions.push({
          id: `q-${questions.length}`,
          type,
          vocabularyId: card.id,
          vocabulary: card.vocabulary,
          kanji: card.kanji || '',
          meaning: card.meaning,
          correctAnswer: card.vocabulary,
        });
        continue;
      }

      let options: string[];
      switch (type) {
        case 'vocabulary':
          options = [card.meaning, ...wrongOptions.map(c => c.meaning)];
          break;
        case 'meaning':
          options = [card.vocabulary, ...wrongOptions.map(c => c.vocabulary)];
          break;
        case 'kanji_to_vocab':
          if (!card.kanji) continue;
          options = [card.vocabulary, ...wrongOptions.map(c => c.vocabulary)];
          break;
        case 'vocab_to_kanji':
          if (!card.kanji) continue;
          options = [card.kanji, ...wrongOptions.filter(c => c.kanji).map(c => c.kanji!)];
          if (options.length < 4) continue;
          break;
        default:
          options = [card.meaning, ...wrongOptions.map(c => c.meaning)];
      }

      const shuffledOptions = options.map((opt, idx) => ({ opt, isCorrect: idx === 0 }));
      shuffledOptions.sort(() => Math.random() - 0.5);
      const correctIndex = shuffledOptions.findIndex(o => o.isCorrect);

      questions.push({
        id: `q-${questions.length}`,
        type,
        vocabularyId: card.id,
        vocabulary: card.vocabulary,
        kanji: card.kanji || '',
        meaning: card.meaning,
        options: shuffledOptions.map(o => o.opt),
        correctIndex,
      });
    }
  });

  return questions;
};

// Get question display text
export const getQuestionText = (q: ExerciseQuestion) => {
  switch (q.type) {
    case 'vocabulary':
      return q.kanji ? `${q.vocabulary} (${q.kanji})` : q.vocabulary;
    case 'meaning':
      return q.meaning;
    case 'kanji_to_vocab':
      return q.kanji;
    case 'vocab_to_kanji':
      return q.vocabulary;
    default:
      return q.vocabulary;
  }
};

// Get question type label
export const getQuestionTypeLabel = (type: ExerciseType) => {
  switch (type) {
    case 'vocabulary': return '📖 Từ vựng → Nghĩa';
    case 'meaning': return '🎯 Nghĩa → Từ vựng';
    case 'kanji_to_vocab': return '漢 Kanji → Từ vựng';
    case 'vocab_to_kanji': return 'あ Từ vựng → Kanji';
    case 'listening_write': return '🎧 Nghe → Viết từ';
    case 'sentence_translation': return '🔄 Dịch câu';
    default: return '';
  }
};

// Get score grade
export const getScoreGrade = (percentage: number) => {
  if (percentage >= 90) return { grade: 'S', color: '#FFD700', label: 'Xuất sắc!' };
  if (percentage >= 80) return { grade: 'A', color: '#22c55e', label: 'Tuyệt vời!' };
  if (percentage >= 70) return { grade: 'B', color: '#3b82f6', label: 'Tốt lắm!' };
  if (percentage >= 60) return { grade: 'C', color: '#f59e0b', label: 'Khá ổn!' };
  return { grade: 'D', color: '#ef4444', label: 'Cần cố gắng!' };
};
