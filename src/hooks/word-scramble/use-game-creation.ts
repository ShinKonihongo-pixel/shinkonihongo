// Word Scramble game creation
// Handles game initialization - writes to Firestore for cross-device multiplayer

import { useCallback, useRef } from 'react';
import type { Flashcard } from '../../types/flashcard';
import type {
  WordScrambleMultiplayerGame,
  WordScrambleMultiplayerPlayer,
  WordScrambleMultiplayerSettings,
  WordScrambleMultiplayerResults,
  WordScrambleRoomQuestion,
  CreateWordScrambleData,
} from '../../components/pages/word-scramble/word-scramble-types';
import { DEFAULT_WORD_SCRAMBLE_MP_SETTINGS } from '../../components/pages/word-scramble/word-scramble-types';
import { generateGameCode, shuffleArray } from '../../lib/game-utils';
import { createGameRoom } from '../../services/game-rooms';
import { scrambleWord } from '../../components/pages/word-scramble/word-scramble-utils';

const MIN_WORD_LENGTH = 3;

interface UseGameCreationProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  flashcards: Flashcard[];
  setGame: (value: WordScrambleMultiplayerGame | null | ((prev: WordScrambleMultiplayerGame | null) => WordScrambleMultiplayerGame | null)) => void;
  setGameResults: (results: WordScrambleMultiplayerResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRoomId: (id: string | null) => void;
  scheduleBotJoin: <TGame extends { status: string; players: Record<string, WordScrambleMultiplayerPlayer> }>(
    setGame: (updater: (prev: TGame | null) => TGame | null) => void,
    maxPlayers: number
  ) => void;
}

export function useGameCreation({
  currentUser,
  flashcards,
  setGame,
  setGameResults,
  setLoading,
  setError,
  setRoomId,
  scheduleBotJoin,
}: UseGameCreationProps) {
  const creatingRef = useRef(false);

  const createGame = useCallback(async (data: CreateWordScrambleData) => {
    if (creatingRef.current) return;
    creatingRef.current = true;

    setLoading(true);
    setError(null);

    try {
      // Filter flashcards by JLPT level and minimum word length
      const available = flashcards.filter(f => {
        const word = f.vocabulary || '';
        if (word.length < MIN_WORD_LENGTH) return false;
        return f.jlptLevel === data.jlptLevel;
      });

      if (available.length < data.totalQuestions) {
        throw new Error(`Cần ít nhất ${data.totalQuestions} từ vựng cấp ${data.jlptLevel}. Hiện có ${available.length} từ.`);
      }

      // Shuffle and pick questions
      const shuffled = shuffleArray(available);
      const selected = shuffled.slice(0, data.totalQuestions);

      // Generate pre-scrambled questions (all players get same scramble)
      const questions: WordScrambleRoomQuestion[] = selected.map(card => {
        const word = card.vocabulary || '';
        const { letters, positions } = scrambleWord(word);
        return {
          vocabulary: word,
          reading: card.reading,
          meaning: card.meaning,
          jlptLevel: card.jlptLevel,
          scrambledLetters: letters,
          originalPositions: positions,
        };
      });

      const settings: WordScrambleMultiplayerSettings = {
        ...DEFAULT_WORD_SCRAMBLE_MP_SETTINGS,
        maxPlayers: data.maxPlayers,
        totalQuestions: data.totalQuestions,
        timePerQuestion: data.timePerQuestion,
        jlptLevel: data.jlptLevel,
      };

      const player: WordScrambleMultiplayerPlayer = {
        odinhId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        role: currentUser.role,
        score: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        streak: 0,
        maxStreak: 0,
      };

      const gameData: Omit<WordScrambleMultiplayerGame, 'id'> = {
        code: generateGameCode(),
        hostId: currentUser.id,
        title: data.title,
        settings,
        status: 'waiting',
        players: { [currentUser.id]: player },
        questions,
        createdAt: new Date().toISOString(),
      };

      const firestoreId = await createGameRoom('word-scramble', gameData as unknown as Record<string, unknown>);

      setRoomId(firestoreId);

      const newGame: WordScrambleMultiplayerGame = { id: firestoreId, ...gameData };
      setGame(newGame);
      setGameResults(null);

      scheduleBotJoin(setGame, data.maxPlayers);
    } catch (err) {
      creatingRef.current = false; // Allow retry on error
      setError(err instanceof Error ? err.message : 'Không thể tạo game');
    } finally {
      setLoading(false);
    }
  }, [currentUser, flashcards, setGame, setGameResults, setLoading, setError, setRoomId, scheduleBotJoin]);

  return { createGame };
}
