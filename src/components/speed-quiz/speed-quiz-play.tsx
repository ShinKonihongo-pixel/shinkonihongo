// Speed Quiz Play - Main gameplay screen
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  SpeedQuizGame,
  SpeedQuizSkill,
  SpeedQuizSkillType,
} from '../../types/speed-quiz';
import { SPEED_QUIZ_SKILLS } from '../../types/speed-quiz';

interface SpeedQuizPlayProps {
  game: SpeedQuizGame;
  currentPlayerId: string;
  onSubmitAnswer: (answer: string) => void;
  onUseHint: () => void;
  onSelectSkill: (skillType: SpeedQuizSkillType, targetId?: string) => void;
  onNextRound: () => void;
}

export const SpeedQuizPlay: React.FC<SpeedQuizPlayProps> = ({
  game,
  currentPlayerId,
  onSubmitAnswer,
  onUseHint,
  onSelectSkill,
  onNextRound,
}) => {
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(game.settings.timePerQuestion);
  const [revealedHints, setRevealedHints] = useState<string[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<SpeedQuizSkillType | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentPlayer = game.players[currentPlayerId];
  const isPlaying = game.status === 'playing';
  const isSkillPhase = game.status === 'skill_phase';
  const isResult = game.status === 'result';

  // Focus input when playing
  useEffect(() => {
    if (isPlaying && inputRef.current && !currentPlayer?.isSlowed) {
      inputRef.current.focus();
    }
  }, [isPlaying, currentPlayer?.isSlowed]);

  // Timer countdown
  useEffect(() => {
    if (!isPlaying || !game.roundStartTime) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - game.roundStartTime!) / 1000;
      const remaining = Math.max(0, game.settings.timePerQuestion - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, game.roundStartTime, game.settings.timePerQuestion]);

  // Reset state when new round starts
  useEffect(() => {
    setAnswer('');
    setRevealedHints([]);
    setTimeLeft(game.settings.timePerQuestion);
  }, [game.currentRound, game.settings.timePerQuestion]);

  // Handle slow effect
  const [isDelayed, setIsDelayed] = useState(false);
  useEffect(() => {
    if (isPlaying && currentPlayer?.isSlowed) {
      setIsDelayed(true);
      const timer = setTimeout(() => {
        setIsDelayed(false);
        inputRef.current?.focus();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentPlayer?.isSlowed, game.currentRound]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!answer.trim() || currentPlayer?.hasAnswered) return;
      onSubmitAnswer(answer.trim());
    },
    [answer, currentPlayer?.hasAnswered, onSubmitAnswer]
  );

  const handleUseHint = useCallback(() => {
    if (!game.currentQuestion || currentPlayer?.hintsRemaining <= 0) return;
    const hintIndex = revealedHints.length;
    if (hintIndex < game.currentQuestion.hints.length) {
      setRevealedHints((prev) => [...prev, game.currentQuestion!.hints[hintIndex]]);
      onUseHint();
    }
  }, [game.currentQuestion, currentPlayer?.hintsRemaining, revealedHints.length, onUseHint]);

  const handleSelectSkill = useCallback(
    (skillType: SpeedQuizSkillType) => {
      const skill = SPEED_QUIZ_SKILLS[skillType];
      if (skill.targetOther) {
        setSelectedSkill(skillType);
      } else {
        onSelectSkill(skillType);
      }
    },
    [onSelectSkill]
  );

  const handleTargetPlayer = useCallback(
    (targetId: string) => {
      if (selectedSkill) {
        onSelectSkill(selectedSkill, targetId);
        setSelectedSkill(null);
      }
    },
    [selectedSkill, onSelectSkill]
  );

  const sortedPlayers = Object.values(game.players).sort((a, b) => b.score - a.score);
  const lastResult = game.roundResults[game.roundResults.length - 1];

  // Render skill phase
  if (isSkillPhase) {
    const skills = Object.values(SPEED_QUIZ_SKILLS);
    const otherPlayers = Object.values(game.players).filter(
      (p) => p.odinhId !== currentPlayerId
    );

    return (
      <div className="speed-quiz-play skill-phase">
        <div className="skill-phase-header">
          <h2>✨ Chọn Kỹ Năng Đặc Biệt</h2>
          <p>Câu {game.currentRound}/{game.settings.totalRounds}</p>
        </div>

        {!selectedSkill ? (
          <div className="skills-grid">
            {skills.map((skill: SpeedQuizSkill) => (
              <button
                key={skill.type}
                className="skill-card"
                onClick={() => handleSelectSkill(skill.type)}
              >
                <span className="skill-emoji">{skill.emoji}</span>
                <span className="skill-name">{skill.name}</span>
                <span className="skill-desc">{skill.description}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="target-selection">
            <h3>🎯 Chọn mục tiêu cho {SPEED_QUIZ_SKILLS[selectedSkill].name}</h3>
            <div className="targets-grid">
              {otherPlayers.map((player) => (
                <button
                  key={player.odinhId}
                  className="target-card"
                  onClick={() => handleTargetPlayer(player.odinhId)}
                >
                  <span className="target-avatar">{player.avatar}</span>
                  <span className="target-name">{player.displayName}</span>
                  <span className="target-score">{player.score} điểm</span>
                </button>
              ))}
            </div>
            <button
              className="speed-quiz-btn secondary"
              onClick={() => setSelectedSkill(null)}
            >
              ← Chọn lại
            </button>
          </div>
        )}

        <div className="scoreboard-mini">
          {sortedPlayers.slice(0, 5).map((player, index) => (
            <div
              key={player.odinhId}
              className={`score-item ${player.odinhId === currentPlayerId ? 'current' : ''}`}
            >
              <span className="rank">#{index + 1}</span>
              <span className="avatar">{player.avatar}</span>
              <span className="name">{player.displayName}</span>
              <span className="score">{player.score}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render result phase
  if (isResult && lastResult) {
    const playerResult = lastResult.playerResults.find(
      (r) => r.odinhId === currentPlayerId
    );

    return (
      <div className="speed-quiz-play result-phase">
        <div className="result-header">
          <h2>📊 Kết Quả Câu {game.currentRound}</h2>
        </div>

        <div className="correct-answer">
          <span className="label">Đáp án đúng:</span>
          <span className="answer">{lastResult.correctAnswer}</span>
        </div>

        {playerResult && (
          <div className={`your-result ${playerResult.isCorrect ? 'correct' : 'wrong'}`}>
            <span className="icon">{playerResult.isCorrect ? '✅' : '❌'}</span>
            <span className="text">
              {playerResult.isCorrect
                ? `Chính xác! +${playerResult.pointsEarned} điểm`
                : `Sai rồi! ${playerResult.pointsEarned} điểm`}
            </span>
            {playerResult.isCorrect && (
              <span className="time">⏱️ {(playerResult.timeMs / 1000).toFixed(2)}s</span>
            )}
          </div>
        )}

        {lastResult.fastestPlayer && (
          <div className="fastest-player">
            <span className="icon">🏆</span>
            <span>
              Nhanh nhất:{' '}
              {game.players[lastResult.fastestPlayer]?.displayName || 'Unknown'}
            </span>
          </div>
        )}

        <div className="all-results">
          <h3>Kết quả tất cả:</h3>
          <div className="results-list">
            {lastResult.playerResults
              .sort((a, b) => {
                if (a.isCorrect !== b.isCorrect) return a.isCorrect ? -1 : 1;
                return a.timeMs - b.timeMs;
              })
              .map((result, index) => {
                const player = game.players[result.odinhId];
                return (
                  <div
                    key={result.odinhId}
                    className={`result-item ${result.isCorrect ? 'correct' : 'wrong'} ${
                      result.odinhId === currentPlayerId ? 'current' : ''
                    }`}
                  >
                    <span className="rank">#{index + 1}</span>
                    <span className="avatar">{player?.avatar}</span>
                    <span className="name">{player?.displayName}</span>
                    <span className="answer-text">{result.answer || '(không trả lời)'}</span>
                    <span className="time">
                      {result.isCorrect ? `${(result.timeMs / 1000).toFixed(2)}s` : '-'}
                    </span>
                    <span className="points">
                      {result.pointsEarned > 0 ? '+' : ''}
                      {result.pointsEarned}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        {game.hostId === currentPlayerId && (
          <button className="speed-quiz-btn primary large" onClick={onNextRound}>
            {game.currentRound < game.settings.totalRounds
              ? '➡️ Câu Tiếp Theo'
              : '🏁 Xem Kết Quả'}
          </button>
        )}
      </div>
    );
  }

  // Render playing phase
  return (
    <div className="speed-quiz-play playing-phase">
      <div className="play-header">
        <div className="round-info">
          <span className="round">Câu {game.currentRound}/{game.settings.totalRounds}</span>
          <div className={`timer ${timeLeft <= 3 ? 'danger' : timeLeft <= 5 ? 'warning' : ''}`}>
            <span className="time-value">{Math.ceil(timeLeft)}</span>
            <span className="time-label">giây</span>
          </div>
        </div>
      </div>

      {/* Effects display */}
      {currentPlayer && (
        <div className="active-effects">
          {currentPlayer.hasDoublePoints && (
            <span className="effect double">✨ x2 ({currentPlayer.doublePointsTurns} lượt)</span>
          )}
          {currentPlayer.hasShield && (
            <span className="effect shield">🛡️ Khiên ({currentPlayer.shieldTurns} lượt)</span>
          )}
          {currentPlayer.isSlowed && (
            <span className="effect slowed">🐌 Bị làm chậm</span>
          )}
        </div>
      )}

      {/* Question display */}
      {game.currentQuestion && (
        <div className="question-area">
          <div className="question-display">
            <span className="question-text">{game.currentQuestion.display}</span>
          </div>

          <div className="question-meta">
            <span className="category">
              {game.currentQuestion.category === 'vocabulary'
                ? '📝 Từ vựng'
                : game.currentQuestion.category === 'kanji'
                ? '🈳 Kanji'
                : '📖 Ngữ pháp'}
            </span>
            <span className="points">+{game.currentQuestion.points} điểm</span>
          </div>

          {/* Hints */}
          {revealedHints.length > 0 && (
            <div className="hints-revealed">
              {revealedHints.map((hint, i) => (
                <div key={i} className="hint-item">
                  💡 {hint}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Answer input */}
      {isDelayed ? (
        <div className="delay-overlay">
          <span className="delay-icon">🐌</span>
          <span className="delay-text">Bị làm chậm...</span>
        </div>
      ) : (
        <form className="answer-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Nhập đáp án..."
            disabled={currentPlayer?.hasAnswered}
            className={currentPlayer?.hasAnswered ? 'answered' : ''}
          />
          <button
            type="submit"
            className="speed-quiz-btn primary"
            disabled={!answer.trim() || currentPlayer?.hasAnswered}
          >
            {currentPlayer?.hasAnswered ? '✓ Đã trả lời' : '📤 Gửi'}
          </button>
        </form>
      )}

      {/* Hint button */}
      <div className="hint-section">
        <button
          className="speed-quiz-btn secondary hint-btn"
          onClick={handleUseHint}
          disabled={
            currentPlayer?.hintsRemaining <= 0 ||
            revealedHints.length >= (game.currentQuestion?.hints.length || 0)
          }
        >
          💡 Gợi ý ({currentPlayer?.hintsRemaining || 0} còn lại)
        </button>
      </div>

      {/* Live scoreboard */}
      <div className="live-scoreboard">
        <h3>📊 Bảng xếp hạng</h3>
        <div className="scoreboard-list">
          {sortedPlayers.map((player, index) => (
            <div
              key={player.odinhId}
              className={`score-row ${player.odinhId === currentPlayerId ? 'current' : ''} ${
                player.hasAnswered ? 'answered' : ''
              }`}
            >
              <span className="rank">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
              </span>
              <span className="avatar">{player.avatar}</span>
              <span className="name">
                {player.displayName}
                {player.isBot && ' 🤖'}
              </span>
              <span className="streak">
                {player.streak > 0 && `🔥${player.streak}`}
              </span>
              <span className="status">
                {player.hasAnswered ? '✓' : '...'}
              </span>
              <span className="score">{player.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
