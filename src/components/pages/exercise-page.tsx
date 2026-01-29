// Exercise Page - Updated for new exercise types
// Features: Multi-type support, listening dictation, 2-column layout

import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Play, Volume2, VolumeX, RefreshCw, CheckCircle2, XCircle, Trophy, Clock, BookOpen, RotateCcw, Home, ChevronRight } from 'lucide-react';
import type { Exercise, ExerciseQuestion, ExerciseSession, ExerciseType } from '../../types/exercise';
import type { Flashcard, JLPTLevel } from '../../types/flashcard';
import { EXERCISE_TYPE_LABELS, EXERCISE_TYPE_ICONS, getTotalQuestionCount } from '../../types/exercise';
import { ANSWER_OPTIONS } from '../../constants/answer-options';

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

interface ExercisePageProps {
  exercises: Exercise[];
  flashcards: Flashcard[];
  onGoHome: () => void;
}

type ViewState = 'list' | 'session' | 'result';

// Helper to get exercise types (handle legacy)
const getExerciseTypes = (ex: Exercise): ExerciseType[] => {
  return ex.types || (ex.type ? [ex.type as ExerciseType] : []);
};

// Helper to get exercise levels (handle legacy)
const getExerciseLevels = (ex: Exercise): JLPTLevel[] => {
  return ex.jlptLevels || (ex.jlptLevel ? [ex.jlptLevel] : []);
};

// Helper to get total question count (handle legacy)
const getExerciseQuestionCount = (ex: Exercise): number => {
  if (ex.questionCountByType && ex.types) {
    return getTotalQuestionCount(ex.questionCountByType, ex.types);
  }
  return ex.questionCount || 10;
};

