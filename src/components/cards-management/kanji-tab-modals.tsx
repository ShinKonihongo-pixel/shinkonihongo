// KanjiTab - Modal overlays (edit modal from search, decomposer, move modal)

import { Suspense, lazy } from 'react';
import { X } from 'lucide-react';
import { KanjiCardForm } from '../flashcard/kanji-card-form';
import { KanjiMoveModal } from './kanji-move-modal';
import type { KanjiCard, KanjiCardFormData, KanjiLesson } from '../../types/kanji';
import type { JLPTLevel } from './cards-management-types';
import { LEVEL_COLORS } from '../../constants/themes';

const KanjiDecomposerModal = lazy(() => import('../flashcard/kanji-decomposer-modal').then(m => ({ default: m.KanjiDecomposerModal })));

interface KanjiTabModalsProps {
  editingCard: KanjiCard | null;
  decomposingCard: KanjiCard | null;
  movingCards: KanjiCard[] | null;
  showEditModalOverSearch: boolean;
  kanjiLessons: KanjiLesson[];
  getParentLessonsByLevel: (level: JLPTLevel) => KanjiLesson[];
  getChildLessons: (parentId: string) => KanjiLesson[];
  hasChildren: (lessonId: string) => boolean;
  getLessonName: (lessonId: string) => string;
  onUpdateCard: (data: KanjiCardFormData) => void;
  onCancelEdit: () => void;
  onCloseDecomposer: () => void;
  onMoveCards: (cardIds: string[], targetLevel: JLPTLevel, targetLessonId: string) => Promise<void>;
  onCloseMove: () => void;
}

export function KanjiTabModals({
  editingCard,
  decomposingCard,
  movingCards,
  showEditModalOverSearch,
  kanjiLessons,
  getParentLessonsByLevel,
  getChildLessons,
  hasChildren,
  getLessonName,
  onUpdateCard,
  onCancelEdit,
  onCloseDecomposer,
  onMoveCards,
  onCloseMove,
}: KanjiTabModalsProps) {
  return (
    <>
      {showEditModalOverSearch && editingCard && (
        <div className="kanji-edit-modal-overlay" onClick={onCancelEdit}>
          <div className="kanji-edit-modal" onClick={e => e.stopPropagation()}>
            <div className="kanji-edit-modal-header">
              <div className="kanji-edit-modal-title">
                <span
                  className="kanji-edit-modal-char"
                  style={{ borderColor: LEVEL_COLORS[editingCard.jlptLevel as JLPTLevel] }}
                >
                  {editingCard.character}
                </span>
                <div className="kanji-edit-modal-info">
                  <h3>{editingCard.sinoVietnamese} - {editingCard.meaning}</h3>
                  <div className="kanji-edit-modal-meta">
                    <span
                      className="kanji-edit-modal-level"
                      style={{ background: LEVEL_COLORS[editingCard.jlptLevel as JLPTLevel] }}
                    >
                      {editingCard.jlptLevel}
                    </span>
                    <span className="kanji-edit-modal-lesson">{getLessonName(editingCard.lessonId)}</span>
                  </div>
                </div>
              </div>
              <button className="kanji-edit-modal-close" onClick={onCancelEdit}><X size={18} /></button>
            </div>
            <KanjiCardForm
              onSubmit={onUpdateCard}
              onCancel={onCancelEdit}
              initialData={editingCard}
              fixedLevel={editingCard.jlptLevel as JLPTLevel}
              fixedLessonId={editingCard.lessonId}
            />
          </div>
        </div>
      )}

      {decomposingCard && (
        <Suspense fallback={null}>
          <KanjiDecomposerModal
            kanjiCard={decomposingCard}
            onClose={onCloseDecomposer}
          />
        </Suspense>
      )}

      {movingCards && (
        <KanjiMoveModal
          cards={movingCards}
          lessons={kanjiLessons}
          getParentLessonsByLevel={getParentLessonsByLevel}
          getChildLessons={getChildLessons}
          hasChildren={hasChildren}
          onMove={onMoveCards}
          onClose={onCloseMove}
        />
      )}
    </>
  );
}
