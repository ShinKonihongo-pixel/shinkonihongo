// Multiplayer progress sidebar — shows all players' current level and score

import { Trophy, Check } from 'lucide-react';
import type { KanjiDropMultiplayerPlayer } from './kanji-drop-multiplayer-types';

interface MultiplayerProgressBarProps {
  players: Record<string, KanjiDropMultiplayerPlayer>;
  currentPlayerId: string;
  levelStart: number;
  levelEnd: number;
}

export function MultiplayerProgressBar({
  players, currentPlayerId, levelStart, levelEnd,
}: MultiplayerProgressBarProps) {
  const totalLevels = levelEnd - levelStart + 1;
  const sorted = Object.values(players).sort((a, b) => {
    if (a.finishedAt && !b.finishedAt) return -1;
    if (!a.finishedAt && b.finishedAt) return 1;
    if (a.finishedAt && b.finishedAt) return a.finishedAt.localeCompare(b.finishedAt);
    return b.levelsCompleted - a.levelsCompleted || b.score - a.score;
  });

  return (
    <div className="kd-mp-progress">
      <div className="kd-mp-progress-title">
        <Trophy size={14} /> Tiến độ
      </div>
      {sorted.map((player, idx) => {
        const isMe = player.odinhId === currentPlayerId;
        const pct = totalLevels > 0 ? Math.round((player.levelsCompleted / totalLevels) * 100) : 0;
        const finished = !!player.finishedAt;

        return (
          <div key={player.odinhId} className={`kd-mp-player ${isMe ? 'kd-mp-player-me' : ''} ${finished ? 'kd-mp-player-done' : ''}`}>
            <div className="kd-mp-player-rank">#{idx + 1}</div>
            <div className="kd-mp-player-avatar">
              {player.avatar.startsWith('http') || player.avatar.startsWith('/') ? (
                <img src={player.avatar} alt="" loading="lazy" />
              ) : (
                <span>{player.avatar}</span>
              )}
            </div>
            <div className="kd-mp-player-info">
              <div className="kd-mp-player-name">
                {player.displayName}
                {isMe && <span className="kd-mp-me-tag">Bạn</span>}
                {finished && <Check size={12} className="kd-mp-done-icon" />}
              </div>
              <div className="kd-mp-player-bar">
                <div className="kd-mp-player-bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="kd-mp-player-stats">
                <span>Màn {player.currentLevel}</span>
                <span>{player.score} đ</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
