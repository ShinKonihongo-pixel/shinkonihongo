// Team View Components - Display team information and selection
// TeamCard: Shows team info
// TeamScoreboard: Ranking of teams
// TeamSelector: UI for selecting team in lobby

import type { RacingTeam, RacingPlayer, RacingTeamResult } from '../../../types/racing-game';
import { TEAM_COLORS } from '../../../types/racing-game';
import { isImageAvatar } from '../../../utils/avatar-icons';

interface TeamCardProps {
  team: RacingTeam;
  players: RacingPlayer[];
  isSelected?: boolean;
  onSelect?: () => void;
  compact?: boolean;
}

// Card showing team information
export function TeamCard({ team, players, isSelected, onSelect, compact }: TeamCardProps) {
  const teamColor = TEAM_COLORS[team.colorKey];
  const memberPlayers = players.filter(p => p.teamId === team.id);

  return (
    <div
      className={`team-card ${teamColor.bgClass} ${isSelected ? 'selected' : ''} ${compact ? 'compact' : ''}`}
      onClick={onSelect}
      style={{ '--team-color': teamColor.color } as React.CSSProperties}
    >
      <div className="team-card-header">
        <span className="team-emoji">{team.emoji}</span>
        <span className="team-name">{team.name}</span>
        {isSelected && <span className="selected-badge">✓</span>}
      </div>

      {!compact && (
        <>
          <div className="team-members">
            {memberPlayers.map(player => (
              <div key={player.odinhId} className="team-member">
                <span className="member-avatar">
                  {player.avatar && isImageAvatar(player.avatar) ? (
                    <img src={player.avatar} alt={player.displayName} />
                  ) : (
                    player.avatar || player.displayName.charAt(0)
                  )}
                </span>
                <span className="member-name">{player.displayName}</span>
                {player.isBot && <span className="bot-tag">BOT</span>}
              </div>
            ))}
            {memberPlayers.length === 0 && (
              <div className="no-members">Chưa có thành viên</div>
            )}
          </div>

          <div className="team-stats">
            <div className="stat-item">
              <span className="stat-label">Thành viên</span>
              <span className="stat-value">{memberPlayers.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Tổng khoảng cách</span>
              <span className="stat-value">{team.totalDistance.toFixed(1)}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Tổng điểm</span>
              <span className="stat-value">{team.totalPoints}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface TeamScoreboardProps {
  teams: Record<string, RacingTeam>;
  players: RacingPlayer[];
  currentTeamId?: string;
}

// Scoreboard showing team rankings
export function TeamScoreboard({ teams, players, currentTeamId }: TeamScoreboardProps) {
  const sortedTeams = Object.values(teams).sort((a, b) => b.totalDistance - a.totalDistance);

  return (
    <div className="team-scoreboard">
      <div className="scoreboard-header">
        <span className="header-icon">🏆</span>
        <span className="header-title">Bảng Xếp Hạng Đội</span>
      </div>

      <div className="scoreboard-list">
        {sortedTeams.map((team, idx) => {
          const teamColor = TEAM_COLORS[team.colorKey];
          const memberCount = players.filter(p => p.teamId === team.id).length;
          const isCurrentTeam = team.id === currentTeamId;

          return (
            <div
              key={team.id}
              className={`scoreboard-item ${teamColor.bgClass} ${isCurrentTeam ? 'current' : ''}`}
              style={{ '--team-color': teamColor.color } as React.CSSProperties}
            >
              <div className="item-position">
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
              </div>
              <div className="item-team">
                <span className="team-emoji">{team.emoji}</span>
                <span className="team-name">{team.name}</span>
              </div>
              <div className="item-stats">
                <span className="stat-members">{memberCount} người</span>
                <span className="stat-distance">{team.totalDistance.toFixed(1)}%</span>
                <span className="stat-points">{team.totalPoints} điểm</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface TeamSelectorProps {
  teams: Record<string, RacingTeam>;
  players: RacingPlayer[];
  currentTeamId?: string;
  onSelectTeam: (teamId: string) => void;
}

// UI for selecting/changing team in lobby
export function TeamSelector({
  teams,
  players,
  currentTeamId,
  onSelectTeam,
}: TeamSelectorProps) {
  const teamList = Object.values(teams);

  return (
    <div className="team-selector">
      <div className="selector-header">
        <span className="header-icon">🎯</span>
        <span className="header-title">Chọn Đội</span>
      </div>

      <div className="selector-grid">
        {teamList.map(team => {
          const memberPlayers = players.filter(p => p.teamId === team.id);
          const isSelected = team.id === currentTeamId;

          return (
            <TeamCard
              key={team.id}
              team={team}
              players={memberPlayers}
              isSelected={isSelected}
              onSelect={() => onSelectTeam(team.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

interface TeamIndicatorProps {
  teamId: string;
  teams: Record<string, RacingTeam>;
  size?: 'small' | 'medium' | 'large';
}

// Small indicator showing team color/emoji
export function TeamIndicator({ teamId, teams, size = 'small' }: TeamIndicatorProps) {
  const team = teams[teamId];
  if (!team) return null;

  const teamColor = TEAM_COLORS[team.colorKey];

  return (
    <div
      className={`team-indicator size-${size}`}
      style={{ '--team-color': teamColor.color } as React.CSSProperties}
      title={team.name}
    >
      <span className="indicator-emoji">{team.emoji}</span>
    </div>
  );
}

interface TeamResultsProps {
  teamRankings: RacingTeamResult[];
  currentTeamId?: string;
}

// Team results view for game results screen
export function TeamResults({ teamRankings, currentTeamId }: TeamResultsProps) {
  const top3 = teamRankings.slice(0, 3);

  return (
    <div className="team-results">
      <div className="results-header">
        <span className="header-icon">🏆</span>
        <h2>Kết Quả Đội</h2>
      </div>

      {/* Podium */}
      <div className="team-podium">
        {/* 2nd place */}
        {top3[1] && (
          <div className="podium-place second">
            <TeamPodiumItem team={top3[1]} position={2} />
          </div>
        )}

        {/* 1st place */}
        {top3[0] && (
          <div className="podium-place first">
            <div className="winner-crown">👑</div>
            <TeamPodiumItem team={top3[0]} position={1} />
          </div>
        )}

        {/* 3rd place */}
        {top3[2] && (
          <div className="podium-place third">
            <TeamPodiumItem team={top3[2]} position={3} />
          </div>
        )}
      </div>

      {/* Full rankings */}
      <div className="team-rankings-list">
        {teamRankings.map((team, idx) => {
          const teamColor = TEAM_COLORS[team.colorKey];
          const isCurrentTeam = team.teamId === currentTeamId;

          return (
            <div
              key={team.teamId}
              className={`ranking-item ${teamColor.bgClass} ${isCurrentTeam ? 'current' : ''}`}
              style={{ '--team-color': teamColor.color } as React.CSSProperties}
            >
              <div className="ranking-position">
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
              </div>
              <div className="ranking-team">
                <span className="team-emoji">{team.emoji}</span>
                <span className="team-name">{team.teamName}</span>
              </div>
              <div className="ranking-stats">
                <span className="stat">{team.memberCount} người</span>
                <span className="stat">{team.totalDistance.toFixed(1)}%</span>
                <span className="stat">{team.totalPoints} điểm</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TeamPodiumItem({ team, position }: { team: RacingTeamResult; position: number }) {
  const teamColor = TEAM_COLORS[team.colorKey];
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="podium-item" style={{ '--team-color': teamColor.color } as React.CSSProperties}>
      <div className="podium-emoji">{team.emoji}</div>
      <div className="podium-name">{team.teamName}</div>
      <div className="podium-stats">
        <span>{team.totalDistance.toFixed(1)}%</span>
        <span>{team.totalPoints} điểm</span>
      </div>
      <div className="podium-block">
        <span className="medal">{medals[position - 1]}</span>
        <span className="position-text">{position === 1 ? '1st' : position === 2 ? '2nd' : '3rd'}</span>
      </div>
    </div>
  );
}
