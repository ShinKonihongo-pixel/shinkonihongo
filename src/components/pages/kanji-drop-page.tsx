// Kanji Drop page — top-level orchestrator for setup/playing/result phases

import { useEffect, useRef } from 'react';
import type { KanjiCard } from '../../types/kanji';
import { useKanjiDropGame } from './kanji-drop/use-kanji-drop-game';
import { SetupScreen } from './kanji-drop/setup-screen';
import { PlayingScreen } from './kanji-drop/playing-screen';
import { ResultScreen } from './kanji-drop/result-screen';
import { TutorialOverlay } from './kanji-drop/tutorial-overlay';
import './kanji-drop/kanji-drop.css';

export interface KanjiDropPageProps {
  onClose: () => void;
  kanjiCards: KanjiCard[];
  currentUser?: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  onSaveGameSession?: (data: {
    date: string;
    gameTitle: string;
    rank: number;
    totalPlayers: number;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
  }) => void;
}

export function KanjiDropPage({
  onClose, kanjiCards, currentUser, onSaveGameSession,
}: KanjiDropPageProps) {
  const {
    setupConfig, setSetupConfig, availableKanji, countByLevel, toggleLevel,
    gameState, isVip,
    startGame, pickTile, usePowerUp, nextLevel, resetGame,
  } = useKanjiDropGame({ kanjiCards, currentUser });

  const sessionSaved = useRef(false);

  // Save game session on result
  useEffect(() => {
    if (gameState.phase === 'result' && !sessionSaved.current && onSaveGameSession) {
      sessionSaved.current = true;
      onSaveGameSession({
        date: new Date().toISOString().split('T')[0],
        gameTitle: 'Kanji Drop',
        rank: gameState.result === 'win' ? 1 : 2,
        totalPlayers: 1,
        score: gameState.score,
        correctAnswers: gameState.clearedCount,
        totalQuestions: gameState.pool.length,
      });
    }
    if (gameState.phase !== 'result') sessionSaved.current = false;
  }, [gameState.phase, gameState.result, gameState.score, gameState.clearedCount, gameState.pool.length, onSaveGameSession]);

  return (
    <div className="kd-page">
      {/* Tutorial overlay — shows on first visit */}
      {gameState.phase === 'playing' && <TutorialOverlay onDismiss={() => {}} />}

      {gameState.phase === 'setup' && (
        <SetupScreen
          config={setupConfig}
          availableKanjiCount={availableKanji.length}
          countByLevel={countByLevel}
          isVip={isVip}
          onClose={onClose}
          onStart={startGame}
          onToggleLevel={toggleLevel}
          onSetStartLevel={(level) => setSetupConfig(prev => ({ ...prev, startLevel: level }))}
        />
      )}

      {gameState.phase === 'playing' && (
        <PlayingScreen
          gameState={gameState}
          onPickTile={pickTile}
          onUsePowerUp={usePowerUp}
          onClose={onClose}
        />
      )}

      {gameState.phase === 'result' && (
        <ResultScreen
          gameState={gameState}
          onNextLevel={nextLevel}
          onReplay={resetGame}
          onClose={onClose}
        />
      )}
    </div>
  );
}
