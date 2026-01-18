// Word Match Hook - "Nối Từ Thách Đấu" game logic
// Manages game state, rounds, matching, and special effects

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type {
  WordMatchGame,
  WordMatchPlayer,
  WordMatchRound,
  WordMatchResults,
  WordMatchPlayerResult,
  WordMatchRoundResult,
  CreateWordMatchData,
  WordMatchSettings,
  WordMatchEffectType,
  WordPair,
} from '../types/word-match';
import { DEFAULT_WORD_MATCH_SETTINGS } from '../types/word-match';
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

// Generate rounds from flashcards
function generateRounds(
  flashcards: Flashcard[],
  totalRounds: number,
  pairsPerRound: number,
  specialInterval: number,
  timePerRound: number
): WordMatchRound[] {
  const rounds: WordMatchRound[] = [];
  const shuffled = shuffleArray(flashcards);
  let cardIndex = 0;

  for (let i = 0; i < totalRounds; i++) {
    const isSpecial = (i + 1) % specialInterval === 0;
    const pairs: WordPair[] = [];

    for (let j = 0; j < pairsPerRound; j++) {
      if (cardIndex >= shuffled.length) {
        cardIndex = 0; // Recycle cards if needed
      }
      const card = shuffled[cardIndex++];
      pairs.push({
        id: generateId(),
        left: card.kanji || card.vocabulary,
        right: card.meaning,
        difficulty: 'medium',
      });
    }

    rounds.push({
      id: generateId(),
      pairs,
      isSpecial,
      timeLimit: timePerRound,
    });
  }

  return rounds;
}

// Hook props
interface UseWordMatchProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
  };
  flashcards?: Flashcard[];
}

