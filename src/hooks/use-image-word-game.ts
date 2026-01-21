// Image-Word Game Hook
// Manages game state, matching logic, and scoring

import { useState, useCallback, useMemo } from 'react';
import type {
  ImageWordLesson,
  ImageWordGameState,
  ImageWordGameResult,
} from '../types/image-word';
import { getImageWordLessons } from '../services/image-word-storage';

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Scoring constants
const POINTS_PER_MATCH = 100;
const WRONG_PENALTY = 10;
const TIME_BONUS_THRESHOLD = 60000; // 1 minute
const TIME_BONUS_MULTIPLIER = 0.5;

interface UseImageWordGameReturn {
  // Data
  lessons: ImageWordLesson[];
  gameState: ImageWordGameState | null;
  gameResult: ImageWordGameResult | null;

  // State
  wrongAnimation: { imageId: string; wordId: string } | null;

  // Actions
  loadLessons: () => void;
  startGame: (lesson: ImageWordLesson) => void;
  selectImage: (pairId: string) => void;
  selectWord: (pairId: string) => void;
  resetGame: () => void;

  // Computed
  isComplete: boolean;
  progress: number;
}

export function useImageWordGame(): UseImageWordGameReturn {
  // State
  const [lessons, setLessons] = useState<ImageWordLesson[]>([]);
  const [gameState, setGameState] = useState<ImageWordGameState | null>(null);
  const [gameResult, setGameResult] = useState<ImageWordGameResult | null>(null);
  const [wrongAnimation, setWrongAnimation] = useState<{ imageId: string; wordId: string } | null>(null);

  // Load lessons from storage
  const loadLessons = useCallback(() => {
    const data = getImageWordLessons();
    setLessons(data);
  }, []);

  // Start new game with selected lesson
  const startGame = useCallback((lesson: ImageWordLesson) => {
    if (lesson.pairs.length === 0) return;

    const state: ImageWordGameState = {
      lesson,
      shuffledImages: shuffleArray(lesson.pairs),
      shuffledWords: shuffleArray(lesson.pairs),
      selectedImage: null,
      selectedWord: null,
      matchedPairs: [],
      wrongAttempts: 0,
      startTime: Date.now(),
      isComplete: false,
    };

    setGameState(state);
    setGameResult(null);
  }, []);

  // Check if two selections match
  const checkMatch = useCallback((imageId: string, wordId: string): boolean => {
    return imageId === wordId;
  }, []);

  // Calculate final score
  const calculateScore = useCallback((
    totalPairs: number,
    wrongAttempts: number,
    timeMs: number
  ): number => {
    const baseScore = totalPairs * POINTS_PER_MATCH;
    const penalty = wrongAttempts * WRONG_PENALTY;
    const timeBonus = timeMs < TIME_BONUS_THRESHOLD
      ? Math.floor((TIME_BONUS_THRESHOLD - timeMs) * TIME_BONUS_MULTIPLIER / 1000)
      : 0;
    return Math.max(0, baseScore - penalty + timeBonus);
  }, []);

  // Complete game and calculate results
  const completeGame = useCallback((state: ImageWordGameState) => {
    const endTime = Date.now();
    const timeMs = endTime - state.startTime;
    const totalPairs = state.lesson.pairs.length;
    const correctMatches = state.matchedPairs.length;

    const result: ImageWordGameResult = {
      lessonId: state.lesson.id,
      lessonName: state.lesson.name,
      totalPairs,
      correctMatches,
      wrongAttempts: state.wrongAttempts,
      timeMs,
      score: calculateScore(totalPairs, state.wrongAttempts, timeMs),
      accuracy: Math.round((correctMatches / totalPairs) * 100),
      completedAt: endTime,
    };

    setGameResult(result);
    setGameState(prev => prev ? { ...prev, isComplete: true, endTime } : null);
  }, [calculateScore]);

  // Process match attempt
  const processMatch = useCallback((imageId: string, wordId: string) => {
    if (!gameState) return;

    const isMatch = checkMatch(imageId, wordId);

    if (isMatch) {
      // Successful match
      const newMatchedPairs = [...gameState.matchedPairs, imageId];
      const newState: ImageWordGameState = {
        ...gameState,
        matchedPairs: newMatchedPairs,
        selectedImage: null,
        selectedWord: null,
      };

      // Check if game is complete
      if (newMatchedPairs.length === gameState.lesson.pairs.length) {
        completeGame({ ...newState, matchedPairs: newMatchedPairs });
      } else {
        setGameState(newState);
      }
    } else {
      // Wrong match - show animation
      setWrongAnimation({ imageId, wordId });

      setGameState(prev => prev ? {
        ...prev,
        wrongAttempts: prev.wrongAttempts + 1,
        selectedImage: null,
        selectedWord: null,
      } : null);

      // Clear wrong animation after delay
      setTimeout(() => {
        setWrongAnimation(null);
      }, 500);
    }
  }, [gameState, checkMatch, completeGame]);

  // Select an image
  const selectImage = useCallback((pairId: string) => {
    if (!gameState || gameState.isComplete) return;
    if (gameState.matchedPairs.includes(pairId)) return;

    // If word is already selected, check match
    if (gameState.selectedWord) {
      processMatch(pairId, gameState.selectedWord);
    } else {
      // Just select the image
      setGameState(prev => prev ? { ...prev, selectedImage: pairId } : null);
    }
  }, [gameState, processMatch]);

  // Select a word
  const selectWord = useCallback((pairId: string) => {
    if (!gameState || gameState.isComplete) return;
    if (gameState.matchedPairs.includes(pairId)) return;

    // If image is already selected, check match
    if (gameState.selectedImage) {
      processMatch(gameState.selectedImage, pairId);
    } else {
      // Just select the word
      setGameState(prev => prev ? { ...prev, selectedWord: pairId } : null);
    }
  }, [gameState, processMatch]);

  // Reset game
  const resetGame = useCallback(() => {
    setGameState(null);
    setGameResult(null);
    setWrongAnimation(null);
  }, []);

  // Computed values
  const isComplete = useMemo(() => gameState?.isComplete ?? false, [gameState]);

  const progress = useMemo(() => {
    if (!gameState) return 0;
    return Math.round((gameState.matchedPairs.length / gameState.lesson.pairs.length) * 100);
  }, [gameState]);

  return {
    lessons,
    gameState,
    gameResult,
    wrongAnimation,
    loadLessons,
    startGame,
    selectImage,
    selectWord,
    resetGame,
    isComplete,
    progress,
  };
}
