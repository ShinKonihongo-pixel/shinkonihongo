// Quiz Battle Leaderboard — per-level ELO rankings with live updates

import { useState, useEffect } from 'react';
import type { JLPTLevel } from '../../types/jlpt-question';
import { subscribeToLeaderboard } from '../../services/quiz-battle/quiz-battle-service';
import type { QuizBattleRating } from '../pages/quiz-battle/quiz-battle-types';
import { isImageAvatar } from '../../utils/avatar-icons';
import './quiz-battle-common.css';

const LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

interface QuizBattleLeaderboardProps {
  currentUserId: string;
  defaultLevel?: JLPTLevel;
}

export function QuizBattleLeaderboard({ currentUserId, defaultLevel = 'N5' }: QuizBattleLeaderboardProps) {
  const [activeLevel, setActiveLevel] = useState<JLPTLevel>(defaultLevel);
  const [entries, setEntries] = useState<QuizBattleRating[]>([]);

  useEffect(() => {
    const unsub = subscribeToLeaderboard(activeLevel, 50, setEntries);
    return unsub;
  }, [activeLevel]);

  function rankCell(idx: number) {
    if (idx === 0) return <span className="qb-rank-gold">🥇</span>;
    if (idx === 1) return <span className="qb-rank-silver">🥈</span>;
    if (idx === 2) return <span className="qb-rank-bronze">🥉</span>;
    return <span style={{ color: 'rgba(255,255,255,0.5)' }}>#{idx + 1}</span>;
  }

  function renderAvatar(avatar: string, name: string) {
    if (avatar && isImageAvatar(avatar)) return <img src={avatar} alt={name} loading="lazy" />;
    return <span>{avatar || name.charAt(0).toUpperCase()}</span>;
  }

  return (
    <div className="qb-leaderboard">
      {/* Level tabs */}
      <div className="qb-leaderboard-tabs">
        {LEVELS.map(lvl => (
          <button
            key={lvl}
            className={`qb-leaderboard-tab${activeLevel === lvl ? ' qb-active' : ''}`}
            onClick={() => setActiveLevel(lvl)}
          >
            {lvl}
          </button>
        ))}
      </div>

      {/* Table */}
      {entries.length === 0 ? (
        <div className="qb-empty-hint">Chưa có dữ liệu</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Người chơi</th>
              <th>ELO</th>
              <th>W/L</th>
              <th>Win%</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => {
              const stats = entry.stats[activeLevel];
              const winPct = stats.totalMatches > 0
                ? Math.round((stats.wins / stats.totalMatches) * 100)
                : 0;
              const isMe = entry.odinhId === currentUserId;
              return (
                <tr key={entry.odinhId} className={isMe ? 'qb-me-row' : ''}>
                  <td>{rankCell(idx)}</td>
                  <td>
                    <div className="qb-lb-player">
                      <div className="qb-lb-avatar">
                        {renderAvatar(entry.avatar, entry.displayName)}
                      </div>
                      <span>{entry.displayName}{isMe && ' (Bạn)'}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: '#f59e0b' }}>
                    {entry.ratings[activeLevel] ?? 1000}
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {stats.wins}/{stats.losses}
                  </td>
                  <td style={{ color: winPct >= 50 ? '#22c55e' : 'rgba(255,255,255,0.5)' }}>
                    {winPct}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
