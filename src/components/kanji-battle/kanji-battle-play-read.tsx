// Kanji Battle Play - Read Mode (type reading/meaning)
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type {
  KanjiBattleGame,
  KanjiBattleSkill,
  KanjiBattleSkillType,
} from '../../types/kanji-battle';
import { KANJI_BATTLE_SKILLS } from '../../types/kanji-battle';
import { PlayerLeaderboard, type LeaderboardPlayer } from '../game-hub/player-leaderboard';
import { useGameSounds } from '../../hooks/use-game-sounds';

interface KanjiBattlePlayReadProps {
  game: KanjiBattleGame;
  currentPlayerId: string;
  onSubmitAnswer: (answer: string) => void;
  onUseHint: () => void;
  onSelectSkill: (skillType: KanjiBattleSkillType, targetId?: string) => void;
  onNextRound: () => void;
  onSubmitDrawing?: (strokes: unknown) => void; // unused in read mode
}

export const KanjiBattlePlayRead: React.FC<KanjiBattlePlayReadProps> = ({
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
  const [selectedSkill, setSelectedSkill] = useState<KanjiBattleSkillType | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentPlayer = game.players[currentPlayerId];
  const isPlaying = game.status === 'playing';
  const isSkillPhase = game.status === 'skill_phase';
  const isResult = game.status === 'result';

  const { playCorrect, playWrong, playVictory, playDefeat, startMusic, stopMusic, settings: soundSettings } = useGameSounds();
  const soundPlayedRef = useRef<string>('');

  useEffect(() => {
    if (isResult && currentPlayer) {
      const soundKey = `result-${game.currentRound}`;
      if (soundPlayedRef.current !== soundKey) {
        soundPlayedRef.current = soundKey;
        if (currentPlayer.isCorrect) playCorrect(); else playWrong();
      }
    }
  }, [isResult, game.currentRound, currentPlayer, playCorrect, playWrong]);

  useEffect(() => {
    if (game.status === 'finished') {
      const players = Object.values(game.players).sort((a, b) => b.score - a.score);
      if (players[0]?.odinhId === currentPlayerId) playVictory(); else playDefeat();
      stopMusic();
    }
  }, [game.status, game.players, currentPlayerId, playVictory, playDefeat, stopMusic]);

  useEffect(() => {
    if (isPlaying && soundSettings.musicEnabled) startMusic();
  }, [isPlaying, soundSettings.musicEnabled, startMusic]);

  useEffect(() => {
    if (isPlaying && inputRef.current && !currentPlayer?.isSlowed) inputRef.current.focus();
  }, [isPlaying, currentPlayer?.isSlowed]);

  useEffect(() => {
    if (!isPlaying || !game.roundStartTime) return;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - game.roundStartTime!) / 1000;
      const remaining = Math.max(0, game.settings.timePerQuestion - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, game.roundStartTime, game.settings.timePerQuestion]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnswer('');
    setRevealedHints([]);
    setTimeLeft(game.settings.timePerQuestion);
  }, [game.currentRound, game.settings.timePerQuestion]);

  const [isDelayed, setIsDelayed] = useState(false);
  useEffect(() => {
    if (isPlaying && currentPlayer?.isSlowed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDelayed(true);
      const timer = setTimeout(() => { setIsDelayed(false); inputRef.current?.focus(); }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentPlayer?.isSlowed, game.currentRound]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || currentPlayer?.hasAnswered) return;
    onSubmitAnswer(answer.trim());
  }, [answer, currentPlayer?.hasAnswered, onSubmitAnswer]);

  const handleUseHint = useCallback(() => {
    if (!game.currentQuestion || currentPlayer?.hintsRemaining <= 0) return;
    const hintIndex = revealedHints.length;
    if (hintIndex < game.currentQuestion.hints.length) {
      setRevealedHints(prev => [...prev, game.currentQuestion!.hints[hintIndex]]);
      onUseHint();
    }
  }, [game.currentQuestion, currentPlayer?.hintsRemaining, revealedHints.length, onUseHint]);

  const handleSelectSkill = useCallback((skillType: KanjiBattleSkillType) => {
    const skill = KANJI_BATTLE_SKILLS[skillType];
    if (skill.targetOther) setSelectedSkill(skillType);
    else onSelectSkill(skillType);
  }, [onSelectSkill]);

  const handleTargetPlayer = useCallback((targetId: string) => {
    if (selectedSkill) { onSelectSkill(selectedSkill, targetId); setSelectedSkill(null); }
  }, [selectedSkill, onSelectSkill]);

  const sortedPlayers = Object.values(game.players).sort((a, b) => b.score - a.score);
  const lastResult = game.roundResults[game.roundResults.length - 1];

  const leaderboardPlayers: LeaderboardPlayer[] = useMemo(() => {
    return sortedPlayers.map(player => {
      let answerStatus: LeaderboardPlayer['answerStatus'] = 'none';
      if (isResult && lastResult) {
        const playerResult = lastResult.playerResults.find(r => r.odinhId === player.odinhId);
        if (playerResult) answerStatus = playerResult.isCorrect ? 'correct' : 'wrong';
      } else if (isPlaying) {
        answerStatus = player.hasAnswered ? 'pending' : 'none';
      }
      return {
        id: player.odinhId, displayName: player.displayName, avatar: player.avatar,
        score: player.score, isCurrentUser: player.odinhId === currentPlayerId,
        answerStatus, streak: player.streak, isBot: player.isBot, role: player.role,
      };
    });
  }, [sortedPlayers, isPlaying, isResult, lastResult, currentPlayerId]);

  // Skill phase
  if (isSkillPhase) {
    const skills = Object.values(KANJI_BATTLE_SKILLS);
    const otherPlayers = Object.values(game.players).filter(p => p.odinhId !== currentPlayerId);
    return (
      <div className="speed-quiz-play skill-phase">
        <div className="skill-phase-header">
          <h2>✨ Chọn Kỹ Năng Đặc Biệt</h2>
          <p>Câu {game.currentRound}/{game.settings.totalRounds}</p>
        </div>
        {!selectedSkill ? (
          <div className="skills-grid">
            {skills.map((skill: KanjiBattleSkill) => (
              <button key={skill.type} className="skill-card" onClick={() => handleSelectSkill(skill.type)}>
                <span className="skill-emoji">{skill.emoji}</span>
                <span className="skill-name">{skill.name}</span>
                <span className="skill-desc">{skill.description}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="target-selection">
            <h3>🎯 Chọn mục tiêu cho {KANJI_BATTLE_SKILLS[selectedSkill].name}</h3>
            <div className="targets-grid">
              {otherPlayers.map(player => (
                <button key={player.odinhId} className="target-card" onClick={() => handleTargetPlayer(player.odinhId)}>
                  <span className="target-avatar">{player.avatar}</span>
                  <span className="target-name">{player.displayName}</span>
                  <span className="target-score">{player.score} điểm</span>
                </button>
              ))}
            </div>
            <button className="speed-quiz-btn secondary" onClick={() => setSelectedSkill(null)}>← Chọn lại</button>
          </div>
        )}
        <div className="scoreboard-mini">
          {sortedPlayers.slice(0, 5).map((player, index) => (
            <div key={player.odinhId} className={`score-item ${player.odinhId === currentPlayerId ? 'current' : ''}`}>
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

  // Result phase
  if (isResult && lastResult) {
    const playerResult = lastResult.playerResults.find(r => r.odinhId === currentPlayerId);
    return (
      <div className="speed-quiz-play result-phase">
        <div className="result-header"><h2>📊 Kết Quả Câu {game.currentRound}</h2></div>
        <div className="correct-answer">
          <span className="label">Đáp án:</span>
          <span className="answer">{game.currentQuestion?.meaning} ({game.currentQuestion?.sinoVietnamese})</span>
        </div>
        {game.currentQuestion && (
          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#6b7280', marginBottom: 12 }}>
            On: {game.currentQuestion.onYomi.join(', ')} | Kun: {game.currentQuestion.kunYomi.join(', ')}
          </div>
        )}
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
            <span>Nhanh nhất: {game.players[lastResult.fastestPlayer]?.displayName || 'Unknown'}</span>
          </div>
        )}
        <div className="all-results">
          <h3>Kết quả tất cả:</h3>
          <div className="results-list">
            {lastResult.playerResults
              .sort((a, b) => { if (a.isCorrect !== b.isCorrect) return a.isCorrect ? -1 : 1; return a.timeMs - b.timeMs; })
              .map((result, index) => {
                const player = game.players[result.odinhId];
                return (
                  <div key={result.odinhId} className={`result-item ${result.isCorrect ? 'correct' : 'wrong'} ${result.odinhId === currentPlayerId ? 'current' : ''}`}>
                    <span className="rank">#{index + 1}</span>
                    <span className="avatar">{player?.avatar}</span>
                    <span className="name">{player?.displayName}</span>
                    <span className="answer-text">{result.answer || '(không trả lời)'}</span>
                    <span className="time">{result.isCorrect ? `${(result.timeMs / 1000).toFixed(2)}s` : '-'}</span>
                    <span className="points">{result.pointsEarned > 0 ? '+' : ''}{result.pointsEarned}</span>
                  </div>
                );
              })}
          </div>
        </div>
        {game.hostId === currentPlayerId && (
          <button className="speed-quiz-btn primary large" onClick={onNextRound}>
            {game.currentRound < game.settings.totalRounds ? '➡️ Câu Tiếp Theo' : '🏁 Xem Kết Quả'}
          </button>
        )}
      </div>
    );
  }

  // Playing phase
  return (
    <div className="speed-quiz-play playing-phase with-leaderboard">
      <div className="speed-quiz-main">
        <div className="play-header">
          <div className="round-info">
            <span className="round">Câu {game.currentRound}/{game.settings.totalRounds}</span>
            <div className={`timer ${timeLeft <= 3 ? 'danger' : timeLeft <= 5 ? 'warning' : ''}`}>
              <span className="time-value">{Math.ceil(timeLeft)}</span>
              <span className="time-label">giây</span>
            </div>
          </div>
        </div>

        {currentPlayer && (
          <div className="active-effects">
            {currentPlayer.hasDoublePoints && <span className="effect double">✨ x2 ({currentPlayer.doublePointsTurns} lượt)</span>}
            {currentPlayer.hasShield && <span className="effect shield">🛡️ Khiên ({currentPlayer.shieldTurns} lượt)</span>}
            {currentPlayer.isSlowed && <span className="effect slowed">🐌 Bị làm chậm</span>}
          </div>
        )}

        {game.currentQuestion && (
          <div className="question-area">
            <div className="question-display" style={{ fontSize: '4rem', fontWeight: 700 }}>
              <span className="question-text">{game.currentQuestion.kanjiCharacter}</span>
            </div>
            <div className="question-meta">
              <span className="category">📝 {game.currentQuestion.strokeCount} nét</span>
              <span className="points">+{game.currentQuestion.points} điểm</span>
            </div>
            {revealedHints.length > 0 && (
              <div className="hints-revealed">
                {revealedHints.map((hint, i) => (
                  <div key={i} className="hint-item">💡 {hint}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {isDelayed ? (
          <div className="delay-overlay">
            <span className="delay-icon">🐌</span>
            <span className="delay-text">Bị làm chậm...</span>
          </div>
        ) : (
          <form className="answer-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef} type="text" value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Nhập nghĩa / cách đọc..."
              disabled={currentPlayer?.hasAnswered}
              className={currentPlayer?.hasAnswered ? 'answered' : ''}
            />
            <button type="submit" className="speed-quiz-btn primary"
              disabled={!answer.trim() || currentPlayer?.hasAnswered}>
              {currentPlayer?.hasAnswered ? '✓ Đã trả lời' : '📤 Gửi'}
            </button>
          </form>
        )}

        <div className="hint-section">
          <button className="speed-quiz-btn secondary hint-btn" onClick={handleUseHint}
            disabled={currentPlayer?.hintsRemaining <= 0 || revealedHints.length >= (game.currentQuestion?.hints.length || 0)}>
            💡 Gợi ý ({currentPlayer?.hintsRemaining || 0} còn lại)
          </button>
        </div>
      </div>

      <div className="speed-quiz-sidebar">
        <PlayerLeaderboard players={leaderboardPlayers} currentUserId={currentPlayerId}
          title="Bảng Xếp Hạng" showAnswerStatus={true} maxVisible={10} />
      </div>
    </div>
  );
};
