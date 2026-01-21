// Speed Quiz Hook - "Ai Nhanh Hơn Ai" game logic
// Manages game state, rounds, scoring, and skills

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type {
  SpeedQuizGame,
  SpeedQuizPlayer,
  SpeedQuizQuestion,
  SpeedQuizResults,
  SpeedQuizPlayerResult,
  SpeedQuizRoundResult,
  CreateSpeedQuizData,
  SpeedQuizSettings,
  SpeedQuizSkillType,
} from '../types/speed-quiz';
import {
  DEFAULT_SPEED_QUIZ_SETTINGS,
  generateHints,
} from '../types/speed-quiz';
import type { Flashcard } from '../types/flashcard';
import { generateBots } from '../types/game-hub';

// Generate IDs
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function generateGameCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

// Convert flashcards to quiz questions
function convertFlashcardsToQuestions(
  cards: Flashcard[],
  count: number,
  timeLimit: number
): SpeedQuizQuestion[] {
  const shuffled = shuffleArray(cards).slice(0, count);

  return shuffled.map(card => {
    const display = card.kanji || card.vocabulary;
    const answer = card.meaning;

    return {
      id: generateId(),
      display,
      answer,
      hints: generateHints(answer),
      points: 100,
      penalty: 30,
      timeLimit,
      category: card.kanji ? 'kanji' : 'vocabulary',
    };
  });
}

// Hook props
interface UseSpeedQuizProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  flashcards?: Flashcard[];
}

