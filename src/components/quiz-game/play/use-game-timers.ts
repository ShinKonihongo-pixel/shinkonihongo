// Custom hook for managing all game timers
import { useState, useEffect } from 'react';
import type { QuizGame, GameQuestion } from '../../../types/quiz-game';
import { useGameSounds } from '../../../hooks/use-game-sounds';

interface UseGameTimersProps {
  game: QuizGame;
  currentQuestion: GameQuestion;
  isHost: boolean;
  onRevealAnswer: () => Promise<void>;
  onNextRound: () => Promise<void>;
  onContinueFromPowerUp: () => Promise<void>;
  onContinueFromLeaderboard: () => Promise<void>;
}

export function useGameTimers({
  game,
  currentQuestion,
  isHost,
  onRevealAnswer,
  onNextRound,
  onContinueFromPowerUp,
  onContinueFromLeaderboard,
}: UseGameTimersProps) {
  const [timeLeft, setTimeLeft] = useState(currentQuestion.timeLimit);
  const [countdown, setCountdown] = useState(3);
  const [revealTimer, setRevealTimer] = useState(5);
  const [powerUpTimer, setPowerUpTimer] = useState(10);

  const { playStart, playCountdown, startMusic, stopMusic, settings: soundSettings } = useGameSounds();

  // Countdown for starting state
  useEffect(() => {
    if (game.status === 'starting') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            playStart();
            return 0;
          }
          playCountdown();
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [game.status, playStart, playCountdown]);

  // Start background music when game starts
  useEffect(() => {
    if (game.status === 'question' && soundSettings.musicEnabled) {
      startMusic();
    }
    return () => {
      if (game.status === 'finished') {
        stopMusic();
      }
    };
  }, [game.status, soundSettings.musicEnabled, startMusic, stopMusic]);

  // Timer for questions
  useEffect(() => {
    if (game.status === 'question' && game.roundStartTime) {
      const updateTimer = () => {
        const elapsed = (Date.now() - game.roundStartTime!) / 1000;
        const remaining = Math.max(0, currentQuestion.timeLimit - elapsed);
        setTimeLeft(Math.ceil(remaining));

        if (remaining <= 0 && isHost) {
          onRevealAnswer();
        }
      };

      updateTimer();
      const timer = setInterval(updateTimer, 100);
      return () => clearInterval(timer);
    }
  }, [game.status, game.roundStartTime, currentQuestion.timeLimit, isHost, onRevealAnswer]);

  // Reset timer when question changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimeLeft(currentQuestion.timeLimit);
  }, [game.currentRound, currentQuestion.timeLimit]);

  // Auto-advance timer for answer reveal (5s)
  useEffect(() => {
    if (game.status === 'answer_reveal') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRevealTimer(5);
      const timer = setInterval(() => {
        setRevealTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            if (isHost) {
              onNextRound();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [game.status, isHost, onNextRound]);

  // Auto-advance timer for power-up selection (10s)
  useEffect(() => {
    if (game.status === 'power_up') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPowerUpTimer(10);
      const timer = setInterval(() => {
        setPowerUpTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            if (isHost) {
              onContinueFromPowerUp();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [game.status, isHost, onContinueFromPowerUp]);

  // Auto-advance timer for leaderboard (5s)
  useEffect(() => {
    if (game.status === 'leaderboard') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRevealTimer(5);
      const timer = setInterval(() => {
        setRevealTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            if (isHost) {
              onContinueFromLeaderboard();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [game.status, isHost, onContinueFromLeaderboard]);

  return {
    timeLeft,
    countdown,
    revealTimer,
    powerUpTimer,
  };
}
