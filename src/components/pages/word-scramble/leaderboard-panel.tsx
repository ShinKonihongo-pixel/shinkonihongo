import React from 'react';
import { Users, Award } from 'lucide-react';
import type { Player } from './word-scramble-types';
import { ROLE_COLORS } from './word-scramble-constants';

interface LeaderboardPanelProps {
  players: Player[];
  isSoloMode: boolean;
}

export const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({ players, isSoloMode }) => {
  if (isSoloMode) return null;

  const userRank = players.findIndex(p => p.isCurrentUser) + 1;

  const getPlayerNameColor = (player: Player) => {
    if (player.role && player.role !== 'user') {
      return ROLE_COLORS[player.role];
    }
    return '#ffffff';
  };

  return (
    <div className="ws-leaderboard-card">
      <div className="ws-leaderboard-header">
        <Users size={18} />
        <h3>Bảng xếp hạng</h3>
      </div>
      <div className="ws-leaderboard-list">
        {players.map((player, index) => (
          <div
            key={player.id}
            className={`ws-player-row ${player.isCurrentUser ? 'current-user' : ''} ${index < 3 ? 'top-3' : ''}`}
          >
            <div className="player-rank">
              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
            </div>
            <div className="player-avatar">{player.avatar}</div>
            <div className="player-info">
              <span className="player-name" style={{ color: getPlayerNameColor(player) }}>
                {player.name}
              </span>
              <span className="player-correct">{player.correctAnswers} đúng</span>
            </div>
            <div className="player-score">{player.score}</div>
          </div>
        ))}
      </div>
      {/* Current rank */}
      <div className="ws-your-rank">
        <Award size={16} />
        <span>Vị trí của bạn: #{userRank}</span>
      </div>
    </div>
  );
};
