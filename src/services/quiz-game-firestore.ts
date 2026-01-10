// Firestore service for Quiz Game real-time multiplayer

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
import { db } from '../lib/firebase';
import type {
  QuizGame,
  GamePlayer,
  GameQuestion,
  GameStatus,
  CreateGameData,
  GameResults,
  PlayerResult,
  GameQuestionContent,
  GameAnswerContent,
} from '../types/quiz-game';
import type { Flashcard } from '../types/flashcard';
import type { JLPTQuestion } from '../types/jlpt-question';

// Collection names
const COLLECTIONS = {
  GAMES: 'quiz_games',
  GAME_RESULTS: 'quiz_game_results',
} as const;

// Generate 6-digit game code
function generateGameCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Generate unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// Shuffle array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

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
function generateQuestionsFromFlashcards(
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
function generateQuestionsFromJLPT(
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

// ============ GAME CRUD ============

export async function createGame(
  data: CreateGameData,
  hostId: string,
  hostName: string,
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

  let questions: GameQuestion[];

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

export function subscribeToGame(gameId: string, callback: (game: QuizGame | null) => void): Unsubscribe {
  return onSnapshot(doc(db, COLLECTIONS.GAMES, gameId), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback({ id: snapshot.id, ...snapshot.data() } as QuizGame);
  });
}

export async function updateGame(gameId: string, data: Partial<QuizGame>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.GAMES, gameId);
  await updateDoc(docRef, data);
}

export async function deleteGame(gameId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.GAMES, gameId);
  await deleteDoc(docRef);
}

// ============ PLAYER MANAGEMENT ============

export async function joinGame(
  gameCode: string,
  playerId: string,
  playerName: string
): Promise<{ game: QuizGame; error?: string }> {
  const game = await getGameByCode(gameCode);

  if (!game) {
    return { game: null as unknown as QuizGame, error: 'Không tìm thấy game' };
  }

  if (game.status !== 'waiting') {
    return { game, error: 'Game đã bắt đầu' };
  }

  const playerCount = Object.keys(game.players).length;
  if (playerCount >= game.settings.maxPlayers) {
    return { game, error: 'Game đã đầy' };
  }

  // Check if player already in game
  if (game.players[playerId]) {
    return { game, error: 'Bạn đã trong game' };
  }

  const newPlayer: GamePlayer = {
    id: playerId,
    name: playerName,
    score: 0,
    isHost: false,
    isBlocked: false,
    hasDoublePoints: false,
    hasShield: false,
    hasTimeFreeze: false,
    currentAnswer: null,
    answerTime: null,
    streak: 0,
    joinedAt: new Date().toISOString(),
  };

  await updateGame(game.id, {
    players: { ...game.players, [playerId]: newPlayer },
  });

  return { game: { ...game, players: { ...game.players, [playerId]: newPlayer } } };
}

export async function leaveGame(gameId: string, playerId: string): Promise<void> {
  const game = await getGame(gameId);
  if (!game) return;

  const { [playerId]: _, ...remainingPlayers } = game.players;

  // If host leaves and game is waiting, delete game
  if (playerId === game.hostId && game.status === 'waiting') {
    await deleteGame(gameId);
    return;
  }

  await updateGame(gameId, { players: remainingPlayers });
}

export async function kickPlayer(gameId: string, hostId: string, playerId: string): Promise<boolean> {
  const game = await getGame(gameId);
  if (!game || game.hostId !== hostId) return false;
  if (playerId === hostId) return false; // Can't kick yourself

  const { [playerId]: _, ...remainingPlayers } = game.players;
  await updateGame(gameId, { players: remainingPlayers });
  return true;
}

// ============ GAME FLOW ============

export async function startGame(gameId: string, hostId: string): Promise<boolean> {
  const game = await getGame(gameId);
  if (!game || game.hostId !== hostId) return false;
  if (game.status !== 'waiting') return false;

  const playerCount = Object.keys(game.players).length;
  if (playerCount < game.settings.minPlayers) return false;

  await updateGame(gameId, {
    status: 'starting',
  });

  // After 3 second countdown, move to first question
  setTimeout(async () => {
    await updateGame(gameId, {
      status: 'question',
      currentRound: 0,
      roundStartTime: Date.now(),
    });
  }, 3000);

  return true;
}

