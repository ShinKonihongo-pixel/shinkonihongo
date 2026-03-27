// Modal wrapper for creating/editing puzzles

import { Save } from 'lucide-react';
import { ModalShell } from '../../ui/modal-shell';
import { SlideCanvas } from './slide-canvas';
import { PuzzleForm } from './puzzle-form';
import type { SlideElement, PuzzleFormData } from './types';

interface PuzzleModalProps {
  isEditing: boolean;
  slideElements: SlideElement[];
  formData: PuzzleFormData;
  categories: string[];
  onSlideElementsChange: (elements: SlideElement[]) => void;
  onFormChange: (data: PuzzleFormData) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function PuzzleModal({
  isEditing,
  slideElements,
  formData,
  categories,
  onSlideElementsChange,
  onFormChange,
  onSave,
  onCancel,
}: PuzzleModalProps) {
  const isValid = slideElements.length > 0 && formData.word.trim() && formData.meaning.trim();

  return (
    <ModalShell
      isOpen={true}
      onClose={onCancel}
      title={isEditing ? 'Sửa câu hỏi' : 'Tạo câu hỏi mới'}
      maxWidth={720}
      className="pg-slide-modal"
    >
      {/* Modal Content */}
      <div className="pg-modal-content">
        <SlideCanvas
          elements={slideElements}
          onElementsChange={onSlideElementsChange}
        />
        <PuzzleForm
          formData={formData}
          categories={categories}
          onFormChange={onFormChange}
        />
      </div>

      {/* Modal Footer */}
      <div className="pg-modal-footer">
        <button className="pg-cancel-btn" onClick={onCancel}>
          Hủy
        </button>
        <button
          className="pg-save-btn"
          onClick={onSave}
          disabled={!isValid}
        >
          <Save size={18} />
          {isEditing ? 'Cập nhật' : 'Lưu câu hỏi'}
        </button>
      </div>
    </ModalShell>
  );
}
