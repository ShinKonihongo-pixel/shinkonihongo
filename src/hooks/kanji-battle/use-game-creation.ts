// Game creation logic
// Handles game initialization - writes to Firestore for cross-device multiplayer

import { useCallback, useRef } from 'react';
import type {
  KanjiBattleGame,
  KanjiBattlePlayer,
  KanjiBattleSettings,
  KanjiBattleResults,
  CreateKanjiBattleData,
} from '../../types/kanji-battle';
import { DEFAULT_KANJI_BATTLE_SETTINGS } from '../../types/kanji-battle';
import { generateBots } from '../../types/game-hub';
import { generateId, generateGameCode, convertKanjiSeedToQuestions } from './utils';
import { createGameRoom } from '../../services/game-rooms';

interface UseGameCreationProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  setGame: (game: KanjiBattleGame | null | ((prev: KanjiBattleGame | null) => KanjiBattleGame | null)) => void;
  setGameResults: (results: KanjiBattleResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRoomId: (id: string | null) => void;
  botTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

export function useGameCreation({
  currentUser,
  setGame,
  setGameResults,
  setLoading,
  setError,
  setRoomId,
  botTimerRef,
}: UseGameCreationProps) {
  // Guard against concurrent/double creation (StrictMode, async races)
  const creatingRef = useRef(false);

  const createGame = useCallback(async (data: CreateKanjiBattleData) => {
    if (creatingRef.current) return;
    creatingRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const questions = convertKanjiSeedToQuestions(
        data.selectedLevels,
        data.totalRounds,
        data.timePerQuestion,
        data.gameMode
      );

      if (questions.length < 5) {
        throw new Error('Cần ít nhất 5 kanji để chơi. Hãy chọn thêm cấp độ JLPT.');
      }

      const settings: KanjiBattleSettings = {
        ...DEFAULT_KANJI_BATTLE_SETTINGS,
        totalRounds: Math.min(data.totalRounds, questions.length),
        timePerQuestion: data.timePerQuestion,
        maxPlayers: data.maxPlayers,
        skillsEnabled: data.skillsEnabled,
        gameMode: data.gameMode,
        selectedLevels: data.selectedLevels,
      };

      const player: KanjiBattlePlayer = {
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

      const gameData: Omit<KanjiBattleGame, 'id'> = {
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

      // Write to Firestore
      const firestoreId = await createGameRoom('kanji-battle', gameData as Record<string, unknown>);

      // Set room ID first (enables Firestore subscription)
      setRoomId(firestoreId);

      // Set local game state
      const newGame: KanjiBattleGame = { id: firestoreId, ...gameData };
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
      creatingRef.current = false; // Allow retry on error
      setError(err instanceof Error ? err.message : 'Không thể tạo game');
    } finally {
      setLoading(false);
    }
  }, [currentUser, setGame, setGameResults, setLoading, setError, setRoomId, botTimerRef]);

  return { createGame };
}