export async function submitAnswer(
  gameId: string,
  playerId: string,
  answerIndex: number
): Promise<void> {
  const game = await getGame(gameId);
  if (!game || game.status !== 'question') return;

  const player = game.players[playerId];
  if (!player || player.isBlocked || player.currentAnswer !== null) return;

  const answerTime = Date.now() - (game.roundStartTime || Date.now());

  await updateGame(gameId, {
    players: {
      ...game.players,
      [playerId]: {
        ...player,
        currentAnswer: answerIndex,
        answerTime,
      },
    },
  });
}

export async function revealAnswer(gameId: string, hostId: string): Promise<void> {
  const game = await getGame(gameId);
  if (!game || game.hostId !== hostId || game.status !== 'question') return;

  const currentQuestion = game.questions[game.currentRound];
  const updatedPlayers = { ...game.players };

  // Calculate scores
  for (const playerId of Object.keys(updatedPlayers)) {
    const player = updatedPlayers[playerId];

    if (player.isBlocked) {
      // Reset blocked status for next round
      updatedPlayers[playerId] = { ...player, isBlocked: false };
      continue;
    }

    const isCorrect = player.currentAnswer === currentQuestion.correctIndex;

    if (isCorrect) {
      let points = game.settings.basePoints;

      // Time bonus (faster = more points)
      if (game.settings.timeBonus && player.answerTime) {
        const timeRatio = 1 - (player.answerTime / (currentQuestion.timeLimit * 1000));
        points += Math.floor(points * timeRatio * 0.5); // Up to 50% bonus
      }

      // Streak bonus
      const newStreak = player.streak + 1;
      points += newStreak * game.settings.streakBonus;

      // Double points power-up
      if (player.hasDoublePoints) {
        points *= 2;
      }

      updatedPlayers[playerId] = {
        ...player,
        score: player.score + points,
        streak: newStreak,
        hasDoublePoints: false, // Reset after use
        hasTimeFreeze: false,
      };
    } else {
      // Reset streak on wrong answer
      updatedPlayers[playerId] = {
        ...player,
        streak: 0,
        hasDoublePoints: false,
        hasTimeFreeze: false,
      };
    }
  }

  const nextStatus: GameStatus = 'answer_reveal';

  await updateGame(gameId, {
    status: nextStatus,
    players: updatedPlayers,
  });
}

export async function nextRound(gameId: string, hostId: string): Promise<void> {
  const game = await getGame(gameId);
  if (!game || game.hostId !== hostId) return;

  const currentQuestion = game.questions[game.currentRound];
  const isSpecialRound = currentQuestion.isSpecialRound;
  const isLastRound = game.currentRound >= game.totalRounds - 1;
  const showLeaderboard = (game.currentRound + 1) % game.settings.showLeaderboardEvery === 0;

  if (isLastRound) {
    // End game
    await endGame(gameId);
    return;
  }

  // Reset player answers for next round
  const resetPlayers = { ...game.players };
  for (const playerId of Object.keys(resetPlayers)) {
    resetPlayers[playerId] = {
      ...resetPlayers[playerId],
      currentAnswer: null,
      answerTime: null,
    };
  }

  let nextStatus: GameStatus;
  if (isSpecialRound) {
    nextStatus = 'power_up';
  } else if (showLeaderboard) {
    nextStatus = 'leaderboard';
  } else {
    nextStatus = 'question';
  }

  await updateGame(gameId, {
    status: nextStatus,
    currentRound: nextStatus === 'question' ? game.currentRound + 1 : game.currentRound,
    roundStartTime: nextStatus === 'question' ? Date.now() : null,
    players: resetPlayers,
  });
}

export async function continueFromSpecial(gameId: string, hostId: string): Promise<void> {
  const game = await getGame(gameId);
  if (!game || game.hostId !== hostId || game.status !== 'power_up') return;

  const showLeaderboard = (game.currentRound + 1) % game.settings.showLeaderboardEvery === 0;

  if (showLeaderboard) {
    await updateGame(gameId, { status: 'leaderboard' });
  } else {
    await startNextQuestion(gameId);
  }
}

