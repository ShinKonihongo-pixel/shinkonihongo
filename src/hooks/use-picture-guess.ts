// Picture Guessing Game Hook - Manages all game state and logic
// Handles game creation, joining, gameplay, hints, scoring, and results

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type {
  PictureGuessGame,
  PictureGuessPlayer,
  PicturePuzzle,
  PictureGuessResults,
  PictureGuessPlayerResult,
  CreatePictureGuessData,
  PictureGuessSettings,
  HintType,
} from '../types/picture-guess';
import { HINTS, generateEmojiHint } from '../types/picture-guess';
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

// Convert flashcards to picture puzzles
function convertFlashcardsToPuzzles(
  cards: Flashcard[],
  count: number,
  timePerPuzzle: number
): PicturePuzzle[] {
  const shuffled = shuffleArray(cards).slice(0, count);

  return shuffled.map((card) => {
    // Determine difficulty based on word complexity
    let difficulty: 'easy' | 'medium' | 'hard';
    const wordLength = (card.kanji || card.vocabulary).length;
    if (wordLength <= 2) difficulty = 'easy';
    else if (wordLength <= 4) difficulty = 'medium';
    else difficulty = 'hard';

    // Calculate points based on difficulty
    const points = difficulty === 'easy' ? 100 : difficulty === 'medium' ? 150 : 200;

    // Generate emoji hint based on meaning
    const emojis = generateEmojiHint(card.meaning);

    return {
      id: generateId(),
      imageEmojis: emojis,
      word: card.kanji || card.vocabulary,
      reading: card.vocabulary, // vocabulary is the reading (Hiragana)
      meaning: card.meaning,
      sinoVietnamese: card.sinoVietnamese,
      examples: card.examples && card.examples.length > 0 ? card.examples : undefined,
      difficulty,
      timeLimit: timePerPuzzle,
      points,
      hintsUsed: [],
    };
  });
}

// Hook props
interface UsePictureGuessProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
  };
  flashcards?: Flashcard[];
}

