// Puzzle list component with search and filtering

import { useState } from 'react';
import { Plus, Search, Edit3, Copy, Trash2, Image } from 'lucide-react';
import type { CustomPicturePuzzle } from '../../../types/picture-guess';

interface PuzzleListProps {
  puzzles: CustomPicturePuzzle[];
  onEdit: (puzzle: CustomPicturePuzzle) => void;
  onDelete: (id: string) => void;
  onDuplicate: (puzzle: CustomPicturePuzzle) => void;
  onCreate: () => void;
  onSelectPuzzles?: (puzzles: CustomPicturePuzzle[]) => void;
}

export function PuzzleList({
  puzzles,
  onEdit,
  onDelete,
  onDuplicate,
  onCreate,
  onSelectPuzzles,
}: PuzzleListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPuzzleIds, setSelectedPuzzleIds] = useState<Set<string>>(new Set());

  // Filter puzzles based on search
  const filteredPuzzles = puzzles.filter(puzzle => {
    const matchesSearch = searchQuery === '' ||
      puzzle.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      puzzle.meaning.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' ||
      puzzle.category === selectedCategory ||
      (selectedCategory === 'uncategorized' && !puzzle.category);

    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['all', ...new Set(puzzles.map(p => p.category || 'uncategorized').filter(Boolean))];

  // Toggle puzzle selection
  const togglePuzzleSelection = (id: string) => {
    const newSet = new Set(selectedPuzzleIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedPuzzleIds(newSet);
  };

  // Select all visible puzzles
  const selectAllVisible = () => {
    const allIds = new Set(filteredPuzzles.map(p => p.id));
    setSelectedPuzzleIds(allIds);
  };

  // Handle use selected puzzles
  const handleUseSelected = () => {
    if (onSelectPuzzles && selectedPuzzleIds.size > 0) {
      const selected = puzzles.filter(p => selectedPuzzleIds.has(p.id));
      onSelectPuzzles(selected);
    }
  };

  return (
    <div className="pg-editor-list-panel pg-editor-list-full">
      {/* Search and filter */}
      <div className="pg-editor-toolbar">
        <div className="pg-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="pg-category-filter"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'Tất cả' : cat === 'uncategorized' ? 'Chưa phân loại' : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Action buttons */}
      <div className="pg-editor-actions">
        <button className="pg-action-btn primary" onClick={onCreate}>
          <Plus size={18} />
          Thêm câu hỏi
        </button>
        {onSelectPuzzles && (
          <>
            <button className="pg-action-btn" onClick={selectAllVisible} disabled={filteredPuzzles.length === 0}>
              Chọn tất cả
            </button>
            <button
              className="pg-action-btn success"
              onClick={handleUseSelected}
              disabled={selectedPuzzleIds.size === 0}
            >
              Sử dụng ({selectedPuzzleIds.size})
            </button>
          </>
        )}
      </div>

      {/* Puzzle list */}
      <div className="pg-puzzle-list">
        {filteredPuzzles.length === 0 ? (
          <div className="pg-empty-list">
            <Image size={48} />
            <p>Chưa có câu hỏi nào</p>
            <button onClick={onCreate}>
              <Plus size={16} /> Tạo câu hỏi đầu tiên
            </button>
          </div>
        ) : (
          filteredPuzzles.map(puzzle => (
            <div
              key={puzzle.id}
              className={`pg-puzzle-item ${selectedPuzzleIds.has(puzzle.id) ? 'selected' : ''}`}
              onClick={() => onSelectPuzzles && togglePuzzleSelection(puzzle.id)}
            >
              {onSelectPuzzles && (
                <input
                  type="checkbox"
                  checked={selectedPuzzleIds.has(puzzle.id)}
                  onChange={() => togglePuzzleSelection(puzzle.id)}
                  onClick={e => e.stopPropagation()}
                />
              )}
              <div className="pg-puzzle-hint-preview">
                {puzzle.hintImages && puzzle.hintImages.length > 0 ? (
                  <img src={puzzle.hintImages[0]} alt="Hint" className="pg-puzzle-thumb" />
                ) : puzzle.hintText ? (
                  <span className="pg-puzzle-text-hint">{puzzle.hintText.slice(0, 20)}...</span>
                ) : (
                  <span className="pg-puzzle-text-hint">Câu hỏi</span>
                )}
              </div>
              <div className="pg-puzzle-info">
                <span className="pg-puzzle-word">{puzzle.word}</span>
                <span className="pg-puzzle-meaning">{puzzle.meaning}</span>
              </div>
              <span className={`pg-difficulty-badge ${puzzle.difficulty}`}>
                {puzzle.difficulty === 'easy' ? 'Dễ' : puzzle.difficulty === 'medium' ? 'TB' : 'Khó'}
              </span>
              <div className="pg-puzzle-actions" onClick={e => e.stopPropagation()}>
                <button onClick={() => onEdit(puzzle)} title="Sửa">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => onDuplicate(puzzle)} title="Nhân bản">
                  <Copy size={16} />
                </button>
                <button onClick={() => onDelete(puzzle.id)} title="Xóa" className="delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
