// Shared button row for "Chi tiết" (Kanji detail) + "Ghi chú" (Notes)

import { useState } from 'react';
import { BookOpen, PenLine } from 'lucide-react';
import type { Flashcard } from '../../types/flashcard';
import { useAuth } from '../../hooks/use-auth';
import { KanjiDetailModal } from './kanji-detail-modal';
import { VocabularyNotesModal } from './vocabulary-notes-modal';

interface DetailNotesButtonsProps {
  flashcard: Flashcard;
  readOnly?: boolean; // true = practice mode (no AI calls), false = management mode
  compact?: boolean; // true = smaller buttons for header placement
}

export function DetailNotesButtons({ flashcard, readOnly = false, compact = false }: DetailNotesButtonsProps) {
  const { currentUser } = useAuth();
  const [showDetail, setShowDetail] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  return (
    <>
      <div className={`dn-bar ${compact ? 'dn-compact' : ''}`}>
        <button className="dn-btn dn-detail" onClick={() => setShowDetail(true)}>
          <BookOpen size={compact ? 13 : 15} />
          {!compact && <span>Chi tiết</span>}
        </button>
        {currentUser && (
          <button className="dn-btn dn-notes" onClick={() => setShowNotes(true)}>
            <PenLine size={compact ? 13 : 15} />
            {!compact && <span>Ghi chú</span>}
          </button>
        )}
      </div>

      {showDetail && (
        <KanjiDetailModal
          flashcard={flashcard}
          onClose={() => setShowDetail(false)}
          readOnly={readOnly}
        />
      )}

      {showNotes && currentUser && (
        <VocabularyNotesModal
          flashcard={flashcard}
          userId={currentUser.id}
          onClose={() => setShowNotes(false)}
        />
      )}

      <style>{detailNotesStyles}</style>
    </>
  );
}

const detailNotesStyles = `
  .dn-bar {
    display: flex;
    justify-content: center;
    gap: 0.625rem;
    padding: 0.625rem 1rem;
    background: rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(10px);
    position: relative;
    z-index: 5;
  }

  .dn-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 1rem;
    border-radius: 10px;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid;
    letter-spacing: 0.2px;
  }

  .dn-detail {
    background: rgba(99, 102, 241, 0.12);
    border-color: rgba(99, 102, 241, 0.2);
    color: #a5b4fc;
  }

  .dn-detail:hover {
    background: rgba(99, 102, 241, 0.22);
    border-color: rgba(99, 102, 241, 0.4);
    transform: translateY(-1px);
  }

  .dn-notes {
    background: rgba(16, 185, 129, 0.12);
    border-color: rgba(16, 185, 129, 0.2);
    color: #6ee7b7;
  }

  .dn-notes:hover {
    background: rgba(16, 185, 129, 0.22);
    border-color: rgba(16, 185, 129, 0.4);
    transform: translateY(-1px);
  }

  /* Compact variant for header placement */
  .dn-compact {
    padding: 0;
    background: transparent;
    backdrop-filter: none;
    gap: 0.375rem;
    justify-content: flex-start;
  }

  .dn-compact .dn-btn {
    padding: 0.3rem 0.5rem;
    font-size: 0.75rem;
    border-radius: 7px;
    gap: 0;
  }

  @media (max-width: 480px) {
    .dn-bar {
      padding: 0.5rem 0.75rem;
      gap: 0.5rem;
    }

    .dn-btn {
      padding: 0.425rem 0.75rem;
      font-size: 0.78rem;
    }

    .dn-compact .dn-btn {
      padding: 0.25rem 0.4rem;
    }
  }
`;
