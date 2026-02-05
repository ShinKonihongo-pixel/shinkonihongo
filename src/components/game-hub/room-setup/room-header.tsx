import { ArrowLeft, X } from 'lucide-react';
import type { GameInfo } from '../../../types/game-hub';

interface RoomHeaderProps {
  gameInfo: GameInfo;
  onBack: () => void;
}

export function RoomHeader({ gameInfo, onBack }: RoomHeaderProps) {
  return (
    <header className="rm-header">
      <div className="rm-header-gradient" style={{ background: gameInfo.gradient }} />
      <button className="rm-back-btn" onClick={onBack} type="button">
        <ArrowLeft size={20} />
      </button>
      <div className="rm-header-icon" style={{ background: gameInfo.gradient }}>
        {gameInfo.iconImage ? (
          <img src={gameInfo.iconImage} alt={gameInfo.name} />
        ) : (
          <span>{gameInfo.icon}</span>
        )}
      </div>
      <div className="rm-header-content">
        <h1 className="rm-title">Tạo Phòng Chơi</h1>
        <span className="rm-subtitle">{gameInfo.name}</span>
      </div>
      <button className="rm-close-btn" onClick={onBack} type="button">
        <X size={20} />
      </button>
    </header>
  );
}
