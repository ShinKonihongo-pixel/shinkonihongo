// Word Scramble Game - Professional multiplayer-style word arrangement game
// Features: Multi-level selection, auto-hints, player leaderboard, auto-fill button
// Modularized - types, constants, utils in separate files

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Home, Play, RotateCcw, Trophy, Clock, Target, ChevronRight, X, Check, Zap, Users, Award, Star, TrendingUp, Lightbulb, Plus } from 'lucide-react';
import type { Flashcard, JLPTLevel } from '../../types/flashcard';
import { useGameSounds } from '../../hooks/use-game-sounds';

// Import from modular files
import type {
  GameConfig,
  Question,
  Player,
  GameState,
  WordScramblePageProps,
} from './word-scramble/word-scramble-types';
import {
  JLPT_LEVELS,
  DEFAULT_TIME,
  DEFAULT_QUESTIONS,
  MIN_WORD_LENGTH,
  AUTO_FILL_PENALTIES,
  LEVEL_COLORS,
  ROLE_COLORS,
} from './word-scramble/word-scramble-constants';
import {
  scrambleWord,
  calculateScore,
  generateBots,
} from './word-scramble/word-scramble-utils';

// Re-export types for external use
export type { WordScramblePageProps } from './word-scramble/word-scramble-types';

export const WordScramblePage: React.FC<WordScramblePageProps> = ({
  onClose,
  flashcards,
  currentUser,
}) => {
  // Config state
  const [config, setConfig] = useState<GameConfig>({
    selectedLevels: ['N5'],
    timePerQuestion: DEFAULT_TIME,
    totalQuestions: DEFAULT_QUESTIONS,
  });

  // Initial game state
  const initialGameState: GameState = {
    phase: 'setup',
    currentQuestionIndex: 0,
    questions: [],
    score: 0,
    totalTime: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    questionStartTime: 0,
    timeRemaining: DEFAULT_TIME,
    selectedLetters: [],
    hints: { hint1Shown: false, hint2Shown: false, hint3Shown: false, hint1Content: '', hint2Content: '', hint3Content: '' },
    isCorrect: null,
    showResult: false,
    streak: 0,
    maxStreak: 0,
    players: [],
    autoFillUsed: 0,
    autoFilledPositions: [],
    isSoloMode: false,
  };

  // Game state
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { playCorrect, playWrong, playVictory } = useGameSounds();

  // Filter flashcards
  const availableFlashcards = useMemo(() => {
    return flashcards.filter(f => {
      const word = f.vocabulary || '';
      if (word.length < MIN_WORD_LENGTH) return false;
      if (config.selectedLevels.length === 0) return true;
      return config.selectedLevels.includes(f.jlptLevel as JLPTLevel);
    });
  }, [flashcards, config.selectedLevels]);

  // Count by level
  const countByLevel = useMemo(() => {
    const counts: Record<string, number> = {};
    const validCards = flashcards.filter(f => (f.vocabulary || '').length >= MIN_WORD_LENGTH);
    JLPT_LEVELS.forEach(level => {
      counts[level] = validCards.filter(f => f.jlptLevel === level).length;
    });
    return counts;
  }, [flashcards]);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer effect with auto-hints (45%, 60%, 75%)
  useEffect(() => {
    if (gameState.phase === 'playing' && !gameState.showResult) {
      timerRef.current = setInterval(() => {
        setGameState(prev => {
          const newTimeRemaining = prev.timeRemaining - 1;
          const timePercent = 1 - (newTimeRemaining / config.timePerQuestion);
          const currentQuestion = prev.questions[prev.currentQuestionIndex];

          // Auto hints at 45%, 60%, 75%
          let newHints = { ...prev.hints };
          if (currentQuestion) {
            const word = currentQuestion.word;
            const vocab = word.vocabulary || '';

            // Hint 1 at 45% time - Sino-Vietnamese/Meaning
            if (timePercent >= 0.45 && !prev.hints.hint1Shown) {
              newHints = {
                ...newHints,
                hint1Shown: true,
                hint1Content: word.sinoVietnamese || word.meaning?.split(',')[0] || 'Không có',
              };
            }
            // Hint 2 at 60% time - Word count and first letter
            if (timePercent >= 0.60 && !prev.hints.hint2Shown) {
              newHints = {
                ...newHints,
                hint2Shown: true,
                hint2Content: `Bắt đầu bằng "${vocab[0]}"`,
              };
            }
            // Hint 3 at 75% time - Last letter
            if (timePercent >= 0.75 && !prev.hints.hint3Shown) {
              newHints = {
                ...newHints,
                hint3Shown: true,
                hint3Content: `Kết thúc bằng "${vocab[vocab.length - 1]}"`,
              };
            }
          }

          if (newTimeRemaining <= 0) {
            return {
              ...prev,
              timeRemaining: 0,
              isCorrect: false,
              showResult: true,
              wrongAnswers: prev.wrongAnswers + 1,
              totalTime: prev.totalTime + config.timePerQuestion,
              streak: 0,
              hints: newHints,
            };
          }
          return { ...prev, timeRemaining: newTimeRemaining, hints: newHints };
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState.phase, gameState.showResult, config.timePerQuestion]);

  // Generate questions
  const generateQuestions = useCallback((cards: Flashcard[], count: number): Question[] => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));
    return selected.map(card => {
      const word = card.vocabulary || '';
      const { letters, positions } = scrambleWord(word);
      return { word: card, scrambledLetters: letters, originalPositions: positions };
    });
  }, []);

  // Start game (solo mode - no bots)
  const startSoloGame = useCallback(() => {
    if (availableFlashcards.length < 3) {
      alert('Cần ít nhất 3 từ vựng để chơi!');
      return;
    }

    const questions = generateQuestions(availableFlashcards, config.totalQuestions);
    const currentPlayer: Player = {
      id: currentUser?.id || 'user',
      name: currentUser?.displayName || 'Bạn',
      avatar: currentUser?.avatar || '👤',
      score: 0,
      correctAnswers: 0,
      isCurrentUser: true,
      role: currentUser?.role || 'user',
    };

    setGameState({
      ...initialGameState,
      phase: 'playing',
      questions,
      questionStartTime: Date.now(),
      timeRemaining: config.timePerQuestion,
      players: [currentPlayer],
      isSoloMode: true,
    });
  }, [availableFlashcards, config, generateQuestions, currentUser, initialGameState]);

  // Start game (with bots)
  const startMultiplayerGame = useCallback(() => {
    if (availableFlashcards.length < 3) {
      alert('Cần ít nhất 3 từ vựng để chơi!');
      return;
    }

    const questions = generateQuestions(availableFlashcards, config.totalQuestions);
    const bots = generateBots(4);
    const currentPlayer: Player = {
      id: currentUser?.id || 'user',
      name: currentUser?.displayName || 'Bạn',
      avatar: currentUser?.avatar || '👤',
      score: 0,
      correctAnswers: 0,
      isCurrentUser: true,
      role: currentUser?.role || 'user',
    };

    setGameState({
      ...initialGameState,
      phase: 'playing',
      questions,
      questionStartTime: Date.now(),
      timeRemaining: config.timePerQuestion,
      players: [currentPlayer, ...bots],
      isSoloMode: false,
    });
  }, [availableFlashcards, config, generateQuestions, currentUser, initialGameState]);

  // Handle letter click
  const handleLetterClick = useCallback((index: number) => {
    if (gameState.showResult) return;
    setGameState(prev => {
      const newSelected = [...prev.selectedLetters];
      const existingIndex = newSelected.indexOf(index);
      if (existingIndex !== -1) {
        // Don't allow removing auto-filled letters
        if (prev.autoFilledPositions.includes(existingIndex)) return prev;
        newSelected.splice(existingIndex, 1);
      } else {
        newSelected.push(index);
      }
      return { ...prev, selectedLetters: newSelected };
    });
  }, [gameState.showResult]);

  // Auto-fill one random letter
  const handleAutoFill = useCallback(() => {
    if (gameState.autoFillUsed >= 3 || gameState.showResult) return;

    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    if (!currentQuestion) return;

    const correctWord = currentQuestion.word.vocabulary || '';
    const wordLength = correctWord.length;

    // Find positions that are not yet correctly filled
    const emptyPositions: number[] = [];
    for (let i = 0; i < wordLength; i++) {
      if (gameState.selectedLetters[i] === undefined) {
        emptyPositions.push(i);
      }
    }

    if (emptyPositions.length === 0) return;

    // Pick a random empty position
    const randomPos = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
    const correctLetter = correctWord[randomPos];

    // Find the index in scrambled letters that has this correct letter and is not yet selected
    const scrambledIndex = currentQuestion.scrambledLetters.findIndex((letter, idx) =>
      letter === correctLetter && !gameState.selectedLetters.includes(idx)
    );

    if (scrambledIndex === -1) return;

    // Insert the letter at the correct position
    setGameState(prev => {
      const newSelected = [...prev.selectedLetters];
      // Make sure we have enough slots
      while (newSelected.length < randomPos) {
        newSelected.push(-1); // placeholder
      }
      newSelected[randomPos] = scrambledIndex;

      return {
        ...prev,
        selectedLetters: newSelected,
        autoFillUsed: prev.autoFillUsed + 1,
        autoFilledPositions: [...prev.autoFilledPositions, randomPos],
      };
    });
  }, [gameState]);

  // Calculate current penalty
  const getCurrentPenalty = useCallback(() => {
    let totalPenalty = 0;
    for (let i = 0; i < gameState.autoFillUsed; i++) {
      totalPenalty += AUTO_FILL_PENALTIES[i];
    }
    return totalPenalty;
  }, [gameState.autoFillUsed]);

  // Check answer
  const checkAnswer = useCallback(() => {
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    if (!currentQuestion) return;

    const correctWord = currentQuestion.word.vocabulary || '';
    const userWord = gameState.selectedLetters
      .map(i => i >= 0 ? currentQuestion.scrambledLetters[i] : '')
      .join('');

    const isCorrect = userWord === correctWord;
    const timeUsed = config.timePerQuestion - gameState.timeRemaining;
    const newStreak = isCorrect ? gameState.streak + 1 : 0;
    const penalty = getCurrentPenalty();
    const scoreGained = isCorrect ? calculateScore(gameState.timeRemaining, config.timePerQuestion, gameState.streak, penalty) : 0;

    if (isCorrect) playCorrect();
    else playWrong();

    // Update bot scores (only if not solo mode)
    const updatedPlayers = gameState.players.map(p => {
      if (p.isCurrentUser) {
        return {
          ...p,
          score: p.score + scoreGained,
          correctAnswers: isCorrect ? p.correctAnswers + 1 : p.correctAnswers,
        };
      }
      if (gameState.isSoloMode) return p;
      // Bots answer randomly
      const botCorrect = Math.random() > 0.4;
      const botScore = botCorrect ? Math.floor(Math.random() * 150) + 50 : 0;
      return {
        ...p,
        score: p.score + botScore,
        correctAnswers: botCorrect ? p.correctAnswers + 1 : p.correctAnswers,
      };
    });

    setGameState(prev => ({
      ...prev,
      isCorrect,
      showResult: true,
      score: prev.score + scoreGained,
      totalTime: prev.totalTime + timeUsed,
      correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
      wrongAnswers: isCorrect ? prev.wrongAnswers : prev.wrongAnswers + 1,
      streak: newStreak,
      maxStreak: Math.max(prev.maxStreak, newStreak),
      players: updatedPlayers.sort((a, b) => b.score - a.score),
    }));
  }, [gameState, config.timePerQuestion, playCorrect, playWrong, getCurrentPenalty]);

  // Next question
  const nextQuestion = useCallback(() => {
    const nextIndex = gameState.currentQuestionIndex + 1;
    if (nextIndex >= gameState.questions.length) {
      playVictory();
      setGameState(prev => ({ ...prev, phase: 'result' }));
      return;
    }
    setGameState(prev => ({
      ...prev,
      currentQuestionIndex: nextIndex,
      questionStartTime: Date.now(),
      timeRemaining: config.timePerQuestion,
      selectedLetters: [],
      hints: { hint1Shown: false, hint2Shown: false, hint3Shown: false, hint1Content: '', hint2Content: '', hint3Content: '' },
      isCorrect: null,
      showResult: false,
      autoFillUsed: 0,
      autoFilledPositions: [],
    }));
  }, [gameState, config.timePerQuestion, playVictory]);

  // Reset game
  const resetGame = useCallback(() => {
    setGameState(initialGameState);
  }, [initialGameState]);

  // Toggle level selection
  const toggleLevel = (level: JLPTLevel) => {
    setConfig(prev => {
      const newLevels = prev.selectedLevels.includes(level)
        ? prev.selectedLevels.filter(l => l !== level)
        : [...prev.selectedLevels, level];
      return { ...prev, selectedLevels: newLevels };
    });
  };

  const currentQuestion = gameState.questions[gameState.currentQuestionIndex];

  // Get player name color based on role
  const getPlayerNameColor = (player: Player) => {
    if (player.role && player.role !== 'user') {
      return ROLE_COLORS[player.role];
    }
    return '#ffffff';
  };

  // Render setup
  const renderSetup = () => (
    <div className="ws-setup">
      <div className="ws-setup-card">
        <div className="ws-setup-header">
          <div className="ws-logo">
            <span className="ws-logo-icon">🔀</span>
            <h1>Sắp Xếp Từ</h1>
          </div>
          <p className="ws-subtitle">Ghép các chữ cái thành từ vựng đúng</p>
        </div>

        <div className="ws-setup-body">
          {/* Level Selection */}
          <div className="ws-section">
            <div className="ws-section-header">
              <Target size={20} />
              <h3>Chọn cấp độ</h3>
              <span className="ws-badge">{config.selectedLevels.length} đã chọn</span>
            </div>
            <div className="ws-levels">
              {JLPT_LEVELS.map(level => {
                const isSelected = config.selectedLevels.includes(level);
                const colors = LEVEL_COLORS[level];
                return (
                  <button
                    key={level}
                    className={`ws-level-chip ${isSelected ? 'selected' : ''}`}
                    style={{
                      '--level-bg': colors.bg,
                      '--level-border': colors.border,
                      '--level-text': colors.text,
                    } as React.CSSProperties}
                    onClick={() => toggleLevel(level)}
                    disabled={countByLevel[level] === 0}
                  >
                    <span className="level-tag">{level}</span>
                    <span className="level-count">{countByLevel[level]}</span>
                    {isSelected && <Check size={16} className="check-icon" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Setting */}
          <div className="ws-section">
            <div className="ws-section-header">
              <Clock size={20} />
              <h3>Thời gian</h3>
              <span className="ws-time-display">{config.timePerQuestion}s</span>
            </div>
            <div className="ws-time-options">
              {[15, 20, 30, 45, 60].map(time => (
                <button
                  key={time}
                  className={`ws-time-btn ${config.timePerQuestion === time ? 'active' : ''}`}
                  onClick={() => setConfig(prev => ({ ...prev, timePerQuestion: time }))}
                >
                  {time}s
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div className="ws-section">
            <div className="ws-section-header">
              <Zap size={20} />
              <h3>Số câu hỏi</h3>
            </div>
            <div className="ws-question-options">
              {[5, 10, 15, 20].map(count => (
                <button
                  key={count}
                  className={`ws-count-btn ${config.totalQuestions === count ? 'active' : ''}`}
                  onClick={() => setConfig(prev => ({ ...prev, totalQuestions: count }))}
                >
                  <span className="count-num">{count}</span>
                  <span className="count-label">câu</span>
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="ws-info-box">
            <div className="ws-info-item">
              <Star size={16} />
              <span>Có {availableFlashcards.length} từ vựng phù hợp</span>
            </div>
            <div className="ws-info-item">
              <TrendingUp size={16} />
              <span>Gợi ý xuất hiện: 45%, 60%, 75% thời gian</span>
            </div>
            <div className="ws-info-item">
              <Lightbulb size={16} />
              <span>Nút gợi ý: -20%, -40%, -60% điểm</span>
            </div>
          </div>
        </div>

        <div className="ws-setup-footer">
          <button className="ws-btn ws-btn-ghost" onClick={onClose}>
            <Home size={18} /> Thoát
          </button>
          <button
            className="ws-btn ws-btn-secondary"
            onClick={startSoloGame}
            disabled={availableFlashcards.length < 3 || config.selectedLevels.length === 0}
          >
            <Play size={18} /> Chơi ngay
          </button>
          <button
            className="ws-btn ws-btn-primary"
            onClick={startMultiplayerGame}
            disabled={availableFlashcards.length < 3 || config.selectedLevels.length === 0}
          >
            <Plus size={18} /> Tạo phòng
          </button>
        </div>
      </div>
    </div>
  );

  // Render playing
  const renderPlaying = () => {
    if (!currentQuestion) return null;
    const word = currentQuestion.word;
    const correctWord = word.vocabulary || '';
    const timerPercent = (gameState.timeRemaining / config.timePerQuestion) * 100;
    const timerColor = timerPercent > 50 ? '#10B981' : timerPercent > 25 ? '#F59E0B' : '#EF4444';

    // Get current user rank
    const userRank = gameState.players.findIndex(p => p.isCurrentUser) + 1;

    return (
      <div className="ws-game-layout">
        {/* Left Panel - Hints & Leaderboard */}
        <div className="ws-left-panel">
          {/* Hints */}
          <div className="ws-hints-card">
            <div className="ws-hints-header">
              <Zap size={18} />
              <h3>Gợi ý</h3>
            </div>
            <div className="ws-hints-list">
              <div className={`ws-hint-item ${gameState.hints.hint1Shown ? 'revealed' : 'locked'}`}>
                <div className="hint-number">1</div>
                <div className="hint-content">
                  {gameState.hints.hint1Shown ? (
                    <>
                      <span className="hint-label">Hán Việt / Nghĩa</span>
                      <span className="hint-value">{gameState.hints.hint1Content}</span>
                    </>
                  ) : (
                    <span className="hint-locked">45% thời gian</span>
                  )}
                </div>
              </div>
              <div className={`ws-hint-item ${gameState.hints.hint2Shown ? 'revealed' : 'locked'}`}>
                <div className="hint-number">2</div>
                <div className="hint-content">
                  {gameState.hints.hint2Shown ? (
                    <>
                      <span className="hint-label">Chữ đầu</span>
                      <span className="hint-value">{gameState.hints.hint2Content}</span>
                    </>
                  ) : (
                    <span className="hint-locked">60% thời gian</span>
                  )}
                </div>
              </div>
              <div className={`ws-hint-item ${gameState.hints.hint3Shown ? 'revealed' : 'locked'}`}>
                <div className="hint-number">3</div>
                <div className="hint-content">
                  {gameState.hints.hint3Shown ? (
                    <>
                      <span className="hint-label">Chữ cuối</span>
                      <span className="hint-value">{gameState.hints.hint3Content}</span>
                    </>
                  ) : (
                    <span className="hint-locked">75% thời gian</span>
                  )}
                </div>
              </div>
            </div>
            {/* Streak indicator */}
            {gameState.streak > 0 && (
              <div className="ws-streak">
                🔥 Streak: {gameState.streak}
              </div>
            )}
          </div>

          {/* Leaderboard (only show if not solo mode) */}
          {!gameState.isSoloMode && (
            <div className="ws-leaderboard-card">
              <div className="ws-leaderboard-header">
                <Users size={18} />
                <h3>Bảng xếp hạng</h3>
              </div>
              <div className="ws-leaderboard-list">
                {gameState.players.map((player, index) => (
                  <div
                    key={player.id}
                    className={`ws-player-row ${player.isCurrentUser ? 'current-user' : ''} ${index < 3 ? 'top-3' : ''}`}
                  >
                    <div className="player-rank">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </div>
                    <div className="player-avatar">{player.avatar}</div>
                    <div className="player-info">
                      <span className="player-name" style={{ color: getPlayerNameColor(player) }}>
                        {player.name}
                      </span>
                      <span className="player-correct">{player.correctAnswers} đúng</span>
                    </div>
                    <div className="player-score">{player.score}</div>
                  </div>
                ))}
              </div>
              {/* Current rank */}
              <div className="ws-your-rank">
                <Award size={16} />
                <span>Vị trí của bạn: #{userRank}</span>
              </div>
            </div>
          )}
        </div>

        {/* Center - Game Area */}
        <div className="ws-center-panel">
          {/* Top bar */}
          <div className="ws-game-topbar">
            <div className="ws-progress-info">
              <span className="ws-q-num">Câu {gameState.currentQuestionIndex + 1}/{gameState.questions.length}</span>
              <div className="ws-level-badge" style={{ background: LEVEL_COLORS[word.jlptLevel as JLPTLevel]?.bg, color: LEVEL_COLORS[word.jlptLevel as JLPTLevel]?.text }}>
                {word.jlptLevel}
              </div>
            </div>
            <button className="ws-close-btn" onClick={resetGame}>
              <X size={20} />
            </button>
          </div>

          {/* Timer */}
          <div className="ws-timer-container">
            <div className="ws-timer-bar">
              <div className="ws-timer-fill" style={{ width: `${timerPercent}%`, background: timerColor }} />
            </div>
            <div className="ws-timer-label" style={{ color: timerColor }}>
              <Clock size={14} />
              <span>{gameState.timeRemaining}s</span>
            </div>
          </div>

          {/* Question Card - Only show word count and scrambled letters */}
          <div className="ws-question-area">
            {/* Word count info */}
            <div className="ws-word-info">
              <span className="ws-word-count">{correctWord.length} chữ cái</span>
            </div>

            {/* Scrambled letters - 3x bigger */}
            <div className="ws-letters-container-big">
              {currentQuestion.scrambledLetters.map((letter, index) => {
                const isSelected = gameState.selectedLetters.includes(index);
                return (
                  <button
                    key={index}
                    className={`ws-letter-big ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleLetterClick(index)}
                    disabled={gameState.showResult}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>

            {/* Answer slots - closer to result */}
            <div className="ws-answer-section">
              <div className="ws-slots-container">
                {correctWord.split('').map((_, index) => {
                  const selectedLetterIndex = gameState.selectedLetters[index];
                  const selectedLetter = selectedLetterIndex !== undefined && selectedLetterIndex >= 0
                    ? currentQuestion.scrambledLetters[selectedLetterIndex]
                    : null;
                  const correctLetter = correctWord[index];
                  const isCorrectSlot = gameState.showResult && selectedLetter === correctLetter;
                  const isWrongSlot = gameState.showResult && selectedLetter && selectedLetter !== correctLetter;
                  const isAutoFilled = gameState.autoFilledPositions.includes(index);

                  return (
                    <div
                      key={index}
                      className={`ws-slot ${selectedLetter ? 'filled' : ''} ${isCorrectSlot ? 'correct' : ''} ${isWrongSlot ? 'wrong' : ''} ${isAutoFilled ? 'auto-filled' : ''}`}
                      onClick={() => {
                        if (selectedLetter && !gameState.showResult && !isAutoFilled) {
                          setGameState(prev => ({
                            ...prev,
                            selectedLetters: prev.selectedLetters.filter((_, i) => i !== index),
                          }));
                        }
                      }}
                    >
                      {gameState.showResult && !selectedLetter ? (
                        <span className="slot-correct">{correctLetter}</span>
                      ) : (
                        selectedLetter || ''
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Auto-fill button */}
              {!gameState.showResult && (
                <div className="ws-autofill-section">
                  <button
                    className="ws-autofill-btn"
                    onClick={handleAutoFill}
                    disabled={gameState.autoFillUsed >= 3}
                  >
                    <Lightbulb size={18} />
                    <span>Điền tự động</span>
                    <span className="autofill-count">({3 - gameState.autoFillUsed}/3)</span>
                  </button>
                  {gameState.autoFillUsed > 0 && (
                    <span className="ws-penalty-info">
                      -{Math.round(getCurrentPenalty() * 100)}% điểm
                    </span>
                  )}
                </div>
              )}

              {/* Result display - close to answer */}
              {gameState.showResult && (
                <div className="ws-result-inline">
                  <div className={`ws-feedback ${gameState.isCorrect ? 'correct' : 'wrong'}`}>
                    {gameState.isCorrect ? (
                      <><Check size={18} /> Chính xác!</>
                    ) : (
                      <><X size={18} /> Sai! Đáp án: <strong>{correctWord}</strong></>
                    )}
                  </div>
                  <button className="ws-btn ws-btn-next" onClick={nextQuestion}>
                    {gameState.currentQuestionIndex < gameState.questions.length - 1 ? 'Câu tiếp' : 'Xem kết quả'}
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}

              {/* Check button */}
              {!gameState.showResult && (
                <button
                  className="ws-btn ws-btn-check"
                  onClick={checkAnswer}
                  disabled={gameState.selectedLetters.filter(l => l >= 0).length !== correctWord.length}
                >
                  <Check size={20} /> Kiểm tra
                </button>
              )}
            </div>
          </div>

          {/* Footer score display */}
          <div className="ws-game-footer">
            <div className="ws-score-display">
              <Trophy size={20} />
              <span className="score-value">{gameState.score}</span>
              <span className="score-label">điểm</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render result
  const renderResult = () => {
    const accuracy = gameState.questions.length > 0
      ? Math.round((gameState.correctAnswers / gameState.questions.length) * 100)
      : 0;
    const avgTime = gameState.questions.length > 0
      ? Math.round(gameState.totalTime / gameState.questions.length)
      : 0;
    const userRank = gameState.players.findIndex(p => p.isCurrentUser) + 1;
    const currentPlayer = gameState.players.find(p => p.isCurrentUser);

    return (
      <div className="ws-result-screen">
        <div className="ws-result-card">
          <div className="ws-result-header">
            <div className="ws-result-trophy">
              {gameState.isSoloMode ? '🎮' : userRank === 1 ? '🏆' : userRank === 2 ? '🥈' : userRank === 3 ? '🥉' : '🎮'}
            </div>
            <h1>Kết quả</h1>
            {!gameState.isSoloMode && (
              <p className="ws-rank-text">Hạng #{userRank} / {gameState.players.length}</p>
            )}
          </div>

          <div className="ws-result-stats">
            <div className="ws-stat-card primary">
              <div className="stat-icon">🎯</div>
              <div className="stat-value">{currentPlayer?.score || 0}</div>
              <div className="stat-label">Tổng điểm</div>
            </div>
            <div className="ws-stat-card">
              <div className="stat-icon">✓</div>
              <div className="stat-value">{gameState.correctAnswers}/{gameState.questions.length}</div>
              <div className="stat-label">Số câu đúng</div>
            </div>
            <div className="ws-stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-value">{accuracy}%</div>
              <div className="stat-label">Độ chính xác</div>
            </div>
            <div className="ws-stat-card">
              <div className="stat-icon">⚡</div>
              <div className="stat-value">{avgTime}s</div>
              <div className="stat-label">TB/câu</div>
            </div>
            <div className="ws-stat-card">
              <div className="stat-icon">🔥</div>
              <div className="stat-value">{gameState.maxStreak}</div>
              <div className="stat-label">Streak cao nhất</div>
            </div>
          </div>

          {/* Final leaderboard (only if not solo mode) */}
          {!gameState.isSoloMode && (
            <div className="ws-final-leaderboard">
              <h3><Trophy size={18} /> Bảng xếp hạng cuối</h3>
              <div className="ws-final-list">
                {gameState.players.slice(0, 5).map((player, index) => (
                  <div key={player.id} className={`ws-final-row ${player.isCurrentUser ? 'you' : ''}`}>
                    <span className="final-rank">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</span>
                    <span className="final-avatar">{player.avatar}</span>
                    <span className="final-name" style={{ color: player.isCurrentUser ? '#1f2937' : getPlayerNameColor(player) === '#ffffff' ? '#1f2937' : getPlayerNameColor(player) }}>
                      {player.name}
                    </span>
                    <span className="final-score">{player.score} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="ws-result-actions">
            <button className="ws-btn ws-btn-ghost" onClick={onClose}>
              <Home size={18} /> Trang chủ
            </button>
            <button className="ws-btn ws-btn-primary" onClick={resetGame}>
              <RotateCcw size={18} /> Chơi lại
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="ws-page">
      {gameState.phase === 'setup' && renderSetup()}
      {gameState.phase === 'playing' && renderPlaying()}
      {gameState.phase === 'result' && renderResult()}

      <style>{`
        .ws-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          font-family: system-ui, -apple-system, sans-serif;
        }

        /* ============ SETUP SCREEN ============ */
        .ws-setup {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .ws-setup-card {
          width: 100%;
          max-width: 520px;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
          overflow: hidden;
        }

        .ws-setup-header {
          padding: 2rem 2rem 1.5rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          text-align: center;
        }

        .ws-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .ws-logo-icon {
          font-size: 2.5rem;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .ws-logo h1 {
          font-size: 1.75rem;
          font-weight: 800;
          color: white;
          margin: 0;
        }

        .ws-subtitle {
          color: rgba(255,255,255,0.9);
          margin: 0.5rem 0 0;
          font-size: 0.95rem;
        }

        .ws-setup-body {
          padding: 1.5rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .ws-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .ws-section-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #374151;
        }

        .ws-section-header h3 {
          font-size: 0.95rem;
          font-weight: 600;
          margin: 0;
          flex: 1;
        }

        .ws-badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          background: #10b981;
          color: white;
          border-radius: 999px;
          font-weight: 600;
        }

        .ws-time-display {
          font-size: 0.9rem;
          font-weight: 700;
          color: #10b981;
        }

        /* Level chips */
        .ws-levels {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .ws-level-chip {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1rem;
          border: 2px solid var(--level-border);
          background: white;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .ws-level-chip:hover:not(:disabled) {
          background: var(--level-bg);
        }

        .ws-level-chip.selected {
          background: var(--level-bg);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .ws-level-chip:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .ws-level-chip .level-tag {
          font-weight: 700;
          color: var(--level-text);
        }

        .ws-level-chip .level-count {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .ws-level-chip .check-icon {
          color: var(--level-text);
        }

        /* Time options */
        .ws-time-options {
          display: flex;
          gap: 0.5rem;
        }

        .ws-time-btn {
          flex: 1;
          padding: 0.6rem;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 10px;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ws-time-btn:hover {
          border-color: #10b981;
          color: #10b981;
        }

        .ws-time-btn.active {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }

        /* Question count */
        .ws-question-options {
          display: flex;
          gap: 0.5rem;
        }

        .ws-count-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.75rem 0.5rem;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ws-count-btn:hover {
          border-color: #10b981;
        }

        .ws-count-btn.active {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-color: transparent;
        }

        .ws-count-btn .count-num {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
        }

        .ws-count-btn .count-label {
          font-size: 0.7rem;
          color: #6b7280;
        }

        .ws-count-btn.active .count-num,
        .ws-count-btn.active .count-label {
          color: white;
        }

        /* Info box */
        .ws-info-box {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1rem;
          background: #f3f4f6;
          border-radius: 12px;
        }

        .ws-info-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #6b7280;
        }

        .ws-info-item svg {
          color: #10b981;
        }

        /* Setup footer */
        .ws-setup-footer {
          display: flex;
          gap: 0.75rem;
          padding: 1.5rem 2rem;
          border-top: 1px solid #e5e7eb;
        }

        /* ============ BUTTONS ============ */
        .ws-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.85rem 1.25rem;
          border: none;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ws-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ws-btn-primary {
          flex: 1;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          box-shadow: 0 4px 14px rgba(16,185,129,0.4);
        }

        .ws-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16,185,129,0.5);
        }

        .ws-btn-secondary {
          flex: 1;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          box-shadow: 0 4px 14px rgba(59,130,246,0.4);
        }

        .ws-btn-secondary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59,130,246,0.5);
        }

        .ws-btn-ghost {
          background: transparent;
          color: #6b7280;
          border: 2px solid #e5e7eb;
        }

        .ws-btn-ghost:hover {
          background: #f3f4f6;
        }

        .ws-btn-check {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          font-size: 1.1rem;
          box-shadow: 0 4px 14px rgba(16,185,129,0.4);
        }

        .ws-btn-next {
          padding: 0.85rem 1.5rem;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        /* ============ GAME LAYOUT ============ */
        .ws-game-layout {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 1rem;
          min-height: 100vh;
          padding: 1rem;
        }

        @media (max-width: 1024px) {
          .ws-game-layout {
            grid-template-columns: 1fr;
          }
          .ws-left-panel {
            display: none;
          }
        }

        /* Left Panel - Hints & Leaderboard */
        .ws-left-panel {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .ws-hints-card, .ws-leaderboard-card {
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 1.25rem;
          color: white;
        }

        .ws-hints-header, .ws-leaderboard-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .ws-hints-header h3, .ws-leaderboard-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .ws-hints-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .ws-hint-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.85rem;
          background: rgba(0,0,0,0.2);
          border-radius: 10px;
          transition: all 0.3s;
        }

        .ws-hint-item.revealed {
          background: rgba(16,185,129,0.2);
          border: 1px solid rgba(16,185,129,0.3);
        }

        .ws-hint-item.locked {
          opacity: 0.6;
        }

        .hint-number {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.95rem;
        }

        .hint-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .hint-label {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.6);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .hint-value {
          font-weight: 600;
          font-size: 1rem;
        }

        .hint-locked {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.5);
        }

        .ws-streak {
          margin-top: 1rem;
          padding: 0.75rem;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border-radius: 10px;
          text-align: center;
          font-weight: 700;
        }

        /* Leaderboard */
        .ws-leaderboard-list {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .ws-player-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: rgba(0,0,0,0.2);
          border-radius: 12px;
          transition: all 0.2s;
        }

        .ws-player-row.current-user {
          background: rgba(16,185,129,0.2);
          border: 1px solid rgba(16,185,129,0.3);
        }

        .ws-player-row.top-3 {
          background: rgba(251,191,36,0.1);
        }

        .player-rank {
          width: 32px;
          text-align: center;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .player-avatar {
          font-size: 1.5rem;
        }

        .player-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .player-name {
          font-weight: 600;
          font-size: 1rem;
        }

        .player-correct {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.6);
        }

        .player-score {
          font-weight: 700;
          font-size: 1.1rem;
          color: #fbbf24;
        }

        .ws-your-rank {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1rem;
          padding: 0.85rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 10px;
          font-weight: 600;
        }

        /* Center Panel */
        .ws-center-panel {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .ws-game-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
        }

        .ws-progress-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .ws-q-num {
          color: white;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .ws-level-badge {
          padding: 0.3rem 0.75rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 700;
        }

        .ws-close-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.1);
          border: none;
          border-radius: 10px;
          color: white;
          cursor: pointer;
        }

        .ws-close-btn:hover {
          background: rgba(239,68,68,0.3);
        }

        /* Timer */
        .ws-timer-container {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .ws-timer-bar {
          flex: 1;
          height: 10px;
          background: rgba(255,255,255,0.1);
          border-radius: 5px;
          overflow: hidden;
        }

        .ws-timer-fill {
          height: 100%;
          border-radius: 5px;
          transition: width 1s linear, background 0.3s;
        }

        .ws-timer-label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-weight: 700;
          font-size: 1.1rem;
          min-width: 60px;
        }

        /* Question Area */
        .ws-question-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
        }

        .ws-word-info {
          text-align: center;
        }

        .ws-word-count {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: #f3f4f6;
          border-radius: 999px;
          font-weight: 600;
          color: #6b7280;
          font-size: 1rem;
        }

        /* Big scrambled letters - 3x bigger */
        .ws-letters-container-big {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          padding: 1rem 0;
        }

        .ws-letter-big {
          width: 72px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #10b981;
          background: white;
          border-radius: 16px;
          font-size: 2.5rem;
          font-weight: 700;
          color: #1f2937;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .ws-letter-big:hover:not(:disabled):not(.selected) {
          background: #ecfdf5;
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(16,185,129,0.3);
        }

        .ws-letter-big.selected {
          opacity: 0.3;
          border-style: dashed;
          transform: scale(0.95);
        }

        .ws-letter-big:disabled {
          cursor: not-allowed;
        }

        /* Answer section */
        .ws-answer-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: auto;
        }

        /* Slots */
        .ws-slots-container {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          padding: 1rem 0;
        }

        .ws-slot {
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
        }

        .ws-slot.filled {
          border-style: solid;
          border-color: #10b981;
          background: #ecfdf5;
        }

        .ws-slot.auto-filled {
          border-color: #f59e0b;
          background: #fef3c7;
        }

        .ws-slot.correct {
          border-color: #10b981;
          background: #d1fae5;
        }

        .ws-slot.wrong {
          border-color: #ef4444;
          background: #fee2e2;
        }

        .ws-slot .slot-correct {
          color: #10b981;
        }

        /* Auto-fill section */
        .ws-autofill-section {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .ws-autofill-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border: none;
          border-radius: 10px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ws-autofill-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(245,158,11,0.4);
        }

        .ws-autofill-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .autofill-count {
          opacity: 0.8;
          font-size: 0.85rem;
        }

        .ws-penalty-info {
          color: #ef4444;
          font-weight: 600;
          font-size: 0.9rem;
        }

        /* Result inline */
        .ws-result-inline {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .ws-feedback {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .ws-feedback.correct {
          background: #d1fae5;
          color: #059669;
        }

        .ws-feedback.wrong {
          background: #fee2e2;
          color: #dc2626;
        }

        /* Game footer */
        .ws-game-footer {
          display: flex;
          justify-content: center;
          padding: 1rem;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
        }

        .ws-score-display {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #fbbf24;
        }

        .ws-score-display .score-value {
          font-size: 2rem;
          font-weight: 800;
        }

        .ws-score-display .score-label {
          font-size: 1rem;
          opacity: 0.8;
        }

        /* ============ RESULT SCREEN ============ */
        .ws-result-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .ws-result-card {
          width: 100%;
          max-width: 520px;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }

        .ws-result-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .ws-result-trophy {
          font-size: 4rem;
          margin-bottom: 0.5rem;
        }

        .ws-result-header h1 {
          font-size: 1.75rem;
          font-weight: 800;
          color: #1f2937;
          margin: 0;
        }

        .ws-rank-text {
          font-size: 1.1rem;
          color: #10b981;
          font-weight: 600;
          margin: 0.5rem 0 0;
        }

        .ws-result-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .ws-stat-card {
          padding: 1rem 0.5rem;
          background: #f3f4f6;
          border-radius: 12px;
          text-align: center;
        }

        .ws-stat-card.primary {
          grid-column: span 3;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .ws-stat-card.primary .stat-label {
          color: rgba(255,255,255,0.8);
        }

        .stat-icon {
          font-size: 1.25rem;
          margin-bottom: 0.25rem;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: #1f2937;
        }

        .ws-stat-card.primary .stat-value {
          color: white;
          font-size: 2rem;
        }

        .stat-label {
          font-size: 0.7rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Final leaderboard */
        .ws-final-leaderboard {
          margin-bottom: 1.5rem;
        }

        .ws-final-leaderboard h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          color: #374151;
          margin: 0 0 0.75rem;
        }

        .ws-final-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .ws-final-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.7rem 1rem;
          background: #f3f4f6;
          border-radius: 10px;
        }

        .ws-final-row.you {
          background: #ecfdf5;
          border: 2px solid #10b981;
        }

        .final-rank {
          width: 32px;
          font-weight: 700;
        }

        .final-avatar {
          font-size: 1.25rem;
        }

        .final-name {
          flex: 1;
          font-weight: 600;
        }

        .final-score {
          font-weight: 700;
          color: #10b981;
        }

        .ws-result-actions {
          display: flex;
          gap: 1rem;
        }

        .ws-result-actions .ws-btn {
          flex: 1;
        }

        /* ============ RESPONSIVE ============ */
        @media (max-width: 640px) {
          .ws-setup-card {
            border-radius: 16px;
          }

          .ws-setup-header {
            padding: 1.5rem;
          }

          .ws-setup-body {
            padding: 1rem 1.5rem;
          }

          .ws-setup-footer {
            flex-direction: column;
          }

          .ws-setup-footer .ws-btn {
            flex: none;
            width: 100%;
          }

          .ws-letter-big {
            width: 56px;
            height: 56px;
            font-size: 1.75rem;
          }

          .ws-slot {
            width: 44px;
            height: 44px;
            font-size: 1.25rem;
          }

          .ws-result-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .ws-stat-card.primary {
            grid-column: span 2;
          }
        }
      `}</style>
    </div>
  );
};
