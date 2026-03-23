// Dashboard Leaderboard — Top 10 Quiz Battle ELO by JLPT level
// Single Firestore subscription, client-side sort per level (no re-subscribe on tab switch)

import { useState, useEffect, useMemo, useRef } from 'react';
import { Trophy } from 'lucide-react';
import { subscribeToLeaderboard } from '../../services/quiz-battle/quiz-battle-service';
import { isImageAvatar } from '../../utils/avatar-icons';
import './dashboard-leaderboard.css';

type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
const LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
const MEDALS = ['👑', '🥈', '🥉'];

interface LeaderEntry {
  odinhId: string;
  displayName: string;
  avatar: string;
  ratings: Record<JLPTLevel, number>;
  stats: Record<JLPTLevel, {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
  }>;
}

interface DashboardLeaderboardProps {
  currentUserId: string;
}

export function DashboardLeaderboard({ currentUserId }: DashboardLeaderboardProps) {
  const [level, setLevel] = useState<JLPTLevel>('N5');
  const [allPlayers, setAllPlayers] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const subRef = useRef<JLPTLevel>('N5');

  // Single subscription — fetch all players once, re-sort client-side per level
  useEffect(() => {
    // Subscribe with N5 as base (sort doesn't matter, we re-sort per tab)
    const unsub = subscribeToLeaderboard(subRef.current, 50, (data) => {
      setAllPlayers(data as LeaderEntry[]);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Client-side sort + filter for selected level — instant tab switch
  const entries = useMemo(() =>
    allPlayers
      .filter(e => e.stats[level]?.totalMatches > 0)
      .sort((a, b) => (b.ratings[level] ?? 1000) - (a.ratings[level] ?? 1000))
      .slice(0, 10),
    [allPlayers, level]
  );

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3, 10);

  function renderAvatar(avatar: string, name: string) {
    if (avatar && isImageAvatar(avatar)) return <img src={avatar} alt={name} />;
    return <span>{avatar || name.charAt(0).toUpperCase()}</span>;
  }

  return (
    <div className="dlb-section">
      <div className="dlb-section-header">
        <div className="dlb-icon"><Trophy size={15} /></div>
        <span className="dlb-section-title">Bảng xếp hạng Đấu Trí</span>
      </div>

      {/* Level tabs */}
      <div className="dlb-level-tabs">
        {LEVELS.map(l => (
          <button
            key={l}
            className={`dlb-level-tab${level === l ? ' active' : ''}`}
            onClick={() => setLevel(l)}
          >
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="dlb-loading">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="dlb-shimmer" />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="dlb-empty">
          <div className="dlb-empty-icon">🏆</div>
          <div>Chưa có ai tham gia {level}</div>
        </div>
      ) : (
        <>
          {/* Podium — top 3 */}
          {top3.length > 0 && (
            <div className="dlb-podium">
              {top3.map((entry, idx) => {
                const rank = idx + 1;
                const elo = entry.ratings[level] ?? 1000;
                return (
                  <div key={entry.odinhId} className="dlb-podium-item" data-rank={rank}>
                    <div className="dlb-podium-badge">{MEDALS[idx]}</div>
                    <div className="dlb-podium-avatar">
                      {renderAvatar(entry.avatar, entry.displayName)}
                    </div>
                    <span className="dlb-podium-name">
                      {entry.odinhId === currentUserId ? 'Bạn' : entry.displayName}
                    </span>
                    <span className="dlb-podium-elo">{elo}</span>
                    <div className="dlb-podium-pedestal" />
                  </div>
                );
              })}
            </div>
          )}

          {/* List — rank 4-10 */}
          {rest.length > 0 && (
            <div className="dlb-list">
              {rest.map((entry, idx) => {
                const rank = idx + 4;
                const elo = entry.ratings[level] ?? 1000;
                const stats = entry.stats[level];
                const isMe = entry.odinhId === currentUserId;
                const winRate = stats?.winRate ?? 0;

                return (
                  <div key={entry.odinhId} className={`dlb-row${isMe ? ' dlb-me' : ''}`}>
                    <span className="dlb-rank">#{rank}</span>
                    <div className="dlb-avatar">
                      {renderAvatar(entry.avatar, entry.displayName)}
                    </div>
                    <div className="dlb-info">
                      <div className="dlb-name">{isMe ? `${entry.displayName} (Bạn)` : entry.displayName}</div>
                      <div className="dlb-stats">{stats?.wins ?? 0}W / {stats?.losses ?? 0}L</div>
                    </div>
                    <span className="dlb-elo">{elo}</span>
                    <span className={`dlb-winrate${winRate < 50 ? ' low' : ''}`}>
                      {winRate}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
