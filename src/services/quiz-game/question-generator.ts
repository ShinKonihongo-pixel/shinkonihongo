// Question generation logic for Quiz Game
// Handles difficulty-based filtering, similar wrong options, fake words, and katakana

import type {
  GameQuestion,
  GameQuestionContent,
  GameAnswerContent,
  GameDifficultyLevel,
} from '../../types/quiz-game';
import type { Flashcard } from '../../types/flashcard';
import type { JLPTQuestion } from '../../types/jlpt-question';
import { generateId, shuffleArray } from './utils';

// --- Katakana detection ---
const KATAKANA_REGEX = /^[\u30A0-\u30FF\u31F0-\u31FF\u3099-\u309Cー・\s]+$/;
function isKatakanaWord(text: string): boolean {
  return KATAKANA_REGEX.test(text.trim());
}

// --- Hiragana / Katakana character pools for fake word generation ---
const HIRAGANA_CHARS = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん'.split('');
const KATAKANA_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'.split('');

// Detect if text is primarily hiragana
const HIRAGANA_REGEX = /^[\u3040-\u309F\u3099-\u309Cー\s]+$/;

// --- Fake word generation for hard/super_hard ---

// Scramble characters of a word (swap adjacent chars, insert/remove a char)
function scrambleWord(word: string): string {
  const chars = word.split('');
  if (chars.length < 2) return word;

  // Strategy: swap 1-2 random adjacent characters
  const swaps = chars.length <= 3 ? 1 : 2;
  for (let s = 0; s < swaps; s++) {
    const i = Math.floor(Math.random() * (chars.length - 1));
    [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
  }
  return chars.join('');
}

// Generate a plausible fake word by mixing real chars from vocabulary pool
function generateFakeWord(
  realWord: string,
  pool: string[],
  existingOptions: Set<string>
): string | null {
  // Try scrambling the real word
  for (let attempt = 0; attempt < 5; attempt++) {
    const fake = scrambleWord(realWord);
    if (fake !== realWord && !existingOptions.has(fake)) return fake;
  }

  // Try mixing syllables from pool words of similar length
  const similarWords = pool.filter(w =>
    Math.abs(w.length - realWord.length) <= 1 && w !== realWord
  );
  if (similarWords.length >= 2) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const w1 = similarWords[Math.floor(Math.random() * similarWords.length)];
      const w2 = similarWords[Math.floor(Math.random() * similarWords.length)];
      const mid = Math.floor(w1.length / 2);
      const fake = w1.slice(0, mid) + w2.slice(mid);
      if (fake !== realWord && !existingOptions.has(fake) && fake.length >= 2) return fake;
    }
  }

  // Generate random kana word of similar length
  const isKata = isKatakanaWord(realWord);
  const charPool = isKata ? KATAKANA_CHARS : (HIRAGANA_REGEX.test(realWord) ? HIRAGANA_CHARS : null);
  if (charPool) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const len = realWord.length + (Math.random() > 0.5 ? 0 : (Math.random() > 0.5 ? 1 : -1));
      const actualLen = Math.max(2, Math.min(len, realWord.length + 1));
      const fake = Array.from({ length: actualLen }, () =>
        charPool[Math.floor(Math.random() * charPool.length)]
      ).join('');
      if (fake !== realWord && !existingOptions.has(fake)) return fake;
    }
  }

  return null;
}

// --- Similar option selection ---

// Score how similar two strings are (higher = more similar)
function similarityScore(a: string, b: string): number {
  if (a === b) return -1; // Exclude identical
  let score = 0;
  // Similar length bonus
  score += Math.max(0, 5 - Math.abs(a.length - b.length));
  // Shared characters bonus
  const aChars = new Set(a.split(''));
  const bChars = new Set(b.split(''));
  for (const ch of aChars) if (bChars.has(ch)) score += 2;
  // Same first character bonus
  if (a[0] === b[0]) score += 3;
  return score;
}