export function ExercisePage({ exercises, flashcards, onGoHome }: ExercisePageProps) {
  const [view, setView] = useState<ViewState>('list');
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | 'all'>('all');
  const [session, setSession] = useState<ExerciseSession | null>(null);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listenCount, setListenCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const speakTimeoutRef = useRef<NodeJS.Timeout[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Filter published exercises
  const publishedExercises = exercises.filter(e => e.isPublished);
  const filteredExercises = selectedLevel === 'all'
    ? publishedExercises
    : publishedExercises.filter(e => {
        const levels = getExerciseLevels(e);
        return levels.includes(selectedLevel);
      });

  // Exercise counts by level
  const countByLevel = JLPT_LEVELS.reduce((acc, level) => {
    acc[level] = publishedExercises.filter(e => {
      const levels = getExerciseLevels(e);
      return levels.includes(level);
    }).length;
    return acc;
  }, {} as Record<string, number>);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      speakTimeoutRef.current.forEach(t => clearTimeout(t));
      if (timerRef.current) clearInterval(timerRef.current);
      window.speechSynthesis.cancel();
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (!currentExercise?.timePerQuestion || !session || showResult || view !== 'session') {
      setTimeLeft(null);
      return;
    }

    setTimeLeft(currentExercise.timePerQuestion);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAnswer(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session?.currentIndex, currentExercise, view, showResult]);

  // Generate questions from flashcards
  const generateQuestions = useCallback((exercise: Exercise): ExerciseQuestion[] => {
    const availableCards = flashcards.filter(c => exercise.lessonIds.includes(c.lessonId));
    const types = getExerciseTypes(exercise);
    const totalCount = getExerciseQuestionCount(exercise);

    if (availableCards.length < 4) return []; // Need at least 4 cards for options

    const questions: ExerciseQuestion[] = [];
    const shuffledCards = [...availableCards].sort(() => Math.random() - 0.5);

    // Calculate questions per type
    const questionsPerType: Record<ExerciseType, number> = {} as Record<ExerciseType, number>;
    if (exercise.questionCountByType) {
      types.forEach(type => {
        questionsPerType[type] = exercise.questionCountByType[type] || 0;
      });
    } else {
      // Legacy: distribute evenly
      const perType = Math.ceil(totalCount / types.length);
      types.forEach(type => {
        questionsPerType[type] = perType;
      });
    }

    let cardIndex = 0;
    types.forEach(type => {
      const count = Math.min(questionsPerType[type], shuffledCards.length - cardIndex);

      for (let i = 0; i < count && cardIndex < shuffledCards.length; i++, cardIndex++) {
        const card = shuffledCards[cardIndex];
        const otherCards = availableCards.filter(c => c.id !== card.id);
        const wrongOptions = otherCards.sort(() => Math.random() - 0.5).slice(0, 3);

        // For listening_write, no options needed
        if (type === 'listening_write') {
          questions.push({
            id: `q-${questions.length}`,
            type,
            vocabularyId: card.id,
            vocabulary: card.vocabulary,
            kanji: card.kanji || '',
            meaning: card.meaning,
            correctAnswer: card.vocabulary,
          });
          continue;
        }

        // Generate options based on type
        let options: string[];
        switch (type) {
          case 'vocabulary':
            // Show vocab, answer is meaning
            options = [card.meaning, ...wrongOptions.map(c => c.meaning)];
            break;
          case 'meaning':
            // Show meaning, answer is vocab
            options = [card.vocabulary, ...wrongOptions.map(c => c.vocabulary)];
            break;
          case 'kanji_to_vocab':
            // Show kanji, answer is vocab
            if (!card.kanji) continue; // Skip if no kanji
            options = [card.vocabulary, ...wrongOptions.map(c => c.vocabulary)];
            break;
          case 'vocab_to_kanji':
            // Show vocab, answer is kanji
            if (!card.kanji) continue; // Skip if no kanji
            options = [card.kanji, ...wrongOptions.filter(c => c.kanji).map(c => c.kanji!)];
            if (options.length < 4) continue; // Not enough kanji options
            break;
          default:
            options = [card.meaning, ...wrongOptions.map(c => c.meaning)];
        }

        const shuffledOptions = options.map((opt, idx) => ({ opt, isCorrect: idx === 0 }));
        shuffledOptions.sort(() => Math.random() - 0.5);
        const correctIndex = shuffledOptions.findIndex(o => o.isCorrect);

        questions.push({
          id: `q-${questions.length}`,
          type,
          vocabularyId: card.id,
          vocabulary: card.vocabulary,
          kanji: card.kanji || '',
          meaning: card.meaning,
          options: shuffledOptions.map(o => o.opt),
          correctIndex,
        });
      }
    });

    return questions;
  }, [flashcards]);

  // Start exercise
  const startExercise = useCallback((exercise: Exercise) => {
    const questions = generateQuestions(exercise);
    if (questions.length === 0) {
      alert('Không đủ từ vựng để tạo bài tập. Cần ít nhất 4 từ vựng.');
      return;
    }

    setCurrentExercise(exercise);
    setSession({
      exerciseId: exercise.id,
      questions,
      currentIndex: 0,
      answers: new Array(questions.length).fill(null),
      startedAt: new Date().toISOString(),
    });
    setView('session');
    setSelectedAnswer(null);
    setTextAnswer('');
    setShowResult(false);
    setIsAnimating(false);

    // If first question is listening, start speaking
    if (questions[0].type === 'listening_write') {
      setTimeout(() => speakQuestion(questions[0].vocabulary), 500);
    }
  }, [generateQuestions]);

  // Speak text
  const speakQuestion = useCallback((text: string) => {
    speakTimeoutRef.current.forEach(t => clearTimeout(t));
    speakTimeoutRef.current = [];
    window.speechSynthesis.cancel();

    setIsListening(true);
    setListenCount(0);

    const speak = (count: number) => {
      setListenCount(count + 1);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.8;

      const voices = window.speechSynthesis.getVoices();
      const jpVoice = voices.find(v => v.lang.startsWith('ja'));
      if (jpVoice) utterance.voice = jpVoice;

      utterance.onend = () => {
        if (count < 2) {
          const timeout = setTimeout(() => speak(count + 1), 2000);
          speakTimeoutRef.current.push(timeout);
        } else {
          setIsListening(false);
          // Focus text input after speaking
          setTimeout(() => textInputRef.current?.focus(), 100);
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    speak(0);
  }, []);

  // Handle answer
  const handleAnswer = useCallback((answer: number | string) => {
    if (!session || showResult) return;

    if (timerRef.current) clearInterval(timerRef.current);

    if (typeof answer === 'number') {
      setSelectedAnswer(answer);
    }

    setShowResult(true);
    setIsAnimating(true);

    const newAnswers = [...session.answers];
    newAnswers[session.currentIndex] = answer;
    setSession({ ...session, answers: newAnswers });

    setTimeout(() => setIsAnimating(false), 600);
  }, [session, showResult]);

  // Submit text answer for listening
  const handleTextSubmit = useCallback(() => {
    if (!textAnswer.trim()) return;
    handleAnswer(textAnswer.trim());
  }, [textAnswer, handleAnswer]);

  // Next question
  const nextQuestion = useCallback(() => {
    if (!session || !currentExercise) return;

    const nextIndex = session.currentIndex + 1;
    if (nextIndex >= session.questions.length) {
      setSession({ ...session, completedAt: new Date().toISOString() });
      setView('result');
    } else {
      setSession({ ...session, currentIndex: nextIndex });
      setSelectedAnswer(null);
      setTextAnswer('');
      setShowResult(false);

      const nextQ = session.questions[nextIndex];
      if (nextQ.type === 'listening_write') {
        setTimeout(() => speakQuestion(nextQ.vocabulary), 300);
      }
    }
  }, [session, currentExercise, speakQuestion]);

  // Calculate score
  const calculateScore = useCallback(() => {
    if (!session) return { correct: 0, total: 0, percentage: 0 };
    const correct = session.questions.reduce((sum, q, idx) => {
      const userAnswer = session.answers[idx];
      if (q.type === 'listening_write') {
        // For listening, compare text (case-insensitive, trim)
        const isCorrect = typeof userAnswer === 'string' &&
          userAnswer.toLowerCase().trim() === q.correctAnswer?.toLowerCase().trim();
        return sum + (isCorrect ? 1 : 0);
      }
      return sum + (userAnswer === q.correctIndex ? 1 : 0);
    }, 0);
    return {
      correct,
      total: session.questions.length,
      percentage: Math.round((correct / session.questions.length) * 100),
    };
  }, [session]);

  // Get question display text
  const getQuestionText = (q: ExerciseQuestion) => {
    switch (q.type) {
      case 'vocabulary':
        return q.kanji ? `${q.vocabulary} (${q.kanji})` : q.vocabulary;
      case 'meaning':
        return q.meaning;
      case 'kanji_to_vocab':
        return q.kanji;
      case 'vocab_to_kanji':
        return q.vocabulary;
      default:
        return q.vocabulary;
    }
  };

  // Get question type label
  const getQuestionTypeLabel = (type: ExerciseType) => {
    switch (type) {
      case 'vocabulary': return '📖 Từ vựng → Nghĩa';
      case 'meaning': return '🎯 Nghĩa → Từ vựng';
      case 'kanji_to_vocab': return '漢 Kanji → Từ vựng';
      case 'vocab_to_kanji': return 'あ Từ vựng → Kanji';
      case 'listening_write': return '🎧 Nghe → Viết từ';
      default: return '';
    }
  };

  // Get score grade
  const getScoreGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'S', color: '#FFD700', label: 'Xuất sắc!' };
    if (percentage >= 80) return { grade: 'A', color: '#22c55e', label: 'Tuyệt vời!' };
    if (percentage >= 70) return { grade: 'B', color: '#3b82f6', label: 'Tốt lắm!' };
    if (percentage >= 60) return { grade: 'C', color: '#f59e0b', label: 'Khá ổn!' };
    return { grade: 'D', color: '#ef4444', label: 'Cần cố gắng!' };
  };

  // Render list view - 2 column grid
  if (view === 'list') {
    return (
      <div className="ex-page">
        <header className="ex-header">
          <button className="ex-back-btn" onClick={onGoHome}>
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </button>
          <h1 className="ex-title">
            <BookOpen className="ex-title-icon" />
            Bài Tập Từ Vựng
          </h1>
        </header>

        <div className="ex-filters">
          <button
            className={`ex-filter-chip ${selectedLevel === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedLevel('all')}
          >
            Tất cả
            <span className="ex-filter-count">{publishedExercises.length}</span>
          </button>
          {JLPT_LEVELS.map(level => (
            <button
              key={level}
              className={`ex-filter-chip ${selectedLevel === level ? 'active' : ''}`}
              onClick={() => setSelectedLevel(level)}
              disabled={countByLevel[level] === 0}
            >
              {level}
              <span className="ex-filter-count">{countByLevel[level]}</span>
            </button>
          ))}
        </div>

        <div className="ex-grid-2col">
          {filteredExercises.length === 0 ? (
            <div className="ex-empty">
              <div className="ex-empty-icon">
                <BookOpen size={48} strokeWidth={1.5} />
              </div>
              <h3>Chưa có bài tập</h3>
              <p>Các bài tập sẽ xuất hiện ở đây sau khi được tạo</p>
            </div>
          ) : (
            filteredExercises.map(exercise => {
              const types = getExerciseTypes(exercise);
              const levels = getExerciseLevels(exercise);
              const totalQ = getExerciseQuestionCount(exercise);

              return (
                <article
                  key={exercise.id}
                  className="ex-card"
                  onClick={() => startExercise(exercise)}
                >
                  <div className="ex-card-badges">
                    {levels.map(l => (
                      <span key={l} className="ex-card-badge">{l}</span>
                    ))}
                  </div>
                  <div className="ex-card-types">
                    {types.map(t => (
                      <span key={t} className="ex-type-icon" title={EXERCISE_TYPE_LABELS[t]}>
                        {EXERCISE_TYPE_ICONS[t]}
                      </span>
                    ))}
                  </div>
                  <h3 className="ex-card-title">{exercise.name}</h3>
                  {exercise.description && (
                    <p className="ex-card-desc">{exercise.description}</p>
                  )}
                  <div className="ex-card-meta">
                    <span className="ex-card-questions">{totalQ} câu hỏi</span>
                    {exercise.timePerQuestion && (
                      <span className="ex-card-time">⏱ {exercise.timePerQuestion}s</span>
                    )}
                  </div>
                  <div className="ex-card-type-tags">
                    {types.map(t => (
                      <span key={t} className="ex-type-tag">{EXERCISE_TYPE_LABELS[t]}</span>
                    ))}
                  </div>
                  <button className="ex-card-btn">
                    <Play size={16} />
                    Bắt đầu
                  </button>
                </article>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // Render session view
  if (view === 'session' && session && currentExercise) {
    const currentQ = session.questions[session.currentIndex];
    const isListeningType = currentQ.type === 'listening_write';

    // Check if answer is correct
    let isCorrect = false;
    if (isListeningType) {
      isCorrect = typeof session.answers[session.currentIndex] === 'string' &&
        (session.answers[session.currentIndex] as string).toLowerCase().trim() === currentQ.correctAnswer?.toLowerCase().trim();
    } else {
      isCorrect = selectedAnswer === currentQ.correctIndex;
    }

    const progress = ((session.currentIndex + (showResult ? 1 : 0)) / session.questions.length) * 100;

    return (
      <div className="ex-session">
        <header className="ex-session-header">
          <button className="ex-quit-btn" onClick={() => setView('list')}>
            <XCircle size={20} />
          </button>
          <div className="ex-session-progress">
            <div className="ex-progress-bar">
              <div className="ex-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="ex-progress-text">
              {session.currentIndex + 1} / {session.questions.length}
            </span>
          </div>
          {timeLeft !== null && !showResult && (
            <div className={`ex-timer ${timeLeft <= 5 ? 'danger' : timeLeft <= 10 ? 'warning' : ''}`}>
              <Clock size={18} />
              <span>{timeLeft}s</span>
            </div>
          )}
          <div className="ex-session-type-badge">
            {getQuestionTypeLabel(currentQ.type)}
          </div>
        </header>

        <main className="ex-session-content">
          <div className={`ex-question-card ${isAnimating ? (isCorrect ? 'correct-shake' : 'wrong-shake') : ''}`}>
            {/* Listening Write Type */}
            {isListeningType ? (
              <div className="ex-listening-write">
                <div className={`ex-sound-wave ${isListening ? 'active' : ''}`}>
                  {isListening ? <Volume2 size={48} /> : <VolumeX size={48} />}
                  <div className="ex-wave-rings">
                    <span></span><span></span><span></span>
                  </div>
                </div>
                <p className="ex-listening-status">
                  {isListening ? `Đang phát lần ${listenCount}/3...` : 'Nghe và viết từ vừa nghe'}
                </p>
                {!isListening && !showResult && (
                  <button className="ex-replay-btn" onClick={() => speakQuestion(currentQ.vocabulary)}>
                    <RefreshCw size={16} />
                    Nghe lại
                  </button>
                )}

                {!showResult && (
                  <div className="ex-text-input-wrapper">
                    <input
                      ref={textInputRef}
                      type="text"
                      className="ex-text-input"
                      value={textAnswer}
                      onChange={e => setTextAnswer(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
                      placeholder="Gõ từ bạn nghe được..."
                      disabled={isListening}
                    />
                  </div>
                )}

                {showResult && (
                  <div className={`ex-listening-result ${isCorrect ? 'correct' : 'wrong'}`}>
                    <div className="ex-your-answer">
                      <span className="label">Bạn viết:</span>
                      <span className={`answer ${isCorrect ? 'correct' : 'wrong'}`}>
                        {session.answers[session.currentIndex] as string || '(không trả lời)'}
                        {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                      </span>
                    </div>
                    <div className="ex-correct-answer">
                      <span className="label">Đáp án đúng:</span>
                      <span className="answer correct">{currentQ.correctAnswer}</span>
                    </div>
                    <div className="ex-word-info">
                      <span className="vocabulary">{currentQ.vocabulary}</span>
                      {currentQ.kanji && <span className="kanji">({currentQ.kanji})</span>}
                      <span className="meaning">= {currentQ.meaning}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Multiple Choice Types */
              <>
                <div className="ex-question">
                  <h2 className="ex-question-text">{getQuestionText(currentQ)}</h2>
                  <p className="ex-question-hint">Chọn đáp án đúng</p>
                </div>

                <div className="ex-options">
                  {currentQ.options?.map((option, idx) => {
                    let optionClass = 'ex-option';
                    if (showResult) {
                      if (idx === currentQ.correctIndex) optionClass += ' correct';
                      else if (idx === selectedAnswer) optionClass += ' wrong';
                      if (selectedAnswer === -1 && idx === currentQ.correctIndex) optionClass += ' timeout-correct';
                    } else if (selectedAnswer === idx) {
                      optionClass += ' selected';
                    }

                    return (
                      <button
                        key={idx}
                        className={optionClass}
                        onClick={() => !showResult && setSelectedAnswer(idx)}
                        disabled={showResult}
                      >
                        <img src={ANSWER_OPTIONS[idx].icon} alt={ANSWER_OPTIONS[idx].label} className="ex-option-icon-img" />
                        <span className="ex-option-text">{option}</span>
                        {showResult && idx === currentQ.correctIndex && (
                          <CheckCircle2 className="ex-option-icon correct" size={22} />
                        )}
                        {showResult && idx === selectedAnswer && idx !== currentQ.correctIndex && (
                          <XCircle className="ex-option-icon wrong" size={22} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {showResult && (
                  <div className={`ex-feedback ${isCorrect ? 'correct' : 'wrong'} ${selectedAnswer === -1 ? 'timeout' : ''}`}>
                    <div className="ex-feedback-icon">
                      {isCorrect ? <CheckCircle2 size={24} /> : selectedAnswer === -1 ? <Clock size={24} /> : <XCircle size={24} />}
                    </div>
                    <div className="ex-feedback-content">
                      <strong>{isCorrect ? 'Chính xác!' : selectedAnswer === -1 ? 'Hết giờ!' : 'Chưa đúng!'}</strong>
                      <p className="ex-feedback-detail">
                        <span className="ex-feedback-word">{currentQ.vocabulary}</span>
                        {currentQ.kanji && <span className="ex-feedback-kanji">({currentQ.kanji})</span>}
                        <span className="ex-feedback-meaning">= {currentQ.meaning}</span>
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Submit button for multiple choice */}
          {!isListeningType && !showResult && selectedAnswer !== null && (
            <button className="ex-submit-btn" onClick={() => handleAnswer(selectedAnswer)}>
              <CheckCircle2 size={20} />
              Trả lời
            </button>
          )}

          {/* Submit button for listening */}
          {isListeningType && !showResult && !isListening && textAnswer.trim() && (
            <button className="ex-submit-btn" onClick={handleTextSubmit}>
              <CheckCircle2 size={20} />
              Trả lời
            </button>
          )}

          {showResult && (
            <button className="ex-next-btn" onClick={nextQuestion}>
              {session.currentIndex + 1 >= session.questions.length ? (
                <>Xem kết quả <Trophy size={18} /></>
              ) : (
                <>Câu tiếp theo <ChevronRight size={18} /></>
              )}
            </button>
          )}
        </main>
      </div>
    );
  }

  // Render result view
  if (view === 'result' && session && currentExercise) {
    const score = calculateScore();
    const grade = getScoreGrade(score.percentage);

    return (
      <div className="ex-result">
        <div className="ex-result-card">
          <div className="ex-result-header">
            <Trophy className="ex-trophy" size={48} style={{ color: grade.color }} />
            <h2>Hoàn thành!</h2>
            <p className="ex-result-name">{currentExercise.name}</p>
          </div>

          <div className="ex-score-section">
            <div className="ex-score-ring" style={{ '--score-color': grade.color } as React.CSSProperties}>
              <svg viewBox="0 0 100 100">
                <circle className="ex-ring-bg" cx="50" cy="50" r="45" />
                <circle
                  className="ex-ring-fill"
                  cx="50" cy="50" r="45"
                  strokeDasharray={`${score.percentage * 2.83} 283`}
                />
              </svg>
              <div className="ex-score-content">
                <span className="ex-score-grade" style={{ color: grade.color }}>{grade.grade}</span>
                <span className="ex-score-percent">{score.percentage}%</span>
              </div>
            </div>
            <p className="ex-score-label" style={{ color: grade.color }}>{grade.label}</p>
            <p className="ex-score-detail">{score.correct} / {score.total} câu đúng</p>
          </div>

          <div className="ex-result-actions">
            <button className="ex-action-btn primary" onClick={() => startExercise(currentExercise)}>
              <RotateCcw size={18} />
              Làm lại
            </button>
            <button className="ex-action-btn secondary" onClick={() => setView('list')}>
              <BookOpen size={18} />
              Bài khác
            </button>
            <button className="ex-action-btn outline" onClick={onGoHome}>
              <Home size={18} />
              Trang chủ
            </button>
          </div>

          <div className="ex-review">
            <h4 className="ex-review-title">
              <Clock size={16} />
              Xem lại đáp án
            </h4>
            <div className="ex-review-list">
              {session.questions.map((q, idx) => {
                const userAnswer = session.answers[idx];
                let correct = false;
                if (q.type === 'listening_write') {
                  correct = typeof userAnswer === 'string' &&
                    userAnswer.toLowerCase().trim() === q.correctAnswer?.toLowerCase().trim();
                } else {
                  correct = userAnswer === q.correctIndex;
                }

                return (
                  <div key={q.id} className={`ex-review-item ${correct ? 'correct' : 'wrong'}`}>
                    <span className="ex-review-num">{idx + 1}</span>
                    <span className="ex-review-type">{EXERCISE_TYPE_ICONS[q.type]}</span>
                    <span className="ex-review-word">
                      {q.kanji ? `${q.vocabulary} (${q.kanji})` : q.vocabulary}
                    </span>
                    <span className="ex-review-meaning">{q.meaning}</span>
                    <span className="ex-review-status">
                      {correct ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
