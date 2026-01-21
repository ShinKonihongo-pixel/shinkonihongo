// Lecture Editor Toolbar Panels
// Floating panels for quick actions, templates, layers management

import { useState } from 'react';
import {
  Type, Image, Square, Circle, Minus, Play, Volume2,
  Layers, ChevronUp, ChevronDown, Eye, EyeOff, Trash2,
  Lock, Unlock, Copy, AlignLeft, AlignCenter, AlignRight,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  Grid3X3, ZoomIn, ZoomOut, Maximize2,
  LayoutTemplate, X, GripVertical
} from 'lucide-react';
import { SLIDE_TEMPLATES, getTemplateCategories, type SlideTemplate, type TemplateCategory } from '../../utils/slide-templates';
import type { SlideElement } from '../../types/lecture';

// ============ QUICK ACTIONS FLOATING PANEL ============
interface QuickActionsPanelProps {
  onAddText: () => void;
  onAddImage: () => void;
  onAddShape: (shape: 'rectangle' | 'circle' | 'line' | 'arrow') => void;
  onAddVideo: () => void;
  onAddAudio: () => void;
  isVisible: boolean;
  onToggle: () => void;
}

export function QuickActionsPanel({
  onAddText, onAddImage, onAddShape, onAddVideo, onAddAudio,
  isVisible, onToggle
}: QuickActionsPanelProps) {
  if (!isVisible) {
    return (
      <button className="le-fab le-fab-quick" onClick={onToggle} title="Thêm nhanh">
        <span className="le-fab-icon">+</span>
      </button>
    );
  }

  return (
    <div className="le-quick-panel">
      <div className="le-quick-panel-header">
        <span>Thêm nhanh</span>
        <button className="le-icon-btn" onClick={onToggle}><X size={16} /></button>
      </div>
      <div className="le-quick-panel-grid">
        <button className="le-quick-item" onClick={onAddText}>
          <Type size={24} />
          <span>Text</span>
        </button>
        <button className="le-quick-item" onClick={onAddImage}>
          <Image size={24} />
          <span>Hình ảnh</span>
        </button>
        <button className="le-quick-item" onClick={() => onAddShape('rectangle')}>
          <Square size={24} />
          <span>Hình chữ nhật</span>
        </button>
        <button className="le-quick-item" onClick={() => onAddShape('circle')}>
          <Circle size={24} />
          <span>Hình tròn</span>
        </button>
        <button className="le-quick-item" onClick={() => onAddShape('line')}>
          <Minus size={24} />
          <span>Đường kẻ</span>
        </button>
        <button className="le-quick-item" onClick={() => onAddShape('arrow')}>
          <span style={{ fontSize: '24px' }}>→</span>
          <span>Mũi tên</span>
        </button>
        <button className="le-quick-item" onClick={onAddVideo}>
          <Play size={24} />
          <span>Video</span>
        </button>
        <button className="le-quick-item" onClick={onAddAudio}>
          <Volume2 size={24} />
          <span>Âm thanh</span>
        </button>
      </div>
    </div>
  );
}

// ============ SLIDE TEMPLATES PANEL ============
interface TemplatesPanelProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectTemplate: (template: SlideTemplate) => void;
}

