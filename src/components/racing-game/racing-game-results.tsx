// Racing Game Results - Final race results and rankings
// Shows podium, stats, team results, and play again options

import { Trophy, Target, Zap, Home, RotateCcw, Users, AlertTriangle } from 'lucide-react';
import type { RacingGameResults } from '../../types/racing-game';
import { TEAM_COLORS } from '../../types/racing-game';
import { isImageAvatar } from '../../utils/avatar-icons';
import { TeamResults } from './shared/team-view';

// Helper to render avatar
function renderAvatar(avatar: string | undefined, name: string) {
  if (avatar && isImageAvatar(avatar)) {
    return <img src={avatar} alt={name} />;
  }
  return avatar || name.charAt(0).toUpperCase();
}

interface RacingGameResultsProps {
  results: RacingGameResults;
  currentPlayerId?: string;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

// Medal emojis for podium
const MEDAL_EMOJIS = ['🥇', '🥈', '🥉'];

export function RacingGameResults({
  results,
  currentPlayerId,
  onPlayAgain,
  onGoHome,
}: RacingGameResultsProps) {
  const top3 = results.rankings.slice(0, 3);
  const currentPlayerResult = currentPlayerId
    ? results.rankings.find(r => r.odinhId === currentPlayerId)
    : results.rankings[0];
  const currentPosition = currentPlayerResult?.position || 0;
  const isTeamMode = results.gameMode === 'team';
  const teamRankings = results.teamRankings;

  return (
    <div className="racing-results">
      {/* Header */}
      <div className="results-header">
        <div className="results-icon">{results.raceType === 'boat' ? '🚣' : '🏇'}</div>
        <h1>Kết Quả Cuộc Đua</h1>
        <p>Đường đua {results.trackLength} km - {results.totalQuestions} câu hỏi</p>
        {isTeamMode && <span className="mode-badge team"><Users size={14} /> Chế độ Đội</span>}
      </div>

      {/* Team Results (for team mode) */}
      {isTeamMode && teamRankings && teamRankings.length > 0 && (
        <TeamResults
          teamRankings={teamRankings}
          currentTeamId={currentPlayerResult?.teamId}
        />
      )}

      {/* Podium */}
      <div className="results-podium">
        {/* 2nd Place */}
        {top3[1] && (
          <div className="podium-place second">
            <div className="podium-player">
              <span className="player-avatar">{renderAvatar(top3[1].avatar, top3[1].displayName)}</span>
              <span className="player-vehicle">{top3[1].vehicle.emoji}</span>
            </div>
            <span className="player-name">{top3[1].displayName}</span>
            <div className="podium-block">
              <span className="medal">{MEDAL_EMOJIS[1]}</span>
              <span className="position">2nd</span>
            </div>
          </div>
        )}

        {/* 1st Place */}
        {top3[0] && (
          <div className="podium-place first">
            <div className="winner-crown">👑</div>
            <div className="podium-player">
              <span className="player-avatar">{renderAvatar(top3[0].avatar, top3[0].displayName)}</span>
              <span className="player-vehicle">{top3[0].vehicle.emoji}</span>
            </div>
            <span className="player-name">{top3[0].displayName}</span>
            <div className="podium-block">
              <span className="medal">{MEDAL_EMOJIS[0]}</span>
              <span className="position">1st</span>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {top3[2] && (
          <div className="podium-place third">
            <div className="podium-player">
              <span className="player-avatar">{renderAvatar(top3[2].avatar, top3[2].displayName)}</span>
              <span className="player-vehicle">{top3[2].vehicle.emoji}</span>
            </div>
            <span className="player-name">{top3[2].displayName}</span>
            <div className="podium-block">
              <span className="medal">{MEDAL_EMOJIS[2]}</span>
              <span className="position">3rd</span>
            </div>
          </div>
        )}
      </div>

      {/* Your Result */}
      {currentPlayerResult && (
        <div className={`your-result ${currentPosition <= 3 ? 'winner' : ''}`}>
          <div className="your-result-header">
            <Trophy size={24} />
            <span>Kết quả của bạn</span>
          </div>
          <div className="your-result-content">
            <div className="result-position">
              {currentPosition <= 3 ? MEDAL_EMOJIS[currentPosition - 1] : `#${currentPosition}`}
            </div>
            <div className="result-stats">
              <div className="result-stat">
                <Target size={16} />
                <span>Độ chính xác: {currentPlayerResult.accuracy.toFixed(1)}%</span>
              </div>
              <div className="result-stat">
                <span>✓ Đúng: {currentPlayerResult.correctAnswers}/{results.totalQuestions}</span>
              </div>
              <div className="result-stat">
                <Zap size={16} />
                <span>Quãng đường: {currentPlayerResult.distance.toFixed(1)}%</span>
              </div>
              <div className="result-stat points">
                <span>+{currentPlayerResult.pointsEarned} điểm</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Rankings */}
      <div className="full-rankings">
        <h3>{isTeamMode ? 'Bảng Xếp Hạng Cá Nhân' : 'Bảng Xếp Hạng'}</h3>
        <div className="rankings-list">
          {results.rankings.map((player, idx) => {
            const teamColor = player.teamId && isTeamMode
              ? TEAM_COLORS[results.teamRankings?.find(t => t.teamId === player.teamId)?.colorKey || 'red']
              : null;

            return (
              <div
                key={player.odinhId}
                className={`ranking-item ${player.odinhId === currentPlayerId ? 'current' : ''}`}
                style={teamColor ? { '--team-color': teamColor.color, borderLeftColor: teamColor.color } as React.CSSProperties : undefined}
              >
                <div className="ranking-position">
                  {idx < 3 ? MEDAL_EMOJIS[idx] : `#${idx + 1}`}
                </div>
                {teamColor && (
                  <div className="ranking-team-indicator" style={{ backgroundColor: teamColor.color }}>
                    {teamColor.emoji}
                  </div>
                )}
                <div className="ranking-avatar">{renderAvatar(player.avatar, player.displayName)}</div>
                <div className="ranking-info">
                  <span className="ranking-name">{player.displayName}</span>
                  <span className="ranking-vehicle">{player.vehicle.emoji} {player.vehicle.name}</span>
                </div>
                <div className="ranking-stats">
                  <span className="ranking-distance">{player.distance.toFixed(1)}%</span>
                  <span className="ranking-accuracy">{player.accuracy.toFixed(0)}% đúng</span>
                  {(player.trapsTriggered > 0 || player.trapsPlaced > 0) && (
                    <span className="ranking-traps" title="Bẫy trúng/đặt">
                      <AlertTriangle size={12} /> {player.trapsTriggered}/{player.trapsPlaced}
                    </span>
                  )}
                </div>
                <div className="ranking-points">+{player.pointsEarned}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="results-actions">
        <button className="play-again-btn" onClick={onPlayAgain}>
          <RotateCcw size={20} />
          Chơi Lại
        </button>
        <button className="go-home-btn" onClick={onGoHome}>
          <Home size={20} />
          Về Trang Chủ
        </button>
      </div>
    </div>
  );
}
