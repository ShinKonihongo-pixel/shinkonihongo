// Modal wrapper for creating/editing puzzles

import { X, Save } from 'lucide-react';
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
    <div className="pg-modal-overlay" onClick={onCancel}>
      <div className="pg-slide-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="pg-modal-header">
          <h3>{isEditing ? 'Sửa câu hỏi' : 'Tạo câu hỏi mới'}</h3>
          <button className="pg-close-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="pg-modal-content">
          {/* Top: Slide Canvas */}
          <SlideCanvas
            elements={slideElements}
            onElementsChange={onSlideElementsChange}
          />

          {/* Bottom: Answer Fields */}
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
      </div>
    </div>
  );
}
