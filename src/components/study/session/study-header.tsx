// Study session header with filters and controls
import { useState, useEffect } from 'react';
import { ArrowLeft, Settings, BookOpen, PenLine, RotateCcw, BookmarkPlus } from 'lucide-react';
import type { MemorizationStatus, JLPTLevel, Flashcard } from '../../../types/flashcard';
import type { NotebookHook } from '../level-lesson-selector/types';
import { MEMORIZATION_OPTIONS, LEVEL_COLORS } from './constants';
import { useAuth } from '../../../hooks/use-auth';
import { getVocabularyNote } from '../../../services/firestore';
import { extractKanjiCharacters } from '../../../services/kanji-analysis-ai-service';
import { KanjiDetailModal } from '../../flashcard/kanji-detail-modal';
import { VocabularyNotesModal } from '../../flashcard/vocabulary-notes-modal';
import { NotebookAddPopover } from '../notebook';
import { ConfirmModal } from '../../ui/confirm-modal';

interface StudyHeaderProps {
  selectedLevel?: JLPTLevel;
  filterMemorization: MemorizationStatus | 'all';
  onFilterMemorizationChange: (status: MemorizationStatus | 'all') => void;
  currentIndex: number;
  totalCards: number;
  isShuffled: boolean;
  onShuffle: () => void;
  onResetOrder: () => void;
  onSettingsClick: () => void;
  onBack?: () => void;
  isMobile: boolean;
  currentCard?: Flashcard;
  onResetAll?: () => void;
  notebookHook?: NotebookHook;
}

export function StudyHeader({
  selectedLevel,
  filterMemorization,
  onFilterMemorizationChange,
  currentIndex,
  totalCards,
  isShuffled,
  onShuffle,
  onSettingsClick,
  onBack,
  isMobile,
  currentCard,
  onResetAll,
  notebookHook,
}: StudyHeaderProps) {
  const { currentUser } = useAuth();
  const levelColors = selectedLevel ? LEVEL_COLORS[selectedLevel] : null;
  const [showDetail, setShowDetail] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showNotebookPopover, setShowNotebookPopover] = useState(false);
  const [hasNote, setHasNote] = useState(false);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Check if current card has a note
  useEffect(() => {
    if (!currentUser || !currentCard) { setHasNote(false); return; }
    let cancelled = false;
    getVocabularyNote(currentUser.id, currentCard.id).then(note => {
      if (!cancelled) setHasNote(!!note);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [currentUser, currentCard?.id]);

  // Show detail button if card has kanji characters (cache check only, no Firestore)
  // Modal itself handles fetching — no need to pre-check existence
  useEffect(() => {
    if (!currentCard) { setHasAnalysis(false); return; }
    const text = currentCard.kanji || currentCard.vocabulary;
    const chars = extractKanjiCharacters(text);
    setHasAnalysis(chars.length > 0);
  }, [currentCard?.id]);

  // Check if current card is in any notebook
  const isInNotebook = !!(currentCard && notebookHook &&
    notebookHook.notebooks.some(nb => nb.flashcardIds.includes(currentCard.id)));

  // Check if anything can be reset (shuffle or card changes)
  const cardHasChanges = currentCard && currentCard.memorizationStatus !== 'unset';
  const hasAnythingToReset = isShuffled || cardHasChanges;

  return (
    <div className="study-header">
      <div className="filter-bar-inline">
        {onBack && (
          <button className="back-btn-study" onClick={onBack}>
            <ArrowLeft size={isMobile ? 16 : 18} />
            {!isMobile && <span>Quay lại</span>}
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
          </>
        )}

        <div className="header-spacer" />
        {!isMobile && (
          <div className="progress-info-header">
            <span>Thẻ {currentIndex + 1} / {totalCards}</span>
          </div>
        )}
        <div className="header-actions">
          {/* Detail button - only show if kanji analysis exists */}
          {currentCard && hasAnalysis && (
            <button className="header-action-btn has-label" onClick={() => setShowDetail(true)} title="Chi tiết Kanji">
              <BookOpen size={16} />
              {!isMobile && <span className="btn-label">Chi tiết</span>}
            </button>
          )}
          {currentCard && currentUser && (
            <button
              className={`header-action-btn has-label ${hasNote ? 'has-note-active' : ''}`}
              onClick={() => setShowNotes(true)}
              title="Ghi chú"
            >
              <PenLine size={16} />
              {!isMobile && <span className="btn-label">Ghi chú</span>}
            </button>
          )}
          {currentCard && notebookHook && currentUser && (
            <div className="nb-popover-anchor">
              <button
                className={`header-action-btn has-label ${isInNotebook ? 'in-notebook-active' : ''}`}
                onClick={() => setShowNotebookPopover((v) => !v)}
                title={isInNotebook ? 'Đã lưu trong sổ tay' : 'Thêm vào sổ tay'}
              >
                <BookmarkPlus size={16} />
                {!isMobile && <span className="btn-label">Sổ tay</span>}
              </button>
              {showNotebookPopover && (
                <NotebookAddPopover
                  flashcardId={currentCard.id}
                  notebooks={notebookHook.notebooks}
                  onToggle={notebookHook.toggleCardInNotebook}
                  onClose={() => setShowNotebookPopover(false)}
                  onQuickCreate={notebookHook.createNotebook}
                />
              )}
            </div>
          )}
          <button className="header-action-btn" onClick={onShuffle} title="Xáo trộn thẻ">
            🔀
          </button>
          <button
            className={`header-action-btn reset-card-btn ${hasAnythingToReset ? 'active' : ''}`}
            onClick={() => setShowResetConfirm(true)}
            title="Reset về mặc định"
            disabled={!hasAnythingToReset}
          >
            <RotateCcw size={15} />
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
          onClose={() => {
            setShowNotes(false);
            getVocabularyNote(currentUser.id, currentCard.id)
              .then(note => setHasNote(!!note))
              .catch(() => {});
          }}
          onSaved={() => {
            getVocabularyNote(currentUser.id, currentCard.id)
              .then(note => setHasNote(!!note))
              .catch(() => {});
          }}
          onToast={(msg) => {
            setToastMsg(msg);
            setTimeout(() => setToastMsg(''), 3000);
          }}
        />
      )}

      {/* Global toast - right side of screen */}
      {toastMsg && (
        <div className="study-toast">{toastMsg}</div>
      )}

      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset về mặc định"
        message="Reset thứ tự thẻ và trạng thái/độ khó về mặc định?"
        confirmText="OK"
        onConfirm={() => {
          onResetAll?.();
          setShowResetConfirm(false);
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
