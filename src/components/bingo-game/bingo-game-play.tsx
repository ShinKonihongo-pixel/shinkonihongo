// Bingo Game Play — Main game interface with question-based gameplay

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { LogOut, HelpCircle } from 'lucide-react';
import type { BingoGame, BingoPlayer, BingoSkillType } from '../../types/bingo-game';
import { PlayerLeaderboard, type LeaderboardPlayer } from '../game-hub/player-leaderboard';
import { BingoQuestionPhase } from './bingo-question-phase';
import { BingoNumberSpinner } from './bingo-number-spinner';
import { BingoSkillPicker } from './bingo-skill-picker';
import { useGameSounds } from '../../hooks/use-game-sounds';

interface BingoGamePlayProps {
  game: BingoGame;
  currentPlayer: BingoPlayer | undefined;
  sortedPlayers: BingoPlayer[];
  isHost: boolean;
  isSkillPhase: boolean;
  onStartQuestion: () => void;
  onSubmitAnswer: (selectedIndex: number) => void;
  onRevealAndSpin: () => void;
  onCompleteSpin: () => void;
  onClaimBingo: () => void;
  onUseSkill: (skillType: BingoSkillType, targetId?: string) => void;
  onSkipSkill: () => void;
  onLeave: () => void;
  onShowGuide: () => void;
}

