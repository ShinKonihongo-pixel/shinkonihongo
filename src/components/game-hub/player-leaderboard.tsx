// Player Leaderboard - Shared component for displaying player rankings in games
// Shows avatar, name, score, rank, and answer status (correct/wrong)
// Supports VIP styling for premium users

import { useMemo } from 'react';
import { Trophy, Crown, Medal } from 'lucide-react';
import { isImageAvatar } from '../../utils/avatar-icons';

// VIP roles that get special styling
const VIP_ROLES = ['vip_user', 'super_admin', 'director', 'admin'];

// Generic player data for leaderboard
export interface LeaderboardPlayer {
  id: string;
  displayName: string;
  avatar: string;
  score: number;
  // Optional fields for different game contexts
  isCurrentUser?: boolean;
  answerStatus?: 'correct' | 'wrong' | 'pending' | 'none';
  streak?: number;
  isBot?: boolean;
  isEliminated?: boolean;
  extraInfo?: string; // For game-specific info (e.g., "3 dãy" for bingo)
  role?: string; // User role for VIP styling
}

// Helper to render avatar (image or emoji)
function renderAvatar(avatar: string | undefined, fallback: string = '👤') {
  if (!avatar) return fallback;
  if (isImageAvatar(avatar)) {
    return <img src={avatar} alt="avatar" />;
  }
  return avatar;
}

interface PlayerLeaderboardProps {
  players: LeaderboardPlayer[];
  currentUserId?: string;
  title?: string;
  showRank?: boolean;
  showAnswerStatus?: boolean;
  maxVisible?: number;
  compact?: boolean;
  className?: string;
}

export function PlayerLeaderboard({
  players,
  currentUserId,
  title = 'Bảng Xếp Hạng',
  showRank = true,
  showAnswerStatus = true,
  maxVisible = 10,
  compact = false,
  className = '',
}: PlayerLeaderboardProps) {
  // Sort players by score (descending)
  const sortedPlayers = useMemo(() => {
    return [...players]
      .sort((a, b) => b.score - a.score)
      .slice(0, maxVisible);
  }, [players, maxVisible]);

  // Get rank icon
  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <Crown size={16} className="rank-icon gold" />;
    if (rank === 2) return <Medal size={16} className="rank-icon silver" />;
    if (rank === 3) return <Medal size={16} className="rank-icon bronze" />;
    return <span className="rank-number">{rank}</span>;
  };

  // Get answer status indicator
  const getAnswerIndicator = (status?: LeaderboardPlayer['answerStatus']) => {
    switch (status) {
      case 'correct':
        return <span className="answer-indicator correct">✓</span>;
      case 'wrong':
        return <span className="answer-indicator wrong">✗</span>;
      case 'pending':
        return <span className="answer-indicator pending">...</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`player-leaderboard ${compact ? 'compact' : ''} ${className}`}>
      <div className="leaderboard-header">
        <Trophy size={18} />
        <h4>{title}</h4>
        <span className="player-count">{players.length}</span>
      </div>

      <div className="leaderboard-list">
        {sortedPlayers.map((player, index) => {
          const rank = index + 1;
          const isCurrentUser = player.isCurrentUser || player.id === currentUserId;
          const isVip = player.role && VIP_ROLES.includes(player.role);
          const roleClass = player.role ? `role-${player.role}` : '';

          return (
            <div
              key={player.id}
              className={`leaderboard-item ${isCurrentUser ? 'current-user' : ''} ${
                player.isEliminated ? 'eliminated' : ''
              } ${player.answerStatus === 'correct' ? 'just-correct' : ''} ${
                player.answerStatus === 'wrong' ? 'just-wrong' : ''
              } ${isVip ? 'vip-player' : ''}`}
            >
              {/* Rank */}
              {showRank && (
                <div className={`player-rank rank-${rank}`}>
                  {getRankDisplay(rank)}
                </div>
              )}

              {/* Avatar with VIP frame effect */}
              <div className={`player-avatar ${isVip ? 'vip-avatar' : ''} ${roleClass}`}>
                <span className="avatar-emoji">{renderAvatar(player.avatar)}</span>
                {player.isBot && <span className="bot-badge">Bot</span>}
                {isVip && <span className="vip-frame" />}
              </div>

              {/* Name and extra info */}
              <div className="player-info">
                <span className={`player-name ${isVip ? `vip-name role-name-${player.role}` : ''}`} title={player.displayName}>
                  {player.displayName}
                </span>
                {player.extraInfo && (
                  <span className="player-extra">{player.extraInfo}</span>
                )}
              </div>

              {/* Score */}
              <div className="player-score">
                <span className="score-value">{player.score.toLocaleString()}</span>
                {player.streak && player.streak > 1 && (
                  <span className="streak-badge">🔥{player.streak}</span>
                )}
              </div>

              {/* Answer status */}
              {showAnswerStatus && getAnswerIndicator(player.answerStatus)}
            </div>
          );
        })}

        {/* Show more indicator if there are more players */}
        {players.length > maxVisible && (
          <div className="leaderboard-more">
            +{players.length - maxVisible} người chơi khác
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to convert game-specific player to LeaderboardPlayer
// eslint-disable-next-line react-refresh/only-export-components
export function toLeaderboardPlayer<T extends {
  odinhId?: string;
  id?: string;
  displayName: string;
  avatar: string;
  score?: number;
  isBot?: boolean;
  role?: string;
}>(
  player: T,
  options?: {
    scoreField?: keyof T;
    extraInfo?: string;
    answerStatus?: LeaderboardPlayer['answerStatus'];
    isEliminated?: boolean;
  }
): LeaderboardPlayer {
  const score = options?.scoreField
    ? (player[options.scoreField] as number) || 0
    : player.score || 0;

  return {
    id: player.odinhId || player.id || '',
    displayName: player.displayName,
    avatar: player.avatar,
    score,
    isBot: player.isBot,
    role: player.role,
    extraInfo: options?.extraInfo,
    answerStatus: options?.answerStatus,
    isEliminated: options?.isEliminated,
  };
}
