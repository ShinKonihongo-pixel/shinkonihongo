// Racing Game Hook - Manages all racing game state and logic
// Handles game creation, joining, gameplay, traps, teams, and results

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type {
  RacingGame,
  RacingPlayer,
  RacingQuestion,
  RacingGameResults,
  RacingPlayerResult,
  CreateRacingGameData,
  RacingGameSettings,
  RacingVehicle,
  SpecialFeatureType,
  QuestionDifficulty,
  GameMode,
  TrapType,
  Trap,
  RacingTeam,
  RacingTeamResult,
  InventoryItem,
  ActiveTrapEffect,
  TeamColorKey,
} from '../types/racing-game';
import { DEFAULT_VEHICLES, SPECIAL_FEATURES, TRAPS, TEAM_COLORS, DEFAULT_TRACK_ZONES } from '../types/racing-game';
import type { Flashcard } from '../types/flashcard';
import { generateBots } from '../types/game-hub';

// Bot auto-join settings
const BOT_FIRST_JOIN_DELAY = 15000; // 15 seconds - add 1 bot
const BOT_SECOND_JOIN_DELAY = 30000; // 30 seconds - add 2 more bots

// Trap/escape settings
const ESCAPE_TAPS_REQUIRED = 10;
const INVENTORY_MAX_SIZE = 3;

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

// Create teams based on count
function createTeams(count: number): Record<string, RacingTeam> {
  const colorKeys: TeamColorKey[] = ['red', 'blue', 'yellow', 'purple'];
  const teams: Record<string, RacingTeam> = {};

  for (let i = 0; i < count; i++) {
    const colorKey = colorKeys[i];
    const teamColor = TEAM_COLORS[colorKey];
    const teamId = `team-${colorKey}`;
    teams[teamId] = {
      id: teamId,
      name: `Đội ${teamColor.name}`,
      colorKey,
      emoji: teamColor.emoji,
      members: [],
      totalDistance: 0,
      totalPoints: 0,
    };
  }

  return teams;
}

// Generate random trap on track
function generateRandomTrap(minPosition: number = 20): Trap {
  const trapTypes: TrapType[] = ['imprisonment', 'freeze', 'sinkhole'];
  const trapType = trapTypes[Math.floor(Math.random() * trapTypes.length)];
  const position = minPosition + Math.random() * (80 - minPosition);

  return {
    id: generateId(),
    type: trapType,
    position,
    isActive: true,
  };
}

// Convert flashcards to racing questions
function convertFlashcardsToQuestions(
  cards: Flashcard[],
  count: number,
  timeLimit: number,
  mysteryBoxFrequency: number,
  milestoneFrequency: number = 5
): RacingQuestion[] {
  const shuffled = shuffleArray(cards).slice(0, count);

  return shuffled.map((card, index) => {
    const questionNum = index + 1;
    const isMysteryBox = questionNum % mysteryBoxFrequency === 0;
    const isMilestone = questionNum % milestoneFrequency === 0 && !isMysteryBox;
    const difficulty: QuestionDifficulty =
      index < count * 0.4 ? 'easy' :
      index < count * 0.7 ? 'medium' : 'hard';

    // Generate wrong options from other cards
    const otherCards = cards.filter(c => c.id !== card.id);
    const wrongOptions = shuffleArray(otherCards)
      .slice(0, 3)
      .map(c => c.meaning);

    const options = shuffleArray([card.meaning, ...wrongOptions]);
    const correctIndex = options.indexOf(card.meaning);

    // Milestone questions have higher bonus
    const baseSpeedBonus = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 8 : 12;
    const speedBonus = isMilestone ? baseSpeedBonus * 2 : baseSpeedBonus;

    const question: RacingQuestion = {
      id: generateId(),
      questionText: card.kanji || card.vocabulary,
      options,
      correctIndex,
      difficulty,
      timeLimit,
      speedBonus,
      isMysteryBox,
      isMilestone,
    };

    if (isMysteryBox) {
      const featureTypes: SpecialFeatureType[] = ['speed_boost', 'shield', 'slow_others', 'double_speed', 'teleport', 'freeze'];
      question.mysteryBox = {
        difficulty,
        reward: featureTypes[Math.floor(Math.random() * featureTypes.length)],
        isOpened: false,
      };
    }

    return question;
  });
}

// Hook props
interface UseRacingGameProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  flashcards?: Flashcard[];
}

