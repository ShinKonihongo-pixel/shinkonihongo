// Exercise Page - Premium UI with glassmorphism design
// Features: Multi-type support, listening dictation, 3-column layout, premium cards
// Flow: Level Selection → Exercise List → Session → Result

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ArrowLeft, Play, Volume2, VolumeX, RefreshCw, CheckCircle2, XCircle, Trophy, Clock, BookOpen, RotateCcw, ChevronRight, Zap, PenTool } from 'lucide-react';
import type { Exercise, ExerciseQuestion, ExerciseSession, ExerciseType } from '../../types/exercise';
import type { Flashcard, JLPTLevel } from '../../types/flashcard';
import { EXERCISE_TYPE_LABELS, EXERCISE_TYPE_ICONS, getTotalQuestionCount } from '../../types/exercise';
import { ANSWER_OPTIONS } from '../../constants/answer-options';
import { JLPTLevelSelector, LEVEL_THEMES, JLPT_LEVELS } from '../ui/jlpt-level-selector';

interface ExercisePageProps {
  exercises: Exercise[];
  flashcards: Flashcard[];
  onGoHome: () => void;
}

type ViewState = 'level-select' | 'list' | 'session' | 'result';

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

export function ExercisePage({ exercises, flashcards }: ExercisePageProps) {
  const [view, setView] = useState<ViewState>('level-select');
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | null>(null);
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
  const filteredExercises = !selectedLevel
    ? publishedExercises
    : publishedExercises.filter(e => {
        const levels = getExerciseLevels(e);
        return levels.includes(selectedLevel);
      });

  // Exercise counts by level (for JLPTLevelSelector)
  const countByLevel = useMemo(() => {
    const counts: Record<JLPTLevel, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
    publishedExercises.forEach(e => {
      const levels = getExerciseLevels(e);
      levels.forEach(level => {
        counts[level]++;
      });
    });
    return counts;
  }, [publishedExercises]);

  // Select level handler
  const selectLevel = (level: JLPTLevel) => {
    setSelectedLevel(level);
    setView('list');
  };

  // Go back to level select
  const goBackToLevelSelect = () => {
    setSelectedLevel(null);
    setView('level-select');
  };

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

    if (availableCards.length < 4) return [];

    const questions: ExerciseQuestion[] = [];
    const shuffledCards = [...availableCards].sort(() => Math.random() - 0.5);

    const questionsPerType: Record<ExerciseType, number> = {} as Record<ExerciseType, number>;
    if (exercise.questionCountByType) {
      types.forEach(type => {
        questionsPerType[type] = exercise.questionCountByType[type] || 0;
      });
    } else {
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

        let options: string[];
        switch (type) {
          case 'vocabulary':
            options = [card.meaning, ...wrongOptions.map(c => c.meaning)];
            break;
          case 'meaning':
            options = [card.vocabulary, ...wrongOptions.map(c => c.vocabulary)];
            break;
          case 'kanji_to_vocab':
            if (!card.kanji) continue;
            options = [card.vocabulary, ...wrongOptions.map(c => c.vocabulary)];
            break;
          case 'vocab_to_kanji':
            if (!card.kanji) continue;
            options = [card.kanji, ...wrongOptions.filter(c => c.kanji).map(c => c.kanji!)];
            if (options.length < 4) continue;
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
      case 'sentence_translation': return '🔄 Dịch câu';
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

  // Render level select view - Premium UI matching Grammar/Vocabulary design
  if (view === 'level-select') {
    return (
      <JLPTLevelSelector
        title="Bài Tập"
        subtitle="Chọn cấp độ JLPT để bắt đầu"
        icon={<PenTool size={32} />}
        countByLevel={countByLevel}
        countLabel="bài tập"
        onSelectLevel={selectLevel}
        showFrame
      />
    );
  }

  // Render list view - Premium 3 column grid
  if (view === 'list' && selectedLevel) {
    const levelTheme = LEVEL_THEMES[selectedLevel];
    return (
      <div className="exercise-page-premium">
        {/* Premium Header with Back Button */}
        <div className="premium-header with-back">
          <div className="header-content">
            <button className="btn-back" onClick={goBackToLevelSelect}>
              <ArrowLeft size={20} />
            </button>
            <span className="level-badge" style={{ background: levelTheme.gradient }}>
              {selectedLevel}
            </span>
            <div className="header-text">
              <h1>Bài Tập</h1>
              <p>{filteredExercises.length} bài tập</p>
            </div>
          </div>
        </div>

        {/* Removed level filters since we now select level first */}
        <div className="level-filters" style={{ display: 'none' }}>
          {JLPT_LEVELS.map(level => {
            const theme = LEVEL_THEMES[level];
            return (
              <button
                key={level}
                className={`filter-chip ${selectedLevel === level ? 'active' : ''}`}
                onClick={() => setSelectedLevel(level)}
                disabled={countByLevel[level] === 0}
                style={selectedLevel === level ? { background: theme.gradient } : undefined}
              >
                <span>{level}</span>
                <span className="chip-count">{countByLevel[level]}</span>
              </button>
            );
          })}
        </div>

        {/* Exercise Grid */}
        {filteredExercises.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><BookOpen size={56} strokeWidth={1} /></div>
            <h3>Chưa có bài tập</h3>
            <p>Các bài tập sẽ xuất hiện ở đây sau khi được tạo</p>
          </div>
        ) : (
          <div className="exercise-grid">
            {filteredExercises.map((exercise, idx) => {
              const types = getExerciseTypes(exercise);
              const levels = getExerciseLevels(exercise);
              const totalQ = getExerciseQuestionCount(exercise);
              const primaryLevel = levels[0] || 'N5';
              const theme = LEVEL_THEMES[primaryLevel];

              return (
                <article
                  key={exercise.id}
                  className="exercise-card"
                  onClick={() => startExercise(exercise)}
                  style={{ '--card-delay': `${idx * 0.05}s`, '--level-gradient': theme.gradient, '--level-glow': theme.glow } as React.CSSProperties}
                >
                  <div className="card-top">
                    <div className="card-levels">
                      {levels.map(l => (
                        <span key={l} className="level-badge" style={{ background: LEVEL_THEMES[l].gradient }}>
                          {l}
                        </span>
                      ))}
                    </div>
                    <div className="card-types">
                      {types.slice(0, 3).map(t => (
                        <span key={t} className="type-icon" title={EXERCISE_TYPE_LABELS[t]}>
                          {EXERCISE_TYPE_ICONS[t]}
                        </span>
                      ))}
                      {types.length > 3 && <span className="type-more">+{types.length - 3}</span>}
                    </div>
                  </div>

                  <h3 className="card-title">{exercise.name}</h3>
                  {exercise.description && <p className="card-desc">{exercise.description}</p>}

                  <div className="card-meta">
                    <span className="meta-item"><Zap size={14} /> {totalQ} câu</span>
                    {exercise.timePerQuestion && (
                      <span className="meta-item"><Clock size={14} /> {exercise.timePerQuestion}s</span>
                    )}
                  </div>

                  <div className="card-type-tags">
                    {types.map(t => (
                      <span key={t} className="type-tag">{EXERCISE_TYPE_LABELS[t]}</span>
                    ))}
                  </div>

                  <button className="card-btn" style={{ background: theme.gradient }}>
                    <Play size={16} /> Bắt đầu
                  </button>

                  <div className="card-shine" />
                </article>
              );
            })}
          </div>
        )}

        <style>{`
          .exercise-page-premium {
            min-height: 100vh;
            background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
            padding: 1.5rem;
            overflow-x: hidden;
          }

          /* Premium Header */
          .premium-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding: 1rem 1.5rem;
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
          }

          .header-content {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .header-icon {
            position: relative;
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            box-shadow: 0 8px 32px rgba(245, 158, 11, 0.3);
          }

          .sparkle {
            position: absolute;
            color: #fbbf24;
            animation: sparkle 2s ease-in-out infinite;
          }

          .sparkle-1 { top: -4px; right: -4px; animation-delay: 0s; }
          .sparkle-2 { bottom: -2px; left: -2px; animation-delay: 0.5s; }

          @keyframes sparkle {
            0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
            50% { opacity: 1; transform: scale(1) rotate(180deg); }
          }

          .header-text h1 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 700;
            background: linear-gradient(135deg, #fff 0%, #fcd34d 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .header-text p {
            margin: 0.25rem 0 0;
            font-size: 0.875rem;
            color: rgba(255, 255, 255, 0.5);
          }

          /* Back button */
          .btn-back {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
          }

          .btn-back:hover {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            transform: translateX(-2px);
          }

          /* Level badge */
          .level-badge {
            padding: 0.5rem 1rem;
            border-radius: 10px;
            color: white;
            font-weight: 700;
            font-size: 0.9rem;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          }

          .premium-header.with-back {
            justify-content: flex-start;
          }

          .premium-header.with-back .header-content {
            gap: 0.75rem;
          }

          .home-btn {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
          }

          .home-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: white;
          }

          /* Level Filters */
          .level-filters {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
          }

          .filter-chip {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 0.875rem;
          }

          .filter-chip:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.1);
            color: white;
          }

          .filter-chip.active {
            background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
            border-color: transparent;
            color: white;
          }

          .filter-chip:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }

          .chip-count {
            padding: 0.125rem 0.5rem;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 10px;
            font-size: 0.75rem;
          }

          /* Exercise Grid - 3 columns */
          .exercise-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.25rem;
          }

          @media (max-width: 1024px) {
            .exercise-grid { grid-template-columns: repeat(2, 1fr); }
          }

          @media (max-width: 640px) {
            .exercise-grid { grid-template-columns: 1fr; }
          }

          .exercise-card {
            position: relative;
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 20px;
            padding: 1.25rem;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            animation: cardAppear 0.5s ease backwards;
            animation-delay: var(--card-delay);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          @keyframes cardAppear {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .exercise-card:hover {
            transform: translateY(-4px);
            border-color: rgba(255, 255, 255, 0.15);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 0 0 40px var(--level-glow);
          }

          .exercise-card:hover .card-shine {
            transform: translateX(100%);
          }

          .card-shine {
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            transition: transform 0.6s ease;
            pointer-events: none;
          }

          .card-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }

          .card-levels {
            display: flex;
            flex-wrap: wrap;
            gap: 0.375rem;
          }

          .level-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.6rem;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: 600;
            color: white;
          }

          .card-types {
            display: flex;
            gap: 0.25rem;
          }

          .type-icon {
            font-size: 0.9rem;
            padding: 0.25rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 6px;
          }

          .type-more {
            font-size: 0.7rem;
            padding: 0.25rem 0.375rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            color: rgba(255, 255, 255, 0.6);
          }

          .card-title {
            margin: 0;
            font-size: 1.05rem;
            font-weight: 600;
            color: white;
            line-height: 1.4;
          }

          .card-desc {
            margin: 0;
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.5);
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .card-meta {
            display: flex;
            gap: 1rem;
          }

          .meta-item {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.5);
          }

          .card-type-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.375rem;
          }

          .type-tag {
            padding: 0.2rem 0.5rem;
            background: rgba(139, 92, 246, 0.2);
            border-radius: 6px;
            font-size: 0.65rem;
            color: #c4b5fd;
          }

          .card-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.625rem;
            border: none;
            border-radius: 10px;
            color: white;
            font-weight: 500;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: auto;
          }

          .exercise-card:hover .card-btn {
            box-shadow: 0 4px 20px var(--level-glow);
          }

          /* Empty State */
          .empty-state {
            grid-column: 1 / -1;
            text-align: center;
            padding: 4rem 2rem;
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 20px;
          }

          .empty-icon {
            color: rgba(255, 255, 255, 0.3);
            margin-bottom: 1rem;
          }

          .empty-state h3 {
            margin: 0 0 0.5rem;
            color: white;
            font-size: 1.25rem;
          }

          .empty-state p {
            margin: 0;
            color: rgba(255, 255, 255, 0.5);
          }

          @media (max-width: 640px) {
            .exercise-page-premium { padding: 1rem; }
            .premium-header { padding: 1rem; flex-wrap: wrap; gap: 1rem; }
            .header-text h1 { font-size: 1.25rem; }
          }
        `}</style>
      </div>
    );
  }

  // Render session view
  if (view === 'session' && session && currentExercise) {
    const currentQ = session.questions[session.currentIndex];
    const isListeningType = currentQ.type === 'listening_write';
    const levels = getExerciseLevels(currentExercise);
    const primaryLevel = levels[0] || 'N5';
    const theme = LEVEL_THEMES[primaryLevel];

    let isCorrect = false;
    if (isListeningType) {
      isCorrect = typeof session.answers[session.currentIndex] === 'string' &&
        (session.answers[session.currentIndex] as string).toLowerCase().trim() === currentQ.correctAnswer?.toLowerCase().trim();
    } else {
      isCorrect = selectedAnswer === currentQ.correctIndex;
    }

    const progress = ((session.currentIndex + (showResult ? 1 : 0)) / session.questions.length) * 100;

    return (
      <div className="exercise-session-premium">
        {/* Session Header with Exercise Name */}
        <header className="session-header">
          <button className="quit-btn" onClick={() => setView('list')}>
            <ArrowLeft size={20} />
          </button>
          <div className="session-info">
            <h2 className="session-title">{currentExercise.name}</h2>
            <div className="session-meta">
              <span className="session-level" style={{ background: theme.gradient }}>
                {primaryLevel}
              </span>
              <span className="session-type">{getQuestionTypeLabel(currentQ.type)}</span>
            </div>
          </div>
          {timeLeft !== null && !showResult && (
            <div className={`timer ${timeLeft <= 5 ? 'danger' : timeLeft <= 10 ? 'warning' : ''}`}>
              <Clock size={18} />
              <span>{timeLeft}s</span>
            </div>
          )}
        </header>

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%`, background: theme.gradient }} />
          </div>
          <span className="progress-text">Câu {session.currentIndex + 1} / {session.questions.length}</span>
        </div>

        {/* Question Card */}
        <main className="exp-session-content">
          <div className={`exp-question-card ${isAnimating ? (isCorrect ? 'exp-correct-shake' : 'exp-wrong-shake') : ''}`}>
            {/* Listening Write Type */}
            {isListeningType ? (
              <div className="exp-listening-section">
                <div className={`exp-sound-wave ${isListening ? 'active' : ''}`}>
                  {isListening ? <Volume2 size={48} /> : <VolumeX size={48} />}
                  <div className="exp-wave-rings"><span></span><span></span><span></span></div>
                </div>
                <p className="exp-listening-status">
                  {isListening ? `Đang phát lần ${listenCount}/3...` : 'Nghe và viết từ vừa nghe'}
                </p>
                {!isListening && !showResult && (
                  <button className="exp-replay-btn" onClick={() => speakQuestion(currentQ.vocabulary)}>
                    <RefreshCw size={16} /> Nghe lại
                  </button>
                )}

                {!showResult && (
                  <input
                    ref={textInputRef}
                    type="text"
                    className="exp-text-input"
                    value={textAnswer}
                    onChange={e => setTextAnswer(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
                    placeholder="Gõ từ bạn nghe được..."
                    disabled={isListening}
                  />
                )}

                {showResult && (
                  <div className={`exp-listening-result ${isCorrect ? 'correct' : 'wrong'}`}>
                    <div className="exp-result-row">
                      <span className="exp-label">Bạn viết:</span>
                      <span className={`exp-answer ${isCorrect ? 'correct' : 'wrong'}`}>
                        {session.answers[session.currentIndex] as string || '(không trả lời)'}
                        {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                      </span>
                    </div>
                    <div className="exp-result-row">
                      <span className="exp-label">Đáp án:</span>
                      <span className="exp-answer correct">{currentQ.correctAnswer}</span>
                    </div>
                    <div className="exp-word-info">
                      <span className="exp-vocab">{currentQ.vocabulary}</span>
                      {currentQ.kanji && <span className="exp-kanji">({currentQ.kanji})</span>}
                      <span className="exp-meaning">= {currentQ.meaning}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Multiple Choice Types */
              <>
                <div className="exp-question-section">
                  <h2 className="exp-question-text">{getQuestionText(currentQ)}</h2>
                  <p className="exp-question-hint">Chọn đáp án đúng</p>
                </div>

                <div className="exp-options-grid">
                  {currentQ.options?.map((option, idx) => {
                    let optionClass = 'exp-option-btn';
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
                        <img src={ANSWER_OPTIONS[idx].icon} alt={ANSWER_OPTIONS[idx].label} className="exp-option-mascot" />
                        <span className="exp-option-text">{option}</span>
                        {showResult && idx === currentQ.correctIndex && <CheckCircle2 className="exp-result-icon correct" size={22} />}
                        {showResult && idx === selectedAnswer && idx !== currentQ.correctIndex && <XCircle className="exp-result-icon wrong" size={22} />}
                      </button>
                    );
                  })}
                </div>

                {showResult && (
                  <div className={`exp-feedback ${isCorrect ? 'correct' : 'wrong'} ${selectedAnswer === -1 ? 'timeout' : ''}`}>
                    <div className="exp-feedback-icon">
                      {isCorrect ? <CheckCircle2 size={24} /> : selectedAnswer === -1 ? <Clock size={24} /> : <XCircle size={24} />}
                    </div>
                    <div className="exp-feedback-content">
                      <strong>{isCorrect ? 'Chính xác!' : selectedAnswer === -1 ? 'Hết giờ!' : 'Chưa đúng!'}</strong>
                      <p>
                        <span className="exp-word">{currentQ.vocabulary}</span>
                        {currentQ.kanji && <span className="exp-kanji">({currentQ.kanji})</span>}
                        <span className="exp-meaning">= {currentQ.meaning}</span>
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="exp-action-buttons">
            {!isListeningType && !showResult && selectedAnswer !== null && (
              <button className="exp-submit-btn" style={{ background: theme.gradient }} onClick={() => handleAnswer(selectedAnswer)}>
                <CheckCircle2 size={20} /> Trả lời
              </button>
            )}

            {isListeningType && !showResult && !isListening && textAnswer.trim() && (
              <button className="exp-submit-btn" style={{ background: theme.gradient }} onClick={handleTextSubmit}>
                <CheckCircle2 size={20} /> Trả lời
              </button>
            )}

            {showResult && (
              <button className="exp-next-btn" style={{ background: theme.gradient }} onClick={nextQuestion}>
                {session.currentIndex + 1 >= session.questions.length ? (
                  <>Xem kết quả <Trophy size={18} /></>
                ) : (
                  <>Câu tiếp theo <ChevronRight size={18} /></>
                )}
              </button>
            )}
          </div>
        </main>

        <style>{`
          .exercise-session-premium {
            min-height: 100vh;
            background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
            padding: 1.5rem;
          }

          .session-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
          }

          .quit-btn {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
          }

          .quit-btn:hover {
            background: rgba(239, 68, 68, 0.2);
            border-color: rgba(239, 68, 68, 0.5);
            color: #ef4444;
          }

          .session-info {
            flex: 1;
          }

          .session-title {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 600;
            color: white;
          }

          .session-meta {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-top: 0.375rem;
          }

          .session-level {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.2rem 0.6rem;
            border-radius: 8px;
            font-size: 0.7rem;
            font-weight: 600;
            color: white;
          }

          .session-type {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.5);
          }

          .timer {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            padding: 0.5rem 0.875rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            font-weight: 600;
            color: white;
          }

          .timer.warning { background: rgba(245, 158, 11, 0.3); color: #fcd34d; }
          .timer.danger { background: rgba(239, 68, 68, 0.3); color: #fca5a5; animation: pulse 0.5s ease infinite; }

          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }

          .progress-container {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }

          .progress-bar {
            flex: 1;
            height: 6px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            border-radius: 3px;
            transition: width 0.4s ease;
          }

          .progress-text {
            font-size: 0.875rem;
            color: rgba(255, 255, 255, 0.5);
            white-space: nowrap;
          }

          .exp-session-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
            max-width: 700px;
            margin: 0 auto;
          }

          .exp-question-card {
            width: 100%;
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 2rem;
          }

          .exp-question-card.exp-correct-shake { animation: expCorrectShake 0.6s ease; }
          .exp-question-card.exp-wrong-shake { animation: expWrongShake 0.6s ease; }

          @keyframes expCorrectShake {
            0%, 100% { transform: translateX(0); border-color: rgba(255, 255, 255, 0.08); }
            25% { transform: translateX(-5px); }
            50% { border-color: #22c55e; box-shadow: 0 0 30px rgba(34, 197, 94, 0.3); }
            75% { transform: translateX(5px); }
          }

          @keyframes expWrongShake {
            0%, 100% { transform: translateX(0); border-color: rgba(255, 255, 255, 0.08); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
            50% { border-color: #ef4444; box-shadow: 0 0 30px rgba(239, 68, 68, 0.3); }
          }

          /* Question Section */
          .exp-question-section {
            text-align: center;
            margin-bottom: 2rem;
          }

          .exp-question-text {
            margin: 0 0 0.5rem;
            font-size: 2.25rem;
            font-weight: 700;
            color: white;
          }

          .exp-question-hint {
            margin: 0;
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.5);
          }

          /* Options Grid */
          .exp-options-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-bottom: 1.5rem;
          }

          .exp-option-btn {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.03);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: left;
            color: rgba(255, 255, 255, 0.9);
          }

          .exp-option-btn:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.06);
            border-color: rgba(255, 255, 255, 0.2);
          }

          .exp-option-btn.selected {
            border-color: #3b82f6;
            background: rgba(59, 130, 246, 0.1);
          }

          .exp-option-btn.correct {
            border-color: #22c55e;
            background: rgba(34, 197, 94, 0.15);
          }

          .exp-option-btn.wrong {
            border-color: #ef4444;
            background: rgba(239, 68, 68, 0.15);
          }

          .exp-option-mascot {
            width: 40px;
            height: 40px;
            object-fit: contain;
          }

          .exp-option-text {
            flex: 1;
            font-size: 1rem;
            line-height: 1.4;
          }

          .exp-result-icon {
            flex-shrink: 0;
          }

          .exp-result-icon.correct { color: #22c55e; }
          .exp-result-icon.wrong { color: #ef4444; }

          /* Feedback */
          .exp-feedback {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem 1.25rem;
            border-radius: 16px;
          }

          .exp-feedback.correct {
            background: rgba(34, 197, 94, 0.15);
            border-left: 4px solid #22c55e;
            color: #86efac;
          }

          .exp-feedback.wrong {
            background: rgba(239, 68, 68, 0.15);
            border-left: 4px solid #ef4444;
            color: #fca5a5;
          }

          .exp-feedback.timeout {
            background: rgba(245, 158, 11, 0.15);
            border-left: 4px solid #f59e0b;
            color: #fcd34d;
          }

          .exp-feedback-icon {
            flex-shrink: 0;
          }

          .exp-feedback-content p {
            margin: 0.25rem 0 0;
            font-size: 0.9rem;
            opacity: 0.9;
          }

          .exp-feedback-content .exp-word { font-weight: 600; }
          .exp-feedback-content .exp-kanji { margin-left: 0.25rem; opacity: 0.8; }
          .exp-feedback-content .exp-meaning { margin-left: 0.5rem; opacity: 0.7; }

          /* Listening Section */
          .exp-listening-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.25rem;
          }

          .exp-sound-wave {
            position: relative;
            width: 100px;
            height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(139, 92, 246, 0.1);
            border-radius: 50%;
            color: #a78bfa;
          }

          .exp-sound-wave.active { color: #8b5cf6; }

          .exp-wave-rings {
            position: absolute;
            inset: 0;
          }

          .exp-wave-rings span {
            position: absolute;
            inset: 0;
            border: 2px solid rgba(139, 92, 246, 0.3);
            border-radius: 50%;
            animation: expWaveRing 2s ease-out infinite;
          }

          .exp-wave-rings span:nth-child(2) { animation-delay: 0.5s; }
          .exp-wave-rings span:nth-child(3) { animation-delay: 1s; }

          .exp-sound-wave:not(.active) .exp-wave-rings span { animation: none; opacity: 0; }

          @keyframes expWaveRing {
            0% { transform: scale(1); opacity: 0.5; }
            100% { transform: scale(1.8); opacity: 0; }
          }

          .exp-listening-status {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.7);
            margin: 0;
          }

          .exp-replay-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: rgba(139, 92, 246, 0.2);
            border: 1px solid rgba(139, 92, 246, 0.3);
            border-radius: 10px;
            color: #c4b5fd;
            cursor: pointer;
            transition: all 0.2s;
          }

          .exp-replay-btn:hover {
            background: rgba(139, 92, 246, 0.3);
          }

          .exp-text-input {
            width: 100%;
            max-width: 400px;
            padding: 1rem 1.25rem;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 14px;
            font-size: 1.25rem;
            color: white;
            text-align: center;
            transition: all 0.3s ease;
          }

          .exp-text-input:focus {
            outline: none;
            border-color: #8b5cf6;
            background: rgba(139, 92, 246, 0.1);
          }

          .exp-text-input::placeholder {
            color: rgba(255, 255, 255, 0.3);
          }

          .exp-listening-result {
            width: 100%;
            max-width: 400px;
            padding: 1.25rem;
            border-radius: 16px;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .exp-listening-result.correct {
            background: rgba(34, 197, 94, 0.15);
            border: 1px solid rgba(34, 197, 94, 0.3);
          }

          .exp-listening-result.wrong {
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.3);
          }

          .exp-result-row {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .exp-result-row .exp-label {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.5);
            min-width: 70px;
          }

          .exp-result-row .exp-answer {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 1.1rem;
            font-weight: 600;
          }

          .exp-result-row .exp-answer.correct { color: #86efac; }
          .exp-result-row .exp-answer.wrong { color: #fca5a5; }

          .exp-word-info {
            padding-top: 0.75rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
          }

          .exp-word-info .exp-vocab {
            font-size: 1.25rem;
            font-weight: 600;
            color: white;
          }

          .exp-word-info .exp-kanji {
            margin-left: 0.25rem;
            color: rgba(255, 255, 255, 0.6);
          }

          .exp-word-info .exp-meaning {
            display: block;
            margin-top: 0.25rem;
            color: rgba(255, 255, 255, 0.5);
            font-size: 0.9rem;
          }

          /* Action Buttons */
          .exp-action-buttons {
            display: flex;
            justify-content: center;
            width: 100%;
          }

          .exp-submit-btn, .exp-next-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 1rem 2rem;
            border: none;
            border-radius: 14px;
            font-size: 1rem;
            font-weight: 600;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .exp-submit-btn:hover, .exp-next-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          }

          @media (max-width: 640px) {
            .exercise-session-premium { padding: 1rem; }
            .exp-question-text { font-size: 1.5rem; }
            .exp-options-grid { grid-template-columns: 1fr; }
            .exp-question-card { padding: 1.5rem; }
          }
        `}</style>
      </div>
    );
  }

  // Render result view
  if (view === 'result' && session && currentExercise) {
    const score = calculateScore();
    const grade = getScoreGrade(score.percentage);
    const levels = getExerciseLevels(currentExercise);
    const primaryLevel = levels[0] || 'N5';
    const theme = LEVEL_THEMES[primaryLevel];

    return (
      <div className="exercise-result-premium">
        <div className="result-card">
          <div className="result-glow" style={{ background: grade.color }} />

          <div className="result-header">
            <Trophy size={56} style={{ color: grade.color }} />
            <h2>Hoàn thành!</h2>
            <p className="result-name">{currentExercise.name}</p>
          </div>

          <div className="score-section">
            <div className="score-ring" style={{ '--score-color': grade.color, '--progress': `${score.percentage * 2.83}` } as React.CSSProperties}>
              <svg viewBox="0 0 100 100">
                <circle className="ring-bg" cx="50" cy="50" r="45" />
                <circle className="ring-fill" cx="50" cy="50" r="45" />
              </svg>
              <div className="score-content">
                <span className="grade" style={{ color: grade.color }}>{grade.grade}</span>
                <span className="percent">{score.percentage}%</span>
              </div>
            </div>
            <p className="grade-label" style={{ color: grade.color }}>{grade.label}</p>
            <p className="score-detail">{score.correct} / {score.total} câu đúng</p>
          </div>

          <div className="result-actions">
            <button className="action-btn primary" style={{ background: theme.gradient }} onClick={() => startExercise(currentExercise)}>
              <RotateCcw size={18} /> Làm lại
            </button>
            <button className="action-btn secondary" onClick={() => setView('list')}>
              <BookOpen size={18} /> Bài khác
            </button>
          </div>

          <div className="review-section">
            <h4><Clock size={16} /> Xem lại đáp án</h4>
            <div className="review-list">
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
                  <div key={q.id} className={`review-item ${correct ? 'correct' : 'wrong'}`}>
                    <span className="num">{idx + 1}</span>
                    <span className="type">{EXERCISE_TYPE_ICONS[q.type]}</span>
                    <span className="word">{q.kanji ? `${q.vocabulary} (${q.kanji})` : q.vocabulary}</span>
                    <span className="meaning">{q.meaning}</span>
                    <span className="status">{correct ? <CheckCircle2 size={16} /> : <XCircle size={16} />}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <style>{`
          .exercise-result-premium {
            min-height: 100vh;
            background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
            padding: 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .result-card {
            position: relative;
            width: 100%;
            max-width: 500px;
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 2rem;
            overflow: hidden;
          }

          .result-glow {
            position: absolute;
            top: -100px;
            left: 50%;
            transform: translateX(-50%);
            width: 200px;
            height: 200px;
            border-radius: 50%;
            filter: blur(80px);
            opacity: 0.3;
            animation: glowPulse 3s ease-in-out infinite;
          }

          @keyframes glowPulse {
            0%, 100% { opacity: 0.3; transform: translateX(-50%) scale(1); }
            50% { opacity: 0.4; transform: translateX(-50%) scale(1.1); }
          }

          .result-header {
            position: relative;
            text-align: center;
            margin-bottom: 1.5rem;
          }

          .result-header h2 {
            margin: 0.75rem 0 0.25rem;
            font-size: 1.75rem;
            font-weight: 700;
            color: white;
          }

          .result-name {
            margin: 0;
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.6);
          }

          .score-section {
            position: relative;
            text-align: center;
            margin-bottom: 1.5rem;
          }

          .score-ring {
            position: relative;
            width: 140px;
            height: 140px;
            margin: 0 auto 1rem;
          }

          .score-ring svg {
            width: 100%;
            height: 100%;
            transform: rotate(-90deg);
          }

          .ring-bg {
            fill: none;
            stroke: rgba(255, 255, 255, 0.1);
            stroke-width: 8;
          }

          .ring-fill {
            fill: none;
            stroke: var(--score-color);
            stroke-width: 8;
            stroke-linecap: round;
            stroke-dasharray: var(--progress) 283;
            transition: stroke-dasharray 1s ease;
          }

          .score-content {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }

          .grade {
            font-size: 2.5rem;
            font-weight: 800;
          }

          .percent {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.6);
          }

          .grade-label {
            margin: 0 0 0.25rem;
            font-size: 1.25rem;
            font-weight: 600;
          }

          .score-detail {
            margin: 0;
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.5);
          }

          .result-actions {
            display: flex;
            gap: 0.75rem;
            margin-bottom: 1.5rem;
          }

          .action-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.875rem;
            border: none;
            border-radius: 12px;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .action-btn.primary {
            color: white;
          }

          .action-btn.secondary {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .action-btn:hover {
            transform: translateY(-2px);
          }

          .review-section {
            position: relative;
          }

          .review-section h4 {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin: 0 0 1rem;
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.7);
          }

          .review-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            max-height: 200px;
            overflow-y: auto;
          }

          .review-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.625rem 0.75rem;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 10px;
            font-size: 0.85rem;
          }

          .review-item.correct {
            border-left: 3px solid #22c55e;
          }

          .review-item.wrong {
            border-left: 3px solid #ef4444;
          }

          .review-item .num {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            font-weight: 600;
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.7);
          }

          .review-item .type {
            font-size: 0.9rem;
          }

          .review-item .word {
            flex: 1;
            font-weight: 500;
            color: white;
          }

          .review-item .meaning {
            color: rgba(255, 255, 255, 0.5);
            font-size: 0.8rem;
          }

          .review-item .status {
            display: flex;
          }

          .review-item.correct .status { color: #22c55e; }
          .review-item.wrong .status { color: #ef4444; }

          @media (max-width: 640px) {
            .exercise-result-premium { padding: 1rem; }
            .result-card { padding: 1.5rem; }
          }
        `}</style>
      </div>
    );
  }

  return null;
}
