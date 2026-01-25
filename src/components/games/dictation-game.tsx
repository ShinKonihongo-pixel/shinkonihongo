// Dictation Game - Listen and write vocabulary
// The word is read 3 times, user must type the answer before time runs out

import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, Play, RotateCcw, CheckCircle, XCircle, Trophy, Settings } from 'lucide-react';
import type { Flashcard } from '../../types/flashcard';

interface DictationGameProps {
  cards: Flashcard[];
  onComplete?: (results: DictationResult[]) => void;
  onExit?: () => void;
}

interface DictationResult {
  cardId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

type GameState = 'setup' | 'playing' | 'result';

// Time between each reading (in ms)
const READING_INTERVAL = 2000;
// Extra time after all readings (in ms)
const EXTRA_TIME = 3000;

export function DictationGame({ cards, onComplete, onExit }: DictationGameProps) {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [questionCount, setQuestionCount] = useState(10);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gameCards, setGameCards] = useState<Flashcard[]>([]);
  const [results, setResults] = useState<DictationResult[]>([]);

  // Current question state
  const [userAnswer, setUserAnswer] = useState('');
  const [readingCount, setReadingCount] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const readingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTime = useRef<number>(0);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Text-to-speech
  const speak = useCallback((text: string, onEnd?: () => void) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.8;

      // Try to find a Japanese voice
      const voices = window.speechSynthesis.getVoices();
      const jpVoice = voices.find(v => v.lang.startsWith('ja'));
      if (jpVoice) utterance.voice = jpVoice;

      if (onEnd) utterance.onend = onEnd;
      speechSynthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (readingTimerRef.current) clearTimeout(readingTimerRef.current);
      window.speechSynthesis.cancel();
    };
  }, []);

  // Start game
  const startGame = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(questionCount, cards.length));
    setGameCards(selected);
    setCurrentIndex(0);
    setResults([]);
    setGameState('playing');
  };

  // Start a new question
  const startQuestion = useCallback(() => {
    setUserAnswer('');
    setReadingCount(0);
    setShowAnswer(false);
    questionStartTime.current = Date.now();

    // Calculate total time: 3 readings + intervals + extra time
    const totalTime = (READING_INTERVAL * 3) + EXTRA_TIME;
    setTimeLeft(Math.ceil(totalTime / 1000));

    // Start countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - auto submit
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start reading sequence
    setIsReading(true);
    startReadingSequence();

    // Focus input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Reading sequence: read the word 3 times
  const startReadingSequence = useCallback(() => {
    const currentCard = gameCards[currentIndex];
    if (!currentCard) return;

    let count = 0;
    const readNext = () => {
      if (count >= 3) {
        setIsReading(false);
        return;
      }

      count++;
      setReadingCount(count);
      speak(currentCard.vocabulary, () => {
        readingTimerRef.current = setTimeout(readNext, READING_INTERVAL);
      });
    };

    readNext();
  }, [gameCards, currentIndex, speak]);

  // Effect to start question when entering playing state or moving to next
  useEffect(() => {
    if (gameState === 'playing' && gameCards.length > 0 && currentIndex < gameCards.length) {
      startQuestion();
    }
  }, [gameState, gameCards, currentIndex, startQuestion]);

  // Handle time up
  const handleTimeUp = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (readingTimerRef.current) clearTimeout(readingTimerRef.current);
    window.speechSynthesis.cancel();

    const currentCard = gameCards[currentIndex];
    if (!currentCard) return;

    const timeSpent = Date.now() - questionStartTime.current;
    const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(currentCard.vocabulary);

    setResults(prev => [...prev, {
      cardId: currentCard.id,
      userAnswer: userAnswer || '(không trả lời)',
      correctAnswer: currentCard.vocabulary,
      isCorrect,
      timeSpent,
    }]);

    setShowAnswer(true);

    // Move to next after a short delay
    setTimeout(() => {
      if (currentIndex < gameCards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setGameState('result');
      }
    }, 2000);
  }, [gameCards, currentIndex, userAnswer]);

  // Handle manual submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showAnswer || !userAnswer.trim()) return;

    if (timerRef.current) clearInterval(timerRef.current);
    if (readingTimerRef.current) clearTimeout(readingTimerRef.current);
    window.speechSynthesis.cancel();

    const currentCard = gameCards[currentIndex];
    if (!currentCard) return;

    const timeSpent = Date.now() - questionStartTime.current;
    const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(currentCard.vocabulary);

    setResults(prev => [...prev, {
      cardId: currentCard.id,
      userAnswer,
      correctAnswer: currentCard.vocabulary,
      isCorrect,
      timeSpent,
    }]);

    setShowAnswer(true);

    // Move to next after a short delay
    setTimeout(() => {
      if (currentIndex < gameCards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setGameState('result');
      }
    }, 1500);
  };

  // Normalize answer for comparison (remove spaces, convert to hiragana for comparison)
  const normalizeAnswer = (text: string): string => {
    return text.trim().toLowerCase().replace(/\s+/g, '');
  };

  // Replay audio manually
  const replayAudio = () => {
    const currentCard = gameCards[currentIndex];
    if (currentCard) {
      speak(currentCard.vocabulary);
    }
  };

  // Calculate stats
  const correctCount = results.filter(r => r.isCorrect).length;
  const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;

  // ==================== SETUP VIEW ====================
  if (gameState === 'setup') {
    return (
      <div className="dictation-game">
        <div className="dictation-setup">
          <div className="setup-header">
            <Volume2 size={48} className="setup-icon" />
            <h2>Nghe viết từ vựng</h2>
            <p>Từ vựng sẽ được đọc 3 lần. Hãy ghi lại đáp án trước khi hết thời gian!</p>
          </div>

          <div className="setup-options">
            <div className="option-group">
              <label>Số câu hỏi</label>
              <div className="count-buttons">
                {[5, 10, 15, 20].map(count => (
                  <button
                    key={count}
                    className={`count-btn ${questionCount === count ? 'active' : ''}`}
                    onClick={() => setQuestionCount(count)}
                    disabled={count > cards.length}
                  >
                    {count}
                  </button>
                ))}
              </div>
              <p className="option-hint">Có {cards.length} từ vựng</p>
            </div>
          </div>

          <div className="setup-actions">
            <button className="btn btn-primary btn-large" onClick={startGame} disabled={cards.length === 0}>
              <Play size={20} />
              Bắt đầu
            </button>
            {onExit && (
              <button className="btn btn-secondary" onClick={onExit}>
                Quay lại
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==================== RESULT VIEW ====================
  if (gameState === 'result') {
    return (
      <div className="dictation-game">
        <div className="dictation-result">
          <div className="result-header">
            <Trophy size={48} className="trophy-icon" />
            <h2>Kết quả</h2>
          </div>

          <div className="result-stats">
            <div className="stat-item correct">
              <CheckCircle size={24} />
              <span className="stat-value">{correctCount}</span>
              <span className="stat-label">Đúng</span>
            </div>
            <div className="stat-item wrong">
              <XCircle size={24} />
              <span className="stat-value">{results.length - correctCount}</span>
              <span className="stat-label">Sai</span>
            </div>
            <div className="stat-item accuracy">
              <span className="stat-value">{accuracy}%</span>
              <span className="stat-label">Chính xác</span>
            </div>
          </div>

          <div className="result-details">
            <h3>Chi tiết</h3>
            <div className="result-list">
              {results.map((result, idx) => {
                const card = gameCards.find(c => c.id === result.cardId);
                return (
                  <div key={idx} className={`result-item ${result.isCorrect ? 'correct' : 'wrong'}`}>
                    <span className="result-num">{idx + 1}</span>
                    <div className="result-content">
                      <div className="result-answer">
                        <span className="your-answer">Bạn: {result.userAnswer}</span>
                        {!result.isCorrect && (
                          <span className="correct-answer">Đúng: {result.correctAnswer}</span>
                        )}
                      </div>
                      {card && (
                        <span className="result-meaning">{card.meaning}</span>
                      )}
                    </div>
                    <span className={`result-status ${result.isCorrect ? 'correct' : 'wrong'}`}>
                      {result.isCorrect ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="result-actions">
            <button className="btn btn-primary" onClick={startGame}>
              <RotateCcw size={18} />
              Chơi lại
            </button>
            <button className="btn btn-secondary" onClick={() => setGameState('setup')}>
              <Settings size={18} />
              Thiết lập mới
            </button>
            {onExit && (
              <button className="btn btn-secondary" onClick={onExit}>
                Thoát
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==================== PLAYING VIEW ====================
  const currentCard = gameCards[currentIndex];

  return (
    <div className="dictation-game">
      <div className="dictation-playing">
        {/* Progress */}
        <div className="dictation-header">
          <span className="progress-text">
            Câu {currentIndex + 1} / {gameCards.length}
          </span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentIndex + 1) / gameCards.length) * 100}%` }}
            />
          </div>
          <div className="score-display">
            <span className="correct">✓ {correctCount}</span>
            <span className="wrong">✗ {results.length - correctCount}</span>
          </div>
        </div>

        {/* Question area */}
        <div className="dictation-question">
          {/* Timer */}
          <div className={`timer ${timeLeft <= 3 ? 'urgent' : ''}`}>
            <span className="timer-value">{timeLeft}</span>
            <span className="timer-label">giây</span>
          </div>

          {/* Reading indicator */}
          <div className="reading-indicator">
            <Volume2 size={32} className={isReading ? 'pulsing' : ''} />
            <span className="reading-count">
              {isReading ? `Đang đọc lần ${readingCount}/3` : 'Hãy ghi lại từ vựng'}
            </span>
            {!isReading && !showAnswer && (
              <button className="btn btn-icon replay-btn" onClick={replayAudio} title="Nghe lại">
                <RotateCcw size={18} />
              </button>
            )}
          </div>

          {/* Hint: meaning */}
          {currentCard && (
            <div className="meaning-hint">
              <span className="hint-label">Nghĩa:</span>
              <span className="hint-text">{currentCard.meaning}</span>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="answer-form">
            <input
              ref={inputRef}
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Gõ từ vựng bạn nghe được..."
              className={`answer-input ${showAnswer ? (results[results.length - 1]?.isCorrect ? 'correct' : 'wrong') : ''}`}
              disabled={showAnswer}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            {!showAnswer && (
              <button type="submit" className="btn btn-primary submit-btn" disabled={!userAnswer.trim()}>
                Xác nhận
              </button>
            )}
          </form>

          {/* Show answer after submission or timeout */}
          {showAnswer && currentCard && (
            <div className={`answer-reveal ${results[results.length - 1]?.isCorrect ? 'correct' : 'wrong'}`}>
              <span className="answer-label">Đáp án đúng:</span>
              <span className="answer-text">{currentCard.vocabulary}</span>
              {currentCard.kanji && currentCard.kanji !== currentCard.vocabulary && (
                <span className="answer-kanji">({currentCard.kanji})</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