export function useRacingGame({ currentUser, flashcards = [] }: UseRacingGameProps) {
  // Game state
  const [game, setGame] = useState<RacingGame | null>(null);
  const [gameResults, setGameResults] = useState<RacingGameResults | null>(null);
  const [availableRooms, setAvailableRooms] = useState<RacingGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<RacingVehicle>(DEFAULT_VEHICLES[0]);
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>('individual');

  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  const botTimer2Ref = useRef<NodeJS.Timeout | null>(null);
  const botAnswerTimersRef = useRef<NodeJS.Timeout[]>([]);

  // Computed values - use specific dependencies to avoid unnecessary recalculations
  const isHost = useMemo(() => game?.hostId === currentUser.id, [game?.hostId, currentUser.id]);
  const currentPlayer = useMemo(() => game?.players[currentUser.id], [game?.players, currentUser.id]);

  // Use specific primitive dependencies to avoid creating new reference on every game update
  const questions = game?.questions;
  const currentQuestionIndex = game?.currentQuestionIndex ?? 0;
  const currentQuestion = useMemo(() =>
    questions ? questions[currentQuestionIndex] : null,
    [questions, currentQuestionIndex]
  );

  const players = game?.players;
  const sortedPlayers = useMemo(() => {
    if (!players) return [];
    return Object.values(players).sort((a, b) => b.distance - a.distance);
  }, [players]);

  const finishedPlayers = useMemo(() =>
    sortedPlayers.filter(p => p.isFinished),
    [sortedPlayers]
  );

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (questionTimerRef.current) clearTimeout(questionTimerRef.current);
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      if (botTimer2Ref.current) clearTimeout(botTimer2Ref.current);
      botAnswerTimersRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  // Bot auto-answer logic - bots answer with 60-80% accuracy
  useEffect(() => {
    if (!game || game.status !== 'answering') return;

    const currentQ = game.questions[game.currentQuestionIndex];
    if (!currentQ) return;

    // Clear previous bot timers
    botAnswerTimersRef.current.forEach(t => clearTimeout(t));
    botAnswerTimersRef.current = [];

    // Get bots that haven't answered yet
    const bots = Object.values(game.players).filter(
      p => p.isBot && p.currentAnswer === undefined
    );

    // Each bot answers with random delay (1-8 seconds)
    bots.forEach(bot => {
      const delay = 1000 + Math.random() * 7000; // 1-8 seconds
      const timer = setTimeout(() => {
        // 60-80% accuracy per bot
        const accuracy = 0.6 + Math.random() * 0.2;
        const isCorrect = Math.random() < accuracy;
        const answerIndex = isCorrect
          ? currentQ.correctIndex
          : [0, 1, 2, 3].filter(i => i !== currentQ.correctIndex)[Math.floor(Math.random() * 3)];

        setGame(prev => {
          if (!prev || prev.status !== 'answering') return prev;

          const botPlayer = prev.players[bot.odinhId];
          if (!botPlayer || botPlayer.currentAnswer !== undefined) return prev;

          const answerTime = Date.now() - (prev.questionStartTime || Date.now());
          const correct = answerIndex === currentQ.correctIndex;

          let newSpeed = botPlayer.currentSpeed;
          let newDistance = botPlayer.distance;
          let newStreak = correct ? botPlayer.streak + 1 : 0;
          let points = 0;

          if (correct && !botPlayer.isFrozen) {
            let speedGain = currentQ.speedBonus;
            if (newStreak >= 3) speedGain *= 1 + (newStreak - 2) * 0.1;
            newSpeed = Math.min(botPlayer.vehicle.maxSpeed, newSpeed + speedGain);
            const distanceGain = (newSpeed / prev.settings.trackLength) * 2;
            newDistance = Math.min(100, newDistance + distanceGain);
            points = Math.round(currentQ.speedBonus * 10 * (1 + newStreak * 0.1));
          }

          const updatedFeatures = botPlayer.activeFeatures
            .map(f => ({ ...f, remainingRounds: f.remainingRounds - 1 }))
            .filter(f => f.remainingRounds > 0);

          const updatedBot: RacingPlayer = {
            ...botPlayer,
            currentSpeed: newSpeed,
            distance: newDistance,
            correctAnswers: botPlayer.correctAnswers + (correct ? 1 : 0),
            totalAnswers: botPlayer.totalAnswers + 1,
            streak: newStreak,
            currentAnswer: answerIndex,
            answerTime,
            activeFeatures: updatedFeatures,
            hasShield: updatedFeatures.some(f => f.type === 'shield'),
            isFrozen: false,
            isFinished: newDistance >= 100,
            finishPosition: newDistance >= 100
              ? Object.values(prev.players).filter(p => p.isFinished).length + 1
              : undefined,
            totalPoints: botPlayer.totalPoints + points,
          };

          return {
            ...prev,
            players: { ...prev.players, [bot.odinhId]: updatedBot },
          };
        });
      }, delay);

      botAnswerTimersRef.current.push(timer);
    });

    return () => {
      botAnswerTimersRef.current.forEach(t => clearTimeout(t));
    };
  }, [game?.status, game?.currentQuestionIndex]);

  // Create new game
  const createGame = useCallback(async (data: CreateRacingGameData) => {
    setLoading(true);
    setError(null);

    try {
      const gameMode = data.gameMode || 'individual';
      const enableTraps = data.enableTraps ?? false;
      const teamCount = data.teamCount || 2;

      const settings: RacingGameSettings = {
        raceType: data.raceType,
        trackLength: data.trackLength,
        questionCount: data.questionCount,
        timePerQuestion: data.timePerQuestion,
        mysteryBoxFrequency: 5,
        maxPlayers: 8,
        minPlayers: 1,
        jlptLevel: data.jlptLevel,
        contentSource: data.contentSource,
        lessonId: data.lessonId,
        gameMode,
        teamCount: gameMode === 'team' ? teamCount : undefined,
        enableTraps,
        trapFrequency: enableTraps ? 3 : 0,
        milestoneFrequency: 5,
      };

      // Filter flashcards by level
      const filteredCards = flashcards.filter(c => c.jlptLevel === data.jlptLevel);
      if (filteredCards.length < data.questionCount) {
        throw new Error(`Không đủ câu hỏi. Cần ${data.questionCount} câu, chỉ có ${filteredCards.length} câu.`);
      }

      const questions = convertFlashcardsToQuestions(
        filteredCards,
        data.questionCount,
        data.timePerQuestion,
        settings.mysteryBoxFrequency,
        settings.milestoneFrequency
      );

      // Create initial player
      const vehiclesForType = DEFAULT_VEHICLES.filter(v => v.type === data.raceType);
      const playerVehicle = vehiclesForType.find(v => v.id === selectedVehicle.id) || vehiclesForType[0];

      // Create teams if team mode
      const teams = gameMode === 'team' ? createTeams(teamCount) : undefined;
      const teamIds = teams ? Object.keys(teams) : [];
      const firstTeamId = teamIds[0];

      const player: RacingPlayer = {
        odinhId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        role: currentUser.role,
        vehicle: playerVehicle,
        currentSpeed: playerVehicle.baseSpeed,
        distance: 0,
        correctAnswers: 0,
        totalAnswers: 0,
        streak: 0,
        activeFeatures: [],
        hasShield: false,
        isFrozen: false,
        isFinished: false,
        totalPoints: 0,
        trapEffects: [],
        inventory: [],
        teamId: firstTeamId,
      };

      // Add host to first team if team mode
      if (teams && firstTeamId) {
        teams[firstTeamId].members.push(currentUser.id);
      }

      const newGame: RacingGame = {
        id: generateId(),
        code: generateGameCode(),
        hostId: currentUser.id,
        title: data.title,
        settings,
        status: 'waiting',
        players: { [currentUser.id]: player },
        questions,
        currentQuestionIndex: 0,
        createdAt: new Date().toISOString(),
        teams,
        activeTraps: [],
        trackZones: DEFAULT_TRACK_ZONES,
      };

      setGame(newGame);
      setAvailableRooms(prev => [...prev, newGame]);

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
          const vehiclesForType = DEFAULT_VEHICLES.filter(v => v.type === prevGame.settings.raceType);
          const newPlayers: Record<string, RacingPlayer> = { ...prevGame.players };
          const existingBotCount = Object.values(prevGame.players).filter(p => p.isBot).length;

          // Get team IDs for assigning bots
          const teamIds = prevGame.teams ? Object.keys(prevGame.teams) : [];
          let updatedTeams = prevGame.teams ? { ...prevGame.teams } : undefined;

          bots.forEach((bot, index) => {
            const botId = `bot-${generateId()}`;
            const botVehicle = vehiclesForType[(existingBotCount + index) % vehiclesForType.length];

            // Assign bot to team (round-robin)
            const botTeamId = teamIds.length > 0 ? teamIds[(existingBotCount + index) % teamIds.length] : undefined;

            newPlayers[botId] = {
              odinhId: botId,
              displayName: bot.name,
              avatar: bot.avatar,
              vehicle: botVehicle,
              currentSpeed: botVehicle.baseSpeed,
              distance: 0,
              correctAnswers: 0,
              totalAnswers: 0,
              streak: 0,
              activeFeatures: [],
              hasShield: false,
              isFrozen: false,
              isFinished: false,
              totalPoints: 0,
              isBot: true,
              trapEffects: [],
              inventory: [],
              teamId: botTeamId,
            };

            // Add bot to team
            if (updatedTeams && botTeamId) {
              updatedTeams[botTeamId] = {
                ...updatedTeams[botTeamId],
                members: [...updatedTeams[botTeamId].members, botId],
              };
            }
          });

          return { ...prevGame, players: newPlayers, teams: updatedTeams };
        });
      };

      // Clear existing bot timers
      if (botTimerRef.current) {
        clearTimeout(botTimerRef.current);
      }
      if (botTimer2Ref.current) {
        clearTimeout(botTimer2Ref.current);
      }

      // First bot timer: 15 seconds - add 1 bot
      botTimerRef.current = setTimeout(() => {
        addBotsToGame(1);
      }, BOT_FIRST_JOIN_DELAY);

      // Second bot timer: 30 seconds - add 2 more bots
      botTimer2Ref.current = setTimeout(() => {
        addBotsToGame(2);
      }, BOT_SECOND_JOIN_DELAY);

      return newGame;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi tạo game';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser, flashcards, selectedVehicle]);

  // Join game by code
  const joinGame = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      const foundGame = availableRooms.find(g => g.code === code);
      if (!foundGame) {
        throw new Error('Không tìm thấy phòng với mã này');
      }

      if (foundGame.status !== 'waiting') {
        throw new Error('Trò chơi đã bắt đầu');
      }

      if (Object.keys(foundGame.players).length >= foundGame.settings.maxPlayers) {
        throw new Error('Phòng đã đầy');
      }

      // Select vehicle for race type
      const vehiclesForType = DEFAULT_VEHICLES.filter(v => v.type === foundGame.settings.raceType);
      const playerVehicle = vehiclesForType.find(v => v.id === selectedVehicle.id) || vehiclesForType[0];

      // Find team with fewest members for auto-assignment
      let assignedTeamId: string | undefined;
      let updatedTeams = foundGame.teams ? { ...foundGame.teams } : undefined;

      if (updatedTeams) {
        const teamIds = Object.keys(updatedTeams);
        const teamWithFewestMembers = teamIds.reduce((minTeam, teamId) => {
          const teamSize = updatedTeams![teamId].members.length;
          const minSize = updatedTeams![minTeam].members.length;
          return teamSize < minSize ? teamId : minTeam;
        }, teamIds[0]);
        assignedTeamId = teamWithFewestMembers;
        updatedTeams[assignedTeamId].members.push(currentUser.id);
      }

      const player: RacingPlayer = {
        odinhId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        role: currentUser.role,
        vehicle: playerVehicle,
        currentSpeed: playerVehicle.baseSpeed,
        distance: 0,
        correctAnswers: 0,
        totalAnswers: 0,
        streak: 0,
        activeFeatures: [],
        hasShield: false,
        isFrozen: false,
        isFinished: false,
        totalPoints: 0,
        trapEffects: [],
        inventory: [],
        teamId: assignedTeamId,
      };

      const updatedGame = {
        ...foundGame,
        players: { ...foundGame.players, [currentUser.id]: player },
        teams: updatedTeams,
      };

      setGame(updatedGame);
      setAvailableRooms(prev => prev.map(g => g.id === updatedGame.id ? updatedGame : g));

      return updatedGame;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi tham gia game';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser, availableRooms, selectedVehicle]);

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

    const { [currentUser.id]: _, ...remainingPlayers } = game.players;

    if (Object.keys(remainingPlayers).length === 0) {
      // Remove game if empty
      setAvailableRooms(prev => prev.filter(g => g.id !== game.id));
    } else {
      // Update game
      const updatedGame = {
        ...game,
        players: remainingPlayers,
        hostId: isHost ? Object.keys(remainingPlayers)[0] : game.hostId,
      };
      setAvailableRooms(prev => prev.map(g => g.id === game.id ? updatedGame : g));
    }

    setGame(null);
    setGameResults(null);
  }, [game, currentUser, isHost]);

  // Kick player (host only)
  const kickPlayer = useCallback((playerId: string) => {
    if (!game || !isHost || playerId === currentUser.id) return;

    const { [playerId]: _, ...remainingPlayers } = game.players;

    const updatedGame = {
      ...game,
      players: remainingPlayers,
    };

    setGame(updatedGame);
    setAvailableRooms(prev => prev.map(g => g.id === game.id ? updatedGame : g));
  }, [game, currentUser, isHost]);

  // Start game (host only)
  const startGame = useCallback(() => {
    if (!game || !isHost) return;

    if (Object.keys(game.players).length < game.settings.minPlayers) {
      setError(`Cần ít nhất ${game.settings.minPlayers} người chơi`);
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

    setGame(prev => prev ? {
      ...prev,
      status: 'starting',
      startedAt: new Date().toISOString(),
    } : null);

    // Countdown then start first question
    timerRef.current = setTimeout(() => {
      setGame(prev => prev ? {
        ...prev,
        status: 'question',
        questionStartTime: Date.now(),
      } : null);

      // Auto transition to answering
      timerRef.current = setTimeout(() => {
        setGame(prev => prev ? { ...prev, status: 'answering' } : null);
      }, 2000);
    }, 3000);
  }, [game, isHost]);

  // Submit answer
  const submitAnswer = useCallback((answerIndex: number) => {
    if (!game || !currentQuestion || game.status !== 'answering') return;
    if (currentPlayer?.currentAnswer !== undefined) return; // Already answered

    const answerTime = Date.now() - (game.questionStartTime || Date.now());
    const isCorrect = answerIndex === currentQuestion.correctIndex;

    setGame(prev => {
      if (!prev) return null;

      const player = prev.players[currentUser.id];
      if (!player) return prev;

      let newSpeed = player.currentSpeed;
      let newDistance = player.distance;
      let newStreak = isCorrect ? player.streak + 1 : 0;
      let newCorrect = player.correctAnswers + (isCorrect ? 1 : 0);
      let points = 0;

      if (isCorrect && !player.isFrozen) {
        // Calculate speed gain
        let speedGain = currentQuestion.speedBonus;

        // Apply active features
        const doubleSpeed = player.activeFeatures.find(f => f.type === 'double_speed');
        if (doubleSpeed) {
          speedGain *= 2;
        }

        const speedBoost = player.activeFeatures.find(f => f.type === 'speed_boost');
        if (speedBoost) {
          speedGain *= 1.2;
        }

        // Streak bonus
        if (newStreak >= 3) {
          speedGain *= 1 + (newStreak - 2) * 0.1; // 10% extra per streak after 2
        }

        newSpeed = Math.min(player.vehicle.maxSpeed, newSpeed + speedGain);

        // Calculate distance (speed * time factor)
        const distanceGain = (newSpeed / prev.settings.trackLength) * 2;
        newDistance = Math.min(100, newDistance + distanceGain);

        // Points
        points = Math.round(currentQuestion.speedBonus * 10 * (1 + newStreak * 0.1));
      }

      // Update active features (reduce duration)
      const updatedFeatures = player.activeFeatures
        .map(f => ({ ...f, remainingRounds: f.remainingRounds - 1 }))
        .filter(f => f.remainingRounds > 0);

      const updatedPlayer: RacingPlayer = {
        ...player,
        currentSpeed: newSpeed,
        distance: newDistance,
        correctAnswers: newCorrect,
        totalAnswers: player.totalAnswers + 1,
        streak: newStreak,
        currentAnswer: answerIndex,
        answerTime,
        activeFeatures: updatedFeatures,
        hasShield: updatedFeatures.some(f => f.type === 'shield'),
        isFrozen: false, // Reset frozen
        isFinished: newDistance >= 100,
        finishPosition: newDistance >= 100 ? Object.values(prev.players).filter(p => p.isFinished).length + 1 : undefined,
        totalPoints: player.totalPoints + points,
      };

      return {
        ...prev,
        players: { ...prev.players, [currentUser.id]: updatedPlayer },
      };
    });
  }, [game, currentQuestion, currentPlayer, currentUser]);

  // Reveal answer (host only)
  const revealAnswer = useCallback(() => {
    if (!game || !isHost) return;

    setGame(prev => prev ? { ...prev, status: 'revealing' } : null);
  }, [game, isHost]);

  // Next question (host only)
  const nextQuestion = useCallback(() => {
    if (!game || !isHost) return;

    const nextIndex = game.currentQuestionIndex + 1;

    // Check if race is finished
    const allFinished = Object.values(game.players).every(p => p.isFinished);
    const noMoreQuestions = nextIndex >= game.questions.length;

    if (allFinished || noMoreQuestions) {
      // End game
      const rankings: RacingPlayerResult[] = Object.values(game.players)
        .sort((a, b) => {
          if (a.isFinished && !b.isFinished) return -1;
          if (!a.isFinished && b.isFinished) return 1;
          if (a.finishPosition && b.finishPosition) return a.finishPosition - b.finishPosition;
          return b.distance - a.distance;
        })
        .map((p, idx) => ({
          odinhId: p.odinhId,
          displayName: p.displayName,
          avatar: p.avatar,
          vehicle: p.vehicle,
          position: idx + 1,
          distance: p.distance,
          correctAnswers: p.correctAnswers,
          accuracy: p.totalAnswers > 0 ? (p.correctAnswers / p.totalAnswers) * 100 : 0,
          averageTime: 0,
          pointsEarned: p.totalPoints,
          featuresUsed: 0,
          trapsTriggered: p.trapEffects?.length || 0,
          trapsPlaced: 0,
          teamId: p.teamId,
        }));

      // Calculate team rankings if team mode
      let teamRankings: RacingTeamResult[] | undefined;
      if (game.settings.gameMode === 'team' && game.teams) {
        teamRankings = Object.values(game.teams)
          .map(team => {
            const teamPlayers = rankings.filter(r => r.teamId === team.id);
            const totalDistance = teamPlayers.reduce((sum, p) => sum + p.distance, 0);
            const totalPoints = teamPlayers.reduce((sum, p) => sum + p.pointsEarned, 0);
            return {
              teamId: team.id,
              teamName: team.name,
              emoji: team.emoji,
              colorKey: team.colorKey,
              totalDistance,
              totalPoints,
              memberCount: teamPlayers.length,
              position: 0,
            };
          })
          .sort((a, b) => b.totalDistance - a.totalDistance)
          .map((t, idx) => ({ ...t, position: idx + 1 }));
      }

      setGameResults({
        gameId: game.id,
        rankings,
        totalQuestions: game.questions.length,
        raceType: game.settings.raceType,
        trackLength: game.settings.trackLength,
        gameMode: game.settings.gameMode,
        teamRankings,
      });

      setGame(prev => prev ? { ...prev, status: 'finished', finishedAt: new Date().toISOString() } : null);
      return;
    }

    // Check for mystery box
    const nextQ = game.questions[nextIndex];
    if (nextQ.isMysteryBox) {
      setGame(prev => prev ? {
        ...prev,
        currentQuestionIndex: nextIndex,
        status: 'mystery_box',
        questionStartTime: Date.now(),
        // Reset player answers
        players: Object.fromEntries(
          Object.entries(prev.players).map(([id, p]) => [id, { ...p, currentAnswer: undefined, answerTime: undefined }])
        ),
      } : null);
    } else {
      setGame(prev => prev ? {
        ...prev,
        currentQuestionIndex: nextIndex,
        status: 'question',
        questionStartTime: Date.now(),
        // Reset player answers
        players: Object.fromEntries(
          Object.entries(prev.players).map(([id, p]) => [id, { ...p, currentAnswer: undefined, answerTime: undefined }])
        ),
      } : null);

      // Auto transition to answering
      timerRef.current = setTimeout(() => {
        setGame(prev => prev ? { ...prev, status: 'answering' } : null);
      }, 2000);
    }
  }, [game, isHost]);

  // Open mystery box
  const openMysteryBox = useCallback(() => {
    if (!game || !currentQuestion?.isMysteryBox) return;

    setGame(prev => prev ? { ...prev, status: 'answering' } : null);
  }, [game, currentQuestion]);

  // Apply special feature from mystery box
  const applySpecialFeature = useCallback((featureType: SpecialFeatureType) => {
    if (!game) return;

    const feature = SPECIAL_FEATURES[featureType];

    setGame(prev => {
      if (!prev) return null;

      const player = prev.players[currentUser.id];
      if (!player) return prev;

      let updatedPlayers = { ...prev.players };

      // Apply feature effects
      switch (featureType) {
        case 'teleport':
          // Instant distance boost
          updatedPlayers[currentUser.id] = {
            ...player,
            distance: Math.min(100, player.distance + 10),
            isFinished: player.distance + 10 >= 100,
          };
          break;

        case 'slow_others':
          // Slow all other players
          Object.keys(updatedPlayers).forEach(id => {
            if (id !== currentUser.id) {
              const other = updatedPlayers[id];
              if (!other.hasShield) {
                updatedPlayers[id] = {
                  ...other,
                  currentSpeed: Math.max(other.vehicle.baseSpeed, other.currentSpeed * 0.9),
                };
              }
            }
          });
          // Add duration tracker
          updatedPlayers[currentUser.id] = {
            ...player,
            activeFeatures: [...player.activeFeatures, { type: featureType, remainingRounds: feature.duration || 1 }],
          };
          break;

        case 'freeze':
          // Freeze random opponent
          const opponents = Object.keys(updatedPlayers).filter(id => id !== currentUser.id);
          if (opponents.length > 0) {
            const targetId = opponents[Math.floor(Math.random() * opponents.length)];
            const target = updatedPlayers[targetId];
            if (!target.hasShield) {
              updatedPlayers[targetId] = { ...target, isFrozen: true };
            }
          }
          break;

        default:
          // Add to active features
          updatedPlayers[currentUser.id] = {
            ...player,
            activeFeatures: [...player.activeFeatures, { type: featureType, remainingRounds: feature.duration || 1 }],
            hasShield: featureType === 'shield' ? true : player.hasShield,
          };
      }

      return { ...prev, players: updatedPlayers };
    });
  }, [game, currentUser]);

  // Reset game
  const resetGame = useCallback(() => {
    setGame(null);
    setGameResults(null);
    setError(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (questionTimerRef.current) clearTimeout(questionTimerRef.current);
  }, []);

  // Select vehicle
  const selectVehicle = useCallback((vehicle: RacingVehicle) => {
    setSelectedVehicle(vehicle);

    // Update in game if already joined
    if (game && game.players[currentUser.id]) {
      setGame(prev => {
        if (!prev) return null;
        return {
          ...prev,
          players: {
            ...prev.players,
            [currentUser.id]: {
              ...prev.players[currentUser.id],
              vehicle,
              currentSpeed: vehicle.baseSpeed,
            },
          },
        };
      });
    }
  }, [game, currentUser]);

  // Assign player to team (team mode)
  const assignPlayerToTeam = useCallback((playerId: string, newTeamId: string) => {
    setGame(prev => {
      if (!prev || !prev.teams) return prev;

      const player = prev.players[playerId];
      if (!player) return prev;

      const oldTeamId = player.teamId;
      const updatedTeams = { ...prev.teams };

      // Remove from old team
      if (oldTeamId && updatedTeams[oldTeamId]) {
        updatedTeams[oldTeamId] = {
          ...updatedTeams[oldTeamId],
          members: updatedTeams[oldTeamId].members.filter(id => id !== playerId),
        };
      }

      // Add to new team
      if (updatedTeams[newTeamId]) {
        updatedTeams[newTeamId] = {
          ...updatedTeams[newTeamId],
          members: [...updatedTeams[newTeamId].members, playerId],
        };
      }

      return {
        ...prev,
        teams: updatedTeams,
        players: {
          ...prev.players,
          [playerId]: { ...player, teamId: newTeamId },
        },
      };
    });
  }, []);

  // Place trap from inventory
  const placeTrap = useCallback((trapType: TrapType, position: number) => {
    if (!game) return;

    const player = game.players[currentUser.id];
    if (!player) return;

    // Find trap item in inventory
    const itemIndex = player.inventory.findIndex(
      item => item.type === trapType && item.category === 'trap' && !item.isUsed
    );
    if (itemIndex === -1) return;

    const newTrap: Trap = {
      id: generateId(),
      type: trapType,
      position,
      placedBy: currentUser.id,
      isActive: true,
    };

    setGame(prev => {
      if (!prev) return null;
      const p = prev.players[currentUser.id];
      const updatedInventory = [...p.inventory];
      updatedInventory[itemIndex] = { ...updatedInventory[itemIndex], isUsed: true };

      return {
        ...prev,
        activeTraps: [...prev.activeTraps, newTrap],
        players: {
          ...prev.players,
          [currentUser.id]: { ...p, inventory: updatedInventory.filter(i => !i.isUsed) },
        },
      };
    });
  }, [game, currentUser]);

  // Trigger trap when player hits it
  const triggerTrap = useCallback((playerId: string, trap: Trap) => {
    setGame(prev => {
      if (!prev) return null;

      const player = prev.players[playerId];
      if (!player || player.hasShield) {
        // Shield blocks trap
        return {
          ...prev,
          activeTraps: prev.activeTraps.filter(t => t.id !== trap.id),
        };
      }

      const trapDef = TRAPS[trap.type];
      const newEffect: ActiveTrapEffect = {
        trapType: trap.type,
        remainingRounds: trapDef.effect.duration,
        escapeRequired: trapDef.effect.escapeRequired ? ESCAPE_TAPS_REQUIRED : undefined,
        escapeTaps: 0,
      };

      return {
        ...prev,
        activeTraps: prev.activeTraps.filter(t => t.id !== trap.id),
        players: {
          ...prev.players,
          [playerId]: {
            ...player,
            trapEffects: [...player.trapEffects, newEffect],
            isFrozen: trapDef.effect.immobilize || false,
            isEscaping: trapDef.effect.escapeRequired || false,
            escapeProgress: 0,
          },
        },
      };
    });
  }, []);

  // Handle escape mini-game tap
  const handleEscapeTap = useCallback(() => {
    if (!game) return;

    const player = game.players[currentUser.id];
    if (!player || !player.isEscaping) return;

    setGame(prev => {
      if (!prev) return null;

      const p = prev.players[currentUser.id];
      const sinkholeEffect = p.trapEffects.find(e => e.trapType === 'sinkhole');
      if (!sinkholeEffect || !sinkholeEffect.escapeRequired) return prev;

      const newTaps = (sinkholeEffect.escapeTaps || 0) + 1;
      const progress = Math.min(100, (newTaps / sinkholeEffect.escapeRequired) * 100);
      const escaped = newTaps >= sinkholeEffect.escapeRequired;

      return {
        ...prev,
        players: {
          ...prev.players,
          [currentUser.id]: {
            ...p,
            escapeProgress: progress,
            isEscaping: !escaped,
            isFrozen: !escaped,
            trapEffects: escaped
              ? p.trapEffects.filter(e => e.trapType !== 'sinkhole')
              : p.trapEffects.map(e =>
                  e.trapType === 'sinkhole' ? { ...e, escapeTaps: newTaps } : e
                ),
          },
        },
      };
    });
  }, [game, currentUser]);

  // Check trap collision
  const checkTrapCollision = useCallback((playerId: string, newDistance: number): Trap | null => {
    if (!game) return null;

    const player = game.players[playerId];
    if (!player) return null;

    const oldDistance = player.distance;

    // Find trap between old and new distance
    const hitTrap = game.activeTraps.find(
      trap => trap.isActive && trap.position > oldDistance && trap.position <= newDistance
    );

    return hitTrap || null;
  }, [game]);

  // Use inventory item
  const useInventoryItem = useCallback((itemId: string) => {
    if (!game) return;

    const player = game.players[currentUser.id];
    if (!player) return;

    const item = player.inventory.find(i => i.id === itemId && !i.isUsed);
    if (!item) return;

    if (item.category === 'powerup') {
      // Apply power-up
      applySpecialFeature(item.type as SpecialFeatureType);
    }
    // Trap placement is handled by placeTrap function

    // Remove item from inventory
    setGame(prev => {
      if (!prev) return null;
      const p = prev.players[currentUser.id];
      return {
        ...prev,
        players: {
          ...prev.players,
          [currentUser.id]: {
            ...p,
            inventory: p.inventory.filter(i => i.id !== itemId),
          },
        },
      };
    });
  }, [game, currentUser, applySpecialFeature]);

  // Add item to inventory (called when winning milestone)
  const addToInventory = useCallback((type: SpecialFeatureType | TrapType, category: 'powerup' | 'trap') => {
    if (!game) return;

    const player = game.players[currentUser.id];
    if (!player || player.inventory.length >= INVENTORY_MAX_SIZE) return;

    const newItem: InventoryItem = {
      id: generateId(),
      type,
      category,
      isUsed: false,
    };

    setGame(prev => {
      if (!prev) return null;
      const p = prev.players[currentUser.id];
      if (p.inventory.length >= INVENTORY_MAX_SIZE) return prev;

      return {
        ...prev,
        players: {
          ...prev.players,
          [currentUser.id]: {
            ...p,
            inventory: [...p.inventory, newItem],
          },
        },
      };
    });
  }, [game, currentUser]);

  // Spawn random trap on track (called after certain questions)
  const spawnRandomTrap = useCallback(() => {
    if (!game || !game.settings.enableTraps) return;

    const newTrap = generateRandomTrap();
    setGame(prev => prev ? { ...prev, activeTraps: [...prev.activeTraps, newTrap] } : null);
  }, [game]);

  // Update team scores
  const updateTeamScores = useCallback(() => {
    setGame(prev => {
      if (!prev || !prev.teams) return prev;

      const updatedTeams = { ...prev.teams };
      Object.keys(updatedTeams).forEach(teamId => {
        const team = updatedTeams[teamId];
        const members = Object.values(prev.players).filter(p => p.teamId === teamId);
        updatedTeams[teamId] = {
          ...team,
          totalDistance: members.reduce((sum, m) => sum + m.distance, 0),
          totalPoints: members.reduce((sum, m) => sum + m.totalPoints, 0),
        };
      });

      return { ...prev, teams: updatedTeams };
    });
  }, []);

  return {
    // State
    game,
    gameResults,
    availableRooms,
    loading,
    error,
    selectedVehicle,
    selectedGameMode,

    // Computed
    isHost,
    currentPlayer,
    currentQuestion,
    sortedPlayers,
    finishedPlayers,

    // Actions
    createGame,
    joinGame,
    leaveGame,
    kickPlayer,
    startGame,
    submitAnswer,
    revealAnswer,
    nextQuestion,
    openMysteryBox,
    applySpecialFeature,
    selectVehicle,
    resetGame,
    setError,
    setSelectedGameMode,

    // Team actions
    assignPlayerToTeam,
    updateTeamScores,

    // Trap actions
    placeTrap,
    triggerTrap,
    checkTrapCollision,
    spawnRandomTrap,
    handleEscapeTap,

    // Inventory actions
    useInventoryItem,
    addToInventory,
  };
}
