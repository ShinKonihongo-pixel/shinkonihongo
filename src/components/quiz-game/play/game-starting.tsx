// Starting countdown — cinematic battle intro
import { Swords, Shield, Zap, LogOut } from 'lucide-react';

interface GameStartingProps {
  countdown: number;
  onLeaveGame: () => Promise<void>;
}

export function GameStarting({ countdown, onLeaveGame }: GameStartingProps) {
  return (
    <div className="game-fullscreen game-starting-screen">
      <button className="leave-game-btn floating" onClick={onLeaveGame} title="Rời game">
        <LogOut size={18} /> Rời
      </button>

      {/* Layered background effects */}
      <div className="starting-bg-rings">
        <div className="ring ring-1" />
        <div className="ring ring-2" />
        <div className="ring ring-3" />
      </div>
      <div className="starting-particles">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="starting-particle" style={{
            left: `${10 + Math.random() * 80}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
          }} />
        ))}
      </div>

      <div className="starting-content">
        {/* Battle icons */}
        <div className="starting-battle-icons">
          <Shield size={28} className="battle-icon-left" />
          <div className="battle-icon-center-wrap">
            <Swords size={36} className="battle-icon-center" />
          </div>
          <Zap size={28} className="battle-icon-right" />
        </div>

        <h1 className="starting-title">Chuẩn Bị Chiến Đấu!</h1>

        <div className="starting-countdown">
          <svg className="countdown-ring" viewBox="0 0 120 120">
            <circle className="countdown-ring-bg" cx="60" cy="60" r="52" />
            <circle
              className="countdown-ring-progress"
              cx="60" cy="60" r="52"
              strokeDasharray={`${(countdown / 3) * 327} 327`}
            />
          </svg>
          <span className="countdown-number" key={countdown}>{countdown}</span>
        </div>

        <p className="starting-hint">Trận đấu sắp bắt đầu...</p>
      </div>
    </div>
  );
}
