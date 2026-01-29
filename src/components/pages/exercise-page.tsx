// Exercise Page - Professional vocabulary exercise UI
// Features: Modern quiz UI, animations, progress tracking, sound indicators

import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Play, Volume2, VolumeX, RefreshCw, CheckCircle2, XCircle, Trophy, Target, Clock, BookOpen, Headphones, RotateCcw, Home, ChevronRight } from 'lucide-react';
import type { Exercise, ExerciseQuestion, ExerciseSession } from '../../types/exercise';
import type { Flashcard, JLPTLevel } from '../../types/flashcard';
import { EXERCISE_TYPE_LABELS } from '../../types/exercise';

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

// Exercise type icons
const EXERCISE_ICONS: Record<string, React.ReactNode> = {
  vocabulary: <BookOpen size={18} />,
  kanji: <span className="kanji-icon">漢</span>,
  meaning: <Target size={18} />,
  listening: <Headphones size={18} />,
};

interface ExercisePageProps {
  exercises: Exercise[];
  flashcards: Flashcard[];
  onGoHome: () => void;
}

type ViewState = 'list' | 'session' | 'result';

export function ExercisePage({ exercises, flashcards, onGoHome }: ExercisePageProps) {
  const [view, setView] = useState<ViewState>('list');
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | 'all'>('all');
  const [session, setSession] = useState<ExerciseSession | null>(null);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listenCount, setListenCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const speakTimeoutRef = useRef<NodeJS.Timeout[]>([]);

  // Filter published exercises
  const publishedExercises = exercises.filter(e => e.isPublished);
  const filteredExercises = selectedLevel === 'all'
    ? publishedExercises
    : publishedExercises.filter(e => e.jlptLevel === selectedLevel);

  // Exercise counts by level
  const countByLevel = JLPT_LEVELS.reduce((acc, level) => {
    acc[level] = publishedExercises.filter(e => e.jlptLevel === level).length;
    return acc;
  }, {} as Record<string, number>);

  // Clean up speak timeouts on unmount
  useEffect(() => {
    return () => {
      speakTimeoutRef.current.forEach(t => clearTimeout(t));
      window.speechSynthesis.cancel();
    };
  }, []);

  // Generate questions from flashcards
  const generateQuestions = useCallback((exercise: Exercise): ExerciseQuestion[] => {
    const availableCards = flashcards.filter(c => exercise.lessonIds.includes(c.lessonId));
    if (availableCards.length < exercise.questionCount) return [];

    const shuffled = [...availableCards].sort(() => Math.random() - 0.5);
    const selectedCards = shuffled.slice(0, exercise.questionCount);

    return selectedCards.map((card, idx) => {
      const otherCards = availableCards.filter(c => c.id !== card.id);
      const wrongOptions = otherCards.sort(() => Math.random() - 0.5).slice(0, 3);

      let options: string[];
      switch (exercise.type) {
        case 'vocabulary':
          options = [card.meaning, ...wrongOptions.map(c => c.meaning)];
          break;
        case 'kanji':
        case 'meaning':
        case 'listening':
          options = [card.vocabulary, ...wrongOptions.map(c => c.vocabulary)];
          break;
        default:
          options = [card.meaning, ...wrongOptions.map(c => c.meaning)];
      }

      const shuffledOptions = options.map((opt, i) => ({ opt, isCorrect: i === 0 }));
      shuffledOptions.sort(() => Math.random() - 0.5);
      const newCorrectIndex = shuffledOptions.findIndex(o => o.isCorrect);

      return {
        id: `q-${idx}`,
        vocabularyId: card.id,
        vocabulary: card.vocabulary,
        kanji: card.kanji,
        meaning: card.meaning,
        options: shuffledOptions.map(o => o.opt),
        correctIndex: newCorrectIndex,
      };
    });
  }, [flashcards]);

  // Start exercise
  const startExercise = useCallback((exercise: Exercise) => {
    const questions = generateQuestions(exercise);
    if (questions.length === 0) {
      alert('Không đủ từ vựng để tạo bài tập');
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
    setShowResult(false);
    setIsAnimating(false);

    if (exercise.type === 'listening') {
      setTimeout(() => speakQuestion(questions[0].vocabulary), 500);
    }
  }, [generateQuestions]);

  // Speak text 3 times with 2s delay
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
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    speak(0);
  }, []);

  // Handle answer selection
  const handleAnswer = useCallback((index: number) => {
    if (!session || showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);
    setIsAnimating(true);

    const newAnswers = [...session.answers];
    newAnswers[session.currentIndex] = index;
    setSession({ ...session, answers: newAnswers });

    setTimeout(() => setIsAnimating(false), 600);
  }, [session, showResult]);

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
      setShowResult(false);

      if (currentExercise.type === 'listening') {
        setTimeout(() => speakQuestion(session.questions[nextIndex].vocabulary), 300);
      }
    }
  }, [session, currentExercise, speakQuestion]);

  // Calculate score
  const calculateScore = useCallback(() => {
    if (!session) return { correct: 0, total: 0, percentage: 0 };
    const correct = session.questions.reduce((sum, q, idx) => {
      return sum + (session.answers[idx] === q.correctIndex ? 1 : 0);
    }, 0);
    return {
      correct,
      total: session.questions.length,
      percentage: Math.round((correct / session.questions.length) * 100),
    };
  }, [session]);

  // Get question display
  const getQuestionText = () => {
    if (!session || !currentExercise) return '';
    const q = session.questions[session.currentIndex];

    switch (currentExercise.type) {
      case 'vocabulary':
        return q.kanji ? `${q.vocabulary} (${q.kanji})` : q.vocabulary;
      case 'kanji':
        return q.kanji || q.vocabulary;
      case 'meaning':
        return q.meaning;
      default:
        return q.vocabulary;
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

  // Render list view
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

        <div className="ex-grid">
          {filteredExercises.length === 0 ? (
            <div className="ex-empty">
              <div className="ex-empty-icon">
                <BookOpen size={48} strokeWidth={1.5} />
              </div>
              <h3>Chưa có bài tập</h3>
              <p>Các bài tập sẽ xuất hiện ở đây sau khi được tạo</p>
            </div>
          ) : (
            filteredExercises.map(exercise => (
              <article
                key={exercise.id}
                className="ex-card"
                onClick={() => startExercise(exercise)}
              >
                <div className="ex-card-badge">{exercise.jlptLevel}</div>
                <div className="ex-card-icon">
                  {EXERCISE_ICONS[exercise.type]}
                </div>
                <h3 className="ex-card-title">{exercise.name}</h3>
                {exercise.description && (
                  <p className="ex-card-desc">{exercise.description}</p>
                )}
                <div className="ex-card-meta">
                  <span className="ex-card-type">{EXERCISE_TYPE_LABELS[exercise.type]}</span>
                  <span className="ex-card-questions">{exercise.questionCount} câu hỏi</span>
                </div>
                <button className="ex-card-btn">
                  <Play size={16} />
                  Bắt đầu
                </button>
              </article>
            ))
          )}
        </div>
      </div>
    );
  }

  // Render session view
  if (view === 'session' && session && currentExercise) {
    const currentQ = session.questions[session.currentIndex];
    const isCorrect = selectedAnswer === currentQ.correctIndex;
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
          <div className="ex-session-type">
            {EXERCISE_ICONS[currentExercise.type]}
          </div>
        </header>

        <main className="ex-session-content">
          <div className={`ex-question-card ${isAnimating ? (isCorrect ? 'correct-shake' : 'wrong-shake') : ''}`}>
            {currentExercise.type === 'listening' ? (
              <div className="ex-listening">
                <div className={`ex-sound-wave ${isListening ? 'active' : ''}`}>
                  {isListening ? <Volume2 size={64} /> : <VolumeX size={64} />}
                  <div className="ex-wave-rings">
                    <span></span><span></span><span></span>
                  </div>
                </div>
                <p className="ex-listening-status">
                  {isListening ? `Đang phát lần ${listenCount}/3...` : 'Đã phát xong'}
                </p>
                {!isListening && (
                  <button className="ex-replay-btn" onClick={() => speakQuestion(currentQ.vocabulary)}>
                    <RefreshCw size={18} />
                    Nghe lại
                  </button>
                )}
              </div>
            ) : (
              <div className="ex-question">
                <span className="ex-question-label">
                  {currentExercise.type === 'meaning' ? 'Nghĩa:' : 'Từ vựng:'}
                </span>
                <h2 className="ex-question-text">{getQuestionText()}</h2>
              </div>
            )}

            <div className="ex-options">
              {currentQ.options.map((option, idx) => {
                let optionClass = 'ex-option';
                if (showResult) {
                  if (idx === currentQ.correctIndex) optionClass += ' correct';
                  else if (idx === selectedAnswer) optionClass += ' wrong';
                } else if (selectedAnswer === idx) {
                  optionClass += ' selected';
                }

                return (
                  <button
                    key={idx}
                    className={optionClass}
                    onClick={() => handleAnswer(idx)}
                    disabled={showResult}
                  >
                    <span className="ex-option-letter">{String.fromCharCode(65 + idx)}</span>
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
              <div className={`ex-feedback ${isCorrect ? 'correct' : 'wrong'}`}>
                <div className="ex-feedback-icon">
                  {isCorrect ? <CheckCircle2 size={28} /> : <XCircle size={28} />}
                </div>
                <div className="ex-feedback-content">
                  <strong>{isCorrect ? 'Chính xác!' : 'Chưa đúng!'}</strong>
                  {currentExercise.type === 'listening' && (
                    <p className="ex-feedback-detail">
                      <span>{currentQ.kanji ? `${currentQ.vocabulary} (${currentQ.kanji})` : currentQ.vocabulary}</span>
                      <span className="ex-feedback-meaning">= {currentQ.meaning}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

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
                const correct = userAnswer === q.correctIndex;
                return (
                  <div key={q.id} className={`ex-review-item ${correct ? 'correct' : 'wrong'}`}>
                    <span className="ex-review-num">{idx + 1}</span>
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
