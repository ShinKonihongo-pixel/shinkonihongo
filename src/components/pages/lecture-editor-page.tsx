// Lecture editor page - create and edit lectures (admin only)

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { useLectures, useSlides } from '../../hooks/use-lectures';
import { SlideEditorCanvas } from '../lecture/slide-editor-canvas';
import type { LectureFormData, SlideFormData, SlideElement, SlideLayout, SlideAnimation, SlideTransition } from '../../types/lecture';
import type { JLPTLevel } from '../../types/flashcard';

const SLIDE_LAYOUTS: { value: SlideLayout; label: string }[] = [
  { value: 'title', label: 'Tiêu đề' },
  { value: 'content', label: 'Nội dung' },
  { value: 'two-column', label: 'Hai cột' },
  { value: 'image-left', label: 'Ảnh trái' },
  { value: 'image-right', label: 'Ảnh phải' },
  { value: 'full-media', label: 'Toàn màn hình' },
];

const SLIDE_ANIMATIONS: { value: SlideAnimation; label: string }[] = [
  { value: 'none', label: 'Không có' },
  { value: 'fade-in', label: 'Mờ dần vào' },
  { value: 'fade-out', label: 'Mờ dần ra' },
  { value: 'slide-left', label: 'Trượt trái' },
  { value: 'slide-right', label: 'Trượt phải' },
  { value: 'slide-up', label: 'Trượt lên' },
  { value: 'slide-down', label: 'Trượt xuống' },
  { value: 'zoom-in', label: 'Phóng to' },
  { value: 'zoom-out', label: 'Thu nhỏ' },
  { value: 'bounce', label: 'Nảy' },
  { value: 'rotate', label: 'Xoay' },
];

const SLIDE_TRANSITIONS: { value: SlideTransition; label: string }[] = [
  { value: 'none', label: 'Không có' },
  { value: 'fade', label: 'Mờ dần' },
  { value: 'slide-horizontal', label: 'Trượt ngang' },
  { value: 'slide-vertical', label: 'Trượt dọc' },
  { value: 'zoom', label: 'Phóng to' },
  { value: 'flip', label: 'Lật' },
  { value: 'cube', label: 'Khối 3D' },
  { value: 'dissolve', label: 'Tan biến' },
];

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px', '64px'];
const TEXT_COLORS = ['#000000', '#333333', '#666666', '#ffffff', '#e74c3c', '#3498db', '#27ae60', '#f39c12', '#9b59b6'];
const BG_COLORS = ['transparent', '#ffffff', '#f5f5f5', '#000000', '#1a1a2e', '#e74c3c', '#3498db', '#27ae60', '#f39c12'];

