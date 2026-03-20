// Quiz Battle Playing Screen — 1v1 live question/answer with scoreboard

import { useState, useEffect, useRef } from 'react';
import type { QuizBattleGame } from '../pages/quiz-battle/quiz-battle-types';
import { isImageAvatar } from '../../utils/avatar-icons';
import './quiz-battle.css';

interface QuizBattlePlayingProps {
  game: QuizBattleGame;
  currentPlayerId: string;
  onSubmitAnswer: (idx: number, timeMs: number) => void;
}

export function QuizBattlePlaying({ game, currentPlayerId, onSubmitAnswer }: QuizBattlePlayingProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const answerStartRef = useRef<number>(Date.now());
  const prevScoresRef = useRef<Record<string, number>>({});

  const { currentRound, questions, players, status, roundStartTime, settings } = game;
  const question = questions[currentRound];

  // Reset selection & record start time when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    answerStartRef.current = roundStartTime ?? Date.now();
  }, [currentRound, roundStartTime]);

  const playerList = Object.values(players);
  const mePlayer = players[currentPlayerId];
  const opponentPlayer = playerList.find(p => p.odinhId !== currentPlayerId);

  // Detect score change for pop animation
  const [scorePopMe, setScorePopMe] = useState(false);
  const [scorePopOpp, setScorePopOpp] = useState(false);

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

  function handleSelect(idx: number) {
    if (hasAnswered || isReveal || selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    const timeMs = Date.now() - answerStartRef.current;
    onSubmitAnswer(idx, timeMs);
  }

  function getOptionClass(idx: number) {
    let cls = 'qb-option';
    if (isReveal && question) {
      if (idx === question.correctIndex) cls += ' qb-correct';
      else if (idx === myAnswer && idx !== question.correctIndex) cls += ' qb-wrong';
    } else if (selectedAnswer === idx) {
      cls += ' qb-selected';
    }
    return cls;
  }

  const timerDuration = settings.timePerQuestion;

  function renderAvatar(avatar: string, name: string) {
    if (avatar && isImageAvatar(avatar)) return <img src={avatar} alt={name} />;
    return <span>{avatar || name.charAt(0).toUpperCase()}</span>;
  }

  if (!question) return null;

  return (
    <div className="qb-playing">
      {/* Scoreboard */}
      <div className="qb-scoreboard">
        {/* Opponent (left) */}
        <div className="qb-scoreboard-player">
          <div className="qb-scoreboard-avatar">
            {opponentPlayer
              ? renderAvatar(opponentPlayer.avatar, opponentPlayer.displayName)
              : <span>?</span>}
          </div>
          <div className="qb-scoreboard-info">
            <div className="qb-scoreboard-name">{opponentPlayer?.displayName ?? '...'}</div>
            <div className={`qb-scoreboard-score${scorePopOpp ? ' qb-pop' : ''}`}>
              {opponentPlayer?.score ?? 0}
            </div>
          </div>
        </div>

        {/* Center */}
        <div className="qb-scoreboard-center">
          <div className="qb-round-label">Câu</div>
          <div className="qb-round-num">{currentRound + 1}/{settings.totalRounds}</div>
        </div>

        {/* Me (right) */}
        <div className="qb-scoreboard-player qb-me">
          <div className="qb-scoreboard-avatar">
            {mePlayer ? renderAvatar(mePlayer.avatar, mePlayer.displayName) : <span>?</span>}
          </div>
          <div className="qb-scoreboard-info">
            <div className="qb-scoreboard-name">{mePlayer?.displayName ?? 'Bạn'}</div>
            <div className={`qb-scoreboard-score${scorePopMe ? ' qb-pop' : ''}`}>
              {mePlayer?.score ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Timer bar */}
      <div className="qb-timer">
        <div
          className="qb-timer-fill"
          key={`timer-${currentRound}`}
          style={{ animationDuration: `${timerDuration}s` }}
        />
      </div>

      {/* Question + Options */}
      <div className="qb-question">
        <div className="qb-question-card">
          <p className="qb-question-text">{question.question}</p>
        </div>

        <div className="qb-options">
          {question.options.map((opt, idx) => (
            <button
              key={idx}
              className={getOptionClass(idx)}
              onClick={() => handleSelect(idx)}
              disabled={hasAnswered || isReveal}
            >
              {opt}
            </button>
          ))}
        </div>

        {isReveal && opponentPlayer && (
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
            {opponentPlayer.currentAnswer !== null
              ? `${opponentPlayer.displayName} đã trả lời`
              : `${opponentPlayer.displayName} chưa trả lời`}
          </div>
        )}
      </div>
    </div>
  );
}