export function useSpeedQuiz({ currentUser, flashcards = [] }: UseSpeedQuizProps) {
  // Game state
  const [game, setGame] = useState<SpeedQuizGame | null>(null);
  const [gameResults, setGameResults] = useState<SpeedQuizResults | null>(null);
  const [availableRooms] = useState<SpeedQuizGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timers
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const botAnswerTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Computed
  const isHost = useMemo(() => game?.hostId === currentUser.id, [game, currentUser]);
  const currentPlayer = useMemo(() => game?.players[currentUser.id], [game, currentUser]);

  const sortedPlayers = useMemo(() => {
    if (!game) return [];
    return Object.values(game.players).sort((a, b) => b.score - a.score);
  }, [game]);

  const isSkillPhase = useMemo(() => {
    if (!game || !game.settings.skillsEnabled) return false;
    return game.currentRound > 0 && game.currentRound % game.settings.skillInterval === 0;
  }, [game]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
      if (botAnswerTimerRef.current) clearTimeout(botAnswerTimerRef.current);
    };
  }, []);

  // Create game
  const createGame = useCallback(async (data: CreateSpeedQuizData) => {
    setLoading(true);
    setError(null);

    try {
      const questions = convertFlashcardsToQuestions(
        flashcards,
        data.totalRounds,
        data.timePerQuestion
      );

      if (questions.length < 5) {
        throw new Error('Cần ít nhất 5 flashcard để chơi');
      }

      const settings: SpeedQuizSettings = {
        ...DEFAULT_SPEED_QUIZ_SETTINGS,
        totalRounds: data.totalRounds,
        timePerQuestion: data.timePerQuestion,
        maxPlayers: data.maxPlayers,
        skillsEnabled: data.skillsEnabled,
      };

      const player: SpeedQuizPlayer = {
        odinhId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        role: currentUser.role,
        score: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        hintsUsed: 0,
        hintsRemaining: settings.hintsPerPlayer,
        hasAnswered: false,
        hasShield: false,
        shieldTurns: 0,
        hasDoublePoints: false,
        doublePointsTurns: 0,
        isSlowed: false,
        slowedTurns: 0,
        streak: 0,
      };

      const newGame: SpeedQuizGame = {
        id: generateId(),
        code: generateGameCode(),
        hostId: currentUser.id,
        title: data.title,
        settings,
        status: 'waiting',
        players: { [currentUser.id]: player },
        questions,
        currentRound: 0,
        currentQuestion: null,
        roundResults: [],
        createdAt: new Date().toISOString(),
      };

      setGame(newGame);
      setGameResults(null);

      // Add bots after delay
      const addBots = (count: number) => {
        setGame(prev => {
          if (!prev || prev.status !== 'waiting') return prev;

          const currentCount = Object.keys(prev.players).length;
          const available = prev.settings.maxPlayers - currentCount;
          if (available <= 0) return prev;

          const actualCount = Math.min(count, available);
          const bots = generateBots(actualCount);
          const newPlayers = { ...prev.players };

          bots.forEach(bot => {
            const botId = `bot-${generateId()}`;
            newPlayers[botId] = {
              odinhId: botId,
              displayName: bot.name,
              avatar: bot.avatar,
              score: 0,
              correctAnswers: 0,
              wrongAnswers: 0,
              hintsUsed: 0,
              hintsRemaining: prev.settings.hintsPerPlayer,
              hasAnswered: false,
              hasShield: false,
              shieldTurns: 0,
              hasDoublePoints: false,
              doublePointsTurns: 0,
              isSlowed: false,
              slowedTurns: 0,
              streak: 0,
              isBot: true,
            };
          });

          return { ...prev, players: newPlayers };
        });
      };

      botTimerRef.current = setTimeout(() => addBots(2), 8000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo game');
    } finally {
      setLoading(false);
    }
  }, [currentUser, flashcards]);

  // Join game
  const joinGame = useCallback(async (_code: string) => {
    setLoading(true);
    setError(null);
    try {
      throw new Error('Chức năng tham gia phòng đang phát triển');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tham gia');
    } finally {
      setLoading(false);
    }
  }, []);

  // Leave game
  const leaveGame = useCallback(() => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    if (botAnswerTimerRef.current) clearTimeout(botAnswerTimerRef.current);
    setGame(null);
    setGameResults(null);
  }, []);

  // Start game
  const startGame = useCallback(async () => {
    if (!game || !isHost) return;

    const playerCount = Object.keys(game.players).length;
    if (playerCount < game.settings.minPlayers) {
      setError(`Cần ít nhất ${game.settings.minPlayers} người chơi`);
      return;
    }

    if (botTimerRef.current) clearTimeout(botTimerRef.current);

    setGame(prev => prev ? { ...prev, status: 'starting', startedAt: new Date().toISOString() } : null);

    // Start first round after countdown
    setTimeout(() => {
      startNextRound();
    }, 3000);
  }, [game, isHost]);

  // Start next round
  const startNextRound = useCallback(() => {
    setGame(prev => {
      if (!prev) return null;

      const nextRound = prev.currentRound + 1;
      if (nextRound > prev.questions.length) {
        // Game finished
        return { ...prev, status: 'finished', finishedAt: new Date().toISOString() };
      }

      const question = prev.questions[nextRound - 1];

      // Reset player states for new round
      const newPlayers: Record<string, SpeedQuizPlayer> = {};
      Object.entries(prev.players).forEach(([id, p]) => {
        // Decrease effect turns
        let shield = p.hasShield;
        let shieldTurns = p.shieldTurns;
        if (shieldTurns > 0) {
          shieldTurns--;
          if (shieldTurns === 0) shield = false;
        }

        let double = p.hasDoublePoints;
        let doubleTurns = p.doublePointsTurns;
        if (doubleTurns > 0) {
          doubleTurns--;
          if (doubleTurns === 0) double = false;
        }

        let slowed = p.isSlowed;
        let slowedTurns = p.slowedTurns;
        if (slowedTurns > 0) {
          slowedTurns--;
          if (slowedTurns === 0) slowed = false;
        }

        newPlayers[id] = {
          ...p,
          hasAnswered: false,
          currentAnswer: undefined,
          answerTime: undefined,
          isCorrect: undefined,
          hasShield: shield,
          shieldTurns,
          hasDoublePoints: double,
          doublePointsTurns: doubleTurns,
          isSlowed: slowed,
          slowedTurns,
        };
      });

      return {
        ...prev,
        status: 'playing',
        currentRound: nextRound,
        currentQuestion: question,
        roundStartTime: Date.now(),
        players: newPlayers,
      };
    });

    // Set round timer
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    roundTimerRef.current = setTimeout(() => {
      endRound();
    }, (game?.settings.timePerQuestion || 10) * 1000 + 500);

    // Bot auto-answer
    scheduleBotAnswers();
  }, [game]);

  // Schedule bot answers
  const scheduleBotAnswers = useCallback(() => {
    if (!game) return;

    const bots = Object.values(game.players).filter(p => p.isBot);
    bots.forEach(bot => {
      const delay = (bot.isSlowed ? 4000 : 2000) + Math.random() * 4000;
      const accuracy = 0.65 + Math.random() * 0.25; // 65-90% accuracy

      setTimeout(() => {
        setGame(prev => {
          if (!prev || prev.status !== 'playing') return prev;
          if (prev.players[bot.odinhId]?.hasAnswered) return prev;

          const isCorrect = Math.random() < accuracy;
          const answer = isCorrect
            ? prev.currentQuestion?.answer || ''
            : 'wrong answer';

          const newPlayers = { ...prev.players };
          newPlayers[bot.odinhId] = {
            ...newPlayers[bot.odinhId],
            hasAnswered: true,
            currentAnswer: answer,
            answerTime: Date.now() - (prev.roundStartTime || 0),
            isCorrect,
          };

          return { ...prev, players: newPlayers };
        });
      }, delay);
    });
  }, [game]);

  // Submit answer
  const submitAnswer = useCallback((answer: string) => {
    if (!game || !currentPlayer || game.status !== 'playing') return;
    if (currentPlayer.hasAnswered) return;

    const isCorrect = answer.toLowerCase().trim() === game.currentQuestion?.answer.toLowerCase().trim();
    const answerTime = Date.now() - (game.roundStartTime || 0);

    setGame(prev => {
      if (!prev) return null;

      const newPlayers = { ...prev.players };
      newPlayers[currentUser.id] = {
        ...newPlayers[currentUser.id],
        hasAnswered: true,
        currentAnswer: answer,
        answerTime,
        isCorrect,
      };

      // Check if all players answered
      const allAnswered = Object.values(newPlayers).every(p => p.hasAnswered);

      return {
        ...prev,
        players: newPlayers,
        status: allAnswered ? 'result' : 'playing',
      };
    });
  }, [game, currentPlayer, currentUser]);

  // Use hint
  const useHint = useCallback(() => {
    if (!game || !currentPlayer) return;
    if (currentPlayer.hintsRemaining <= 0) return;
    if (currentPlayer.hasAnswered) return;

    setGame(prev => {
      if (!prev) return null;

      const newPlayers = { ...prev.players };
      const player = newPlayers[currentUser.id];
      newPlayers[currentUser.id] = {
        ...player,
        hintsUsed: player.hintsUsed + 1,
        hintsRemaining: player.hintsRemaining - 1,
      };

      return { ...prev, players: newPlayers };
    });

    return game.currentQuestion?.hints[currentPlayer.hintsUsed] || null;
  }, [game, currentPlayer, currentUser]);

  // End round
  const endRound = useCallback(() => {
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);

    setGame(prev => {
      if (!prev || prev.status === 'result' || prev.status === 'finished') return prev;

      // Calculate scores
      const newPlayers: Record<string, SpeedQuizPlayer> = {};
      const roundResult: SpeedQuizRoundResult = {
        questionId: prev.currentQuestion?.id || '',
        correctAnswer: prev.currentQuestion?.answer || '',
        playerResults: [],
      };

      let fastestTime = Infinity;
      let fastestPlayer: string | undefined;

      Object.entries(prev.players).forEach(([id, player]) => {
        let pointsEarned = 0;

        if (player.isCorrect) {
          pointsEarned = prev.settings.pointsCorrect;
          if (player.hasDoublePoints) pointsEarned *= 2;

          // Fastest bonus
          if (player.answerTime && player.answerTime < fastestTime) {
            fastestTime = player.answerTime;
            fastestPlayer = id;
          }
        } else if (player.hasAnswered && !player.isCorrect) {
          if (!player.hasShield) {
            pointsEarned = -prev.settings.pointsPenalty;
          }
        }

        const newScore = Math.max(0, player.score + pointsEarned);
        const newStreak = player.isCorrect ? player.streak + 1 : 0;

        newPlayers[id] = {
          ...player,
          score: newScore,
          correctAnswers: player.correctAnswers + (player.isCorrect ? 1 : 0),
          wrongAnswers: player.wrongAnswers + (!player.isCorrect && player.hasAnswered ? 1 : 0),
          streak: newStreak,
        };

        roundResult.playerResults.push({
          odinhId: id,
          answer: player.currentAnswer || '',
          isCorrect: !!player.isCorrect,
          timeMs: player.answerTime || 0,
          pointsEarned,
        });
      });

      // Fastest bonus
      if (fastestPlayer && newPlayers[fastestPlayer]) {
        newPlayers[fastestPlayer].score += 20;
        const result = roundResult.playerResults.find(r => r.odinhId === fastestPlayer);
        if (result) result.pointsEarned += 20;
      }
      roundResult.fastestPlayer = fastestPlayer;

      // Check for skill phase or continue
      const nextRound = prev.currentRound + 1;
      const isGameEnd = nextRound > prev.questions.length;
      const isSkill = prev.settings.skillsEnabled &&
        prev.currentRound % prev.settings.skillInterval === 0 &&
        !isGameEnd;

      return {
        ...prev,
        status: isGameEnd ? 'finished' : (isSkill ? 'skill_phase' : 'result'),
        players: newPlayers,
        roundResults: [...prev.roundResults, roundResult],
        finishedAt: isGameEnd ? new Date().toISOString() : undefined,
      };
    });
  }, []);

  // Continue to next round (after result screen)
  const continueGame = useCallback(() => {
    if (!game || !isHost) return;

    if (game.status === 'finished') {
      // Generate results
      const rankings: SpeedQuizPlayerResult[] = sortedPlayers.map((p, idx) => ({
        odinhId: p.odinhId,
        displayName: p.displayName,
        avatar: p.avatar,
        rank: idx + 1,
        score: p.score,
        correctAnswers: p.correctAnswers,
        accuracy: p.correctAnswers + p.wrongAnswers > 0
          ? Math.round((p.correctAnswers / (p.correctAnswers + p.wrongAnswers)) * 100)
          : 0,
        avgResponseTime: 0,
        isWinner: idx === 0,
      }));

      setGameResults({
        gameId: game.id,
        winner: rankings[0] || null,
        rankings,
        totalRounds: game.currentRound,
        totalPlayers: Object.keys(game.players).length,
      });
    } else {
      startNextRound();
    }
  }, [game, isHost, sortedPlayers, startNextRound]);

  // Use skill
  const useSkill = useCallback((skillType: SpeedQuizSkillType, targetId?: string) => {
    if (!game || !currentPlayer) return;

    setGame(prev => {
      if (!prev) return null;

      const newPlayers = { ...prev.players };
      const player = newPlayers[currentUser.id];

      switch (skillType) {
        case 'double_points':
          newPlayers[currentUser.id] = {
            ...player,
            hasDoublePoints: true,
            doublePointsTurns: 2,
          };
          break;

        case 'steal_points':
          if (targetId && newPlayers[targetId]) {
            const stolen = Math.min(50, newPlayers[targetId].score);
            newPlayers[targetId].score -= stolen;
            newPlayers[currentUser.id].score += stolen;
          }
          break;

        case 'shield':
          newPlayers[currentUser.id] = {
            ...player,
            hasShield: true,
            shieldTurns: 2,
          };
          break;

        case 'extra_hint':
          newPlayers[currentUser.id] = {
            ...player,
            hintsRemaining: player.hintsRemaining + 2,
          };
          break;

        case 'slow_others':
          Object.keys(newPlayers).forEach(id => {
            if (id !== currentUser.id) {
              newPlayers[id] = {
                ...newPlayers[id],
                isSlowed: true,
                slowedTurns: 1,
              };
            }
          });
          break;

        case 'reveal_first':
          // Will be handled in UI
          break;
      }

      return { ...prev, players: newPlayers, status: 'result' };
    });
  }, [game, currentPlayer, currentUser]);

  // Skip skill
  const skipSkill = useCallback(() => {
    setGame(prev => prev ? { ...prev, status: 'result' } : null);
  }, []);

  // Reset
  const resetGame = useCallback(() => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    if (botAnswerTimerRef.current) clearTimeout(botAnswerTimerRef.current);
    setGame(null);
    setGameResults(null);
  }, []);

  // Auto-end round when time's up or all answered
  useEffect(() => {
    if (!game || game.status !== 'playing') return;

    const allAnswered = Object.values(game.players).every(p => p.hasAnswered);
    if (allAnswered) {
      setTimeout(() => endRound(), 500);
    }
  }, [game, endRound]);

  return {
    game,
    gameResults,
    availableRooms,
    loading,
    error,
    isHost,
    currentPlayer,
    sortedPlayers,
    isSkillPhase,
    createGame,
    joinGame,
    leaveGame,
    startGame,
    submitAnswer,
    useHint,
    continueGame,
    useSkill,
    skipSkill,
    resetGame,
    setError,
  };
}
