// Racing Game Play - Main racing gameplay with track visualization
// Shows questions, answer options, player positions, traps, milestones, and inventory

import { useState, useEffect, useCallback } from 'react';
import { Clock, Zap, Star, ChevronRight, Gift, LogOut } from 'lucide-react';
import type { RacingGame, RacingPlayer, RacingQuestion, SpecialFeatureType, TrapType } from '../../types/racing-game';
import { SPECIAL_FEATURES, TRAPS } from '../../types/racing-game';
import { MilestoneBadge, MilestoneRewardPreview } from './shared/milestone-question';
import { TrapTriggeredOverlay, TrapWarning } from './shared/trap-system';
import { InventoryBar } from './shared/inventory-bar';
import { TeamScoreboard } from './shared/team-view';

interface RacingGamePlayProps {
  game: RacingGame;
  currentPlayer: RacingPlayer | undefined;
  currentQuestion: RacingQuestion | null;
  sortedPlayers: RacingPlayer[];
  isHost: boolean;
  onSubmitAnswer: (index: number) => void;
  onRevealAnswer: () => void;
  onNextQuestion: () => void;
  onOpenMysteryBox: () => void;
  onApplyFeature: (type: SpecialFeatureType) => void;
  onLeave?: () => void;
  // New props for "Đường Đua"
  onPlaceTrap?: (trapType: TrapType, position: number) => void;
  onUseItem?: (itemId: string) => void;
  onEscapeTap?: () => void;
}

// Answer option colors
const OPTION_COLORS = [
  'linear-gradient(135deg, #ff6b6b, #ee5a5a)',
  'linear-gradient(135deg, #4ecdc4, #44a3a0)',
  'linear-gradient(135deg, #ffd93d, #f5c400)',
  'linear-gradient(135deg, #6c5ce7, #5849c4)',
];

// Answer option shapes
const OPTION_SHAPES = ['▲', '◆', '●', '■'];

