// Kanji Drop page — dual-mode orchestrator
// Single-player: setup → play → result (existing)
// Multiplayer: auto-create/join → lobby → play → results

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { KanjiCard } from '../../types/kanji';
import type { GameSession } from '../../types/user';
import type { JLPTLevel } from '../../types/flashcard';
import { useLessons } from '../../hooks/use-lessons';
import { useKanjiDropGame } from './kanji-drop/use-kanji-drop-game';
import type { MultiplayerConfig } from './kanji-drop/use-kanji-drop-game';
import { useKanjiDropMultiplayer } from '../../hooks/kanji-drop';
import { SetupScreen } from './kanji-drop/setup-screen';
import { PlayingScreen } from './kanji-drop/playing-screen';
import { ResultScreen } from './kanji-drop/result-screen';
import { TutorialOverlay } from './kanji-drop/tutorial-overlay';
import { KanjiDropLobby } from '../kanji-drop/kanji-drop-lobby';
import { MultiplayerProgressBar } from './kanji-drop/multiplayer-progress-bar';
import { MultiplayerResultScreen } from './kanji-drop/multiplayer-result-screen';
import './kanji-drop/kanji-drop.css';

type PageView = 'setup' | 'lobby' | 'play' | 'results';

export interface KanjiDropPageProps {
  onClose: () => void;
  kanjiCards: KanjiCard[];
  currentUser?: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  onSaveGameSession?: (data: Omit<GameSession, 'id' | 'userId'>) => void;
  initialRoomConfig?: Record<string, unknown>;
  initialJoinCode?: string;
}

