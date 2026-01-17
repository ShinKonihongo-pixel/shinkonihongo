// Picture Guess Play - Main gameplay with images and guessing
// Shows puzzles, timer, hint buttons, and answer input

import { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, Lightbulb, Send, CheckCircle, XCircle, ChevronRight, Users, Image as ImageIcon, LogOut } from 'lucide-react';
import type { PictureGuessGame, PictureGuessPlayer, PicturePuzzle, HintType } from '../../types/picture-guess';
import { HINTS, DIFFICULTY_COLORS } from '../../types/picture-guess';

interface PictureGuessPlayProps {
  game: PictureGuessGame;
  currentPlayer: PictureGuessPlayer | undefined;
  currentPuzzle: PicturePuzzle | null;
  sortedPlayers: PictureGuessPlayer[];
  isHost: boolean;
  onUseHint: (hintType: HintType) => void;
  getHintContent: (hintType: HintType) => string;
  onSubmitGuess: (guess: string) => boolean | undefined;
  onRevealAnswer: () => void;
  onNextPuzzle: () => void;
  onLeave?: () => void;
}

export function PictureGuessPlay({
  game,
  currentPlayer,
  currentPuzzle,
  sortedPlayers,
  isHost,
  onUseHint,
  getHintContent,
  onSubmitGuess,
  onRevealAnswer,
  onNextPuzzle,
  onLeave,
}: PictureGuessPlayProps) {
  const [timeLeft, setTimeLeft] = useState(currentPuzzle?.timeLimit || 30);
  const [guess, setGuess] = useState('');
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null);
  const [revealedHints, setRevealedHints] = useState<Record<HintType, string>>({} as Record<HintType, string>);
  const inputRef = useRef<HTMLInputElement>(null);

  // Timer countdown
  useEffect(() => {
    if (game.status !== 'guessing' || !currentPuzzle) {
      setTimeLeft(currentPuzzle?.timeLimit || 30);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto reveal when time runs out
          if (isHost || game.settings.mode === 'single') {
            setTimeout(() => onRevealAnswer(), 500);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [game.status, currentPuzzle, game.currentPuzzleIndex, isHost, game.settings.mode, onRevealAnswer]);

  // Reset state when puzzle changes
  useEffect(() => {
    setGuess('');
    setLastResult(null);
    setRevealedHints({} as Record<HintType, string>);
    if (game.status === 'guessing') {
      inputRef.current?.focus();
    }
  }, [game.currentPuzzleIndex, game.status]);

  const handleUseHint = useCallback((hintType: HintType) => {
    if (!currentPuzzle || currentPuzzle.hintsUsed.includes(hintType)) return;
    if (revealedHints[hintType]) return;

    const content = getHintContent(hintType);
    setRevealedHints(prev => ({ ...prev, [hintType]: content }));
    onUseHint(hintType);
  }, [currentPuzzle, revealedHints, getHintContent, onUseHint]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!guess.trim() || game.status !== 'guessing') return;
    if (currentPlayer?.status !== 'playing') return;

    const isCorrect = onSubmitGuess(guess.trim());
    setLastResult(isCorrect ? 'correct' : 'wrong');

    if (!isCorrect) {
      // Clear input on wrong answer to try again
      setGuess('');
      setTimeout(() => setLastResult(null), 1500);
    }
  }, [guess, game.status, currentPlayer, onSubmitGuess]);

  // Render starting countdown
  if (game.status === 'starting') {
    return (
      <div className="picture-guess-play starting">
        {onLeave && (
          <button className="leave-game-btn floating" onClick={onLeave} title="Rời game">
            <LogOut size={18} /> Rời
          </button>
        )}
        <div className="pg-countdown-display">
          <div className="pg-countdown-icon">
            <ImageIcon size={64} />
          </div>
          <h2>Trò chơi sắp bắt đầu!</h2>
          <div className="pg-countdown-number">3</div>
          <p>{Object.keys(game.players).length} người chơi sẵn sàng</p>
        </div>
      </div>
    );
  }

  // Player already guessed correctly
  if (currentPlayer?.status === 'guessed' && game.status === 'guessing') {
    return (
      <div className="picture-guess-play guessed">
        <div className="pg-guessed-display">
          <CheckCircle size={64} />
          <h2>Chính xác!</h2>
          <p>Đang chờ người khác trả lời...</p>
          <div className="pg-your-score">
            <span>Điểm của bạn: {currentPlayer.score}</span>
          </div>
        </div>

        {/* Show leaderboard while waiting */}
        <div className="pg-mini-leaderboard">
          <h4>Bảng xếp hạng</h4>
          {sortedPlayers.slice(0, 5).map((player, idx) => (
            <div key={player.odinhId} className={`pg-mini-player ${player.odinhId === currentPlayer?.odinhId ? 'current' : ''}`}>
              <span className="rank">#{idx + 1}</span>
              <span className="avatar">{player.avatar}</span>
              <span className="name">{player.displayName}</span>
              <span className="score">{player.score}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="picture-guess-play">
      {onLeave && (
        <button className="leave-game-btn floating" onClick={onLeave} title="Rời game">
          <LogOut size={18} /> Rời
        </button>
      )}
      {/* Status Bar */}
      <div className="pg-status-bar">
        <div className="pg-status-item">
          <Users size={18} />
          <span>{Object.keys(game.players).length} người chơi</span>
        </div>
        <div className="pg-status-item puzzle-count">
          <span>Câu {game.currentPuzzleIndex + 1}/{game.puzzles.length}</span>
        </div>
        {currentPuzzle && (
          <div className="pg-status-item difficulty">
            <span style={{ color: DIFFICULTY_COLORS[currentPuzzle.difficulty] }}>
              {currentPuzzle.difficulty === 'easy' ? '⭐' : currentPuzzle.difficulty === 'medium' ? '⭐⭐' : '⭐⭐⭐'}
            </span>
          </div>
        )}
      </div>

      {/* Main Puzzle Area */}
      {(game.status === 'showing' || game.status === 'guessing' || game.status === 'revealed') && currentPuzzle && (
        <div className="pg-puzzle-section">
          {/* Timer */}
          <div className={`pg-timer ${timeLeft <= 10 ? 'warning' : ''} ${timeLeft <= 5 ? 'danger' : ''}`}>
            <Clock size={24} />
            <span className="pg-timer-value">{timeLeft}</span>
            <div className="pg-timer-bar" style={{ width: `${(timeLeft / currentPuzzle.timeLimit) * 100}%` }} />
          </div>

          {/* Emoji Display */}
          <div className="pg-emoji-display">
            <div className="pg-emoji-container">
              {currentPuzzle.imageEmojis.split(' ').map((emoji, idx) => (
                <span key={idx} className="pg-emoji">{emoji}</span>
              ))}
            </div>
            <div className="pg-points-badge">
              {currentPuzzle.points} điểm
            </div>
          </div>

          {/* Hints Section */}
          {game.settings.allowHints && game.status === 'guessing' && (
            <div className="pg-hints-section">
              <div className="pg-hints-label">
                <Lightbulb size={18} />
                <span>Gợi ý</span>
              </div>
              <div className="pg-hints-grid">
                {(Object.keys(HINTS) as HintType[]).map(hintType => {
                  const hint = HINTS[hintType];
                  const isUsed = currentPuzzle.hintsUsed.includes(hintType);
                  const isRevealed = !!revealedHints[hintType];

                  return (
                    <button
                      key={hintType}
                      className={`pg-hint-btn ${isUsed || isRevealed ? 'used' : ''}`}
                      onClick={() => handleUseHint(hintType)}
                      disabled={isUsed || isRevealed || game.status !== 'guessing'}
                    >
                      <span className="hint-emoji">{hint.emoji}</span>
                      <span className="hint-label">{hint.label}</span>
                      {!isRevealed && <span className="hint-cost">-{hint.cost}</span>}
                      {isRevealed && (
                        <span className="hint-content">{revealedHints[hintType]}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Answer Input */}
          {game.status === 'guessing' && currentPlayer?.status === 'playing' && (
            <form className="pg-answer-form" onSubmit={handleSubmit}>
              <div className={`pg-input-wrapper ${lastResult || ''}`}>
                <input
                  ref={inputRef}
                  type="text"
                  value={guess}
                  onChange={e => setGuess(e.target.value)}
                  placeholder="Nhập từ tiếng Nhật..."
                  autoFocus
                  disabled={game.status !== 'guessing'}
                />
                <button type="submit" className="pg-submit-btn" disabled={!guess.trim()}>
                  <Send size={20} />
                </button>
              </div>
              {lastResult === 'wrong' && (
                <span className="pg-result-text wrong">
                  <XCircle size={16} /> Sai rồi, thử lại!
                </span>
              )}
            </form>
          )}

          {/* Revealed Answer */}
          {game.status === 'revealed' && (
            <div className="pg-answer-reveal">
              <div className="pg-answer-card">
                <div className="pg-answer-label">Đáp án</div>
                <div className="pg-answer-word">{currentPuzzle.word}</div>
                {currentPuzzle.reading && currentPuzzle.reading !== currentPuzzle.word && (
                  <div className="pg-answer-reading">{currentPuzzle.reading}</div>
                )}
                <div className="pg-answer-meaning">{currentPuzzle.meaning}</div>
                {currentPuzzle.sinoVietnamese && (
                  <div className="pg-answer-sino">Hán Việt: {currentPuzzle.sinoVietnamese}</div>
                )}
              </div>

              {/* Player Results */}
              <div className="pg-round-results">
                <h4>Kết quả vòng này</h4>
                <div className="pg-results-list">
                  {sortedPlayers.filter(p => p.status === 'guessed').slice(0, 5).map((player) => (
                    <div key={player.odinhId} className="pg-result-player correct">
                      <CheckCircle size={16} />
                      <span className="avatar">{player.avatar}</span>
                      <span className="name">{player.displayName}</span>
                      {player.guessTime && (
                        <span className="time">{(player.guessTime / 1000).toFixed(1)}s</span>
                      )}
                    </div>
                  ))}
                  {sortedPlayers.filter(p => p.status === 'timeout').length > 0 && (
                    <div className="pg-timeout-count">
                      <XCircle size={16} />
                      <span>{sortedPlayers.filter(p => p.status === 'timeout').length} người hết thời gian</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Next Button */}
              {(isHost || game.settings.mode === 'single') && (
                <button className="pg-next-btn" onClick={onNextPuzzle}>
                  {game.currentPuzzleIndex >= game.puzzles.length - 1 ? 'Xem Kết Quả' : 'Câu Tiếp'}
                  <ChevronRight size={18} />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Score Bar */}
      {currentPlayer && (
        <div className="pg-score-bar">
          <div className="pg-score-item">
            <span className="label">Điểm</span>
            <span className="value">{currentPlayer.score}</span>
          </div>
          <div className="pg-score-item">
            <span className="label">Đúng</span>
            <span className="value">{currentPlayer.correctGuesses}/{currentPlayer.totalGuesses}</span>
          </div>
          <div className="pg-score-item">
            <span className="label">Streak</span>
            <span className="value">{currentPlayer.streak}</span>
          </div>
        </div>
      )}

      {/* Players Sidebar */}
      <div className="pg-players-sidebar">
        <div className="pg-sidebar-header">
          <Users size={16} />
          <span>Xếp hạng</span>
        </div>
        <div className="pg-sidebar-list">
          {sortedPlayers.slice(0, 10).map((player, idx) => (
            <div
              key={player.odinhId}
              className={`pg-sidebar-player ${player.odinhId === currentPlayer?.odinhId ? 'current' : ''}`}
            >
              <span className="rank">#{idx + 1}</span>
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
