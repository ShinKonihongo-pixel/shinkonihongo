// Reading Practice Page - Practice reading comprehension

import { useState, useMemo } from 'react';
import { Home, ChevronRight, CheckCircle, XCircle, RotateCcw, Filter, Volume2 } from 'lucide-react';
import type { JLPTLevel } from '../../types/flashcard';
import type { ReadingPassage } from '../../types/reading';
import type { ReadingPracticePageProps, ViewState } from './reading-practice/reading-practice-types';
import { JLPT_LEVELS } from './reading-practice/reading-practice-constants';

export function ReadingPracticePage({
  passages,
  folders,
  getFoldersByLevel,
  getPassagesByFolder: _getPassagesByFolder,
  onGoHome,
}: ReadingPracticePageProps) {
  const [viewState, setViewState] = useState<ViewState>({ type: 'select' });
  const [filterLevel, setFilterLevel] = useState<JLPTLevel | 'all'>('all');
  const [filterFolderId, setFilterFolderId] = useState<string | 'all'>('all');
  const [showFilter, setShowFilter] = useState(false);

  // Practice state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Filter passages
  const filteredPassages = useMemo(() => {
    let result = [...passages];
    if (filterLevel !== 'all') {
      result = result.filter(p => p.jlptLevel === filterLevel);
    }
    if (filterFolderId !== 'all') {
      result = result.filter(p => p.folderId === filterFolderId);
    }
    return result;
  }, [passages, filterLevel, filterFolderId]);

  // Get folders for filter
  const foldersForFilter = useMemo(() => {
    if (filterLevel === 'all') return folders;
    return getFoldersByLevel(filterLevel);
  }, [filterLevel, folders, getFoldersByLevel]);

  // Count by level
  const countByLevel = useMemo(() => {
    const counts: Record<string, number> = { all: passages.length };
    JLPT_LEVELS.forEach(level => {
      counts[level] = passages.filter(p => p.jlptLevel === level).length;
    });
    return counts;
  }, [passages]);

  const startPractice = (passage: ReadingPassage) => {
    setViewState({ type: 'practice', passage });
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setIsCompleted(false);
  };

  const handleSelectAnswer = (answerIndex: number) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: answerIndex }));
  };

  const handleNextQuestion = () => {
    if (viewState.type !== 'practice') return;
    if (currentQuestionIndex < viewState.passage.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowResults(false);
    } else {
      setIsCompleted(true);
    }
  };

  const handleShowResult = () => {
    setShowResults(true);
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setIsCompleted(false);
  };

  const speakJapanese = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.85;
    speechSynthesis.speak(utterance);
  };

  // Calculate score
  const calculateScore = () => {
    if (viewState.type !== 'practice') return { correct: 0, total: 0, percent: 0 };
    const passage = viewState.passage;
    let correct = 0;
    passage.questions.forEach((q, idx) => {
      const selectedIdx = selectedAnswers[idx];
      if (selectedIdx !== undefined && q.answers[selectedIdx]?.isCorrect) {
        correct++;
      }
    });
    return {
      correct,
      total: passage.questions.length,
      percent: Math.round((correct / passage.questions.length) * 100),
    };
  };

  // Selection view
  if (viewState.type === 'select') {
    return (
      <div className="reading-practice-page">
        <div className="page-header">
          <button className="btn btn-back" onClick={onGoHome}>
            <Home size={18} /> Trang chủ
          </button>
          <h2>Luyện Đọc Hiểu</h2>
          <button className="btn btn-icon" onClick={() => setShowFilter(!showFilter)}>
            <Filter size={18} />
          </button>
        </div>

        {showFilter && (
          <div className="filter-section">
            <div className="filter-row">
              <label>Level:</label>
              <select value={filterLevel} onChange={e => { setFilterLevel(e.target.value as JLPTLevel | 'all'); setFilterFolderId('all'); }}>
                <option value="all">Tất cả ({countByLevel.all})</option>
                {JLPT_LEVELS.map(level => (
                  <option key={level} value={level}>{level} ({countByLevel[level]})</option>
                ))}
              </select>
            </div>
            <div className="filter-row">
              <label>Thư mục:</label>
              <select value={filterFolderId} onChange={e => setFilterFolderId(e.target.value)}>
                <option value="all">Tất cả</option>
                {foldersForFilter.map(folder => (
                  <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {filteredPassages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📖</div>
            <h3>Chưa có bài đọc nào</h3>
            <p>Vui lòng thêm bài đọc ở tab Quản Lí</p>
          </div>
        ) : (
          <div className="passage-grid">
            {filteredPassages.map(passage => (
              <div key={passage.id} className="passage-card" onClick={() => startPractice(passage)}>
                <div className="passage-card-header">
                  <span className="level-badge">{passage.jlptLevel}</span>
                  <span className="question-count">{passage.questions.length} câu</span>
                </div>
                <h3>{passage.title}</h3>
                <p className="passage-preview">{passage.content.substring(0, 100)}...</p>
                <button className="btn btn-start">
                  Bắt đầu <ChevronRight size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <style>{`
          .reading-practice-page {
            padding: 1rem;
            max-width: 900px;
            margin: 0 auto;
          }

          .page-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
          }

          .page-header h2 {
            flex: 1;
            margin: 0;
          }

          .filter-section {
            background: var(--card-bg, #fff);
            border: 1px solid var(--border-color, #e2e8f0);
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
          }

          .filter-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
          }

          .filter-row:last-child {
            margin-bottom: 0;
          }

          .filter-row label {
            min-width: 70px;
            font-weight: 500;
          }

          .filter-row select {
            flex: 1;
            padding: 0.5rem;
            border: 1px solid var(--border-color, #ddd);
            border-radius: 6px;
          }

          .passage-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1rem;
          }

          .passage-card {
            background: var(--card-bg, #fff);
            border: 1px solid var(--border-color, #e2e8f0);
            border-radius: 12px;
            padding: 1.25rem;
            cursor: pointer;
            transition: all 0.2s;
          }

          .passage-card:hover {
            border-color: var(--primary-color, #4a90d9);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }

          .passage-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
          }

          .level-badge {
            background: var(--primary-color, #4a90d9);
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
          }

          .question-count {
            font-size: 0.875rem;
            color: var(--text-secondary, #666);
          }

          .passage-card h3 {
            margin: 0 0 0.5rem;
            font-size: 1.1rem;
          }

          .passage-preview {
            color: var(--text-secondary, #666);
            font-size: 0.9rem;
            margin-bottom: 1rem;
            line-height: 1.5;
          }

          .btn-start {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.75rem;
            background: var(--primary-color, #4a90d9);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
          }

          .btn-start:hover {
            opacity: 0.9;
          }

          .empty-state {
            text-align: center;
            padding: 3rem;
          }

          .empty-state-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }

          .btn-icon {
            padding: 0.5rem;
            background: none;
            border: 1px solid var(--border-color, #ddd);
            border-radius: 8px;
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }

  // Practice view
  const passage = viewState.passage;
  const currentQuestion = passage.questions[currentQuestionIndex];
  const selectedAnswer = selectedAnswers[currentQuestionIndex];
  const score = calculateScore();

  // Completed view
  if (isCompleted) {
    return (
      <div className="reading-practice-page">
        <div className="completion-screen">
          <div className="completion-icon">
            {score.percent >= 80 ? '🎉' : score.percent >= 50 ? '👍' : '💪'}
          </div>
          <h2>Hoàn thành!</h2>
          <div className="score-display">
            <span className="score-number">{score.correct}/{score.total}</span>
            <span className="score-percent">{score.percent}%</span>
          </div>
          <p className="score-message">
            {score.percent >= 80 ? 'Xuất sắc! Bạn đã hiểu rất tốt bài đọc.' :
             score.percent >= 50 ? 'Khá tốt! Hãy tiếp tục luyện tập.' :
             'Cần cố gắng hơn. Hãy đọc lại bài và thử lại!'}
          </p>
          <div className="completion-actions">
            <button className="btn btn-secondary" onClick={handleRestart}>
              <RotateCcw size={18} /> Làm lại
            </button>
            <button className="btn btn-primary" onClick={() => setViewState({ type: 'select' })}>
              Chọn bài khác
            </button>
          </div>
        </div>

        <style>{`
          .reading-practice-page {
            padding: 1rem;
            max-width: 800px;
            margin: 0 auto;
          }

          .completion-screen {
            text-align: center;
            padding: 3rem 1rem;
          }

          .completion-icon {
            font-size: 5rem;
            margin-bottom: 1rem;
          }

          .score-display {
            display: flex;
            align-items: baseline;
            justify-content: center;
            gap: 1rem;
            margin: 1.5rem 0;
          }

          .score-number {
            font-size: 3rem;
            font-weight: 700;
            color: var(--primary-color, #4a90d9);
          }

          .score-percent {
            font-size: 1.5rem;
            color: var(--text-secondary, #666);
          }

          .score-message {
            font-size: 1.1rem;
            color: var(--text-secondary, #666);
            margin-bottom: 2rem;
          }

          .completion-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="reading-practice-page">
      <div className="page-header">
        <button className="btn btn-back" onClick={() => setViewState({ type: 'select' })}>
          ← Quay lại
        </button>
        <h2>{passage.title}</h2>
        <span className="level-badge">{passage.jlptLevel}</span>
      </div>

      {/* Progress */}
      <div className="practice-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${((currentQuestionIndex + 1) / passage.questions.length) * 100}%` }} />
        </div>
        <span className="progress-text">Câu {currentQuestionIndex + 1}/{passage.questions.length}</span>
      </div>

      {/* Passage content */}
      <div className="passage-content">
        <div className="passage-text">
          {passage.content}
        </div>
        <button className="btn btn-speak" onClick={() => speakJapanese(passage.content)}>
          <Volume2 size={18} /> Nghe đọc
        </button>
      </div>

      {/* Question */}
      <div className="question-section">
        <h3 className="question-text">{currentQuestion.question}</h3>

        <div className="answers-list">
          {currentQuestion.answers.map((answer, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrect = answer.isCorrect;
            let className = 'answer-option';
            if (showResults) {
              if (isCorrect) className += ' correct';
              else if (isSelected && !isCorrect) className += ' incorrect';
            } else if (isSelected) {
              className += ' selected';
            }

            return (
              <button
                key={idx}
                className={className}
                onClick={() => handleSelectAnswer(idx)}
                disabled={showResults}
              >
                <span className="answer-letter">{String.fromCharCode(65 + idx)}</span>
                <span className="answer-text">{answer.text}</span>
                {showResults && isCorrect && <CheckCircle size={20} className="result-icon correct" />}
                {showResults && isSelected && !isCorrect && <XCircle size={20} className="result-icon incorrect" />}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showResults && currentQuestion.explanation && (
          <div className="explanation">
            <strong>Giải thích:</strong> {currentQuestion.explanation}
          </div>
        )}

        {/* Actions */}
        <div className="question-actions">
          {!showResults ? (
            <button
              className="btn btn-primary"
              onClick={handleShowResult}
              disabled={selectedAnswer === undefined}
            >
              Kiểm tra
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleNextQuestion}>
              {currentQuestionIndex < passage.questions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
            </button>
          )}
        </div>
      </div>

      <style>{`
        .reading-practice-page {
          padding: 1rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .page-header h2 {
          flex: 1;
          margin: 0;
          font-size: 1.25rem;
        }

        .level-badge {
          background: var(--primary-color, #4a90d9);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .practice-progress {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background: var(--border-color, #e2e8f0);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--primary-color, #4a90d9);
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 0.875rem;
          color: var(--text-secondary, #666);
          white-space: nowrap;
        }

        .passage-content {
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .passage-text {
          font-size: 1.1rem;
          line-height: 1.8;
          white-space: pre-wrap;
          margin-bottom: 1rem;
        }

        .btn-speak {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--bg-secondary, #f1f5f9);
          border: 1px solid var(--border-color, #ddd);
          border-radius: 8px;
          cursor: pointer;
        }

        .btn-speak:hover {
          background: var(--primary-color, #4a90d9);
          color: white;
          border-color: var(--primary-color, #4a90d9);
        }

        .question-section {
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .question-text {
          margin: 0 0 1.5rem;
          font-size: 1.1rem;
        }

        .answers-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .answer-option {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--bg-secondary, #f8f9fa);
          border: 2px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }

        .answer-option:hover:not(:disabled) {
          background: var(--bg-hover, #e2e8f0);
        }

        .answer-option.selected {
          border-color: var(--primary-color, #4a90d9);
          background: rgba(74, 144, 217, 0.1);
        }

        .answer-option.correct {
          border-color: var(--success-color, #22c55e);
          background: rgba(34, 197, 94, 0.1);
        }

        .answer-option.incorrect {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .answer-letter {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--border-color, #ddd);
          border-radius: 50%;
          font-weight: 600;
          flex-shrink: 0;
        }

        .answer-option.selected .answer-letter {
          background: var(--primary-color, #4a90d9);
          color: white;
        }

        .answer-option.correct .answer-letter {
          background: var(--success-color, #22c55e);
          color: white;
        }

        .answer-option.incorrect .answer-letter {
          background: #ef4444;
          color: white;
        }

        .answer-text {
          flex: 1;
        }

        .result-icon {
          flex-shrink: 0;
        }

        .result-icon.correct {
          color: var(--success-color, #22c55e);
        }

        .result-icon.incorrect {
          color: #ef4444;
        }

        .explanation {
          background: var(--bg-secondary, #f0f9ff);
          border-left: 4px solid var(--primary-color, #4a90d9);
          padding: 1rem;
          border-radius: 0 8px 8px 0;
          margin-bottom: 1.5rem;
        }

        .question-actions {
          display: flex;
          justify-content: center;
        }

        .question-actions .btn {
          min-width: 150px;
        }

        @media (max-width: 640px) {
          .passage-text {
            font-size: 1rem;
          }

          .question-text {
            font-size: 1rem;
          }

          .answer-option {
            padding: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
