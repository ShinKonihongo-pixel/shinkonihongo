// Multiplayer result screen — rankings sorted by finishedAt/levelsCompleted/score

import { Home, RotateCcw, Trophy, Crown, Medal } from 'lucide-react';
import type { KanjiDropMultiplayerPlayer } from './kanji-drop-multiplayer-types';

interface MultiplayerResultScreenProps {
  players: Record<string, KanjiDropMultiplayerPlayer>;
  currentPlayerId: string;
  levelStart: number;
  levelEnd: number;
  onPlayAgain: () => void;
  onExit: () => void;
}

export function MultiplayerResultScreen({
  players, currentPlayerId, levelStart, levelEnd, onPlayAgain, onExit,
}: MultiplayerResultScreenProps) {
  const totalLevels = levelEnd - levelStart + 1;
  const sorted = Object.values(players).sort((a, b) => {
    if (a.finishedAt && !b.finishedAt) return -1;
    if (!a.finishedAt && b.finishedAt) return 1;
    if (a.finishedAt && b.finishedAt) return a.finishedAt.localeCompare(b.finishedAt);
    return b.levelsCompleted - a.levelsCompleted || b.score - a.score;
  });

  const rankIcons = [
    <Crown size={20} key="crown" />,
    <Medal size={18} key="silver" />,
    <Medal size={16} key="bronze" />,
  ];

  return (
    <div className="kd-result">
      <div className="kd-result-card" style={{ maxWidth: '520px' }}>
        <div className="kd-result-header">
          <div className="kd-result-emoji">
            <Trophy size={48} />
          </div>
          <h1>Kết Quả</h1>
          <p>Màn {levelStart} → {levelEnd} ({totalLevels} màn)</p>
        </div>

        <div className="kd-mp-rankings">
          {sorted.map((player, idx) => {
            const isMe = player.odinhId === currentPlayerId;
            const isWinner = idx === 0 && !!player.finishedAt;

            return (
              <div
                key={player.odinhId}
                className={`kd-mp-rank-row ${isMe ? 'kd-mp-rank-me' : ''} ${isWinner ? 'kd-mp-rank-winner' : ''}`}
              >
                <div className="kd-mp-rank-pos">
                  {idx < 3 ? rankIcons[idx] : `#${idx + 1}`}
                </div>
                <div className="kd-mp-rank-avatar">
                  {player.avatar.startsWith('http') || player.avatar.startsWith('/') ? (
                    <img src={player.avatar} alt="" loading="lazy" />
                  ) : (
                    <span>{player.avatar}</span>
                  )}
                </div>
                <div className="kd-mp-rank-info">
                  <div className="kd-mp-rank-name">
                    {player.displayName}
                    {isMe && <span className="kd-mp-me-tag">Bạn</span>}
                  </div>
                  <div className="kd-mp-rank-stats">
                    <span>{player.levelsCompleted}/{totalLevels} màn</span>
                    <span>{player.score} điểm</span>
                    <span>{player.clearedCount} cleared</span>
                  </div>
                </div>
                {player.finishedAt && (
                  <div className="kd-mp-rank-badge">Hoàn thành</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="kd-result-actions">
          <button className="kd-btn kd-btn-ghost" onClick={onExit}>
            <Home size={18} /> Thoát
          </button>
          <button className="kd-btn kd-btn-primary" onClick={onPlayAgain}>
            <RotateCcw size={18} /> Chơi lại
          </button>
        </div>
      </div>
    </div>
  );
}
