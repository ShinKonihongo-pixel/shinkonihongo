// Quiz Battle page — multiplayer-only orchestrator
// Always multiplayer: auto-create/join → lobby → playing → results

import { useState, useEffect, useRef, useCallback } from 'react';
import type { GameSession } from '../../types/user';
import type { JLPTQuestion, JLPTLevel } from '../../types/jlpt-question';
import { useQuizBattle } from '../../hooks/quiz-battle';
import { QuizBattleLobby } from '../quiz-battle/quiz-battle-lobby';
import { QuizBattlePlaying } from '../quiz-battle/quiz-battle-playing';
import { QuizBattleResults } from '../quiz-battle/quiz-battle-results';
import { QuizBattleLeaderboard } from '../quiz-battle/quiz-battle-leaderboard';
type PageView = 'lobby' | 'playing' | 'results';

export interface QuizBattlePageProps {
  onClose: () => void;
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
    jlptLevel?: string;
  };
  jlptQuestions: JLPTQuestion[];
  onSaveGameSession?: (data: Omit<GameSession, 'id' | 'userId'>) => void;
  initialRoomConfig?: Record<string, unknown>;
  initialJoinCode?: string;
}

export function QuizBattlePage({
  onClose,
  currentUser,
  jlptQuestions,
  onSaveGameSession,
  initialRoomConfig,
  initialJoinCode,
}: QuizBattlePageProps) {
  const [view, setView] = useState<PageView>('lobby');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const createOnceRef = useRef(false);
  const sessionSaved = useRef(false);

  const jlptLevel = (currentUser.jlptLevel as JLPTLevel) || 'N5';

  const game = useQuizBattle({ currentUser, jlptQuestions });

  // --- Auto-create room from Game Hub modal ---
  useEffect(() => {
    if (initialRoomConfig && !game.game && !createOnceRef.current) {
      createOnceRef.current = true;
      game.createGame({
        title: (initialRoomConfig.title as string) || 'Đấu Trí',
        jlptLevel: (initialRoomConfig.jlptLevel as JLPTLevel) || jlptLevel,
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Auto-join from join code ---
  useEffect(() => {
    if (initialJoinCode && !game.game && !createOnceRef.current) {
      createOnceRef.current = true;
      game.joinGame(initialJoinCode).catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Sync view from game status ---
  useEffect(() => {
    if (!game.game) return;
    const { status } = game.game;
    if (status === 'waiting') {
      setView('lobby');
    } else if (status === 'starting' || status === 'playing' || status === 'answer_reveal') {
      setView('playing');
    } else if (status === 'finished') {
      setView('results');
    }
  }, [game.game?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Save game session on results ---
  useEffect(() => {
    if (view !== 'results' || !game.game || !game.gameResults || sessionSaved.current) return;
    if (!onSaveGameSession) return;
    sessionSaved.current = true;
    const players = Object.values(game.game.players);
    const me = players.find(p => p.odinhId === currentUser.id);
    const isWinner = game.gameResults.winner?.odinhId === currentUser.id;
    onSaveGameSession({
      date: new Date().toISOString().split('T')[0],
      gameTitle: 'Đấu Trí',
      rank: isWinner ? 1 : game.gameResults.isDraw ? 1 : 2,
      totalPlayers: players.length,
      score: me?.score ?? 0,
      correctAnswers: me?.correctCount ?? 0,
      totalQuestions: game.game.questions.length,
    });
  }, [view, game.game, game.gameResults, currentUser.id, onSaveGameSession]);

  if (view !== 'results') sessionSaved.current = false;

  // --- Handlers ---
  const handleStart = useCallback(() => {
    game.startGame();
  }, [game]);

  const handleLeave = useCallback(() => {
    setIsLeaving(true);
    game.leaveGame();
    onClose();
  }, [game, onClose]);

  const handlePlayAgain = useCallback(() => {
    game.resetGame();
    onClose();
  }, [game, onClose]);

  const handleSubmitAnswer = useCallback((idx: number, timeMs: number) => {
    game.submitAnswer(idx, timeMs);
  }, [game]);

  // --- Error state ---
  if (!game.game && game.error) {
    return (
      <div className="qb-page">
        <div className="game-loading-fallback">
          <p style={{ color: '#ef4444' }}>{game.error}</p>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1.5rem', borderRadius: '8px',
              background: 'rgba(255,255,255,0.15)', color: 'white',
              border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
            }}
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  // --- Loading state ---
  if (!game.game && !isLeaving && (game.loading || initialRoomConfig || initialJoinCode)) {
    return (
      <div className="qb-page">
        <div className="game-loading-fallback">
          <div className="loading-spinner" />
          <p>Đang tạo phòng...</p>
        </div>
      </div>
    );
  }

  // No game and not loading → back to hub
  if (!game.game && !game.loading) {
    onClose();
    return null;
  }

  return (
    <div className="qb-page">
      {/* Lobby */}
      {view === 'lobby' && game.game && (
        <>
          <QuizBattleLobby
            game={game.game}
            currentPlayerId={currentUser.id}
            onStart={handleStart}
            onLeave={handleLeave}
          />
          <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
            <button
              onClick={() => setShowLeaderboard(v => !v)}
              style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.7)', borderRadius: '8px',
                padding: '0.4rem 1.25rem', cursor: 'pointer', fontSize: '0.85rem',
              }}
            >
              {showLeaderboard ? 'Ẩn bảng xếp hạng' : 'Bảng xếp hạng'}
            </button>
          </div>
          {showLeaderboard && (
            <QuizBattleLeaderboard
              currentUserId={currentUser.id}
              defaultLevel={jlptLevel}
            />
          )}
        </>
      )}

      {/* Playing */}
      {view === 'playing' && game.game && (
        <QuizBattlePlaying
          game={game.game}
          currentPlayerId={currentUser.id}
          onSubmitAnswer={handleSubmitAnswer}
        />
      )}

      {/* Results */}
      {view === 'results' && game.game && game.gameResults && (
        <QuizBattleResults
          results={game.gameResults}
          game={game.game}
          currentPlayerId={currentUser.id}
          onPlayAgain={handlePlayAgain}
          onClose={onClose}
        />
      )}
    </div>
  );
}