export function KanjiDropPage({
  onClose, kanjiCards, currentUser = { id: 'user-1', displayName: 'Player', avatar: '🀄' },
  onSaveGameSession, initialRoomConfig, initialJoinCode,
}: KanjiDropPageProps) {
  const isMultiplayerMode = !!(initialRoomConfig || initialJoinCode);
  const [view, setView] = useState<PageView>(isMultiplayerMode ? 'lobby' : 'setup');
  const sessionSaved = useRef(false);
  const createOnceRef = useRef(false);
  const gameStartedRef = useRef(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // --- Multiplayer hook ---
  const mp = useKanjiDropMultiplayer({ currentUser });

  // Build multiplayer config for game engine (when MP game is playing)
  const multiplayerConfig: MultiplayerConfig | undefined = useMemo(() => {
    if (!mp.game || mp.game.status !== 'playing') return undefined;
    return {
      seed: mp.game.settings.seed,
      levelStart: mp.game.settings.levelStart,
      levelEnd: mp.game.settings.levelEnd,
      jlptLevels: mp.game.settings.jlptLevels,
      selectedLessons: mp.game.settings.selectedLessons,
    };
  }, [mp.game]);

  // --- Lesson names (for setup screen display) ---
  const { lessons: allLessons } = useLessons();
  const lessonNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const l of allLessons) {
      map[l.id] = l.name;
    }
    return map;
  }, [allLessons]);

  // --- Single-player + local game engine ---
  const {
    setupConfig, setSetupConfig, availableKanji, countByLevel, kanjiLessons,
    toggleLevel, toggleLesson,
    gameState, isVip,
    startGame, startMultiplayerGame, pickTile, usePowerUp, nextLevel, resetGame,
  } = useKanjiDropGame({ kanjiCards, currentUser, multiplayerConfig });

  // --- Auto-create room from Game Hub modal ---
  useEffect(() => {
    if (initialRoomConfig && !mp.game && !createOnceRef.current) {
      createOnceRef.current = true;
      const cfg = initialRoomConfig;
      mp.createGame({
        title: (cfg.title as string) || 'Kanji Drop',
        maxPlayers: (cfg.maxPlayers as number) || 4,
        levelStart: (cfg.levelStart as number) || 1,
        levelEnd: (cfg.levelEnd as number) || (cfg.totalRounds as number) || 10,
        jlptLevels: (cfg.jlptLevel ? [cfg.jlptLevel as JLPTLevel] : ['N5']) as JLPTLevel[],
        selectedLessons: (cfg.selectedLessons as string[] | undefined),
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Auto-join from QR/code ---
  useEffect(() => {
    if (initialJoinCode && !mp.game && !createOnceRef.current) {
      createOnceRef.current = true;
      mp.joinGame(initialJoinCode).catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Bridge: when MP game starts playing, init local engine ---
  useEffect(() => {
    if (mp.game?.status === 'playing' && !gameStartedRef.current) {
      gameStartedRef.current = true;
      startMultiplayerGame();
    }
    if (!mp.game || mp.game.status === 'waiting') {
      gameStartedRef.current = false;
    }
  }, [mp.game, startMultiplayerGame]);

  // --- Sync local progress to Firestore ---
  useEffect(() => {
    if (!isMultiplayerMode || !mp.game || mp.game.status !== 'playing') return;
    if (gameState.phase === 'playing' || gameState.phase === 'result') {
      const isAllDone = gameState.mode === 'multi'
        && gameState.result === 'win'
        && gameState.levelEnd
        && gameState.level >= gameState.levelEnd;

      mp.syncProgress({
        currentLevel: gameState.level,
        score: gameState.score,
        clearedCount: gameState.clearedCount,
        levelsCompleted: gameState.levelsCompleted || 0,
        finished: isAllDone,
      });
    }
  }, [gameState.level, gameState.score, gameState.clearedCount, gameState.levelsCompleted, gameState.phase, gameState.result, gameState.mode, gameState.levelEnd, isMultiplayerMode, mp]);

  // --- Update view based on MP game status ---
  useEffect(() => {
    if (!isMultiplayerMode || !mp.game) return;

    if (mp.game.status === 'finished') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setView('results');
    } else if (mp.game.status === 'starting' || mp.game.status === 'playing') {
      setView('play');
    } else if (mp.game.status === 'waiting') {
      setView('lobby');
    }
  }, [mp.game, isMultiplayerMode]);

  // --- Handlers ---
  const handleStartGame = useCallback(() => {
    mp.startGame();
    setView('play');
  }, [mp]);

  const handleLeaveGame = useCallback(() => {
    setIsLeaving(true);
    mp.leaveGame();
    resetGame();
    onClose();
  }, [mp, resetGame, onClose]);

  const handleAddBot = useCallback(() => {
    mp.addBot();
  }, [mp]);

  const handlePlayAgain = useCallback(() => {
    resetGame();
    mp.resetGame();
    onClose();
  }, [resetGame, mp, onClose]);

  // --- Save game session ---
  useEffect(() => {
    if (gameState.phase === 'result' && !sessionSaved.current && onSaveGameSession) {
      sessionSaved.current = true;
      onSaveGameSession({
        date: new Date().toISOString().split('T')[0],
        gameTitle: 'Kanji Drop',
        rank: gameState.result === 'win' ? 1 : 2,
        totalPlayers: mp.game ? Object.keys(mp.game.players).length : 1,
        score: gameState.score,
        correctAnswers: gameState.clearedCount,
        totalQuestions: gameState.pool.length,
      });
    }
    if (gameState.phase !== 'result') sessionSaved.current = false;
  }, [gameState.phase, gameState.result, gameState.score, gameState.clearedCount, gameState.pool.length, onSaveGameSession, mp.game]);

  // In multiplayer: check if we finished all levels (for auto-advance)
  const mpFinished = gameState.mode === 'multi'
    && gameState.result === 'win'
    && gameState.levelEnd
    && gameState.level >= gameState.levelEnd;

  // --- Error state ---
  if (isMultiplayerMode && !mp.game && mp.error) {
    return (
      <div className="kd-page">
        <div className="game-loading-fallback">
          <p style={{ color: '#ef4444' }}>{mp.error}</p>
          <button onClick={onClose} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}>Quay lại</button>
        </div>
      </div>
    );
  }

  // --- Loading state ---
  if (isMultiplayerMode && !mp.game && !isLeaving && (mp.loading || initialRoomConfig || initialJoinCode)) {
    return (
      <div className="kd-page">
        <div className="game-loading-fallback">
          <div className="loading-spinner" />
          <p>Đang tạo phòng...</p>
        </div>
      </div>
    );
  }

  // No game and no pending creation → go back to hub
  if (isMultiplayerMode && !mp.game && !mp.loading) {
    onClose();
    return null;
  }

  return (
    <div className="kd-page">
      {/* === MULTIPLAYER FLOW === */}
      {isMultiplayerMode && view === 'lobby' && mp.game && (
        <KanjiDropLobby
          game={mp.game}
          currentPlayerId={currentUser.id}
          onStartGame={handleStartGame}
          onAddBot={handleAddBot}
          onLeave={handleLeaveGame}
          onKickPlayer={mp.kickPlayer}
        />
      )}

      {isMultiplayerMode && view === 'play' && gameState.phase === 'playing' && (
        <div className="kd-mp-layout">
          <div className="kd-mp-main">
            <TutorialOverlay onDismiss={() => {}} />
            <PlayingScreen
              gameState={gameState}
              onPickTile={pickTile}
              onUsePowerUp={usePowerUp}
              onClose={handleLeaveGame}
            />
          </div>
          {mp.game && (
            <MultiplayerProgressBar
              players={mp.game.players}
              currentPlayerId={currentUser.id}
              levelStart={mp.game.settings.levelStart}
              levelEnd={mp.game.settings.levelEnd}
            />
          )}
        </div>
      )}

      {/* MP: level win → auto-advance or show mp results */}
      {isMultiplayerMode && view === 'play' && gameState.phase === 'result' && !mpFinished && (
        <ResultScreen
          gameState={gameState}
          onNextLevel={nextLevel}
          onReplay={resetGame}
          onClose={handleLeaveGame}
        />
      )}

      {isMultiplayerMode && (view === 'results' || mpFinished) && mp.game && (
        <MultiplayerResultScreen
          players={mp.game.players}
          currentPlayerId={currentUser.id}
          levelStart={mp.game.settings.levelStart}
          levelEnd={mp.game.settings.levelEnd}
          onPlayAgain={handlePlayAgain}
          onExit={handlePlayAgain}
        />
      )}

      {/* === SINGLE-PLAYER FLOW === */}
      {!isMultiplayerMode && (
        <>
          {gameState.phase === 'playing' && <TutorialOverlay onDismiss={() => {}} />}

          {gameState.phase === 'setup' && (
            <SetupScreen
              config={setupConfig}
              availableKanjiCount={availableKanji.length}
              countByLevel={countByLevel}
              kanjiLessons={kanjiLessons}
              lessonNames={lessonNames}
              isVip={isVip}
              onClose={onClose}
              onStart={startGame}
              onToggleLevel={toggleLevel}
              onToggleLesson={toggleLesson}
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
        </>
      )}
    </div>
  );
}
