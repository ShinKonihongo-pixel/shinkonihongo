// AI Challenge Play - Esports Battle HUD Style
// Professional game design: fighting game HUD, tension building, impact feedback

import { useState, useEffect, useCallback } from 'react';
import { Zap, Flame, ChevronRight } from 'lucide-react';
import type { AIChallengeGame, AIChallengeQuestion, AIOpponent } from '../../types/ai-challenge';
import { isImageAvatar } from '../../utils/avatar-icons';

// Helper to render avatar (image or emoji)
function renderAvatar(avatar: string | undefined, fallback: string = '👤') {
  if (!avatar) return fallback;
  if (isImageAvatar(avatar)) {
    return <img src={avatar} alt="avatar" />;
  }
  return avatar;
}

interface AIChallengePlayProps {
  game: AIChallengeGame;
  currentQuestion: AIChallengeQuestion | null;
  aiOpponent: AIOpponent | null;
  onSubmitAnswer: (index: number) => void;
  onTimeout: () => void;
  onNextQuestion: () => void;
}

// Professional answer colors with A, B, C, D labels - light and dark variants
const ANSWER_STYLES = [
  { bg: '#e21b3c', light: 'rgba(226, 27, 60, 0.25)', label: 'A', name: 'Đỏ' },
  { bg: '#1368ce', light: 'rgba(19, 104, 206, 0.25)', label: 'B', name: 'Xanh' },
  { bg: '#d89e00', light: 'rgba(216, 158, 0, 0.25)', label: 'C', name: 'Vàng' },
  { bg: '#26890c', light: 'rgba(38, 137, 12, 0.25)', label: 'D', name: 'Xanh lá' },
];

