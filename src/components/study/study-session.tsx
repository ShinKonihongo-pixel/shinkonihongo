// Study session component with spaced repetition
// JLPT level selection moved to level-lesson-selector

import { useState, useEffect } from 'react';
import { ArrowLeft, Settings, X } from 'lucide-react';
import type { Flashcard, JLPTLevel, MemorizationStatus, DifficultyLevel } from '../../types/flashcard';
import type { AppSettings } from '../../hooks/use-settings';
import { FlashcardItem } from '../flashcard/flashcard-item';

// Check if current screen is mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

interface StudySessionProps {
  currentCard: Flashcard | undefined;
  currentIndex: number;
  totalCards: number;
  isFlipped: boolean;
  onFlip: () => void;
  onSetMemorization: (status: MemorizationStatus) => void;
  onSetDifficulty: (level: DifficultyLevel) => void;
  filterMemorization: MemorizationStatus | 'all';
  onFilterMemorizationChange: (status: MemorizationStatus | 'all') => void;
  filterDifficulty: DifficultyLevel | 'all';
  onFilterDifficultyChange: (level: DifficultyLevel | 'all') => void;
  onShuffle: () => void;
  onResetOrder: () => void;
  isShuffled: boolean;
  clickCount: number;
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  settings: AppSettings;
  onBack?: () => void;
  selectedLevel?: JLPTLevel;
  frontFontSize?: number;
  onFrontFontSizeChange?: (size: number) => void;
  // Display settings callbacks
  onSettingsChange?: (key: keyof AppSettings, value: any) => void;
}

const MEMORIZATION_OPTIONS: { value: MemorizationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unset', label: 'Chưa đánh giá' },
  { value: 'memorized', label: 'Đã thuộc' },
  { value: 'not_memorized', label: 'Chưa thuộc' },
];

const DIFFICULTY_OPTIONS: { value: DifficultyLevel | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unset', label: 'Chưa đánh giá' },
  { value: 'super_hard', label: 'Siêu khó' },
  { value: 'hard', label: 'Khó nhớ' },
  { value: 'medium', label: 'Vừa' },
  { value: 'easy', label: 'Dễ nhớ' },
];

const LEVEL_COLORS: Record<JLPTLevel, { bg: string; text: string }> = {
  N5: { bg: '#ecfdf5', text: '#059669' },
  N4: { bg: '#eff6ff', text: '#2563eb' },
  N3: { bg: '#fef3c7', text: '#d97706' },
  N2: { bg: '#fce7f3', text: '#db2777' },
  N1: { bg: '#fef2f2', text: '#dc2626' },
};

const FONT_OPTIONS = [
  { value: 'Noto Serif JP', label: 'Noto Serif JP' },
  { value: 'Noto Sans JP', label: 'Noto Sans JP' },
  { value: 'Zen Maru Gothic', label: 'Zen Maru Gothic' },
  { value: 'Kosugi Maru', label: 'Kosugi Maru' },
  { value: 'M PLUS Rounded 1c', label: 'M PLUS Rounded' },
];