// Pick wrong options that are similar to the correct answer, sorted by similarity
function pickSimilarOptions(
  correctAnswer: string,
  allOptions: string[],
  count: number,
  gameDifficulty?: GameDifficultyLevel,
  vocabularyPool?: string[],
): string[] {
  // Remove duplicates and the correct answer
  const uniqueOptions = [...new Set(allOptions)].filter(o => o !== correctAnswer);

  // Score and sort by similarity (most similar first)
  const scored = uniqueOptions.map(o => ({
    text: o,
    score: similarityScore(correctAnswer, o),
  })).filter(o => o.score >= 0);

  scored.sort((a, b) => b.score - a.score);

  const result: string[] = [];
  const used = new Set<string>([correctAnswer]);

  // Pick most similar options
  for (const item of scored) {
    if (result.length >= count) break;
    if (!used.has(item.text)) {
      result.push(item.text);
      used.add(item.text);
    }
  }

  // For hard/super_hard: replace some options with fake scrambled words
  if ((gameDifficulty === 'hard' || gameDifficulty === 'super_hard') && vocabularyPool) {
    const fakeCount = gameDifficulty === 'super_hard' ? 2 : 1;
    const vocabOnly = correctAnswer.includes(' - ')
      ? correctAnswer.split(' - ')[0]
      : correctAnswer;

    for (let i = 0; i < fakeCount && i < result.length; i++) {
      const fake = generateFakeWord(vocabOnly, vocabularyPool, used);
      if (fake) {
        // If answer format is "vocabulary - meaning", make fake match format
        if (correctAnswer.includes(' - ')) {
          // Create a fake with scrambled vocab but keep plausible structure
          result[result.length - 1 - i] = fake;
        } else {
          result[result.length - 1 - i] = fake;
        }
        used.add(fake);
      }
    }
  }

  // Fill remaining if not enough similar options
  while (result.length < count) {
    const remaining = uniqueOptions.filter(o => !used.has(o));
    if (remaining.length === 0) break;
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    result.push(pick);
    used.add(pick);
  }

  return result;
}

// --- Ensure special round is not the last question ---
function ensureSpecialNotLast(questions: GameQuestion[]): GameQuestion[] {
  if (questions.length < 2) return questions;
  const lastIdx = questions.length - 1;
  if (questions[lastIdx].isSpecialRound) {
    [questions[lastIdx - 1], questions[lastIdx]] = [questions[lastIdx], questions[lastIdx - 1]];
  }
  return questions;
}

// --- Content extraction helpers ---

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

// For katakana vocab: override question to show meaning only
function getQuestionText(
  card: Flashcard,
  questionContent: GameQuestionContent
): string {
  const vocab = card.vocabulary;
  // If vocabulary is katakana and question would show the katakana/vocab,
  // switch to meaning-only to avoid revealing the answer
  if (isKatakanaWord(vocab) && (questionContent === 'kanji' || questionContent === 'vocabulary')) {
    return card.meaning;
  }
  return getCardContent(card, questionContent);
}

// --- Main question generators ---

