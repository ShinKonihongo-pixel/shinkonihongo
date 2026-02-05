// Starting countdown screen component
import { Zap, LogOut } from 'lucide-react';

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
      <div className="starting-content">
        <div className="starting-icon">
          <Zap size={64} />
        </div>
        <h1 className="starting-title">Chuẩn bị!</h1>
        <div className="starting-countdown">
          <span className="countdown-number">{countdown}</span>
        </div>
        <p className="starting-hint">Game sắp bắt đầu...</p>
      </div>
    </div>
  );
}
