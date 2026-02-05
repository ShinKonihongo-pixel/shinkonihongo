// Game creation logic
import { useCallback } from 'react';
import type {
  RacingGame,
  RacingGameSettings,
  RacingPlayer,
  CreateRacingGameData,
  RacingVehicle,
} from '../../types/racing-game';
import { DEFAULT_VEHICLES, DEFAULT_TRACK_ZONES } from '../../types/racing-game';
import type { Flashcard } from '../../types/flashcard';
import { generateGameCode, generateId, createTeams, convertFlashcardsToQuestions } from './utils';
import { BOT_FIRST_JOIN_DELAY, BOT_SECOND_JOIN_DELAY } from './constants';
import { addBotsToGame } from './bot-helpers';

interface UseGameCreationProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  flashcards: Flashcard[];
  selectedVehicle: RacingVehicle;
  setGame: React.Dispatch<React.SetStateAction<RacingGame | null>>;
  setAvailableRooms: React.Dispatch<React.SetStateAction<RacingGame[]>>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  botTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  botTimer2Ref: React.MutableRefObject<NodeJS.Timeout | null>;
}

export function useGameCreation({
  currentUser,
  flashcards,
  selectedVehicle,
  setGame,
  setAvailableRooms,
  setLoading,
  setError,
  botTimerRef,
  botTimer2Ref,
}: UseGameCreationProps) {
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

      // Clear existing bot timers
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      if (botTimer2Ref.current) clearTimeout(botTimer2Ref.current);

      // Schedule bot additions
      botTimerRef.current = setTimeout(() => {
        setGame(prev => addBotsToGame(prev, 1));
      }, BOT_FIRST_JOIN_DELAY);

      botTimer2Ref.current = setTimeout(() => {
        setGame(prev => addBotsToGame(prev, 2));
      }, BOT_SECOND_JOIN_DELAY);

      return newGame;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi tạo game';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser, flashcards, selectedVehicle, setGame, setAvailableRooms, setLoading, setError, botTimerRef, botTimer2Ref]);

  return { createGame };
}
