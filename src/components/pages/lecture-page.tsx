// Lecture page - slideshow presentation for students

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLectures, useSlides, useLectureView } from '../../hooks/use-lectures';
import { useAuth } from '../../hooks/use-auth';
import { LectureCard } from '../lecture/lecture-card';
import { SlideRenderer } from '../lecture/slide-renderer';
import type { Lecture, LectureFolder } from '../../types/lecture';
import type { JLPTLevel } from '../../types/flashcard';

type ViewMode = 'levels' | 'folders' | 'lectures' | 'view' | 'present' | 'grid';

interface LecturePageProps {
  onNavigateToEditor?: (lectureId?: string) => void;
}

export function LecturePage({ onNavigateToEditor }: LecturePageProps) {
  const { currentUser, isAdmin } = useAuth();
  const { lectures, lectureFolders, loading, getFoldersByLevel, getLecturesByFolder } = useLectures(isAdmin);

  // Navigation state
  const [viewMode, setViewMode] = useState<ViewMode>('levels');
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<LectureFolder | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Floating notes state
  const [showFloatingNotes, setShowFloatingNotes] = useState(true);
  const [userNotes, setUserNotes] = useState<Record<string, string>>({});  // slideId -> note

  // Auto-advance settings
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [autoAdvanceInterval, setAutoAdvanceInterval] = useState(10); // seconds

  // PowerPoint-like features
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev' | null>(null);
  const [blankScreen, setBlankScreen] = useState<'black' | 'white' | null>(null);
  const [showJumpDialog, setShowJumpDialog] = useState(false);
  const [jumpInput, setJumpInput] = useState('');
  const [presentationTime, setPresentationTime] = useState(0);
  const presentationStartRef = useRef<number | null>(null);

  // Enhanced features
  const [showLaser, setShowLaser] = useState(false);
  const [laserPosition, setLaserPosition] = useState({ x: 0, y: 0 });
  const [showNotes, setShowNotes] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showNextPreview, setShowNextPreview] = useState(true);
  const [resumePrompt, setResumePrompt] = useState<{ lectureId: string; slideIndex: number } | null>(null);

  // Touch navigation
  const touchStartX = useRef<number | null>(null);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const jumpInputRef = useRef<HTMLInputElement>(null);

  const { slides: currentSlides, loading: slidesLoading } = useSlides(
    selectedLecture?.id || null
  );
  const { recordView } = useLectureView(
    selectedLecture?.id || null,
    currentUser?.id || null
  );

  // Check if user can see hidden lectures (creator or super_admin)
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const canSeeHiddenLecture = (lecture: Lecture): boolean => {
    if (isSuperAdmin) return true;
    return lecture.authorId === currentUser?.id;
  };

  // Get visible lectures (filter hidden)
  const visibleLectures = lectures.filter((lecture) => {
    if (lecture.isHidden && !canSeeHiddenLecture(lecture)) return false;
    return true;
  });

  // Get folders and lectures for current navigation level
  const currentFolders = selectedLevel ? getFoldersByLevel(selectedLevel) : [];
  const currentLectures = selectedFolder
    ? getLecturesByFolder(selectedFolder.id).filter(l => !l.isHidden || canSeeHiddenLecture(l))
    : [];

  // Filter lectures by search query
  const filteredLectures = currentLectures.filter((lecture) => {
    if (!searchQuery) return true;
    return lecture.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lecture.description?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Check for saved progress on lecture selection
  const handleSelectLecture = (lecture: Lecture) => {
    setSelectedLecture(lecture);

    // Check if there's saved progress
    const savedProgress = localStorage.getItem(`lecture-progress-${lecture.id}`);
    if (savedProgress) {
      const { slideIndex } = JSON.parse(savedProgress);
      if (slideIndex > 0) {
        setResumePrompt({ lectureId: lecture.id, slideIndex });
        setCurrentSlideIndex(0);
        setViewMode('view');
        return;
      }
    }

    setCurrentSlideIndex(0);
    setViewMode('view');
  };

  // Resume from saved position
  const handleResume = () => {
    if (resumePrompt) {
      setCurrentSlideIndex(resumePrompt.slideIndex);
      setResumePrompt(null);
    }
  };

  // Start from beginning
  const handleStartOver = () => {
    if (resumePrompt && selectedLecture) {
      localStorage.removeItem(`lecture-progress-${selectedLecture.id}`);
    }
    setResumePrompt(null);
    setCurrentSlideIndex(0);
  };

  // Slide navigation with transition direction
  const goToSlide = useCallback((index: number, direction?: 'next' | 'prev') => {
    if (index >= 0 && index < currentSlides.length) {
      const dir = direction || (index > currentSlideIndex ? 'next' : 'prev');
      setSlideDirection(dir);
      setCurrentSlideIndex(index);
      recordView(index, index === currentSlides.length - 1);
      // Reset direction after animation
      setTimeout(() => setSlideDirection(null), 300);
    }
  }, [currentSlideIndex, currentSlides.length, recordView]);

  const nextSlide = useCallback(() => {
    if (currentSlideIndex < currentSlides.length - 1) {
      goToSlide(currentSlideIndex + 1, 'next');
    }
  }, [currentSlideIndex, currentSlides.length, goToSlide]);

  const prevSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      goToSlide(currentSlideIndex - 1, 'prev');
    }
  }, [currentSlideIndex, goToSlide]);

  // Click on slide to advance (PowerPoint-like)
  const handleSlideClick = useCallback((e: React.MouseEvent) => {
    // Ignore if clicking on controls or buttons
    if ((e.target as HTMLElement).closest('button, .presentation-controls, input')) return;

    // Click on left 20% = prev, right 80% = next
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isLeftSide = clickX < rect.width * 0.2;

    if (isLeftSide) {
      prevSlide();
    } else {
      nextSlide();
    }
  }, [nextSlide, prevSlide]);

  // Jump to specific slide
  const handleJumpToSlide = useCallback(() => {
    const slideNum = parseInt(jumpInput, 10);
    if (slideNum >= 1 && slideNum <= currentSlides.length) {
      goToSlide(slideNum - 1);
      setShowJumpDialog(false);
      setJumpInput('');
    }
  }, [jumpInput, currentSlides.length, goToSlide]);

  // Toggle grid view
  const toggleGridView = useCallback(() => {
    setViewMode(viewMode === 'grid' ? 'view' : 'grid');
  }, [viewMode]);

  // Enter presentation mode
  const enterPresent = () => {
    setViewMode('present');
    setBlankScreen(null);
    presentationStartRef.current = Date.now();
    setPresentationTime(0);
    document.documentElement.requestFullscreen?.();
  };

  // Exit presentation mode
  const exitPresent = () => {
    setViewMode('view');
    setBlankScreen(null);
    setShowJumpDialog(false);
    presentationStartRef.current = null;
    document.exitFullscreen?.();
  };

  // Back to list
  // Navigate back based on current view
  const handleBack = () => {
    if (viewMode === 'view' || viewMode === 'grid') {
      setSelectedLecture(null);
      setViewMode('lectures');
      setCurrentSlideIndex(0);
    } else if (viewMode === 'lectures') {
      setSelectedFolder(null);
      setViewMode('folders');
    } else if (viewMode === 'folders') {
      setSelectedLevel(null);
      setViewMode('levels');
    }
  };

  // Navigate to level
  const handleSelectLevel = (level: JLPTLevel) => {
    setSelectedLevel(level);
    setViewMode('folders');
  };

  // Navigate to folder
  const handleSelectFolder = (folder: LectureFolder) => {
    setSelectedFolder(folder);
    setViewMode('lectures');
  };

  // Legacy backToList for other parts
  const backToList = () => {
    setSelectedLecture(null);
    setSelectedFolder(null);
    setSelectedLevel(null);
    setViewMode('levels');
    setCurrentSlideIndex(0);
  };

  // Load/save user notes from localStorage
  useEffect(() => {
    if (selectedLecture) {
      const savedNotes = localStorage.getItem(`lecture-notes-${selectedLecture.id}`);
      if (savedNotes) {
        setUserNotes(JSON.parse(savedNotes));
      } else {
        setUserNotes({});
      }
    }
  }, [selectedLecture?.id]);

  // Save notes when changed
  const saveUserNote = (slideId: string, note: string) => {
    if (!selectedLecture) return;
    const newNotes = { ...userNotes, [slideId]: note };
    setUserNotes(newNotes);
    localStorage.setItem(`lecture-notes-${selectedLecture.id}`, JSON.stringify(newNotes));
  };

  // Keyboard navigation (PowerPoint-like)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode === 'levels' || viewMode === 'folders' || viewMode === 'lectures') return;

      // If jump dialog is open, handle it separately
      if (showJumpDialog) {
        if (e.key === 'Escape') {
          setShowJumpDialog(false);
          setJumpInput('');
        } else if (e.key === 'Enter') {
          handleJumpToSlide();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'PageDown':
        case 'n':
        case 'N':
          e.preventDefault();
          if (blankScreen) {
            setBlankScreen(null);
          } else {
            nextSlide();
          }
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
        case 'p':
        case 'P':
          e.preventDefault();
          if (blankScreen) {
            setBlankScreen(null);
          } else {
            prevSlide();
          }
          break;
        case 'Escape':
          if (blankScreen) {
            setBlankScreen(null);
          } else if (viewMode === 'present') {
            exitPresent();
          } else if (viewMode === 'grid') {
            setViewMode('view');
          } else {
            backToList();
          }
          break;
        case 'f':
        case 'F':
          if (viewMode === 'view' || viewMode === 'grid') {
            enterPresent();
          }
          break;
        case 'b':
        case 'B':
        case '.':
          // Blank screen black (like PowerPoint B or .)
          e.preventDefault();
          setBlankScreen(blankScreen === 'black' ? null : 'black');
          break;
        case 'w':
        case 'W':
        case ',':
          // Blank screen white (like PowerPoint W or ,)
          e.preventDefault();
          setBlankScreen(blankScreen === 'white' ? null : 'white');
          break;
        case 'g':
        case 'G':
          // Go to slide (like PowerPoint Ctrl+G)
          e.preventDefault();
          setShowJumpDialog(true);
          setTimeout(() => jumpInputRef.current?.focus(), 100);
          break;
        case 'Home':
          // Go to first slide
          e.preventDefault();
          goToSlide(0, 'prev');
          break;
        case 'End':
          // Go to last slide
          e.preventDefault();
          goToSlide(currentSlides.length - 1, 'next');
          break;
        case 'o':
        case 'O':
          // Toggle grid overview
          e.preventDefault();
          if (viewMode !== 'present') {
            toggleGridView();
          }
          break;
        case 'l':
        case 'L':
          // Toggle laser pointer
          e.preventDefault();
          if (viewMode === 'present') {
            setShowLaser(!showLaser);
          }
          break;
        case 's':
        case 'S':
          // Toggle presenter notes (admin only)
          e.preventDefault();
          if (isAdmin && (viewMode === 'present' || viewMode === 'view')) {
            setShowNotes(!showNotes);
          }
          break;
        case 'h':
        case 'H':
        case '?':
          // Show help overlay
          e.preventDefault();
          setShowHelp(!showHelp);
          break;
        case 'v':
        case 'V':
          // Toggle next slide preview
          e.preventDefault();
          if (viewMode === 'present') {
            setShowNextPreview(!showNextPreview);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, currentSlideIndex, currentSlides.length, blankScreen, showJumpDialog, showLaser, showNotes, showHelp, showNextPreview, isAdmin, handleJumpToSlide, nextSlide, prevSlide, goToSlide, toggleGridView]);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && viewMode === 'present') {
        setViewMode('view');
        setBlankScreen(null);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [viewMode]);

  // Presentation timer
  useEffect(() => {
    if (viewMode !== 'present' || !presentationStartRef.current) return;

    const interval = setInterval(() => {
      setPresentationTime(Math.floor((Date.now() - presentationStartRef.current!) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [viewMode]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-advance timer
  useEffect(() => {
    if (!autoAdvance || viewMode === 'levels' || viewMode === 'folders' || viewMode === 'lectures') return;
    if (currentSlideIndex >= currentSlides.length - 1) {
      setAutoAdvance(false);
      return;
    }

    const timer = setTimeout(() => {
      nextSlide();
    }, autoAdvanceInterval * 1000);

    return () => clearTimeout(timer);
  }, [autoAdvance, currentSlideIndex, autoAdvanceInterval, viewMode, currentSlides.length]);

  // Save progress to localStorage
  useEffect(() => {
    if (!selectedLecture || viewMode === 'levels' || viewMode === 'folders' || viewMode === 'lectures') return;
    if (currentSlideIndex > 0) {
      localStorage.setItem(
        `lecture-progress-${selectedLecture.id}`,
        JSON.stringify({ slideIndex: currentSlideIndex, timestamp: Date.now() })
      );
    }
  }, [selectedLecture, currentSlideIndex, viewMode]);

  // Laser pointer mouse handler
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!showLaser) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setLaserPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, [showLaser]);

  // Double-click to enter fullscreen
  const handleDoubleClick = useCallback(() => {
    if (viewMode === 'view') {
      enterPresent();
    }
  }, [viewMode]);

  // Touch handlers for swipe navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    const threshold = 50; // minimum swipe distance

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        nextSlide(); // swipe left = next
      } else {
        prevSlide(); // swipe right = prev
      }
    }

    touchStartX.current = null;
  }, [currentSlideIndex, currentSlides.length]);

  // Calculate progress percentage
  const progressPercent = currentSlides.length > 0
    ? ((currentSlideIndex + 1) / currentSlides.length) * 100
    : 0;

  if (loading) {
    return <div className="loading-state">Đang tải...</div>;
  }

  // JLPT level order and colors
  const jlptLevels: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
  const levelColors: Record<JLPTLevel, string> = {
    N5: '#27ae60',
    N4: '#3498db',
    N3: '#9b59b6',
    N2: '#e67e22',
    N1: '#e74c3c',
  };
  const levelDescriptions: Record<JLPTLevel, string> = {
    N5: 'Sơ cấp - Cơ bản',
    N4: 'Sơ cấp - Nâng cao',
    N3: 'Trung cấp',
    N2: 'Trung cao cấp',
    N1: 'Cao cấp',
  };

  // Count lectures per level
  const getLectureCountByLevel = (level: JLPTLevel) => {
    return visibleLectures.filter(l => l.jlptLevel === level).length;
  };

  // Count folders per level
  const getFolderCountByLevel = (level: JLPTLevel) => {
    return lectureFolders.filter(f => f.jlptLevel === level).length;
  };

  // ============ LEVELS VIEW - Select JLPT Level ============
  if (viewMode === 'levels') {
    return (
      <div className="lecture-page">
        <div className="lecture-header">
          <h1>Bài giảng</h1>
          {isAdmin && onNavigateToEditor && (
            <button className="btn btn-primary" onClick={() => onNavigateToEditor()}>
              + Tạo bài giảng
            </button>
          )}
        </div>

        <div className="lecture-nav-breadcrumb">
          <span className="breadcrumb-current">Chọn cấp độ</span>
        </div>

        <div className="lecture-levels-grid">
          {jlptLevels.map((level) => {
            const folderCount = getFolderCountByLevel(level);
            const lectureCount = getLectureCountByLevel(level);

            return (
              <div
                key={level}
                className="lecture-level-card"
                style={{ borderColor: levelColors[level] }}
                onClick={() => handleSelectLevel(level)}
              >
                <div className="level-card-header" style={{ backgroundColor: levelColors[level] }}>
                  <h2>{level}</h2>
                </div>
                <div className="level-card-body">
                  <p className="level-description">{levelDescriptions[level]}</p>
                  <div className="level-stats">
                    <span>{folderCount} bài học</span>
                    <span>{lectureCount} bài giảng</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ============ FOLDERS VIEW - Select Lesson/Folder ============
  if (viewMode === 'folders') {
    return (
      <div className="lecture-page">
        <div className="lecture-header">
          <h1>Bài giảng - {selectedLevel}</h1>
          {isAdmin && onNavigateToEditor && (
            <button className="btn btn-primary" onClick={() => onNavigateToEditor()}>
              + Tạo bài giảng
            </button>
          )}
        </div>

        <div className="lecture-nav-breadcrumb">
          <button className="breadcrumb-link" onClick={() => handleBack()}>
            Cấp độ
          </button>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current" style={{ color: levelColors[selectedLevel!] }}>
            {selectedLevel}
          </span>
        </div>

        {currentFolders.length === 0 ? (
          <div className="empty-state">
            <p>Chưa có bài học nào cho cấp độ {selectedLevel}</p>
            {isAdmin && <p className="hint">Tạo bài học trong trang quản lý bài giảng</p>}
          </div>
        ) : (
          <div className="lecture-folders-grid">
            {currentFolders.map((folder, index) => {
              const lecturesInFolder = getLecturesByFolder(folder.id).filter(l => !l.isHidden || canSeeHiddenLecture(l));
              return (
                <div
                  key={folder.id}
                  className="lecture-folder-card"
                  onClick={() => handleSelectFolder(folder)}
                >
                  <div className="folder-card-icon">📚</div>
                  <div className="folder-card-content">
                    <h3>Bài {index + 1}: {folder.name}</h3>
                    <span className="folder-lecture-count">{lecturesInFolder.length} bài giảng</span>
                  </div>
                  <div className="folder-card-arrow">›</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ============ LECTURES VIEW - Select Lecture in Folder ============
  if (viewMode === 'lectures') {
    return (
      <div className="lecture-page">
        <div className="lecture-header">
          <h1>{selectedFolder?.name}</h1>
          {isAdmin && onNavigateToEditor && (
            <button className="btn btn-primary" onClick={() => onNavigateToEditor()}>
              + Tạo bài giảng
            </button>
          )}
        </div>

        <div className="lecture-nav-breadcrumb">
          <button className="breadcrumb-link" onClick={() => { setSelectedFolder(null); setSelectedLevel(null); setViewMode('levels'); }}>
            Cấp độ
          </button>
          <span className="breadcrumb-separator">›</span>
          <button
            className="breadcrumb-link"
            style={{ color: levelColors[selectedLevel!] }}
            onClick={() => handleBack()}
          >
            {selectedLevel}
          </button>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">{selectedFolder?.name}</span>
        </div>

        <div className="lecture-filters">
          <input
            type="text"
            placeholder="Tìm kiếm bài giảng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {filteredLectures.length === 0 ? (
          <div className="empty-state">
            <p>Chưa có bài giảng nào trong bài học này</p>
          </div>
        ) : (
          <div className="lecture-grid">
            {filteredLectures.map((lecture) => (
              <LectureCard
                key={lecture.id}
                lecture={lecture}
                onClick={() => handleSelectLecture(lecture)}
                showActions={isAdmin}
                onEdit={isAdmin && onNavigateToEditor ? () => onNavigateToEditor(lecture.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Grid view mode
  if (viewMode === 'grid') {
    return (
      <div className="lecture-view">
        <div className="lecture-view-header">
          <button className="btn btn-back" onClick={handleBack}>
            ← Quay lại
          </button>
          <h2>{selectedLecture?.title}</h2>
          <div className="lecture-view-actions">
            <button className="btn btn-secondary" onClick={() => setViewMode('view')}>
              Slide đơn
            </button>
            <button className="btn btn-present" onClick={enterPresent}>
              🖥️ Present (F)
            </button>
          </div>
        </div>

        <div className="slides-grid-view">
          {currentSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`grid-slide-item ${index === currentSlideIndex ? 'active' : ''}`}
              onClick={() => {
                goToSlide(index);
                setViewMode('view');
              }}
            >
              <div className="grid-slide-preview">
                <SlideRenderer slide={slide} isPresenting={false} />
              </div>
              <div className="grid-slide-number">{index + 1}</div>
              {slide.title && <div className="grid-slide-title">{slide.title}</div>}
            </div>
          ))}
        </div>

        <div className="keyboard-hints">
          <span>O xem slide đơn</span>
          <span>F toàn màn hình</span>
          <span>ESC quay lại</span>
        </div>
      </div>
    );
  }

  // Presentation mode
  if (viewMode === 'present') {
    const currentSlide = currentSlides[currentSlideIndex];
    const nextSlidePreview = currentSlides[currentSlideIndex + 1];

    return (
      <div
        className={`presentation-mode ${slideDirection ? `slide-${slideDirection}` : ''} ${showLaser ? 'laser-active' : ''}`}
        onClick={handleSlideClick}
        onMouseMove={handleMouseMove}
      >
        {/* Blank screen overlay */}
        {blankScreen && (
          <div className={`blank-screen blank-${blankScreen}`} />
        )}

        {/* Help overlay */}
        {showHelp && (
          <div className="help-overlay" onClick={(e) => { e.stopPropagation(); setShowHelp(false); }}>
            <div className="help-content" onClick={(e) => e.stopPropagation()}>
              <h3>Phím tắt</h3>
              <div className="help-grid">
                <div><kbd>← → ↑ ↓</kbd> Điều hướng slide</div>
                <div><kbd>Space</kbd> Slide tiếp theo</div>
                <div><kbd>Home</kbd> Slide đầu tiên</div>
                <div><kbd>End</kbd> Slide cuối cùng</div>
                <div><kbd>G</kbd> Chuyển đến slide</div>
                <div><kbd>B</kbd> Màn hình đen</div>
                <div><kbd>W</kbd> Màn hình trắng</div>
                <div><kbd>L</kbd> Bật/tắt laser</div>
                <div><kbd>S</kbd> Ghi chú slide</div>
                <div><kbd>V</kbd> Preview slide tiếp</div>
                <div><kbd>O</kbd> Xem tất cả (grid)</div>
                <div><kbd>F</kbd> Toàn màn hình</div>
                <div><kbd>ESC</kbd> Thoát</div>
                <div><kbd>H / ?</kbd> Hiện trợ giúp</div>
              </div>
              <button className="btn btn-primary" onClick={() => setShowHelp(false)}>Đóng</button>
            </div>
          </div>
        )}

        {/* Jump to slide dialog */}
        {showJumpDialog && (
          <div className="jump-dialog" onClick={(e) => e.stopPropagation()}>
            <label>Chuyển đến slide:</label>
            <input
              ref={jumpInputRef}
              type="number"
              min={1}
              max={currentSlides.length}
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJumpToSlide();
                if (e.key === 'Escape') {
                  setShowJumpDialog(false);
                  setJumpInput('');
                }
              }}
              placeholder={`1-${currentSlides.length}`}
            />
            <button onClick={handleJumpToSlide}>Go</button>
          </div>
        )}

        {/* Laser pointer */}
        {showLaser && (
          <div
            className="laser-pointer"
            style={{ left: laserPosition.x, top: laserPosition.y }}
          />
        )}

        {/* Slide content with transition */}
        <div className={`presentation-slide ${slideDirection ? `animate-${slideDirection}` : ''} ${showNotes ? 'with-notes' : ''}`}>
          {currentSlide && <SlideRenderer slide={currentSlide} isPresenting={true} slideKey={currentSlideIndex} />}
        </div>

        {/* Presenter notes panel */}
        {showNotes && currentSlide?.notes && (
          <div className="presenter-notes" onClick={(e) => e.stopPropagation()}>
            <h4>Ghi chú</h4>
            <p>{currentSlide.notes}</p>
          </div>
        )}

        {/* Next slide preview */}
        {showNextPreview && nextSlidePreview && (
          <div className="next-slide-preview" onClick={(e) => e.stopPropagation()}>
            <div className="preview-label">Tiếp theo</div>
            <div className="preview-content">
              <SlideRenderer slide={nextSlidePreview} isPresenting={false} />
            </div>
          </div>
        )}

        {/* Enhanced presentation controls */}
        <div className="presentation-controls">
          <span className="presentation-timer">{formatTime(presentationTime)}</span>
          <button onClick={prevSlide} disabled={currentSlideIndex === 0}>
            ←
          </button>
          <span className="presentation-counter">
            {currentSlideIndex + 1} / {currentSlides.length}
          </span>
          <button
            onClick={nextSlide}
            disabled={currentSlideIndex >= currentSlides.length - 1}
          >
            →
          </button>
          <button
            onClick={() => setBlankScreen(blankScreen === 'black' ? null : 'black')}
            className={blankScreen === 'black' ? 'active' : ''}
            title="B: Màn hình đen"
          >
            B
          </button>
          <button
            onClick={() => setBlankScreen(blankScreen === 'white' ? null : 'white')}
            className={blankScreen === 'white' ? 'active' : ''}
            title="W: Màn hình trắng"
          >
            W
          </button>
          <button
            onClick={() => setShowLaser(!showLaser)}
            className={showLaser ? 'active' : ''}
            title="L: Laser pointer"
          >
            ●
          </button>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={showNotes ? 'active' : ''}
            title="S: Ghi chú"
          >
            📝
          </button>
          <button
            onClick={() => {
              setShowJumpDialog(true);
              setTimeout(() => jumpInputRef.current?.focus(), 100);
            }}
            title="G: Chuyển đến slide"
          >
            #
          </button>
          <button
            onClick={() => setShowHelp(true)}
            title="H: Trợ giúp"
          >
            ?
          </button>
          <button onClick={exitPresent} className="exit-btn">
            ESC
          </button>
        </div>

        {/* Click hint areas (visual feedback) */}
        <div className="click-hint-left" title="Click để quay lại" />
        <div className="click-hint-right" title="Click để tiếp tục" />
      </div>
    );
  }

  // View mode (single lecture with slides)
  const currentSlide = currentSlides[currentSlideIndex];
  const currentSlideUserNote = currentSlide ? userNotes[currentSlide.id] || '' : '';

  return (
    <div className="lecture-view">
      <div className="lecture-view-header">
        <button className="btn btn-back" onClick={handleBack}>
          ← Quay lại
        </button>
        <h2>{selectedLecture?.title}</h2>
        <div className="lecture-view-actions">
          <button
            className={`btn btn-auto ${autoAdvance ? 'active' : ''}`}
            onClick={() => setAutoAdvance(!autoAdvance)}
            title={autoAdvance ? 'Tắt tự động chuyển' : 'Bật tự động chuyển'}
          >
            {autoAdvance ? '⏸️' : '▶️'} Auto
          </button>
          {autoAdvance && (
            <select
              className="auto-interval-select"
              value={autoAdvanceInterval}
              onChange={(e) => setAutoAdvanceInterval(Number(e.target.value))}
            >
              <option value={5}>5s</option>
              <option value={10}>10s</option>
              <option value={15}>15s</option>
              <option value={20}>20s</option>
              <option value={30}>30s</option>
            </select>
          )}
          <button
            className="btn btn-secondary"
            onClick={toggleGridView}
            title="O: Xem tất cả slides"
          >
            ⊞ Grid (O)
          </button>
          {/* Floating notes toggle for students */}
          <button
            className={`btn btn-secondary ${showFloatingNotes ? 'active' : ''}`}
            onClick={() => setShowFloatingNotes(!showFloatingNotes)}
            title="Ghi chú cá nhân"
          >
            ✏️ Ghi chú
          </button>
          {/* Teacher notes toggle - only for teachers */}
          {isAdmin && (
            <button
              className={`btn btn-secondary ${showNotes ? 'active' : ''}`}
              onClick={() => setShowNotes(!showNotes)}
              title="S: Ghi chú giáo viên"
            >
              📝 Notes
            </button>
          )}
          <button className="btn btn-present" onClick={enterPresent}>
            🖥️ Present (F)
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="lecture-progress-bar">
        <div
          className="lecture-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Resume progress dialog */}
      {resumePrompt && (
        <div className="resume-dialog-overlay">
          <div className="resume-dialog">
            <h3>Tiếp tục học?</h3>
            <p>Bạn đã xem đến slide {resumePrompt.slideIndex + 1}. Bạn muốn tiếp tục từ đó?</p>
            <div className="resume-actions">
              <button className="btn btn-primary" onClick={handleResume}>
                Tiếp tục (Slide {resumePrompt.slideIndex + 1})
              </button>
              <button className="btn btn-secondary" onClick={handleStartOver}>
                Bắt đầu lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help overlay */}
      {showHelp && (
        <div className="help-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-content" onClick={(e) => e.stopPropagation()}>
            <h3>Phím tắt</h3>
            <div className="help-grid">
              <div><kbd>← → ↑ ↓</kbd> Điều hướng slide</div>
              <div><kbd>Space</kbd> Slide tiếp theo</div>
              <div><kbd>Home</kbd> Slide đầu tiên</div>
              <div><kbd>End</kbd> Slide cuối cùng</div>
              <div><kbd>G</kbd> Chuyển đến slide</div>
              <div><kbd>O</kbd> Xem tất cả (grid)</div>
              <div><kbd>F</kbd> Toàn màn hình</div>
              <div><kbd>ESC</kbd> Thoát</div>
              <div><kbd>H / ?</kbd> Hiện trợ giúp</div>
              <div><kbd>Double-click</kbd> Toàn màn hình</div>
            </div>
            <button className="btn btn-primary" onClick={() => setShowHelp(false)}>Đóng</button>
          </div>
        </div>
      )}

      <div className="lecture-view-content">
        {slidesLoading ? (
          <div className="loading-state">Đang tải slides...</div>
        ) : currentSlides.length === 0 ? (
          <div className="empty-state">
            <p>Bài giảng chưa có slide nào</p>
          </div>
        ) : (
          <>
            <div
              className={`slide-viewer ${slideDirection ? `slide-${slideDirection}` : ''}`}
              ref={slideContainerRef}
              onClick={handleSlideClick}
              onDoubleClick={handleDoubleClick}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className={`slide-content ${slideDirection ? `animate-${slideDirection}` : ''}`}>
                {currentSlide && <SlideRenderer slide={currentSlide} slideKey={currentSlideIndex} />}
              </div>
              {/* Click hint areas */}
              <div className="click-area-left" />
              <div className="click-area-right" />

              {/* Floating notes panel - overlaid on slide */}
              {showFloatingNotes && currentSlide && (
                <div className="floating-notes-panel" onClick={(e) => e.stopPropagation()}>
                  <div className="floating-notes-header">
                    <span>✏️ Ghi chú của tôi</span>
                    <button
                      className="btn-minimize"
                      onClick={() => setShowFloatingNotes(false)}
                      title="Ẩn ghi chú"
                    >
                      −
                    </button>
                  </div>
                  <textarea
                    className="floating-notes-textarea"
                    placeholder="Ghi chú cho slide này..."
                    value={currentSlideUserNote}
                    onChange={(e) => currentSlide && saveUserNote(currentSlide.id, e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Teacher notes panel - only visible to admin */}
            {isAdmin && showNotes && currentSlide?.notes && (
              <div className="teacher-notes-panel">
                <div className="teacher-notes-header">
                  <span>📝 Ghi chú giáo viên</span>
                  <button className="btn-close" onClick={() => setShowNotes(false)}>×</button>
                </div>
                <div className="teacher-notes-content">
                  {currentSlide.notes}
                </div>
              </div>
            )}

            {/* Empty notes indicator for admin */}
            {isAdmin && showNotes && !currentSlide?.notes && (
              <div className="teacher-notes-panel empty">
                <div className="teacher-notes-header">
                  <span>📝 Ghi chú giáo viên</span>
                  <button className="btn-close" onClick={() => setShowNotes(false)}>×</button>
                </div>
                <div className="teacher-notes-content">
                  <em>Slide này chưa có ghi chú</em>
                </div>
              </div>
            )}

            <div className="slide-navigation">
              <button
                className="nav-btn"
                onClick={prevSlide}
                disabled={currentSlideIndex === 0}
              >
                ← Trước
              </button>
              <span className="slide-counter">
                {currentSlideIndex + 1} / {currentSlides.length}
              </span>
              <button
                className="nav-btn"
                onClick={nextSlide}
                disabled={currentSlideIndex >= currentSlides.length - 1}
              >
                Tiếp →
              </button>
            </div>

            <div className="slide-thumbnails">
              {currentSlides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`thumbnail ${index === currentSlideIndex ? 'active' : ''} ${index < currentSlideIndex ? 'viewed' : ''}`}
                  onClick={() => goToSlide(index)}
                >
                  <span>{index + 1}</span>
                  {slide.title && <small>{slide.title}</small>}
                </div>
              ))}
            </div>

            {/* Keyboard hints */}
            <div className="keyboard-hints">
              <span>← → điều hướng</span>
              <span>Double-click fullscreen</span>
              <span>O grid</span>
              <span>G jump</span>
              <span>? help</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
