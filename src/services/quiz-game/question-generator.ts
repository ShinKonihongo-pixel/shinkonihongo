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

/**
 * Produce a visually close but different word by swapping adjacent characters.
 * More swaps for longer words so the difference remains subtle.
 */
function scrambleWord(word: string): string {
  const chars = word.split('');
  if (chars.length < 2) return word;

  // Limit to 1 swap for short words to keep the fake plausible-looking
  const swaps = chars.length <= 3 ? 1 : 2;
  for (let s = 0; s < swaps; s++) {
    const i = Math.floor(Math.random() * (chars.length - 1));
    [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
  }
  return chars.join('');
}

/**
 * Generate a plausible fake word that looks like real vocabulary but is not.
 * Three strategies are attempted in order of decreasing plausibility:
 *   1. Scramble the real word (most convincing — same characters, different order)
 *   2. Splice the first half of one pool word with the second half of another (hybrid)
 *   3. Randomly assemble kana characters of similar length (last resort)
 * Returns null when all attempts produce a word that is already in use.
 */
function generateFakeWord(
  realWord: string,
  pool: string[],
  existingOptions: Set<string>
): string | null {
  // Strategy 1: scramble the real word's characters
  for (let attempt = 0; attempt < 5; attempt++) {
    const fake = scrambleWord(realWord);
    if (fake !== realWord && !existingOptions.has(fake)) return fake;
  }

  // Strategy 2: splice syllables from two pool words of similar length
  // This produces hybrids that feel like real vocabulary to a learner
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

  // Strategy 3: build a random kana string of similar length
  // Only possible when the real word is pure hiragana or katakana
  const isKata = isKatakanaWord(realWord);
  const charPool = isKata ? KATAKANA_CHARS : (HIRAGANA_REGEX.test(realWord) ? HIRAGANA_CHARS : null);
  if (charPool) {
    for (let attempt = 0; attempt < 5; attempt++) {
      // Vary length slightly (±1) to avoid all fakes looking identical in structure
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

/**
 * Compute a heuristic similarity score between two answer strings.
 * Higher scores mean the strings look more alike — making them better wrong options.
 * Returns -1 when the strings are identical (used to filter out the correct answer).
 */
function similarityScore(a: string, b: string): number {
  if (a === b) return -1; // Exclude identical
  let score = 0;
  // Penalise large length differences — similar-length options are harder to distinguish
  score += Math.max(0, 5 - Math.abs(a.length - b.length));
  // Shared characters increase visual similarity
  const aChars = new Set(a.split(''));
  const bChars = new Set(b.split(''));
  for (const ch of aChars) if (bChars.has(ch)) score += 2;
  // Same first character is especially confusing at a glance
  if (a[0] === b[0]) score += 3;
  return score;
}

/**
 * Select `count` wrong answer options that are as visually/phonetically close
 * to the correct answer as possible, making the question genuinely challenging.
 *
 * For hard/super_hard difficulty, one or two of the similar options are replaced
 * with fake words generated by `generateFakeWord`, so players cannot rely on
 * recognising partial vocabulary they have already seen.
 */
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

  // Take the top-scoring (most similar) options first
  for (const item of scored) {
    if (result.length >= count) break;
    if (!used.has(item.text)) {
      result.push(item.text);
      used.add(item.text);
    }
  }

  // For hard/super_hard: inject fake words to replace the least-similar real options.
  // super_hard injects 2 fakes; hard injects 1.  Replacing from the end of `result`
  // preserves the most confusing real options while adding unpredictable fakes.
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

  // Fill remaining if not enough similar options exist in the pool
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
// A special round at position N-1 would leave no normal question after the power-up phase,
// causing an awkward game-end flow. Swap it one position earlier to avoid this.
function ensureSpecialNotLast(questions: GameQuestion[]): GameQuestion[] {
  if (questions.length < 2) return questions;
  const lastIdx = questions.length - 1;
  if (questions[lastIdx].isSpecialRound) {
    [questions[lastIdx - 1], questions[lastIdx]] = [questions[lastIdx], questions[lastIdx - 1]];
  }
  return questions;
}

// --- Content extraction helpers ---

/**
 * Extract the display text for a flashcard field based on the requested content type.
 * Falls back to `card.vocabulary` when kanji is absent.
 */
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

/**
 * Return the question prompt text, with a special case for katakana vocabulary.
 * Katakana words (foreign loanwords) are phonetically transparent — showing the
 * katakana as the question would make the answer immediately obvious.
 * Override to show meaning instead so the question tests reading, not guessing.
 */
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

/**
 * Generate a shuffled set of multiple-choice questions from a flashcard pool.
 *
 * @param flashcards       Cards already filtered/mixed by difficulty (from game-crud)
 * @param totalRounds      Maximum number of questions to produce
 * @param timePerQuestion  Seconds per question stored on each question object
 * @param specialRoundEvery  Every Nth question becomes a special (power-up) round
 * @param questionContent  Which card field to display as the question prompt
 * @param answerContent    Which card field to use for answer options
 * @param gameDifficulty   When set, activates fake-word injection for hard/super_hard
 * @param allFlashcards    Full lesson pool used to build diverse distractor candidates
 */
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

      // Generate wrong options — prefer similar words to increase difficulty
      const wrongPool = allAnswerOptions.filter(a => a !== correctAnswer);
      const wrongOptions = pickSimilarOptions(
        correctAnswer,
        wrongPool,
        3,
        gameDifficulty,
        vocabPool,
      );

      // Shuffle all options together so correct answer has no positional bias
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

/**
 * Pick hiragana distractors that share 1-2 characters with the correct reading.
 *
 * Scoring priorities (highest → lowest):
 *   1. Same first character  (+5) — most confusing since learners scan the start
 *   2. Shared characters     (+3 per shared char) — phonetic overlap creates doubt
 *   3. Same last character   (+3) — secondary anchor point for recognition
 *   4. Similar length        (up to +6) — very different lengths are easy to dismiss
 */
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

  // Fill remaining with random readings if not enough similar ones exist
  while (result.length < count) {
    const remaining = unique.filter(r => !used.has(r));
    if (remaining.length === 0) break;
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    result.push(pick);
    used.add(pick);
  }

  return result;
}

/**
 * Generate questions for Kanji mode.
 * Question prompt = kanji character(s); answer options = hiragana readings.
 * Cards without a distinct kanji field are silently skipped; if none qualify,
 * falls back to vocabulary-mode questions so the game can still proceed.
 *
 * @param flashcards       Difficulty-filtered cards from game-crud
 * @param totalRounds      Maximum questions to produce
 * @param timePerQuestion  Seconds per question
 * @param specialRoundEvery  Every Nth question becomes a power-up round
 * @param gameDifficulty   Passed through for potential future hard-mode fakes
 * @param allFlashcards    Full pool used to build the hiragana distractor candidate list
 */
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

  // Build pool of all hiragana readings available for distractor generation
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
      const questionText = card.kanji;       // Show kanji as the question prompt
      const correctAnswer = card.vocabulary; // Hiragana reading is the expected answer

      // Pick 3 confusingly similar hiragana readings as wrong options
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

/**
 * Generate questions directly from the JLPT question bank.
 * JLPT questions already carry their own answer options, so no distractor
 * generation is needed — options are simply reshuffled to remove positional bias.
 *
 * @param jlptQuestions  Pre-filtered JLPT questions (level/category filtering done in game-crud)
 * @param totalRounds    Maximum questions to produce
 * @param timePerQuestion  Seconds per question
 * @param specialRoundEvery  Every Nth question becomes a power-up round
 */
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

    // Re-shuffle the pre-authored answer texts to avoid always placing the correct answer first
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
