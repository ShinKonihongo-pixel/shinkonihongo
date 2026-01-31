// Reading Practice Page - Premium UI with glassmorphism design

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronRight, CheckCircle, XCircle, RotateCcw, Filter, Volume2, VolumeX, BookOpen, ArrowLeft, Sparkles, Pin, PinOff, ChevronDown, ChevronUp, Trophy, Target, Clock, Zap, Pause, Play, Square } from 'lucide-react';
import type { JLPTLevel } from '../../types/flashcard';
import type { ReadingPassage } from '../../types/reading';
import type { ReadingPracticePageProps, ViewState } from './reading-practice/reading-practice-types';
import { JLPT_LEVELS } from './reading-practice/reading-practice-constants';
import { ReadingSettingsModal, ReadingSettingsButton } from '../ui/reading-settings-modal';
import { FuriganaText } from '../ui/furigana-text';
import { useReadingSettings } from '../../contexts/reading-settings-context';

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

  // Mobile pin state - must be declared at top level (Rules of Hooks)
  const [isPinned, setIsPinned] = useState(false);
  const [isQuestionCollapsed, setIsQuestionCollapsed] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Audio playback state
  const [audioState, setAudioState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 900);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Audio control functions
  const startSpeaking = useCallback((text: string) => {
    // Cancel any existing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.85;

    utterance.onend = () => setAudioState('idle');
    utterance.onerror = () => setAudioState('idle');

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
    setAudioState('playing');
  }, []);

  const pauseSpeaking = useCallback(() => {
    if (speechSynthesis.speaking) {
      speechSynthesis.pause();
      setAudioState('paused');
    }
  }, []);

  const resumeSpeaking = useCallback(() => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      setAudioState('playing');
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    speechSynthesis.cancel();
    setAudioState('idle');
  }, []);

  const handleAudioToggle = useCallback((text: string) => {
    if (audioState === 'idle') {
      startSpeaking(text);
    } else if (audioState === 'playing') {
      stopSpeaking();
    } else if (audioState === 'paused') {
      startSpeaking(text); // Start from beginning
    }
  }, [audioState, startSpeaking, stopSpeaking]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

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

  // Practice view with split layout
  const { settings } = useReadingSettings();

  return (
    <div className="reading-practice-page practice-mode">
      {/* Settings Modal */}
      <ReadingSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* Compact Practice Header */}
      <header className="practice-header-compact">
        <button className="btn-back-compact" onClick={() => { stopSpeaking(); setViewState({ type: 'select' }); }}>
          <ArrowLeft size={18} />
        </button>
        <div className="header-center">
          <span className="level-pill" style={{ background: theme.gradient }}>
            {passage.jlptLevel}
          </span>
          <h1 className="header-title-compact">{passage.title}</h1>
          <span className="progress-indicator">
            {Object.keys(selectedAnswers).length}/{passage.questions.length}
          </span>
        </div>
        <ReadingSettingsButton onClick={() => setShowSettingsModal(true)} />
      </header>

      {/* Progress Section */}
      <div className="progress-section-pro">
        <div className="progress-bar-pro">
          <div
            className="progress-fill-pro"
            style={{
              width: `${((currentQuestionIndex + 1) / passage.questions.length) * 100}%`,
              background: theme.gradient
            }}
          />
        </div>
        <div className="progress-steps">
          {passage.questions.map((_, idx) => (
            <button
              key={idx}
              className={`progress-step ${idx === currentQuestionIndex ? 'active' : ''} ${selectedAnswers[idx] !== undefined ? 'answered' : ''}`}
              onClick={() => { setCurrentQuestionIndex(idx); setShowResults(false); }}
              style={{ '--step-color': theme.gradient } as React.CSSProperties}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Pinned Question Header */}
      {isMobile && isPinned && (
        <div className={`pinned-question-header ${isQuestionCollapsed ? 'collapsed' : ''}`}>
          <div className="pinned-header-row" onClick={() => setIsQuestionCollapsed(!isQuestionCollapsed)}>
            <span className="pinned-label">
              <Pin size={14} /> Câu {currentQuestionIndex + 1}
            </span>
            <div className="pinned-actions">
              <button className="btn-icon-sm" onClick={(e) => { e.stopPropagation(); setIsPinned(false); }}>
                <PinOff size={14} />
              </button>
              {isQuestionCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </div>
          </div>
          {!isQuestionCollapsed && (
            <div className="pinned-content">
              <p className="pinned-question-text">{currentQuestion.question}</p>
              <div className="pinned-answers">
                {currentQuestion.answers.map((answer, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = answer.isCorrect;
                  let className = 'pinned-answer';
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
                      <span className="answer-letter-mini">{String.fromCharCode(65 + idx)}</span>
                      <span className="answer-text-mini">{answer.text}</span>
                      {showResults && isCorrect && <CheckCircle size={14} className="result-icon correct" />}
                      {showResults && isSelected && !isCorrect && <XCircle size={14} className="result-icon incorrect" />}
                    </button>
                  );
                })}
              </div>
              <div className="pinned-action-buttons">
                {!showResults ? (
                  <button className="btn-check-pinned" onClick={handleShowResult} disabled={selectedAnswer === undefined}>
                    Kiểm tra
                  </button>
                ) : (
                  <button className="btn-next-pinned" onClick={handleNextQuestion}>
                    {currentQuestionIndex < passage.questions.length - 1 ? 'Tiếp' : 'Kết quả'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Split Layout Container */}
      <div className={`split-layout ${isMobile && isPinned ? 'with-pinned' : ''}`}>
        {/* Left Panel - Reading Content (Wider) */}
        <div className="content-panel" ref={contentRef}>
          <div className="content-card">
            <div className="content-header">
              <div className="content-icon">
                <BookOpen size={20} />
              </div>
              <h2>Nội dung bài đọc</h2>
              <div className="audio-controls">
                {/* Main Play/Stop button */}
                <button
                  className={`btn-audio ${audioState !== 'idle' ? 'active' : ''}`}
                  onClick={() => handleAudioToggle(passage.content)}
                  title={audioState === 'idle' ? 'Nghe' : 'Dừng'}
                >
                  {audioState === 'idle' ? <Volume2 size={18} /> : <Square size={16} />}
                </button>
                {/* Pause/Resume button - only show when playing or paused */}
                {audioState !== 'idle' && (
                  <button
                    className={`btn-audio ${audioState === 'paused' ? 'paused' : ''}`}
                    onClick={() => audioState === 'playing' ? pauseSpeaking() : resumeSpeaking()}
                    title={audioState === 'playing' ? 'Tạm dừng' : 'Tiếp tục'}
                  >
                    {audioState === 'playing' ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                )}
              </div>
            </div>
            <div className="content-body">
              <div className="passage-text-pro" style={{ fontSize: `${settings.fontSize}rem` }}>
                <FuriganaText text={passage.content} />
              </div>
            </div>
            <div className="content-footer">
              <div className="word-count">
                <Clock size={14} />
                <span>~{Math.ceil(passage.content.length / 400)} phút đọc</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Questions (Narrower, Scrollable) */}
        <div className="question-panel">
          <div className="question-card">
            {/* Question Panel Header with Pin Button (Mobile) */}
            <div className="question-panel-header">
              <div className="question-number-badge" style={{ background: theme.gradient }}>
                Câu {currentQuestionIndex + 1}/{passage.questions.length}
              </div>
              {isMobile && !isPinned && (
                <button className="btn-pin" onClick={() => setIsPinned(true)} title="Ghim câu hỏi">
                  <Pin size={16} />
                  <span>Ghim</span>
                </button>
              )}
            </div>

            {/* Question Content */}
            <div className="question-content-scroll">
              <h3 className="question-text-pro" style={{ fontSize: `${settings.fontSize * 1.05}rem` }}>
                <FuriganaText text={currentQuestion.question} />
              </h3>

              <div className="answers-grid">
                {currentQuestion.answers.map((answer, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = answer.isCorrect;
                  let className = 'answer-card';
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
                      style={{ fontSize: `${settings.fontSize * 0.95}rem` }}
                    >
                      <div className="answer-indicator">
                        <span className="answer-letter-pro">{String.fromCharCode(65 + idx)}</span>
                        {showResults && isCorrect && <CheckCircle size={18} className="check-icon" />}
                        {showResults && isSelected && !isCorrect && <XCircle size={18} className="x-icon" />}
                      </div>
                      <span className="answer-content"><FuriganaText text={answer.text} /></span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {showResults && currentQuestion.explanation && (
                <div className="explanation-card">
                  <div className="explanation-header">
                    <Sparkles size={16} />
                    <span>Giải thích</span>
                  </div>
                  <p>{currentQuestion.explanation}</p>
                </div>
              )}
            </div>

            {/* Question Actions */}
            <div className="question-actions-pro">
              {!showResults ? (
                <button
                  className="btn-action-pro btn-check"
                  onClick={handleShowResult}
                  disabled={selectedAnswer === undefined}
                  style={{ '--btn-gradient': theme.gradient } as React.CSSProperties}
                >
                  <Target size={18} />
                  Kiểm tra đáp án
                </button>
              ) : (
                <button
                  className="btn-action-pro btn-next"
                  onClick={handleNextQuestion}
                  style={{ '--btn-gradient': theme.gradient } as React.CSSProperties}
                >
                  {currentQuestionIndex < passage.questions.length - 1 ? (
                    <>Câu tiếp theo <ChevronRight size={18} /></>
                  ) : (
                    <><Trophy size={18} /> Xem kết quả</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .reading-practice-page.practice-mode {
          height: 100vh;
          max-height: 100vh;
          background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* Compact Practice Header */
        .practice-header-compact {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0.875rem;
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          margin-bottom: 0.75rem;
        }

        .btn-back-compact {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.03);
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .btn-back-compact:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white;
        }

        .header-center {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          min-width: 0;
        }

        .level-pill {
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 600;
          color: white;
          flex-shrink: 0;
        }

        .header-title-compact {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 500;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          min-width: 0;
        }

        .progress-indicator {
          padding: 0.2rem 0.5rem;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
          flex-shrink: 0;
        }

        /* Progress Section */
        .progress-section-pro {
          margin-bottom: 1rem;
        }

        .progress-bar-pro {
          height: 4px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 0.75rem;
        }

        .progress-fill-pro {
          height: 100%;
          border-radius: 2px;
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .progress-steps {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .progress-step {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.03);
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .progress-step:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white;
        }

        .progress-step.active {
          background: var(--step-color);
          border-color: transparent;
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .progress-step.answered {
          background: rgba(34, 197, 94, 0.2);
          border-color: rgba(34, 197, 94, 0.4);
          color: #22c55e;
        }

        .progress-step.active.answered {
          background: var(--step-color);
          color: white;
        }

        /* Split Layout */
        .split-layout {
          flex: 1;
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 1.25rem;
          min-height: 0;
          overflow: hidden;
        }

        .split-layout.with-pinned {
          margin-top: 0;
        }

        /* Content Panel (Left - Wider) */
        .content-panel {
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }

        .content-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          overflow: hidden;
          min-height: 0;
        }

        .content-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .content-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border-radius: 10px;
          color: white;
        }

        .content-header h2 {
          margin: 0;
          flex: 1;
          font-size: 0.95rem;
          font-weight: 600;
          color: white;
        }

        .audio-controls {
          display: flex;
          gap: 0.4rem;
        }

        .btn-audio {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-audio:hover {
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.4);
          color: #3b82f6;
        }

        .btn-audio.active {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.4);
          color: #ef4444;
        }

        .btn-audio.active:hover {
          background: rgba(239, 68, 68, 0.25);
        }

        .btn-audio.paused {
          background: rgba(34, 197, 94, 0.15);
          border-color: rgba(34, 197, 94, 0.4);
          color: #22c55e;
        }

        .btn-audio.paused:hover {
          background: rgba(34, 197, 94, 0.25);
        }

        .content-body {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
        }

        .passage-text-pro {
          font-size: 1.1rem;
          line-height: 2.1;
          white-space: pre-wrap;
          color: rgba(255, 255, 255, 0.9);
        }

        .content-footer {
          padding: 0.75rem 1.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .word-count {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.4);
        }

        /* Question Panel (Right - Narrower) */
        .question-panel {
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }

        .question-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          overflow: hidden;
          min-height: 0;
        }

        .question-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .question-number-badge {
          padding: 0.4rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          color: white;
        }

        .btn-pin {
          display: none;
        }

        .question-content-scroll {
          flex: 1;
          padding: 1.25rem;
          overflow-y: auto;
        }

        .question-text-pro {
          margin: 0 0 1.25rem;
          font-size: 1.05rem;
          font-weight: 500;
          color: white;
          line-height: 1.7;
        }

        .answers-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .answer-card {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 2px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          cursor: pointer;
          text-align: left;
          transition: all 0.3s ease;
          color: rgba(255, 255, 255, 0.85);
        }

        .answer-card:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateX(4px);
        }

        .answer-card.selected {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }

        .answer-card.correct {
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.1);
        }

        .answer-card.incorrect {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .answer-indicator {
          position: relative;
          flex-shrink: 0;
        }

        .answer-letter-pro {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .answer-card.selected .answer-letter-pro {
          background: #3b82f6;
          color: white;
        }

        .answer-card.correct .answer-letter-pro {
          background: #22c55e;
          color: white;
        }

        .answer-card.incorrect .answer-letter-pro {
          background: #ef4444;
          color: white;
        }

        .check-icon, .x-icon {
          position: absolute;
          top: -6px;
          right: -6px;
          background: white;
          border-radius: 50%;
        }

        .check-icon { color: #22c55e; }
        .x-icon { color: #ef4444; }

        .answer-content {
          flex: 1;
          line-height: 1.6;
          padding-top: 0.25rem;
        }

        /* Explanation Card */
        .explanation-card {
          margin-top: 1.25rem;
          padding: 1rem;
          background: rgba(59, 130, 246, 0.08);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 14px;
          animation: fadeInUp 0.4s ease;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .explanation-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          color: #3b82f6;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .explanation-card p {
          margin: 0;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.7;
          font-size: 0.95rem;
        }

        /* Question Actions */
        .question-actions-pro {
          padding: 1rem 1.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .btn-action-pro {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          border-radius: 14px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
        }

        .btn-check {
          background: var(--btn-gradient);
          color: white;
        }

        .btn-check:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
        }

        .btn-check:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-next {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
        }

        .btn-next:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(34, 197, 94, 0.4);
        }

        /* Pinned Question Header (Mobile) */
        .pinned-question-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(15, 15, 26, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          margin-bottom: 1rem;
          overflow: hidden;
          animation: slideDown 0.3s ease;
        }

        .pinned-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          cursor: pointer;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .pinned-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: #3b82f6;
          font-size: 0.9rem;
        }

        .pinned-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .btn-icon-sm {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border: none;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-icon-sm:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .pinned-content {
          padding: 1rem;
        }

        .pinned-question-text {
          margin: 0 0 0.75rem;
          font-size: 0.95rem;
          font-weight: 500;
          color: white;
          line-height: 1.5;
        }

        .pinned-answers {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .pinned-answer {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.6rem 0.8rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.85rem;
        }

        .pinned-answer:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.06);
        }

        .pinned-answer.selected {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }

        .pinned-answer.correct {
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.1);
        }

        .pinned-answer.incorrect {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .answer-letter-mini {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.75rem;
          flex-shrink: 0;
        }

        .pinned-answer.selected .answer-letter-mini {
          background: #3b82f6;
          color: white;
        }

        .pinned-answer.correct .answer-letter-mini {
          background: #22c55e;
          color: white;
        }

        .pinned-answer.incorrect .answer-letter-mini {
          background: #ef4444;
          color: white;
        }

        .answer-text-mini {
          flex: 1;
          line-height: 1.4;
        }

        .pinned-action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .btn-check-pinned, .btn-next-pinned {
          flex: 1;
          padding: 0.6rem;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-check-pinned {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
        }

        .btn-check-pinned:disabled {
          opacity: 0.5;
        }

        .btn-next-pinned {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
        }

        .pinned-question-header.collapsed .pinned-header-row {
          border-bottom: none;
        }

        /* Mobile Responsive */
        @media (max-width: 900px) {
          .split-layout {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .btn-pin {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.5rem 0.8rem;
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 10px;
            color: #3b82f6;
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .btn-pin:hover {
            background: rgba(59, 130, 246, 0.2);
          }

          .header-title-section h1 {
            font-size: 1rem;
          }

          .header-stats {
            display: none;
          }

          .progress-steps {
            gap: 0.4rem;
          }

          .progress-step {
            width: 28px;
            height: 28px;
            font-size: 0.75rem;
          }

          .content-body {
            padding: 1rem;
          }

          .passage-text-pro {
            font-size: 1rem;
            line-height: 1.9;
          }

          .question-content-scroll {
            padding: 1rem;
          }

          .question-text-pro {
            font-size: 1rem;
          }

          .answer-card {
            padding: 0.875rem;
          }
        }

        @media (max-width: 480px) {
          .reading-practice-page.practice-mode {
            padding: 0.75rem;
          }

          .practice-header-pro {
            padding: 0.75rem;
          }

          .btn-back-pro {
            width: 36px;
            height: 36px;
          }

          .header-title-section h1 {
            font-size: 0.9rem;
          }

          .content-header h2 {
            font-size: 0.85rem;
          }

          .btn-audio {
            width: 32px;
            height: 32px;
          }

          .progress-step {
            width: 26px;
            height: 26px;
          }
        }
      `}</style>
    </div>
  );
}
