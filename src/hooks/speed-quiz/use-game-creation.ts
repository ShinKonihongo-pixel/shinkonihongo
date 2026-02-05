// Game creation logic

import { useCallback } from 'react';
import type { Flashcard } from '../../types/flashcard';
import type {
  SpeedQuizGame,
  SpeedQuizPlayer,
  SpeedQuizSettings,
  CreateSpeedQuizData,
} from '../../types/speed-quiz';
import { DEFAULT_SPEED_QUIZ_SETTINGS } from '../../types/speed-quiz';
import { generateBots } from '../../types/game-hub';
import { generateId, generateGameCode, convertFlashcardsToQuestions } from './utils';

interface UseGameCreationProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  flashcards: Flashcard[];
  setGame: (game: SpeedQuizGame | null | ((prev: SpeedQuizGame | null) => SpeedQuizGame | null)) => void;
  setGameResults: (results: any) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  botTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

export function useGameCreation({
  currentUser,
  flashcards,
  setGame,
  setGameResults,
  setLoading,
  setError,
  botTimerRef,
}: UseGameCreationProps) {
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
  }, [currentUser, flashcards, setGame, setGameResults, setLoading, setError, botTimerRef]);

  return {
    createGame,
  };
}
