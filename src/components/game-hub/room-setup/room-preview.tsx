import { Users, HelpCircle, Clock, Layers, Sparkles } from 'lucide-react';
import type { GameInfo } from '../../../types/game-hub';
import type { GameSetupConfig } from './types';

interface RoomPreviewProps {
  gameInfo: GameInfo;
  config: GameSetupConfig;
  title: string;
  maxPlayers: number;
  totalRounds?: number;
  timePerQuestion?: number;
  jlptLevel?: string;
  skillsEnabled?: boolean;
}

export function RoomPreview({
  gameInfo,
  config,
  title,
  maxPlayers,
  totalRounds,
  timePerQuestion,
  jlptLevel,
  skillsEnabled,
}: RoomPreviewProps) {
  return (
    <div className="rm-preview">
      <div className="rm-preview-header">
        <span className="rm-preview-icon" style={{ background: gameInfo.gradient }}>
          {gameInfo.icon}
        </span>
        <div className="rm-preview-title">
          <span className="rm-preview-name">{title || gameInfo.name}</span>
          <span className="rm-preview-game">{gameInfo.name}</span>
        </div>
      </div>
      <div className="rm-preview-stats">
        <div className="rm-preview-stat">
          <Users size={14} />
          <span>{maxPlayers} người</span>
        </div>
        {config.showTotalRounds && totalRounds && (
          <div className="rm-preview-stat">
            <HelpCircle size={14} />
            <span>{totalRounds} câu</span>
          </div>
        )}
        {config.showTimePerQuestion && timePerQuestion && (
          <div className="rm-preview-stat">
            <Clock size={14} />
            <span>{timePerQuestion}s/câu</span>
          </div>
        )}
        {config.showJLPTLevel && jlptLevel && (
          <div className="rm-preview-stat">
            <Layers size={14} />
            <span>{jlptLevel}</span>
          </div>
        )}
        {skillsEnabled && (
          <div className="rm-preview-stat highlight">
            <Sparkles size={14} />
            <span>Kỹ năng</span>
          </div>
        )}
      </div>
    </div>
  );
}
