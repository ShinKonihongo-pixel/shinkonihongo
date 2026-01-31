// Reading Practice Page - Premium UI with glassmorphism design
// Flow: Level Selection → Folder List → Passage List → Practice

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  ChevronRight, CheckCircle, XCircle, RotateCcw, Volume2,
  BookOpen, ArrowLeft, Sparkles, ChevronDown, ChevronUp,
  Trophy, Target, Clock, Pause, Play, Square, FolderOpen,
  FileText, Award, Zap, Pin, PinOff
} from 'lucide-react';
import type { JLPTLevel } from '../../types/flashcard';
import type { ReadingPassage, ReadingFolder } from '../../types/reading';
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

// View modes
type ViewMode = 'level-select' | 'folder-list' | 'passage-list' | 'practice' | 'completed';

interface ReadingPracticePageProps {
  passages: ReadingPassage[];
  folders: ReadingFolder[];
  getFoldersByLevel: (level: JLPTLevel) => ReadingFolder[];
  getPassagesByFolder: (folderId: string) => ReadingPassage[];
  onGoHome?: () => void;
}

export function ReadingPracticePage({
  passages,
  folders,
  getFoldersByLevel,
  getPassagesByFolder,
}: ReadingPracticePageProps) {
  // IMPORTANT: All hooks must be called at the top level (Rules of Hooks)
  const { settings } = useReadingSettings();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('level-select');
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<ReadingFolder | null>(null);
  const [selectedPassage, setSelectedPassage] = useState<ReadingPassage | null>(null);

  // Practice state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  // Mobile pin state
  const [isPinned, setIsPinned] = useState(false);
  const [isQuestionCollapsed, setIsQuestionCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Settings modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Audio state
  const [audioState, setAudioState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 900);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  // Get data based on selections
  const levelFolders = useMemo(() => {
    if (!selectedLevel) return [];
    return getFoldersByLevel(selectedLevel);
  }, [selectedLevel, getFoldersByLevel]);

  const folderPassages = useMemo(() => {
    if (!selectedFolder) return [];
    return getPassagesByFolder(selectedFolder.id);
  }, [selectedFolder, getPassagesByFolder]);

  // Count by level
  const countByLevel = useMemo(() => {
    const counts: Record<JLPTLevel, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
    passages.forEach(p => { counts[p.jlptLevel]++; });
    return counts;
  }, [passages]);

  // Get folder count for level
  const getFolderCount = (level: JLPTLevel) => getFoldersByLevel(level).length;

  // Get passage count for folder
  const getPassageCount = (folderId: string) => getPassagesByFolder(folderId).length;

  // Navigation handlers
  const selectLevel = (level: JLPTLevel) => {
    setSelectedLevel(level);
    setViewMode('folder-list');
  };

  const selectFolder = (folder: ReadingFolder) => {
    setSelectedFolder(folder);
    setViewMode('passage-list');
  };

  const startPractice = (passage: ReadingPassage) => {
    setSelectedPassage(passage);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setViewMode('practice');
  };

  const goBack = () => {
    speechSynthesis.cancel();
    setAudioState('idle');

    if (viewMode === 'practice') {
      setViewMode('passage-list');
      setSelectedPassage(null);
    } else if (viewMode === 'completed') {
      setViewMode('passage-list');
      setSelectedPassage(null);
    } else if (viewMode === 'passage-list') {
      setViewMode('folder-list');
      setSelectedFolder(null);
    } else if (viewMode === 'folder-list') {
      setViewMode('level-select');
      setSelectedLevel(null);
    }
  };

  // Practice handlers
  const handleSelectAnswer = (answerIndex: number) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: answerIndex }));
  };

  const handleShowResult = () => {
    setShowResults(true);
  };

  const handleNextQuestion = () => {
    if (!selectedPassage) return;
    if (currentQuestionIndex < selectedPassage.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowResults(false);
    } else {
      setViewMode('completed');
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setViewMode('practice');
  };

  // Audio controls
  const startSpeaking = useCallback((text: string) => {
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
    } else {
      stopSpeaking();
    }
  }, [audioState, startSpeaking, stopSpeaking]);

  // Calculate score
  const calculateScore = () => {
    if (!selectedPassage) return { correct: 0, total: 0, percent: 0 };
    let correct = 0;
    selectedPassage.questions.forEach((q, idx) => {
      const selectedIdx = selectedAnswers[idx];
      if (selectedIdx !== undefined && q.answers[selectedIdx]?.isCorrect) {
        correct++;
      }
    });
    return {
      correct,
      total: selectedPassage.questions.length,
      percent: Math.round((correct / selectedPassage.questions.length) * 100),
    };
  };

  const score = calculateScore();
  const currentQuestion = selectedPassage?.questions[currentQuestionIndex];
  const selectedAnswer = selectedAnswers[currentQuestionIndex];
  const theme = selectedLevel ? LEVEL_THEMES[selectedLevel] : LEVEL_THEMES.N5;

  return (
    <div className="reading-practice-page">
      {/* Settings Modal */}
      <ReadingSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* Level Selection */}
      {viewMode === 'level-select' && (
        <>
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
            <ReadingSettingsButton onClick={() => setShowSettingsModal(true)} />
          </div>

          <p className="selection-hint">Chọn cấp độ để bắt đầu luyện đọc</p>

          <div className="level-grid">
            {JLPT_LEVELS.map((level, idx) => {
              const levelTheme = LEVEL_THEMES[level];
              const passageCount = countByLevel[level];
              const folderCount = getFolderCount(level);
              return (
                <button
                  key={level}
                  className="level-card"
                  onClick={() => selectLevel(level)}
                  style={{ '--card-delay': `${idx * 0.1}s`, '--level-gradient': levelTheme.gradient, '--level-glow': levelTheme.glow } as React.CSSProperties}
                >
                  <span className="level-icon">{levelTheme.icon}</span>
                  <span className="level-name">{level}</span>
                  <div className="level-stats">
                    <span>{folderCount} thư mục</span>
                    <span>•</span>
                    <span>{passageCount} bài</span>
                  </div>
                  <div className="card-shine" />
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Folder List */}
      {viewMode === 'folder-list' && selectedLevel && (
        <div className="list-view">
          <div className="nav-header">
            <button className="btn-back" onClick={goBack}>
              <ArrowLeft size={20} />
            </button>
            <span className="current-level" style={{ background: theme.gradient }}>
              {selectedLevel}
            </span>
            <h2 className="nav-title">Chọn thư mục</h2>
            <ReadingSettingsButton onClick={() => setShowSettingsModal(true)} />
          </div>

          {levelFolders.length === 0 ? (
            <div className="empty-state">
              <FolderOpen size={48} />
              <h3>Chưa có thư mục nào</h3>
              <p>Vui lòng thêm thư mục ở tab Quản Lí</p>
            </div>
          ) : (
            <div className="folder-grid">
              {levelFolders.map((folder, idx) => {
                const pCount = getPassageCount(folder.id);
                return (
                  <button
                    key={folder.id}
                    className="folder-card"
                    onClick={() => selectFolder(folder)}
                    style={{ '--card-delay': `${idx * 0.05}s` } as React.CSSProperties}
                  >
                    <div className="folder-icon">
                      <FolderOpen size={24} />
                    </div>
                    <div className="folder-info">
                      <span className="folder-name">{folder.name}</span>
                      <span className="folder-count">{pCount} bài đọc</span>
                    </div>
                    <ChevronRight size={20} className="folder-arrow" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Passage List */}
      {viewMode === 'passage-list' && selectedLevel && selectedFolder && (
        <div className="list-view">
          <div className="nav-header">
            <button className="btn-back" onClick={goBack}>
              <ArrowLeft size={20} />
            </button>
            <span className="current-level" style={{ background: theme.gradient }}>
              {selectedLevel}
            </span>
            <h2 className="nav-title">{selectedFolder.name}</h2>
            <ReadingSettingsButton onClick={() => setShowSettingsModal(true)} />
          </div>

          {folderPassages.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} />
              <h3>Chưa có bài đọc nào</h3>
              <p>Vui lòng thêm bài đọc ở tab Quản Lí</p>
            </div>
          ) : (
            <div className="passage-grid">
              {folderPassages.map((passage, idx) => (
                <div
                  key={passage.id}
                  className="passage-card"
                  onClick={() => startPractice(passage)}
                  style={{ '--card-delay': `${idx * 0.05}s`, '--level-glow': theme.glow } as React.CSSProperties}
                >
                  <div className="passage-header">
                    <div className="passage-meta">
                      <FileText size={16} />
                      <span>{passage.questions.length} câu hỏi</span>
                    </div>
                    <Clock size={14} />
                    <span className="read-time">~{Math.ceil(passage.content.length / 400)} phút</span>
                  </div>
                  <h3 className="passage-title">{passage.title}</h3>
                  <p className="passage-preview">{passage.content.substring(0, 100)}...</p>
                  <div className="passage-action">
                    <span>Bắt đầu</span>
                    <ChevronRight size={18} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Completed View */}
      {viewMode === 'completed' && selectedPassage && (
        <div className="completion-screen">
          <div className="completion-glow" style={{ '--color': theme.gradient } as React.CSSProperties} />
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
              <button className="btn btn-primary" onClick={goBack}>
                Chọn bài khác
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Practice View */}
      {viewMode === 'practice' && selectedPassage && currentQuestion && (
        <div className="practice-mode">
          {/* Compact Header */}
          <header className="practice-header">
            <button className="btn-back-sm" onClick={goBack}>
              <ArrowLeft size={18} />
            </button>
            <div className="header-center">
              <span className="level-pill" style={{ background: theme.gradient }}>
                {selectedLevel}
              </span>
              <h1 className="header-title">{selectedPassage.title}</h1>
              <span className="progress-badge">
                {Object.keys(selectedAnswers).length}/{selectedPassage.questions.length}
              </span>
            </div>
            <ReadingSettingsButton onClick={() => setShowSettingsModal(true)} />
          </header>

          {/* Progress Bar */}
          <div className="progress-section">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${((currentQuestionIndex + 1) / selectedPassage.questions.length) * 100}%`,
                  background: theme.gradient
                }}
              />
            </div>
            <div className="progress-steps">
              {selectedPassage.questions.map((_, idx) => (
                <button
                  key={idx}
                  className={`step ${idx === currentQuestionIndex ? 'active' : ''} ${selectedAnswers[idx] !== undefined ? 'answered' : ''}`}
                  onClick={() => { setCurrentQuestionIndex(idx); setShowResults(false); }}
                  style={{ '--step-color': theme.gradient } as React.CSSProperties}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Pinned Question */}
          {isMobile && isPinned && (
            <div className={`pinned-question ${isQuestionCollapsed ? 'collapsed' : ''}`}>
              <div className="pinned-header" onClick={() => setIsQuestionCollapsed(!isQuestionCollapsed)}>
                <span className="pinned-label">
                  <Pin size={14} /> Câu {currentQuestionIndex + 1}
                </span>
                <div className="pinned-actions">
                  <button className="btn-unpin" onClick={(e) => { e.stopPropagation(); setIsPinned(false); }}>
                    <PinOff size={14} />
                  </button>
                  {isQuestionCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </div>
              </div>
              {!isQuestionCollapsed && (
                <div className="pinned-content">
                  <p className="pinned-text">{currentQuestion.question}</p>
                  <div className="pinned-answers">
                    {currentQuestion.answers.map((answer, idx) => {
                      const isSelected = selectedAnswer === idx;
                      const isCorrect = answer.isCorrect;
                      let cls = 'pinned-answer';
                      if (showResults) {
                        if (isCorrect) cls += ' correct';
                        else if (isSelected && !isCorrect) cls += ' incorrect';
                      } else if (isSelected) {
                        cls += ' selected';
                      }
                      return (
                        <button key={idx} className={cls} onClick={() => handleSelectAnswer(idx)} disabled={showResults}>
                          <span className="ans-letter">{String.fromCharCode(65 + idx)}</span>
                          <span className="ans-text">{answer.text}</span>
                          {showResults && isCorrect && <CheckCircle size={14} className="icon-correct" />}
                          {showResults && isSelected && !isCorrect && <XCircle size={14} className="icon-incorrect" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="pinned-btns">
                    {!showResults ? (
                      <button className="btn-check-pin" onClick={handleShowResult} disabled={selectedAnswer === undefined}>
                        Kiểm tra
                      </button>
                    ) : (
                      <button className="btn-next-pin" onClick={handleNextQuestion}>
                        {currentQuestionIndex < selectedPassage.questions.length - 1 ? 'Tiếp' : 'Kết quả'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Split Layout */}
          <div className={`split-layout ${isMobile && isPinned ? 'with-pinned' : ''}`}>
            {/* Content Panel */}
            <div className="content-panel" ref={contentRef}>
              <div className="content-card">
                <div className="content-header">
                  <div className="content-icon">
                    <BookOpen size={20} />
                  </div>
                  <h2>Nội dung bài đọc</h2>
                  <div className="audio-controls">
                    <button
                      className={`btn-audio ${audioState !== 'idle' ? 'active' : ''}`}
                      onClick={() => handleAudioToggle(selectedPassage.content)}
                      title={audioState === 'idle' ? 'Nghe' : 'Dừng'}
                    >
                      {audioState === 'idle' ? <Volume2 size={18} /> : <Square size={16} />}
                    </button>
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
                  <div className="passage-text" style={{ fontSize: `${settings.fontSize}rem` }}>
                    <FuriganaText text={selectedPassage.content} />
                  </div>
                </div>
                <div className="content-footer">
                  <div className="word-count">
                    <Clock size={14} />
                    <span>~{Math.ceil(selectedPassage.content.length / 400)} phút đọc</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Question Panel */}
            <div className="question-panel">
              <div className="question-card">
                <div className="question-header">
                  <div className="question-badge" style={{ background: theme.gradient }}>
                    Câu {currentQuestionIndex + 1}/{selectedPassage.questions.length}
                  </div>
                  {isMobile && !isPinned && (
                    <button className="btn-pin" onClick={() => setIsPinned(true)}>
                      <Pin size={16} />
                      <span>Ghim</span>
                    </button>
                  )}
                </div>

                <div className="question-body">
                  <h3 className="question-text" style={{ fontSize: `${settings.fontSize * 1.05}rem` }}>
                    <FuriganaText text={currentQuestion.question} />
                  </h3>

                  <div className="answers-list">
                    {currentQuestion.answers.map((answer, idx) => {
                      const isSelected = selectedAnswer === idx;
                      const isCorrect = answer.isCorrect;
                      let cls = 'answer-card';
                      if (showResults) {
                        if (isCorrect) cls += ' correct';
                        else if (isSelected && !isCorrect) cls += ' incorrect';
                      } else if (isSelected) {
                        cls += ' selected';
                      }

                      return (
                        <button
                          key={idx}
                          className={cls}
                          onClick={() => handleSelectAnswer(idx)}
                          disabled={showResults}
                          style={{ fontSize: `${settings.fontSize * 0.95}rem` }}
                        >
                          <div className="answer-indicator">
                            <span className="answer-letter">{String.fromCharCode(65 + idx)}</span>
                            {showResults && isCorrect && <CheckCircle size={18} className="check-icon" />}
                            {showResults && isSelected && !isCorrect && <XCircle size={18} className="x-icon" />}
                          </div>
                          <span className="answer-content"><FuriganaText text={answer.text} /></span>
                        </button>
                      );
                    })}
                  </div>

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

                <div className="question-actions">
                  {!showResults ? (
                    <button
                      className="btn-action btn-check"
                      onClick={handleShowResult}
                      disabled={selectedAnswer === undefined}
                      style={{ '--btn-gradient': theme.gradient } as React.CSSProperties}
                    >
                      <Target size={18} />
                      Kiểm tra đáp án
                    </button>
                  ) : (
                    <button
                      className="btn-action btn-next"
                      onClick={handleNextQuestion}
                      style={{ '--btn-gradient': theme.gradient } as React.CSSProperties}
                    >
                      {currentQuestionIndex < selectedPassage.questions.length - 1 ? (
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
        </div>
      )}

      <style>{`
        .reading-practice-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
          padding: 1.5rem;
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

        .sparkle-1 { top: -4px; right: -4px; }
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

        .selection-hint {
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 1.5rem;
          font-size: 0.95rem;
        }

        /* Level Grid */
        .level-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1rem;
          max-width: 1000px;
          margin: 0 auto;
        }

        .level-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          padding: 2rem 1.5rem;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
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

        .level-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 0 0 40px var(--level-glow);
        }

        .level-card:hover .card-shine {
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

        .level-icon {
          font-size: 2.5rem;
        }

        .level-name {
          font-size: 1.5rem;
          font-weight: 700;
          background: var(--level-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .level-stats {
          display: flex;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
        }

        /* List View (Folders & Passages) */
        .list-view {
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .nav-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          margin-bottom: 1.5rem;
        }

        .btn-back {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-back:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .current-level {
          padding: 0.35rem 0.75rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          color: white;
        }

        .nav-title {
          flex: 1;
          margin: 0;
          font-size: 1rem;
          font-weight: 500;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Folder Grid */
        .folder-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .folder-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          animation: slideIn 0.3s ease backwards;
          animation-delay: var(--card-delay);
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .folder-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.12);
          transform: translateX(4px);
        }

        .folder-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border-radius: 12px;
          color: white;
        }

        .folder-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .folder-name {
          font-size: 1rem;
          font-weight: 500;
          color: white;
        }

        .folder-count {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .folder-arrow {
          color: rgba(255, 255, 255, 0.4);
          transition: transform 0.2s ease;
        }

        .folder-card:hover .folder-arrow {
          transform: translateX(4px);
          color: white;
        }

        /* Passage Grid */
        .passage-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1rem;
        }

        .passage-card {
          position: relative;
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          animation: cardAppear 0.4s ease backwards;
          animation-delay: var(--card-delay);
        }

        .passage-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.12);
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3), 0 0 24px var(--level-glow);
        }

        .passage-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .passage-meta {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          flex: 1;
        }

        .read-time {
          font-size: 0.75rem;
        }

        .passage-title {
          margin: 0 0 0.5rem;
          font-size: 1.05rem;
          font-weight: 600;
          color: white;
          line-height: 1.4;
        }

        .passage-preview {
          margin: 0 0 1rem;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.5;
        }

        .passage-action {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border-radius: 10px;
          color: white;
          font-weight: 500;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .passage-card:hover .passage-action {
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          color: rgba(255, 255, 255, 0.5);
        }

        .empty-state svg {
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-state h3 {
          margin: 0 0 0.5rem;
          color: white;
          font-size: 1.1rem;
        }

        .empty-state p {
          margin: 0;
          font-size: 0.9rem;
        }

        /* Completion Screen */
        .completion-screen {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 3rem);
        }

        .completion-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 300px;
          height: 300px;
          background: var(--color);
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
          animation: pulse 3s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.4; }
        }

        .completion-content {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 2.5rem 2rem;
          text-align: center;
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

        .completion-content h2 {
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

        /* Practice Mode */
        .practice-mode {
          height: calc(100vh - 3rem);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .practice-header {
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

        .btn-back-sm {
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
        }

        .btn-back-sm:hover {
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

        .header-title {
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

        .progress-badge {
          padding: 0.2rem 0.5rem;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
          flex-shrink: 0;
        }

        /* Progress Section */
        .progress-section {
          margin-bottom: 1rem;
        }

        .progress-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 0.75rem;
        }

        .progress-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .progress-steps {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .step {
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

        .step:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white;
        }

        .step.active {
          background: var(--step-color);
          border-color: transparent;
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .step.answered {
          background: rgba(34, 197, 94, 0.2);
          border-color: rgba(34, 197, 94, 0.4);
          color: #22c55e;
        }

        .step.active.answered {
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

        /* Content Panel */
        .content-panel {
          display: flex;
          flex-direction: column;
          min-height: 0;
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

        .btn-audio.paused {
          background: rgba(34, 197, 94, 0.15);
          border-color: rgba(34, 197, 94, 0.4);
          color: #22c55e;
        }

        .content-body {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
        }

        .passage-text {
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

        /* Question Panel */
        .question-panel {
          display: flex;
          flex-direction: column;
          min-height: 0;
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

        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .question-badge {
          padding: 0.4rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          color: white;
        }

        .btn-pin {
          display: none;
        }

        .question-body {
          flex: 1;
          padding: 1.25rem;
          overflow-y: auto;
        }

        .question-text {
          margin: 0 0 1.25rem;
          font-size: 1.05rem;
          font-weight: 500;
          color: white;
          line-height: 1.7;
        }

        .answers-list {
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

        .answer-letter {
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

        .answer-card.selected .answer-letter {
          background: #3b82f6;
          color: white;
        }

        .answer-card.correct .answer-letter {
          background: #22c55e;
          color: white;
        }

        .answer-card.incorrect .answer-letter {
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

        /* Explanation */
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
        .question-actions {
          padding: 1rem 1.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .btn-action {
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

        /* Pinned Question (Mobile) */
        .pinned-question {
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

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .pinned-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          cursor: pointer;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .pinned-question.collapsed .pinned-header {
          border-bottom: none;
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

        .btn-unpin {
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

        .btn-unpin:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .pinned-content {
          padding: 1rem;
        }

        .pinned-text {
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

        .ans-letter {
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

        .pinned-answer.selected .ans-letter {
          background: #3b82f6;
          color: white;
        }

        .pinned-answer.correct .ans-letter {
          background: #22c55e;
          color: white;
        }

        .pinned-answer.incorrect .ans-letter {
          background: #ef4444;
          color: white;
        }

        .ans-text {
          flex: 1;
          line-height: 1.4;
        }

        .icon-correct { color: #22c55e; }
        .icon-incorrect { color: #ef4444; }

        .pinned-btns {
          display: flex;
          gap: 0.5rem;
        }

        .btn-check-pin, .btn-next-pin {
          flex: 1;
          padding: 0.6rem;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-check-pin {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
        }

        .btn-check-pin:disabled {
          opacity: 0.5;
        }

        .btn-next-pin {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
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
          }

          .btn-pin:hover {
            background: rgba(59, 130, 246, 0.2);
          }

          .progress-steps {
            gap: 0.4rem;
          }

          .step {
            width: 28px;
            height: 28px;
            font-size: 0.75rem;
          }

          .content-body {
            padding: 1rem;
          }

          .passage-text {
            font-size: 1rem;
            line-height: 1.9;
          }

          .question-body {
            padding: 1rem;
          }

          .question-text {
            font-size: 1rem;
          }

          .answer-card {
            padding: 0.875rem;
          }
        }

        @media (max-width: 640px) {
          .reading-practice-page {
            padding: 1rem;
          }

          .premium-header {
            padding: 1rem;
            flex-wrap: wrap;
            gap: 1rem;
          }

          .header-text h1 {
            font-size: 1.25rem;
          }

          .level-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .level-card {
            padding: 1.5rem 1rem;
          }

          .level-icon {
            font-size: 2rem;
          }

          .level-name {
            font-size: 1.25rem;
          }

          .passage-grid {
            grid-template-columns: 1fr;
          }

          .practice-mode {
            height: calc(100vh - 2rem);
          }

          .practice-header {
            padding: 0.5rem 0.75rem;
          }

          .btn-back-sm {
            width: 32px;
            height: 32px;
          }

          .header-title {
            font-size: 0.85rem;
          }

          .btn-audio {
            width: 32px;
            height: 32px;
          }

          .step {
            width: 26px;
            height: 26px;
          }
        }
      `}</style>
    </div>
  );
}
