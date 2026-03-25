// CRUD operations for Quiz Game

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type {
  QuizGame,
  GamePlayer,
  CreateGameData,
  GameDifficultyLevel,
} from '../../types/quiz-game';
import type { Flashcard, DifficultyLevel } from '../../types/flashcard';
import type { JLPTQuestion } from '../../types/jlpt-question';
import { COLLECTIONS } from './constants';
import { generateGameCode, shuffleArray } from './utils';
import { generateQuestionsFromFlashcards, generateQuestionsFromJLPT, generateQuestionsForKanjiMode } from './question-generator';

// Filter flashcards by difficulty mix percentages
// Returns a shuffled pool of cards selected according to the mix ratios
function filterByDifficultyMix(
  cards: Flashcard[],
  gameDifficulty: GameDifficultyLevel,
  mixConfig: Record<GameDifficultyLevel, { super_hard: number; hard: number; medium: number; easy: number }>,
  totalRounds: number
): Flashcard[] {
  const row = mixConfig[gameDifficulty];
  const rowTotal = row.super_hard + row.hard + row.medium + row.easy;
  if (rowTotal === 0) return shuffleArray(cards);

  // Group cards by their difficulty level
  const buckets: Record<GameDifficultyLevel, Flashcard[]> = {
    super_hard: [], hard: [], medium: [], easy: [],
  };
  const unset: Flashcard[] = [];
  for (const card of cards) {
    const d = card.difficultyLevel as DifficultyLevel;
    if (d && d !== 'unset' && buckets[d as GameDifficultyLevel]) {
      buckets[d as GameDifficultyLevel].push(card);
    } else {
      unset.push(card);
    }
  }

  // Calculate how many cards needed from each difficulty
  const levels: GameDifficultyLevel[] = ['super_hard', 'hard', 'medium', 'easy'];
  const selected: Flashcard[] = [];

  for (const diff of levels) {
    const pct = row[diff] / rowTotal;
    const needed = Math.round(pct * totalRounds);
    if (needed <= 0) continue;

    const available = shuffleArray(buckets[diff]);
    const picked = available.slice(0, needed);
    selected.push(...picked);

    // If not enough cards in this bucket, will be supplemented from unset pool
    if (picked.length < needed) {
      const deficit = needed - picked.length;
      const supplement = shuffleArray(unset).splice(0, deficit);
      selected.push(...supplement);
    }
  }

  // If total selected is still less than totalRounds, fill from remaining unset + all cards
  if (selected.length < totalRounds) {
    const selectedIds = new Set(selected.map(c => c.id));
    const remaining = shuffleArray(cards.filter(c => !selectedIds.has(c.id)));
    selected.push(...remaining.slice(0, totalRounds - selected.length));
  }

  return shuffleArray(selected);
}

