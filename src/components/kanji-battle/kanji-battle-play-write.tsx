// Kanji Battle Play - Write Mode (draw kanji by stroke order)
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type {
  KanjiBattleGame,
  KanjiBattleSkill,
  KanjiBattleSkillType,
  StrokeMatchResult,
} from '../../types/kanji-battle';
import { KANJI_BATTLE_SKILLS } from '../../types/kanji-battle';
import { KanjiDrawingCanvas } from './kanji-drawing-canvas';
import { useStrokeDrawing } from '../../hooks/kanji-battle/use-stroke-drawing';
import { PlayerLeaderboard, type LeaderboardPlayer } from '../game-hub/player-leaderboard';
import { useGameSounds } from '../../hooks/use-game-sounds';
import { loadStrokeData } from '../../data/kanjivg/index';

interface KanjiBattlePlayWriteProps {
  game: KanjiBattleGame;
  currentPlayerId: string;
  onSubmitAnswer: (answer: string) => void;
  onSubmitDrawing: (strokeResults: StrokeMatchResult[], drawingTimeMs: number) => void;
  onUseHint: () => void;
  onSelectSkill: (skillType: KanjiBattleSkillType, targetId?: string) => void;
  onNextRound: () => void;
}

export const KanjiBattlePlayWrite: React.FC<KanjiBattlePlayWriteProps> = ({
  game,
  currentPlayerId,
  onSubmitDrawing,
  onUseHint,
  onSelectSkill,
  onNextRound,
}) => {
  const [timeLeft, setTimeLeft] = useState(game.settings.timePerQuestion);
  const [selectedSkill, setSelectedSkill] = useState<KanjiBattleSkillType | null>(null);
  const [strokePaths, setStrokePaths] = useState<string[]>([]);
  const [revealedHints, setRevealedHints] = useState<string[]>([]);
  const currentPlayer = game.players[currentPlayerId];
  const isPlaying = game.status === 'playing';
  const isSkillPhase = game.status === 'skill_phase';
  const isResult = game.status === 'result';

  const { playCorrect, playWrong, playVictory, playDefeat, startMusic, stopMusic, settings: soundSettings } = useGameSounds();
  const soundPlayedRef = useRef<string>('');

  // Load stroke data for current kanji
  useEffect(() => {
    if (game.currentQuestion?.kanjiCharacter) {
      loadStrokeData(game.currentQuestion.kanjiCharacter).then(data => {
        setStrokePaths(data?.strokePaths || []);
      });
    }
  }, [game.currentQuestion?.kanjiCharacter]);

  const { currentStrokeIndex, strokeResults, isComplete, totalStrokes, handleStrokeComplete, resetDrawing } =
    useStrokeDrawing({
      strokePaths,
      fallbackStrokeCount: game.currentQuestion?.strokeCount || 0,
      onComplete: (results, drawingTimeMs) => {
        onSubmitDrawing(results, drawingTimeMs);
      },
    });

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
    setTimeLeft(game.settings.timePerQuestion);
    setRevealedHints([]);
    resetDrawing();
  }, [game.currentRound, game.settings.timePerQuestion, resetDrawing]);

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

  // Skill phase (same as read mode)
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
          <span className="label">Kanji:</span>
          <span className="answer" style={{ fontSize: '2rem' }}>{game.currentQuestion?.kanjiCharacter}</span>
          <span style={{ marginLeft: 12 }}>{game.currentQuestion?.meaning} ({game.currentQuestion?.sinoVietnamese})</span>
        </div>
        {playerResult && (
          <div className={`your-result ${playerResult.isCorrect ? 'correct' : 'wrong'}`}>
            <span className="icon">{playerResult.isCorrect ? '✅' : '❌'}</span>
            <span className="text">
              {playerResult.isCorrect
                ? `Chính xác! +${playerResult.pointsEarned} điểm`
                : `Chưa đạt! ${playerResult.pointsEarned} điểm`}
            </span>
            {playerResult.strokeScore !== undefined && (
              <span className="time">✍️ {playerResult.strokeScore}% chính xác</span>
            )}
          </div>
        )}
        <div className="all-results">
          <h3>Kết quả tất cả:</h3>
          <div className="results-list">
            {lastResult.playerResults
              .sort((a, b) => { if (a.isCorrect !== b.isCorrect) return a.isCorrect ? -1 : 1; return (b.strokeScore || 0) - (a.strokeScore || 0); })
              .map((result, index) => {
                const player = game.players[result.odinhId];
                return (
                  <div key={result.odinhId} className={`result-item ${result.isCorrect ? 'correct' : 'wrong'} ${result.odinhId === currentPlayerId ? 'current' : ''}`}>
                    <span className="rank">#{index + 1}</span>
                    <span className="avatar">{player?.avatar}</span>
                    <span className="name">{player?.displayName}</span>
                    <span className="answer-text">{result.strokeScore !== undefined ? `${result.strokeScore}%` : '-'}</span>
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

  // Playing phase - Write mode
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
          </div>
        )}

        {game.currentQuestion && (
          <div className="question-area">
            <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '3.5rem', fontWeight: 700, lineHeight: 1.1 }}>
                {game.currentQuestion.kanjiCharacter}
              </div>
              <div style={{ fontSize: '0.95rem', color: '#6b7280', marginTop: 4 }}>
                {game.currentQuestion.meaning}
                {game.currentQuestion.sinoVietnamese && (
                  <span style={{ marginLeft: 6, color: '#9ca3af' }}>({game.currentQuestion.sinoVietnamese})</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                Nét {currentStrokeIndex + 1}/{totalStrokes || game.currentQuestion.strokeCount}
              </span>
              {strokeResults.length > 0 && (
                <span style={{
                  fontSize: '0.85rem', fontWeight: 600,
                  color: strokeResults[strokeResults.length - 1].isCorrect ? '#22c55e' : '#ef4444',
                }}>
                  {strokeResults[strokeResults.length - 1].isCorrect ? '✓' : '✗'}
                  {' '}{Math.round(strokeResults[strokeResults.length - 1].accuracy)}%
                </span>
              )}
            </div>

            <KanjiDrawingCanvas
              kanjiCharacter={game.currentQuestion.kanjiCharacter}
              strokePaths={strokePaths}
              currentStrokeIndex={currentStrokeIndex}
              onStrokeComplete={handleStrokeComplete}
              disabled={currentPlayer?.hasAnswered || isComplete}
              strokeResults={strokeResults}
              size={300}
            />

            {revealedHints.length > 0 && (
              <div className="hints-revealed" style={{ marginTop: 8 }}>
                {revealedHints.map((hint, i) => (
                  <div key={i} className="hint-item">💡 {hint}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {isComplete && (
          <div style={{ textAlign: 'center', padding: '0.75rem', background: '#f0fdf4', borderRadius: 8, marginTop: 8 }}>
            ✅ Đã hoàn thành vẽ!
          </div>
        )}

        <div className="hint-section" style={{ marginTop: 8 }}>
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