export function TemplatesPanel({ isVisible, onClose, onSelectTemplate }: TemplatesPanelProps) {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('title');
  const categories = getTemplateCategories();
  const templates = SLIDE_TEMPLATES.filter(t => t.category === activeCategory);

  if (!isVisible) return null;

  return (
    <div className="le-templates-panel">
      <div className="le-templates-header">
        <LayoutTemplate size={18} />
        <span>Mẫu Slide</span>
        <button className="le-icon-btn" onClick={onClose}><X size={16} /></button>
      </div>

      <div className="le-templates-categories">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`le-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      <div className="le-templates-grid">
        {templates.map(template => (
          <button
            key={template.id}
            className="le-template-card"
            onClick={() => onSelectTemplate(template)}
            title={template.description}
          >
            <div className="le-template-preview">
              <span className="le-template-thumb">{template.thumbnail}</span>
            </div>
            <span className="le-template-name">{template.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============ ELEMENT LAYERS PANEL ============
interface LayersPanelProps {
  elements: SlideElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onMoveElement: (id: string, direction: 'up' | 'down') => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  isVisible: boolean;
  onToggle: () => void;
}

export function LayersPanel({
  elements, selectedElementId, onSelectElement,
  onMoveElement, onToggleVisibility, onToggleLock, onDeleteElement, onDuplicateElement,
  isVisible, onToggle
}: LayersPanelProps) {
  if (!isVisible) {
    return (
      <button className="le-fab le-fab-layers" onClick={onToggle} title="Layers">
        <Layers size={18} />
      </button>
    );
  }

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type size={14} />;
      case 'image': return <Image size={14} />;
      case 'shape': return <Square size={14} />;
      case 'video': return <Play size={14} />;
      case 'audio': return <Volume2 size={14} />;
      default: return <Square size={14} />;
    }
  };

  const getElementLabel = (el: SlideElement) => {
    if (el.type === 'text') {
      return el.content.substring(0, 20) + (el.content.length > 20 ? '...' : '');
    }
    return el.type.charAt(0).toUpperCase() + el.type.slice(1);
  };

  return (
    <div className="le-layers-panel">
      <div className="le-layers-header">
        <Layers size={16} />
        <span>Layers ({elements.length})</span>
        <button className="le-icon-btn" onClick={onToggle}><X size={16} /></button>
      </div>

      <div className="le-layers-list">
        {elements.length === 0 ? (
          <div className="le-layers-empty">
            <span>Chưa có element nào</span>
          </div>
        ) : (
          [...elements].reverse().map((el, idx) => (
            <div
              key={el.id}
              className={`le-layer-item ${selectedElementId === el.id ? 'selected' : ''} ${el.hidden ? 'hidden' : ''} ${el.locked ? 'locked' : ''}`}
              onClick={() => onSelectElement(el.id)}
            >
              <div className="le-layer-drag"><GripVertical size={12} /></div>
              <div className="le-layer-icon">{getElementIcon(el.type)}</div>
              <div className="le-layer-name">{getElementLabel(el)}</div>
              <div className="le-layer-actions">
                <button onClick={(e) => { e.stopPropagation(); onToggleVisibility(el.id); }} title={el.hidden ? 'Hiện' : 'Ẩn'}>
                  {el.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); onToggleLock(el.id); }} title={el.locked ? 'Mở khóa' : 'Khóa'}>
                  {el.locked ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); onMoveElement(el.id, 'up'); }} title="Lên trên" disabled={idx === 0}>
                  <ChevronUp size={12} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onMoveElement(el.id, 'down'); }} title="Xuống dưới" disabled={idx === elements.length - 1}>
                  <ChevronDown size={12} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDuplicateElement(el.id); }} title="Nhân đôi">
                  <Copy size={12} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDeleteElement(el.id); }} title="Xóa" className="le-layer-delete">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============ ALIGNMENT TOOLS ============
interface AlignmentToolsProps {
  hasSelection: boolean;
  onAlign: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onDistribute: (direction: 'horizontal' | 'vertical') => void;
}

export function AlignmentTools({ hasSelection, onAlign, onDistribute: _onDistribute }: AlignmentToolsProps) {
  void _onDistribute; // Reserved for future distribution feature
  return (
    <div className="le-align-tools">
      <div className="le-align-group">
        <span className="le-align-label">Căn ngang</span>
        <div className="le-align-btns">
          <button onClick={() => onAlign('left')} disabled={!hasSelection} title="Căn trái">
            <AlignLeft size={14} />
          </button>
          <button onClick={() => onAlign('center')} disabled={!hasSelection} title="Căn giữa">
            <AlignCenter size={14} />
          </button>
          <button onClick={() => onAlign('right')} disabled={!hasSelection} title="Căn phải">
            <AlignRight size={14} />
          </button>
        </div>
      </div>
      <div className="le-align-group">
        <span className="le-align-label">Căn dọc</span>
        <div className="le-align-btns">
          <button onClick={() => onAlign('top')} disabled={!hasSelection} title="Căn trên">
            <AlignStartVertical size={14} />
          </button>
          <button onClick={() => onAlign('middle')} disabled={!hasSelection} title="Căn giữa">
            <AlignCenterVertical size={14} />
          </button>
          <button onClick={() => onAlign('bottom')} disabled={!hasSelection} title="Căn dưới">
            <AlignEndVertical size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ ZOOM CONTROLS ============
interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onZoomFit: () => void;
}

export function ZoomControls({ zoom, onZoomIn, onZoomOut, onZoomReset, onZoomFit }: ZoomControlsProps) {
  return (
    <div className="le-zoom-controls">
      <button onClick={onZoomOut} title="Thu nhỏ" disabled={zoom <= 25}>
        <ZoomOut size={16} />
      </button>
      <button className="le-zoom-value" onClick={onZoomReset} title="Reset 100%">
        {zoom}%
      </button>
      <button onClick={onZoomIn} title="Phóng to" disabled={zoom >= 200}>
        <ZoomIn size={16} />
      </button>
      <button onClick={onZoomFit} title="Vừa màn hình">
        <Maximize2 size={16} />
      </button>
    </div>
  );
}

// ============ GRID TOGGLE ============
interface GridToggleProps {
  showGrid: boolean;
  onToggle: () => void;
}

export function GridToggle({ showGrid, onToggle }: GridToggleProps) {
  return (
    <button
      className={`le-grid-toggle ${showGrid ? 'active' : ''}`}
      onClick={onToggle}
      title={showGrid ? 'Ẩn lưới' : 'Hiện lưới'}
    >
      <Grid3X3 size={16} />
    </button>
  );
}