export function useWordMatch({ currentUser, flashcards = [] }: UseWordMatchProps) {
  // Game state
  const [game, setGame] = useState<WordMatchGame | null>(null);
  const [gameResults, setGameResults] = useState<WordMatchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timers
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Computed
  const isHost = useMemo(() => game?.hostId === currentUser.id, [game, currentUser]);
  const currentPlayer = useMemo(() => game?.players[currentUser.id], [game, currentUser]);

  const sortedPlayers = useMemo(() => {
    if (!game) return [];
    return Object.values(game.players).sort((a, b) => b.score - a.score);
  }, [game]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    };
  }, []);

  // Create game
  const createGame = useCallback(async (data: CreateWordMatchData) => {
    setLoading(true);
    setError(null);

    try {
      if (flashcards.length < data.totalRounds * 5) {
        throw new Error(`Cần ít nhất ${data.totalRounds * 5} flashcard để chơi`);
      }

      const settings: WordMatchSettings = {
        ...DEFAULT_WORD_MATCH_SETTINGS,
        totalRounds: data.totalRounds,
        timePerRound: data.timePerRound,
        maxPlayers: data.maxPlayers,
      };

      const rounds = generateRounds(
        flashcards,
        settings.totalRounds,
        settings.pairsPerRound,
        settings.specialInterval,
        settings.timePerRound
      );

      const player: WordMatchPlayer = {
        odinhId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        score: 0,
        correctPairs: 0,
        perfectRounds: 0,
        isDisconnected: false,
        disconnectedTurns: 0,
        hasShield: false,
        shieldTurns: 0,
        isChallenged: false,
        currentMatches: [],
        hasSubmitted: false,
        streak: 0,
      };

      const newGame: WordMatchGame = {
        id: generateId(),
        code: generateGameCode(),
        hostId: currentUser.id,
        title: data.title,
        settings,
        status: 'waiting',
        players: { [currentUser.id]: player },
        rounds,
        currentRound: 0,
        currentRoundData: null,
        roundResults: [],
        createdAt: new Date().toISOString(),
      };

      setGame(newGame);
      setGameResults(null);

      // Add bots after delay
      botTimerRef.current = setTimeout(() => {
        addBot();
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo game');
    } finally {
      setLoading(false);
    }
  }, [currentUser, flashcards]);

  // Add bot
  const addBot = useCallback(() => {
    setGame(prev => {
      if (!prev || prev.status !== 'waiting') return prev;

      const currentCount = Object.keys(prev.players).length;
      if (currentCount >= prev.settings.maxPlayers) return prev;

      const bots = generateBots(1);
      const bot = bots[0];
      const botId = `bot-${generateId()}`;

      const newPlayers = { ...prev.players };
      newPlayers[botId] = {
        odinhId: botId,
        displayName: bot.name,
        avatar: bot.avatar,
        score: 0,
        correctPairs: 0,
        perfectRounds: 0,
        isDisconnected: false,
        disconnectedTurns: 0,
        hasShield: false,
        shieldTurns: 0,
        isChallenged: false,
        currentMatches: [],
        hasSubmitted: false,
        streak: 0,
        isBot: true,
      };

      return { ...prev, players: newPlayers };
    });
  }, []);

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
      if (nextRound > prev.rounds.length) {
        return { ...prev, status: 'finished', finishedAt: new Date().toISOString() };
      }

      const roundData = prev.rounds[nextRound - 1];

      // Reset player states for new round
      const newPlayers: Record<string, WordMatchPlayer> = {};
      Object.entries(prev.players).forEach(([id, p]) => {
        // Decrease effect turns
        let shield = p.hasShield;
        let shieldTurns = p.shieldTurns;
        if (shieldTurns > 0) {
          shieldTurns--;
          if (shieldTurns === 0) shield = false;
        }

        let disconnected = p.isDisconnected;
        let disconnectedTurns = p.disconnectedTurns;
        if (disconnectedTurns > 0) {
          disconnectedTurns--;
          if (disconnectedTurns === 0) disconnected = false;
        }

        newPlayers[id] = {
          ...p,
          currentMatches: [],
          hasSubmitted: false,
          submitTime: undefined,
          hasShield: shield,
          shieldTurns,
          isDisconnected: disconnected,
          disconnectedTurns,
          isChallenged: false,
          challengedBy: undefined,
        };
      });

      return {
        ...prev,
        status: 'playing',
        currentRound: nextRound,
        currentRoundData: roundData,
        roundStartTime: Date.now(),
        players: newPlayers,
      };
    });

    // Set round timer
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    roundTimerRef.current = setTimeout(() => {
      endRound();
    }, (game?.settings.timePerRound || 30) * 1000 + 500);

    // Bot auto-answer
    scheduleBotAnswers();
  }, [game]);

  // Schedule bot answers
  const scheduleBotAnswers = useCallback(() => {
    if (!game) return;

    const bots = Object.values(game.players).filter(p => p.isBot && !p.isDisconnected);
    bots.forEach(bot => {
      const delay = 3000 + Math.random() * (game.settings.timePerRound * 1000 - 5000);
      const accuracy = 0.6 + Math.random() * 0.35; // 60-95% accuracy per pair

      setTimeout(() => {
        setGame(prev => {
          if (!prev || prev.status !== 'playing') return prev;
          if (prev.players[bot.odinhId]?.hasSubmitted) return prev;
          if (!prev.currentRoundData) return prev;

          // Generate bot's matches
          const matches: { leftId: string; rightId: string }[] = [];
          const rightIds = prev.currentRoundData.pairs.map(p => p.id);
          const shuffledRightIds = shuffleArray([...rightIds]);

          prev.currentRoundData.pairs.forEach((pair, idx) => {
            const isCorrect = Math.random() < accuracy;
            matches.push({
              leftId: pair.id,
              rightId: isCorrect ? pair.id : shuffledRightIds[idx],
            });
          });

          const newPlayers = { ...prev.players };
          newPlayers[bot.odinhId] = {
            ...newPlayers[bot.odinhId],
            currentMatches: matches,
            hasSubmitted: true,
            submitTime: Date.now(),
          };

          return { ...prev, players: newPlayers };
        });
      }, delay);
    });
  }, [game]);

  // Submit matches
  const submitMatches = useCallback((matches: { leftId: string; rightId: string }[]) => {
    if (!game || !currentPlayer || game.status !== 'playing') return;
    if (currentPlayer.hasSubmitted || currentPlayer.isDisconnected) return;

    setGame(prev => {
      if (!prev) return null;

      const newPlayers = { ...prev.players };
      newPlayers[currentUser.id] = {
        ...newPlayers[currentUser.id],
        currentMatches: matches,
        hasSubmitted: true,
        submitTime: Date.now(),
      };

      // Check if all players submitted
      const allSubmitted = Object.values(newPlayers).every(
        p => p.hasSubmitted || p.isDisconnected
      );

      return {
        ...prev,
        players: newPlayers,
        status: allSubmitted ? 'result' : 'playing',
      };
    });
  }, [game, currentPlayer, currentUser]);

  // End round
  const endRound = useCallback(() => {
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);

    setGame(prev => {
      if (!prev || prev.status === 'result' || prev.status === 'finished') return prev;
      if (!prev.currentRoundData) return prev;

      // Calculate scores
      const newPlayers: Record<string, WordMatchPlayer> = {};
      const roundResult: WordMatchRoundResult = {
        roundId: prev.currentRoundData.id,
        roundNumber: prev.currentRound,
        isSpecial: prev.currentRoundData.isSpecial,
        correctPairs: prev.currentRoundData.pairs.map(p => ({ leftId: p.id, rightId: p.id })),
        playerResults: [],
      };

      let bestScore = -1;
      let wheelWinner: string | undefined;

      Object.entries(prev.players).forEach(([id, player]) => {
        if (player.isDisconnected) {
          newPlayers[id] = { ...player, streak: 0 };
          roundResult.playerResults.push({
            odinhId: id,
            matches: [],
            correctCount: 0,
            allCorrect: false,
            timeMs: 0,
            pointsEarned: 0,
          });
          return;
        }

        // Count correct matches
        let correctCount = 0;
        player.currentMatches.forEach(match => {
          const pair = prev.currentRoundData!.pairs.find(p => p.id === match.leftId);
          if (pair && pair.id === match.rightId) {
            correctCount++;
          }
        });

        const allCorrect = correctCount === prev.settings.pairsPerRound;
        let pointsEarned = correctCount * prev.settings.pointsPerPair;
        if (allCorrect) {
          pointsEarned += prev.settings.bonusAllCorrect;
        }

        // Track for wheel spin winner (special rounds)
        if (prev.currentRoundData!.isSpecial && allCorrect) {
          const responseTime = player.submitTime ? player.submitTime - (prev.roundStartTime || 0) : Infinity;
          if (bestScore === -1 || responseTime < bestScore) {
            bestScore = responseTime;
            wheelWinner = id;
          }
        }

        const newStreak = correctCount > 0 ? player.streak + 1 : 0;

        newPlayers[id] = {
          ...player,
          score: player.score + pointsEarned,
          correctPairs: player.correctPairs + correctCount,
          perfectRounds: player.perfectRounds + (allCorrect ? 1 : 0),
          streak: newStreak,
        };

        roundResult.playerResults.push({
          odinhId: id,
          matches: player.currentMatches,
          correctCount,
          allCorrect,
          timeMs: player.submitTime ? player.submitTime - (prev.roundStartTime || 0) : 0,
          pointsEarned,
        });
      });

      roundResult.wheelWinner = wheelWinner;

      // Check for wheel spin or continue
      const isGameEnd = prev.currentRound >= prev.rounds.length;
      const needsWheelSpin = prev.currentRoundData.isSpecial && wheelWinner && !isGameEnd;

      return {
        ...prev,
        status: isGameEnd ? 'finished' : (needsWheelSpin ? 'wheel_spin' : 'result'),
        players: newPlayers,
        roundResults: [...prev.roundResults, roundResult],
        wheelSpinner: wheelWinner,
        finishedAt: isGameEnd ? new Date().toISOString() : undefined,
      };
    });
  }, []);

  // Apply wheel effect
  const applyEffect = useCallback((effectType: WordMatchEffectType, targetId?: string) => {
    if (!game) return;

    setGame(prev => {
      if (!prev) return null;

      const newPlayers = { ...prev.players };

      switch (effectType) {
        case 'challenge':
          if (targetId && newPlayers[targetId]) {
            // Mark target as challenged (will get hard pairs next round)
            newPlayers[targetId].isChallenged = true;
            newPlayers[targetId].challengedBy = prev.wheelSpinner;
            // Steal points
            const stolen = Math.min(prev.settings.challengePointsSteal, newPlayers[targetId].score);
            newPlayers[targetId].score -= stolen;
            if (prev.wheelSpinner) {
              newPlayers[prev.wheelSpinner].score += stolen;
            }
          }
          break;

        case 'disconnect':
          if (targetId && newPlayers[targetId]) {
            if (!newPlayers[targetId].hasShield) {
              newPlayers[targetId].isDisconnected = true;
              newPlayers[targetId].disconnectedTurns = 1;
            }
          }
          break;

        case 'shield':
          if (prev.wheelSpinner) {
            newPlayers[prev.wheelSpinner].hasShield = true;
            newPlayers[prev.wheelSpinner].shieldTurns = 1;
          }
          break;
      }

      return {
        ...prev,
        status: 'result',
        players: newPlayers,
        selectedEffect: effectType,
        effectTarget: targetId,
      };
    });
  }, [game]);

  // Continue to next round
  const continueGame = useCallback(() => {
    if (!game || !isHost) return;

    if (game.status === 'finished') {
      // Generate results
      const rankings: WordMatchPlayerResult[] = sortedPlayers.map((p, idx) => ({
        odinhId: p.odinhId,
        displayName: p.displayName,
        avatar: p.avatar,
        rank: idx + 1,
        score: p.score,
        correctPairs: p.correctPairs,
        perfectRounds: p.perfectRounds,
        accuracy: p.correctPairs > 0
          ? Math.round((p.correctPairs / (game.currentRound * game.settings.pairsPerRound)) * 100)
          : 0,
        isWinner: idx === 0,
      }));

      setGameResults({
        gameId: game.id,
        winner: rankings[0] || null,
        rankings,
        totalRounds: game.currentRound,
        totalPairs: game.currentRound * game.settings.pairsPerRound,
      });
    } else {
      startNextRound();
    }
  }, [game, isHost, sortedPlayers, startNextRound]);

  // Reset
  const resetGame = useCallback(() => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    setGame(null);
    setGameResults(null);
  }, []);

  // Auto-end round when all submitted
  useEffect(() => {
    if (!game || game.status !== 'playing') return;

    const allSubmitted = Object.values(game.players).every(
      p => p.hasSubmitted || p.isDisconnected
    );
    if (allSubmitted) {
      setTimeout(() => endRound(), 500);
    }
  }, [game, endRound]);

  return {
    game,
    gameResults,
    loading,
    error,
    isHost,
    currentPlayer,
    sortedPlayers,
    createGame,
    joinGame,
    leaveGame,
    startGame,
    addBot,
    submitMatches,
    applyEffect,
    continueGame,
    resetGame,
    setError,
  };
}
