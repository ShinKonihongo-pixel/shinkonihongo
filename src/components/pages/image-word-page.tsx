// Image-Word Game Page
// Main page orchestrating game flow: menu → lesson select → play → results

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Image, Play, Settings, HelpCircle } from 'lucide-react';
import { ImageWordLessonSelect, ImageWordGamePlay, ImageWordResults } from '../image-word';
import { ImageWordManagementPage } from './image-word-management-page';
import { useImageWordGame } from '../../hooks/use-image-word-game';
import type { ImageWordLesson } from '../../types/image-word';

type PageView = 'menu' | 'lessons' | 'play' | 'results' | 'management' | 'guide';

interface ImageWordPageProps {
  onClose: () => void;
  initialView?: PageView;
  initialRoomConfig?: Record<string, unknown>;
}

export const ImageWordPage: React.FC<ImageWordPageProps> = ({ onClose, initialView = 'menu', initialRoomConfig: _initialRoomConfig }) => {
  const [view, setView] = useState<PageView>(initialView);

  const {
    lessons,
    gameState,
    gameResult,
    wrongAnimation,
    loadLessons,
    startGame,
    selectImage,
    selectWord,
    resetGame,
  } = useImageWordGame();

  // Load lessons on mount
  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  // Reload lessons when returning from management
  useEffect(() => {
    if (view === 'lessons') {
      loadLessons();
    }
  }, [view, loadLessons]);

  // Handle lesson selection
  const handleSelectLesson = useCallback((lesson: ImageWordLesson) => {
    startGame(lesson);
    setView('play');
  }, [startGame]);

  // Handle play again (same lesson)
  const handlePlayAgain = useCallback(() => {
    if (gameResult && lessons.length > 0) {
      const lesson = lessons.find(l => l.id === gameResult.lessonId);
      if (lesson) {
        startGame(lesson);
        setView('play');
        return;
      }
    }
    resetGame();
    setView('lessons');
  }, [gameResult, lessons, startGame, resetGame]);

  // Handle back from game/results
  const handleBackToLessons = useCallback(() => {
    resetGame();
    setView('lessons');
  }, [resetGame]);

  // Watch for game completion
  useEffect(() => {
    if (gameState?.isComplete && gameResult) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setView('results');
    }
  }, [gameState?.isComplete, gameResult]);

  // Render based on view
  const renderContent = () => {
    switch (view) {
      case 'guide':
        return (
          <div className="image-word-guide">
            <div className="guide-header">
              <button className="btn-back" onClick={() => setView('menu')}>
                <ArrowLeft size={20} />
                Quay Lại
              </button>
              <h2>Hướng Dẫn Chơi</h2>
            </div>
            <div className="guide-content">
              <div className="guide-section">
                <h3>🎯 Mục Tiêu</h3>
                <p>Nối đúng hình ảnh với từ vựng tương ứng càng nhanh càng tốt.</p>
              </div>
              <div className="guide-section">
                <h3>🎮 Cách Chơi</h3>
                <ol>
                  <li>Chọn một bài học có sẵn hoặc tạo bài mới trong phần Quản Lý</li>
                  <li>Nhấn vào hình ảnh bên trái, sau đó nhấn vào từ tương ứng bên phải</li>
                  <li>Nếu nối đúng, cặp sẽ chuyển màu xanh và biến mất</li>
                  <li>Nếu nối sai, cặp sẽ rung đỏ và bạn mất điểm</li>
                  <li>Hoàn thành tất cả các cặp để xem kết quả</li>
                </ol>
              </div>
              <div className="guide-section">
                <h3>⭐ Tính Điểm</h3>
                <ul>
                  <li>+100 điểm mỗi cặp nối đúng</li>
                  <li>-10 điểm mỗi lần nối sai</li>
                  <li>Bonus thời gian nếu hoàn thành dưới 1 phút</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'management':
        return (
          <ImageWordManagementPage onBack={() => setView('menu')} />
        );

      case 'lessons':
        return (
          <ImageWordLessonSelect
            lessons={lessons}
            onSelectLesson={handleSelectLesson}
            onBack={() => setView('menu')}
            onManage={() => setView('management')}
          />
        );

      case 'play':
        if (!gameState) {
          setView('lessons');
          return null;
        }
        return (
          <ImageWordGamePlay
            gameState={gameState}
            wrongAnimation={wrongAnimation}
            onSelectImage={selectImage}
            onSelectWord={selectWord}
            onBack={handleBackToLessons}
          />
        );

      case 'results':
        if (!gameResult) {
          setView('lessons');
          return null;
        }
        return (
          <ImageWordResults
            result={gameResult}
            onPlayAgain={handlePlayAgain}
            onBack={handleBackToLessons}
          />
        );

      default: // menu
        return (
          <div className="image-word-menu">
            <div className="menu-header">
              <button className="btn-back" onClick={onClose}>
                <ArrowLeft size={20} />
              </button>
              <div className="menu-title">
                <span className="menu-icon">🖼️</span>
                <h1>Nối Hình - Từ</h1>
              </div>
            </div>

            <div className="menu-description">
              <p>Nối hình ảnh với từ vựng tiếng Nhật tương ứng</p>
              <span className="lesson-count">{lessons.length} bài học có sẵn</span>
            </div>

            <div className="menu-actions">
              <button
                className="menu-btn primary"
                onClick={() => setView('lessons')}
                disabled={lessons.length === 0}
              >
                <Play size={24} />
                Chơi Ngay
              </button>

              <button className="menu-btn secondary" onClick={() => setView('management')}>
                <Settings size={20} />
                Quản Lý Bài Học
              </button>

              <button className="menu-btn tertiary" onClick={() => setView('guide')}>
                <HelpCircle size={20} />
                Hướng Dẫn
              </button>
            </div>

            {lessons.length === 0 && (
              <div className="menu-notice">
                <Image size={20} />
                <span>Tạo bài học đầu tiên trong phần Quản Lý để bắt đầu chơi</span>
              </div>
            )}
          </div>
        );
    }
  };

  return <div className="image-word-page">{renderContent()}</div>;
};
