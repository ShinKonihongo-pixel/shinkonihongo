// Question generation logic for Quiz Game

import type {
  GameQuestion,
  GameQuestionContent,
  GameAnswerContent,
} from '../../types/quiz-game';
import type { Flashcard } from '../../types/flashcard';
import type { JLPTQuestion } from '../../types/jlpt-question';
import { generateId, shuffleArray } from './utils';

// Helper to get card content based on content type
function getCardContent(
  card: Flashcard,
  contentType: GameQuestionContent | GameAnswerContent
): string {
  switch (contentType) {
    case 'kanji':
      return card.kanji || card.vocabulary;
    case 'vocabulary':
      return card.vocabulary;
    case 'meaning':
      return card.meaning;
    case 'vocabulary_meaning':
      return `${card.vocabulary} - ${card.meaning}`;
    default:
      return card.meaning;
  }
}

// Generate questions from flashcards
export function generateQuestionsFromFlashcards(
  flashcards: Flashcard[],
  totalRounds: number,
  timePerQuestion: number,
  specialRoundEvery: number,
  questionContent: GameQuestionContent = 'kanji',
  answerContent: GameAnswerContent = 'vocabulary_meaning'
): GameQuestion[] {
  // Shuffle and pick cards
  const shuffled = shuffleArray(flashcards);
  const selectedCards = shuffled.slice(0, Math.min(totalRounds, shuffled.length));

  return selectedCards.map((card, index) => {
    // Get question text based on setting
    const questionText = getCardContent(card, questionContent);

    // Get correct answer based on setting
    const correctAnswer = getCardContent(card, answerContent);

    // Generate wrong options from other cards
    const wrongOptions = shuffled
      .filter(c => c.id !== card.id)
      .slice(0, 10)
      .map(c => getCardContent(c, answerContent));

    const options = shuffleArray([correctAnswer, ...shuffleArray(wrongOptions).slice(0, 3)]);
    const correctIndex = options.indexOf(correctAnswer);

    const isSpecialRound = (index + 1) % specialRoundEvery === 0;

    return {
      id: generateId(),
      flashcardId: card.id,
      question: questionText,
      correctAnswer,
      options,
      correctIndex,
      timeLimit: timePerQuestion,
      isSpecialRound,
    };
  });
}

// Generate questions from JLPT questions
export function generateQuestionsFromJLPT(
  jlptQuestions: JLPTQuestion[],
  totalRounds: number,
  timePerQuestion: number,
  specialRoundEvery: number
): GameQuestion[] {
  // Shuffle and pick questions
  const shuffled = shuffleArray(jlptQuestions);
  const selectedQuestions = shuffled.slice(0, Math.min(totalRounds, shuffled.length));

  return selectedQuestions.map((q, index) => {
    // Find correct answer index
    const correctAnswerIndex = q.answers.findIndex(a => a.isCorrect);
    const correctAnswer = q.answers[correctAnswerIndex]?.text || '';

    // Shuffle the options
    const shuffledAnswers = shuffleArray(q.answers.map(a => a.text));
    const newCorrectIndex = shuffledAnswers.indexOf(correctAnswer);

    const isSpecialRound = (index + 1) % specialRoundEvery === 0;

    return {
      id: generateId(),
      flashcardId: q.id, // Use JLPT question ID
      question: q.question,
      correctAnswer,
      options: shuffledAnswers,
      correctIndex: newCorrectIndex,
      timeLimit: timePerQuestion,
      isSpecialRound,
    };
  });
}