export function RacingGamePlay({
  game,
  currentPlayer,
  currentQuestion,
  sortedPlayers,
  isHost,
  onSubmitAnswer,
  onRevealAnswer,
  onNextQuestion,
  onOpenMysteryBox,
  onApplyFeature,
  onLeave,
  onPlaceTrap,
  onUseItem,
  onEscapeTap,
}: RacingGamePlayProps) {
  const [timeLeft, setTimeLeft] = useState(currentQuestion?.timeLimit || 15);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showMysteryReward, setShowMysteryReward] = useState(false);

  const isTeamMode = game.settings.gameMode === 'team';
  const enableTraps = game.settings.enableTraps;

  // Timer countdown
  useEffect(() => {
    if (game.status !== 'answering' || !currentQuestion) {
      setTimeLeft(currentQuestion?.timeLimit || 15);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [game.status, currentQuestion, game.currentQuestionIndex]);

  // Reset selected answer when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setShowMysteryReward(false);
  }, [game.currentQuestionIndex]);

  const handleAnswer = useCallback((index: number) => {
    if (selectedAnswer !== null || game.status !== 'answering') return;
    setSelectedAnswer(index);
    onSubmitAnswer(index);
  }, [selectedAnswer, game.status, onSubmitAnswer]);

  const handleMysteryBox = () => {
    setShowMysteryReward(true);
    if (currentQuestion?.mysteryBox) {
      onApplyFeature(currentQuestion.mysteryBox.reward);
    }
    setTimeout(() => {
      onOpenMysteryBox();
    }, 2000);
  };

  // Render starting countdown
  if (game.status === 'starting') {
    return (
      <div className="racing-play starting">
        {onLeave && (
          <button className="leave-game-btn floating" onClick={onLeave} title="Rời game">
            <LogOut size={18} /> Rời
          </button>
        )}
        <div className="countdown-display">
          <div className="countdown-icon">{game.settings.raceType === 'boat' ? '🚣' : '🏇'}</div>
          <h2>Cuộc đua sắp bắt đầu!</h2>
          <div className="countdown-number">3</div>
          <p>Chuẩn bị sẵn sàng...</p>
        </div>
      </div>
    );
  }

  // Render mystery box
  if (game.status === 'mystery_box' && currentQuestion?.isMysteryBox) {
    const reward = currentQuestion.mysteryBox?.reward;
    const feature = reward ? SPECIAL_FEATURES[reward] : null;

    return (
      <div className="racing-play mystery-box">
        {onLeave && (
          <button className="leave-game-btn floating" onClick={onLeave} title="Rời game">
            <LogOut size={18} /> Rời
          </button>
        )}
        <div className="mystery-box-display">
          <div className="mystery-icon">🎁</div>
          <h2>Hộp Mù!</h2>
          <p className="mystery-difficulty">
            Độ khó: {currentQuestion.mysteryBox?.difficulty === 'easy' ? 'Dễ' :
              currentQuestion.mysteryBox?.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
          </p>

          {!showMysteryReward ? (
            <button className="open-mystery-btn" onClick={handleMysteryBox}>
              <Gift size={24} />
              Mở Hộp Mù
            </button>
          ) : (
            <div className="mystery-reward">
              <div className="reward-reveal">
                <span className="reward-emoji">{feature?.emoji}</span>
                <h3>{feature?.name}</h3>
                <p>{feature?.description}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="racing-play">
      {onLeave && (
        <button className="leave-game-btn floating" onClick={onLeave} title="Rời game">
          <LogOut size={18} /> Rời
        </button>
      )}
      {/* Race Track */}
      <div className="race-track">
        <div className="track-header">
          <span className="track-label">🏁 Đường đua - {game.settings.trackLength} km</span>
          <span className="question-counter">
            Câu {game.currentQuestionIndex + 1}/{game.questions.length}
          </span>
        </div>

        <div className="track-visual-play">
          {/* Track lanes */}
          <div className="track-lanes">
            {sortedPlayers.map((player, idx) => (
              <div key={player.odinhId} className="track-lane">
                <div className="lane-info">
                  <span className="lane-position">#{idx + 1}</span>
                  <span className="lane-name">{player.displayName}</span>
                </div>
                <div className="lane-track">
                  <div className="lane-progress" style={{ width: `${player.distance}%` }}>
                    <div
                      className={`lane-vehicle ${player.odinhId === currentPlayer?.odinhId ? 'current' : ''} ${player.isFrozen ? 'frozen' : ''}`}
                    >
                      {player.vehicle.emoji}
                      {player.hasShield && <span className="shield-indicator">🛡️</span>}
                      {player.activeFeatures.some(f => f.type === 'speed_boost') && <span className="boost-indicator">🚀</span>}
                    </div>
                  </div>
                  <div className="lane-finish">🏁</div>
                </div>
                <div className="lane-stats">
                  <span className="lane-speed">{Math.round(player.currentSpeed)} km/h</span>
                  <span className="lane-distance">{player.distance.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Question Section */}
      {(game.status === 'question' || game.status === 'answering' || game.status === 'revealing') && currentQuestion && (
        <div className="question-section">
          {/* Timer */}
          <div className={`question-timer ${timeLeft <= 5 ? 'warning' : ''}`}>
            <Clock size={20} />
            <span>{timeLeft}s</span>
            <div className="timer-bar" style={{ width: `${(timeLeft / currentQuestion.timeLimit) * 100}%` }} />
          </div>

          {/* Question */}
          <div className={`question-display ${currentQuestion.isMilestone ? 'milestone' : ''}`}>
            {currentQuestion.isMilestone && <MilestoneBadge />}
            <span className="question-difficulty">
              {currentQuestion.difficulty === 'easy' ? '⭐' : currentQuestion.difficulty === 'medium' ? '⭐⭐' : '⭐⭐⭐'}
            </span>
            <h2 className="question-text">{currentQuestion.questionText}</h2>
            <span className="speed-bonus">
              +{currentQuestion.speedBonus} km/h
              {currentQuestion.isMilestone && <span className="milestone-bonus"> (x2 bonus!)</span>}
            </span>
            {currentQuestion.isMilestone && (
              <MilestoneRewardPreview speedBonus={currentQuestion.speedBonus} />
            )}
          </div>

          {/* Answer Options */}
          <div className="answer-options-grid">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = game.status === 'revealing' && index === currentQuestion.correctIndex;
              const isWrong = game.status === 'revealing' && isSelected && index !== currentQuestion.correctIndex;

              return (
                <button
                  key={index}
                  className={`answer-option ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                  style={{ background: OPTION_COLORS[index] }}
                  onClick={() => handleAnswer(index)}
                  disabled={game.status !== 'answering' || selectedAnswer !== null}
                >
                  <span className="option-shape">{OPTION_SHAPES[index]}</span>
                  <span className="option-text">{option}</span>
                  {isCorrect && <span className="correct-mark">✓</span>}
                  {isWrong && <span className="wrong-mark">✗</span>}
                </button>
              );
            })}
          </div>

          {/* Host Controls */}
          {isHost && (
            <div className="host-controls">
              {game.status === 'answering' && (
                <button className="reveal-btn" onClick={onRevealAnswer}>
                  Hiện Đáp Án
                </button>
              )}
              {game.status === 'revealing' && (
                <button className="next-btn" onClick={onNextQuestion}>
                  Câu Tiếp <ChevronRight size={18} />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Player Stats Bar */}
      {currentPlayer && (
        <div className="player-stats-bar">
          <div className="stat-item">
            <Zap size={16} />
            <span>{Math.round(currentPlayer.currentSpeed)} km/h</span>
          </div>
          <div className="stat-item">
            <Star size={16} />
            <span>Streak: {currentPlayer.streak}</span>
          </div>
          <div className="stat-item correct">
            <span>✓ {currentPlayer.correctAnswers}/{currentPlayer.totalAnswers}</span>
          </div>
          {currentPlayer.activeFeatures.length > 0 && (
            <div className="active-features">
              {currentPlayer.activeFeatures.map((f, i) => (
                <span key={i} className="feature-badge" title={SPECIAL_FEATURES[f.type].name}>
                  {SPECIAL_FEATURES[f.type].emoji}
                  <span className="feature-duration">{f.remainingRounds}</span>
                </span>
              ))}
            </div>
          )}
          {/* Trap effects indicator */}
          {currentPlayer.trapEffects && currentPlayer.trapEffects.length > 0 && (
            <div className="trap-effects">
              {currentPlayer.trapEffects.map((e, i) => (
                <span key={i} className={`trap-effect-badge effect-${e.trapType}`} title={TRAPS[e.trapType].name}>
                  {TRAPS[e.trapType].emoji}
                  <span className="effect-duration">{e.remainingRounds}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Inventory Bar */}
      {currentPlayer && currentPlayer.inventory && currentPlayer.inventory.length > 0 && onUseItem && onPlaceTrap && (
        <InventoryBar
          inventory={currentPlayer.inventory}
          onUseItem={onUseItem}
          onPlaceTrap={onPlaceTrap}
          currentDistance={currentPlayer.distance}
          disabled={game.status !== 'answering'}
        />
      )}

      {/* Team Scoreboard (for team mode) */}
      {isTeamMode && game.teams && currentPlayer?.teamId && (
        <div className="team-scoreboard-mini">
          <TeamScoreboard
            teams={game.teams}
            players={sortedPlayers}
            currentTeamId={currentPlayer.teamId}
          />
        </div>
      )}

      {/* Trap Warning */}
      {enableTraps && currentPlayer && (
        <TrapWarning
          distance={currentPlayer.distance}
          traps={game.activeTraps}
        />
      )}

      {/* Trap Triggered Overlay */}
      {currentPlayer?.isEscaping && currentPlayer.trapEffects.some(e => e.trapType === 'sinkhole') && onEscapeTap && (
        <TrapTriggeredOverlay
          trapType="sinkhole"
          onDismiss={() => {}}
          isEscapeRequired={true}
          onEscapeTap={onEscapeTap}
          escapeProgress={currentPlayer.escapeProgress || 0}
        />
      )}

      {/* Escape mini-game for non-sinkhole traps */}
      {currentPlayer?.trapEffects && currentPlayer.trapEffects.some(e => e.trapType !== 'sinkhole' && e.remainingRounds > 0) && (
        <div className="trap-effect-notification">
          {currentPlayer.trapEffects.filter(e => e.trapType !== 'sinkhole').map((effect, i) => (
            <div key={i} className={`effect-notice effect-${effect.trapType}`}>
              <span className="effect-emoji">{TRAPS[effect.trapType].emoji}</span>
              <span className="effect-text">
                {effect.trapType === 'imprisonment' ? 'Bị giam!' : 'Bị đóng băng!'} ({effect.remainingRounds} lượt)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
