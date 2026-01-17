// Picture Guess Puzzle Editor - Create and manage custom puzzles
// Modal-based editor with slide canvas for question design

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit3, Save, X, Image, ChevronLeft, Search, Copy, Upload, Type, Move } from 'lucide-react';
import type { CustomPicturePuzzle } from '../../types/picture-guess';
import { CUSTOM_PUZZLES_STORAGE_KEY } from '../../types/picture-guess';

interface PictureGuessPuzzleEditorProps {
  onClose: () => void;
  onSelectPuzzles?: (puzzles: CustomPicturePuzzle[]) => void;
}

// Slide element types
interface SlideElement {
  id: string;
  type: 'image' | 'text';
  content: string; // base64 for image, text content for text
  x: number; // percentage position
  y: number;
  width: number; // percentage width
  height: number;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
}

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function PictureGuessPuzzleEditor({
  onClose,
  onSelectPuzzles,
}: PictureGuessPuzzleEditorProps) {
  // State
  const [puzzles, setPuzzles] = useState<CustomPicturePuzzle[]>([]);
  const [editingPuzzle, setEditingPuzzle] = useState<CustomPicturePuzzle | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPuzzleIds, setSelectedPuzzleIds] = useState<Set<string>>(new Set());

  // Slide elements for the canvas
  const [slideElements, setSlideElements] = useState<SlideElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Form state for answer fields
  const [formData, setFormData] = useState({
    word: '',
    reading: '',
    meaning: '',
    sinoVietnamese: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    category: '',
  });

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);

  // Load puzzles from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(CUSTOM_PUZZLES_STORAGE_KEY);
    if (stored) {
      try {
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

  // Reset form and modal
  const resetModal = () => {
    setFormData({
      word: '',
      reading: '',
      meaning: '',
      sinoVietnamese: '',
      difficulty: 'medium',
      category: '',
    });
    setSlideElements([]);
    setSelectedElement(null);
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
    setFormData({
      word: puzzle.word,
      reading: puzzle.reading || '',
      meaning: puzzle.meaning,
      sinoVietnamese: puzzle.sinoVietnamese || '',
      difficulty: puzzle.difficulty,
      category: puzzle.category || '',
    });

    // Convert stored data to slide elements
    const elements: SlideElement[] = [];

    // Add images
    if (puzzle.hintImages) {
      puzzle.hintImages.forEach((img, idx) => {
        elements.push({
          id: generateId(),
          type: 'image',
          content: img,
          x: 10 + (idx * 25),
          y: 10,
          width: 40,
          height: 60,
        });
      });
    }

    // Add text hint
    if (puzzle.hintText) {
      elements.push({
        id: generateId(),
        type: 'text',
        content: puzzle.hintText,
        x: 10,
        y: puzzle.hintImages?.length ? 75 : 30,
        width: 80,
        height: 20,
        fontSize: 24,
        fontColor: '#333333',
      });
    }

    setSlideElements(elements);
    setEditingPuzzle(puzzle);
    setShowModal(true);
  };

  // Save puzzle
  const handleSave = () => {
    if (slideElements.length === 0 || !formData.word.trim() || !formData.meaning.trim()) {
      return;
    }

    const now = new Date().toISOString();

    // Extract images and text from slide elements
    const hintImages = slideElements
      .filter(el => el.type === 'image')
      .map(el => el.content);

    const hintTexts = slideElements
      .filter(el => el.type === 'text')
      .map(el => el.content);
    const hintText = hintTexts.join('\n');

    // Store slide layout for future editing
    const slideLayout = JSON.stringify(slideElements);

    if (editingPuzzle) {
      const updated = puzzles.map(p =>
        p.id === editingPuzzle.id
          ? {
              ...p,
              imageEmojis: slideLayout, // Reuse field to store layout
              hintText: hintText || undefined,
              hintImages: hintImages.length > 0 ? hintImages : undefined,
              word: formData.word,
              reading: formData.reading || undefined,
              meaning: formData.meaning,
              sinoVietnamese: formData.sinoVietnamese || undefined,
              difficulty: formData.difficulty,
              category: formData.category || undefined,
              updatedAt: now,
            }
          : p
      );
      savePuzzles(updated);
    } else {
      const newPuzzle: CustomPicturePuzzle = {
        id: generateId(),
        imageEmojis: slideLayout,
        hintText: hintText || undefined,
        hintImages: hintImages.length > 0 ? hintImages : undefined,
        word: formData.word,
        reading: formData.reading || undefined,
        meaning: formData.meaning,
        sinoVietnamese: formData.sinoVietnamese || undefined,
        difficulty: formData.difficulty,
        category: formData.category || undefined,
        createdAt: now,
      };
      savePuzzles([...puzzles, newPuzzle]);
    }

    resetModal();
  };

  // Delete puzzle
  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
      const updated = puzzles.filter(p => p.id !== id);
      savePuzzles(updated);
      selectedPuzzleIds.delete(id);
      setSelectedPuzzleIds(new Set(selectedPuzzleIds));
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

  // Add image to slide
  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          const newElement: SlideElement = {
            id: generateId(),
            type: 'image',
            content: base64,
            x: 10 + (slideElements.length * 5),
            y: 10 + (slideElements.length * 5),
            width: 40,
            height: 50,
          };
          setSlideElements(prev => [...prev, newElement]);
        };
        reader.readAsDataURL(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add text to slide
  const handleAddText = () => {
    const newElement: SlideElement = {
      id: generateId(),
      type: 'text',
      content: 'Nhập text...',
      x: 10 + (slideElements.length * 5),
      y: 10 + (slideElements.length * 5),
      width: 60,
      height: 15,
      fontSize: 24,
      fontColor: '#333333',
    };
    setSlideElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  };

  // Delete selected element
  const handleDeleteElement = (id: string) => {
    setSlideElements(prev => prev.filter(el => el.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  };

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent, elementId: string) => {
    if (!slideRef.current) return;

    const element = slideElements.find(el => el.id === elementId);
    if (!element) return;

    const rect = slideRef.current.getBoundingClientRect();
    const elementX = (element.x / 100) * rect.width;
    const elementY = (element.y / 100) * rect.height;

    setDragOffset({
      x: e.clientX - rect.left - elementX,
      y: e.clientY - rect.top - elementY,
    });
    setSelectedElement(elementId);
    setIsDragging(true);
  };

  // Handle drag move
  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElement || !slideRef.current) return;

    const rect = slideRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
    const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;

    setSlideElements(prev =>
      prev.map(el =>
        el.id === selectedElement
          ? { ...el, x: Math.max(0, Math.min(100 - el.width, x)), y: Math.max(0, Math.min(100 - el.height, y)) }
          : el
      )
    );
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Update text content
  const updateTextContent = (id: string, content: string) => {
    setSlideElements(prev =>
      prev.map(el => el.id === id ? { ...el, content } : el)
    );
  };

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
            <button className="pg-action-btn primary" onClick={handleCreateNew}>
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
                <button onClick={handleCreateNew}>
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
                    <button onClick={() => handleEdit(puzzle)} title="Sửa">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDuplicate(puzzle)} title="Nhân bản">
                      <Copy size={16} />
                    </button>
                    <button onClick={() => handleDelete(puzzle.id)} title="Xóa" className="delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal for creating/editing puzzle */}
      {showModal && (
        <div className="pg-modal-overlay" onClick={() => resetModal()}>
          <div className="pg-slide-modal" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="pg-modal-header">
              <h3>{editingPuzzle ? 'Sửa câu hỏi' : 'Tạo câu hỏi mới'}</h3>
              <button className="pg-close-btn" onClick={resetModal}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="pg-modal-content">
              {/* Top: Slide Canvas */}
              <div className="pg-slide-section">
                <div className="pg-slide-toolbar">
                  <span className="pg-slide-label">Thiết kế câu hỏi</span>
                  <div className="pg-slide-tools">
                    <button onClick={() => fileInputRef.current?.click()}>
                      <Image size={18} />
                      Thêm ảnh
                    </button>
                    <button onClick={handleAddText}>
                      <Type size={18} />
                      Thêm text
                    </button>
                    {selectedElement && (
                      <button className="delete-btn" onClick={() => handleDeleteElement(selectedElement)}>
                        <Trash2 size={18} />
                        Xóa
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAddImage}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* Slide Canvas */}
                <div
                  ref={slideRef}
                  className="pg-slide-canvas"
                  onMouseMove={handleDragMove}
                  onMouseUp={handleDragEnd}
                  onMouseLeave={handleDragEnd}
                  onClick={() => setSelectedElement(null)}
                >
                  {slideElements.length === 0 ? (
                    <div className="pg-slide-placeholder">
                      <Upload size={40} />
                      <p>Thêm hình ảnh hoặc text để thiết kế câu hỏi</p>
                    </div>
                  ) : (
                    slideElements.map(element => (
                      <div
                        key={element.id}
                        className={`pg-slide-element ${element.type} ${selectedElement === element.id ? 'selected' : ''}`}
                        style={{
                          left: `${element.x}%`,
                          top: `${element.y}%`,
                          width: `${element.width}%`,
                          height: `${element.height}%`,
                        }}
                        onClick={e => { e.stopPropagation(); setSelectedElement(element.id); }}
                        onMouseDown={e => { e.stopPropagation(); handleDragStart(e, element.id); }}
                      >
                        {element.type === 'image' ? (
                          <img src={element.content} alt="Hint" draggable={false} />
                        ) : (
                          <textarea
                            value={element.content}
                            onChange={e => updateTextContent(element.id, e.target.value)}
                            style={{
                              fontSize: element.fontSize,
                              color: element.fontColor,
                            }}
                            onClick={e => e.stopPropagation()}
                            onMouseDown={e => e.stopPropagation()}
                          />
                        )}
                        {selectedElement === element.id && (
                          <div className="pg-element-handle">
                            <Move size={14} />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bottom: Answer Fields */}
              <div className="pg-answer-section">
                <div className="pg-answer-header">
                  <span>Đáp án & Thông tin</span>
                </div>
                <div className="pg-answer-grid">
                  <div className="pg-form-group">
                    <label>Đáp án (từ cần đoán) *</label>
                    <input
                      type="text"
                      value={formData.word}
                      onChange={e => setFormData(prev => ({ ...prev, word: e.target.value }))}
                      placeholder="VD: 桜 hoặc さくら"
                    />
                  </div>

                  <div className="pg-form-group">
                    <label>Cách đọc (Hiragana)</label>
                    <input
                      type="text"
                      value={formData.reading}
                      onChange={e => setFormData(prev => ({ ...prev, reading: e.target.value }))}
                      placeholder="VD: さくら"
                    />
                  </div>

                  <div className="pg-form-group">
                    <label>Nghĩa tiếng Việt *</label>
                    <input
                      type="text"
                      value={formData.meaning}
                      onChange={e => setFormData(prev => ({ ...prev, meaning: e.target.value }))}
                      placeholder="VD: Hoa anh đào"
                    />
                  </div>

                  <div className="pg-form-group">
                    <label>Hán Việt</label>
                    <input
                      type="text"
                      value={formData.sinoVietnamese}
                      onChange={e => setFormData(prev => ({ ...prev, sinoVietnamese: e.target.value }))}
                      placeholder="VD: Anh"
                    />
                  </div>

                  <div className="pg-form-group">
                    <label>Phân loại</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="VD: Thiên nhiên"
                      list="category-suggestions"
                    />
                    <datalist id="category-suggestions">
                      {categories.filter(c => c !== 'all' && c !== 'uncategorized').map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>

                  <div className="pg-form-group">
                    <label>Độ khó</label>
                    <div className="pg-difficulty-options">
                      {(['easy', 'medium', 'hard'] as const).map(diff => (
                        <button
                          key={diff}
                          className={`pg-difficulty-btn ${diff} ${formData.difficulty === diff ? 'active' : ''}`}
                          onClick={() => setFormData(prev => ({ ...prev, difficulty: diff }))}
                        >
                          {diff === 'easy' ? 'Dễ' : diff === 'medium' ? 'TB' : 'Khó'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pg-modal-footer">
              <button className="pg-cancel-btn" onClick={resetModal}>
                Hủy
              </button>
              <button
                className="pg-save-btn"
                onClick={handleSave}
                disabled={slideElements.length === 0 || !formData.word.trim() || !formData.meaning.trim()}
              >
                <Save size={18} />
                {editingPuzzle ? 'Cập nhật' : 'Lưu câu hỏi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
