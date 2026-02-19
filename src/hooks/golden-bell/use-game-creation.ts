// Golden Bell Game Creation
// Handles game initialization - writes to Firestore for cross-device multiplayer

import { useCallback } from 'react';
import type {
  GoldenBellGame,
  GoldenBellPlayer,
  GoldenBellResults,
  GoldenBellSettings,
  CreateGoldenBellData,
} from '../../types/golden-bell';
import type { Flashcard } from '../../types/flashcard';
import { generateGameCode } from '../../lib/game-utils';
import { createGameRoom } from '../../services/game-rooms';
import { convertFlashcardsToQuestions, createGoldenBellTeams } from './utils';
import { generateGoldenBellSoloBotSchedules } from '../shared/use-bot-auto-join';

interface UseGameCreationProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  setGame: (value: GoldenBellGame | null | ((prev: GoldenBellGame | null) => GoldenBellGame | null)) => void;
  setGameResults: (results: GoldenBellResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRoomId: (id: string | null) => void;
  flashcards: Flashcard[];
  scheduleBotJoin: (
    setGame: (updater: (prev: any) => any) => void,
    maxPlayers: number
  ) => void;
}

export function useGameCreation({
  currentUser,
  setGame,
  setGameResults,
  setLoading,
  setError,
  setRoomId,
  flashcards,
  scheduleBotJoin,
}: UseGameCreationProps) {
  const createGame = useCallback(async (data: CreateGoldenBellData) => {
    setLoading(true);
    setError(null);

    try {
      // Filter flashcards by selected JLPT level
      const filteredCards = flashcards.filter(c => c.jlptLevel === data.jlptLevel);

      if (filteredCards.length < data.questionCount) {
        throw new Error(`Không đủ câu hỏi. Cần ${data.questionCount}, chỉ có ${filteredCards.length} câu ở ${data.jlptLevel}`);
      }

      const questions = convertFlashcardsToQuestions(
        filteredCards,
        data.questionCount,
        data.timePerQuestion,
        data.difficultyProgression
      );

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
        gameMode: data.gameMode || 'solo',
        skillsEnabled: data.skillsEnabled ?? true, // Always enabled by default
        skillInterval: data.skillInterval ?? 5,
      };

      // Create teams for team mode
      const teams = (data.gameMode === 'team' && data.teamCount)
        ? createGoldenBellTeams(data.teamCount)
        : undefined;

      const player: GoldenBellPlayer = {
        odinhId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        role: currentUser.role,
        status: 'alive',
        correctAnswers: 0,
        totalAnswers: 0,
        streak: 0,
        skills: [],
      };

      const gameData: Omit<GoldenBellGame, 'id'> = {
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
        teams,
      };

      // Write to Firestore
      const firestoreId = await createGameRoom('golden-bell', gameData as unknown as Record<string, unknown>);

      // Set room ID first (enables Firestore subscription)
      setRoomId(firestoreId);

      // Set local game state
      const newGame: GoldenBellGame = { id: firestoreId, ...gameData };
      setGame(newGame);
      setGameResults(null);

      // Auto-assign host to first team in team mode
      if (teams) {
        const firstTeamId = Object.keys(teams)[0];
        if (firstTeamId) {
          setGame(prev => {
            if (!prev || !prev.teams) return prev;
            const updatedTeams = { ...prev.teams };
            updatedTeams[firstTeamId] = {
              ...updatedTeams[firstTeamId],
              members: [currentUser.id],
              aliveCount: 1,
            };
            return {
              ...prev,
              teams: updatedTeams,
              players: {
                ...prev.players,
                [currentUser.id]: { ...prev.players[currentUser.id], teamId: firstTeamId },
              },
            };
          });
        }
      }

      // Schedule bot auto-join (respect settings toggle, use staggered schedules for solo)
      const botAutoJoinEnabled = localStorage.getItem('gb_bot_auto_join') !== 'false';
      if (botAutoJoinEnabled) {
        const botSchedules = (data.gameMode || 'solo') === 'solo'
          ? generateGoldenBellSoloBotSchedules()
          : undefined; // team mode uses default schedules
        scheduleBotJoin(setGame, data.maxPlayers, botSchedules);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo trò chơi');
    } finally {
      setLoading(false);
    }
  }, [currentUser, flashcards, scheduleBotJoin, setGame, setGameResults, setLoading, setError, setRoomId]);

  return { createGame };
}