export function StudySession({
  currentCard,
  currentIndex,
  totalCards,
  isFlipped,
  onFlip,
  onSetMemorization,
  onSetDifficulty,
  filterMemorization,
  onFilterMemorizationChange,
  filterDifficulty,
  onFilterDifficultyChange,
  onShuffle,
  onResetOrder,
  isShuffled,
  clickCount,
  onNext,
  onPrev,
  canGoNext,
  canGoPrev,
  settings,
  onBack,
  selectedLevel,
  frontFontSize = 250,
  onFrontFontSizeChange,
  onSettingsChange,
}: StudySessionProps) {
  const isMobile = useIsMobile();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Handle memorization button click - toggle on/off
  const handleMemorizationClick = (status: MemorizationStatus) => {
    if (currentCard?.memorizationStatus === status) {
      onSetMemorization('unset');
    } else {
      onSetMemorization(status);
    }
  };

  // Handle difficulty button click - toggle on/off
  const handleDifficultyClick = (level: DifficultyLevel) => {
    if (currentCard?.difficultyLevel === level) {
      onSetDifficulty('unset');
    } else {
      onSetDifficulty(level);
    }
  };

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && canGoNext) {
      onNext();
    } else if (isRightSwipe && canGoPrev) {
      onPrev();
    }
  };

  if (!currentCard) {
    return (
      <div className="study-empty">
        <h2>🎉 Không có thẻ nào cần ôn!</h2>
        <p>Bạn đã hoàn thành tất cả các thẻ hoặc không có thẻ phù hợp với bộ lọc.</p>

        {/* Filters */}
        <div className="study-empty-filters">
          <div className="empty-filter-group">
            <label>Trạng thái:</label>
            <select
              value={filterMemorization}
              onChange={(e) => onFilterMemorizationChange(e.target.value as typeof filterMemorization)}
              className="empty-filter-select"
            >
              {MEMORIZATION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="empty-filter-group">
            <label>Độ khó:</label>
            <select
              value={filterDifficulty}
              onChange={(e) => onFilterDifficultyChange(e.target.value as typeof filterDifficulty)}
              className="empty-filter-select"
            >
              {DIFFICULTY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="study-empty-actions">
          {onBack && (
            <button className="back-btn-study" onClick={onBack}>
              <ArrowLeft size={18} /> Chọn bài khác
            </button>
          )}
          <button className="settings-btn-study" onClick={() => setShowSettingsModal(true)}>
            <Settings size={18} /> Cài đặt
          </button>
        </div>
        {/* Settings Modal */}
        {showSettingsModal && (
          <StudySettingsModal
            filterMemorization={filterMemorization}
            onFilterMemorizationChange={onFilterMemorizationChange}
            filterDifficulty={filterDifficulty}
            onFilterDifficultyChange={onFilterDifficultyChange}
            frontFontSize={frontFontSize}
            onFrontFontSizeChange={onFrontFontSizeChange}
            settings={settings}
            onSettingsChange={onSettingsChange}
            onClose={() => setShowSettingsModal(false)}
            isMobile={isMobile}
          />
        )}
      </div>
    );
  }

  const levelColors = selectedLevel ? LEVEL_COLORS[selectedLevel] : null;

  return (
    <div className="study-session">
      <div className="study-header">
        {/* Header with filters on desktop */}
        <div className="filter-bar-inline">
          {onBack && (
            <button className="back-btn-study" onClick={onBack}>
              <ArrowLeft size={isMobile ? 16 : 18} />
              {!isMobile && <span>Chọn bài khác</span>}
            </button>
          )}
          {selectedLevel && levelColors && (
            <span
              className="level-badge-study"
              style={{ background: levelColors.bg, color: levelColors.text }}
            >
              {selectedLevel}
            </span>
          )}

          {/* Desktop: Show filters in header */}
          {!isMobile && (
            <>
              <span className="filter-label">Trạng thái:</span>
              <select
                value={filterMemorization}
                onChange={(e) => onFilterMemorizationChange(e.target.value as typeof filterMemorization)}
                className="filter-select"
              >
                {MEMORIZATION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="filter-label">Độ khó:</span>
              <select
                value={filterDifficulty}
                onChange={(e) => onFilterDifficultyChange(e.target.value as typeof filterDifficulty)}
                className="filter-select"
              >
                {DIFFICULTY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </>
          )}

          <div className="header-spacer" />
          {!isMobile && (
            <div className="progress-info-header">
              <span>Thẻ {currentIndex + 1} / {totalCards}</span>
            </div>
          )}
          <div className="header-actions">
            <button
              className="header-action-btn"
              onClick={onShuffle}
              title="Xáo trộn thẻ"
            >
              🔀
            </button>
            <button
              className="header-action-btn"
              onClick={onResetOrder}
              title="Về thứ tự gốc"
              disabled={!isShuffled}
            >
              ↺
            </button>
            <button
              className="header-action-btn"
              onClick={() => setShowSettingsModal(true)}
              title="Cài đặt"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>

      <div
        className="study-card-area"
        onTouchStart={isMobile ? onTouchStart : undefined}
        onTouchMove={isMobile ? onTouchMove : undefined}
        onTouchEnd={isMobile ? onTouchEnd : undefined}
      >
        <div className="card-navigation">
          {!isMobile && (
            <button
              className="card-nav-btn"
              onClick={onPrev}
              disabled={!canGoPrev}
              title="Từ trước"
            >
              &lt;
            </button>
          )}
          <div
            className="card-wrapper"
            style={{
              transform: `scale(${(settings.cardScale || 100) / 100})`,
              transformOrigin: 'center center',
            }}
          >
            <FlashcardItem
              card={currentCard}
              isFlipped={isFlipped}
              onFlip={onFlip}
              settings={settings}
            />
            <div className="card-counter-badge">
              {currentIndex + 1} / {totalCards}
            </div>
          </div>
          {!isMobile && (
            <button
              className="card-nav-btn"
              onClick={onNext}
              disabled={!canGoNext}
              title="Từ tiếp"
            >
              &gt;
            </button>
          )}
        </div>
        {isMobile && (
          <p className="swipe-hint">← Vuốt để chuyển thẻ →</p>
        )}
      </div>

      {/* Footer: Memorization, Difficulty buttons */}
      <div className="action-buttons-inline">
        <div className="action-group">
          <span>Trạng thái:</span>
          <button
            className={`memo-btn memorized ${currentCard.memorizationStatus === 'memorized' ? 'active' : ''}`}
            onClick={() => handleMemorizationClick('memorized')}
          >
            ✓ {!isMobile && 'Đã '}thuộc
          </button>
          <button
            className={`memo-btn not-memorized ${currentCard.memorizationStatus === 'not_memorized' ? 'active' : ''}`}
            onClick={() => handleMemorizationClick('not_memorized')}
          >
            ✗ {!isMobile && 'Chưa '}thuộc
          </button>
        </div>
        <span className="action-separator">|</span>
        <div className="action-group">
          <span>Độ khó:</span>
          <button
            className={`diff-btn super-hard ${currentCard.difficultyLevel === 'super_hard' ? 'active' : ''}`}
            onClick={() => handleDifficultyClick('super_hard')}
          >
            💀
          </button>
          <button
            className={`diff-btn hard ${currentCard.difficultyLevel === 'hard' ? 'active' : ''}`}
            onClick={() => handleDifficultyClick('hard')}
          >
            Khó
          </button>
          <button
            className={`diff-btn medium ${currentCard.difficultyLevel === 'medium' ? 'active' : ''}`}
            onClick={() => handleDifficultyClick('medium')}
          >
            Vừa
          </button>
          <button
            className={`diff-btn easy ${currentCard.difficultyLevel === 'easy' ? 'active' : ''}`}
            onClick={() => handleDifficultyClick('easy')}
          >
            Dễ
          </button>
        </div>
        {settings.autoAdvanceOnThirdClick && (
          <span className="click-count">Nhấp: {clickCount}/{settings.clicksToAdvance}</span>
        )}
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <StudySettingsModal
          filterMemorization={filterMemorization}
          onFilterMemorizationChange={onFilterMemorizationChange}
          filterDifficulty={filterDifficulty}
          onFilterDifficultyChange={onFilterDifficultyChange}
          frontFontSize={frontFontSize}
          onFrontFontSizeChange={onFrontFontSizeChange}
          settings={settings}
          onSettingsChange={onSettingsChange}
          onClose={() => setShowSettingsModal(false)}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}

// Settings Modal Component
interface StudySettingsModalProps {
  filterMemorization: MemorizationStatus | 'all';
  onFilterMemorizationChange: (status: MemorizationStatus | 'all') => void;
  filterDifficulty: DifficultyLevel | 'all';
  onFilterDifficultyChange: (level: DifficultyLevel | 'all') => void;
  frontFontSize?: number;
  onFrontFontSizeChange?: (size: number) => void;
  settings: AppSettings;
  onSettingsChange?: (key: keyof AppSettings, value: any) => void;
  onClose: () => void;
  isMobile: boolean;
}

function StudySettingsModal({
  filterMemorization,
  onFilterMemorizationChange,
  filterDifficulty,
  onFilterDifficultyChange,
  frontFontSize = 250,
  onFrontFontSizeChange,
  settings,
  onSettingsChange,
  onClose,
  isMobile,
}: StudySettingsModalProps) {
  return (
    <div className="study-settings-modal-overlay" onClick={onClose}>
      <div className="study-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="study-settings-header">
          <h3>⚙️ Cài đặt bài học</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="study-settings-content">
          {/* Filter Section - Only on mobile */}
          {isMobile && (
            <div className="modal-section">
              <div className="modal-section-title">Bộ lọc thẻ</div>

              <div className="modal-setting-row">
                <span className="modal-setting-label">Trạng thái</span>
                <select
                  value={filterMemorization}
                  onChange={(e) => onFilterMemorizationChange(e.target.value as typeof filterMemorization)}
                  className="modal-select"
                >
                  {MEMORIZATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-setting-row">
                <span className="modal-setting-label">Độ khó</span>
                <select
                  value={filterDifficulty}
                  onChange={(e) => onFilterDifficultyChange(e.target.value as typeof filterDifficulty)}
                  className="modal-select"
                >
                  {DIFFICULTY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Font Style Section */}
          <div className="modal-section">
            <div className="modal-section-title">Kiểu chữ</div>

            <div className="modal-setting-row">
              <span className="modal-setting-label">Font chữ</span>
              <select
                value={settings.kanjiFont}
                onChange={(e) => onSettingsChange?.('kanjiFont', e.target.value)}
                className="modal-select"
              >
                {FONT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-setting-row">
              <span className="modal-setting-label">Chữ đậm</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.kanjiBold}
                  onChange={(e) => onSettingsChange?.('kanjiBold', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* Font Size Section */}
          {onFrontFontSizeChange && (
            <div className="modal-section">
              <div className="modal-section-title">Cỡ chữ mặt trước</div>
              <div className="font-slider-container">
                <div className="font-slider-row">
                  <input
                    type="range"
                    className="font-slider"
                    min="80"
                    max="400"
                    step="10"
                    value={frontFontSize}
                    onChange={(e) => onFrontFontSizeChange(Number(e.target.value))}
                  />
                  <span className="font-size-value">{frontFontSize}px</span>
                </div>
                <div className="font-preview" style={{
                  fontSize: `${Math.min(frontFontSize / 3, 50)}px`,
                  fontFamily: `"${settings.kanjiFont}", serif`,
                  fontWeight: settings.kanjiBold ? 900 : 400
                }}>
                  漢字
                </div>
              </div>
            </div>
          )}

          {/* Back Font Size Section */}
          <div className="modal-section">
            <div className="modal-section-title">Cỡ chữ mặt sau</div>
            <div className="font-slider-container">
              <div className="font-slider-row">
                <input
                  type="range"
                  className="font-slider"
                  min="50"
                  max="200"
                  step="5"
                  value={settings.backFontSize || 100}
                  onChange={(e) => onSettingsChange?.('backFontSize', Number(e.target.value))}
                />
                <span className="font-size-value">{settings.backFontSize || 100}%</span>
              </div>
              <div className="font-preview-back" style={{
                fontSize: `${Math.max(16 * ((settings.backFontSize || 100) / 100), 12)}px`
              }}>
                読み方 · Nghĩa
              </div>
            </div>
          </div>

          {/* Card Size Section */}
          <div className="modal-section">
            <div className="modal-section-title">Kích thước thẻ</div>
            <div className="font-slider-container">
              <div className="font-slider-row">
                <input
                  type="range"
                  className="font-slider"
                  min="60"
                  max="150"
                  step="5"
                  value={settings.cardScale || 100}
                  onChange={(e) => onSettingsChange?.('cardScale', Number(e.target.value))}
                />
                <span className="font-size-value">{settings.cardScale || 100}%</span>
              </div>
              <div className="card-scale-preview" style={{
                transform: `scale(${(settings.cardScale || 100) / 100})`,
                transformOrigin: 'center center',
              }}>
                <div className="card-scale-preview-inner">漢</div>
              </div>
            </div>
          </div>

          {/* Display Content Section */}
          <div className="modal-section">
            <div className="modal-section-title">Hiển thị mặt sau</div>

            <div className="modal-toggle-group">
              <label className="modal-toggle-item">
                <input
                  type="checkbox"
                  checked={settings.showVocabulary}
                  onChange={(e) => onSettingsChange?.('showVocabulary', e.target.checked)}
                />
                <span className="toggle-text">Từ vựng (読み方)</span>
              </label>

              <label className="modal-toggle-item">
                <input
                  type="checkbox"
                  checked={settings.showSinoVietnamese}
                  onChange={(e) => onSettingsChange?.('showSinoVietnamese', e.target.checked)}
                />
                <span className="toggle-text">Hán Việt</span>
              </label>

              <label className="modal-toggle-item">
                <input
                  type="checkbox"
                  checked={settings.showMeaning}
                  onChange={(e) => onSettingsChange?.('showMeaning', e.target.checked)}
                />
                <span className="toggle-text">Nghĩa</span>
              </label>

              <label className="modal-toggle-item">
                <input
                  type="checkbox"
                  checked={settings.showExample}
                  onChange={(e) => onSettingsChange?.('showExample', e.target.checked)}
                />
                <span className="toggle-text">Ví dụ</span>
              </label>
            </div>
          </div>
        </div>

        <div className="study-settings-footer">
          <button className="btn-close-settings" onClick={onClose}>
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
}