export function generateQuestionsFromFlashcards(
  flashcards: Flashcard[],
  totalRounds: number,
  timePerQuestion: number,
  specialRoundEvery: number,
  questionContent: GameQuestionContent = 'kanji',
  answerContent: GameAnswerContent = 'vocabulary_meaning',
  gameDifficulty?: GameDifficultyLevel,
  allFlashcards?: Flashcard[],
): GameQuestion[] {
  // Shuffle and pick cards (already filtered by difficulty mix in game-crud)
  const shuffled = shuffleArray(flashcards);
  const selectedCards = shuffled.slice(0, Math.min(totalRounds, shuffled.length));

  // Build vocabulary pool for fake word generation (from all available cards)
  const vocabPool = (allFlashcards || flashcards).map(c => c.vocabulary);

  // Build all possible wrong options from the full pool
  const allAnswerOptions = (allFlashcards || flashcards).map(c => getCardContent(c, answerContent));

  const usedQuestionIds = new Set<string>(); // Ensure no repeat

  const questions = selectedCards
    .filter(card => {
      // No duplicate questions
      if (usedQuestionIds.has(card.id)) return false;
      usedQuestionIds.add(card.id);
      return true;
    })
    .map((card, index) => {
      // Get question text — katakana-aware
      const questionText = getQuestionText(card, questionContent);

      // Get correct answer
      const correctAnswer = getCardContent(card, answerContent);

      // Generate wrong options — prefer similar words
      const wrongPool = allAnswerOptions.filter(a => a !== correctAnswer);
      const wrongOptions = pickSimilarOptions(
        correctAnswer,
        wrongPool,
        3,
        gameDifficulty,
        vocabPool,
      );

      // Shuffle all options together
      const options = shuffleArray([correctAnswer, ...wrongOptions.slice(0, 3)]);
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

  return ensureSpecialNotLast(questions);
}

// --- Kanji mode: hiragana-reading answers with confusingly similar distractors ---

/** Pick hiragana distractors that share 1-2 characters with the correct reading */
function pickSimilarHiraganaReadings(
  correctReading: string,
  allReadings: string[],
  count: number,
): string[] {
  const unique = [...new Set(allReadings)].filter(r => r !== correctReading && r.length > 0);

  // Score: prefer readings that share some characters but are not identical
  const scored = unique.map(r => {
    let score = 0;
    // Shared characters (hiragana overlap → confusing)
    const correctChars = correctReading.split('');
    const rChars = new Set(r.split(''));
    const sharedCount = correctChars.filter(c => rChars.has(c)).length;
    score += sharedCount * 3;
    // Similar length is more confusing
    score += Math.max(0, 6 - Math.abs(correctReading.length - r.length) * 2);
    // Same first char is very confusing
    if (r[0] === correctReading[0]) score += 5;
    // Same last char
    if (r[r.length - 1] === correctReading[correctReading.length - 1]) score += 3;
    return { text: r, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const result: string[] = [];
  const used = new Set<string>([correctReading]);

  for (const item of scored) {
    if (result.length >= count) break;
    if (!used.has(item.text)) {
      result.push(item.text);
      used.add(item.text);
    }
  }

  // Fill remaining with random readings if not enough similar ones
  while (result.length < count) {
    const remaining = unique.filter(r => !used.has(r));
    if (remaining.length === 0) break;
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    result.push(pick);
    used.add(pick);
  }

  return result;
}

/** Generate questions for Kanji mode: question = kanji, answers = hiragana readings */
export function generateQuestionsForKanjiMode(
  flashcards: Flashcard[],
  totalRounds: number,
  timePerQuestion: number,
  specialRoundEvery: number,
  gameDifficulty?: GameDifficultyLevel,
  allFlashcards?: Flashcard[],
): GameQuestion[] {
  // Only use cards that have kanji (non-empty kanji field different from vocabulary)
  const kanjiCards = flashcards.filter(c => c.kanji && c.kanji.trim() && c.kanji !== c.vocabulary);

  if (kanjiCards.length === 0) {
    // Fallback: use all flashcards with vocabulary as question
    return generateQuestionsFromFlashcards(
      flashcards, totalRounds, timePerQuestion, specialRoundEvery,
      'vocabulary', 'meaning', gameDifficulty, allFlashcards,
    );
  }

  const shuffled = shuffleArray(kanjiCards);
  const selectedCards = shuffled.slice(0, Math.min(totalRounds, shuffled.length));

  // Build pool of all hiragana readings for distractor generation
  const allPool = allFlashcards || flashcards;
  const allReadings = allPool.map(c => c.vocabulary).filter(v => v && v.trim());

  const usedIds = new Set<string>();

  const questions = selectedCards
    .filter(card => {
      if (usedIds.has(card.id)) return false;
      usedIds.add(card.id);
      return true;
    })
    .map((card, index) => {
      const questionText = card.kanji; // Show kanji as the question
      const correctAnswer = card.vocabulary; // Hiragana reading is the answer

      // Pick 3 confusingly similar hiragana readings
      const wrongOptions = pickSimilarHiraganaReadings(
        correctAnswer,
        allReadings,
        3,
      );

      const options = shuffleArray([correctAnswer, ...wrongOptions.slice(0, 3)]);
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

  return ensureSpecialNotLast(questions);
}

// Generate questions from JLPT questions (unchanged logic, no difficulty mix)
export function generateQuestionsFromJLPT(
  jlptQuestions: JLPTQuestion[],
  totalRounds: number,
  timePerQuestion: number,
  specialRoundEvery: number
): GameQuestion[] {
  const shuffled = shuffleArray(jlptQuestions);
  const selectedQuestions = shuffled.slice(0, Math.min(totalRounds, shuffled.length));

  const questions = selectedQuestions.map((q, index) => {
    const correctAnswerIndex = q.answers.findIndex(a => a.isCorrect);
    const correctAnswer = q.answers[correctAnswerIndex]?.text || '';

    const shuffledAnswers = shuffleArray(q.answers.map(a => a.text));
    const newCorrectIndex = shuffledAnswers.indexOf(correctAnswer);

    const isSpecialRound = (index + 1) % specialRoundEvery === 0;

    return {
      id: generateId(),
      flashcardId: q.id,
      question: q.question,
      correctAnswer,
      options: shuffledAnswers,
      correctIndex: newCorrectIndex,
      timeLimit: timePerQuestion,
      isSpecialRound,
    };
  });

  return ensureSpecialNotLast(questions);
}
