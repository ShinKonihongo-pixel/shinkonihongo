// Trap System Components - Display and handle trap interactions
// TrapMarker: Shows trap on track
// TrapTriggeredOverlay: Overlay when player hits trap
// EscapeMiniGame: Mini-game to escape sinkhole trap

import { useEffect, useState } from 'react';
import type { Trap, TrapType, ActiveTrapEffect } from '../../../types/racing-game';
import { TRAPS } from '../../../types/racing-game';

interface TrapMarkerProps {
  trap: Trap;
  trackWidth: number;
}

// Trap marker shown on the race track
export function TrapMarker({ trap }: TrapMarkerProps) {
  const trapDef = TRAPS[trap.type];

  return (
    <div
      className={`trap-marker trap-${trap.type}`}
      style={{ left: `${trap.position}%` }}
      title={trapDef.name}
    >
      <span className="trap-emoji">{trapDef.emoji}</span>
      <div className="trap-pulse" />
    </div>
  );
}

interface TrapTriggeredOverlayProps {
  trapType: TrapType;
  onDismiss: () => void;
  isEscapeRequired?: boolean;
  onEscapeTap?: () => void;
  escapeProgress?: number;
}

// Overlay shown when player hits a trap
export function TrapTriggeredOverlay({
  trapType,
  onDismiss,
  isEscapeRequired,
  onEscapeTap,
  escapeProgress = 0,
}: TrapTriggeredOverlayProps) {
  const trapDef = TRAPS[trapType];
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setShowContent(true), 100);

    // Auto dismiss after 3 seconds if not escape required
    if (!isEscapeRequired) {
      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [isEscapeRequired, onDismiss]);

  return (
    <div className={`trap-triggered-overlay trap-${trapType}`}>
      <div className={`trap-triggered-content ${showContent ? 'show' : ''}`}>
        <div className="trap-triggered-icon shake">
          {trapDef.emoji}
        </div>
        <h2 className="trap-triggered-title">
          {trapType === 'imprisonment' && 'Bị Giam!'}
          {trapType === 'freeze' && 'Bị Đóng Băng!'}
          {trapType === 'sinkhole' && 'Rơi Hố Sụt!'}
        </h2>
        <p className="trap-triggered-desc">{trapDef.description}</p>

        {isEscapeRequired ? (
          <EscapeMiniGame
            onTap={onEscapeTap!}
            progress={escapeProgress}
            onComplete={onDismiss}
          />
        ) : (
          <div className="trap-duration">
            <span className="duration-icon">⏱️</span>
            <span>{trapDef.effect.duration} lượt</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface EscapeMiniGameProps {
  onTap: () => void;
  progress: number;
  onComplete: () => void;
}

// Mini-game to escape from sinkhole trap
export function EscapeMiniGame({ onTap, progress, onComplete }: EscapeMiniGameProps) {
  const [taps, setTaps] = useState(0);
  const isComplete = progress >= 100;

  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(onComplete, 500);
      return () => clearTimeout(timer);
    }
  }, [isComplete, onComplete]);

  const handleTap = () => {
    if (!isComplete) {
      setTaps(prev => prev + 1);
      onTap();
    }
  };

  return (
    <div className="escape-mini-game">
      <p className="escape-instruction">
        {isComplete ? 'Thoát thành công!' : 'Nhấn nhanh để thoát!'}
      </p>

      <div className="escape-progress-bar">
        <div
          className="escape-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {!isComplete && (
        <button
          className="escape-tap-button"
          onClick={handleTap}
          onTouchStart={handleTap}
        >
          <span className="tap-icon">👆</span>
          <span className="tap-text">NHẤN!</span>
          <span className="tap-count">{taps}</span>
        </button>
      )}

      {isComplete && (
        <div className="escape-success">
          <span className="success-icon">🎉</span>
          <span>Thoát thành công!</span>
        </div>
      )}
    </div>
  );
}

interface TrapEffectIndicatorProps {
  effects: ActiveTrapEffect[];
}

// Shows active trap effects on player
export function TrapEffectIndicator({ effects }: TrapEffectIndicatorProps) {
  if (effects.length === 0) return null;

  return (
    <div className="trap-effect-indicator">
      {effects.map((effect, idx) => {
        const trapDef = TRAPS[effect.trapType];
        return (
          <div key={idx} className={`effect-badge effect-${effect.trapType}`}>
            <span className="effect-emoji">{trapDef.emoji}</span>
            <span className="effect-duration">{effect.remainingRounds}</span>
          </div>
        );
      })}
    </div>
  );
}

interface TrapWarningProps {
  distance: number;
  traps: Trap[];
  warningRange?: number;
}

// Warning indicator when player is approaching a trap
export function TrapWarning({ distance, traps, warningRange = 10 }: TrapWarningProps) {
  const nearbyTrap = traps.find(
    trap => trap.isActive && trap.position > distance && trap.position <= distance + warningRange
  );

  if (!nearbyTrap) return null;

  const trapDef = TRAPS[nearbyTrap.type];

  return (
    <div className="trap-warning">
      <span className="warning-icon">⚠️</span>
      <span className="warning-text">Bẫy {trapDef.name} phía trước!</span>
      <span className="warning-emoji">{trapDef.emoji}</span>
    </div>
  );
}