export function usePictureGuess({ currentUser, flashcards = [] }: UsePictureGuessProps) {
  // Game state
  const [game, setGame] = useState<PictureGuessGame | null>(null);
  const [gameResults, setGameResults] = useState<PictureGuessResults | null>(null);
  const [availableRooms] = useState<PictureGuessGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for timers
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  const botTimer2Ref = useRef<NodeJS.Timeout | null>(null);

  // Computed values
  const isHost = useMemo(() => game?.hostId === currentUser.id, [game, currentUser]);
  const currentPlayer = useMemo(() => game?.players[currentUser.id], [game, currentUser]);
  const currentPuzzle = useMemo(() => {
    if (!game || game.currentPuzzleIndex < 0) return null;
    return game.puzzles[game.currentPuzzleIndex] || null;
  }, [game]);

  // Get sorted players by score
  const sortedPlayers = useMemo(() => {
    if (!game) return [];
    return Object.values(game.players).sort((a, b) => b.score - a.score);
  }, [game]);

  // Create new game
  const createGame = useCallback(async (data: CreatePictureGuessData) => {
    setLoading(true);
    setError(null);

    try {
      const puzzles = convertFlashcardsToPuzzles(
        flashcards,
        data.puzzleCount,
        data.timePerPuzzle
      );

      if (puzzles.length < 3) {
        throw new Error('Cần ít nhất 3 từ vựng để bắt đầu trò chơi');
      }

      const settings: PictureGuessSettings = {
        mode: data.mode,
        maxPlayers: data.maxPlayers,
        puzzleCount: data.puzzleCount,
        timePerPuzzle: data.timePerPuzzle,
        jlptLevel: data.jlptLevel,
        allowHints: data.allowHints,
        speedBonus: data.speedBonus,
        penaltyWrongAnswer: data.penaltyWrongAnswer,
        contentSource: data.contentSource,
        lessonId: data.lessonId,
      };

      const player: PictureGuessPlayer = {
        odinhId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        score: 0,
        correctGuesses: 0,
        totalGuesses: 0,
        streak: 0,
        hintsUsed: 0,
        status: 'playing',
      };

      const newGame: PictureGuessGame = {
        id: generateId(),
        code: generateGameCode(),
        hostId: currentUser.id,
        title: data.title,
        settings,
        status: 'waiting',
        players: { [currentUser.id]: player },
        puzzles,
        currentPuzzleIndex: -1,
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
          const newPlayers: Record<string, PictureGuessPlayer> = { ...prevGame.players };

          bots.forEach((bot) => {
            const botId = `bot-${generateId()}`;
            newPlayers[botId] = {
              odinhId: botId,
              displayName: bot.name,
              avatar: bot.avatar,
              score: 0,
              correctGuesses: 0,
              totalGuesses: 0,
              streak: 0,
              hintsUsed: 0,
              status: 'playing',
              isBot: true,
            };
          });

          return { ...prevGame, players: newPlayers };
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

      const player: PictureGuessPlayer = {
        odinhId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        score: 0,
        correctGuesses: 0,
        totalGuesses: 0,
        streak: 0,
        hintsUsed: 0,
        status: 'playing',
      };

      const updatedGame: PictureGuessGame = {
        ...foundGame,
        players: { ...foundGame.players, [currentUser.id]: player },
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
    setGame(null);
  }, [game]);

  // Start game (host only or single player)
  const startGame = useCallback(() => {
    if (!game) return;
    if (game.settings.mode === 'multiplayer' && !isHost) return;

    const playerCount = Object.keys(game.players).length;
    if (game.settings.mode === 'multiplayer' && playerCount < 2) {
      setError('Cần ít nhất 2 người để bắt đầu chế độ nhiều người');
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

    // After countdown, start first puzzle
    setTimeout(() => {
      setGame(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'showing',
          currentPuzzleIndex: 0,
        };
      });

      // Auto-transition to guessing after showing image
      setTimeout(() => {
        setGame(prev => {
          if (!prev) return null;
          return {
            ...prev,
            status: 'guessing',
            puzzleStartTime: Date.now(),
          };
        });
      }, 2000);
    }, 3000);
  }, [game, isHost]);

  // Use hint
  const useHint = useCallback((hintType: HintType) => {
    if (!game || !currentPuzzle || game.status !== 'guessing') return;
    if (!currentPlayer) return;
    if (currentPuzzle.hintsUsed.includes(hintType)) return;

    const hintCost = HINTS[hintType].cost;

    setGame(prev => {
      if (!prev) return null;
      const puzzle = prev.puzzles[prev.currentPuzzleIndex];
      if (!puzzle) return prev;

      const updatedPuzzles = [...prev.puzzles];
      updatedPuzzles[prev.currentPuzzleIndex] = {
        ...puzzle,
        hintsUsed: [...puzzle.hintsUsed, hintType],
      };

      const player = prev.players[currentUser.id];
      if (!player) return prev;

      return {
        ...prev,
        puzzles: updatedPuzzles,
        players: {
          ...prev.players,
          [currentUser.id]: {
            ...player,
            hintsUsed: player.hintsUsed + 1,
            score: Math.max(0, player.score - hintCost),
          },
        },
      };
    });
  }, [game, currentPuzzle, currentPlayer, currentUser]);

  // Get hint content
  const getHintContent = useCallback((hintType: HintType): string => {
    if (!currentPuzzle) return '';

    switch (hintType) {
      case 'first_letter':
        return currentPuzzle.word.charAt(0);
      case 'word_length':
        return `${currentPuzzle.word.length} ký tự`;
      case 'meaning_hint':
        return currentPuzzle.meaning.substring(0, Math.ceil(currentPuzzle.meaning.length / 2)) + '...';
      case 'sino_vietnamese':
        return currentPuzzle.sinoVietnamese || 'Không có Hán Việt';
      default:
        return '';
    }
  }, [currentPuzzle]);

  // Submit guess
  const submitGuess = useCallback((guess: string) => {
    if (!game || !currentPuzzle || game.status !== 'guessing') return;
    if (!currentPlayer || currentPlayer.status !== 'playing') return;

    const normalizedGuess = guess.trim().toLowerCase();
    const normalizedWord = currentPuzzle.word.toLowerCase();
    const normalizedReading = currentPuzzle.reading?.toLowerCase() || '';

    const isCorrect = normalizedGuess === normalizedWord || normalizedGuess === normalizedReading;
    const guessTime = Date.now() - (game.puzzleStartTime || Date.now());

    // Calculate score
    let earnedPoints = 0;
    if (isCorrect) {
      earnedPoints = currentPuzzle.points;

      // Speed bonus: faster answers get more points
      if (game.settings.speedBonus) {
        const timeRatio = 1 - (guessTime / (currentPuzzle.timeLimit * 1000));
        const speedBonus = Math.floor(earnedPoints * 0.5 * timeRatio);
        earnedPoints += Math.max(0, speedBonus);
      }

      // Streak bonus
      const streakBonus = Math.min(currentPlayer.streak * 10, 50);
      earnedPoints += streakBonus;
    } else if (game.settings.penaltyWrongAnswer) {
      earnedPoints = -10;
    }

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
            currentGuess: guess,
            guessTime,
            totalGuesses: player.totalGuesses + 1,
            correctGuesses: isCorrect ? player.correctGuesses + 1 : player.correctGuesses,
            score: Math.max(0, player.score + earnedPoints),
            streak: newStreak,
            status: isCorrect ? 'guessed' : 'playing',
          },
        },
      };
    });

    return isCorrect;
  }, [game, currentPuzzle, currentPlayer, currentUser]);

  // Reveal answer (for single player or host control)
  const revealAnswer = useCallback(() => {
    if (!game || game.status !== 'guessing') return;

    setGame(prev => {
      if (!prev) return null;

      // Reset player status for next round
      const updatedPlayers = { ...prev.players };
      Object.keys(updatedPlayers).forEach(id => {
        updatedPlayers[id] = {
          ...updatedPlayers[id],
          status: updatedPlayers[id].status === 'guessed' ? 'guessed' : 'timeout',
        };
      });

      return {
        ...prev,
        status: 'revealed',
        players: updatedPlayers,
      };
    });
  }, [game]);

  // Next puzzle or finish game
  const nextPuzzle = useCallback(() => {
    if (!game || game.status !== 'revealed') return;

    const isLastPuzzle = game.currentPuzzleIndex >= game.puzzles.length - 1;

    if (isLastPuzzle) {
      // Generate results
      const rankings = generateResults(game);

      setGame(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'finished',
          finishedAt: new Date().toISOString(),
        };
      });

      setGameResults({
        gameId: game.id,
        mode: game.settings.mode,
        rankings,
        totalPuzzles: game.puzzles.length,
        wordsLearned: game.puzzles,
      });

      return;
    }

    // Move to next puzzle
    setGame(prev => {
      if (!prev) return null;

      // Reset player status for next round
      const resetPlayers = { ...prev.players };
      Object.keys(resetPlayers).forEach(id => {
        resetPlayers[id] = {
          ...resetPlayers[id],
          currentGuess: undefined,
          guessTime: undefined,
          status: 'playing',
        };
      });

      return {
        ...prev,
        status: 'showing',
        currentPuzzleIndex: prev.currentPuzzleIndex + 1,
        players: resetPlayers,
      };
    });

    // Auto-transition to guessing
    setTimeout(() => {
      setGame(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'guessing',
          puzzleStartTime: Date.now(),
        };
      });
    }, 2000);
  }, [game]);

  // Generate final results
  const generateResults = (game: PictureGuessGame): PictureGuessPlayerResult[] => {
    const players = Object.values(game.players);

    // Sort by score
    const sorted = players.sort((a, b) => b.score - a.score);

    return sorted.map((player, index) => ({
      odinhId: player.odinhId,
      displayName: player.displayName,
      avatar: player.avatar,
      rank: index + 1,
      score: player.score,
      correctGuesses: player.correctGuesses,
      accuracy: player.totalGuesses > 0
        ? Math.round((player.correctGuesses / player.totalGuesses) * 100)
        : 0,
      averageTime: player.totalGuesses > 0 && player.guessTime
        ? Math.round(player.guessTime / player.totalGuesses)
        : 0,
      longestStreak: player.streak,
      hintsUsed: player.hintsUsed,
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
    currentPuzzle,
    sortedPlayers,

    // Actions
    createGame,
    joinGame,
    leaveGame,
    startGame,
    useHint,
    getHintContent,
    submitGuess,
    revealAnswer,
    nextPuzzle,
    resetGame,
    setError,
  };
}
