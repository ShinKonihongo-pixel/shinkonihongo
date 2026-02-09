import { useState, useCallback, useMemo } from 'react';
import type { Flashcard, JLPTLevel } from '../../../types/flashcard';
import type { GameConfig, Question, Player, GameState } from './word-scramble-types';
import { DEFAULT_TIME, DEFAULT_QUESTIONS, MIN_WORD_LENGTH, AUTO_FILL_PENALTIES } from './word-scramble-constants';
import { scrambleWord, calculateScore, generateBots } from './word-scramble-utils';
import { useGameSounds } from '../../../hooks/use-game-sounds';

interface CurrentUser {
  id: string;
  displayName?: string;
  avatar?: string;
  role?: string;
}

interface UseWordScrambleGameProps {
  flashcards: Flashcard[];
  currentUser?: CurrentUser;
}

export const useWordScrambleGame = ({ flashcards, currentUser }: UseWordScrambleGameProps) => {
  // Config state
  const [config, setConfig] = useState<GameConfig>({
    selectedLevels: ['N5'],
    timePerQuestion: DEFAULT_TIME,
    totalQuestions: DEFAULT_QUESTIONS,
  });

  // Initial game state - memoized to prevent recreation on every render
  const initialGameState = useMemo<GameState>(() => ({
    phase: 'setup',
    currentQuestionIndex: 0,
    questions: [],
    score: 0,
    totalTime: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    questionStartTime: 0,
    timeRemaining: DEFAULT_TIME,
    selectedLetters: [],
    hints: { hint1Shown: false, hint2Shown: false, hint3Shown: false, hint1Content: '', hint2Content: '', hint3Content: '' },
    isCorrect: null,
    showResult: false,
    streak: 0,
    maxStreak: 0,
    players: [],
    autoFillUsed: 0,
    autoFilledPositions: [],
    isSoloMode: false,
  }), []);

  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const { playCorrect, playWrong, playVictory } = useGameSounds();

  // Filter flashcards
  const availableFlashcards = useMemo(() => {
    return flashcards.filter(f => {
      const word = f.vocabulary || '';
      if (word.length < MIN_WORD_LENGTH) return false;
      if (config.selectedLevels.length === 0) return true;
      return config.selectedLevels.includes(f.jlptLevel as JLPTLevel);
    });
  }, [flashcards, config.selectedLevels]);

  // Count by level
  const countByLevel = useMemo(() => {
    const counts: Record<string, number> = {};
    const validCards = flashcards.filter(f => (f.vocabulary || '').length >= MIN_WORD_LENGTH);
    const levels = ['N5', 'N4', 'N3', 'N2', 'N1'] as JLPTLevel[];
    levels.forEach(level => {
      counts[level] = validCards.filter(f => f.jlptLevel === level).length;
    });
    return counts;
  }, [flashcards]);

  // Generate questions
  const generateQuestions = useCallback((cards: Flashcard[], count: number): Question[] => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));
    return selected.map(card => {
      const word = card.vocabulary || '';
      const { letters, positions } = scrambleWord(word);
      return { word: card, scrambledLetters: letters, originalPositions: positions };
    });
  }, []);

  // Start game (solo mode)
  const startSoloGame = useCallback(() => {
    if (availableFlashcards.length < 3) {
      alert('Cần ít nhất 3 từ vựng để chơi!');
      return;
    }

    const questions = generateQuestions(availableFlashcards, config.totalQuestions);
    const currentPlayer: Player = {
      id: currentUser?.id || 'user',
      name: currentUser?.displayName || 'Bạn',
      avatar: currentUser?.avatar || '👤',
      score: 0,
      correctAnswers: 0,
      isCurrentUser: true,
      role: currentUser?.role || 'user',
    };

    setGameState({
      ...initialGameState,
      phase: 'playing',
      questions,
      questionStartTime: Date.now(),
      timeRemaining: config.timePerQuestion,
      players: [currentPlayer],
      isSoloMode: true,
    });
  }, [availableFlashcards, config, generateQuestions, currentUser, initialGameState]);

  // Start game (with bots)
  const startMultiplayerGame = useCallback(() => {
    if (availableFlashcards.length < 3) {
      alert('Cần ít nhất 3 từ vựng để chơi!');
      return;
    }

    const questions = generateQuestions(availableFlashcards, config.totalQuestions);
    const bots = generateBots(4);
    const currentPlayer: Player = {
      id: currentUser?.id || 'user',
      name: currentUser?.displayName || 'Bạn',
      avatar: currentUser?.avatar || '👤',
      score: 0,
      correctAnswers: 0,
      isCurrentUser: true,
      role: currentUser?.role || 'user',
    };

    setGameState({
      ...initialGameState,
      phase: 'playing',
      questions,
      questionStartTime: Date.now(),
      timeRemaining: config.timePerQuestion,
      players: [currentPlayer, ...bots],
      isSoloMode: false,
    });
  }, [availableFlashcards, config, generateQuestions, currentUser, initialGameState]);

  // Handle letter click
  const handleLetterClick = useCallback((index: number) => {
    if (gameState.showResult) return;
    setGameState(prev => {
      const newSelected = [...prev.selectedLetters];
      const existingIndex = newSelected.indexOf(index);
      if (existingIndex !== -1) {
        if (prev.autoFilledPositions.includes(existingIndex)) return prev;
        newSelected.splice(existingIndex, 1);
      } else {
        newSelected.push(index);
      }
      return { ...prev, selectedLetters: newSelected };
    });
  }, [gameState.showResult]);

  // Auto-fill one random letter
  const handleAutoFill = useCallback(() => {
    if (gameState.autoFillUsed >= 3 || gameState.showResult) return;

    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    if (!currentQuestion) return;

    const correctWord = currentQuestion.word.vocabulary || '';
    const wordLength = correctWord.length;

    const emptyPositions: number[] = [];
    for (let i = 0; i < wordLength; i++) {
      if (gameState.selectedLetters[i] === undefined) {
        emptyPositions.push(i);
      }
    }

    if (emptyPositions.length === 0) return;

    const randomPos = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
    const correctLetter = correctWord[randomPos];

    const scrambledIndex = currentQuestion.scrambledLetters.findIndex((letter, idx) =>
      letter === correctLetter && !gameState.selectedLetters.includes(idx)
    );

    if (scrambledIndex === -1) return;

    setGameState(prev => {
      const newSelected = [...prev.selectedLetters];
      while (newSelected.length < randomPos) {
        newSelected.push(-1);
      }
      newSelected[randomPos] = scrambledIndex;

      return {
        ...prev,
        selectedLetters: newSelected,
        autoFillUsed: prev.autoFillUsed + 1,
        autoFilledPositions: [...prev.autoFilledPositions, randomPos],
      };
    });
  }, [gameState]);

  // Calculate current penalty
  const getCurrentPenalty = useCallback(() => {
    let totalPenalty = 0;
    for (let i = 0; i < gameState.autoFillUsed; i++) {
      totalPenalty += AUTO_FILL_PENALTIES[i];
    }
    return totalPenalty;
  }, [gameState.autoFillUsed]);

  // Check answer
  const checkAnswer = useCallback(() => {
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    if (!currentQuestion) return;

    const correctWord = currentQuestion.word.vocabulary || '';
    const userWord = gameState.selectedLetters
      .map(i => i >= 0 ? currentQuestion.scrambledLetters[i] : '')
      .join('');

    const isCorrect = userWord === correctWord;
    const timeUsed = config.timePerQuestion - gameState.timeRemaining;
    const newStreak = isCorrect ? gameState.streak + 1 : 0;
    const penalty = getCurrentPenalty();
    const scoreGained = isCorrect ? calculateScore(gameState.timeRemaining, config.timePerQuestion, gameState.streak, penalty) : 0;

    if (isCorrect) playCorrect();
    else playWrong();

    const updatedPlayers = gameState.players.map(p => {
      if (p.isCurrentUser) {
        return {
          ...p,
          score: p.score + scoreGained,
          correctAnswers: isCorrect ? p.correctAnswers + 1 : p.correctAnswers,
        };
      }
      if (gameState.isSoloMode) return p;
      const botCorrect = Math.random() > 0.4;
      const botScore = botCorrect ? Math.floor(Math.random() * 150) + 50 : 0;
      return {
        ...p,
        score: p.score + botScore,
        correctAnswers: botCorrect ? p.correctAnswers + 1 : p.correctAnswers,
      };
    });

    setGameState(prev => ({
      ...prev,
      isCorrect,
      showResult: true,
      score: prev.score + scoreGained,
      totalTime: prev.totalTime + timeUsed,
      correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
      wrongAnswers: isCorrect ? prev.wrongAnswers : prev.wrongAnswers + 1,
      streak: newStreak,
      maxStreak: Math.max(prev.maxStreak, newStreak),
      players: updatedPlayers.sort((a, b) => b.score - a.score),
    }));
  }, [gameState, config.timePerQuestion, playCorrect, playWrong, getCurrentPenalty]);

  // Next question
  const nextQuestion = useCallback(() => {
    const nextIndex = gameState.currentQuestionIndex + 1;
    if (nextIndex >= gameState.questions.length) {
      playVictory();
      setGameState(prev => ({ ...prev, phase: 'result' }));
      return;
    }
    setGameState(prev => ({
      ...prev,
      currentQuestionIndex: nextIndex,
      questionStartTime: Date.now(),
      timeRemaining: config.timePerQuestion,
      selectedLetters: [],
      hints: { hint1Shown: false, hint2Shown: false, hint3Shown: false, hint1Content: '', hint2Content: '', hint3Content: '' },
      isCorrect: null,
      showResult: false,
      autoFillUsed: 0,
      autoFilledPositions: [],
    }));
  }, [gameState, config.timePerQuestion, playVictory]);

  // Reset game
  const resetGame = useCallback(() => {
    setGameState(initialGameState);
  }, [initialGameState]);

  // Toggle level selection
  const toggleLevel = (level: JLPTLevel) => {
    setConfig(prev => {
      const newLevels = prev.selectedLevels.includes(level)
        ? prev.selectedLevels.filter(l => l !== level)
        : [...prev.selectedLevels, level];
      return { ...prev, selectedLevels: newLevels };
    });
  };

  return {
    config,
    setConfig,
    gameState,
    setGameState,
    availableFlashcards,
    countByLevel,
    startSoloGame,
    startMultiplayerGame,
    handleLetterClick,
    handleAutoFill,
    getCurrentPenalty,
    checkAnswer,
    nextQuestion,
    resetGame,
    toggleLevel,
  };
};
