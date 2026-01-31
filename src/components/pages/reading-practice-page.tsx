// Reading Practice Page - Premium UI with glassmorphism design

import { useState, useMemo } from 'react';
import { ChevronRight, CheckCircle, XCircle, RotateCcw, Filter, Volume2, BookOpen, ArrowLeft, Sparkles } from 'lucide-react';
import type { JLPTLevel } from '../../types/flashcard';
import type { ReadingPassage } from '../../types/reading';
import type { ReadingPracticePageProps, ViewState } from './reading-practice/reading-practice-types';
import { JLPT_LEVELS } from './reading-practice/reading-practice-constants';

// Level theme configurations
const LEVEL_THEMES: Record<JLPTLevel, { gradient: string; glow: string; icon: string }> = {
  N5: { gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', glow: 'rgba(16, 185, 129, 0.4)', icon: '🌱' },
  N4: { gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', glow: 'rgba(59, 130, 246, 0.4)', icon: '📘' },
  N3: { gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', glow: 'rgba(139, 92, 246, 0.4)', icon: '📖' },
  N2: { gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', glow: 'rgba(245, 158, 11, 0.4)', icon: '📚' },
  N1: { gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', glow: 'rgba(239, 68, 68, 0.4)', icon: '👑' },
};

export function ReadingPracticePage({
  passages,
  folders,
  getFoldersByLevel,
  getPassagesByFolder: _getPassagesByFolder,
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
        {/* Premium Header */}
        <div className="premium-header">
          <div className="header-content">
            <div className="header-icon">
              <BookOpen size={28} />
              <Sparkles className="sparkle sparkle-1" size={12} />
              <Sparkles className="sparkle sparkle-2" size={10} />
            </div>
            <div className="header-text">
              <h1>Luyện Đọc Hiểu</h1>
              <p>Nâng cao kỹ năng đọc tiếng Nhật</p>
            </div>
          </div>
          <button className={`filter-toggle ${showFilter ? 'active' : ''}`} onClick={() => setShowFilter(!showFilter)}>
            <Filter size={20} />
          </button>
        </div>

        {/* Filter Section */}
        {showFilter && (
          <div className="filter-section">
            <div className="filter-row">
              <label>Cấp độ:</label>
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

        {/* Passage Grid */}
        {filteredPassages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📖</div>
            <h3>Chưa có bài đọc nào</h3>
            <p>Vui lòng thêm bài đọc ở tab Quản Lí</p>
          </div>
        ) : (
          <div className="passage-grid">
            {filteredPassages.map((passage, idx) => {
              const theme = LEVEL_THEMES[passage.jlptLevel];
              return (
                <div
                  key={passage.id}
                  className="passage-card"
                  onClick={() => startPractice(passage)}
                  style={{ '--card-delay': `${idx * 0.05}s`, '--level-gradient': theme.gradient, '--level-glow': theme.glow } as React.CSSProperties}
                >
                  <div className="card-header">
                    <span className="level-badge" style={{ background: theme.gradient }}>
                      {passage.jlptLevel}
                    </span>
                    <span className="question-count">{passage.questions.length} câu hỏi</span>
                  </div>
                  <h3 className="passage-title">{passage.title}</h3>
                  <p className="passage-preview">{passage.content.substring(0, 120)}...</p>
                  <div className="card-action">
                    <span>Bắt đầu</span>
                    <ChevronRight size={18} />
                  </div>
                  <div className="card-shine" />
                </div>
              );
            })}
          </div>
        )}

        <style>{`
          .reading-practice-page {
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
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
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
            background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .header-text p {
            margin: 0.25rem 0 0;
            font-size: 0.875rem;
            color: rgba(255, 255, 255, 0.5);
          }

          .filter-toggle {
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

          .filter-toggle:hover,
          .filter-toggle.active {
            background: rgba(59, 130, 246, 0.2);
            border-color: rgba(59, 130, 246, 0.5);
            color: #3b82f6;
          }

          /* Filter Section */
          .filter-section {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 1.25rem;
            margin-bottom: 1.5rem;
            animation: slideDown 0.3s ease;
          }

          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .filter-row {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
          }

          .filter-row:last-child { margin-bottom: 0; }

          .filter-row label {
            min-width: 70px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.7);
          }

          .filter-row select {
            flex: 1;
            padding: 0.75rem 1rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            color: white;
            font-size: 0.9rem;
          }

          .filter-row select option {
            background: #1a1a2e;
            color: white;
          }

          /* Passage Grid */
          .passage-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 1.25rem;
          }

          .passage-card {
            position: relative;
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 20px;
            padding: 1.5rem;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            animation: cardAppear 0.5s ease backwards;
            animation-delay: var(--card-delay);
            overflow: hidden;
          }

          @keyframes cardAppear {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .passage-card:hover {
            transform: translateY(-4px);
            border-color: rgba(255, 255, 255, 0.15);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 0 0 40px var(--level-glow);
          }

          .passage-card:hover .card-shine {
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

          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
          }

          .level-badge {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.4rem 0.8rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            color: white;
          }

          .level-icon { font-size: 0.9rem; }

          .question-count {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.5);
          }

          .passage-title {
            margin: 0 0 0.75rem;
            font-size: 1.15rem;
            font-weight: 600;
            color: white;
            line-height: 1.4;
          }

          .passage-preview {
            color: rgba(255, 255, 255, 0.5);
            font-size: 0.9rem;
            line-height: 1.6;
            margin: 0 0 1.25rem;
          }

          .card-action {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.75rem;
            background: var(--level-gradient);
            border-radius: 12px;
            color: white;
            font-weight: 500;
            font-size: 0.9rem;
            transition: all 0.3s ease;
          }

          .passage-card:hover .card-action {
            box-shadow: 0 4px 20px var(--level-glow);
          }

          /* Empty State */
          .empty-state {
            text-align: center;
            padding: 4rem 2rem;
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 20px;
          }

          .empty-icon {
            font-size: 4rem;
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
            .reading-practice-page { padding: 1rem; }
            .premium-header { padding: 1rem; flex-wrap: wrap; gap: 1rem; }
            .header-text h1 { font-size: 1.25rem; }
            .passage-grid { grid-template-columns: 1fr; }
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
  const theme = LEVEL_THEMES[passage.jlptLevel];

  // Completed view
  if (isCompleted) {
    return (
      <div className="reading-practice-page">
        <div className="completion-screen">
          <div className="completion-glow" />
          <div className="completion-content">
            <div className="completion-icon">
              {score.percent >= 80 ? '🎉' : score.percent >= 50 ? '👍' : '💪'}
            </div>
            <h2>Hoàn thành!</h2>
            <div className="score-display">
              <div className="score-circle" style={{ '--progress': `${score.percent}%`, '--color': theme.gradient } as React.CSSProperties}>
                <span className="score-number">{score.percent}%</span>
              </div>
              <div className="score-detail">
                <span className="correct">{score.correct} đúng</span>
                <span className="total">/ {score.total} câu</span>
              </div>
            </div>
            <p className="score-message">
              {score.percent >= 80 ? 'Xuất sắc! Bạn đã hiểu rất tốt bài đọc.' :
               score.percent >= 50 ? 'Khá tốt! Hãy tiếp tục luyện tập.' :
               'Cần cố gắng hơn. Hãy đọc lại bài và thử lại!'}
            </p>
            <div className="completion-actions">
              <button className="btn btn-glass" onClick={handleRestart}>
                <RotateCcw size={18} /> Làm lại
              </button>
              <button className="btn btn-primary" onClick={() => setViewState({ type: 'select' })}>
                Chọn bài khác
              </button>
            </div>
          </div>
        </div>

        <style>{`
          .reading-practice-page {
            min-height: 100vh;
            background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
          }

          .completion-screen {
            position: relative;
            width: 100%;
            max-width: 480px;
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 3rem 2rem;
            text-align: center;
            overflow: hidden;
          }

          .completion-glow {
            position: absolute;
            top: -50%;
            left: 50%;
            transform: translateX(-50%);
            width: 300px;
            height: 300px;
            background: var(--color, linear-gradient(135deg, #3b82f6, #8b5cf6));
            border-radius: 50%;
            filter: blur(80px);
            opacity: 0.3;
            animation: pulse 3s ease-in-out infinite;
          }

          @keyframes pulse {
            0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.3; }
            50% { transform: translateX(-50%) scale(1.1); opacity: 0.4; }
          }

          .completion-content {
            position: relative;
            z-index: 1;
          }

          .completion-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            animation: bounce 1s ease infinite;
          }

          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }

          .completion-screen h2 {
            margin: 0 0 1.5rem;
            font-size: 1.75rem;
            font-weight: 700;
            color: white;
          }

          .score-display {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }

          .score-circle {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: conic-gradient(var(--color) var(--progress), rgba(255, 255, 255, 0.1) 0);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          }

          .score-circle::before {
            content: '';
            position: absolute;
            inset: 8px;
            background: #1a1a2e;
            border-radius: 50%;
          }

          .score-number {
            position: relative;
            z-index: 1;
            font-size: 2rem;
            font-weight: 700;
            color: white;
          }

          .score-detail {
            display: flex;
            gap: 0.5rem;
            font-size: 1.1rem;
          }

          .score-detail .correct { color: #22c55e; font-weight: 600; }
          .score-detail .total { color: rgba(255, 255, 255, 0.5); }

          .score-message {
            color: rgba(255, 255, 255, 0.7);
            font-size: 1rem;
            margin-bottom: 2rem;
            line-height: 1.5;
          }

          .completion-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
          }

          .btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.875rem 1.5rem;
            border-radius: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            border: none;
          }

          .btn-glass {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .btn-glass:hover {
            background: rgba(255, 255, 255, 0.15);
          }

          .btn-primary {
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            color: white;
          }

          .btn-primary:hover {
            box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
            transform: translateY(-2px);
          }
        `}</style>
      </div>
    );
  }

  // Practice view with questions
  return (
    <div className="reading-practice-page">
      {/* Practice Header */}
      <div className="practice-header">
        <button className="btn-back" onClick={() => setViewState({ type: 'select' })}>
          <ArrowLeft size={20} />
        </button>
        <div className="header-info">
          <h2>{passage.title}</h2>
          <span className="level-tag" style={{ background: theme.gradient }}>{passage.jlptLevel}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="practice-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${((currentQuestionIndex + 1) / passage.questions.length) * 100}%`, background: theme.gradient }} />
        </div>
        <span className="progress-text">Câu {currentQuestionIndex + 1}/{passage.questions.length}</span>
      </div>

      {/* Passage Content */}
      <div className="passage-content">
        <div className="passage-text">{passage.content}</div>
        <button className="btn-speak" onClick={() => speakJapanese(passage.content)}>
          <Volume2 size={18} /> Nghe đọc
        </button>
      </div>

      {/* Question Section */}
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
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
          padding: 1.5rem;
        }

        .practice-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .btn-back {
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

        .btn-back:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .header-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-info h2 {
          margin: 0;
          font-size: 1.25rem;
          color: white;
          font-weight: 600;
        }

        .level-tag {
          padding: 0.35rem 0.75rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          color: white;
        }

        .practice-progress {
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

        .passage-content {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .passage-text {
          font-size: 1.1rem;
          line-height: 2;
          white-space: pre-wrap;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 1rem;
        }

        .btn-speak {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-speak:hover {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.5);
          color: #3b82f6;
        }

        .question-section {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 1.5rem;
        }

        .question-text {
          margin: 0 0 1.5rem;
          font-size: 1.1rem;
          font-weight: 500;
          color: white;
          line-height: 1.6;
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
          padding: 1rem 1.25rem;
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          cursor: pointer;
          text-align: left;
          transition: all 0.3s ease;
          color: rgba(255, 255, 255, 0.9);
        }

        .answer-option:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .answer-option.selected {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }

        .answer-option.correct {
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.1);
        }

        .answer-option.incorrect {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .answer-letter {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .answer-option.selected .answer-letter {
          background: #3b82f6;
          color: white;
        }

        .answer-option.correct .answer-letter {
          background: #22c55e;
          color: white;
        }

        .answer-option.incorrect .answer-letter {
          background: #ef4444;
          color: white;
        }

        .answer-text {
          flex: 1;
          line-height: 1.5;
        }

        .result-icon {
          flex-shrink: 0;
        }

        .result-icon.correct { color: #22c55e; }
        .result-icon.incorrect { color: #ef4444; }

        .explanation {
          background: rgba(59, 130, 246, 0.1);
          border-left: 4px solid #3b82f6;
          padding: 1rem 1.25rem;
          border-radius: 0 12px 12px 0;
          margin-bottom: 1.5rem;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.6;
        }

        .explanation strong {
          color: #3b82f6;
        }

        .question-actions {
          display: flex;
          justify-content: center;
        }

        .btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.875rem 2rem;
          border-radius: 12px;
          font-weight: 500;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
          min-width: 160px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
          transform: translateY(-2px);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .reading-practice-page { padding: 1rem; }
          .header-info h2 { font-size: 1rem; }
          .passage-text { font-size: 1rem; line-height: 1.8; }
          .question-text { font-size: 1rem; }
          .answer-option { padding: 0.875rem 1rem; }
        }
      `}</style>
    </div>
  );
}