function generateId(): string {
  return `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface LectureEditorPageProps {
  lectureId?: string;
  initialFolderId?: string;
  initialLevel?: JLPTLevel;
  onBack: () => void;
}

export function LectureEditorPage({ lectureId, initialFolderId, initialLevel, onBack }: LectureEditorPageProps) {
  const { currentUser, isAdmin } = useAuth();
  const { getLecture, createLecture, updateLecture } = useLectures(true);
  const [currentLectureId, setCurrentLectureId] = useState<string | null>(lectureId || null);
  const { slides, addSlide, updateSlide, deleteSlide, duplicateSlide } = useSlides(currentLectureId);

  const isNew = !currentLectureId || currentLectureId === 'new';

  // Lecture form state - pre-fill with folder info if creating new
  const [lectureForm, setLectureForm] = useState<LectureFormData>({
    title: '',
    description: '',
    coverImage: '',
    jlptLevel: initialLevel || 'N5',
    folderId: initialFolderId,
    isPublished: false,
  });

  // Editor state
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number | null>(null);
  const [editingSlide, setEditingSlide] = useState<SlideFormData | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // Load existing lecture
  useEffect(() => {
    if (lectureId && lectureId !== 'new') {
      setCurrentLectureId(lectureId);
      getLecture(lectureId).then((lecture) => {
        if (lecture) {
          setLectureForm({
            title: lecture.title,
            description: lecture.description || '',
            coverImage: lecture.coverImage || '',
            jlptLevel: lecture.jlptLevel,
            isPublished: lecture.isPublished,
          });
        }
      });
    }
  }, [lectureId, getLecture]);

  // Get selected element
  const selectedElement = editingSlide?.elements.find(el => el.id === selectedElementId) || null;

  // Redirect non-admin
  if (!isAdmin) {
    return (
      <div className="error-page">
        <p>Bạn không có quyền truy cập trang này.</p>
        <button className="btn" onClick={onBack}>Quay lại</button>
      </div>
    );
  }

  // Handle lecture form change
  const handleLectureChange = (field: keyof LectureFormData, value: string | boolean) => {
    setLectureForm((prev) => ({ ...prev, [field]: value }));
  };

  // Save lecture
  const handleSaveLecture = async () => {
    if (!lectureForm.title.trim()) {
      setError('Vui lòng nhập tiêu đề bài giảng');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isNew) {
        const newLecture = await createLecture(
          lectureForm,
          currentUser!.id,
          currentUser!.displayName || currentUser!.username
        );
        if (newLecture) {
          setCurrentLectureId(newLecture.id);
        }
      } else if (currentLectureId) {
        await updateLecture(currentLectureId, lectureForm);
      }
    } catch (err) {
      setError('Lỗi khi lưu bài giảng');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Background image upload ref
  const bgImageInputRef = useRef<HTMLInputElement>(null);

  // Add new slide
  const handleAddSlide = async () => {
    if (!currentLectureId || currentLectureId === 'new') {
      setError('Vui lòng lưu bài giảng trước khi thêm slide');
      return;
    }

    const newSlideData: SlideFormData = {
      layout: 'content',
      title: `Slide ${slides.length + 1}`,
      elements: [],
      backgroundColor: '#ffffff',
      animation: 'none',
      transition: 'fade',
      animationDuration: 500,
    };

    const slide = await addSlide(newSlideData);
    if (slide) {
      setSelectedSlideIndex(slides.length);
      setEditingSlide(newSlideData);
    }
  };

  // Select slide for editing
  const handleSelectSlide = (index: number) => {
    const slide = slides[index];
    setSelectedSlideIndex(index);
    setSelectedElementId(null);
    setEditingSlide({
      layout: slide.layout,
      title: slide.title || '',
      elements: slide.elements,
      backgroundColor: slide.backgroundColor || '#ffffff',
      backgroundImage: slide.backgroundImage,
      notes: slide.notes,
      animation: slide.animation || 'none',
      transition: slide.transition || 'fade',
      animationDuration: slide.animationDuration || 500,
    });
  };

  // Handle background image upload
  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingSlide) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setEditingSlide({ ...editingSlide, backgroundImage: base64 });
    };
    reader.readAsDataURL(file);
  };

  // Remove background image
  const handleRemoveBgImage = () => {
    if (!editingSlide) return;
    setEditingSlide({ ...editingSlide, backgroundImage: undefined });
  };

  // Update slide
  const handleUpdateSlide = async () => {
    if (selectedSlideIndex === null || !editingSlide) return;

    const slide = slides[selectedSlideIndex];
    await updateSlide(slide.id, editingSlide);
    setEditingSlide(null);
    setSelectedSlideIndex(null);
    setSelectedElementId(null);
  };

  // Delete slide
  const handleDeleteSlide = async (index: number) => {
    const slide = slides[index];
    if (window.confirm('Xoá slide này?')) {
      await deleteSlide(slide.id);
      if (selectedSlideIndex === index) {
        setSelectedSlideIndex(null);
        setEditingSlide(null);
        setSelectedElementId(null);
      }
    }
  };

  // Add element to slide
  const addElement = (type: SlideElement['type']) => {
    if (!editingSlide) return;

    const defaultStyle = {
      fontSize: '18px',
      fontWeight: 'normal',
      color: '#000000',
      textAlign: 'left',
      backgroundColor: 'transparent',
    };

    const newElement: SlideElement = {
      id: generateId(),
      type,
      content: type === 'text' ? 'Nhập nội dung...' : '',
      position: { x: 10, y: 30, width: 80, height: type === 'text' ? 20 : 40 },
      style: type === 'text' ? defaultStyle : undefined,
    };

    setEditingSlide({
      ...editingSlide,
      elements: [...editingSlide.elements, newElement],
    });
    setSelectedElementId(newElement.id);
  };

  // Update element
  const updateElement = (elementId: string, updates: Partial<SlideElement>) => {
    if (!editingSlide) return;

    setEditingSlide({
      ...editingSlide,
      elements: editingSlide.elements.map((el) =>
        el.id === elementId ? { ...el, ...updates } : el
      ),
    });
  };

  // Update element style
  const updateElementStyle = (elementId: string, styleUpdates: Record<string, string>) => {
    if (!editingSlide) return;

    setEditingSlide({
      ...editingSlide,
      elements: editingSlide.elements.map((el) =>
        el.id === elementId ? { ...el, style: { ...el.style, ...styleUpdates } } : el
      ),
    });
  };

  // Delete element
  const deleteElement = (elementId: string) => {
    if (!editingSlide) return;

    setEditingSlide({
      ...editingSlide,
      elements: editingSlide.elements.filter((el) => el.id !== elementId),
    });
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  };

  // Move element (change position)
  const moveElement = (elementId: string, direction: 'up' | 'down' | 'left' | 'right', amount: number = 5) => {
    const element = editingSlide?.elements.find(el => el.id === elementId);
    if (!element) return;

    const newPosition = { ...element.position };
    switch (direction) {
      case 'up': newPosition.y = Math.max(0, newPosition.y - amount); break;
      case 'down': newPosition.y = Math.min(100 - newPosition.height, newPosition.y + amount); break;
      case 'left': newPosition.x = Math.max(0, newPosition.x - amount); break;
      case 'right': newPosition.x = Math.min(100 - newPosition.width, newPosition.x + amount); break;
    }
    updateElement(elementId, { position: newPosition });
  };

  // Resize element
  const resizeElement = (elementId: string, dimension: 'width' | 'height', amount: number) => {
    const element = editingSlide?.elements.find(el => el.id === elementId);
    if (!element) return;

    const newPosition = { ...element.position };
    if (dimension === 'width') {
      newPosition.width = Math.max(10, Math.min(100, newPosition.width + amount));
    } else {
      newPosition.height = Math.max(5, Math.min(100, newPosition.height + amount));
    }
    updateElement(elementId, { position: newPosition });
  };

  return (
    <div className="lecture-editor-page">
      <div className="editor-header">
        <button className="btn btn-back" onClick={onBack}>
          ← Quay lại
        </button>
        <h1>{isNew ? 'Tạo bài giảng mới' : 'Chỉnh sửa bài giảng'}</h1>
        <button className="btn btn-primary" onClick={handleSaveLecture} disabled={saving}>
          {saving ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="editor-content">
        {/* Lecture metadata form */}
        <div className="lecture-form">
          <h3>Thông tin bài giảng</h3>
          <div className="form-group">
            <label>Tiêu đề *</label>
            <input
              type="text"
              value={lectureForm.title}
              onChange={(e) => handleLectureChange('title', e.target.value)}
              placeholder="Nhập tiêu đề bài giảng"
            />
          </div>
          <div className="form-group">
            <label>Mô tả</label>
            <textarea
              value={lectureForm.description}
              onChange={(e) => handleLectureChange('description', e.target.value)}
              placeholder="Mô tả ngắn về bài giảng"
              rows={3}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Level JLPT</label>
              <select
                value={lectureForm.jlptLevel}
                onChange={(e) => handleLectureChange('jlptLevel', e.target.value as JLPTLevel)}
              >
                <option value="N5">N5</option>
                <option value="N4">N4</option>
                <option value="N3">N3</option>
                <option value="N2">N2</option>
                <option value="N1">N1</option>
              </select>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={lectureForm.isPublished}
                  onChange={(e) => handleLectureChange('isPublished', e.target.checked)}
                />
                Công khai
              </label>
            </div>
          </div>
          <div className="form-group">
            <label>Ảnh bìa (URL)</label>
            <input
              type="text"
              value={lectureForm.coverImage}
              onChange={(e) => handleLectureChange('coverImage', e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Slides editor - always show */}
        <div className="slides-editor">
          <div className="slides-sidebar">
            <div className="slides-header">
              <h3>Slides ({slides.length})</h3>
              <button
                className="btn btn-add"
                onClick={handleAddSlide}
                disabled={isNew}
                title={isNew ? 'Lưu bài giảng trước' : 'Thêm slide mới'}
              >
                + Thêm slide
              </button>
            </div>

            {/* Show message if lecture not saved */}
            {isNew && (
              <div className="slides-empty-message">
                <p>Lưu bài giảng trước để thêm slides</p>
              </div>
            )}

            {/* Show slides list */}
            {!isNew && (
              <div className="slides-list">
                {slides.length === 0 ? (
                  <div className="slides-empty-message">
                    <p>Chưa có slide nào</p>
                    <p className="hint">Nhấn "+ Thêm slide" để bắt đầu</p>
                  </div>
                ) : (
                  slides.map((slide, index) => (
                    <div
                      key={slide.id}
                      className={`slide-thumbnail-item ${selectedSlideIndex === index ? 'active' : ''}`}
                      onClick={() => handleSelectSlide(index)}
                    >
                      <div className="slide-thumbnail-number">{index + 1}</div>
                      <div className="slide-thumbnail-preview">
                        <div
                          className="slide-mini-preview"
                          style={{
                            backgroundColor: slide.backgroundColor || '#ffffff',
                            backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        >
                          {slide.title && (
                            <div className="slide-mini-title">{slide.title}</div>
                          )}
                          {slide.elements.slice(0, 2).map((el) => (
                            <div key={el.id} className="slide-mini-element">
                              {el.type === 'text' ? el.content.substring(0, 20) : `[${el.type}]`}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="slide-thumbnail-info">
                        <span className="slide-thumbnail-name">{slide.title || 'Untitled'}</span>
                        {slide.transition && slide.transition !== 'none' && (
                          <span className="slide-effect-badge" title="Có hiệu ứng chuyển trang">T</span>
                        )}
                        {slide.animation && slide.animation !== 'none' && (
                          <span className="slide-effect-badge" title="Có hiệu ứng animation">A</span>
                        )}
                      </div>
                      <div className="slide-thumbnail-actions">
                        <button
                          className="btn-icon-small"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateSlide(slide.id);
                          }}
                          title="Nhân đôi"
                        >
                          📋
                        </button>
                        <button
                          className="btn-delete-small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSlide(index);
                          }}
                          title="Xóa"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

            <div className="slide-editor-main">
              {editingSlide ? (
                <>
                  {/* Rich Toolbar */}
                  <div className="editor-toolbar">
                    {/* Insert group */}
                    <div className="toolbar-group">
                      <span className="toolbar-label">Chèn:</span>
                      <button className="toolbar-btn" onClick={() => addElement('text')} title="Chèn văn bản">
                        <span>T</span>
                      </button>
                      <button className="toolbar-btn" onClick={() => addElement('image')} title="Chèn ảnh">
                        <span>🖼</span>
                      </button>
                      <button className="toolbar-btn" onClick={() => addElement('video')} title="Chèn video">
                        <span>🎬</span>
                      </button>
                      <button className="toolbar-btn" onClick={() => addElement('audio')} title="Chèn audio">
                        <span>🔊</span>
                      </button>
                    </div>

                    <div className="toolbar-divider" />

                    {/* Text formatting group - only show when text element selected */}
                    {selectedElement?.type === 'text' && (
                      <>
                        <div className="toolbar-group">
                          <span className="toolbar-label">Cỡ chữ:</span>
                          <select
                            className="toolbar-select"
                            value={selectedElement.style?.fontSize || '18px'}
                            onChange={(e) => updateElementStyle(selectedElement.id, { fontSize: e.target.value })}
                          >
                            {FONT_SIZES.map(size => (
                              <option key={size} value={size}>{size}</option>
                            ))}
                          </select>
                        </div>

                        <div className="toolbar-group">
                          <button
                            className={`toolbar-btn ${selectedElement.style?.fontWeight === 'bold' ? 'active' : ''}`}
                            onClick={() => updateElementStyle(selectedElement.id, {
                              fontWeight: selectedElement.style?.fontWeight === 'bold' ? 'normal' : 'bold'
                            })}
                            title="In đậm"
                          >
                            <strong>B</strong>
                          </button>
                          <button
                            className={`toolbar-btn ${selectedElement.style?.fontStyle === 'italic' ? 'active' : ''}`}
                            onClick={() => updateElementStyle(selectedElement.id, {
                              fontStyle: selectedElement.style?.fontStyle === 'italic' ? 'normal' : 'italic'
                            })}
                            title="In nghiêng"
                          >
                            <em>I</em>
                          </button>
                        </div>

                        <div className="toolbar-group">
                          <span className="toolbar-label">Căn:</span>
                          <button
                            className={`toolbar-btn ${selectedElement.style?.textAlign === 'left' ? 'active' : ''}`}
                            onClick={() => updateElementStyle(selectedElement.id, { textAlign: 'left' })}
                            title="Căn trái"
                          >≡</button>
                          <button
                            className={`toolbar-btn ${selectedElement.style?.textAlign === 'center' ? 'active' : ''}`}
                            onClick={() => updateElementStyle(selectedElement.id, { textAlign: 'center' })}
                            title="Căn giữa"
                          >≡</button>
                          <button
                            className={`toolbar-btn ${selectedElement.style?.textAlign === 'right' ? 'active' : ''}`}
                            onClick={() => updateElementStyle(selectedElement.id, { textAlign: 'right' })}
                            title="Căn phải"
                          >≡</button>
                        </div>

                        <div className="toolbar-group">
                          <span className="toolbar-label">Màu chữ:</span>
                          <div className="color-picker">
                            {TEXT_COLORS.map(color => (
                              <button
                                key={color}
                                className={`color-btn ${selectedElement.style?.color === color ? 'active' : ''}`}
                                style={{ backgroundColor: color, border: color === '#ffffff' ? '1px solid #ccc' : 'none' }}
                                onClick={() => updateElementStyle(selectedElement.id, { color })}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="toolbar-divider" />
                      </>
                    )}

                    {/* Position/Size group - show when any element selected */}
                    {selectedElement && (
                      <div className="toolbar-group">
                        <span className="toolbar-label">Vị trí:</span>
                        <button className="toolbar-btn" onClick={() => moveElement(selectedElement.id, 'up')} title="Di chuyển lên">↑</button>
                        <button className="toolbar-btn" onClick={() => moveElement(selectedElement.id, 'down')} title="Di chuyển xuống">↓</button>
                        <button className="toolbar-btn" onClick={() => moveElement(selectedElement.id, 'left')} title="Di chuyển trái">←</button>
                        <button className="toolbar-btn" onClick={() => moveElement(selectedElement.id, 'right')} title="Di chuyển phải">→</button>
                        <span className="toolbar-label" style={{ marginLeft: '8px' }}>Kích thước:</span>
                        <button className="toolbar-btn" onClick={() => resizeElement(selectedElement.id, 'width', -5)} title="Thu nhỏ ngang">W-</button>
                        <button className="toolbar-btn" onClick={() => resizeElement(selectedElement.id, 'width', 5)} title="Phóng to ngang">W+</button>
                        <button className="toolbar-btn" onClick={() => resizeElement(selectedElement.id, 'height', -5)} title="Thu nhỏ dọc">H-</button>
                        <button className="toolbar-btn" onClick={() => resizeElement(selectedElement.id, 'height', 5)} title="Phóng to dọc">H+</button>
                        <button className="toolbar-btn btn-danger" onClick={() => deleteElement(selectedElement.id)} title="Xóa">🗑</button>
                      </div>
                    )}
                  </div>

                  {/* Slide settings */}
                  <div className="slide-settings">
                    {/* Row 1: Layout, Title */}
                    <div className="form-row">
                      <div className="form-group">
                        <label>Layout</label>
                        <select
                          value={editingSlide.layout}
                          onChange={(e) => setEditingSlide({ ...editingSlide, layout: e.target.value as SlideLayout })}
                        >
                          {SLIDE_LAYOUTS.map((l) => (
                            <option key={l.value} value={l.value}>{l.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Tiêu đề slide</label>
                        <input
                          type="text"
                          value={editingSlide.title || ''}
                          onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Row 2: Background color & image */}
                    <div className="form-row">
                      <div className="form-group">
                        <label>Màu nền</label>
                        <div className="color-picker">
                          {BG_COLORS.map(color => (
                            <button
                              key={color}
                              className={`color-btn ${editingSlide.backgroundColor === color ? 'active' : ''}`}
                              style={{
                                backgroundColor: color === 'transparent' ? '#fff' : color,
                                border: color === 'transparent' || color === '#ffffff' ? '1px solid #ccc' : 'none',
                                backgroundImage: color === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)' : undefined,
                                backgroundSize: '8px 8px',
                                backgroundPosition: '0 0, 4px 4px',
                              }}
                              onClick={() => setEditingSlide({ ...editingSlide, backgroundColor: color })}
                              title={color === 'transparent' ? 'Trong suốt' : color}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Ảnh nền</label>
                        <div className="bg-image-controls">
                          <input
                            type="file"
                            ref={bgImageInputRef}
                            accept="image/*"
                            onChange={handleBgImageUpload}
                            style={{ display: 'none' }}
                          />
                          <button
                            className="btn btn-small btn-secondary"
                            onClick={() => bgImageInputRef.current?.click()}
                          >
                            Upload ảnh
                          </button>
                          {editingSlide.backgroundImage && (
                            <>
                              <div className="bg-image-preview">
                                <img src={editingSlide.backgroundImage} alt="Background" />
                              </div>
                              <button
                                className="btn btn-small btn-danger"
                                onClick={handleRemoveBgImage}
                              >
                                Xóa ảnh
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Animation & Transition */}
                    <div className="form-row">
                      <div className="form-group">
                        <label>Hiệu ứng nội dung</label>
                        <select
                          value={editingSlide.animation || 'none'}
                          onChange={(e) => setEditingSlide({ ...editingSlide, animation: e.target.value as SlideAnimation })}
                        >
                          {SLIDE_ANIMATIONS.map((a) => (
                            <option key={a.value} value={a.value}>{a.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Hiệu ứng chuyển trang</label>
                        <select
                          value={editingSlide.transition || 'fade'}
                          onChange={(e) => setEditingSlide({ ...editingSlide, transition: e.target.value as SlideTransition })}
                        >
                          {SLIDE_TRANSITIONS.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Thời lượng (ms)</label>
                        <input
                          type="number"
                          min={100}
                          max={3000}
                          step={100}
                          value={editingSlide.animationDuration || 500}
                          onChange={(e) => setEditingSlide({ ...editingSlide, animationDuration: parseInt(e.target.value) || 500 })}
                        />
                      </div>
                    </div>

                  </div>

                  {/* Professional Slide Editor Canvas */}
                  <SlideEditorCanvas
                    slide={editingSlide}
                    onChange={setEditingSlide}
                    onSave={handleUpdateSlide}
                  />

                  <div className="slide-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditingSlide(null);
                        setSelectedSlideIndex(null);
                        setSelectedElementId(null);
                      }}
                    >
                      Huỷ chỉnh sửa
                    </button>
                  </div>
                </>
              ) : (
                <div className="no-slide-selected">
                  {isNew ? (
                    <p>Lưu bài giảng trước để thêm slides</p>
                  ) : slides.length === 0 ? (
                    <p>Nhấn "+ Thêm slide" để bắt đầu</p>
                  ) : (
                    <p>Chọn slide để chỉnh sửa</p>
                  )}
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
