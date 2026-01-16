// JLPT Practice Page - Multi-select test builder with per-section configuration

import { useState, useMemo, useRef, useEffect } from 'react';
import { BookOpen, CheckCircle, XCircle, Settings, Play, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import type { JLPTQuestion, JLPTLevel, QuestionCategory } from '../../types/jlpt-question';
import type { JLPTSession } from '../../types/user';

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
const QUESTION_CATEGORIES: { value: QuestionCategory; label: string; icon: string }[] = [
  { value: 'vocabulary', label: 'Từ vựng', icon: '文' },
  { value: 'grammar', label: 'Ngữ pháp', icon: '法' },
  { value: 'reading', label: 'Đọc hiểu', icon: '読' },
  { value: 'listening', label: 'Nghe', icon: '聴' },
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

// Section configuration for per-category question count
interface SectionConfig {
  category: QuestionCategory;
  questionCount: number;
  available: number;
}

export function JLPTPage({ questions, onSaveJLPTSession }: JLPTPageProps) {
  const [practiceState, setPracticeState] = useState<PracticeState>('setup');

  // Multi-select states
  const [selectedLevels, setSelectedLevels] = useState<Set<JLPTLevel>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<QuestionCategory>>(new Set());

  // Section configurations (question count per category)
  const [sectionConfigs, setSectionConfigs] = useState<SectionConfig[]>([]);
  const [showAdvancedSetup, setShowAdvancedSetup] = useState(false);

  // Simple mode - total question count
  const [simpleQuestionCount, setSimpleQuestionCount] = useState(20);

  // Practice state
  const [practiceQuestions, setPracticeQuestions] = useState<JLPTQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState<PracticeResult[]>([]);

  // Session tracking
  const sessionStartTime = useRef<number>(Date.now());
  const sessionSaved = useRef<boolean>(false);

  // Toggle level selection
  const toggleLevel = (level: JLPTLevel) => {
    setSelectedLevels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(level)) {
        newSet.delete(level);
      } else {
        newSet.add(level);
      }
      return newSet;
    });
  };

  // Toggle category selection
  const toggleCategory = (category: QuestionCategory) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Select all levels
  const selectAllLevels = () => {
    if (selectedLevels.size === JLPT_LEVELS.length) {
      setSelectedLevels(new Set());
    } else {
      setSelectedLevels(new Set(JLPT_LEVELS));
    }
  };

  // Select all categories
  const selectAllCategories = () => {
    if (selectedCategories.size === QUESTION_CATEGORIES.length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(QUESTION_CATEGORIES.map(c => c.value)));
    }
  };

  // Filter questions based on selections
  const filteredQuestions = useMemo(() => {
    if (selectedLevels.size === 0 && selectedCategories.size === 0) {
      return questions;
    }
    return questions.filter(q => {
      const levelMatch = selectedLevels.size === 0 || selectedLevels.has(q.level);
      const categoryMatch = selectedCategories.size === 0 || selectedCategories.has(q.category);
      return levelMatch && categoryMatch;
    });
  }, [questions, selectedLevels, selectedCategories]);

  // Calculate available questions per category
  const questionsByCategory = useMemo(() => {
    const result: Record<QuestionCategory, JLPTQuestion[]> = {
      vocabulary: [],
      grammar: [],
      reading: [],
      listening: [],
    };
    filteredQuestions.forEach(q => {
      result[q.category].push(q);
    });
    return result;
  }, [filteredQuestions]);

  // Update section configs when selections change
  useEffect(() => {
    const newConfigs: SectionConfig[] = [];
    QUESTION_CATEGORIES.forEach(cat => {
      if (selectedCategories.size === 0 || selectedCategories.has(cat.value)) {
        const available = questionsByCategory[cat.value].length;
        const existing = sectionConfigs.find(c => c.category === cat.value);
        newConfigs.push({
          category: cat.value,
          questionCount: existing?.questionCount ?? Math.min(5, available),
          available,
        });
      }
    });
    setSectionConfigs(newConfigs);
  }, [selectedCategories, questionsByCategory]);

  // Update section question count
  const updateSectionCount = (category: QuestionCategory, count: number) => {
    setSectionConfigs(prev => prev.map(c =>
      c.category === category ? { ...c, questionCount: count } : c
    ));
  };

  const getCategoryLabel = (category: QuestionCategory) => {
    const found = QUESTION_CATEGORIES.find(c => c.value === category);
    return found?.label || category;
  };

  const getCategoryIcon = (category: QuestionCategory) => {
    const found = QUESTION_CATEGORIES.find(c => c.value === category);
    return found?.icon || '?';
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

  // Calculate total questions to practice
  const getTotalQuestions = () => {
    if (showAdvancedSetup) {
      return sectionConfigs.reduce((sum, c) => sum + c.questionCount, 0);
    }
    return Math.min(simpleQuestionCount, filteredQuestions.length);
  };

  // Start practice
  const startPractice = () => {
    let selectedQuestions: JLPTQuestion[] = [];

    if (showAdvancedSetup) {
      // Advanced mode: select from each category
      sectionConfigs.forEach(config => {
        const categoryQuestions = questionsByCategory[config.category];
        const shuffled = shuffleArray(categoryQuestions).slice(0, config.questionCount);
        selectedQuestions.push(...shuffled);
      });
      // Shuffle final list
      selectedQuestions = shuffleArray(selectedQuestions);
    } else {
      // Simple mode: just shuffle and take count
      selectedQuestions = shuffleArray(filteredQuestions).slice(0, simpleQuestionCount);
    }

    setPracticeQuestions(selectedQuestions);
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

      // Build level and category strings
      const levelStr = selectedLevels.size === 0 || selectedLevels.size === JLPT_LEVELS.length
        ? 'Mixed'
        : Array.from(selectedLevels).join(', ');
      const categoryStr = selectedCategories.size === 0 || selectedCategories.size === QUESTION_CATEGORIES.length
        ? 'Mixed'
        : Array.from(selectedCategories).map(getCategoryLabel).join(', ');

      onSaveJLPTSession({
        date: new Date().toISOString().split('T')[0],
        level: levelStr,
        category: categoryStr,
        correctCount,
        totalQuestions: results.length,
        duration,
      });
    }
  }, [practiceState, onSaveJLPTSession, results, selectedLevels, selectedCategories]);

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
        <div className="jlpt-setup-container">
          <div className="jlpt-setup-header">
            <h1>
              <span className="jlpt-title-jp">日本語能力試験</span>
              <span className="jlpt-title-vi">Luyện thi JLPT</span>
            </h1>
            <p className="jlpt-subtitle">Tùy chỉnh bài thi theo nhu cầu của bạn</p>
          </div>

          {/* Level Selection */}
          <div className="jlpt-section">
            <div className="jlpt-section-header">
              <h3>Cấp độ JLPT</h3>
              <button
                className="btn-link-sm"
                onClick={selectAllLevels}
              >
                {selectedLevels.size === JLPT_LEVELS.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>
            <div className="jlpt-level-grid">
              {JLPT_LEVELS.map(level => {
                const levelQuestions = questions.filter(q =>
                  q.level === level &&
                  (selectedCategories.size === 0 || selectedCategories.has(q.category))
                );
                const isSelected = selectedLevels.has(level);
                return (
                  <button
                    key={level}
                    className={`jlpt-level-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleLevel(level)}
                  >
                    <span className="level-badge">{level}</span>
                    <span className="level-count">{levelQuestions.length} câu</span>
                    {isSelected && <CheckCircle size={18} className="check-icon" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Selection */}
          <div className="jlpt-section">
            <div className="jlpt-section-header">
              <h3>Phần thi</h3>
              <button
                className="btn-link-sm"
                onClick={selectAllCategories}
              >
                {selectedCategories.size === QUESTION_CATEGORIES.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>
            <div className="jlpt-category-grid">
              {QUESTION_CATEGORIES.map(cat => {
                const catQuestions = questions.filter(q =>
                  q.category === cat.value &&
                  (selectedLevels.size === 0 || selectedLevels.has(q.level))
                );
                const isSelected = selectedCategories.has(cat.value);
                return (
                  <button
                    key={cat.value}
                    className={`jlpt-category-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleCategory(cat.value)}
                  >
                    <span className="category-icon">{cat.icon}</span>
                    <span className="category-name">{cat.label}</span>
                    <span className="category-count">{catQuestions.length} câu</span>
                    {isSelected && <CheckCircle size={18} className="check-icon" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Count Configuration */}
          <div className="jlpt-section">
            <div className="jlpt-section-header">
              <h3>Số lượng câu hỏi</h3>
              <button
                className="btn-toggle-advanced"
                onClick={() => setShowAdvancedSetup(!showAdvancedSetup)}
              >
                <Settings size={16} />
                {showAdvancedSetup ? 'Chế độ đơn giản' : 'Tùy chỉnh từng phần'}
                {showAdvancedSetup ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {!showAdvancedSetup ? (
              // Simple mode
              <div className="jlpt-simple-count">
                <div className="count-options">
                  {[10, 20, 30, 50, 100].map(count => (
                    <button
                      key={count}
                      className={`count-option ${simpleQuestionCount === count ? 'selected' : ''}`}
                      onClick={() => setSimpleQuestionCount(count)}
                    >
                      {count} câu
                    </button>
                  ))}
                </div>
                <p className="count-note">
                  Có <strong>{filteredQuestions.length}</strong> câu hỏi phù hợp với lựa chọn của bạn
                </p>
              </div>
            ) : (
              // Advanced mode - per section configuration
              <div className="jlpt-advanced-setup">
                {sectionConfigs.length === 0 ? (
                  <p className="no-sections">Vui lòng chọn ít nhất một phần thi</p>
                ) : (
                  <div className="section-config-list">
                    {sectionConfigs.map(config => (
                      <div key={config.category} className="section-config-item">
                        <div className="section-info">
                          <span className="section-icon">{getCategoryIcon(config.category)}</span>
                          <span className="section-name">{getCategoryLabel(config.category)}</span>
                          <span className="section-available">({config.available} câu có sẵn)</span>
                        </div>
                        <div className="section-count-control">
                          <button
                            className="count-btn"
                            onClick={() => updateSectionCount(config.category, Math.max(0, config.questionCount - 5))}
                            disabled={config.questionCount === 0}
                          >
                            -5
                          </button>
                          <input
                            type="number"
                            min="0"
                            max={config.available}
                            value={config.questionCount}
                            onChange={(e) => updateSectionCount(config.category, Math.min(config.available, Math.max(0, parseInt(e.target.value) || 0)))}
                            className="count-input"
                          />
                          <button
                            className="count-btn"
                            onClick={() => updateSectionCount(config.category, Math.min(config.available, config.questionCount + 5))}
                            disabled={config.questionCount >= config.available}
                          >
                            +5
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary & Start */}
          <div className="jlpt-summary">
            <div className="summary-stats">
              <div className="summary-item">
                <span className="summary-value">{getTotalQuestions()}</span>
                <span className="summary-label">Tổng câu hỏi</span>
              </div>
              <div className="summary-item">
                <span className="summary-value">
                  {selectedLevels.size === 0 ? 'Tất cả' : selectedLevels.size}
                </span>
                <span className="summary-label">Cấp độ</span>
              </div>
              <div className="summary-item">
                <span className="summary-value">
                  {selectedCategories.size === 0 ? 'Tất cả' : selectedCategories.size}
                </span>
                <span className="summary-label">Phần thi</span>
              </div>
            </div>

            <button
              className="btn btn-primary btn-start"
              onClick={startPractice}
              disabled={getTotalQuestions() === 0}
            >
              <Play size={20} />
              Bắt đầu luyện tập
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Result view
  if (practiceState === 'result') {
    return (
      <div className="jlpt-page">
        <div className="jlpt-container">
          <div className="jlpt-practice-result">
            <div className="result-header">
              <h2>Kết quả luyện tập</h2>
              <span className="result-badge">
                {accuracy >= 80 ? '優秀' : accuracy >= 60 ? '合格' : '頑張れ'}
              </span>
            </div>

            <div className="result-stats">
              <div className="stat-item correct">
                <CheckCircle size={24} />
                <span className="stat-value">{correctCount}</span>
                <span className="stat-label">Đúng</span>
              </div>
              <div className="stat-item wrong">
                <XCircle size={24} />
                <span className="stat-value">{totalCount - correctCount}</span>
                <span className="stat-label">Sai</span>
              </div>
              <div className="stat-item accuracy">
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
                <RotateCcw size={18} />
                Luyện tập lại
              </button>
              <button className="btn btn-secondary" onClick={resetPractice}>
                <Settings size={18} />
                Thiết lập mới
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
                      <div className="review-meta">
                        <span className="review-number">Câu {idx + 1}</span>
                        <span className="review-level">{question.level}</span>
                        <span className="review-category">{getCategoryLabel(question.category)}</span>
                      </div>
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
      </div>
    );
  }

  // Practice view
  const currentQuestion = practiceQuestions[currentIndex];

  return (
    <div className="jlpt-page">
      <div className="jlpt-container">
        <div className="jlpt-practice">
          <div className="practice-header">
            <span className="practice-progress">
              Câu {currentIndex + 1} / {practiceQuestions.length}
            </span>
            <div className="practice-score">
              <span className="score-correct">✓ {correctCount}</span>
              <span className="score-wrong">✗ {results.length - correctCount}</span>
            </div>
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
                  {showResult && answer.isCorrect && <CheckCircle size={20} className="correct-icon" />}
                  {showResult && selectedAnswer === index && !answer.isCorrect && <XCircle size={20} className="wrong-icon" />}
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
    </div>
  );
}
