/* eslint-disable react-hooks/set-state-in-effect */
// Racing Game Play V2 - Complete redesign with new game flow
// Flow: Track View -> Question View -> Track View (repeat)
// Features: Vertical race track, special questions every 3, effect targeting

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Clock, Zap, Shield, Target, LogOut } from 'lucide-react';
import type { RacingGame, RacingPlayer, RacingQuestion } from '../../types/racing-game';
import { isImageAvatar } from '../../utils/avatar-icons';
import { ANSWER_OPTIONS } from '../../constants/answer-options';

// Effect types for the new system
type EffectType = 'speed_boost' | 'imprisonment' | 'freeze' | 'sinkhole' | 'trap' | 'shield';

interface Effect {
  type: EffectType;
  name: string;
  emoji: string;
  description: string;
  targetSelf: boolean; // true = buff, false = debuff on opponent
  speedModifier?: number; // multiplier (0.5 = 50% speed)
  duration?: number; // rounds
}

const EFFECTS: Record<EffectType, Effect> = {
  speed_boost: { type: 'speed_boost', name: 'Tăng Tốc', emoji: '🚀', description: '+50% tốc độ', targetSelf: true, speedModifier: 1.5, duration: 2 },
  imprisonment: { type: 'imprisonment', name: 'Giam Cầm', emoji: '⛓️', description: 'Đối thủ bị giam 1 hiệp', targetSelf: false, speedModifier: 0, duration: 1 },
  freeze: { type: 'freeze', name: 'Đóng Băng', emoji: '❄️', description: 'Đối thủ -50% tốc độ', targetSelf: false, speedModifier: 0.5, duration: 2 },
  sinkhole: { type: 'sinkhole', name: 'Hố Sụt', emoji: '🕳️', description: 'Đối thủ phải thoát hố', targetSelf: false, duration: 1 },
  trap: { type: 'trap', name: 'Bẫy', emoji: '🪤', description: 'Đối thủ -30% tốc độ', targetSelf: false, speedModifier: 0.7, duration: 2 },
  shield: { type: 'shield', name: 'Khiên', emoji: '🛡️', description: 'Miễn nhiễm tấn công', targetSelf: true, duration: 2 },
};

const EFFECT_WHEEL: EffectType[] = ['speed_boost', 'imprisonment', 'freeze', 'sinkhole', 'trap', 'shield'];

// View types
type GameView = 'track' | 'question' | 'wheel' | 'target' | 'sinkhole';

interface RacingGamePlayV2Props {
  game: RacingGame;
  currentPlayer: RacingPlayer | undefined;
  currentQuestion: RacingQuestion | null;
  sortedPlayers: RacingPlayer[];
  isHost: boolean;
  onSubmitAnswer: (index: number) => void;
  onRevealAnswer: () => void;
  onNextQuestion: () => void;
  onApplyEffect?: (effectType: EffectType, targetId?: string) => void;
  onEscapeTap?: () => void;
  onLeave?: () => void;
}

