// Quiz Battle Results Screen — winner/loser/draw + rating changes

import { Trophy, RotateCcw, Home } from 'lucide-react';
import type { QuizBattleResults, QuizBattleGame } from '../pages/quiz-battle/quiz-battle-types';
import './quiz-battle.css';

interface QuizBattleResultsProps {
  results: QuizBattleResults;
  game: QuizBattleGame;
  currentPlayerId: string;
  onPlayAgain: () => void;
  onClose: () => void;
}

export function QuizBattleResults({
  results, game, currentPlayerId, onPlayAgain, onClose,
}: QuizBattleResultsProps) {
  const { winner, loser, isDraw } = results;

  const meIsWinner = winner?.odinhId === currentPlayerId;
  const myResult = meIsWinner ? winner : loser;
  const opResult = meIsWinner ? loser : winner;

  const players = Object.values(game.players);
  const mePlayer = players.find(p => p.odinhId === currentPlayerId);
  const opPlayer = players.find(p => p.odinhId !== currentPlayerId);

  function RatingChange({ change }: { change: number }) {
    if (change === 0) return <span className="qb-rating-change" style={{ color: 'rgba(255,255,255,0.4)' }}>±0</span>;
    return (
      <span className={`qb-rating-change ${change > 0 ? 'qb-up' : 'qb-down'}`}>
        {change > 0 ? '▲' : '▼'}{Math.abs(change)}
      </span>
    );
  }

  return (
    <div className="qb-results">
      <div className="qb-results-card">
        {/* Winner/Draw banner */}
        <div className="qb-results-winner">
          <div className="qb-results-trophy">
            {isDraw ? '🤝' : meIsWinner ? '🏆' : '😔'}
          </div>
          {isDraw ? (
            <div className="qb-results-draw-label">HÒA!</div>
          ) : meIsWinner ? (
            <>
              <div className="qb-results-win-label">CHIẾN THẮNG!</div>
              <div className="qb-results-name">{winner?.displayName}</div>
            </>
          ) : (
            <>
              <div className="qb-results-name">{winner?.displayName}</div>
              <div style={{ color: '#f59e0b', fontWeight: 700 }}>CHIẾN THẮNG!</div>
              <div className="qb-results-lose-label">Bạn thua cuộc lần này</div>
            </>
          )}
        </div>

        {/* Score comparison */}
        <div className="qb-results-scores">
          <div className="qb-results-score-block">
            <div className="qb-results-score-label">{mePlayer?.displayName ?? 'Bạn'}</div>
            <div className="qb-results-score-num">{mePlayer?.score ?? 0}</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
              {mePlayer?.correctCount ?? 0}/20 đúng
            </div>
          </div>
          <div className="qb-results-divider" />
          <div className="qb-results-score-block">
            <div className="qb-results-score-label">{opPlayer?.displayName ?? 'Đối thủ'}</div>
            <div className="qb-results-score-num">{opPlayer?.score ?? 0}</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
              {opPlayer?.correctCount ?? 0}/20 đúng
            </div>
          </div>
        </div>

        {/* Rating changes */}
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0.5rem 0', borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>ELO Bạn</div>
            <RatingChange change={myResult?.ratingChange ?? 0} />
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{myResult?.newRating ?? '—'}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>ELO Đối thủ</div>
            <RatingChange change={opResult?.ratingChange ?? 0} />
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{opResult?.newRating ?? '—'}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="qb-results-actions">
          <button className="qb-btn qb-btn-ghost" onClick={onClose}>
            <Home size={16} />Thoát
          </button>
          <button className="qb-btn qb-btn-primary" onClick={onPlayAgain}>
            <RotateCcw size={16} />Chơi lại
          </button>
        </div>
      </div>
    </div>
  );
}