export function AIChallengePlay({
  game,
  currentQuestion,
  aiOpponent,
  onSubmitAnswer,
  onTimeout,
  onNextQuestion,
}: AIChallengePlayProps) {
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [countdownValue, setCountdownValue] = useState(3);
  const [showImpact, setShowImpact] = useState<'player' | 'ai' | null>(null);

  const isCountdown = game.status === 'countdown';
  const isPlaying = game.status === 'playing';
  const isRevealing = game.status === 'revealing';
  const lastResult = game.roundResults[game.roundResults.length - 1];

  // Calculate score percentage for "health bars"
  const totalPossibleScore = (game.currentQuestionIndex + 1) * 150; // max score per question
  const playerScorePercent = Math.min(100, (game.playerStats.score / Math.max(totalPossibleScore, 1)) * 100);
  const aiScorePercent = Math.min(100, (game.aiStats.score / Math.max(totalPossibleScore, 1)) * 100);

  // Timer percentage
  const questionTimeLimit = currentQuestion?.timeLimit || 15;
  const timerPercent = (timeLeft / questionTimeLimit) * 100;

  // Countdown effect
  useEffect(() => {
    if (!isCountdown) return;
    setCountdownValue(3);
    const interval = setInterval(() => {
      setCountdownValue(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isCountdown]);

  // Timer effect - reset time when not playing
  useEffect(() => {
    if (!isPlaying) {
      setTimeLeft(questionTimeLimit);
      return;
    }
  }, [isPlaying, questionTimeLimit]);

  // Reset selectedAnswer only when question changes (new question starts)
  useEffect(() => {
    setSelectedAnswer(null);
  }, [game.currentQuestionIndex]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, game.currentQuestionIndex]);

  // Handle timeout separately to avoid setState during render
  useEffect(() => {
    if (isPlaying && timeLeft === 0) {
      onTimeout();
    }
  }, [isPlaying, timeLeft, onTimeout]);

  // Impact effect when revealing
  useEffect(() => {
    if (isRevealing && lastResult) {
      setShowImpact(lastResult.winner === 'tie' ? null : lastResult.winner);
      const timer = setTimeout(() => setShowImpact(null), 500);
      return () => clearTimeout(timer);
    }
  }, [isRevealing, lastResult]);

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSelectAnswer = useCallback((index: number) => {
    if (!isPlaying || isSubmitted) return;
    setSelectedAnswer(index);
  }, [isPlaying, isSubmitted]);

  const handleSubmitAnswer = useCallback(() => {
    if (!isPlaying || selectedAnswer === null || isSubmitted) return;
    setIsSubmitted(true);
    onSubmitAnswer(selectedAnswer);
  }, [isPlaying, selectedAnswer, isSubmitted, onSubmitAnswer]);

  // Reset submitted state when question changes
  useEffect(() => {
    setIsSubmitted(false);
  }, [game.currentQuestionIndex]);

  // === COUNTDOWN SCREEN ===
  if (isCountdown) {
    return (
      <div className="battle-arena countdown-phase">
        <div className="battle-bg">
          <div className="bg-pulse" />
        </div>

        <div className="versus-screen">
          {/* Player side */}
          <div className="fighter-card player">
            <div className={`fighter-portrait ${game.playerStats.role === 'vip' ? 'vip-frame' : ''} ${game.playerStats.role === 'admin' || game.playerStats.role === 'superadmin' ? 'admin-frame' : ''}`}>
              <span className="fighter-avatar">{renderAvatar(game.playerStats.avatar)}</span>
            </div>
            <div className="fighter-info">
              <span className={`fighter-name ${game.playerStats.role === 'vip' ? 'vip-name' : ''} ${game.playerStats.role === 'admin' ? 'admin-name' : ''} ${game.playerStats.role === 'superadmin' ? 'superadmin-name' : ''}`}>
                {game.playerStats.displayName}
              </span>
              <span className="fighter-tag">CHALLENGER</span>
            </div>
          </div>

          {/* VS */}
          <div className="vs-emblem">
            <span className="vs-text">VS</span>
            <div className="vs-flash" />
          </div>

          {/* AI side */}
          <div className="fighter-card ai" style={{ '--ai-color': aiOpponent?.color } as React.CSSProperties}>
            <div className="fighter-portrait">
              <span className="fighter-avatar">{aiOpponent?.emoji}</span>
            </div>
            <div className="fighter-info">
              <span className="fighter-name">{aiOpponent?.name}</span>
              <span className="fighter-tag">DEFENDER</span>
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className="battle-countdown">
          <div className="countdown-ring">
            <span className="countdown-num">{countdownValue || 'GO!'}</span>
          </div>
        </div>

        {/* Match info */}
        <div className="match-info">
          <span className="match-detail">{game.questions.length} Câu hỏi</span>
          <span className="match-divider">•</span>
          <span className="match-detail">{questionTimeLimit}s / câu</span>
        </div>
      </div>
    );
  }

  if (!currentQuestion || !aiOpponent) return null;

  // === BATTLE SCREEN ===
  return (
    <div className={`battle-arena battle-phase ${showImpact ? `impact-${showImpact}` : ''}`}>
      {/* Battle HUD - Top bar */}
      <div className="battle-hud">
        {/* Player side */}
        <div className="hud-player">
          <div className={`hud-avatar ${game.playerStats.role === 'vip' ? 'vip-frame' : ''} ${game.playerStats.role === 'admin' || game.playerStats.role === 'superadmin' ? 'admin-frame' : ''}`}>
            {renderAvatar(game.playerStats.avatar)}
          </div>
          <div className="hud-info">
            <div className="hud-name-row">
              <span className={`hud-name ${game.playerStats.role === 'vip' ? 'vip-name' : ''} ${game.playerStats.role === 'admin' ? 'admin-name' : ''} ${game.playerStats.role === 'superadmin' ? 'superadmin-name' : ''}`}>
                {game.playerStats.displayName}
              </span>
              {game.playerStats.streak > 1 && (
                <span className="streak-badge">
                  <Flame size={12} />
                  {game.playerStats.streak}
                </span>
              )}
            </div>
            <div className="score-bar player-bar">
              <div className="score-fill" style={{ width: `${playerScorePercent}%` }} />
              <span className="score-text">{game.playerStats.score}</span>
            </div>
          </div>
        </div>

        {/* Round indicator */}
        <div className="hud-round">
          <span className="round-current">{game.currentQuestionIndex + 1}</span>
          <span className="round-sep">/</span>
          <span className="round-total">{game.questions.length}</span>
        </div>

        {/* AI side */}
        <div className="hud-ai" style={{ '--ai-color': aiOpponent.color } as React.CSSProperties}>
          <div className="hud-info">
            <div className="hud-name-row">
              <span className="hud-name">{aiOpponent.name}</span>
              {game.aiStats.score > game.playerStats.score && (
                <span className="leading-badge">
                  <Zap size={12} />
                </span>
              )}
            </div>
            <div className="score-bar ai-bar">
              <div className="score-fill" style={{ width: `${aiScorePercent}%` }} />
              <span className="score-text">{game.aiStats.score}</span>
            </div>
          </div>
          <div className="hud-avatar ai">
            <span>{aiOpponent.emoji}</span>
          </div>
        </div>
      </div>

      {/* Timer bar */}
      <div className={`timer-bar ${timeLeft <= 5 ? 'warning' : ''} ${timeLeft <= 3 ? 'danger' : ''}`}>
        <div className="timer-fill" style={{ width: `${timerPercent}%` }} />
        <span className="timer-text">{timeLeft}</span>
      </div>

      {/* Question area */}
      <div className="question-zone">
        <div className="question-category">
          {currentQuestion.category === 'vocabulary' && '📝 TỪ VỰNG'}
          {currentQuestion.category === 'kanji' && '🈳 KANJI'}
          {currentQuestion.category === 'grammar' && '📖 NGỮ PHÁP'}
        </div>
        <h2 className="question-text">{currentQuestion.questionText}</h2>

        {/* AI thinking */}
        {(isPlaying || game.status === 'answered') && (
          <div className="ai-status">
            <span className="ai-emoji">{aiOpponent.emoji}</span>
            <span className="ai-thinking">đang suy nghĩ</span>
            <span className="thinking-dots"><span>.</span><span>.</span><span>.</span></span>
          </div>
        )}
      </div>

      {/* Answer grid */}
      <div className="answer-zone">
        {currentQuestion.options.map((option, index) => {
          const style = ANSWER_STYLES[index];
          const isSelected = selectedAnswer === index;
          const isCorrect = isRevealing && index === currentQuestion.correctIndex;
          const isWrong = isRevealing && isSelected && index !== currentQuestion.correctIndex;
          const isAIPick = isRevealing && lastResult?.aiAnswer.answerIndex === index;

          return (
            <button
              key={index}
              className={`
                answer-block
                ${isSelected ? 'selected' : ''}
                ${isSubmitted && isSelected ? 'submitted' : ''}
                ${isCorrect ? 'correct' : ''}
                ${isWrong ? 'wrong' : ''}
              `}
              style={{ '--answer-color': style.bg, '--answer-light': style.light } as React.CSSProperties}
              onClick={() => handleSelectAnswer(index)}
              disabled={!isPlaying || isSubmitted}
            >
              <span className="answer-label">{style.label}</span>
              <span className="answer-text">{option}</span>

              {isCorrect && <span className="answer-result correct">✓</span>}
              {isWrong && <span className="answer-result wrong">✗</span>}
              {isAIPick && <span className="ai-pick">{aiOpponent.emoji}</span>}
            </button>
          );
        })}
      </div>

      {/* Submit button */}
      {isPlaying && !isSubmitted && (
        <div className="submit-zone">
          <button
            className={`submit-btn ${selectedAnswer !== null ? 'active' : 'disabled'}`}
            onClick={handleSubmitAnswer}
            disabled={selectedAnswer === null}
          >
            Trả lời
          </button>
        </div>
      )}

      {/* Round result modal */}
      {isRevealing && lastResult && (
        <div className="round-result-modal">
          <div className={`result-content ${lastResult.winner}`}>
            {/* Winner announcement */}
            <div className="result-announcement">
              {lastResult.winner === 'player' ? (
                <>
                  <span className="result-icon">🎉</span>
                  <span className="result-text win">BẠN THẮNG!</span>
                  <span className="result-points">+{lastResult.playerAnswer.points}</span>
                </>
              ) : lastResult.winner === 'ai' ? (
                <>
                  <span className="result-icon">{aiOpponent.emoji}</span>
                  <span className="result-text lose">{aiOpponent.name.toUpperCase()} THẮNG</span>
                  <span className="result-points">+{lastResult.aiAnswer.points}</span>
                </>
              ) : (
                <>
                  <span className="result-icon">⚖️</span>
                  <span className="result-text tie">HÒA!</span>
                </>
              )}
            </div>

            {/* Stats comparison - Pro VS Display */}
            <div className="result-stats-pro">
              <div className={`fighter-side player ${lastResult.playerAnswer.isCorrect ? 'winner' : 'loser'}`}>
                <div className={`fighter-avatar-large ${game.playerStats.role === 'vip' ? 'vip-frame' : ''} ${game.playerStats.role === 'admin' || game.playerStats.role === 'superadmin' ? 'admin-frame' : ''}`}>
                  {renderAvatar(game.playerStats.avatar)}
                </div>
                <span className={`fighter-name ${game.playerStats.role === 'vip' ? 'vip-name' : ''} ${game.playerStats.role === 'admin' ? 'admin-name' : ''} ${game.playerStats.role === 'superadmin' ? 'superadmin-name' : ''}`}>{game.playerStats.displayName}</span>
                <div className="fighter-result">
                  <span className={`result-badge ${lastResult.playerAnswer.isCorrect ? 'correct' : 'wrong'}`}>
                    {lastResult.playerAnswer.isCorrect ? '✓' : '✗'}
                  </span>
                  {lastResult.playerAnswer.answerIndex !== null && (
                    <span className="result-time">{(lastResult.playerAnswer.timeMs / 1000).toFixed(2)}s</span>
                  )}
                </div>
              </div>

              <div className="vs-divider">
                <div className="vs-line" />
                <span className="vs-text-pro">VS</span>
                <div className="vs-line" />
              </div>

              <div className={`fighter-side ai ${lastResult.aiAnswer.isCorrect ? 'winner' : 'loser'}`} style={{ '--ai-color': aiOpponent.color } as React.CSSProperties}>
                <div className="fighter-avatar-large">
                  <span>{aiOpponent.emoji}</span>
                </div>
                <span className="fighter-name">{aiOpponent.name}</span>
                <div className="fighter-result">
                  <span className={`result-badge ${lastResult.aiAnswer.isCorrect ? 'correct' : 'wrong'}`}>
                    {lastResult.aiAnswer.isCorrect ? '✓' : '✗'}
                  </span>
                  <span className="result-time">{(lastResult.aiAnswer.timeMs / 1000).toFixed(2)}s</span>
                </div>
              </div>
            </div>

            {/* Correct answer display */}
            <div className="correct-answer-display">
              <span className="correct-answer-label">Đáp án đúng:</span>
              <span className="correct-answer-text">
                <span className="correct-answer-letter">{ANSWER_STYLES[currentQuestion.correctIndex].label}</span>
                {currentQuestion.options[currentQuestion.correctIndex]}
              </span>
            </div>

            {/* Continue button */}
            <button className="continue-btn" onClick={onNextQuestion}>
              <span>
                {game.currentQuestionIndex + 1 < game.questions.length
                  ? 'Câu tiếp theo'
                  : 'Xem kết quả'}
              </span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