export function BingoGamePlay({
  game,
  currentPlayer,
  sortedPlayers,
  isHost,
  isSkillPhase: _isSkillPhase,
  onStartQuestion,
  onSubmitAnswer,
  onRevealAndSpin,
  onCompleteSpin,
  onClaimBingo,
  onUseSkill,
  onSkipSkill,
  onLeave,
  onShowGuide,
}: BingoGamePlayProps) {
  const [showDrawAnimation, setShowDrawAnimation] = useState(false);
  const [animatedNumber, setAnimatedNumber] = useState<number | null>(null);

  // Game sounds
  const { playCorrect, playVictory, playDefeat, startMusic, stopMusic, settings: soundSettings } = useGameSounds();
  const soundPlayedRef = useRef<string>('');

  // Auto-reveal after timer ends (host only)
  const revealTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (game.status !== 'question_phase' || !isHost) return;
    const question = game.questions[game.currentQuestionIndex];
    if (!question) return;

    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    // Auto-reveal after question time limit + 1s buffer
    revealTimerRef.current = setTimeout(() => {
      onRevealAndSpin();
    }, (question.timeLimit + 1) * 1000);

    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, [game.status, game.currentQuestionIndex, isHost, onRevealAndSpin, game.questions]);

  // Stable callback for spinner
  const handleSpinComplete = useCallback(() => {
    onCompleteSpin();
  }, [onCompleteSpin]);

  // Play sound when number is drawn (matches on player's rows)
  useEffect(() => {
    if (game.drawnNumbers.length > 0 && currentPlayer) {
      const lastDrawn = game.drawnNumbers[game.drawnNumbers.length - 1];
      const hasNumber = currentPlayer.rows.some(row =>
        row.cells.some(cell => cell.number === lastDrawn.number)
      );
      const soundKey = `draw-${game.drawnNumbers.length}`;
      if (soundPlayedRef.current !== soundKey && hasNumber) {
        soundPlayedRef.current = soundKey;
        playCorrect();
      }
    }
  }, [game.drawnNumbers, currentPlayer, playCorrect]);

  // Play victory/defeat sound when game ends
  useEffect(() => {
    if (game.status === 'finished' && currentPlayer) {
      if (game.winnerId === currentPlayer.odinhId) {
        playVictory();
      } else {
        playDefeat();
      }
      stopMusic();
    }
  }, [game.status, game.winnerId, currentPlayer, playVictory, playDefeat, stopMusic]);

  // Start background music
  useEffect(() => {
    if (game.status === 'playing' && soundSettings.musicEnabled) {
      startMusic();
    }
  }, [game.status, soundSettings.musicEnabled, startMusic]);

  // Opponents for skill targeting
  const opponents = useMemo(() => {
    return sortedPlayers.filter(p => p.odinhId !== currentPlayer?.odinhId);
  }, [sortedPlayers, currentPlayer]);

  // Convert players to leaderboard format
  const leaderboardPlayers: LeaderboardPlayer[] = useMemo(() => {
    return sortedPlayers.map(player => ({
      id: player.odinhId,
      displayName: player.displayName,
      avatar: player.avatar,
      score: player.completedRows * 100 + player.markedCount,
      isCurrentUser: player.odinhId === currentPlayer?.odinhId,
      isBot: player.isBot,
      role: player.role,
      extraInfo: `${player.completedRows} dãy • ✓${player.markedCount}`,
      answerStatus: player.hasBingoed ? 'correct' : player.completedRows >= 3 ? 'pending' : 'none',
    }));
  }, [sortedPlayers, currentPlayer?.odinhId]);

  // Animate drawn number popup
  useEffect(() => {
    if (game.lastDrawnNumber !== null && game.status !== 'spin_phase') {
      setAnimatedNumber(game.lastDrawnNumber);
      setShowDrawAnimation(true);
      const timer = setTimeout(() => setShowDrawAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [game.lastDrawnNumber, game.drawnNumbers.length, game.status]);

  const canBingo = currentPlayer?.canBingo && !currentPlayer?.hasBingoed;
  const currentQuestion = game.questions[game.currentQuestionIndex];
  const spinWinnerName = game.correctAnswerPlayerId
    ? game.players[game.correctAnswerPlayerId]?.displayName || 'Player'
    : '';

  return (
    <div className="bingo-play with-leaderboard">
      {/* Header */}
      <div className="bingo-play-header">
        <div className="turn-info">
          <span className="turn-label">Lượt</span>
          <span className="turn-number">{game.currentTurn}</span>
        </div>
        <div className="drawn-count">
          <span>🎱</span>
          <span>{game.drawnNumbers.length}/99</span>
        </div>
        <div className="header-actions">
          <button className="guide-btn" onClick={onShowGuide}>
            <HelpCircle size={18} />
          </button>
          <button className="leave-btn-small" onClick={onLeave}>
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Last drawn number animation (non-spin) */}
      {showDrawAnimation && animatedNumber !== null && game.status !== 'spin_phase' && (
        <div className="drawn-number-popup">
          <div className="number-ball">
            <span>{animatedNumber.toString().padStart(2, '0')}</span>
          </div>
        </div>
      )}

      {/* Content wrapper for sidebar layout */}
      <div className="bingo-play-content">
        {/* Main game area */}
        <div className="bingo-play-main">
          {/* My bingo card */}
          {currentPlayer && (
            <div className="my-bingo-card">
              <div className="card-header">
                <span className="card-title">Thẻ Của Bạn</span>
                <span className="marked-count">
                  ✓ {currentPlayer.markedCount} số
                </span>
              </div>

              <div className="bingo-rows">
                {currentPlayer.rows.map((row, rowIdx) => (
                  <div
                    key={row.id}
                    className={`bingo-row ${row.isComplete ? 'complete' : ''}`}
                  >
                    <span className="row-number">{rowIdx + 1}</span>
                    <div className="row-cells">
                      {row.cells.map((cell, cellIdx) => (
                        <div
                          key={cellIdx}
                          className={`bingo-cell ${cell.marked ? 'marked' : ''} ${
                            cell.number === game.lastDrawnNumber ? 'just-marked' : ''
                          }`}
                        >
                          <span>{cell.number.toString().padStart(2, '0')}</span>
                        </div>
                      ))}
                    </div>
                    {row.isComplete && <span className="row-complete">✓</span>}
                  </div>
                ))}
              </div>

              {/* Status badges */}
              <div className="player-status-badges">
                {currentPlayer.isBlocked && (
                  <span className="status-badge blocked">🚫 Bị Chặn</span>
                )}
                {currentPlayer.luckBonus > 1 && (
                  <span className="status-badge lucky">🍀 May Mắn ({currentPlayer.luckTurnsLeft})</span>
                )}
                {currentPlayer.hasFiftyFifty && (
                  <span className="status-badge fifty">🎲 50/50</span>
                )}
              </div>
            </div>
          )}

          {/* Drawn numbers history */}
          <div className="drawn-numbers-section">
            <h4>Số Đã Bốc</h4>
            <div className="drawn-numbers-grid">
              {game.drawnNumbers.slice(-20).reverse().map((drawn, idx) => (
                <div
                  key={idx}
                  className={`drawn-number ${idx === 0 ? 'latest' : ''}`}
                >
                  {drawn.number.toString().padStart(2, '0')}
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="bingo-play-actions">
            {/* Next Question button (host only, during playing) */}
            {game.status === 'playing' && isHost && (
              <button
                className="draw-btn"
                onClick={onStartQuestion}
                disabled={game.currentQuestionIndex + 1 >= game.questions.length}
              >
                <span className="draw-icon">❓</span>
                <span>Câu Hỏi Tiếp</span>
              </button>
            )}

            {/* Bingo button */}
            {canBingo && (
              <button className="bingo-btn" onClick={onClaimBingo}>
                <span className="bingo-text">🎉 BINGO! 🎉</span>
              </button>
            )}
          </div>
        </div>

        {/* Player Leaderboard Sidebar */}
        <div className="bingo-play-sidebar">
          <PlayerLeaderboard
            players={leaderboardPlayers}
            currentUserId={currentPlayer?.odinhId}
            title="Bảng Xếp Hạng"
            showAnswerStatus={true}
            maxVisible={10}
          />
        </div>
      </div>

      {/* Question Phase Overlay */}
      {game.status === 'question_phase' && currentQuestion && (
        <BingoQuestionPhase
          question={currentQuestion}
          currentQuestionAnswers={game.currentQuestionAnswers}
          currentPlayerId={currentPlayer?.odinhId || ''}
          totalPlayers={Object.keys(game.players).length}
          onSubmitAnswer={onSubmitAnswer}
        />
      )}

      {/* Spin Phase Overlay */}
      {game.status === 'spin_phase' && game.lastDrawnNumber !== null && (
        <BingoNumberSpinner
          targetNumber={game.lastDrawnNumber}
          winnerName={spinWinnerName}
          onComplete={handleSpinComplete}
        />
      )}

      {/* Skill Phase Overlay */}
      {game.status === 'skill_phase' && currentPlayer?.hasSkillAvailable && (
        <BingoSkillPicker
          currentPlayer={currentPlayer}
          opponents={opponents}
          onUseSkill={onUseSkill}
          onSkipSkill={onSkipSkill}
        />
      )}
    </div>
  );
}