export async function createGame(
  data: CreateGameData,
  hostId: string,
  hostName: string,
  hostAvatar: string | undefined,
  flashcards: Flashcard[],
  jlptQuestions?: JLPTQuestion[],
  hostRole?: string
): Promise<QuizGame> {
  const settings = {
    minPlayers: 2,
    maxPlayers: 20,
    showLeaderboardEvery: 5,
    specialRoundEvery: 5,
    basePoints: 100,
    streakBonus: 10,
    timeBonus: true,
    ...data.settings,
  };

  let questions;

  if (data.source === 'jlpt' && jlptQuestions) {
    // Filter JLPT questions by level and category
    let filteredQuestions = jlptQuestions;
    if (data.jlptLevels && data.jlptLevels.length > 0) {
      filteredQuestions = filteredQuestions.filter(q => data.jlptLevels!.includes(q.level));
    }
    if (data.jlptCategories && data.jlptCategories.length > 0) {
      filteredQuestions = filteredQuestions.filter(q => data.jlptCategories!.includes(q.category));
    }

    if (filteredQuestions.length < 4) {
      throw new Error('Cần ít nhất 4 câu hỏi JLPT để tạo game');
    }

    questions = generateQuestionsFromJLPT(
      filteredQuestions,
      data.totalRounds,
      data.timePerQuestion,
      settings.specialRoundEvery
    );
  } else {
    // Vocabulary or Kanji mode — both use flashcards as source
    let lessonCards = flashcards.filter(card => data.lessonIds.includes(card.lessonId));

    if (lessonCards.length < 4) {
      throw new Error('Cần ít nhất 4 thẻ để tạo game');
    }

    const gameDifficulty = data.difficultyLevels?.[0];
    if (gameDifficulty && data.difficultyMix) {
      lessonCards = filterByDifficultyMix(lessonCards, gameDifficulty, data.difficultyMix, data.totalRounds);
    }

    if (data.source === 'kanji') {
      // Kanji mode: question=kanji, answers=hiragana readings (similar distractors)
      questions = generateQuestionsForKanjiMode(
        lessonCards,
        data.totalRounds,
        data.timePerQuestion,
        settings.specialRoundEvery,
        gameDifficulty,
        flashcards,
      );
    } else {
      // Vocabulary mode (or legacy 'flashcards'): question=kanji/vocab, answers=meaning
      questions = generateQuestionsFromFlashcards(
        lessonCards,
        data.totalRounds,
        data.timePerQuestion,
        settings.specialRoundEvery,
        data.questionContent || 'kanji',
        data.answerContent || 'meaning',
        gameDifficulty,
        flashcards,
      );
    }
  }

  // Generate unique game code
  let code = generateGameCode();
  let codeExists = true;
  while (codeExists) {
    const existing = await getGameByCode(code);
    if (!existing) {
      codeExists = false;
    } else {
      code = generateGameCode();
    }
  }

  const hostPlayer: GamePlayer = {
    id: hostId,
    name: hostName,
    avatar: hostAvatar || '',
    role: hostRole,
    isSpectator: data.hostMode === 'spectate',
    score: 0,
    isHost: true,
    isBlocked: false,
    hasDoublePoints: false,
    hasShield: false,
    hasTimeFreeze: false,
    currentAnswer: null,
    answerTime: null,
    streak: 0,
    joinedAt: new Date().toISOString(),
  };

  const game: Omit<QuizGame, 'id'> = {
    code,
    hostId,
    hostName,
    title: data.title,
    status: 'waiting',
    players: { [hostId]: hostPlayer },
    questions,
    currentRound: 0,
    totalRounds: questions.length,
    timePerQuestion: data.timePerQuestion,
    roundStartTime: null,
    createdAt: new Date().toISOString(),
    settings,
    // Metadata for display in lobby
    source: data.source,
    // Only include optional fields if they have values (Firestore doesn't accept undefined)
    ...(data.source === 'jlpt' && data.jlptLevels && data.jlptLevels.length > 0 && { jlptLevels: data.jlptLevels }),
    ...((data.source === 'vocabulary' || data.source === 'kanji' || data.source === 'flashcards') && data.lessonNames && data.lessonNames.length > 0 && { lessonNames: data.lessonNames }),
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.GAMES), game);
  return { id: docRef.id, ...game };
}

export async function getGame(gameId: string): Promise<QuizGame | null> {
  const docRef = doc(db, COLLECTIONS.GAMES, gameId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as QuizGame;
}

export async function getGameByCode(code: string): Promise<QuizGame | null> {
  const q = query(
    collection(db, COLLECTIONS.GAMES),
    where('code', '==', code.toUpperCase())
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as QuizGame;
}

export async function updateGame(gameId: string, data: Partial<QuizGame>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.GAMES, gameId);
  await updateDoc(docRef, data);
}

/** Field-level update using dot notation (e.g. 'players.abc.score': 100) */
export async function updateGameFields(gameId: string, fields: Record<string, unknown>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.GAMES, gameId);
  await updateDoc(docRef, fields);
}

export async function deleteGame(gameId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.GAMES, gameId);
  await deleteDoc(docRef);
}

export function subscribeToGame(gameId: string, callback: (game: QuizGame | null) => void): Unsubscribe {
  return onSnapshot(doc(db, COLLECTIONS.GAMES, gameId), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback({ id: snapshot.id, ...snapshot.data() } as QuizGame);
  });
}
