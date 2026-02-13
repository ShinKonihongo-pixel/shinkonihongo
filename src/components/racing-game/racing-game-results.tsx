// Racing Game Results - Final race results and rankings
// Shows podium, stats, team results, and play again options

import { Trophy, Target, Zap, Users, AlertTriangle } from 'lucide-react';
import type { RacingGameResults } from '../../types/racing-game';
import { TEAM_COLORS } from '../../types/racing-game';
import { isImageAvatar } from '../../utils/avatar-icons';
import { TeamResults } from './shared/team-view';
import { Podium, RankingsTable, ResultsActionBar, type BaseRankedPlayer } from '../shared/game-results';

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
  const currentPlayerResult = currentPlayerId
    ? results.rankings.find(r => r.odinhId === currentPlayerId)
    : results.rankings[0];
  const currentPosition = currentPlayerResult?.position || 0;
  const isTeamMode = results.gameMode === 'team';
  const teamRankings = results.teamRankings;

  // Map to BaseRankedPlayer
  const rankedPlayers: BaseRankedPlayer[] = results.rankings.map(player => ({
    id: player.odinhId,
    displayName: player.displayName,
    avatar: player.avatar,
    rank: player.position,
    score: player.pointsEarned,
    isWinner: player.position === 1,
  }));

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
      <Podium
        players={rankedPlayers}
        renderPlayerExtra={(player) => {
          const originalPlayer = results.rankings.find(p => p.odinhId === player.id);
          return <span className="player-vehicle">{originalPlayer?.vehicle.emoji}</span>;
        }}
        showCrown={true}
        medalEmojis={MEDAL_EMOJIS}
      />

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
      <RankingsTable
        rankings={rankedPlayers}
        currentPlayerId={currentPlayerId}
        title={isTeamMode ? 'Bảng Xếp Hạng Cá Nhân' : 'Bảng Xếp Hạng'}
        medalEmojis={MEDAL_EMOJIS}
        columns={[
          {
            key: 'vehicle',
            label: 'Phương tiện',
            render: (player) => {
              const originalPlayer = results.rankings.find(p => p.odinhId === player.id);
              return (
                <span className="ranking-vehicle">
                  {originalPlayer?.vehicle.emoji} {originalPlayer?.vehicle.name}
                </span>
              );
            },
          },
          {
            key: 'distance',
            label: 'Quãng đường',
            render: (player) => {
              const originalPlayer = results.rankings.find(p => p.odinhId === player.id);
              return (
                <>
                  <span className="ranking-distance">{originalPlayer?.distance.toFixed(1)}%</span>
                  <span className="ranking-accuracy">{originalPlayer?.accuracy.toFixed(0)}% đúng</span>
                  {originalPlayer && (originalPlayer.trapsTriggered > 0 || originalPlayer.trapsPlaced > 0) && (
                    <span className="ranking-traps" title="Bẫy trúng/đặt">
                      <AlertTriangle size={12} /> {originalPlayer.trapsTriggered}/{originalPlayer.trapsPlaced}
                    </span>
                  )}
                  <span className="ranking-points">+{originalPlayer?.pointsEarned}</span>
                </>
              );
            },
          },
        ]}
      />

      {/* Actions */}
      <ResultsActionBar
        onPlayAgain={onPlayAgain}
        onGoHome={onGoHome}
        playAgainLabel="Chơi Lại"
        goHomeLabel="Về Trang Chủ"
      />
    </div>
  );
}
