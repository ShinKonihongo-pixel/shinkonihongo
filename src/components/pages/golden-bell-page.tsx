// Golden Bell Page — manages game state and renders lobby/play/results
// Entry: always via initialRoomConfig (create) or initialJoinCode (join)
// No intermediate menu — goes directly to lobby

import { useState, useEffect, useRef } from 'react';
import { useGoldenBell } from '../../hooks/golden-bell';
import { GoldenBellLobby } from '../golden-bell/golden-bell-lobby';
import { GoldenBellPlay } from '../golden-bell/golden-bell-play';
import { GoldenBellResultsView } from '../golden-bell/golden-bell-results';
import type { QuestionCategory, GoldenBellGameMode, GoldenBellPlayer } from '../../types/golden-bell';
import type { Flashcard, JLPTLevel } from '../../types/flashcard';
import type { GameSession } from '../../types/user';
import '../golden-bell/golden-bell.css';

interface GoldenBellUser {
  id: string;
  displayName?: string;
  avatar?: string;
  role?: string;
}

type PageView = 'lobby' | 'play' | 'results';

interface GoldenBellPageProps {
  currentUser: GoldenBellUser;
  flashcards: Flashcard[];
  initialJoinCode?: string;
  onSaveGameSession?: (data: Omit<GameSession, 'id' | 'userId'>) => void;
  initialRoomConfig?: Record<string, unknown>;
  onGoHome?: () => void;
}

export function GoldenBellPage({
  currentUser,
  flashcards,
  initialJoinCode,
  onSaveGameSession,
  initialRoomConfig,
  onGoHome,
}: GoldenBellPageProps) {
  const [view, setView] = useState<PageView>('lobby');
  const gameSessionSaved = useRef(false);
  const createOnceRef = useRef(false);
  const leavingRef = useRef(false);

  const {
    game,
    gameResults,
    loading,
    error,
    isHost,
    currentPlayer,
    currentQuestion,
    sortedPlayers,
    aliveCount,
    createGame,
    joinGame,
    leaveGame,
    kickPlayer,
    startGame,
    submitAnswer,
    revealAnswer,
    nextQuestion,
    resetGame,
    setError,
    joinTeam,
    shuffleTeams,
    getEnabledSkills,
    assignRandomSkill,
    useSkill,
    completeSkillPhase,
  } = useGoldenBell({
    currentUser: {
      id: currentUser.id,
      displayName: currentUser.displayName || 'Player',
      avatar: currentUser.avatar || '🔔',
      role: currentUser.role,
    },
    flashcards,
  });

  // Handle initial join code from URL
  useEffect(() => {
    if (initialJoinCode && !game) {
      joinGame(initialJoinCode).catch(() => {
        setError('Không thể tham gia phòng với mã này');
      });
    }
  }, [initialJoinCode, game, joinGame, setError]);

  // Auto-create room from Game Hub unified setup (guarded against StrictMode double-fire)
  useEffect(() => {
    if (initialRoomConfig && !game && !createOnceRef.current) {
      createOnceRef.current = true;
      const cfg = initialRoomConfig;
      createGame({
        title: (cfg.title as string) || 'Rung Chuông Vàng',
        jlptLevel: (cfg.jlptLevel as JLPTLevel) || 'N5',
        contentSource: 'flashcard',
        questionCount: (cfg.totalRounds as number) || 20,
        timePerQuestion: (cfg.timePerQuestion as number) || 15,
        maxPlayers: (cfg.maxPlayers as number) || 20,
        categories: (cfg.categories as QuestionCategory[]) || ['vocabulary', 'kanji'],
        difficultyProgression: (cfg.difficultyProgression as boolean) ?? true,
        gameMode: (cfg.gameMode as GoldenBellGameMode) || 'solo',
        teamCount: (cfg.teamCount as number) || undefined,
        maxPlayersPerTeam: (cfg.maxPlayersPerTeam as number) || undefined,
        skillsEnabled: true, // Skills always enabled (special questions)
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update view based on game state
  useEffect(() => {
    if (!game) {
      if (gameResults) {
        setView('results');
      }
      return;
    }
    switch (game.status) {
      case 'waiting':
        setView('lobby');
        break;
      case 'starting':
      case 'question':
      case 'answering':
      case 'skill_phase':
      case 'revealing':
        setView('play');
        break;
      case 'finished':
        setView('results');
        break;
    }
  }, [game, gameResults]);

  // Save game session when game finishes (XP tracking)
  useEffect(() => {
    if (game?.status === 'finished' && !gameSessionSaved.current && onSaveGameSession && gameResults) {
      gameSessionSaved.current = true;
      const myResult = gameResults.rankings.find(p => p.odinhId === currentUser.id);
      if (myResult) {
        onSaveGameSession({
          date: new Date().toISOString().split('T')[0],
          gameTitle: 'Golden Bell',
          rank: myResult.rank,
          totalPlayers: gameResults.totalPlayers,
          score: myResult.correctAnswers * 100,
          correctAnswers: myResult.correctAnswers,
          totalQuestions: gameResults.totalQuestions,
        });
      }
    }
    if (!game || game.status !== 'finished') {
      gameSessionSaved.current = false;
    }
  }, [game, gameResults, currentUser.id, onSaveGameSession]);

  const handleLeaveGame = () => {
    leavingRef.current = true;
    leaveGame();
    onGoHome?.();
  };

  const handlePlayAgain = () => {
    resetGame();
  };

  return (
    <div className="golden-bell-page">
      {/* Error Toast */}
      {error && (
        <div className="golden-bell-error-toast">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Loading state while creating/joining */}
      {!game && loading && (
        <div className="game-loading-fallback">
          <div className="loading-spinner" />
          <p>Đang tạo phòng...</p>
        </div>
      )}

      {/* Lobby View */}
      {view === 'lobby' && game && (
        <GoldenBellLobby
          game={game}
          isHost={isHost}
          currentPlayerId={currentUser.id}
          onStart={startGame}
          onLeave={handleLeaveGame}
          onKickPlayer={kickPlayer}
          onJoinTeam={joinTeam}
          onShuffleTeams={shuffleTeams}
        />
      )}

      {/* Play View */}
      {view === 'play' && game && (
        <GoldenBellPlay
          game={game}
          currentPlayer={currentPlayer as GoldenBellPlayer | undefined}
          currentQuestion={currentQuestion}
          sortedPlayers={sortedPlayers as GoldenBellPlayer[]}
          aliveCount={aliveCount}
          isHost={isHost}
          onSubmitAnswer={submitAnswer}
          onRevealAnswer={revealAnswer}
          onNextQuestion={nextQuestion}
          onLeave={handleLeaveGame}
          onUseSkill={useSkill}
          onAssignRandomSkill={assignRandomSkill}
          onCompleteSkillPhase={completeSkillPhase}
          enabledSkills={getEnabledSkills()}
        />
      )}

      {/* Results View */}
      {view === 'results' && gameResults && (
        <GoldenBellResultsView
          results={gameResults}
          currentPlayerId={currentUser.id}
          onPlayAgain={handlePlayAgain}
          onGoHome={() => onGoHome?.()}
        />
      )}
    </div>
  );
}
