// Golden Bell Game Creation
// Handles game initialization and setup

import { useCallback } from 'react';
import type {
  GoldenBellGame,
  GoldenBellPlayer,
  GoldenBellResults,
  GoldenBellSettings,
  CreateGoldenBellData,
} from '../../types/golden-bell';
import type { Flashcard } from '../../types/flashcard';
import { generateId, generateGameCode } from '../../lib/game-utils';
import { convertFlashcardsToQuestions } from './utils';

interface UseGameCreationProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
  };
  setGame: (game: GoldenBellGame | null) => void;
  setGameResults: (results: GoldenBellResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
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
  flashcards,
  scheduleBotJoin,
}: UseGameCreationProps) {
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

      // Schedule bot auto-join
      scheduleBotJoin(setGame, data.maxPlayers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo trò chơi');
    } finally {
      setLoading(false);
    }
  }, [currentUser, flashcards, scheduleBotJoin, setGame, setGameResults, setLoading, setError]);

  return { createGame };
}
