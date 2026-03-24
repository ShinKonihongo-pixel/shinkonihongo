// Shared Podium Component - Top 3 players display
// Layout: 2nd - 1st - 3rd with medals and customizable extras

import { Crown } from 'lucide-react';
import { isImageAvatar } from '../../../utils/avatar-icons';
import type { BaseRankedPlayer } from './types';

interface PodiumProps {
  players: BaseRankedPlayer[];
  className?: string;
  renderPlayerExtra?: (player: BaseRankedPlayer) => React.ReactNode;
  showCrown?: boolean;
  medalEmojis?: string[];
  scoreLabel?: string;
}

export function Podium({
  players,
  className = '',
  renderPlayerExtra,
  showCrown = true,
  medalEmojis = ['🥇', '🥈', '🥉'],
  scoreLabel: _scoreLabel = '',
}: PodiumProps) {
  const top3 = players.slice(0, 3);

  const renderAvatar = (avatar: string, displayName: string) => {
    if (isImageAvatar(avatar)) {
      return <img src={avatar} alt={displayName} loading="lazy" />;
    }
    return avatar;
  };

  return (
    <div className={`results-podium ${className}`}>
      {/* 2nd Place */}
      {top3[1] && (
        <div className="podium-place second">
          <div className="podium-player">
            <span className="player-avatar">{renderAvatar(top3[1].avatar, top3[1].displayName)}</span>
          </div>
          <span className="player-name">{top3[1].displayName}</span>
          {renderPlayerExtra && (
            <div className="podium-stats">{renderPlayerExtra(top3[1])}</div>
          )}
          <div className="podium-block">
            <span className="medal">{medalEmojis[1]}</span>
            <span className="position">2</span>
          </div>
        </div>
      )}

      {/* 1st Place */}
      {top3[0] && (
        <div className="podium-place first">
          {showCrown && (
            <div className="winner-crown">
              <Crown size={32} />
            </div>
          )}
          <div className="podium-player">
            <span className="player-avatar">{renderAvatar(top3[0].avatar, top3[0].displayName)}</span>
          </div>
          <span className="player-name">{top3[0].displayName}</span>
          {renderPlayerExtra && (
            <div className="podium-stats">{renderPlayerExtra(top3[0])}</div>
          )}
          <div className="podium-block">
            <span className="medal">{medalEmojis[0]}</span>
            <span className="position">1</span>
          </div>
        </div>
      )}

      {/* 3rd Place */}
      {top3[2] && (
        <div className="podium-place third">
          <div className="podium-player">
            <span className="player-avatar">{renderAvatar(top3[2].avatar, top3[2].displayName)}</span>
          </div>
          <span className="player-name">{top3[2].displayName}</span>
          {renderPlayerExtra && (
            <div className="podium-stats">{renderPlayerExtra(top3[2])}</div>
          )}
          <div className="podium-block">
            <span className="medal">{medalEmojis[2]}</span>
            <span className="position">3</span>
          </div>
        </div>
      )}
    </div>
  );
}
