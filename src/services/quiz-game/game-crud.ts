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
} from '../../types/quiz-game';
import type { Flashcard } from '../../types/flashcard';
import type { JLPTQuestion } from '../../types/jlpt-question';
import { COLLECTIONS } from './constants';
import { generateGameCode } from './utils';
import { generateQuestionsFromFlashcards, generateQuestionsFromJLPT } from './question-generator';

export async function createGame(
  data: CreateGameData,
  hostId: string,
  hostName: string,
  hostAvatar: string | undefined,
  flashcards: Flashcard[],
  jlptQuestions?: JLPTQuestion[]
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
    // Filter flashcards by selected lessons
    const lessonCards = flashcards.filter(card => data.lessonIds.includes(card.lessonId));

    if (lessonCards.length < 4) {
      throw new Error('Cần ít nhất 4 thẻ để tạo game');
    }

    questions = generateQuestionsFromFlashcards(
      lessonCards,
      data.totalRounds,
      data.timePerQuestion,
      settings.specialRoundEvery,
      data.questionContent || 'kanji',
      data.answerContent || 'vocabulary_meaning'
    );
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
    avatar: hostAvatar,
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
    ...(data.source === 'flashcards' && data.lessonNames && data.lessonNames.length > 0 && { lessonNames: data.lessonNames }),
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
