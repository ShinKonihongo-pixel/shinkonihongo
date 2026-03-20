// Quiz Battle Results Screen — pro-level competitive results display

import { useEffect, useRef, useState } from 'react';
import { Trophy, RotateCcw, Home, Target, Clock, Flame, Percent } from 'lucide-react';
import type { QuizBattleResults, QuizBattleGame } from '../pages/quiz-battle/quiz-battle-types';
import './quiz-battle-common.css';
import './quiz-battle-results.css';

interface QuizBattleResultsProps {
  results: QuizBattleResults;
  game: QuizBattleGame;
  currentPlayerId: string;
  onPlayAgain: () => void;
  onClose: () => void;
}

function useCountUp(target: number, duration = 1200, delay = 400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    let raf: number;
    const timeout = setTimeout(() => {
      const step = (ts: number) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return value;
}

function RatingDelta({ change, delay }: { change: number; delay?: number }) {
  const animated = useCountUp(Math.abs(change), 900, delay ?? 600);
  if (change === 0) return <span className="qbr-delta qbr-delta-zero">±0</span>;
  return (
    <span className={`qbr-delta ${change > 0 ? 'qbr-delta-up' : 'qbr-delta-down'}`}>
      {change > 0 ? '▲' : '▼'}{animated}
    </span>
  );
}

function ScoreBar({ name, score, maxScore, correct, isMe, winner }: {
  name: string; score: number; maxScore: number; correct: number; isMe: boolean; winner: boolean;
}) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  return (
    <div className={`qbr-bar-row ${isMe ? 'qbr-bar-me' : ''}`}>
      <div className="qbr-bar-name">
        {winner && <span className="qbr-bar-crown">👑</span>}
        {name}
      </div>
      <div className="qbr-bar-track">
        <div className="qbr-bar-fill" style={{ '--pct': `${pct}%` } as React.CSSProperties} />
      </div>
      <div className="qbr-bar-stats">
        <span className="qbr-bar-score">{score}</span>
        <span className="qbr-bar-correct">{correct}/20</span>
      </div>
    </div>
  );
}

export function QuizBattleResults({
  results, game, currentPlayerId, onPlayAgain, onClose,
}: QuizBattleResultsProps) {
  const { winner, loser, isDraw } = results;
  const cardRef = useRef<HTMLDivElement>(null);

  const meIsWinner = winner?.odinhId === currentPlayerId;
  const myResult = isDraw
    ? (winner?.odinhId === currentPlayerId ? winner : loser)
    : (meIsWinner ? winner : loser);
  const opResult = isDraw
    ? (winner?.odinhId === currentPlayerId ? loser : winner)
    : (meIsWinner ? loser : winner);

  const players = Object.values(game.players);
  const mePlayer = players.find(p => p.odinhId === currentPlayerId);
  const opPlayer = players.find(p => p.odinhId !== currentPlayerId);

  const myScore = mePlayer?.score ?? 0;
  const opScore = opPlayer?.score ?? 0;
  const maxScore = Math.max(myScore, opScore, 1);

  const myCorrect = mePlayer?.correctCount ?? 0;
  const opCorrect = opPlayer?.correctCount ?? 0;
  const myAccuracy = Math.round((myCorrect / 20) * 100);
  const myName = mePlayer?.displayName ?? 'Bạn';
  const opName = opPlayer?.displayName ?? 'Đối thủ';

  // Animate card in
  useEffect(() => {
    const el = cardRef.current;
    if (el) { el.style.opacity = '0'; el.style.transform = 'translateY(32px) scale(0.97)'; }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (el) { el.style.transition = 'opacity 0.45s ease, transform 0.45s ease'; el.style.opacity = '1'; el.style.transform = 'none'; }
      });
    });
  }, []);

  const headerClass = isDraw ? 'qbr-header qbr-header-draw' : meIsWinner ? 'qbr-header qbr-header-win' : 'qbr-header qbr-header-lose';

  return (
    <div className={`qbr-overlay ${meIsWinner && !isDraw ? 'qbr-confetti' : ''}`}>
      <div className="qbr-card" ref={cardRef}>

        {/* ── Winner banner ─────────────────────────────────────── */}
        <div className={headerClass}>
          <div className="qbr-trophy-wrap">
            {isDraw ? <span className="qbr-trophy-icon">🤝</span>
              : meIsWinner ? <Trophy className="qbr-trophy-svg" size={52} strokeWidth={1.5} />
              : <span className="qbr-trophy-icon">😤</span>}
            {meIsWinner && !isDraw && <div className="qbr-glow-ring" />}
          </div>
          {isDraw ? (
            <div className="qbr-outcome-draw">HÒA!</div>
          ) : meIsWinner ? (
            <div className="qbr-outcome-win">CHIẾN THẮNG!</div>
          ) : (
            <>
              <div className="qbr-outcome-winner-name">{winner?.displayName} thắng</div>
              <div className="qbr-outcome-lose">Lần sau sẽ tốt hơn</div>
            </>
          )}
        </div>

        {/* ── Score bars ────────────────────────────────────────── */}
        <div className="qbr-section">
          <ScoreBar name={myName} score={myScore} maxScore={maxScore} correct={myCorrect}
            isMe winner={!isDraw && meIsWinner} />
          <ScoreBar name={opName} score={opScore} maxScore={maxScore} correct={opCorrect}
            isMe={false} winner={!isDraw && !meIsWinner} />
        </div>

        {/* ── ELO panel ─────────────────────────────────────────── */}
        <div className="qbr-elo-panel">
          <div className="qbr-elo-col">
            <div className="qbr-elo-label">ELO BẠN</div>
            <RatingDelta change={myResult?.ratingChange ?? 0} delay={500} />
            <div className="qbr-elo-new">{myResult?.newRating ?? '—'}</div>
          </div>
          <div className="qbr-elo-divider" />
          <div className="qbr-elo-col">
            <div className="qbr-elo-label">ELO ĐỐI THỦ</div>
            <RatingDelta change={opResult?.ratingChange ?? 0} delay={700} />
            <div className="qbr-elo-new">{opResult?.newRating ?? '—'}</div>
          </div>
        </div>

        {/* ── Stats grid ────────────────────────────────────────── */}
        <div className="qbr-stats-grid">
          {([
            { icon: <Target size={18} />, value: myCorrect, label: 'Đúng' },
            { icon: <Percent size={18} />, value: `${myAccuracy}%`, label: 'Chính xác' },
            { icon: <Flame size={18} />, value: mePlayer?.correctCount ?? 0, label: 'Streak tốt' },
            { icon: <Clock size={18} />, value: '—', label: 'TB thời gian' },
          ] as { icon: React.ReactNode; value: string | number; label: string }[]).map((s, i) => (
            <div key={i} className="qbr-stat-card" style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
              <div className="qbr-stat-icon">{s.icon}</div>
              <div className="qbr-stat-value">{s.value}</div>
              <div className="qbr-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Actions ───────────────────────────────────────────── */}
        <div className="qbr-actions">
          <button className="qbr-btn qbr-btn-ghost" onClick={onClose}>
            <Home size={16} /> Thoát
          </button>
          <button className="qbr-btn qbr-btn-primary" onClick={onPlayAgain}>
            <RotateCcw size={16} /> Chơi lại
          </button>
        </div>

      </div>
    </div>
  );
}
