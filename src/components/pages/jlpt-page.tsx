// JLPT Practice Page - For practicing JLPT test questions

import { useState, useMemo, useRef, useEffect } from 'react';
import type { JLPTQuestion, JLPTLevel, QuestionCategory } from '../../types/jlpt-question';
import type { JLPTSession } from '../../types/user';

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
const QUESTION_CATEGORIES: { value: QuestionCategory; label: string }[] = [
  { value: 'vocabulary', label: 'Từ vựng' },
  { value: 'grammar', label: 'Ngữ pháp' },
  { value: 'reading', label: 'Đọc hiểu' },
  { value: 'listening', label: 'Nghe' },
];

interface JLPTPageProps {
  questions: JLPTQuestion[];
  onSaveJLPTSession?: (data: Omit<JLPTSession, 'id' | 'userId'>) => void;
}

type PracticeState = 'setup' | 'practicing' | 'result';

interface PracticeResult {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
}

export function JLPTPage({ questions, onSaveJLPTSession }: JLPTPageProps) {
  const [practiceState, setPracticeState] = useState<PracticeState>('setup');
  const [filterLevel, setFilterLevel] = useState<JLPTLevel | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<QuestionCategory | 'all'>('all');
  const [questionCount, setQuestionCount] = useState(10);

  // Practice state
  const [practiceQuestions, setPracticeQuestions] = useState<JLPTQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState<PracticeResult[]>([]);

  // Session tracking
  const sessionStartTime = useRef<number>(Date.now());
  const sessionSaved = useRef<boolean>(false);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (filterLevel !== 'all' && q.level !== filterLevel) return false;
      if (filterCategory !== 'all' && q.category !== filterCategory) return false;
      return true;
    });
  }, [questions, filterLevel, filterCategory]);

  const getCategoryLabel = (category: QuestionCategory) => {
    const found = QUESTION_CATEGORIES.find(c => c.value === category);
    return found?.label || category;
  };

  // Shuffle array
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Start practice
  const startPractice = () => {
    const count = Math.min(questionCount, filteredQuestions.length);
    const shuffled = shuffleArray(filteredQuestions).slice(0, count);
    setPracticeQuestions(shuffled);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setResults([]);
    sessionStartTime.current = Date.now();
    sessionSaved.current = false;
    setPracticeState('practicing');
  };

  // Save session when practice is complete
  useEffect(() => {
    if (practiceState === 'result' && !sessionSaved.current && onSaveJLPTSession && results.length > 0) {
      sessionSaved.current = true;
      const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      const correctCount = results.filter(r => r.isCorrect).length;
      onSaveJLPTSession({
        date: new Date().toISOString(),
        level: filterLevel === 'all' ? 'Mixed' : filterLevel,
        category: filterCategory === 'all' ? 'Mixed' : filterCategory,
        correctCount,
        totalQuestions: results.length,
        duration,
      });
    }
  }, [practiceState, onSaveJLPTSession, results, filterLevel, filterCategory]);

  // Handle answer selection
  const handleSelectAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  // Submit answer
  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    const currentQuestion = practiceQuestions[currentIndex];
    const isCorrect = currentQuestion.answers[selectedAnswer].isCorrect;

    setResults(prev => [...prev, {
      questionId: currentQuestion.id,
      selectedAnswer,
      isCorrect,
    }]);
    setShowResult(true);
  };

  // Next question
  const handleNext = () => {
    if (currentIndex < practiceQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setPracticeState('result');
    }
  };

  // Reset practice
  const resetPractice = () => {
    setPracticeState('setup');
    setPracticeQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setResults([]);
  };

  // Calculate stats
  const correctCount = results.filter(r => r.isCorrect).length;
  const totalCount = results.length;
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  // Setup view
  if (practiceState === 'setup') {
    return (
      <div className="jlpt-page">
        <div className="jlpt-practice-setup">
          <h2>Luyện thi JLPT</h2>
          <p className="practice-description">
            Chọn cấp độ và danh mục để bắt đầu luyện tập
          </p>

          <div className="practice-options">
            <div className="form-group">
              <label>Cấp độ JLPT</label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value as JLPTLevel | 'all')}
              >
                <option value="all">Tất cả cấp độ</option>
                {JLPT_LEVELS.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Danh mục</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as QuestionCategory | 'all')}
              >
                <option value="all">Tất cả danh mục</option>
                {QUESTION_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Số câu hỏi</label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
              >
                <option value={5}>5 câu</option>
                <option value={10}>10 câu</option>
                <option value={20}>20 câu</option>
                <option value={50}>50 câu</option>
                <option value={100}>100 câu</option>
              </select>
            </div>
          </div>

          <div className="practice-info">
            <p>Có <strong>{filteredQuestions.length}</strong> câu hỏi phù hợp</p>
          </div>

          <button
            className="btn btn-primary btn-large"
            onClick={startPractice}
            disabled={filteredQuestions.length === 0}
          >
            Bắt đầu luyện tập
          </button>
        </div>
      </div>
    );
  }

  // Result view
  if (practiceState === 'result') {
    return (
      <div className="jlpt-page">
        <div className="jlpt-practice-result">
          <h2>Kết quả luyện tập</h2>

          <div className="result-stats">
            <div className="stat-item">
              <span className="stat-value">{correctCount}/{totalCount}</span>
              <span className="stat-label">Câu đúng</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{accuracy}%</span>
              <span className="stat-label">Độ chính xác</span>
            </div>
          </div>

          <div className="result-message">
            {accuracy >= 80 ? (
              <p className="success">Xuất sắc! Bạn đã nắm vững kiến thức.</p>
            ) : accuracy >= 60 ? (
              <p className="good">Khá tốt! Hãy tiếp tục luyện tập.</p>
            ) : (
              <p className="needs-work">Cần cố gắng thêm! Hãy ôn lại các bài học.</p>
            )}
          </div>

          <div className="result-actions">
            <button className="btn btn-primary" onClick={startPractice}>
              Luyện tập lại
            </button>
            <button className="btn btn-secondary" onClick={resetPractice}>
              Chọn lại câu hỏi
            </button>
          </div>

          {/* Review questions */}
          <div className="result-review">
            <h3>Chi tiết kết quả</h3>
            {practiceQuestions.map((question, idx) => {
              const result = results[idx];
              return (
                <div key={question.id} className={`review-item ${result?.isCorrect ? 'correct' : 'wrong'}`}>
                  <div className="review-header">
                    <span className="review-number">Câu {idx + 1}</span>
                    <span className={`review-status ${result?.isCorrect ? 'correct' : 'wrong'}`}>
                      {result?.isCorrect ? '✓ Đúng' : '✗ Sai'}
                    </span>
                  </div>
                  <p className="review-question">{question.question}</p>
                  <div className="review-answers">
                    {question.answers.map((answer, aIdx) => (
                      <div
                        key={aIdx}
                        className={`review-answer ${answer.isCorrect ? 'correct' : ''} ${result?.selectedAnswer === aIdx && !answer.isCorrect ? 'selected-wrong' : ''}`}
                      >
                        <span className="answer-letter">{String.fromCharCode(65 + aIdx)}.</span>
                        <span>{answer.text}</span>
                        {answer.isCorrect && <span className="correct-mark">✓</span>}
                        {result?.selectedAnswer === aIdx && !answer.isCorrect && <span className="wrong-mark">✗</span>}
                      </div>
                    ))}
                  </div>
                  {question.explanation && (
                    <div className="review-explanation">
                      <strong>Giải thích:</strong> {question.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Practice view
  const currentQuestion = practiceQuestions[currentIndex];

  return (
    <div className="jlpt-page">
      <div className="jlpt-practice">
        <div className="practice-header">
          <span className="practice-progress">
            Câu {currentIndex + 1} / {practiceQuestions.length}
          </span>
          <span className="practice-score">
            Đúng: {correctCount} / {results.length}
          </span>
        </div>

        <div className="practice-question-card">
          <div className="question-meta">
            <span className="question-level">{currentQuestion.level}</span>
            <span className="question-category">{getCategoryLabel(currentQuestion.category)}</span>
          </div>

          <p className="question-text">{currentQuestion.question}</p>

          <div className="practice-answers">
            {currentQuestion.answers.map((answer, index) => (
              <button
                key={index}
                className={`practice-answer-btn ${selectedAnswer === index ? 'selected' : ''} ${
                  showResult
                    ? answer.isCorrect
                      ? 'correct'
                      : selectedAnswer === index
                        ? 'wrong'
                        : ''
                    : ''
                }`}
                onClick={() => handleSelectAnswer(index)}
                disabled={showResult}
              >
                <span className="answer-letter">{String.fromCharCode(65 + index)}.</span>
                <span className="answer-text">{answer.text}</span>
                {showResult && answer.isCorrect && <span className="correct-icon">✓</span>}
                {showResult && selectedAnswer === index && !answer.isCorrect && <span className="wrong-icon">✗</span>}
              </button>
            ))}
          </div>

          {showResult && currentQuestion.explanation && (
            <div className="practice-explanation">
              <strong>Giải thích:</strong> {currentQuestion.explanation}
            </div>
          )}
        </div>

        <div className="practice-actions">
          {!showResult ? (
            <button
              className="btn btn-primary btn-large"
              onClick={handleSubmit}
              disabled={selectedAnswer === null}
            >
              Xác nhận
            </button>
          ) : (
            <button className="btn btn-primary btn-large" onClick={handleNext}>
              {currentIndex < practiceQuestions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
            </button>
          )}
          <button className="btn btn-secondary" onClick={resetPractice}>
            Dừng lại
          </button>
        </div>
      </div>
    </div>
  );
}
