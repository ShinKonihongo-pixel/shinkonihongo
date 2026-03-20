// Quiz Battle Playing Screen — pro competitive HUD

import { useState, useEffect, useRef } from 'react';
import type { QuizBattleGame } from '../pages/quiz-battle/quiz-battle-types';
import { isImageAvatar } from '../../utils/avatar-icons';
import './quiz-battle-common.css';
import './quiz-battle-playing.css';

interface QuizBattlePlayingProps {
  game: QuizBattleGame;
  currentPlayerId: string;
  onSubmitAnswer: (idx: number, timeMs: number) => void;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const OPTION_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981'];

export function QuizBattlePlaying({ game, currentPlayerId, onSubmitAnswer }: QuizBattlePlayingProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const answerStartRef = useRef<number>(Date.now());
  const prevScoresRef = useRef<Record<string, number>>({});

  const { currentRound, questions, players, status, roundStartTime, settings } = game;
  const question = questions[currentRound];

  useEffect(() => {
    setSelectedAnswer(null);
    answerStartRef.current = roundStartTime ?? Date.now();
  }, [currentRound, roundStartTime]);

  const playerList = Object.values(players);
  const mePlayer = players[currentPlayerId];
  const opponentPlayer = playerList.find(p => p.odinhId !== currentPlayerId);

  const [scorePopMe, setScorePopMe] = useState(false);
  const [scorePopOpp, setScorePopOpp] = useState(false);
  const [revealResult, setRevealResult] = useState<'correct' | 'wrong' | null>(null);

  useEffect(() => {
    const prev = prevScoresRef.current;
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (mePlayer && prev[currentPlayerId] !== undefined && prev[currentPlayerId] !== mePlayer.score) {
      setScorePopMe(true);
      timers.push(setTimeout(() => setScorePopMe(false), 450));
    }
    if (opponentPlayer && prev[opponentPlayer.odinhId] !== undefined && prev[opponentPlayer.odinhId] !== opponentPlayer.score) {
      setScorePopOpp(true);
      timers.push(setTimeout(() => setScorePopOpp(false), 450));
    }
    if (mePlayer) prev[currentPlayerId] = mePlayer.score;
    if (opponentPlayer) prev[opponentPlayer.odinhId] = opponentPlayer.score;
    return () => timers.forEach(clearTimeout);
  }, [mePlayer?.score, opponentPlayer?.score, currentPlayerId]);

  const isReveal = status === 'answer_reveal';
  const myAnswer = mePlayer?.currentAnswer ?? null;
  const hasAnswered = myAnswer !== null;

  useEffect(() => {
    if (isReveal && myAnswer !== null && question) {
      setRevealResult(myAnswer === question.correctIndex ? 'correct' : 'wrong');
      const t = setTimeout(() => setRevealResult(null), 1800);
      return () => clearTimeout(t);
    }
  }, [isReveal, myAnswer, question?.correctIndex]);

  function handleSelect(idx: number) {
    if (hasAnswered || isReveal || selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    const timeMs = Date.now() - answerStartRef.current;
    onSubmitAnswer(idx, timeMs);
  }

  function getOptionClass(idx: number) {
    let cls = 'qb-opt';
    if (isReveal && question) {
      if (idx === question.correctIndex) cls += ' qb-opt--correct';
      else if (idx === myAnswer && idx !== question.correctIndex) cls += ' qb-opt--wrong';
      else cls += ' qb-opt--dim';
    } else if (selectedAnswer === idx) {
      cls += ' qb-opt--selected';
    }
    return cls;
  }

  const timerDuration = settings.timePerQuestion;
  const oppAnswered = opponentPlayer?.currentAnswer !== null;
  const meAnswered = hasAnswered || selectedAnswer !== null;

  function renderAvatar(avatar: string, name: string, ring: string) {
    const inner = (avatar && isImageAvatar(avatar))
      ? <img src={avatar} alt={name} className="qb-hud-avatar-img" />
      : <span className="qb-hud-avatar-emoji">{avatar || name.charAt(0).toUpperCase()}</span>;
    return (
      <div className="qb-hud-avatar-wrap" style={{ '--ring-color': ring } as React.CSSProperties}>
        {inner}
      </div>
    );
  }

  if (!question) return null;

  const oppRevealAnswer = isReveal && opponentPlayer?.currentAnswer !== null ? opponentPlayer!.currentAnswer! : null;
  const oppCorrect = oppRevealAnswer !== null && question && oppRevealAnswer === question.correctIndex;

  return (
    <div className="qb-playing qb-playing--v2">

      {/* ── HUD Scoreboard ── */}
      <div className="qb-hud">

        {/* Opponent panel */}
        <div className="qb-hud-panel qb-hud-panel--opp">
          {renderAvatar(opponentPlayer?.avatar ?? '', opponentPlayer?.displayName ?? '?', '#ef4444')}
          <div className="qb-hud-info">
            <span className="qb-hud-name">{opponentPlayer?.displayName ?? '...'}</span>
            <span className={`qb-hud-score${scorePopOpp ? ' qb-pop' : ''}`}>
              {opponentPlayer?.score ?? 0}
            </span>
          </div>
          <div className={`qb-hud-status ${oppAnswered ? 'qb-hud-status--done' : 'qb-hud-status--thinking'}`}>
            {oppAnswered ? '✓' : '···'}
          </div>
        </div>

        {/* Center badge */}
        <div className="qb-hud-center">
          <div className="qb-vs-ring">
            <span className="qb-vs-label">VS</span>
          </div>
          <div className="qb-round-badge">
            <span className="qb-round-q">Q</span>
            <span className="qb-round-num">{currentRound + 1}</span>
            <span className="qb-round-total">/{settings.totalRounds}</span>
          </div>
        </div>

        {/* Me panel */}
        <div className="qb-hud-panel qb-hud-panel--me">
          <div className={`qb-hud-status ${meAnswered ? 'qb-hud-status--done' : 'qb-hud-status--thinking'}`}>
            {meAnswered ? '✓' : '···'}
          </div>
          <div className="qb-hud-info qb-hud-info--right">
            <span className="qb-hud-name">{mePlayer?.displayName ?? 'Bạn'}</span>
            <span className={`qb-hud-score qb-hud-score--me${scorePopMe ? ' qb-pop' : ''}`}>
              {mePlayer?.score ?? 0}
            </span>
          </div>
          {renderAvatar(mePlayer?.avatar ?? '', mePlayer?.displayName ?? 'B', '#f59e0b')}
        </div>
      </div>

      {/* ── Timer ── */}
      <div className="qb-timer-wrap">
        <div className="qb-timer-track">
          <div
            className={`qb-timer-fill${timerDuration <= 5 ? ' qb-timer-fill--urgent' : ''}`}
            key={`timer-${currentRound}`}
            style={{ animationDuration: `${timerDuration}s` }}
          />
        </div>
        <div className="qb-timer-glow" key={`glow-${currentRound}`} style={{ animationDuration: `${timerDuration}s` }} />
      </div>

      {/* ── Question Card ── */}
      <div className="qb-question-wrap" key={`q-${currentRound}`}>
        <div className="qb-question-card qb-question-card--v2">
          <div className="qb-question-badge">Q.{currentRound + 1}</div>
          <p className="qb-question-text">{question.question}</p>
        </div>

        {/* ── Options 2×2 grid ── */}
        <div className="qb-opts-grid">
          {question.options.map((opt, idx) => (
            <button
              key={idx}
              className={getOptionClass(idx)}
              onClick={() => handleSelect(idx)}
              disabled={hasAnswered || isReveal}
              style={{ '--opt-color': OPTION_COLORS[idx] } as React.CSSProperties}
            >
              <span className="qb-opt-label">{OPTION_LABELS[idx]}</span>
              <span className="qb-opt-text">{opt}</span>
              {isReveal && idx === question.correctIndex && <span className="qb-opt-icon">✓</span>}
              {isReveal && idx === myAnswer && idx !== question.correctIndex && <span className="qb-opt-icon">✗</span>}
              {!isReveal && selectedAnswer === idx && <span className="qb-opt-icon">🔒</span>}
            </button>
          ))}
        </div>

        {/* ── Reveal overlay ── */}
        {revealResult && (
          <div className={`qb-reveal-overlay qb-reveal-overlay--${revealResult}`}>
            <span className="qb-reveal-icon">{revealResult === 'correct' ? '✓' : '✗'}</span>
            <span className="qb-reveal-label">
              {revealResult === 'correct' ? 'Đúng!' : 'Sai!'}
            </span>
            {oppRevealAnswer !== null && (
              <span className="qb-reveal-opp">
                {opponentPlayer?.displayName}: {OPTION_LABELS[oppRevealAnswer]}
                {oppCorrect ? ' ✓' : ' ✗'}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
