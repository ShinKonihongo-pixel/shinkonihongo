// Golden Bell Game Hook - Manages all game state and logic
// Handles game creation, joining, gameplay, eliminations, and results

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type {
  GoldenBellGame,
  GoldenBellPlayer,
  GoldenBellQuestion,
  GoldenBellResults,
  GoldenBellPlayerResult,
  CreateGoldenBellData,
  GoldenBellSettings,
  QuestionDifficulty,
  QuestionCategory,
} from '../types/golden-bell';
import type { Flashcard } from '../types/flashcard';
import { generateBots } from '../types/game-hub';

// Bot auto-join settings
const BOT_FIRST_JOIN_DELAY = 15000; // 15 seconds - add 1 bot
const BOT_SECOND_JOIN_DELAY = 30000; // 30 seconds - add 2 more bots

// Generate random 6-digit code
function generateGameCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Convert flashcards to Golden Bell questions
function convertFlashcardsToQuestions(
  cards: Flashcard[],
  count: number,
  timeLimit: number,
  difficultyProgression: boolean
): GoldenBellQuestion[] {
  const shuffled = shuffleArray(cards).slice(0, count);

  return shuffled.map((card, index) => {
    // Determine difficulty based on progression or random
    let difficulty: QuestionDifficulty;
    if (difficultyProgression) {
      if (index < count * 0.4) difficulty = 'easy';
      else if (index < count * 0.7) difficulty = 'medium';
      else difficulty = 'hard';
    } else {
      const rand = Math.random();
      if (rand < 0.4) difficulty = 'easy';
      else if (rand < 0.75) difficulty = 'medium';
      else difficulty = 'hard';
    }

    // Determine category based on card content
    let category: QuestionCategory = 'vocabulary';
    if (card.kanji && card.kanji.length > 0) category = 'kanji';

    // Generate wrong options from other cards
    const otherCards = cards.filter(c => c.id !== card.id);
    const wrongOptions = shuffleArray(otherCards)
      .slice(0, 3)
      .map(c => c.meaning);

    const options = shuffleArray([card.meaning, ...wrongOptions]);
    const correctIndex = options.indexOf(card.meaning);

    return {
      id: generateId(),
      questionText: card.kanji || card.vocabulary,
      options,
      correctIndex,
      category,
      difficulty,
      timeLimit,
      explanation: card.sinoVietnamese ? `Hán Việt: ${card.sinoVietnamese}` : undefined,
    };
  });
}

// Hook props
interface UseGoldenBellProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
  };
  flashcards?: Flashcard[];
}

