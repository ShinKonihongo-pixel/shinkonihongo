// Picture Guess Puzzle Editor - Main orchestrator component

import { useState, useEffect } from 'react';
import { ChevronLeft, Image } from 'lucide-react';
import type { CustomPicturePuzzle } from '../../../types/picture-guess';
import { CUSTOM_PUZZLES_STORAGE_KEY } from '../../../types/picture-guess';
import { PuzzleList } from './puzzle-list';
import { PuzzleModal } from './puzzle-modal';
import type { SlideElement, PuzzleFormData } from './types';
import {
  generateId,
  puzzleToSlideElements,
  slideElementsToPuzzleData,
  getInitialFormData,
  puzzleToFormData,
} from './utils';

interface PictureGuessPuzzleEditorProps {
  onClose: () => void;
  onSelectPuzzles?: (puzzles: CustomPicturePuzzle[]) => void;
}

export function PictureGuessPuzzleEditor({
  onClose,
  onSelectPuzzles,
}: PictureGuessPuzzleEditorProps) {
  // State
  const [puzzles, setPuzzles] = useState<CustomPicturePuzzle[]>([]);
  const [editingPuzzle, setEditingPuzzle] = useState<CustomPicturePuzzle | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [slideElements, setSlideElements] = useState<SlideElement[]>([]);
  const [formData, setFormData] = useState<PuzzleFormData>(getInitialFormData());

  // Load puzzles from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(CUSTOM_PUZZLES_STORAGE_KEY);
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPuzzles(JSON.parse(stored));
      } catch {
        console.error('Failed to load custom puzzles');
      }
    }
  }, []);

  // Save puzzles to localStorage
  const savePuzzles = (newPuzzles: CustomPicturePuzzle[]) => {
    localStorage.setItem(CUSTOM_PUZZLES_STORAGE_KEY, JSON.stringify(newPuzzles));
    setPuzzles(newPuzzles);
  };

  // Get unique categories
  const categories = ['all', ...new Set(puzzles.map(p => p.category || 'uncategorized').filter(Boolean))];

  // Reset form and modal
  const resetModal = () => {
    setFormData(getInitialFormData());
    setSlideElements([]);
    setEditingPuzzle(null);
    setShowModal(false);
  };

  // Open modal for new puzzle
  const handleCreateNew = () => {
    resetModal();
    setShowModal(true);
  };

  // Open modal for editing
  const handleEdit = (puzzle: CustomPicturePuzzle) => {
    setFormData(puzzleToFormData(puzzle));
    setSlideElements(puzzleToSlideElements(puzzle));
    setEditingPuzzle(puzzle);
    setShowModal(true);
  };

  // Save puzzle
  const handleSave = () => {
    if (slideElements.length === 0 || !formData.word.trim() || !formData.meaning.trim()) {
      return;
    }

    if (editingPuzzle) {
      const updated = puzzles.map(p =>
        p.id === editingPuzzle.id
          ? slideElementsToPuzzleData(slideElements, formData, editingPuzzle)
          : p
      );
      savePuzzles(updated);
    } else {
      const newPuzzle = slideElementsToPuzzleData(slideElements, formData);
      savePuzzles([...puzzles, newPuzzle]);
    }

    resetModal();
  };

  // Delete puzzle
  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
      const updated = puzzles.filter(p => p.id !== id);
      savePuzzles(updated);
    }
  };

  // Duplicate puzzle
  const handleDuplicate = (puzzle: CustomPicturePuzzle) => {
    const newPuzzle: CustomPicturePuzzle = {
      ...puzzle,
      id: generateId(),
      word: puzzle.word + ' (copy)',
      createdAt: new Date().toISOString(),
      updatedAt: undefined,
    };
    savePuzzles([...puzzles, newPuzzle]);
  };

  return (
    <div className="pg-puzzle-editor">
      {/* Header */}
      <div className="pg-editor-header">
        <button className="pg-back-btn" onClick={onClose}>
          <ChevronLeft size={20} />
          <span>Quay lại</span>
        </button>
        <h2>
          <Image size={24} />
          Quản Lý Câu Hỏi
        </h2>
        <div className="pg-editor-stats">
          <span>{puzzles.length} câu hỏi</span>
        </div>
      </div>

      {/* Main content - Full width list */}
      <div className="pg-editor-content pg-editor-content-full">
        <PuzzleList
          puzzles={puzzles}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onCreate={handleCreateNew}
          onSelectPuzzles={onSelectPuzzles}
        />
      </div>

      {/* Modal for creating/editing puzzle */}
      {showModal && (
        <PuzzleModal
          isEditing={!!editingPuzzle}
          slideElements={slideElements}
          formData={formData}
          categories={categories}
          onSlideElementsChange={setSlideElements}
          onFormChange={setFormData}
          onSave={handleSave}
          onCancel={resetModal}
        />
      )}
    </div>
  );
}
