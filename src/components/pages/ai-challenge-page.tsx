// AI Challenge Page - Main page for 1v1 Quiz battle against AI
// Orchestrates menu, gameplay, and results screens

import { useCallback, useState } from 'react';
import type { Flashcard } from '../../types/flashcard';
import type { AppSettings } from '../../hooks/use-settings';
import { useSettings } from '../../hooks/use-settings';
import { useAIChallenge, type JLPTLevel } from '../../hooks/use-ai-challenge';
import { AIChallengeMenu } from '../ai-challenge/ai-challenge-menu';
import { AIChallengePlay } from '../ai-challenge/ai-challenge-play';
import { AIChallengeResults } from '../ai-challenge/ai-challenge-results';

interface AIChallengePageProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: 'vip' | 'admin' | 'superadmin' | 'user';
  };
  flashcards: Flashcard[];
  onClose?: () => void;
  settings?: AppSettings;
}

export function AIChallengePage({
  currentUser,
  flashcards,
  onClose,
  settings,
}: AIChallengePageProps) {
  const { settings: appSettings } = useSettings();

  // Get current JLPT level from settings (default to N5)
  const currentLevel: JLPTLevel = (appSettings.aiChallengeLevel === 'all' ? 'N5' : appSettings.aiChallengeLevel) as JLPTLevel;

  // Local state for quick settings (can override app settings)
  const [localSettings, _setLocalSettings] = useState({
    questionCount: settings?.aiChallengeQuestionCount ?? 10,
    timePerQuestion: settings?.aiChallengeTimePerQuestion ?? 15,
    accuracyModifier: settings?.aiChallengeAccuracyModifier ?? 0,
    speedMultiplier: settings?.aiChallengeSpeedMultiplier ?? 1.0,
  });

  const {
    game,
    result,
    currentQuestion,
    aiOpponent,
    progress,
    aiOpponents,
    startGame,
    submitAnswer,
    handleTimeout,
    nextQuestion,
    resetGame,
    rematch,
  } = useAIChallenge({
    currentUser,
    flashcards,
    currentLevel,
    aiSettings: {
      ...localSettings,
      autoAddDifficulty: settings?.aiChallengeAutoAddDifficulty ?? 'random',
    },
  });

  // Handle close/back
  const handleClose = useCallback(() => {
    resetGame();
    onClose?.();
  }, [resetGame, onClose]);

  // Handle select new AI (go back to menu)
  const handleSelectNewAI = useCallback(() => {
    resetGame();
  }, [resetGame]);

  // Show results screen
  if (result && game?.status === 'finished') {
    return (
      <div className="ai-challenge-page">
        <AIChallengeResults
          result={result}
          playerName={currentUser.displayName}
          playerAvatar={currentUser.avatar}
          onRematch={rematch}
          onSelectNewAI={handleSelectNewAI}
          onClose={handleClose}
        />
      </div>
    );
  }

  // Show gameplay screen
  if (game && (game.status === 'countdown' || game.status === 'playing' || game.status === 'answered' || game.status === 'revealing')) {
    return (
      <div className="ai-challenge-page">
        <AIChallengePlay
          game={game}
          currentQuestion={currentQuestion}
          aiOpponent={aiOpponent}
          onSubmitAnswer={submitAnswer}
          onTimeout={handleTimeout}
          onNextQuestion={nextQuestion}
        />
      </div>
    );
  }

  // Show menu/AI selection screen
  return (
    <div className="ai-challenge-page">
      <AIChallengeMenu
        aiOpponents={aiOpponents}
        progress={progress}
        onSelectAI={startGame}
        onClose={handleClose}
      />
    </div>
  );
}
