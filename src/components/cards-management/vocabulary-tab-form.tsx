// VocabularyTab - Form sub-section
// Handles the "create/edit card" panel with vocabulary form and kanji analysis sub-tabs

import { PenLine, Languages } from 'lucide-react';
import { FlashcardForm } from '../flashcard/flashcard-form';
import { KanjiAnalysisEditor } from '../flashcard/kanji-analysis-editor';
import type { Flashcard, FlashcardFormData, Lesson } from './cards-management-types';

interface VocabTabFormProps {
  editingCard: Flashcard | null;
  formSubTab: 'vocabulary' | 'kanji';
  formKanjiText: string;
  lessons: Lesson[];
  fixedLevel: string | null;
  fixedLessonId: string | null;
  grammarCards: Flashcard[];
  onSubmit: (data: Partial<Flashcard>) => void;
  onCancel: () => void;
  onSubTabChange: (tab: 'vocabulary' | 'kanji') => void;
  onKanjiTextChange: (text: string) => void;
}

export function VocabTabForm({
  editingCard,
  formSubTab,
  formKanjiText,
  lessons,
  fixedLevel,
  fixedLessonId,
  grammarCards,
  onSubmit,
  onCancel,
  onSubTabChange,
  onKanjiTextChange,
}: VocabTabFormProps) {
  return (
    <>
      <div className="form-sub-tabs">
        <button
          className={`form-sub-tab ${formSubTab === 'vocabulary' ? 'active' : ''}`}
          onClick={() => onSubTabChange('vocabulary')}
        >
          <PenLine size={15} />
          <span>Tạo từ vựng</span>
        </button>
        <button
          className={`form-sub-tab ${formSubTab === 'kanji' ? 'active' : ''}`}
          onClick={() => onSubTabChange('kanji')}
        >
          <Languages size={15} />
          <span>Phân tích Kanji</span>
        </button>
      </div>

      {formSubTab === 'vocabulary' ? (
        <FlashcardForm
          onSubmit={onSubmit as (data: FlashcardFormData) => void}
          onCancel={onCancel}
          initialData={editingCard || undefined}
          lessons={lessons}
          fixedLevel={fixedLevel as import('./cards-management-types').JLPTLevel | null}
          fixedLessonId={fixedLessonId}
          grammarCards={grammarCards}
          onKanjiTextChange={onKanjiTextChange}
        />
      ) : (
        <div className="kanji-analysis-standalone">
          {formKanjiText ? (
            <KanjiAnalysisEditor kanjiText={formKanjiText} />
          ) : (
            <div className="kanji-analysis-empty">
              <Languages size={32} style={{ color: '#6366f1', opacity: 0.4 }} />
              <p>Nhập Kanji hoặc từ vựng ở tab <strong>Tạo từ vựng</strong> trước</p>
              <button className="btn btn-secondary" onClick={() => onSubTabChange('vocabulary')}>
                Quay lại tạo từ vựng
              </button>
            </div>
          )}
          <div className="kanji-tab-actions">
            <button className="btn btn-secondary" onClick={onCancel}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={() => onSubTabChange('vocabulary')}>
              ← Quay lại form
            </button>
          </div>
        </div>
      )}
    </>
  );
}
