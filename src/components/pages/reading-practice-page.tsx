// Reading Practice Page - Premium UI with glassmorphism design
// Flow: Level Selection → Folder List → Passage List → Practice

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  ChevronRight, CheckCircle, XCircle, RotateCcw, Volume2,
  ArrowLeft, ChevronDown, ChevronUp,
  Clock, Pause, Play, Square, FolderOpen,
  FileText, Pin, PinOff, BookOpen
} from 'lucide-react';
import type { JLPTLevel } from '../../types/flashcard';
import type { ReadingPassage, ReadingFolder } from '../../types/reading';
import { JLPT_LEVELS } from './reading-practice/reading-practice-constants';
import { ReadingSettingsModal, ReadingSettingsButton } from '../ui/reading-settings-modal';
import { FuriganaText } from '../ui/furigana-text';
import { useReadingSettings } from '../../contexts/reading-settings-context';
import { JLPTLevelSelector, LEVEL_THEMES } from '../ui/jlpt-level-selector';

// LEVEL_THEMES is now imported from jlpt-level-selector

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

  // Content tab state
  const [contentTab, setContentTab] = useState<'passage' | 'vocabulary'>('passage');

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
    setContentTab('passage'); // Reset to passage tab
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

      {/* Level Selection - Premium UI matching Grammar/Vocabulary design */}
      {viewMode === 'level-select' && (
        <JLPTLevelSelector
          title="Đọc Hiểu"
          subtitle="Chọn cấp độ JLPT để bắt đầu"
          icon={<BookOpen size={32} />}
          countByLevel={countByLevel}
          countLabel="bài đọc"
          onSelectLevel={selectLevel}
        />
      )}

      {/* Folder List */}
      {viewMode === 'folder-list' && selectedLevel && (
        <div className="folder-view">
          <div className="folder-view-header">
            <button className="btn-back" onClick={goBack}>
              <ArrowLeft size={20} />
            </button>
            <div className="folder-view-title">
              <span className="level-badge" style={{ background: theme.gradient }}>
                {selectedLevel}
              </span>
              <div className="title-text">
                <h1>Chọn bài học</h1>
                <p>{levelFolders.length} bài • Luyện đọc hiểu</p>
              </div>
            </div>
          </div>

          {levelFolders.length === 0 ? (
            <div className="empty-state">
              <FolderOpen size={48} />
              <h3>Chưa có thư mục nào</h3>
              <p>Vui lòng thêm thư mục ở tab Quản Lí</p>
            </div>
          ) : (
            <div className="lesson-grid">
              {levelFolders.map((folder, idx) => {
                const pCount = getPassageCount(folder.id);
                const lessonNum = folder.name.replace(/\D/g, '') || String(idx + 1);
                const hasContent = pCount > 0;
                return (
                  <button
                    key={folder.id}
                    className={`lesson-card ${hasContent ? 'has-content' : ''}`}
                    onClick={() => selectFolder(folder)}
                    style={{
                      '--card-delay': `${idx * 0.03}s`,
                      '--level-gradient': theme.gradient,
                      '--level-glow': theme.glow,
                    } as React.CSSProperties}
                  >
                    <div className="lesson-number">{lessonNum}</div>
                    <div className="lesson-content">
                      <span className="lesson-label">Bài</span>
                      <span className="lesson-name">{folder.name}</span>
                    </div>
                    <div className="lesson-meta">
                      <span className={`lesson-count ${hasContent ? 'active' : ''}`}>
                        {pCount > 0 ? `${pCount} bài đọc` : 'Trống'}
                      </span>
                      <ChevronRight size={18} className="lesson-arrow" />
                    </div>
                    {hasContent && <div className="lesson-indicator" />}
                    <div className="lesson-shine" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Passage List - Premium 3-Column Grid */}
      {viewMode === 'passage-list' && selectedLevel && selectedFolder && (
        <div className="passage-list-view">
          <div className="passage-list-header">
            <button className="btn-back" onClick={goBack}>
              <ArrowLeft size={20} />
            </button>
            <div className="passage-list-title">
              <div className="title-row">
                <h1>{selectedFolder.name}</h1>
                <span className="passage-count-inline">{folderPassages.length} bài đọc</span>
              </div>
            </div>
            <span className="level-tag-right" style={{ background: theme.gradient }}>{selectedLevel}</span>
          </div>

          {folderPassages.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} />
              <h3>Chưa có bài đọc nào</h3>
              <p>Vui lòng thêm bài đọc ở tab Quản Lí</p>
            </div>
          ) : (
            <div className="passage-grid-premium">
              {folderPassages.map((passage, idx) => (
                <button
                  key={passage.id}
                  className="passage-card-compact"
                  onClick={() => startPractice(passage)}
                  style={{ '--card-delay': `${idx * 0.05}s`, '--level-gradient': theme.gradient, '--level-glow': theme.glow } as React.CSSProperties}
                >
                  <div className="card-main">
                    <span className="card-kanji-big">読解</span>
                    <h3 className="card-title-upper">{passage.title.toUpperCase()}</h3>
                  </div>
                  <div className="card-meta">
                    <span className="meta-item">{passage.questions.length}問</span>
                    <span className="meta-dot">•</span>
                    <span className="meta-item">{Math.ceil(passage.content.length / 400)}分</span>
                    <ChevronRight size={16} className="meta-arrow" />
                  </div>
                  <div className="card-shine" />
                </button>
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
              <h1 className="header-title" style={{ textTransform: 'uppercase' }}>{selectedPassage.title}</h1>
              <span className="progress-badge">
                {Object.keys(selectedAnswers).length}/{selectedPassage.questions.length}
              </span>
            </div>
            <ReadingSettingsButton onClick={() => setShowSettingsModal(true)} />
          </header>

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
                  <div className="content-tabs">
                    <button
                      className={`content-tab ${contentTab === 'passage' ? 'active' : ''}`}
                      onClick={() => setContentTab('passage')}
                    >
                      <FileText size={16} />
                      <span>Nội dung bài đọc</span>
                    </button>
                    <button
                      className={`content-tab ${contentTab === 'vocabulary' ? 'active' : ''}`}
                      onClick={() => setContentTab('vocabulary')}
                    >
                      <BookOpen size={16} />
                      <span>Từ mới</span>
                      {selectedPassage.vocabulary && selectedPassage.vocabulary.length > 0 && (
                        <span className="vocab-count">{selectedPassage.vocabulary.length}</span>
                      )}
                    </button>
                  </div>
                  {contentTab === 'passage' && (
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
                  )}
                </div>
                <div className="content-body">
                  {contentTab === 'passage' ? (
                    <div className="passage-text" style={{ fontSize: `${settings.fontSize}rem`, color: settings.textColor || 'white' }}>
                      <FuriganaText text={selectedPassage.content} />
                    </div>
                  ) : (
                    <div className="vocabulary-list">
                      {selectedPassage.vocabulary && selectedPassage.vocabulary.length > 0 ? (
                        <>
                          <div className="vocab-header-row">
                            <span className="vocab-col-num">#</span>
                            <span className="vocab-col-word">Từ mới</span>
                            <span className="vocab-col-reading">Cách đọc</span>
                            <span className="vocab-col-meaning">Nghĩa</span>
                          </div>
                          {selectedPassage.vocabulary.map((vocab, idx) => (
                            <div key={idx} className="vocab-item" style={{ fontSize: `${settings.fontSize * 0.95}rem` }}>
                              <span className="vocab-num" style={{ color: 'white' }}>{idx + 1}</span>
                              <span className="vocab-word" style={{ color: 'white' }}>{vocab.word}</span>
                              <span className="vocab-reading" style={{ color: 'white' }}>{vocab.reading || '—'}</span>
                              <span className="vocab-meaning" style={{ color: 'white' }}>{vocab.meaning}</span>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="vocab-empty">
                          <BookOpen size={32} />
                          <span>Chưa có từ mới</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {contentTab === 'passage' && (
                  <div className="content-footer">
                    <div className="word-count">
                      <Clock size={14} />
                      <span>~{Math.ceil(selectedPassage.content.length / 400)} phút đọc</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Question Panel */}
            <div className="question-panel">
              <div className="question-card-simple">
                {/* Simple Header with Question Steps */}
                <div className="question-simple-header">
                  <div className="question-info">
                    <span className="question-current" style={{ background: theme.gradient }}>
                      {currentQuestionIndex + 1}/{selectedPassage.questions.length}
                    </span>
                    <div className="question-dots">
                      {selectedPassage.questions.map((_, idx) => {
                        const answered = selectedAnswers[idx] !== undefined;
                        const isCurrent = idx === currentQuestionIndex;
                        const answerLetter = answered ? String.fromCharCode(65 + selectedAnswers[idx]) : '';
                        return (
                          <button
                            key={idx}
                            className={`q-dot ${isCurrent ? 'current' : ''} ${answered ? 'answered' : ''}`}
                            onClick={() => { setCurrentQuestionIndex(idx); setShowResults(false); }}
                            title={`Câu ${idx + 1}${answered ? ` - ${answerLetter}` : ''}`}
                          >
                            {answered ? answerLetter : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {isMobile && !isPinned && (
                    <button className="btn-pin-simple" onClick={() => setIsPinned(true)}>
                      <Pin size={14} />
                    </button>
                  )}
                </div>

                {/* Scrollable Question Body */}
                <div className="question-body-simple">
                  {/* Question Content */}
                  <div className="question-content-simple">
                    <p className="question-text-simple" style={{ fontSize: `${settings.fontSize}rem`, color: settings.textColor || 'white' }}>
                      <FuriganaText text={currentQuestion.question} />
                    </p>
                  </div>

                  {/* Simple Answer List */}
                  <div className="answers-simple">
                    {currentQuestion.answers.map((answer, idx) => {
                      const isSelected = selectedAnswer === idx;
                      const isCorrect = answer.isCorrect;
                      let cls = 'answer-simple';
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
                        >
                          <span className="answer-letter-simple">{String.fromCharCode(65 + idx)}</span>
                          <span className="answer-text-simple" style={{ fontSize: `${settings.fontSize * 0.9}rem` }}>
                            <FuriganaText text={answer.text} />
                          </span>
                          {showResults && isCorrect && <CheckCircle size={16} className="icon-ok" />}
                          {showResults && isSelected && !isCorrect && <XCircle size={16} className="icon-no" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {showResults && currentQuestion.explanation && (
                    <div className="explanation-simple">
                      <Sparkles size={14} />
                      <span>{currentQuestion.explanation}</span>
                    </div>
                  )}
                </div>

                {/* Simple Actions */}
                <div className="actions-simple">
                  {!showResults ? (
                    <button
                      className="btn-simple btn-check-simple"
                      onClick={handleShowResult}
                      disabled={selectedAnswer === undefined}
                      style={{ background: theme.gradient }}
                    >
                      Kiểm tra
                    </button>
                  ) : (
                    <>
                      {currentQuestionIndex < selectedPassage.questions.length - 1 ? (
                        <button
                          className="btn-simple btn-next-simple"
                          onClick={handleNextQuestion}
                          style={{ background: theme.gradient }}
                        >
                          Tiếp
                        </button>
                      ) : (
                        Object.keys(selectedAnswers).length === selectedPassage.questions.length && (
                          <button
                            className="btn-simple btn-next-simple"
                            onClick={handleNextQuestion}
                            style={{ background: theme.gradient }}
                          >
                            Kết quả
                          </button>
                        )
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .reading-practice-page {
          height: calc(100vh - 2rem);
          max-height: calc(100vh - 2rem);
          background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
          padding: 1rem;
          overflow: hidden;
          box-sizing: border-box;
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

        /* Level Grid */
        .level-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1rem;
          max-width: 1000px;
          margin: 0 auto;
        }

        .header-subtitle-inline {
          font-size: 0.6em;
          font-weight: 500;
          opacity: 0.7;
          margin-left: 0.5rem;
        }

        .level-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1.5rem 1rem;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 2px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
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
          border-color: var(--level-accent);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3), 0 0 30px var(--level-glow);
        }

        .level-card:hover .card-shine {
          transform: translateX(100%);
        }

        .level-card.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .level-card.disabled:hover {
          transform: none;
          border-color: rgba(255, 255, 255, 0.08);
          box-shadow: none;
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

        .level-name {
          font-size: 1.75rem;
          font-weight: 800;
          background: var(--level-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .level-stats {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .stat-dot {
          opacity: 0.5;
        }

        /* List View (Folders & Passages) */
        .list-view {
          animation: fadeIn 0.3s ease;
          height: calc(100vh - 3rem);
          display: flex;
          flex-direction: column;
          overflow: hidden;
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
          flex-shrink: 0;
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

        /* Folder View */
        .folder-view {
          animation: fadeIn 0.3s ease;
          height: calc(100vh - 3rem);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .folder-view-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          margin-bottom: 1.5rem;
          flex-shrink: 0;
        }

        .folder-view-title {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .level-badge {
          padding: 0.5rem 1rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          color: white;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .title-text h1 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: white;
        }

        .title-text p {
          margin: 0.25rem 0 0;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
        }

        /* Lesson Grid */
        .lesson-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
          flex: 1;
          overflow-y: auto;
          padding-bottom: 1rem;
        }

        .lesson-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          animation: lessonAppear 0.4s ease backwards;
          animation-delay: var(--card-delay);
          overflow: hidden;
          text-align: left;
        }

        @keyframes lessonAppear {
          from { opacity: 0; transform: translateY(15px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .lesson-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.12);
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3), 0 0 30px var(--level-glow);
        }

        .lesson-card:hover .lesson-shine {
          transform: translateX(100%);
        }

        .lesson-card.has-content {
          border-color: rgba(255, 255, 255, 0.1);
        }

        .lesson-card.has-content::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--level-gradient);
          opacity: 0.8;
        }

        .lesson-number {
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--level-gradient);
          border-radius: 14px;
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 4px 15px var(--level-glow);
        }

        .lesson-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          min-width: 0;
        }

        .lesson-label {
          font-size: 0.7rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .lesson-name {
          font-size: 1.1rem;
          font-weight: 600;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .lesson-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .lesson-count {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.4);
          padding: 0.3rem 0.6rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
        }

        .lesson-count.active {
          color: #86efac;
          background: rgba(34, 197, 94, 0.15);
        }

        .lesson-arrow {
          color: rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
        }

        .lesson-card:hover .lesson-arrow {
          color: white;
          transform: translateX(4px);
        }

        .lesson-indicator {
          position: absolute;
          bottom: 12px;
          right: 12px;
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          box-shadow: 0 0 10px #22c55e;
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }

        .lesson-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
          transition: transform 0.6s ease;
          pointer-events: none;
        }

        /* Passage List - Premium 3-Column Grid */
        .passage-list-view {
          animation: fadeIn 0.3s ease;
          height: calc(100vh - 4rem);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .passage-list-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          margin-bottom: 0.75rem;
          flex-shrink: 0;
        }

        .passage-list-title {
          flex: 1;
        }

        .passage-list-title .title-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .passage-list-title .title-row h1 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: white;
        }

        .passage-count-inline {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          padding: 0.2rem 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
        }

        .level-tag-right {
          padding: 0.35rem 0.75rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        /* Premium 3-Column Grid - Compact Design */
        .passage-grid-premium {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          flex: 1;
          overflow-y: auto;
          padding-bottom: 1rem;
        }

        .passage-card-compact {
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 0.6rem 0.875rem;
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: cardSlide 0.4s ease backwards;
          animation-delay: var(--card-delay);
          overflow: hidden;
          text-align: left;
        }

        @keyframes cardSlide {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .passage-card-compact:hover {
          border-color: rgba(255, 255, 255, 0.12);
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 25px var(--level-glow);
        }

        .passage-card-compact:hover .card-shine {
          transform: translateX(100%);
        }

        .passage-card-compact:hover .meta-arrow {
          transform: translateX(3px);
          color: white;
        }

        .card-main {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 0.3rem;
        }

        .card-kanji-big {
          font-size: 1.5rem;
          font-weight: 800;
          background: var(--level-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          flex-shrink: 0;
        }

        .card-title-upper {
          margin: 0;
          font-size: 0.8rem;
          font-weight: 600;
          color: white;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .card-meta {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.45);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.2rem;
        }

        .meta-dot {
          opacity: 0.4;
        }

        .meta-arrow {
          margin-left: auto;
          color: rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
        }

        .card-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.06), transparent);
          transition: transform 0.5s ease;
          pointer-events: none;
        }

        /* Legacy Passage Grid (keep for compatibility) */
        .passage-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1rem;
          flex: 1;
          overflow-y: auto;
          padding-bottom: 1rem;
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
          height: calc(100vh - 6rem);
          max-height: calc(100vh - 6rem);
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

        .content-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.625rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.02);
        }

        .content-tabs {
          display: flex;
          gap: 0.5rem;
        }

        .content-tab {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.625rem 1.75rem;
          min-width: 160px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .content-tab:hover {
          color: rgba(255, 255, 255, 0.8);
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .content-tab.active {
          color: white;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(99, 102, 241, 0.2) 100%);
          border: 1px solid rgba(139, 92, 246, 0.4);
          box-shadow: 0 2px 12px rgba(139, 92, 246, 0.2);
        }

        .vocab-count {
          padding: 0.15rem 0.5rem;
          background: rgba(139, 92, 246, 0.4);
          border-radius: 10px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .content-body {
          flex: 1;
          padding: 1rem 1.25rem;
          overflow-y: auto;
        }

        .passage-text {
          font-size: 1.1rem;
          line-height: 1.8;
          white-space: pre-line;
          color: rgba(255, 255, 255, 0.9);
        }

        .passage-text p {
          margin: 0 0 0.5em 0;
        }

        /* Vocabulary List - Professional Table Style */
        .vocabulary-list {
          display: flex;
          flex-direction: column;
          gap: 0;
          background: rgba(20, 20, 35, 0.5);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 12px;
          overflow: hidden;
        }

        .vocab-header-row {
          display: grid;
          grid-template-columns: 40px 1.2fr 1fr 2fr;
          gap: 1rem;
          padding: 0.75rem 1rem;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%);
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
          font-size: 0.8rem;
          font-weight: 600;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .vocab-item {
          display: grid;
          grid-template-columns: 40px 1.2fr 1fr 2fr;
          gap: 1rem;
          align-items: center;
          padding: 0.875rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          transition: all 0.2s;
        }

        .vocab-item:last-child {
          border-bottom: none;
        }

        .vocab-item:hover {
          background: rgba(139, 92, 246, 0.08);
        }

        .vocab-num {
          color: white !important;
          font-weight: 600;
          font-size: 0.85em;
        }

        .vocab-word {
          font-weight: 600;
          font-size: 1.05em;
          color: white !important;
        }

        .vocab-reading {
          font-weight: 400;
          font-size: 0.95em;
          color: white !important;
        }

        .vocab-meaning {
          color: white !important;
          font-size: 0.95em;
        }

        .vocab-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 2rem;
          color: rgba(255, 255, 255, 0.4);
          text-align: center;
        }

        .content-footer {
          padding: 0.5rem 1rem;
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

        /* Premium Question Card */
        .question-card-simple {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: linear-gradient(145deg, rgba(30, 30, 50, 0.9) 0%, rgba(20, 20, 35, 0.95) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          overflow: hidden;
          min-height: 0;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .question-simple-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.875rem 1.25rem;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .question-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .question-current {
          padding: 0.4rem 0.75rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 700;
          color: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .question-dots {
          display: flex;
          gap: 0.4rem;
        }

        .q-dot {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          border: 2px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.03);
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.7rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .q-dot:hover {
          border-color: rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-1px);
        }

        .q-dot.current {
          background: rgba(139, 92, 246, 0.25);
          border-color: rgba(139, 92, 246, 0.6);
          color: white;
          box-shadow: 0 0 12px rgba(139, 92, 246, 0.3);
        }

        .q-dot.answered {
          background: rgba(34, 197, 94, 0.2);
          border-color: rgba(34, 197, 94, 0.5);
          color: #86efac;
        }

        .btn-pin-simple {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .btn-pin-simple:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .question-body-simple {
          flex: 1;
          overflow-y: auto;
          min-height: 0;
          padding: 0.5rem 0;
        }

        .question-content-simple {
          padding: 0.75rem 1.25rem;
        }

        .question-text-simple {
          margin: 0;
          line-height: 1.7;
          font-weight: 500;
        }

        .answers-simple {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          padding: 0.5rem 1.25rem 1rem;
        }

        .answer-simple {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.875rem 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: left;
        }

        .answer-simple:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.12);
          transform: translateX(4px);
        }

        .answer-simple.selected {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%);
          border-color: rgba(139, 92, 246, 0.5);
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.15);
        }

        .answer-simple.correct {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%);
          border-color: rgba(34, 197, 94, 0.6);
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.15);
        }

        .answer-simple.incorrect {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%);
          border-color: rgba(239, 68, 68, 0.6);
        }

        .answer-letter-simple {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.8rem;
          font-weight: 700;
          display: flex;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .answer-simple.selected .answer-letter-simple {
          background: rgba(139, 92, 246, 0.3);
          color: #c4b5fd;
        }

        .answer-simple.correct .answer-letter-simple {
          background: rgba(34, 197, 94, 0.3);
          color: #86efac;
        }

        .answer-simple.incorrect .answer-letter-simple {
          background: rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }

        .answer-text-simple {
          flex: 1;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.5;
        }

        .answer-simple .icon-ok {
          color: #22c55e;
          flex-shrink: 0;
        }

        .answer-simple .icon-no {
          color: #ef4444;
          flex-shrink: 0;
        }

        .explanation-simple {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          margin: 0.75rem 1.25rem;
          padding: 0.875rem 1rem;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%);
          border: 1px solid rgba(139, 92, 246, 0.25);
          border-radius: 12px;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.6;
        }

        .explanation-simple svg {
          color: #a78bfa;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .actions-simple {
          padding: 1rem 1.25rem;
          flex-shrink: 0;
          background: rgba(0, 0, 0, 0.2);
        }

        .btn-simple {
          width: 100%;
          padding: 0.875rem;
          border: none;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          color: white;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .btn-simple:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
        }

        .btn-simple:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.35);
        }

        .btn-simple:not(:disabled):active {
          transform: translateY(0);
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

        /* Question Navigator Header */
        .question-nav-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          gap: 0.75rem;
        }

        .question-steps {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }

        .question-step {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 2px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.03);
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .question-step:hover {
          border-color: rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.08);
        }

        .question-step.current {
          background: var(--step-color);
          border-color: transparent;
          color: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .question-step.answered {
          background: rgba(34, 197, 94, 0.2);
          border-color: rgba(34, 197, 94, 0.5);
          color: #86efac;
        }

        .question-step.answered.current {
          background: var(--step-color);
          border-color: transparent;
          color: white;
        }

        .question-header-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
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

          /* Passage Grid Premium - Tablet: 2 columns */
          .passage-grid-premium {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.875rem;
          }

          .passage-card-premium {
            border-radius: 16px;
          }

          .card-top {
            padding: 0.875rem 0.875rem 0.625rem;
          }

          .card-number {
            width: 32px;
            height: 32px;
            font-size: 0.9rem;
            border-radius: 8px;
          }

          .card-body {
            padding: 0 0.875rem;
            min-height: 50px;
          }

          .card-title {
            font-size: 0.9rem;
          }

          .card-footer {
            padding: 0.625rem 0.875rem 0.875rem;
          }

          .folder-view-header {
            padding: 1rem;
            flex-wrap: wrap;
          }

          .title-text h1 {
            font-size: 1.1rem;
          }

          .lesson-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
          }

          .lesson-card {
            padding: 1rem;
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .lesson-number {
            width: 44px;
            height: 44px;
            font-size: 1.25rem;
            border-radius: 12px;
          }

          .lesson-meta {
            width: 100%;
            justify-content: space-between;
          }

          .lesson-name {
            font-size: 1rem;
          }

          /* Passage Grid Premium - Mobile: 1 column */
          .passage-grid-premium {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .passage-list-header {
            padding: 0.75rem;
            border-radius: 14px;
            gap: 0.5rem;
          }

          .passage-list-title .title-row {
            flex-wrap: wrap;
            gap: 0.4rem;
          }

          .passage-list-title .title-row h1 {
            font-size: 1rem;
          }

          .passage-count-inline {
            font-size: 0.7rem;
          }

          .level-tag-right {
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
          }

          .passage-card-premium {
            border-radius: 14px;
          }

          .card-top {
            padding: 0.75rem 0.875rem 0.5rem;
          }

          .card-number {
            width: 30px;
            height: 30px;
            font-size: 0.85rem;
          }

          .card-kanji {
            font-size: 0.7rem;
          }

          .card-body {
            padding: 0 0.875rem;
            min-height: 45px;
          }

          .card-title {
            font-size: 0.85rem;
            -webkit-line-clamp: 1;
          }

          .card-footer {
            padding: 0.5rem 0.875rem 0.75rem;
          }

          .card-stats .stat {
            font-size: 0.7rem;
          }

          .card-action {
            padding: 0.35rem 0.6rem;
            font-size: 0.7rem;
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
