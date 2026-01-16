// Advanced Lecture Editor Panels
// Text effects, shape effects, themes, animations, and shortcuts

import { useState } from 'react';
import {
  X, Type, Square, Palette, Sparkles, Keyboard, RotateCw, Undo2, Redo2,
  ChevronDown, ChevronUp, Play, Pause
} from 'lucide-react';
import {
  TEXT_EFFECTS, SHAPE_EFFECTS, GRADIENT_PRESETS, ELEMENT_ANIMATIONS,
  KEYBOARD_SHORTCUTS, SLIDE_THEMES,
  type TextEffect, type ShapeEffect, type GradientPreset, type ElementAnimation, type SlideTheme
} from '../../utils/slide-editor-effects';

// ============ TEXT EFFECTS PANEL ============
interface TextEffectsPanelProps {
  currentEffect: string;
  onSelectEffect: (effect: TextEffect) => void;
  isVisible: boolean;
  onClose: () => void;
}

export function TextEffectsPanel({ currentEffect, onSelectEffect, isVisible, onClose }: TextEffectsPanelProps) {
  if (!isVisible) return null;

  return (
    <div className="le-effects-panel">
      <div className="le-effects-header">
        <Type size={16} />
        <span>Hiệu ứng chữ</span>
        <button className="le-icon-btn" onClick={onClose}><X size={16} /></button>
      </div>
      <div className="le-effects-grid">
        {TEXT_EFFECTS.map(effect => (
          <button
            key={effect.id}
            className={`le-effect-item ${currentEffect === effect.id ? 'active' : ''}`}
            onClick={() => onSelectEffect(effect)}
          >
            <span
              className="le-effect-preview-text"
              style={{ ...effect.style, fontSize: '18px', fontWeight: 'bold' }}
            >
              Aa
            </span>
            <span className="le-effect-name">{effect.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============ SHAPE EFFECTS PANEL ============
interface ShapeEffectsPanelProps {
  currentEffect: string;
  onSelectEffect: (effect: ShapeEffect) => void;
  isVisible: boolean;
  onClose: () => void;
}

export function ShapeEffectsPanel({ currentEffect, onSelectEffect, isVisible, onClose }: ShapeEffectsPanelProps) {
  if (!isVisible) return null;

  return (
    <div className="le-effects-panel">
      <div className="le-effects-header">
        <Square size={16} />
        <span>Hiệu ứng hình</span>
        <button className="le-icon-btn" onClick={onClose}><X size={16} /></button>
      </div>
      <div className="le-effects-grid le-effects-grid-shapes">
        {SHAPE_EFFECTS.map(effect => (
          <button
            key={effect.id}
            className={`le-effect-item ${currentEffect === effect.id ? 'active' : ''}`}
            onClick={() => onSelectEffect(effect)}
          >
            <div
              className="le-effect-preview-shape"
              style={{ ...effect.style, backgroundColor: '#3498db' }}
            />
            <span className="le-effect-name">{effect.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============ GRADIENT BACKGROUNDS PANEL ============
interface GradientPanelProps {
  currentGradient: string;
  onSelectGradient: (gradient: GradientPreset) => void;
  isVisible: boolean;
  onClose: () => void;
}

export function GradientPanel({ currentGradient, onSelectGradient, isVisible, onClose }: GradientPanelProps) {
  if (!isVisible) return null;

  return (
    <div className="le-effects-panel le-gradient-panel">
      <div className="le-effects-header">
        <Palette size={16} />
        <span>Nền Gradient</span>
        <button className="le-icon-btn" onClick={onClose}><X size={16} /></button>
      </div>
      <div className="le-gradient-grid">
        {GRADIENT_PRESETS.map(gradient => (
          <button
            key={gradient.id}
            className={`le-gradient-item ${currentGradient === gradient.value ? 'active' : ''}`}
            onClick={() => onSelectGradient(gradient)}
            title={gradient.name}
          >
            <div
              className="le-gradient-preview"
              style={{ background: gradient.preview }}
            />
            <span className="le-gradient-name">{gradient.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============ ELEMENT ANIMATIONS PANEL ============
interface AnimationsPanelProps {
  currentAnimation: string;
  onSelectAnimation: (animation: ElementAnimation) => void;
  onPreviewAnimation: (animation: ElementAnimation) => void;
  isVisible: boolean;
  onClose: () => void;
}

export function AnimationsPanel({
  currentAnimation, onSelectAnimation, onPreviewAnimation, isVisible, onClose
}: AnimationsPanelProps) {
  const [category, setCategory] = useState<'entrance' | 'emphasis' | 'exit'>('entrance');

  if (!isVisible) return null;

  const filteredAnimations = ELEMENT_ANIMATIONS.filter(a => a.category === category);

  return (
    <div className="le-effects-panel le-animations-panel">
      <div className="le-effects-header">
        <Sparkles size={16} />
        <span>Animation Element</span>
        <button className="le-icon-btn" onClick={onClose}><X size={16} /></button>
      </div>
      <div className="le-animation-tabs">
        <button
          className={category === 'entrance' ? 'active' : ''}
          onClick={() => setCategory('entrance')}
        >
          Xuất hiện
        </button>
        <button
          className={category === 'emphasis' ? 'active' : ''}
          onClick={() => setCategory('emphasis')}
        >
          Nhấn mạnh
        </button>
        <button
          className={category === 'exit' ? 'active' : ''}
          onClick={() => setCategory('exit')}
        >
          Biến mất
        </button>
      </div>
      <div className="le-animation-list">
        {filteredAnimations.map(anim => (
          <div
            key={anim.id}
            className={`le-animation-item ${currentAnimation === anim.id ? 'active' : ''}`}
          >
            <button className="le-animation-select" onClick={() => onSelectAnimation(anim)}>
              <span className="le-animation-name">{anim.name}</span>
              <span className="le-animation-duration">{anim.duration}ms</span>
            </button>
            <button
              className="le-animation-preview-btn"
              onClick={() => onPreviewAnimation(anim)}
              title="Xem trước"
            >
              <Play size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ SLIDE THEMES PANEL ============
interface ThemesPanelProps {
  currentTheme: string;
  onSelectTheme: (theme: SlideTheme) => void;
  isVisible: boolean;
  onClose: () => void;
}

export function ThemesPanel({ currentTheme, onSelectTheme, isVisible, onClose }: ThemesPanelProps) {
  if (!isVisible) return null;

  return (
    <div className="le-effects-panel le-themes-panel">
      <div className="le-effects-header">
        <Palette size={16} />
        <span>Chủ đề Slide</span>
        <button className="le-icon-btn" onClick={onClose}><X size={16} /></button>
      </div>
      <div className="le-themes-grid">
        {SLIDE_THEMES.map(theme => (
          <button
            key={theme.id}
            className={`le-theme-item ${currentTheme === theme.id ? 'active' : ''}`}
            onClick={() => onSelectTheme(theme)}
          >
            <div
              className="le-theme-preview"
              style={{ background: theme.preview }}
            >
              <span style={{ ...theme.titleStyle, fontSize: '10px' }}>Title</span>
              <span style={{ ...theme.textStyle, fontSize: '8px' }}>Content</span>
            </div>
            <span className="le-theme-name">{theme.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============ KEYBOARD SHORTCUTS PANEL ============
interface ShortcutsPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export function ShortcutsPanel({ isVisible, onClose }: ShortcutsPanelProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('general');

  if (!isVisible) return null;

  const categories = [
    { id: 'general', name: 'Chung', icon: '⌨️' },
    { id: 'editing', name: 'Chỉnh sửa', icon: '✏️' },
    { id: 'navigation', name: 'Di chuyển', icon: '🧭' },
    { id: 'formatting', name: 'Định dạng', icon: '🎨' },
  ];

  return (
    <div className="le-shortcuts-panel">
      <div className="le-shortcuts-header">
        <Keyboard size={16} />
        <span>Phím tắt</span>
        <button className="le-icon-btn" onClick={onClose}><X size={16} /></button>
      </div>
      <div className="le-shortcuts-content">
        {categories.map(cat => (
          <div key={cat.id} className="le-shortcuts-category">
            <button
              className="le-shortcuts-category-header"
              onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
            >
              <span>{cat.icon} {cat.name}</span>
              {expandedCategory === cat.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedCategory === cat.id && (
              <div className="le-shortcuts-list">
                {KEYBOARD_SHORTCUTS
                  .filter(s => s.category === cat.id)
                  .map((shortcut, idx) => (
                    <div key={idx} className="le-shortcut-item">
                      <kbd className="le-shortcut-key">{shortcut.key}</kbd>
                      <span className="le-shortcut-desc">{shortcut.description}</span>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ ROTATION CONTROL ============
interface RotationControlProps {
  rotation: number;
  onChange: (rotation: number) => void;
}

export function RotationControl({ rotation, onChange }: RotationControlProps) {
  return (
    <div className="le-rotation-control">
      <RotateCw size={14} />
      <input
        type="range"
        min="0"
        max="360"
        value={rotation}
        onChange={(e) => onChange(Number(e.target.value))}
        className="le-rotation-slider"
      />
      <input
        type="number"
        min="0"
        max="360"
        value={rotation}
        onChange={(e) => onChange(Number(e.target.value))}
        className="le-rotation-input"
      />
      <span>°</span>
      <button
        className="le-rotation-reset"
        onClick={() => onChange(0)}
        title="Reset về 0°"
      >
        ↺
      </button>
    </div>
  );
}

// ============ UNDO/REDO TOOLBAR ============
interface UndoRedoToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  historyLength: number;
}

export function UndoRedoToolbar({ canUndo, canRedo, onUndo, onRedo, historyLength }: UndoRedoToolbarProps) {
  return (
    <div className="le-undo-redo">
      <button
        className="le-undo-btn"
        onClick={onUndo}
        disabled={!canUndo}
        title="Hoàn tác (Ctrl+Z)"
      >
        <Undo2 size={16} />
      </button>
      <button
        className="le-redo-btn"
        onClick={onRedo}
        disabled={!canRedo}
        title="Làm lại (Ctrl+Y)"
      >
        <Redo2 size={16} />
      </button>
      {historyLength > 0 && (
        <span className="le-history-count" title={`${historyLength} thay đổi`}>
          {historyLength}
        </span>
      )}
    </div>
  );
}

// ============ SMART GUIDES OVERLAY ============
interface SmartGuidesProps {
  guides: { x?: number; y?: number }[];
  canvasRect: DOMRect | null;
}

export function SmartGuides({ guides, canvasRect }: SmartGuidesProps) {
  if (!canvasRect || guides.length === 0) return null;

  return (
    <svg className="le-smart-guides" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {guides.map((guide, idx) => (
        <g key={idx}>
          {guide.x !== undefined && (
            <line
              x1={`${guide.x}%`}
              y1="0"
              x2={`${guide.x}%`}
              y2="100%"
              stroke="#e74c3c"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          )}
          {guide.y !== undefined && (
            <line
              x1="0"
              y1={`${guide.y}%`}
              x2="100%"
              y2={`${guide.y}%`}
              stroke="#e74c3c"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          )}
        </g>
      ))}
    </svg>
  );
}

// ============ OPACITY CONTROL ============
interface OpacityControlProps {
  opacity: number;
  onChange: (opacity: number) => void;
}

export function OpacityControl({ opacity, onChange }: OpacityControlProps) {
  return (
    <div className="le-opacity-control">
      <label>Độ trong suốt</label>
      <input
        type="range"
        min="0"
        max="100"
        value={opacity}
        onChange={(e) => onChange(Number(e.target.value))}
        className="le-opacity-slider"
      />
      <span>{opacity}%</span>
    </div>
  );
}

// ============ BORDER CONTROL ============
interface BorderControlProps {
  borderWidth: number;
  borderColor: string;
  borderStyle: string;
  borderRadius: number;
  onWidthChange: (width: number) => void;
  onColorChange: (color: string) => void;
  onStyleChange: (style: string) => void;
  onRadiusChange: (radius: number) => void;
}

export function BorderControl({
  borderWidth, borderColor, borderStyle, borderRadius,
  onWidthChange, onColorChange, onStyleChange, onRadiusChange
}: BorderControlProps) {
  const borderStyles = ['solid', 'dashed', 'dotted', 'double'];
  const borderWidths = [0, 1, 2, 3, 4, 5];

  return (
    <div className="le-border-control">
      <div className="le-border-row">
        <label>Viền</label>
        <select value={borderWidth} onChange={(e) => onWidthChange(Number(e.target.value))}>
          {borderWidths.map(w => <option key={w} value={w}>{w}px</option>)}
        </select>
        <select value={borderStyle} onChange={(e) => onStyleChange(e.target.value)}>
          {borderStyles.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          type="color"
          value={borderColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="le-border-color"
        />
      </div>
      <div className="le-border-row">
        <label>Bo góc</label>
        <input
          type="range"
          min="0"
          max="50"
          value={borderRadius}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
        />
        <span>{borderRadius}px</span>
      </div>
    </div>
  );
}
