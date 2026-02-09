// Image-Word Management Page
// Professional UI for creating and managing image-word lessons
// Features: Card-based layout, smooth animations, drag-drop reordering

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, Plus, Trash2, Edit3, Save, X, ImageIcon, Upload, Layers,
  AlertTriangle, GripVertical, Eye, Calendar, Hash, Sparkles, FolderOpen
} from 'lucide-react';
import type { ImageWordLesson, ImageWordPair } from '../../types/image-word';
import {
  getImageWordLessons,
  saveImageWordLesson,
  deleteImageWordLesson,
  createImageWordPair,
} from '../../services/image-word-storage';

interface ImageWordManagementPageProps {
  onBack: () => void;
}

export const ImageWordManagementPage: React.FC<ImageWordManagementPageProps> = ({ onBack }) => {
  const [lessons, setLessons] = useState<ImageWordLesson[]>([]);
  const [editingLesson, setEditingLesson] = useState<ImageWordLesson | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [previewLesson, setPreviewLesson] = useState<ImageWordLesson | null>(null);

  // Load lessons
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLessons(getImageWordLessons());
  }, []);

  // Create new lesson
  const handleCreateLesson = useCallback(() => {
    const newLesson: ImageWordLesson = {
      id: '',
      name: '',
      description: '',
      pairs: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setEditingLesson(newLesson);
    setShowEditor(true);
  }, []);

  // Edit lesson
  const handleEditLesson = useCallback((lesson: ImageWordLesson) => {
    setEditingLesson({ ...lesson, pairs: [...lesson.pairs] });
    setShowEditor(true);
  }, []);

  // Save lesson
  const handleSaveLesson = useCallback((lesson: ImageWordLesson) => {
    const saved = saveImageWordLesson(lesson);
    setLessons(prev => {
      const exists = prev.findIndex(l => l.id === saved.id);
      if (exists >= 0) {
        const updated = [...prev];
        updated[exists] = saved;
        return updated;
      }
      return [...prev, saved];
    });
    setShowEditor(false);
    setEditingLesson(null);
  }, []);

  // Delete lesson
  const handleDeleteLesson = useCallback((id: string) => {
    if (deleteImageWordLesson(id)) {
      setLessons(prev => prev.filter(l => l.id !== id));
    }
    setDeleteConfirm(null);
  }, []);

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="iw-management">
      {/* Header */}
      <header className="iw-management-header">
        <button className="iw-back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Quay lại</span>
        </button>
        <div className="iw-header-title">
          <div className="iw-title-icon">
            <Layers size={24} />
          </div>
          <div className="iw-title-text">
            <h1>Quản Lý Bài Học</h1>
            <span className="iw-subtitle">Nối Hình - Từ Vựng</span>
          </div>
        </div>
        <button className="iw-create-btn" onClick={handleCreateLesson}>
          <Plus size={18} />
          <span>Tạo Mới</span>
        </button>
      </header>

      {/* Stats bar */}
      <div className="iw-stats-bar">
        <div className="iw-stat">
          <FolderOpen size={16} />
          <span>{lessons.length} bài học</span>
        </div>
        <div className="iw-stat">
          <Hash size={16} />
          <span>{lessons.reduce((sum, l) => sum + l.pairs.length, 0)} cặp từ</span>
        </div>
      </div>

      {/* Content */}
      <div className="iw-management-content">
        {lessons.length === 0 ? (
          <div className="iw-empty-state">
            <div className="iw-empty-icon">
              <ImageIcon size={48} strokeWidth={1.5} />
              <Sparkles size={20} className="iw-sparkle" />
            </div>
            <h3>Chưa có bài học nào</h3>
            <p>Tạo bài học đầu tiên để bắt đầu sử dụng trò chơi nối hình</p>
            <button className="iw-empty-btn" onClick={handleCreateLesson}>
              <Plus size={18} />
              Tạo Bài Học Đầu Tiên
            </button>
          </div>
        ) : (
          <div className="iw-lessons-grid">
            {lessons.map((lesson, index) => (
              <div
                key={lesson.id}
                className="iw-lesson-card"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Thumbnail */}
                <div className="iw-lesson-thumb">
                  {lesson.pairs[0]?.imageUrl ? (
                    <img src={lesson.pairs[0].imageUrl} alt="" />
                  ) : (
                    <div className="iw-thumb-placeholder">
                      <ImageIcon size={32} />
                    </div>
                  )}
                  <div className="iw-thumb-overlay">
                    <button
                      className="iw-preview-btn"
                      onClick={() => setPreviewLesson(lesson)}
                      title="Xem trước"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                  <span className="iw-pair-badge">{lesson.pairs.length}</span>
                </div>

                {/* Info */}
                <div className="iw-lesson-info">
                  <h3>{lesson.name || 'Chưa đặt tên'}</h3>
                  {lesson.description && (
                    <p className="iw-lesson-desc">{lesson.description}</p>
                  )}
                  <div className="iw-lesson-meta">
                    <Calendar size={12} />
                    <span>{formatDate(lesson.updatedAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="iw-lesson-actions">
                  <button
                    className="iw-action-btn edit"
                    onClick={() => handleEditLesson(lesson)}
                  >
                    <Edit3 size={16} />
                    Chỉnh sửa
                  </button>
                  <button
                    className="iw-action-btn delete"
                    onClick={() => setDeleteConfirm(lesson.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {showEditor && editingLesson && (
        <LessonEditor
          lesson={editingLesson}
          onSave={handleSaveLesson}
          onCancel={() => { setShowEditor(false); setEditingLesson(null); }}
        />
      )}

      {/* Preview Modal */}
      {previewLesson && (
        <div className="iw-modal-overlay" onClick={() => setPreviewLesson(null)}>
          <div className="iw-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="iw-preview-header">
              <h2>{previewLesson.name}</h2>
              <button className="iw-close-btn" onClick={() => setPreviewLesson(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="iw-preview-grid">
              {previewLesson.pairs.map((pair) => (
                <div key={pair.id} className="iw-preview-item">
                  <img src={pair.imageUrl} alt="" />
                  <div className="iw-preview-word">
                    <span className="vocab">{pair.vocabulary}</span>
                    {pair.reading && <span className="reading">{pair.reading}</span>}
                    <span className="meaning">{pair.meaning}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="iw-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="iw-confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="iw-confirm-icon">
              <AlertTriangle size={32} />
            </div>
            <h3>Xóa bài học này?</h3>
            <p>Hành động này không thể hoàn tác. Tất cả dữ liệu của bài học sẽ bị xóa vĩnh viễn.</p>
            <div className="iw-confirm-actions">
              <button className="iw-cancel-btn" onClick={() => setDeleteConfirm(null)}>
                Hủy bỏ
              </button>
              <button className="iw-delete-btn" onClick={() => handleDeleteLesson(deleteConfirm)}>
                <Trash2 size={16} />
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Lesson Editor Component
interface LessonEditorProps {
  lesson: ImageWordLesson;
  onSave: (lesson: ImageWordLesson) => void;
  onCancel: () => void;
}

const LessonEditor: React.FC<LessonEditorProps> = ({ lesson, onSave, onCancel }) => {
  const [name, setName] = useState(lesson.name);
  const [description, setDescription] = useState(lesson.description || '');
  const [pairs, setPairs] = useState<ImageWordPair[]>(lesson.pairs);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Handle save
  const handleSave = () => {
    if (!name.trim()) {
      setError('Vui lòng nhập tên bài học');
      return;
    }
    if (pairs.length === 0) {
      setError('Vui lòng thêm ít nhất 1 cặp hình - từ');
      return;
    }
    const invalidPair = pairs.find(p => !p.imageUrl || !p.vocabulary);
    if (invalidPair) {
      setError('Mỗi cặp cần có hình ảnh và từ vựng');
      return;
    }

    onSave({
      ...lesson,
      name: name.trim(),
      description: description.trim(),
      pairs,
      updatedAt: Date.now(),
    });
  };

  // Add new pair
  const handleAddPair = () => {
    const newPair = createImageWordPair('', '', '');
    setPairs(prev => [...prev, newPair]);
  };

  // Update pair
  const handleUpdatePair = (index: number, updates: Partial<ImageWordPair>) => {
    setPairs(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  };

  // Delete pair
  const handleDeletePair = (index: number) => {
    setPairs(prev => prev.filter((_, i) => i !== index));
  };

  // Drag & drop reorder
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const newPairs = [...pairs];
    const [draggedItem] = newPairs.splice(dragIndex, 1);
    newPairs.splice(index, 0, draggedItem);
    setPairs(newPairs);
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  return (
    <div className="iw-modal-overlay" onClick={onCancel}>
      <div className="iw-editor-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="iw-editor-header">
          <h2>{lesson.id ? 'Chỉnh Sửa Bài Học' : 'Tạo Bài Học Mới'}</h2>
          <button className="iw-close-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="iw-editor-body">
          {error && (
            <div className="iw-error-msg">
              <AlertTriangle size={16} />
              <span>{error}</span>
              <button onClick={() => setError(null)}><X size={14} /></button>
            </div>
          )}

          {/* Lesson info */}
          <div className="iw-form-section">
            <div className="iw-form-group">
              <label>Tên bài học <span className="required">*</span></label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setError(null); }}
                placeholder="VD: Động vật, Trái cây, Màu sắc..."
                autoFocus
              />
            </div>
            <div className="iw-form-group">
              <label>Mô tả</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Mô tả ngắn về nội dung bài học"
              />
            </div>
          </div>

          {/* Pairs section */}
          <div className="iw-pairs-section">
            <div className="iw-pairs-header">
              <h3>
                <Hash size={16} />
                Danh sách cặp ({pairs.length})
              </h3>
              <button className="iw-add-pair-btn" onClick={handleAddPair}>
                <Plus size={16} />
                Thêm cặp
              </button>
            </div>

            <div className="iw-pairs-list">
              {pairs.length === 0 ? (
                <div className="iw-no-pairs">
                  <ImageIcon size={40} strokeWidth={1.5} />
                  <p>Chưa có cặp nào</p>
                  <button onClick={handleAddPair}>
                    <Plus size={16} />
                    Thêm cặp đầu tiên
                  </button>
                </div>
              ) : (
                pairs.map((pair, index) => (
                  <PairEditor
                    key={pair.id}
                    pair={pair}
                    index={index}
                    isDragging={dragIndex === index}
                    onUpdate={(updates) => handleUpdatePair(index, updates)}
                    onDelete={() => handleDeletePair(index)}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="iw-editor-footer">
          <button className="iw-cancel-btn" onClick={onCancel}>
            Hủy bỏ
          </button>
          <button className="iw-save-btn" onClick={handleSave}>
            <Save size={16} />
            {lesson.id ? 'Lưu thay đổi' : 'Tạo bài học'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Single Pair Editor
interface PairEditorProps {
  pair: ImageWordPair;
  index: number;
  isDragging: boolean;
  onUpdate: (updates: Partial<ImageWordPair>) => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

const PairEditor: React.FC<PairEditorProps> = ({
  pair, index, isDragging, onUpdate, onDelete, onDragStart, onDragOver, onDragEnd
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Kích thước file tối đa 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onUpdate({ imageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={`iw-pair-item ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      {/* Drag handle */}
      <div className="iw-drag-handle">
        <GripVertical size={16} />
      </div>

      {/* Index */}
      <span className="iw-pair-index">{index + 1}</span>

      {/* Image upload */}
      <div className="iw-pair-image">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          hidden
        />
        {pair.imageUrl ? (
          <div className="iw-image-thumb" onClick={() => fileInputRef.current?.click()}>
            <img src={pair.imageUrl} alt="" />
            <div className="iw-image-hover">
              <Upload size={14} />
              <span>Đổi</span>
            </div>
          </div>
        ) : (
          <button className="iw-upload-btn" onClick={() => fileInputRef.current?.click()}>
            <Upload size={18} />
          </button>
        )}
      </div>

      {/* Inputs */}
      <div className="iw-pair-inputs">
        <input
          type="text"
          value={pair.vocabulary}
          onChange={e => onUpdate({ vocabulary: e.target.value })}
          placeholder="Từ vựng (VD: 犬)"
          className="vocab-input"
        />
        <input
          type="text"
          value={pair.reading || ''}
          onChange={e => onUpdate({ reading: e.target.value })}
          placeholder="Cách đọc (VD: いぬ)"
          className="reading-input"
        />
        <input
          type="text"
          value={pair.meaning}
          onChange={e => onUpdate({ meaning: e.target.value })}
          placeholder="Nghĩa (VD: Con chó)"
          className="meaning-input"
        />
      </div>

      {/* Delete */}
      <button className="iw-delete-pair-btn" onClick={onDelete}>
        <Trash2 size={16} />
      </button>
    </div>
  );
};