export async function continueFromLeaderboard(gameId: string, hostId: string): Promise<void> {
  const game = await getGame(gameId);
  if (!game || game.hostId !== hostId || game.status !== 'leaderboard') return;

  await startNextQuestion(gameId);
}

async function startNextQuestion(gameId: string): Promise<void> {
  const game = await getGame(gameId);
  if (!game) return;

  // Reset player answers
  const resetPlayers = { ...game.players };
  for (const playerId of Object.keys(resetPlayers)) {
    resetPlayers[playerId] = {
      ...resetPlayers[playerId],
      currentAnswer: null,
      answerTime: null,
    };
  }

  await updateGame(gameId, {
    status: 'question',
    currentRound: game.currentRound + 1,
    roundStartTime: Date.now(),
    players: resetPlayers,
  });
}

// ============ POWER-UPS ============

export async function usePowerUp(
  gameId: string,
  playerId: string,
  powerUpType: string,
  targetPlayerId?: string
): Promise<boolean> {
  const game = await getGame(gameId);
  if (!game || game.status !== 'power_up') return false;

  const player = game.players[playerId];
  if (!player) return false;

  const updatedPlayers = { ...game.players };

  switch (powerUpType) {
    case 'steal_points':
      if (!targetPlayerId || !updatedPlayers[targetPlayerId]) return false;
      if (updatedPlayers[targetPlayerId].hasShield) {
        // Target has shield, remove their shield but don't steal
        updatedPlayers[targetPlayerId] = {
          ...updatedPlayers[targetPlayerId],
          hasShield: false,
        };
      } else {
        const stolenPoints = Math.min(50, updatedPlayers[targetPlayerId].score);
        updatedPlayers[targetPlayerId] = {
          ...updatedPlayers[targetPlayerId],
          score: updatedPlayers[targetPlayerId].score - stolenPoints,
        };
        updatedPlayers[playerId] = {
          ...updatedPlayers[playerId],
          score: updatedPlayers[playerId].score + stolenPoints,
        };
      }
      break;

    case 'block_player':
      if (!targetPlayerId || !updatedPlayers[targetPlayerId]) return false;
      if (updatedPlayers[targetPlayerId].hasShield) {
        updatedPlayers[targetPlayerId] = {
          ...updatedPlayers[targetPlayerId],
          hasShield: false,
        };
      } else {
        updatedPlayers[targetPlayerId] = {
          ...updatedPlayers[targetPlayerId],
          isBlocked: true,
        };
      }
      break;

    case 'double_points':
      updatedPlayers[playerId] = {
        ...updatedPlayers[playerId],
        hasDoublePoints: true,
      };
      break;

    case 'shield':
      updatedPlayers[playerId] = {
        ...updatedPlayers[playerId],
        hasShield: true,
      };
      break;

    case 'time_freeze':
      updatedPlayers[playerId] = {
        ...updatedPlayers[playerId],
        hasTimeFreeze: true,
      };
      break;

    default:
      return false;
  }

  await updateGame(gameId, { players: updatedPlayers });
  return true;
}

// ============ GAME END ============

async function endGame(gameId: string): Promise<void> {
  const game = await getGame(gameId);
  if (!game) return;

  // Calculate rankings
  const playerList = Object.values(game.players);
  const sortedPlayers = [...playerList].sort((a, b) => b.score - a.score);

  const rankings: PlayerResult[] = sortedPlayers.map((player, index) => ({
    playerId: player.id,
    playerName: player.name,
    rank: index + 1,
    score: player.score,
    correctAnswers: 0, // Would need to track this separately
    totalAnswers: game.totalRounds,
    accuracy: 0,
    longestStreak: player.streak,
    powerUpsUsed: 0,
  }));

  const results: GameResults = {
    gameId: game.id,
    gameTitle: game.title,
    totalRounds: game.totalRounds,
    totalPlayers: playerList.length,
    rankings,
    endedAt: new Date().toISOString(),
  };

  // Save results
  await addDoc(collection(db, COLLECTIONS.GAME_RESULTS), results);

  // Update game status
  await updateGame(gameId, { status: 'finished' });
}

export async function getGameResults(gameId: string): Promise<GameResults | null> {
  const q = query(
    collection(db, COLLECTIONS.GAME_RESULTS),
    where('gameId', '==', gameId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as GameResults;
}
