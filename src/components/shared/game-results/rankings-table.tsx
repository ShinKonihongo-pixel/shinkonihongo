// Shared Rankings Table Component - Full rankings list with configurable columns

import { Crown } from 'lucide-react';
import { isImageAvatar } from '../../../utils/avatar-icons';
import type { BaseRankedPlayer } from './types';

interface RankingsTableProps {
  rankings: BaseRankedPlayer[];
  currentPlayerId?: string;
  className?: string;
  columns?: { key: string; label: string; render: (player: any) => React.ReactNode }[];
  title?: string;
  medalEmojis?: string[];
}

export function RankingsTable({
  rankings,
  currentPlayerId,
  className = '',
  columns = [],
  title = 'Bảng Xếp Hạng',
  medalEmojis = ['🥇', '🥈', '🥉'],
}: RankingsTableProps) {
  const renderAvatar = (avatar: string, displayName: string) => {
    if (isImageAvatar(avatar)) {
      return <img src={avatar} alt={displayName} />;
    }
    return avatar;
  };

  const getRankDisplay = (rank: number) => {
    return rank <= 3 ? medalEmojis[rank - 1] : `#${rank}`;
  };

  return (
    <div className={`full-rankings ${className}`}>
      <h3>{title}</h3>
      <div className="rankings-list">
        {rankings.map((player) => (
          <div
            key={player.id}
            className={`ranking-item ${player.id === currentPlayerId ? 'current' : ''} ${player.isWinner ? 'winner' : ''}`}
          >
            <div className="ranking-position">
              {getRankDisplay(player.rank)}
            </div>
            <div className="ranking-avatar">{renderAvatar(player.avatar, player.displayName)}</div>
            <div className="ranking-info">
              <span className="ranking-name">
                {player.displayName}
                {player.isWinner && <Crown size={14} className="winner-icon" />}
              </span>
            </div>
            <div className="ranking-stats">
              <span className="ranking-score">{player.score}</span>
              {columns.map((col) => (
                <span key={col.key} className={`ranking-${col.key}`}>
                  {col.render(player)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
