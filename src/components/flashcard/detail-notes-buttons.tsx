// Shared button row for "Chi tiết" (Kanji detail) + "Ghi chú" (Notes)

import { useState, useEffect } from 'react';
import { BookOpen, PenLine } from 'lucide-react';
import type { Flashcard } from '../../types/flashcard';
import { useAuth } from '../../hooks/use-auth';
import { getVocabularyNote } from '../../services/firestore';
import { KanjiDetailModal } from './kanji-detail-modal';
import { VocabularyNotesModal } from './vocabulary-notes-modal';
import './detail-notes-buttons.css';

interface DetailNotesButtonsProps {
  flashcard: Flashcard;
  readOnly?: boolean; // true = practice mode (no AI calls), false = management mode
  compact?: boolean; // true = smaller buttons for header placement
}

export function DetailNotesButtons({ flashcard, readOnly = false, compact = false }: DetailNotesButtonsProps) {
  const { currentUser } = useAuth();
  const [showDetail, setShowDetail] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [hasNote, setHasNote] = useState(false);

  // Check if this flashcard has a note
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    getVocabularyNote(currentUser.id, flashcard.id).then(note => {
      if (!cancelled) setHasNote(!!note);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [currentUser, flashcard.id]);

  return (
    <>
      <div className={`dn-bar ${compact ? 'dn-compact' : ''}`}>
        <button className="dn-btn dn-detail" onClick={() => setShowDetail(true)}>
          <BookOpen size={compact ? 13 : 15} />
          {!compact && <span>Chi tiết</span>}
        </button>
        {currentUser && (
          <button className={`dn-btn dn-notes ${hasNote ? 'dn-has-note' : ''}`} onClick={() => setShowNotes(true)}>
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
          onClose={() => {
            setShowNotes(false);
            // Refresh note status after modal closes
            getVocabularyNote(currentUser.id, flashcard.id)
              .then(note => setHasNote(!!note))
              .catch(() => {});
          }}
          onSaved={() => {
            // Immediately refresh note status when saved/deleted
            getVocabularyNote(currentUser.id, flashcard.id)
              .then(note => setHasNote(!!note))
              .catch(() => {});
          }}
        />
      )}
    </>
  );
}
