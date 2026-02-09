// Lecture page - slideshow presentation for students

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLectures, useSlides, useLectureView } from '../../hooks/use-lectures';
import { useAuth } from '../../hooks/use-auth';
import type { Lecture, LectureFolder } from '../../types/lecture';
import type { JLPTLevel } from '../../types/flashcard';
import { LevelsView } from './lecture/levels-view';
import { FoldersView } from './lecture/folders-view';
import { LecturesView } from './lecture/lectures-view';
import { GridView } from './lecture/grid-view';
import { PresentationMode } from './lecture/presentation-mode';
import { ViewMode } from './lecture/view-mode';
import { useKeyboardNavigation } from './lecture/use-keyboard-navigation';
import { saveProgress, loadProgress, clearProgress, loadNotes, saveNotes } from './lecture/utils';
import type { LecturePageProps, ViewMode as ViewModeType } from './lecture/types';

export function LecturePage({ onNavigateToEditor }: LecturePageProps) {
  const { currentUser, isAdmin } = useAuth();
  const { lectures, lectureFolders, loading, getFoldersByLevel, getLecturesByFolder } = useLectures(isAdmin);

  // Navigation state
  const [viewMode, setViewMode] = useState<ViewModeType>('levels');
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<LectureFolder | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Floating notes state
  const [showFloatingNotes, setShowFloatingNotes] = useState(true);
  const [userNotes, setUserNotes] = useState<Record<string, string>>({});

  // Auto-advance settings
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [autoAdvanceInterval, setAutoAdvanceInterval] = useState(10);

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

  const { slides: currentSlides, loading: slidesLoading } = useSlides(selectedLecture?.id || null);
  const { recordView } = useLectureView(selectedLecture?.id || null, currentUser?.id || null);

  // Check if user can see hidden lectures
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const canSeeHiddenLecture = (lecture: Lecture): boolean => {
    if (isSuperAdmin) return true;
    return lecture.authorId === currentUser?.id;
  };

  const visibleLectures = lectures.filter((lecture) => {
    if (lecture.isHidden && !canSeeHiddenLecture(lecture)) return false;
    return true;
  });

  const currentFolders = selectedLevel ? getFoldersByLevel(selectedLevel) : [];
  const currentLectures = selectedFolder
    ? getLecturesByFolder(selectedFolder.id).filter(l => !l.isHidden || canSeeHiddenLecture(l))
    : [];

  const filteredLectures = currentLectures.filter((lecture) => {
    if (!searchQuery) return true;
    return lecture.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lecture.description?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSelectLecture = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    const savedProgress = loadProgress(lecture.id);
    if (savedProgress && savedProgress.slideIndex > 0) {
      setResumePrompt({ lectureId: lecture.id, slideIndex: savedProgress.slideIndex });
      setCurrentSlideIndex(0);
      setViewMode('view');
      return;
    }
    setCurrentSlideIndex(0);
    setViewMode('view');
  };

  const handleResume = () => {
    if (resumePrompt) {
      setCurrentSlideIndex(resumePrompt.slideIndex);
      setResumePrompt(null);
    }
  };

  const handleStartOver = () => {
    if (resumePrompt && selectedLecture) {
      clearProgress(selectedLecture.id);
    }
    setResumePrompt(null);
    setCurrentSlideIndex(0);
  };

  const goToSlide = useCallback((index: number, direction?: 'next' | 'prev') => {
    if (index >= 0 && index < currentSlides.length) {
      const dir = direction || (index > currentSlideIndex ? 'next' : 'prev');
      setSlideDirection(dir);
      setCurrentSlideIndex(index);
      recordView(index, index === currentSlides.length - 1);
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

  const handleSlideClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, .presentation-controls, input')) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isLeftSide = clickX < rect.width * 0.2;
    if (isLeftSide) prevSlide();
    else nextSlide();
  }, [nextSlide, prevSlide]);

  const handleJumpToSlide = useCallback(() => {
    const slideNum = parseInt(jumpInput, 10);
    if (slideNum >= 1 && slideNum <= currentSlides.length) {
      goToSlide(slideNum - 1);
      setShowJumpDialog(false);
      setJumpInput('');
    }
  }, [jumpInput, currentSlides.length, goToSlide]);

  const toggleGridView = useCallback(() => {
    setViewMode(viewMode === 'grid' ? 'view' : 'grid');
  }, [viewMode]);

  const enterPresent = () => {
    setViewMode('present');
    setBlankScreen(null);
    presentationStartRef.current = Date.now();
    setPresentationTime(0);
    document.documentElement.requestFullscreen?.();
  };

  const exitPresent = () => {
    setViewMode('view');
    setBlankScreen(null);
    setShowJumpDialog(false);
    presentationStartRef.current = null;
    document.exitFullscreen?.();
  };

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

  const backToList = () => {
    setSelectedLecture(null);
    setSelectedFolder(null);
    setSelectedLevel(null);
    setViewMode('levels');
    setCurrentSlideIndex(0);
  };

  const saveUserNote = (slideId: string, note: string) => {
    if (!selectedLecture) return;
    const newNotes = { ...userNotes, [slideId]: note };
    setUserNotes(newNotes);
    saveNotes(selectedLecture.id, newNotes);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!showLaser) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setLaserPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [showLaser]);

  const handleDoubleClick = useCallback(() => {
    if (viewMode === 'view') enterPresent();
  }, [viewMode]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
    touchStartX.current = null;
  }, [nextSlide, prevSlide]);

  useEffect(() => {
    if (selectedLecture) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserNotes(loadNotes(selectedLecture.id));
    }
  }, [selectedLecture]);

  useKeyboardNavigation({
    viewMode,
    currentSlideIndex,
    totalSlides: currentSlides.length,
    blankScreen,
    showJumpDialog,
    showLaser,
    showNotes,
    showHelp,
    showNextPreview,
    isAdmin,
    onNextSlide: nextSlide,
    onPrevSlide: prevSlide,
    onGoToSlide: goToSlide,
    onToggleBlankScreen: (type) => setBlankScreen(blankScreen === type ? null : type),
    onClearBlankScreen: () => setBlankScreen(null),
    onShowJumpDialog: () => setShowJumpDialog(true),
    onCloseJumpDialog: () => { setShowJumpDialog(false); setJumpInput(''); },
    onJumpToSlide: handleJumpToSlide,
    onEnterPresent: enterPresent,
    onExitPresent: exitPresent,
    onToggleGridView: toggleGridView,
    onToggleLaser: () => setShowLaser(!showLaser),
    onToggleNotes: () => setShowNotes(!showNotes),
    onToggleHelp: () => setShowHelp(!showHelp),
    onToggleNextPreview: () => setShowNextPreview(!showNextPreview),
    onBackToList: backToList,
  });

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

  useEffect(() => {
    if (viewMode !== 'present' || !presentationStartRef.current) return;
    const interval = setInterval(() => {
      setPresentationTime(Math.floor((Date.now() - presentationStartRef.current!) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [viewMode]);

  useEffect(() => {
    if (!autoAdvance || viewMode === 'levels' || viewMode === 'folders' || viewMode === 'lectures') return;
    if (currentSlideIndex >= currentSlides.length - 1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAutoAdvance(false);
      return;
    }
    const timer = setTimeout(() => nextSlide(), autoAdvanceInterval * 1000);
    return () => clearTimeout(timer);
  }, [autoAdvance, currentSlideIndex, autoAdvanceInterval, viewMode, currentSlides.length, nextSlide]);

  useEffect(() => {
    if (!selectedLecture || viewMode === 'levels' || viewMode === 'folders' || viewMode === 'lectures') return;
    saveProgress(selectedLecture.id, currentSlideIndex);
  }, [selectedLecture, currentSlideIndex, viewMode]);

  if (loading) {
    return <div className="loading-state">Đang tải...</div>;
  }

  if (viewMode === 'levels') {
    return (
      <LevelsView
        isAdmin={isAdmin}
        onNavigateToEditor={onNavigateToEditor}
        onSelectLevel={(level) => { setSelectedLevel(level); setViewMode('folders'); }}
        visibleLectures={visibleLectures}
        lectureFolders={lectureFolders}
      />
    );
  }

  if (viewMode === 'folders' && selectedLevel) {
    return (
      <FoldersView
        isAdmin={isAdmin}
        selectedLevel={selectedLevel}
        currentFolders={currentFolders}
        onNavigateToEditor={onNavigateToEditor}
        onBack={handleBack}
        onSelectFolder={(folder) => { setSelectedFolder(folder); setViewMode('lectures'); }}
        getLecturesByFolder={(folderId) => getLecturesByFolder(folderId).filter(l => !l.isHidden || canSeeHiddenLecture(l)).length}
      />
    );
  }

  if (viewMode === 'lectures' && selectedFolder && selectedLevel) {
    return (
      <LecturesView
        isAdmin={isAdmin}
        selectedLevel={selectedLevel}
        selectedFolder={selectedFolder}
        filteredLectures={filteredLectures}
        searchQuery={searchQuery}
        onNavigateToEditor={onNavigateToEditor}
        onBackToLevels={() => { setSelectedFolder(null); setSelectedLevel(null); setViewMode('levels'); }}
        onBackToFolders={handleBack}
        onSelectLecture={handleSelectLecture}
        onSearchChange={setSearchQuery}
      />
    );
  }

  if (viewMode === 'grid' && selectedLecture) {
    return (
      <GridView
        lectureTitle={selectedLecture.title}
        currentSlides={currentSlides}
        currentSlideIndex={currentSlideIndex}
        onBack={handleBack}
        onSwitchToView={() => setViewMode('view')}
        onEnterPresent={enterPresent}
        onSelectSlide={(index) => { goToSlide(index); setViewMode('view'); }}
      />
    );
  }

  if (viewMode === 'present') {
    const currentSlide = currentSlides[currentSlideIndex];
    const nextSlidePreview = currentSlides[currentSlideIndex + 1];

    return (
      <PresentationMode
        currentSlide={currentSlide}
        nextSlide={nextSlidePreview}
        currentSlideIndex={currentSlideIndex}
        totalSlides={currentSlides.length}
        slideDirection={slideDirection}
        blankScreen={blankScreen}
        showHelp={showHelp}
        showJumpDialog={showJumpDialog}
        showLaser={showLaser}
        showNotes={showNotes}
        showNextPreview={showNextPreview}
        jumpInput={jumpInput}
        laserPosition={laserPosition}
        presentationTime={presentationTime}
        onSlideClick={handleSlideClick}
        onMouseMove={handleMouseMove}
        onPrevSlide={prevSlide}
        onNextSlide={nextSlide}
        onToggleBlack={() => setBlankScreen(blankScreen === 'black' ? null : 'black')}
        onToggleWhite={() => setBlankScreen(blankScreen === 'white' ? null : 'white')}
        onToggleLaser={() => setShowLaser(!showLaser)}
        onToggleNotes={() => setShowNotes(!showNotes)}
        onShowJump={() => setShowJumpDialog(true)}
        onCloseJump={() => { setShowJumpDialog(false); setJumpInput(''); }}
        onJumpToSlide={handleJumpToSlide}
        onJumpInputChange={setJumpInput}
        onShowHelp={() => setShowHelp(true)}
        onCloseHelp={() => setShowHelp(false)}
        onExit={exitPresent}
      />
    );
  }

  const currentSlide = currentSlides[currentSlideIndex];
  const currentSlideUserNote = currentSlide ? userNotes[currentSlide.id] || '' : '';
  const progressPercent = currentSlides.length > 0 ? ((currentSlideIndex + 1) / currentSlides.length) * 100 : 0;

  return (
    <ViewMode
      lectureTitle={selectedLecture?.title || ''}
      currentSlides={currentSlides}
      currentSlide={currentSlide}
      currentSlideIndex={currentSlideIndex}
      slidesLoading={slidesLoading}
      slideDirection={slideDirection}
      autoAdvance={autoAdvance}
      autoAdvanceInterval={autoAdvanceInterval}
      showFloatingNotes={showFloatingNotes}
      showNotes={showNotes}
      showHelp={showHelp}
      resumePrompt={resumePrompt}
      currentSlideUserNote={currentSlideUserNote}
      progressPercent={progressPercent}
      isAdmin={isAdmin}
      onBack={handleBack}
      onToggleAutoAdvance={() => setAutoAdvance(!autoAdvance)}
      onAutoIntervalChange={setAutoAdvanceInterval}
      onToggleGrid={toggleGridView}
      onToggleFloatingNotes={() => setShowFloatingNotes(!showFloatingNotes)}
      onToggleNotes={() => setShowNotes(!showNotes)}
      onEnterPresent={enterPresent}
      onSlideClick={handleSlideClick}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onPrevSlide={prevSlide}
      onNextSlide={nextSlide}
      onGoToSlide={goToSlide}
      onSaveNote={saveUserNote}
      onResume={handleResume}
      onStartOver={handleStartOver}
      onCloseHelp={() => setShowHelp(false)}
    />
  );
}