export function RacingGamePlayV2({
  game,
  currentPlayer,
  currentQuestion,
  sortedPlayers,
  isHost,
  onSubmitAnswer,
  onRevealAnswer: _onRevealAnswer,
  onNextQuestion,
  onApplyEffect,
  onEscapeTap,
  onLeave,
}: RacingGamePlayV2Props) {
  void _onRevealAnswer; // Reserved for future use
  // View state - controls what's shown
  const [view, setView] = useState<GameView>('track');
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);

  // Wheel spin state
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<EffectType | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  // Sinkhole escape state
  const [escapeProgress, setEscapeProgress] = useState(0);
  const [escapeRequired] = useState(20); // taps needed

  // Submitted state (after clicking submit button)
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Check if current question is special (every 3 questions)
  const isSpecialQuestion = useMemo(() => {
    return (game.currentQuestionIndex + 1) % 3 === 0;
  }, [game.currentQuestionIndex]);

  // Get opponents (exclude current player)
  const opponents = useMemo(() => {
    return sortedPlayers.filter(p => p.odinhId !== currentPlayer?.odinhId);
  }, [sortedPlayers, currentPlayer]);

  // Timer countdown
  useEffect(() => {
    if (view !== 'question' || game.status !== 'answering') {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [view, game.status]);

  // View transitions based on game status
  useEffect(() => {
    if (game.status === 'starting') {
      setView('track');
    } else if (game.status === 'question' || game.status === 'answering') {
      // Transition to question view after showing track
      const t = setTimeout(() => setView('question'), 500);
      setTimeLeft(currentQuestion?.timeLimit || 15);
      setSelectedAnswer(null);
      setShowResult(false);
      setHasSubmitted(false);
      return () => clearTimeout(t);
    } else if (game.status === 'revealing') {
      // Show result - handled by submit flow now
    } else if (game.status === 'racing') {
      // Back to track view
      setView('track');
    }
  }, [game.status, currentQuestion]);

  // Handle answer selection (just select, not submit)
  const handleSelectAnswer = useCallback((index: number) => {
    if (hasSubmitted || game.status !== 'answering') return;
    setSelectedAnswer(index);
  }, [hasSubmitted, game.status]);

  // Handle submit answer (after clicking submit button)
  const handleSubmitAnswer = useCallback(() => {
    if (selectedAnswer === null || hasSubmitted || game.status !== 'answering') return;
    setHasSubmitted(true);
    onSubmitAnswer(selectedAnswer);

    // Check if correct
    if (currentQuestion) {
      const isCorrect = selectedAnswer === currentQuestion.correctIndex;
      setLastAnswerCorrect(isCorrect);
      setShowResult(true);

      // Auto transition back to track after showing result
      setTimeout(() => {
        if (isSpecialQuestion && isCorrect) {
          setView('wheel');
        } else {
          setView('track');
          setTimeout(() => onNextQuestion(), 1000);
        }
      }, 2000);
    }
  }, [selectedAnswer, hasSubmitted, game.status, currentQuestion, onSubmitAnswer, isSpecialQuestion, onNextQuestion]);

  // Handle wheel spin
  const handleSpinWheel = useCallback(() => {
    setIsSpinning(true);

    // Random result after "spin"
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * EFFECT_WHEEL.length);
      const result = EFFECT_WHEEL[randomIndex];
      setSpinResult(result);
      setIsSpinning(false);

      // If self-buff, apply immediately
      if (EFFECTS[result].targetSelf) {
        onApplyEffect?.(result, currentPlayer?.odinhId);
        setTimeout(() => {
          setView('track');
          setSpinResult(null);
          onNextQuestion();
        }, 2000);
      } else {
        // Need to select target
        setView('target');
      }
    }, 2000);
  }, [currentPlayer, onApplyEffect, onNextQuestion]);

  // Handle target selection
  const handleSelectTarget = useCallback((targetId: string) => {
    if (!spinResult) return;
    setSelectedTarget(targetId);
    onApplyEffect?.(spinResult, targetId);

    setTimeout(() => {
      setView('track');
      setSpinResult(null);
      setSelectedTarget(null);
      onNextQuestion();
    }, 1500);
  }, [spinResult, onApplyEffect, onNextQuestion]);

  // Handle sinkhole escape tap
  const handleEscapeTap = useCallback(() => {
    setEscapeProgress(prev => {
      const newProgress = prev + 1;
      if (newProgress >= escapeRequired) {
        onEscapeTap?.();
        setTimeout(() => setView('track'), 500);
        return 0;
      }
      return newProgress;
    });
  }, [escapeRequired, onEscapeTap]);

  // Check if player is in sinkhole
  useEffect(() => {
    if (currentPlayer?.isEscaping) {
      setView('sinkhole');
      setEscapeProgress(0);
    }
  }, [currentPlayer?.isEscaping]);

  // === RENDER FUNCTIONS ===

  // Render vertical race track
  const renderTrackView = () => (
    <div className="race-v2-track">
      {/* Track header */}
      <div className="track-v2-header">
        <div className="track-v2-title">
          <span className="track-icon">🏁</span>
          <span>Câu {game.currentQuestionIndex + 1}/{game.questions.length}</span>
        </div>
        {isSpecialQuestion && (
          <div className="special-badge">⭐ Câu Đặc Biệt</div>
        )}
      </div>

      {/* Vertical track lanes */}
      <div className="track-v2-lanes">
        {/* Finish line at top */}
        <div className="finish-line-v2">
          <span>🏁 ĐÍCH 🏁</span>
        </div>

        {/* Track area */}
        <div className="track-v2-area">
          {sortedPlayers.map((player, idx) => {
            const isMe = player.odinhId === currentPlayer?.odinhId;
            void (100 - player.distance); // Position calculation reserved for future layout

            return (
              <div
                key={player.odinhId}
                className={`player-lane-v2 ${isMe ? 'is-me' : ''} ${player.isFrozen ? 'frozen' : ''}`}
                style={{ '--lane-index': idx } as React.CSSProperties}
              >
                {/* Player marker */}
                <div
                  className="player-marker-v2"
                  style={{ bottom: `${player.distance}%` }}
                >
                  {/* Effects indicators */}
                  {player.hasShield && <span className="effect-icon shield">🛡️</span>}
                  {player.isFrozen && <span className="effect-icon frozen">❄️</span>}
                  {player.activeFeatures.some(f => f.type === 'speed_boost') && (
                    <span className="effect-icon boost">🚀</span>
                  )}

                  {/* Vehicle */}
                  <div className={`vehicle-v2 ${isMe ? 'current' : ''}`}>
                    {player.vehicle.emoji}
                  </div>

                  {/* Name tag */}
                  <div className="player-tag-v2">
                    <span className="rank-v2">#{idx + 1}</span>
                    <span className="name-v2">{player.displayName}</span>
                    <span className="speed-v2">{Math.round(player.currentSpeed)} km/h</span>
                  </div>
                </div>

                {/* Lane line */}
                <div className="lane-line-v2" />
              </div>
            );
          })}
        </div>

        {/* Start line at bottom */}
        <div className="start-line-v2">
          <span>XUẤT PHÁT</span>
        </div>
      </div>

      {/* Current player stats */}
      {currentPlayer && (
        <div className="my-stats-v2">
          <div className="stat-v2">
            <Zap size={16} />
            <span>{Math.round(currentPlayer.currentSpeed)} km/h</span>
          </div>
          <div className="stat-v2">
            <span>🔥 {currentPlayer.streak}</span>
          </div>
          <div className="stat-v2 correct">
            <span>✓ {currentPlayer.correctAnswers}/{currentPlayer.totalAnswers}</span>
          </div>
          {currentPlayer.hasShield && (
            <div className="stat-v2 shield">
              <Shield size={16} />
            </div>
          )}
        </div>
      )}

      {/* Host controls */}
      {isHost && game.status === 'racing' && (
        <button className="next-question-btn" onClick={() => onNextQuestion()}>
          Câu Tiếp Theo
        </button>
      )}
    </div>
  );

  // Render question view
  const renderQuestionView = () => (
    <div className="race-v2-question">
      {/* Timer */}
      <div className={`timer-v2 ${timeLeft <= 5 ? 'warning' : ''}`}>
        <Clock size={20} />
        <span>{timeLeft}s</span>
        <div className="timer-bar-v2">
          <div
            className="timer-fill-v2"
            style={{ width: `${(timeLeft / (currentQuestion?.timeLimit || 15)) * 100}%` }}
          />
        </div>
      </div>

      {/* Special question badge */}
      {isSpecialQuestion && (
        <div className="special-question-badge">
          ⭐ Câu Đặc Biệt - Trả lời đúng để quay vòng quay! ⭐
        </div>
      )}

      {/* Question card */}
      <div className={`question-card-v2 ${isSpecialQuestion ? 'special' : ''}`}>
        <div className="difficulty-v2">
          {currentQuestion?.difficulty === 'easy' ? '⭐' :
           currentQuestion?.difficulty === 'medium' ? '⭐⭐' : '⭐⭐⭐'}
        </div>
        <h2 className="question-text-v2">{currentQuestion?.questionText}</h2>
        <div className="speed-bonus-v2">
          <Zap size={14} />
          +{currentQuestion?.speedBonus} km/h
        </div>
      </div>

      {/* Answer options - White background, A/B/C/D labels */}
      <div className="options-v2">
        {currentQuestion?.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrect = showResult && index === currentQuestion.correctIndex;
          const isWrong = showResult && isSelected && index !== currentQuestion.correctIndex;

          return (
            <button
              key={index}
              className={`option-v2 ${isSelected && !showResult ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
              onClick={() => handleSelectAnswer(index)}
              disabled={hasSubmitted}
            >
              <img src={ANSWER_OPTIONS[index].icon} alt={ANSWER_OPTIONS[index].label} className="option-icon-img" />
              <span className="option-text">{option}</span>
              {isCorrect && <span className="option-mark correct">✓</span>}
              {isWrong && <span className="option-mark wrong">✗</span>}
            </button>
          );
        })}
      </div>

      {/* Submit button - only show if not submitted yet */}
      {!hasSubmitted && (
        <button
          className={`submit-answer-btn ${selectedAnswer !== null ? 'ready' : 'disabled'}`}
          onClick={handleSubmitAnswer}
          disabled={selectedAnswer === null}
        >
          Trả Lời
        </button>
      )}

      {/* Result feedback */}
      {showResult && (
        <div className="result-v2">
          {lastAnswerCorrect ? (
            <div className="result-correct">
              <span>🎉 Chính xác! +{currentQuestion?.speedBonus} km/h</span>
            </div>
          ) : (
            <div className="result-wrong">
              <span>❌ Sai rồi!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Render wheel spin view
  const renderWheelView = () => (
    <div className="race-v2-wheel">
      <h2>🎰 Vòng Quay May Mắn!</h2>

      <div className={`wheel-container ${isSpinning ? 'spinning' : ''}`}>
        {EFFECT_WHEEL.map((effect, idx) => (
          <div
            key={effect}
            className={`wheel-segment ${spinResult === effect ? 'winner' : ''}`}
            style={{ '--segment-index': idx } as React.CSSProperties}
          >
            <span className="segment-emoji">{EFFECTS[effect].emoji}</span>
            <span className="segment-name">{EFFECTS[effect].name}</span>
          </div>
        ))}
        <div className="wheel-center">
          {isSpinning ? '🎲' : spinResult ? EFFECTS[spinResult].emoji : '?'}
        </div>
      </div>

      {!isSpinning && !spinResult && (
        <button className="spin-btn" onClick={handleSpinWheel}>
          Quay!
        </button>
      )}

      {spinResult && EFFECTS[spinResult].targetSelf && (
        <div className="wheel-result">
          <h3>Bạn nhận được: {EFFECTS[spinResult].name}!</h3>
          <p>{EFFECTS[spinResult].description}</p>
        </div>
      )}
    </div>
  );

  // Render target selection view
  const renderTargetView = () => (
    <div className="race-v2-target">
      <h2>
        <Target size={24} />
        Chọn Đối Thủ
      </h2>
      <p className="effect-preview">
        Sử dụng: {spinResult && EFFECTS[spinResult].emoji} {spinResult && EFFECTS[spinResult].name}
      </p>

      <div className="target-list">
        {opponents.map(player => (
          <button
            key={player.odinhId}
            className={`target-item ${selectedTarget === player.odinhId ? 'selected' : ''} ${player.hasShield ? 'shielded' : ''}`}
            onClick={() => !player.hasShield && handleSelectTarget(player.odinhId)}
            disabled={player.hasShield}
          >
            <span className="target-avatar">
              {player.avatar && isImageAvatar(player.avatar) ? (
                <img src={player.avatar} alt={player.displayName} />
              ) : (
                player.vehicle.emoji
              )}
            </span>
            <span className="target-name">{player.displayName}</span>
            <span className="target-speed">{Math.round(player.currentSpeed)} km/h</span>
            {player.hasShield && <span className="shield-badge">🛡️</span>}
          </button>
        ))}
      </div>

      {selectedTarget && (
        <div className="target-applied">
          Đã áp dụng {spinResult && EFFECTS[spinResult].name}!
        </div>
      )}
    </div>
  );

  // Render sinkhole escape mini-game
  const renderSinkholeView = () => (
    <div className="race-v2-sinkhole" onClick={handleEscapeTap}>
      <div className="sinkhole-bg">
        <div className="sinkhole-icon">🕳️</div>
        <h2>Bạn bị rơi vào hố!</h2>
        <p>Nhấn liên tục để thoát!</p>

        <div className="escape-progress">
          <div
            className="escape-fill"
            style={{ width: `${(escapeProgress / escapeRequired) * 100}%` }}
          />
        </div>
        <span className="escape-count">{escapeProgress}/{escapeRequired}</span>

        <div className="tap-indicator">
          <span>👆 TAP! 👆</span>
        </div>
      </div>
    </div>
  );

  // === MAIN RENDER ===
  return (
    <div className="racing-play-v2">
      {/* Leave button */}
      {onLeave && (
        <button className="leave-btn-v2" onClick={onLeave}>
          <LogOut size={16} />
        </button>
      )}

      {/* Render based on current view */}
      {view === 'track' && renderTrackView()}
      {view === 'question' && renderQuestionView()}
      {view === 'wheel' && renderWheelView()}
      {view === 'target' && renderTargetView()}
      {view === 'sinkhole' && renderSinkholeView()}
    </div>
  );
}
