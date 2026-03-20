// Quiz Battle game creation
// Filters JLPT questions by level, shuffles answers, stores in Firestore

import { useCallback, useRef } from 'react';
import type {
  QuizBattleGame,
  QuizBattlePlayer,
  QuizBattleQuestion,
  QuizBattleResults,
  CreateQuizBattleRoomData,
} from '../../components/pages/quiz-battle/quiz-battle-types';
import { DEFAULT_QUIZ_BATTLE_SETTINGS } from '../../components/pages/quiz-battle/quiz-battle-types';
import type { JLPTQuestion } from '../../types/jlpt-question';
import type { GameUser, SetGame } from '../shared/game-types';
import { generateGameCode, shuffleArray } from '../../lib/game-utils';
import { createGameRoom } from '../../services/game-rooms';
import { getOrCreateRating } from '../../services/quiz-battle/quiz-battle-service';

interface UseGameCreationProps {
  currentUser: GameUser;
  setGame: SetGame<QuizBattleGame>;
  setGameResults: (results: QuizBattleResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRoomId: (id: string | null) => void;
}

export function useGameCreation({
  currentUser,
  setGame,
  setGameResults,
  setLoading,
  setError,
  setRoomId,
}: UseGameCreationProps) {
  const creatingRef = useRef(false);

  const createGame = useCallback(async (
    data: CreateQuizBattleRoomData,
    jlptQuestions: JLPTQuestion[],
  ) => {
    if (creatingRef.current) return;
    creatingRef.current = true;

    setLoading(true);
    setError(null);

    try {
      // Filter by level, shuffle, take 20
      const filtered = jlptQuestions.filter(q => q.level === data.jlptLevel);
      const sampled = shuffleArray(filtered).slice(0, 20);

      // Build QuizBattleQuestions with shuffled answers
      const questions: QuizBattleQuestion[] = sampled.map(q => {
        const correctAnswer = q.answers.find(a => a.isCorrect)?.text ?? '';
        const wrongAnswers = q.answers.filter(a => !a.isCorrect).map(a => a.text);
        const shuffledOptions = shuffleArray([correctAnswer, ...wrongAnswers]);
        const correctIndex = shuffledOptions.indexOf(correctAnswer);

        return {
          id: q.id,
          sourceId: q.id,
          question: q.question,
          options: shuffledOptions,
          correctIndex,
          timeLimit: DEFAULT_QUIZ_BATTLE_SETTINGS.timePerQuestion,
        };
      });

      // Load rating for host
      const ratingData = await getOrCreateRating(
        currentUser.id,
        currentUser.displayName,
        currentUser.avatar,
      );
      const hostRating = ratingData.ratings[data.jlptLevel] ?? 1000;

      const settings = {
        ...DEFAULT_QUIZ_BATTLE_SETTINGS,
        jlptLevel: data.jlptLevel,
      };

      const player: QuizBattlePlayer = {
        odinhId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        role: currentUser.role,
        score: 0,
        correctCount: 0,
        currentAnswer: null,
        answerTime: null,
        isReady: false,
        rating: hostRating,
      };

      const gameData: Omit<QuizBattleGame, 'id'> = {
        gameType: 'quiz-battle',
        code: generateGameCode(),
        hostId: currentUser.id,
        title: data.title,
        status: 'waiting',
        jlptLevel: data.jlptLevel,
        players: { [currentUser.id]: player },
        questions,
        currentRound: 0,
        roundStartTime: null,
        settings,
        createdAt: new Date().toISOString(),
      };

      const firestoreId = await createGameRoom('quiz-battle', gameData as unknown as Record<string, unknown>);

      setRoomId(firestoreId);
      setGame({ id: firestoreId, ...gameData });
      setGameResults(null);
    } catch (err) {
      creatingRef.current = false;
      setError(err instanceof Error ? err.message : 'Không thể tạo game');
    } finally {
      creatingRef.current = false;
      setLoading(false);
    }
  }, [currentUser, setGame, setGameResults, setLoading, setError, setRoomId]);

  return { createGame };
}
