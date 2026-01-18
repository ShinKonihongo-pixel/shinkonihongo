// Word Match Play - Main gameplay screen with matching interface
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  WordMatchGame,
  WordMatchEffectType,
} from '../../types/word-match';
import { WORD_MATCH_EFFECTS, shuffleForDisplay } from '../../types/word-match';

interface WordMatchPlayProps {
  game: WordMatchGame;
  currentPlayerId: string;
  onSubmitMatches: (matches: { leftId: string; rightId: string }[]) => void;
  onApplyEffect: (effectType: WordMatchEffectType, targetId?: string) => void;
  onNextRound: () => void;
}

export const WordMatchPlay: React.FC<WordMatchPlayProps> = ({
  game,
  currentPlayerId,
  onSubmitMatches,
  onApplyEffect,
  onNextRound,
}) => {
  const [timeLeft, setTimeLeft] = useState(game.settings.timePerRound);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<{ leftId: string; rightId: string }[]>([]);
  const [selectedEffect, setSelectedEffect] = useState<WordMatchEffectType | null>(null);

  const currentPlayer = game.players[currentPlayerId];
  const isHost = game.hostId === currentPlayerId;
  const isPlaying = game.status === 'playing';
  const isWheelSpin = game.status === 'wheel_spin';
  const isResult = game.status === 'result';
  const isWheelWinner = game.wheelSpinner === currentPlayerId;

  // Shuffle pairs for display
  const { leftItems, rightItems } = useMemo(() => {
    if (!game.currentRoundData) {
      return { leftItems: [], rightItems: [] };
    }
    return shuffleForDisplay(game.currentRoundData.pairs);
  }, [game.currentRoundData]);

  // Timer countdown
  useEffect(() => {
    if (!isPlaying || !game.roundStartTime) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - game.roundStartTime!) / 1000;
      const remaining = Math.max(0, game.settings.timePerRound - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, game.roundStartTime, game.settings.timePerRound]);

  // Reset state when new round starts
  useEffect(() => {
    setSelectedLeft(null);
    setMatches([]);
    setSelectedEffect(null);
    setTimeLeft(game.settings.timePerRound);
  }, [game.currentRound, game.settings.timePerRound]);

  // Handle left item click
  const handleLeftClick = useCallback((id: string) => {
    if (currentPlayer?.hasSubmitted || currentPlayer?.isDisconnected) return;
    setSelectedLeft(id);
  }, [currentPlayer]);

  // Handle right item click
  const handleRightClick = useCallback((id: string) => {
    if (!selectedLeft || currentPlayer?.hasSubmitted || currentPlayer?.isDisconnected) return;

    // Check if this right item is already matched
    const existingMatch = matches.find(m => m.rightId === id);
    if (existingMatch) {
      // Remove existing match
      setMatches(prev => prev.filter(m => m.rightId !== id));
    }

    // Check if this left item already has a match
    const leftMatch = matches.find(m => m.leftId === selectedLeft);
    if (leftMatch) {
      // Update existing match
      setMatches(prev =>
        prev.map(m => (m.leftId === selectedLeft ? { ...m, rightId: id } : m))
      );
    } else {
      // Add new match
      setMatches(prev => [...prev, { leftId: selectedLeft, rightId: id }]);
    }

    setSelectedLeft(null);
  }, [selectedLeft, matches, currentPlayer]);

  // Get match for a left item
  const getMatchForLeft = useCallback(
    (leftId: string) => matches.find(m => m.leftId === leftId),
    [matches]
  );

  // Get match for a right item
  const getMatchForRight = useCallback(
    (rightId: string) => matches.find(m => m.rightId === rightId),
    [matches]
  );

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (currentPlayer?.hasSubmitted) return;
    onSubmitMatches(matches);
  }, [matches, currentPlayer, onSubmitMatches]);

  // Handle effect selection
  const handleSelectEffect = useCallback((effectType: WordMatchEffectType) => {
    const effect = WORD_MATCH_EFFECTS[effectType];
    if (effect.targetOther) {
      setSelectedEffect(effectType);
    } else {
      onApplyEffect(effectType);
    }
  }, [onApplyEffect]);

  // Handle target selection
  const handleTargetPlayer = useCallback((targetId: string) => {
    if (selectedEffect) {
      onApplyEffect(selectedEffect, targetId);
      setSelectedEffect(null);
    }
  }, [selectedEffect, onApplyEffect]);

  const sortedPlayers = Object.values(game.players).sort((a, b) => b.score - a.score);
  const lastResult = game.roundResults[game.roundResults.length - 1];
  const otherPlayers = Object.values(game.players).filter(p => p.odinhId !== currentPlayerId);

  // Render wheel spin phase
  if (isWheelSpin) {
    const effects = Object.values(WORD_MATCH_EFFECTS);

    return (
      <div className="word-match-play wheel-phase">
        <div className="wheel-phase-header">
          <h2>🎡 Vòng Quay May Mắn!</h2>
          {isWheelWinner ? (
            <p>Bạn trả lời đúng và nhanh nhất! Chọn phần thưởng:</p>
          ) : (
            <p>{game.players[game.wheelSpinner!]?.displayName} đang quay...</p>
          )}
        </div>

        {isWheelWinner && !selectedEffect && (
          <div className="effects-grid">
            {effects.map(effect => (
              <button
                key={effect.type}
                className="effect-card"
                onClick={() => handleSelectEffect(effect.type)}
              >
                <span className="effect-emoji">{effect.emoji}</span>
                <span className="effect-name">{effect.name}</span>
                <span className="effect-desc">{effect.description}</span>
              </button>
            ))}
          </div>
        )}

        {isWheelWinner && selectedEffect && (
          <div className="target-selection">
            <h3>🎯 Chọn mục tiêu cho {WORD_MATCH_EFFECTS[selectedEffect].name}</h3>
            <div className="targets-grid">
              {otherPlayers.map(player => (
                <button
                  key={player.odinhId}
                  className={`target-card ${player.hasShield ? 'shielded' : ''}`}
                  onClick={() => handleTargetPlayer(player.odinhId)}
                  disabled={player.hasShield && selectedEffect !== 'shield'}
                >
                  <span className="target-avatar">{player.avatar}</span>
                  <span className="target-name">{player.displayName}</span>
                  <span className="target-score">{player.score} điểm</span>
                  {player.hasShield && <span className="shield-badge">🛡️</span>}
                </button>
              ))}
            </div>
            <button
              className="word-match-btn secondary"
              onClick={() => setSelectedEffect(null)}
            >
              ← Chọn lại
            </button>
          </div>
        )}

        {!isWheelWinner && (
          <div className="waiting-wheel">
            <div className="wheel-animation">🎡</div>
          </div>
        )}
      </div>
    );
  }

  // Render result phase
  if (isResult && lastResult) {
    const playerResult = lastResult.playerResults.find(r => r.odinhId === currentPlayerId);
    const correctPairs = game.currentRoundData?.pairs || [];

    return (
      <div className="word-match-play result-phase">
        <div className="result-header">
          <h2>📊 Kết Quả Câu {game.currentRound}</h2>
          {lastResult.isSpecial && <span className="special-badge">⭐ Câu Đặc Biệt</span>}
        </div>

        {/* Show correct answers */}
        <div className="correct-answers">
          <h3>Đáp án đúng:</h3>
          <div className="answers-list">
            {correctPairs.map(pair => (
              <div key={pair.id} className="answer-pair">
                <span className="left">{pair.left}</span>
                <span className="arrow">↔</span>
                <span className="right">{pair.right}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Player's result */}
        {playerResult && (
          <div className={`your-result ${playerResult.allCorrect ? 'perfect' : ''}`}>
            <span className="icon">{playerResult.allCorrect ? '🎉' : '📝'}</span>
            <span className="text">
              {playerResult.correctCount}/5 đúng
              {playerResult.allCorrect && ' - Hoàn hảo!'}
            </span>
            <span className="points">+{playerResult.pointsEarned} điểm</span>
          </div>
        )}

        {/* Effect applied */}
        {game.selectedEffect && (
          <div className="effect-applied">
            <span>{WORD_MATCH_EFFECTS[game.selectedEffect].emoji}</span>
            <span>
              {game.players[game.wheelSpinner!]?.displayName} đã dùng{' '}
              {WORD_MATCH_EFFECTS[game.selectedEffect].name}
              {game.effectTarget && ` lên ${game.players[game.effectTarget]?.displayName}`}
            </span>
          </div>
        )}

        {/* All players results */}
        <div className="all-results">
          <h3>Kết quả tất cả:</h3>
          <div className="results-list">
            {lastResult.playerResults
              .sort((a, b) => b.pointsEarned - a.pointsEarned)
              .map((result, index) => {
                const player = game.players[result.odinhId];
                return (
                  <div
                    key={result.odinhId}
                    className={`result-item ${result.allCorrect ? 'perfect' : ''} ${
                      result.odinhId === currentPlayerId ? 'current' : ''
                    }`}
                  >
                    <span className="rank">#{index + 1}</span>
                    <span className="avatar">{player?.avatar}</span>
                    <span className="name">{player?.displayName}</span>
                    <span className="correct">{result.correctCount}/5</span>
                    <span className="points">+{result.pointsEarned}</span>
                  </div>
                );
              })}
          </div>
        </div>

        {isHost && (
          <button className="word-match-btn primary large" onClick={onNextRound}>
            {game.currentRound < game.settings.totalRounds
              ? '➡️ Câu Tiếp Theo'
              : '🏁 Xem Kết Quả'}
          </button>
        )}
      </div>
    );
  }

  // Render disconnected state
  if (currentPlayer?.isDisconnected) {
    return (
      <div className="word-match-play disconnected-phase">
        <div className="disconnected-message">
          <span className="icon">🔌</span>
          <h2>Bạn bị ngắt kết nối lượt này!</h2>
          <p>Hãy chờ lượt tiếp theo...</p>
        </div>

        <div className="live-scoreboard">
          <h3>📊 Bảng xếp hạng</h3>
          <div className="scoreboard-list">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.odinhId}
                className={`score-row ${player.odinhId === currentPlayerId ? 'current' : ''}`}
              >
                <span className="rank">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </span>
                <span className="avatar">{player.avatar}</span>
                <span className="name">{player.displayName}</span>
                <span className="score">{player.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render playing phase
  return (
    <div className="word-match-play playing-phase">
      <div className="play-header">
        <div className="round-info">
          <span className="round">
            Câu {game.currentRound}/{game.settings.totalRounds}
            {game.currentRoundData?.isSpecial && <span className="special">⭐</span>}
          </span>
          <div className={`timer ${timeLeft <= 5 ? 'danger' : timeLeft <= 10 ? 'warning' : ''}`}>
            <span className="time-value">{Math.ceil(timeLeft)}</span>
            <span className="time-label">giây</span>
          </div>
        </div>
      </div>

      {/* Effects display */}
      {currentPlayer && (
        <div className="active-effects">
          {currentPlayer.hasShield && (
            <span className="effect shield">🛡️ Có lá chắn</span>
          )}
          {currentPlayer.isChallenged && (
            <span className="effect challenged">⚔️ Bị thách đấu (từ khó)</span>
          )}
        </div>
      )}

      {/* Matching area */}
      <div className="matching-area">
        <div className="matching-instruction">
          <p>Nối từ bên trái với nghĩa bên phải ({matches.length}/5)</p>
        </div>

        <div className="matching-columns">
          {/* Left column - Japanese words */}
          <div className="match-column left-column">
            {leftItems.map(item => {
              const match = getMatchForLeft(item.id);
              return (
                <button
                  key={item.id}
                  className={`match-item ${selectedLeft === item.id ? 'selected' : ''} ${
                    match ? 'matched' : ''
                  }`}
                  onClick={() => handleLeftClick(item.id)}
                  disabled={currentPlayer?.hasSubmitted}
                >
                  <span className="match-text">{item.text}</span>
                  {match && <span className="match-indicator">✓</span>}
                </button>
              );
            })}
          </div>

          {/* Connection lines visualization */}
          <div className="match-lines">
            {matches.map((_, idx) => (
              <div key={idx} className="match-line" />
            ))}
          </div>

          {/* Right column - Vietnamese meanings */}
          <div className="match-column right-column">
            {rightItems.map(item => {
              const match = getMatchForRight(item.id);
              return (
                <button
                  key={item.id}
                  className={`match-item ${match ? 'matched' : ''} ${
                    selectedLeft && !match ? 'selectable' : ''
                  }`}
                  onClick={() => handleRightClick(item.id)}
                  disabled={currentPlayer?.hasSubmitted || !selectedLeft}
                >
                  <span className="match-text">{item.text}</span>
                  {match && <span className="match-indicator">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Submit button */}
      <div className="submit-section">
        {currentPlayer?.hasSubmitted ? (
          <div className="submitted-message">
            <span className="icon">✅</span>
            <span>Đã gửi! Đợi người khác...</span>
          </div>
        ) : (
          <button
            className="word-match-btn primary large"
            onClick={handleSubmit}
            disabled={matches.length === 0}
          >
            📤 Gửi Đáp Án ({matches.length}/5)
          </button>
        )}
      </div>

      {/* Live scoreboard */}
      <div className="live-scoreboard">
        <h3>📊 Bảng xếp hạng</h3>
        <div className="scoreboard-list">
          {sortedPlayers.slice(0, 5).map((player, index) => (
            <div
              key={player.odinhId}
              className={`score-row ${player.odinhId === currentPlayerId ? 'current' : ''} ${
                player.hasSubmitted ? 'submitted' : ''
              }`}
            >
              <span className="rank">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
              </span>
              <span className="avatar">{player.avatar}</span>
              <span className="name">{player.displayName}</span>
              <span className="status">{player.hasSubmitted ? '✓' : '...'}</span>
              <span className="score">{player.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
