// Bingo Game Play - Main game interface with number boards and drawing

import { useState, useEffect, useMemo, useRef } from 'react';
import { LogOut, Target, Sparkles, X, HelpCircle } from 'lucide-react';
import type { BingoGame, BingoPlayer, BingoSkillType } from '../../types/bingo-game';
import { BINGO_SKILLS } from '../../types/bingo-game';
import { PlayerLeaderboard, type LeaderboardPlayer } from '../game-hub/player-leaderboard';
import { useGameSounds } from '../../hooks/use-game-sounds';

interface BingoGamePlayProps {
  game: BingoGame;
  currentPlayer: BingoPlayer | undefined;
  sortedPlayers: BingoPlayer[];
  isHost: boolean;
  isSkillPhase: boolean;
  onDrawNumber: () => void;
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
  isSkillPhase,
  onDrawNumber,
  onClaimBingo,
  onUseSkill,
  onSkipSkill,
  onLeave,
  onShowGuide,
}: BingoGamePlayProps) {
  const [selectedSkill, setSelectedSkill] = useState<BingoSkillType | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [showDrawAnimation, setShowDrawAnimation] = useState(false);
  const [animatedNumber, setAnimatedNumber] = useState<number | null>(null);

  // Game sounds
  const { playCorrect, playVictory, playDefeat, startMusic, stopMusic, settings: soundSettings } = useGameSounds();
  const soundPlayedRef = useRef<string>('');

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

  // Animate drawn number
  useEffect(() => {
    if (game.lastDrawnNumber !== null) {
      setAnimatedNumber(game.lastDrawnNumber);
      setShowDrawAnimation(true);
      const timer = setTimeout(() => {
        setShowDrawAnimation(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [game.lastDrawnNumber, game.drawnNumbers.length]);

  // Handle skill selection
  const handleSkillSelect = (skillType: BingoSkillType) => {
    const skill = BINGO_SKILLS[skillType];
    setSelectedSkill(skillType);

    if (!skill.targetOther) {
      // Apply skill immediately
      onUseSkill(skillType);
      setSelectedSkill(null);
    }
  };

  // Handle target selection for skills
  const handleTargetSelect = (targetId: string) => {
    if (selectedSkill) {
      onUseSkill(selectedSkill, targetId);
      setSelectedSkill(null);
      setSelectedTarget(null);
    }
  };

  // Check if current player can draw
  const canDraw = currentPlayer && !currentPlayer.isBlocked && game.availableNumbers.length > 0;

  // Check if current player can claim bingo
  const canBingo = currentPlayer?.canBingo && !currentPlayer?.hasBingoed;

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

      {/* Last drawn number animation */}
      {showDrawAnimation && animatedNumber !== null && (
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
            {/* Draw button */}
            <button
              className="draw-btn"
              onClick={onDrawNumber}
              disabled={!canDraw || isSkillPhase}
            >
              <span className="draw-icon">🎱</span>
              <span>Bốc Số</span>
            </button>

            {/* Bingo button - only show when eligible */}
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

      {/* Skill phase overlay */}
      {isSkillPhase && currentPlayer?.hasSkillAvailable && (
        <div className="skill-phase-overlay">
          <div className="skill-phase-content">
            <h3>
              <Sparkles size={24} />
              Kỹ Năng Đặc Biệt!
            </h3>
            <p>Chọn một kỹ năng để sử dụng</p>

            {!selectedSkill ? (
              <>
                <div className="skills-grid">
                  {Object.values(BINGO_SKILLS).map(skill => (
                    <button
                      key={skill.type}
                      className="skill-card"
                      onClick={() => handleSkillSelect(skill.type)}
                    >
                      <span className="skill-emoji">{skill.emoji}</span>
                      <span className="skill-name">{skill.name}</span>
                      <span className="skill-desc">{skill.description}</span>
                    </button>
                  ))}
                </div>

                <button className="skip-skill-btn" onClick={onSkipSkill}>
                  Bỏ Qua
                </button>
              </>
            ) : (
              /* Target selection for debuff skills */
              <div className="target-selection">
                <h4>
                  <Target size={20} />
                  Chọn Đối Thủ
                </h4>
                <p>
                  Sử dụng: {BINGO_SKILLS[selectedSkill].emoji} {BINGO_SKILLS[selectedSkill].name}
                </p>

                <div className="targets-grid">
                  {opponents.map(player => (
                    <button
                      key={player.odinhId}
                      className={`target-card ${selectedTarget === player.odinhId ? 'selected' : ''}`}
                      onClick={() => handleTargetSelect(player.odinhId)}
                    >
                      <span className="target-avatar">{player.avatar}</span>
                      <span className="target-name">{player.displayName}</span>
                      <span className="target-stats">
                        ✓{player.markedCount} | 🏆{player.completedRows}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  className="cancel-skill-btn"
                  onClick={() => setSelectedSkill(null)}
                >
                  <X size={16} />
                  Hủy
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
