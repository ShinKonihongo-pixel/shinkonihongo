// Image-Word Management Page
// Create and manage lessons with image-word pairs

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, Plus, Trash2, Edit2, Save, X, Image, Upload, Layers, AlertCircle
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
  // State
  const [lessons, setLessons] = useState<ImageWordLesson[]>([]);
  const [editingLesson, setEditingLesson] = useState<ImageWordLesson | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Load lessons on mount
  useEffect(() => {
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

  // Edit existing lesson
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

  return (
    <div className="image-word-management-page">
      {/* Header */}
      <div className="management-header">
        <button className="btn-back" onClick={onBack}>
          <ArrowLeft size={20} />
          Quay Lại
        </button>
        <h1>
          <Layers size={24} />
          Quản Lý Bài Học Nối Hình
        </h1>
        <button className="btn-create" onClick={handleCreateLesson}>
          <Plus size={18} />
          Tạo Bài Mới
        </button>
      </div>

      {/* Lessons list */}
      {lessons.length === 0 ? (
        <div className="empty-state">
          <Image size={64} strokeWidth={1} />
          <h3>Chưa có bài học nào</h3>
          <p>Tạo bài học đầu tiên để bắt đầu</p>
          <button className="btn-primary" onClick={handleCreateLesson}>
            <Plus size={18} />
            Tạo Bài Học Đầu Tiên
          </button>
        </div>
      ) : (
        <div className="lessons-list">
          {lessons.map(lesson => (
            <div key={lesson.id} className="lesson-item">
              <div className="lesson-preview">
                {lesson.pairs[0]?.imageUrl ? (
                  <img src={lesson.pairs[0].imageUrl} alt="" />
                ) : (
                  <Image size={32} />
                )}
              </div>
              <div className="lesson-details">
                <h3>{lesson.name || 'Chưa đặt tên'}</h3>
                <p>{lesson.pairs.length} cặp hình - từ</p>
                {lesson.description && <span className="desc">{lesson.description}</span>}
              </div>
              <div className="lesson-actions">
                <button className="btn-edit" onClick={() => handleEditLesson(lesson)}>
                  <Edit2 size={16} />
                  Sửa
                </button>
                <button className="btn-delete" onClick={() => setDeleteConfirm(lesson.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && editingLesson && (
        <LessonEditor
          lesson={editingLesson}
          onSave={handleSaveLesson}
          onCancel={() => { setShowEditor(false); setEditingLesson(null); }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <AlertCircle size={48} color="#f44336" />
            <h3>Xóa Bài Học?</h3>
            <p>Bạn có chắc muốn xóa bài học này? Hành động này không thể hoàn tác.</p>
            <div className="dialog-actions">
              <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>Hủy</button>
              <button className="btn-confirm-delete" onClick={() => handleDeleteLesson(deleteConfirm)}>
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
    // Validate all pairs have image and vocabulary
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

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="lesson-editor-modal" onClick={e => e.stopPropagation()}>
        <div className="editor-header">
          <h2>{lesson.id ? 'Sửa Bài Học' : 'Tạo Bài Học Mới'}</h2>
          <button className="btn-close" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <div className="editor-body">
          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Tên Bài Học *</label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError(null); }}
              placeholder="VD: Động vật, Trái cây..."
            />
          </div>

          <div className="form-group">
            <label>Mô Tả</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về bài học"
            />
          </div>

          <div className="pairs-section">
            <div className="pairs-header">
              <h3>Danh Sách Cặp ({pairs.length})</h3>
              <button className="btn-add-pair" onClick={handleAddPair}>
                <Plus size={16} />
                Thêm Cặp
              </button>
            </div>

            <div className="pairs-list">
              {pairs.map((pair, index) => (
                <PairEditor
                  key={pair.id}
                  pair={pair}
                  index={index}
                  onUpdate={(updates) => handleUpdatePair(index, updates)}
                  onDelete={() => handleDeletePair(index)}
                />
              ))}

              {pairs.length === 0 && (
                <div className="no-pairs">
                  <Image size={32} />
                  <p>Chưa có cặp nào. Nhấn "Thêm Cặp" để bắt đầu.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="editor-footer">
          <button className="btn-cancel" onClick={onCancel}>Hủy</button>
          <button className="btn-save" onClick={handleSave}>
            <Save size={16} />
            Lưu Bài Học
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
  onUpdate: (updates: Partial<ImageWordPair>) => void;
  onDelete: () => void;
}

const PairEditor: React.FC<PairEditorProps> = ({ pair, index, onUpdate, onDelete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Kích thước file tối đa 2MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      onUpdate({ imageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="pair-editor">
      <span className="pair-index">{index + 1}</span>

      {/* Image upload area */}
      <div className="pair-image-upload">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
        {pair.imageUrl ? (
          <div className="image-preview" onClick={() => fileInputRef.current?.click()}>
            <img src={pair.imageUrl} alt="" />
            <div className="image-overlay">
              <Upload size={16} />
              Đổi ảnh
            </div>
          </div>
        ) : (
          <button className="upload-btn" onClick={() => fileInputRef.current?.click()}>
            <Upload size={20} />
            Tải ảnh
          </button>
        )}
      </div>

      {/* Word inputs */}
      <div className="pair-inputs">
        <input
          type="text"
          value={pair.vocabulary}
          onChange={e => onUpdate({ vocabulary: e.target.value })}
          placeholder="Từ vựng (VD: 犬)"
        />
        <input
          type="text"
          value={pair.reading || ''}
          onChange={e => onUpdate({ reading: e.target.value })}
          placeholder="Cách đọc (VD: いぬ)"
        />
        <input
          type="text"
          value={pair.meaning}
          onChange={e => onUpdate({ meaning: e.target.value })}
          placeholder="Nghĩa (VD: Con chó)"
        />
      </div>

      {/* Delete button */}
      <button className="btn-delete-pair" onClick={onDelete}>
        <Trash2 size={16} />
      </button>
    </div>
  );
};
