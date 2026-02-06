// Study session header with filters and controls
import { useState } from 'react';
import { ArrowLeft, Settings, BookOpen, PenLine } from 'lucide-react';
import type { MemorizationStatus, DifficultyLevel, JLPTLevel, Flashcard } from '../../../types/flashcard';
import { MEMORIZATION_OPTIONS, DIFFICULTY_OPTIONS, LEVEL_COLORS } from './constants';
import { useAuth } from '../../../hooks/use-auth';
import { KanjiDetailModal } from '../../flashcard/kanji-detail-modal';
import { VocabularyNotesModal } from '../../flashcard/vocabulary-notes-modal';
import { ConfirmModal } from '../../ui/confirm-modal';

interface StudyHeaderProps {
  selectedLevel?: JLPTLevel;
  filterMemorization: MemorizationStatus | 'all';
  onFilterMemorizationChange: (status: MemorizationStatus | 'all') => void;
  filterDifficulty: DifficultyLevel | 'all';
  onFilterDifficultyChange: (level: DifficultyLevel | 'all') => void;
  currentIndex: number;
  totalCards: number;
  isShuffled: boolean;
  onShuffle: () => void;
  onResetOrder: () => void;
  onSettingsClick: () => void;
  onBack?: () => void;
  isMobile: boolean;
  currentCard?: Flashcard;
}

export function StudyHeader({
  selectedLevel,
  filterMemorization,
  onFilterMemorizationChange,
  filterDifficulty,
  onFilterDifficultyChange,
  currentIndex,
  totalCards,
  isShuffled,
  onShuffle,
  onResetOrder,
  onSettingsClick,
  onBack,
  isMobile,
  currentCard,
}: StudyHeaderProps) {
  const { currentUser } = useAuth();
  const levelColors = selectedLevel ? LEVEL_COLORS[selectedLevel] : null;
  const [showDetail, setShowDetail] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <div className="study-header">
      <div className="filter-bar-inline">
        {onBack && (
          <button className="back-btn-study" onClick={onBack}>
            <ArrowLeft size={isMobile ? 16 : 18} />
            {!isMobile && <span>Chọn bài khác</span>}
          </button>
        )}
        {/* Hide level badge on mobile */}
        {!isMobile && selectedLevel && levelColors && (
          <span
            className="level-badge-study"
            style={{ background: levelColors.bg, color: levelColors.text }}
          >
            {selectedLevel}
          </span>
        )}

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
          {/* Detail & Notes buttons - same style as action buttons */}
          {currentCard && (
            <button className="header-action-btn has-label" onClick={() => setShowDetail(true)} title="Chi tiết Kanji">
              <BookOpen size={16} />
              {!isMobile && <span className="btn-label">Chi tiết</span>}
            </button>
          )}
          {currentCard && currentUser && (
            <button className="header-action-btn has-label" onClick={() => setShowNotes(true)} title="Ghi chú">
              <PenLine size={16} />
              {!isMobile && <span className="btn-label">Ghi chú</span>}
            </button>
          )}
          <button className="header-action-btn" onClick={onShuffle} title="Xáo trộn thẻ">
            🔀
          </button>
          <button
            className="header-action-btn"
            onClick={() => setShowResetConfirm(true)}
            title="Về thứ tự gốc"
            disabled={!isShuffled}
          >
            ↺
          </button>
          <button className="header-action-btn" onClick={onSettingsClick} title="Cài đặt">
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Modals */}
      {showDetail && currentCard && (
        <KanjiDetailModal
          flashcard={currentCard}
          onClose={() => setShowDetail(false)}
          readOnly
        />
      )}
      {showNotes && currentCard && currentUser && (
        <VocabularyNotesModal
          flashcard={currentCard}
          userId={currentUser.id}
          onClose={() => setShowNotes(false)}
        />
      )}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Xác nhận đặt lại"
        message="Bạn có chắc muốn đặt lại thứ tự thẻ về ban đầu?"
        confirmText="OK"
        onConfirm={() => { onResetOrder(); setShowResetConfirm(false); }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