export function useGoldenBell({ currentUser, flashcards = [] }: UseGoldenBellProps) {
  // Game state
  const [game, setGame] = useState<GoldenBellGame | null>(null);
  const [gameResults, setGameResults] = useState<GoldenBellResults | null>(null);
  const [availableRooms] = useState<GoldenBellGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for timers
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  const botTimer2Ref = useRef<NodeJS.Timeout | null>(null);

  // Computed values
  const isHost = useMemo(() => game?.hostId === currentUser.id, [game, currentUser]);
  const currentPlayer = useMemo(() => game?.players[currentUser.id], [game, currentUser]);
  const currentQuestion = useMemo(() => {
    if (!game || game.currentQuestionIndex < 0) return null;
    return game.questions[game.currentQuestionIndex] || null;
  }, [game]);

  // Get sorted players by status and correct answers
  const sortedPlayers = useMemo(() => {
    if (!game) return [];
    return Object.values(game.players).sort((a, b) => {
      // Alive players first
      if (a.status === 'alive' && b.status !== 'alive') return -1;
      if (b.status === 'alive' && a.status !== 'alive') return 1;
      // Then by correct answers
      return b.correctAnswers - a.correctAnswers;
    });
  }, [game]);

  // Count alive players
  const aliveCount = useMemo(() => {
    if (!game) return 0;
    return Object.values(game.players).filter(p => p.status === 'alive').length;
  }, [game]);

  // Create new game
  const createGame = useCallback(async (data: CreateGoldenBellData) => {
    setLoading(true);
    setError(null);

    try {
      const questions = convertFlashcardsToQuestions(
        flashcards,
        data.questionCount,
        data.timePerQuestion,
        data.difficultyProgression
      );

      if (questions.length < 5) {
        throw new Error('Cần ít nhất 5 câu hỏi để bắt đầu trò chơi');
      }

      const settings: GoldenBellSettings = {
        maxPlayers: data.maxPlayers,
        minPlayers: 2,
        questionCount: data.questionCount,
        timePerQuestion: data.timePerQuestion,
        jlptLevel: data.jlptLevel,
        categories: data.categories,
        difficultyProgression: data.difficultyProgression,
        contentSource: data.contentSource,
        lessonId: data.lessonId,
      };

      const player: GoldenBellPlayer = {
        odinhId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        status: 'alive',
        correctAnswers: 0,
        totalAnswers: 0,
        streak: 0,
      };

      const newGame: GoldenBellGame = {
        id: generateId(),
        code: generateGameCode(),
        hostId: currentUser.id,
        title: data.title,
        settings,
        status: 'waiting',
        players: { [currentUser.id]: player },
        questions,
        currentQuestionIndex: -1,
        alivePlayers: 1,
        eliminatedThisRound: [],
        createdAt: new Date().toISOString(),
      };

      setGame(newGame);
      setGameResults(null);

      // Helper to add bots to the game
      const addBotsToGame = (botCount: number) => {
        setGame(prevGame => {
          if (!prevGame || prevGame.status !== 'waiting') return prevGame;

          const currentPlayerCount = Object.keys(prevGame.players).length;
          const maxPlayers = prevGame.settings.maxPlayers;
          const availableSlots = maxPlayers - currentPlayerCount;

          if (availableSlots <= 0) return prevGame;

          const actualBotCount = Math.min(botCount, availableSlots);
          const bots = generateBots(actualBotCount);
          const newPlayers: Record<string, GoldenBellPlayer> = { ...prevGame.players };

          bots.forEach((bot) => {
            const botId = `bot-${generateId()}`;
            newPlayers[botId] = {
              odinhId: botId,
              displayName: bot.name,
              avatar: bot.avatar,
              status: 'alive',
              correctAnswers: 0,
              totalAnswers: 0,
              streak: 0,
              isBot: true,
            };
          });

          return {
            ...prevGame,
            players: newPlayers,
            alivePlayers: Object.keys(newPlayers).length,
          };
        });
      };

      // Clear existing bot timers
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      if (botTimer2Ref.current) clearTimeout(botTimer2Ref.current);

      // First bot timer: 15 seconds - add 1 bot
      botTimerRef.current = setTimeout(() => addBotsToGame(1), BOT_FIRST_JOIN_DELAY);

      // Second bot timer: 30 seconds - add 2 more bots
      botTimer2Ref.current = setTimeout(() => addBotsToGame(2), BOT_SECOND_JOIN_DELAY);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo trò chơi');
    } finally {
      setLoading(false);
    }
  }, [currentUser, flashcards]);

  // Join existing game
  const joinGame = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      // In real implementation, this would fetch from server
      // For demo, we'll simulate joining
      const foundGame = availableRooms.find(r => r.code === code);

      if (!foundGame) {
        throw new Error('Không tìm thấy phòng với mã này');
      }

      if (foundGame.status !== 'waiting') {
        throw new Error('Trò chơi đã bắt đầu');
      }

      if (Object.keys(foundGame.players).length >= foundGame.settings.maxPlayers) {
        throw new Error('Phòng đã đầy');
      }

      const player: GoldenBellPlayer = {
        odinhId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        status: 'alive',
        correctAnswers: 0,
        totalAnswers: 0,
        streak: 0,
      };

      const updatedGame: GoldenBellGame = {
        ...foundGame,
        players: { ...foundGame.players, [currentUser.id]: player },
        alivePlayers: foundGame.alivePlayers + 1,
      };

      setGame(updatedGame);
      setGameResults(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tham gia phòng');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser, availableRooms]);

  // Leave game
  const leaveGame = useCallback(() => {
    if (!game) return;
    // Clear bot timers
    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current);
      botTimerRef.current = null;
    }
    if (botTimer2Ref.current) {
      clearTimeout(botTimer2Ref.current);
      botTimer2Ref.current = null;
    }
    // In a real implementation, this would update the server
    // For now, just clear the local game state
    setGame(null);
  }, [game]);

  // Start game (host only)
  const startGame = useCallback(() => {
    if (!game || !isHost) return;

    const playerCount = Object.keys(game.players).length;
    if (playerCount < game.settings.minPlayers) {
      setError(`Cần ít nhất ${game.settings.minPlayers} người để bắt đầu`);
      return;
    }

    // Clear bot timers - no more bots once game starts
    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current);
      botTimerRef.current = null;
    }
    if (botTimer2Ref.current) {
      clearTimeout(botTimer2Ref.current);
      botTimer2Ref.current = null;
    }

    setGame(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'starting',
        startedAt: new Date().toISOString(),
      };
    });

    // After countdown, start first question
    setTimeout(() => {
      setGame(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'question',
          currentQuestionIndex: 0,
        };
      });

      // Auto-transition to answering after showing question
      setTimeout(() => {
        setGame(prev => {
          if (!prev) return null;
          return {
            ...prev,
            status: 'answering',
            questionStartTime: Date.now(),
          };
        });
      }, 2000);
    }, 3000);
  }, [game, isHost]);

  // Submit answer
  const submitAnswer = useCallback((answerIndex: number) => {
    if (!game || !currentQuestion || game.status !== 'answering') return;
    if (!currentPlayer || currentPlayer.status !== 'alive') return;

    const answerTime = Date.now() - (game.questionStartTime || Date.now());
    const isCorrect = answerIndex === currentQuestion.correctIndex;

    setGame(prev => {
      if (!prev) return null;
      const player = prev.players[currentUser.id];
      if (!player) return prev;

      const newStreak = isCorrect ? player.streak + 1 : 0;

      return {
        ...prev,
        players: {
          ...prev.players,
          [currentUser.id]: {
            ...player,
            currentAnswer: answerIndex,
            answerTime,
            totalAnswers: player.totalAnswers + 1,
            correctAnswers: isCorrect ? player.correctAnswers + 1 : player.correctAnswers,
            streak: newStreak,
          },
        },
      };
    });
  }, [game, currentQuestion, currentPlayer, currentUser]);

  // Reveal answer and eliminate wrong players (host only)
  const revealAnswer = useCallback(() => {
    if (!game || !isHost || game.status !== 'answering') return;

    const correctIndex = currentQuestion?.correctIndex;
    const eliminated: string[] = [];

    // Find players who answered wrong or didn't answer
    Object.values(game.players).forEach(player => {
      if (player.status === 'alive') {
        const answeredWrong = player.currentAnswer !== correctIndex;
        const didNotAnswer = player.currentAnswer === undefined;

        if (answeredWrong || didNotAnswer) {
          eliminated.push(player.odinhId);
        }
      }
    });

    setGame(prev => {
      if (!prev) return null;

      const updatedPlayers = { ...prev.players };
      eliminated.forEach(id => {
        if (updatedPlayers[id]) {
          updatedPlayers[id] = {
            ...updatedPlayers[id],
            status: 'eliminated',
            eliminatedAt: prev.currentQuestionIndex + 1,
          };
        }
      });

      const newAliveCount = Object.values(updatedPlayers).filter(p => p.status === 'alive').length;

      return {
        ...prev,
        status: 'revealing',
        players: updatedPlayers,
        alivePlayers: newAliveCount,
        eliminatedThisRound: eliminated,
      };
    });
  }, [game, isHost, currentQuestion]);

  // Move to next question or end game (host only)
  const nextQuestion = useCallback(() => {
    if (!game || !isHost || game.status !== 'revealing') return;

    const alivePlayersCount = Object.values(game.players).filter(p => p.status === 'alive').length;
    const isLastQuestion = game.currentQuestionIndex >= game.questions.length - 1;

    // End game if only 1 player left or no more questions
    if (alivePlayersCount <= 1 || isLastQuestion) {
      // Generate results
      const rankings = generateResults(game);

      setGame(prev => {
        if (!prev) return null;

        // Mark winner if there's exactly one alive
        const updatedPlayers = { ...prev.players };
        const alivePlayers = Object.values(updatedPlayers).filter(p => p.status === 'alive');
        if (alivePlayers.length === 1) {
          updatedPlayers[alivePlayers[0].odinhId] = {
            ...alivePlayers[0],
            status: 'winner',
          };
        }

        return {
          ...prev,
          status: 'finished',
          finishedAt: new Date().toISOString(),
          players: updatedPlayers,
        };
      });

      setGameResults({
        gameId: game.id,
        winner: rankings[0]?.isWinner ? rankings[0] : null,
        rankings,
        totalQuestions: game.currentQuestionIndex + 1,
        totalPlayers: Object.keys(game.players).length,
      });

      return;
    }

    // Move to next question
    setGame(prev => {
      if (!prev) return null;

      // Reset player answers for next round
      const resetPlayers = { ...prev.players };
      Object.keys(resetPlayers).forEach(id => {
        resetPlayers[id] = {
          ...resetPlayers[id],
          currentAnswer: undefined,
          answerTime: undefined,
        };
      });

      return {
        ...prev,
        status: 'question',
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        players: resetPlayers,
        eliminatedThisRound: [],
      };
    });

    // Auto-transition to answering
    setTimeout(() => {
      setGame(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'answering',
          questionStartTime: Date.now(),
        };
      });
    }, 2000);
  }, [game, isHost]);

  // Generate final results
  const generateResults = (game: GoldenBellGame): GoldenBellPlayerResult[] => {
    const players = Object.values(game.players);

    // Sort by: alive status, then by eliminatedAt (later = better), then by correctAnswers
    const sorted = players.sort((a, b) => {
      // Winners/alive first
      if (a.status === 'winner' || a.status === 'alive') return -1;
      if (b.status === 'winner' || b.status === 'alive') return 1;

      // Then by when they were eliminated (later is better)
      const aElim = a.eliminatedAt || 0;
      const bElim = b.eliminatedAt || 0;
      if (aElim !== bElim) return bElim - aElim;

      // Then by correct answers
      return b.correctAnswers - a.correctAnswers;
    });

    return sorted.map((player, index) => ({
      odinhId: player.odinhId,
      displayName: player.displayName,
      avatar: player.avatar,
      rank: index + 1,
      correctAnswers: player.correctAnswers,
      accuracy: player.totalAnswers > 0
        ? Math.round((player.correctAnswers / player.totalAnswers) * 100)
        : 0,
      survivedRounds: player.eliminatedAt
        ? player.eliminatedAt
        : game.currentQuestionIndex + 1,
      longestStreak: player.streak,
      isWinner: player.status === 'winner' || (player.status === 'alive' && index === 0),
    }));
  };

  // Reset game
  const resetGame = useCallback(() => {
    setGame(null);
    setGameResults(null);
    setError(null);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      if (botTimer2Ref.current) clearTimeout(botTimer2Ref.current);
    };
  }, []);

  return {
    // State
    game,
    gameResults,
    availableRooms,
    loading,
    error,

    // Computed
    isHost,
    currentPlayer,
    currentQuestion,
    sortedPlayers,
    aliveCount,

    // Actions
    createGame,
    joinGame,
    leaveGame,
    startGame,
    submitAnswer,
    revealAnswer,
    nextQuestion,
    resetGame,
    setError,
  };
}
