import { useEffect, useRef } from 'react';
import type { GameState } from './word-scramble-types';

interface UseGameTimerProps {
  gameState: GameState;
  timePerQuestion: number;
  onTimerTick: (callback: (prev: GameState) => GameState) => void;
}

export const useGameTimer = ({ gameState, timePerQuestion, onTimerTick }: UseGameTimerProps) => {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer effect with auto-hints (45%, 60%, 75%)
  useEffect(() => {
    if (gameState.phase === 'playing' && !gameState.showResult) {
      timerRef.current = setInterval(() => {
        onTimerTick(prev => {
          const newTimeRemaining = prev.timeRemaining - 1;
          const timePercent = 1 - (newTimeRemaining / timePerQuestion);
          const currentQuestion = prev.questions[prev.currentQuestionIndex];

          // Auto hints at 45%, 60%, 75%
          let newHints = { ...prev.hints };
          if (currentQuestion) {
            const word = currentQuestion.word;
            const vocab = word.vocabulary || '';

            // Hint 1 at 45% time - Sino-Vietnamese/Meaning
            if (timePercent >= 0.45 && !prev.hints.hint1Shown) {
              newHints = {
                ...newHints,
                hint1Shown: true,
                hint1Content: word.sinoVietnamese || word.meaning?.split(',')[0] || 'Không có',
              };
            }
            // Hint 2 at 60% time - Word count and first letter
            if (timePercent >= 0.60 && !prev.hints.hint2Shown) {
              newHints = {
                ...newHints,
                hint2Shown: true,
                hint2Content: `Bắt đầu bằng "${vocab[0]}"`,
              };
            }
            // Hint 3 at 75% time - Last letter
            if (timePercent >= 0.75 && !prev.hints.hint3Shown) {
              newHints = {
                ...newHints,
                hint3Shown: true,
                hint3Content: `Kết thúc bằng "${vocab[vocab.length - 1]}"`,
              };
            }
          }

          if (newTimeRemaining <= 0) {
            return {
              ...prev,
              timeRemaining: 0,
              isCorrect: false,
              showResult: true,
              wrongAnswers: prev.wrongAnswers + 1,
              totalTime: prev.totalTime + timePerQuestion,
              streak: 0,
              hints: newHints,
            };
          }
          return { ...prev, timeRemaining: newTimeRemaining, hints: newHints };
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState.phase, gameState.showResult, timePerQuestion, onTimerTick]);
};
