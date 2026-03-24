import { Sparkles, ImagePlus, X, Wand2, Layers } from 'lucide-react';
import { RotationControl, OpacityControl } from '../../../../components/lecture/lecture-advanced-panels';
import type { SlideElement, SlideFormData } from '../../../../types/lecture';
import { COLORS } from '../../../lecture-editor/editor-constants';

interface DesignTabContentProps {
  selectedElement: SlideElement | null;
  editingSlide: SlideFormData;
  updateEditingSlide: (updates: Partial<SlideFormData>) => void;
  onShowGradientPanel: () => void;
  onShowThemesPanel: () => void;
  onShowTextEffects: () => void;
  onShowShapeEffects: () => void;
  onShowAnimationsPanel: () => void;
  onRotateElement: (rotation: number) => void;
  onOpacityChange: (opacity: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onBackgroundImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function DesignTabContent({
  selectedElement, editingSlide, updateEditingSlide,
  onShowGradientPanel, onShowThemesPanel, onShowTextEffects, onShowShapeEffects,
  onShowAnimationsPanel, onRotateElement, onOpacityChange, fileInputRef, onBackgroundImageUpload,
}: DesignTabContentProps) {
  return (
    <>
      {/* Basic Colors */}
      <div className="ppt-ribbon-group">
        <div className="ppt-ribbon-group-content">
          <div className="ppt-color-picker">
            {COLORS.slice(0, 12).map(c => (
              <button
                key={c}
                className={`ppt-color-btn ${editingSlide.backgroundColor === c ? 'active' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => updateEditingSlide({ backgroundColor: c })}
              />
            ))}
          </div>
        </div>
        <span className="ppt-ribbon-group-label">Màu nền</span>
      </div>

      {/* Gradient & Theme */}
      <div className="ppt-ribbon-group">
        <div className="ppt-ribbon-group-content">
          <button className="ppt-ribbon-btn" onClick={onShowGradientPanel}>
            <Sparkles size={16} /><span>Gradient</span>
          </button>
          <button className="ppt-ribbon-btn" onClick={onShowThemesPanel}>
            <Layers size={16} /><span>Themes</span>
          </button>
        </div>
        <span className="ppt-ribbon-group-label">Nền nâng cao</span>
      </div>

      {/* Background Image */}
      <div className="ppt-ribbon-group">
        <div className="ppt-ribbon-group-content">
          <button className="ppt-ribbon-btn" onClick={() => fileInputRef.current?.click()}>
            <ImagePlus size={16} /><span>Ảnh nền</span>
          </button>
          {editingSlide.backgroundImage && (
            <button className="ppt-ribbon-btn" onClick={() => updateEditingSlide({ backgroundImage: undefined })}>
              <X size={16} /><span>Xóa</span>
            </button>
          )}
        </div>
        <span className="ppt-ribbon-group-label">Background</span>
      </div>

      {/* Text Effects */}
      {selectedElement?.type === 'text' && (
        <div className="ppt-ribbon-group">
          <div className="ppt-ribbon-group-content">
            <button className="ppt-ribbon-btn" onClick={onShowTextEffects}>
              <Wand2 size={16} /><span>Text Effects</span>
            </button>
            <button className="ppt-ribbon-btn" onClick={onShowAnimationsPanel}>
              <Sparkles size={16} /><span>Animation</span>
            </button>
          </div>
          <span className="ppt-ribbon-group-label">Hiệu ứng chữ</span>
        </div>
      )}

      {/* Shape Effects */}
      {selectedElement?.type === 'shape' && (
        <div className="ppt-ribbon-group">
          <div className="ppt-ribbon-group-content">
            <button className="ppt-ribbon-btn" onClick={onShowShapeEffects}>
              <Wand2 size={16} /><span>Shape Effects</span>
            </button>
            <button className="ppt-ribbon-btn" onClick={onShowAnimationsPanel}>
              <Sparkles size={16} /><span>Animation</span>
            </button>
          </div>
          <span className="ppt-ribbon-group-label">Hiệu ứng hình</span>
        </div>
      )}

      {/* Transform */}
      {selectedElement && (
        <div className="ppt-ribbon-group">
          <div className="ppt-ribbon-group-content" style={{ flexDirection: 'column', gap: '8px' }}>
            <RotationControl
              rotation={parseInt(selectedElement.style?.transform?.match(/rotate\((\d+)deg\)/)?.[1] || '0')}
              onChange={onRotateElement}
            />
            <OpacityControl
              opacity={Math.round((parseFloat(selectedElement.style?.opacity as string) || 1) * 100)}
              onChange={onOpacityChange}
            />
          </div>
          <span className="ppt-ribbon-group-label">Transform</span>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={onBackgroundImageUpload} style={{ display: 'none' }} />
    </>
  );
}
