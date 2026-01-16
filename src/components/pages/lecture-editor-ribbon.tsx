// Lecture Editor Ribbon Toolbar - Home, Insert, Design, Transitions tabs

import {
  Plus, Copy, Clipboard, CopyPlus, Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, Type, Image, Video, Volume2,
  Square, Circle, Minus, ArrowRight, Sparkles, FileText, MoveUp, MoveDown,
  Trash2, Wand2, Eye, EyeOff, LayoutGrid, ImagePlus, X, Layers,
} from 'lucide-react';
import { RotationControl, OpacityControl } from '../lecture/lecture-advanced-panels';
import type { SlideFormData, SlideElement, SlideTransition } from '../../types/lecture';
import {
  FONT_SIZES, FONT_FAMILIES, COLORS, HIGHLIGHT_COLORS, LINE_HEIGHTS,
  BORDER_WIDTHS, BORDER_STYLES, OPACITIES, PADDING_SIZES, BOX_BACKGROUNDS,
  TEXT_TEMPLATES, QUICK_SYMBOLS,
} from '../lecture-editor/editor-constants';
import type { RibbonTab } from '../lecture-editor/editor-types';

interface EditorRibbonProps {
  activeTab: RibbonTab;
  onTabChange: (tab: RibbonTab) => void;
  selectedElement: SlideElement | null;
  editingSlide: SlideFormData | null;
  clipboard: SlideElement | null;
  isNew: boolean;
  onAddSlide: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  updateElementStyle: (id: string, style: Record<string, string>) => void;
  updateEditingSlide: (updates: Partial<SlideFormData>) => void;
  addElement: (type: SlideElement['type']) => void;
  addShapeElement: (type: 'rectangle' | 'circle' | 'line' | 'arrow') => void;
  insertSymbol: (symbol: string) => void;
  addTextTemplate: (template: typeof TEXT_TEMPLATES[0]) => void;
  onGenerateFurigana: () => void;
  onGenerateAllFurigana: () => void;
  onRemoveFurigana: () => void;
  showFurigana: boolean;
  onToggleFurigana: () => void;
  furiganaLoading: boolean;
  onShowSymbolPicker: () => void;
  onShowTemplatesPanel: () => void;
  onShowTextEffects: () => void;
  onShowShapeEffects: () => void;
  onShowGradientPanel: () => void;
  onShowAnimationsPanel: () => void;
  onShowThemesPanel: () => void;
  onRotateElement: (rotation: number) => void;
  onOpacityChange: (opacity: number) => void;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBackgroundImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function EditorRibbon({
  activeTab, onTabChange, selectedElement, editingSlide, clipboard, isNew,
  onAddSlide, onCopy, onPaste, onDuplicate, onDelete, onBringToFront, onSendToBack,
  updateElementStyle, updateEditingSlide, addElement, addShapeElement, insertSymbol,
  addTextTemplate, onGenerateFurigana, onGenerateAllFurigana, onRemoveFurigana,
  showFurigana, onToggleFurigana, furiganaLoading, onShowSymbolPicker, onShowTemplatesPanel,
  onShowTextEffects, onShowShapeEffects, onShowGradientPanel, onShowAnimationsPanel,
  onShowThemesPanel, onRotateElement, onOpacityChange, imageInputRef, fileInputRef,
  onImageUpload, onBackgroundImageUpload,
}: EditorRibbonProps) {
  return (
    <div className="ppt-ribbon">
      {/* Tabs */}
      <div className="ppt-ribbon-tabs">
        <button className={`ppt-tab ${activeTab === 'home' ? 'active' : ''}`} onClick={() => onTabChange('home')}>Home</button>
        <button className={`ppt-tab ${activeTab === 'insert' ? 'active' : ''}`} onClick={() => onTabChange('insert')}>Insert</button>
        <button className={`ppt-tab ${activeTab === 'design' ? 'active' : ''}`} onClick={() => onTabChange('design')}>Design</button>
        <button className={`ppt-tab ${activeTab === 'transitions' ? 'active' : ''}`} onClick={() => onTabChange('transitions')}>Transitions</button>
        <button
          className="le-templates-trigger"
          onClick={onShowTemplatesPanel}
          disabled={isNew}
          title="Chọn mẫu slide"
        >
          <LayoutGrid size={16} />
          <span>Mẫu Slide</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="ppt-ribbon-content">
        {activeTab === 'home' && (
          <HomeTabContent
            selectedElement={selectedElement}
            editingSlide={editingSlide}
            clipboard={clipboard}
            isNew={isNew}
            onAddSlide={onAddSlide}
            onCopy={onCopy}
            onPaste={onPaste}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onBringToFront={onBringToFront}
            onSendToBack={onSendToBack}
            updateElementStyle={updateElementStyle}
          />
        )}

        {activeTab === 'insert' && (
          <InsertTabContent
            selectedElement={selectedElement}
            editingSlide={editingSlide}
            addElement={addElement}
            addShapeElement={addShapeElement}
            insertSymbol={insertSymbol}
            addTextTemplate={addTextTemplate}
            onGenerateFurigana={onGenerateFurigana}
            onGenerateAllFurigana={onGenerateAllFurigana}
            onRemoveFurigana={onRemoveFurigana}
            showFurigana={showFurigana}
            onToggleFurigana={onToggleFurigana}
            furiganaLoading={furiganaLoading}
            onShowSymbolPicker={onShowSymbolPicker}
            imageInputRef={imageInputRef}
            onImageUpload={onImageUpload}
          />
        )}

        {activeTab === 'design' && editingSlide && (
          <DesignTabContent
            selectedElement={selectedElement}
            editingSlide={editingSlide}
            updateEditingSlide={updateEditingSlide}
            onShowGradientPanel={onShowGradientPanel}
            onShowThemesPanel={onShowThemesPanel}
            onShowTextEffects={onShowTextEffects}
            onShowShapeEffects={onShowShapeEffects}
            onShowAnimationsPanel={onShowAnimationsPanel}
            onRotateElement={onRotateElement}
            onOpacityChange={onOpacityChange}
            fileInputRef={fileInputRef}
            onBackgroundImageUpload={onBackgroundImageUpload}
          />
        )}

        {activeTab === 'transitions' && editingSlide && (
          <TransitionsTabContent
            editingSlide={editingSlide}
            updateEditingSlide={updateEditingSlide}
          />
        )}
      </div>
    </div>
  );
}

// Home Tab Content
function HomeTabContent({
  selectedElement, editingSlide, clipboard, isNew,
  onAddSlide, onCopy, onPaste, onDuplicate, onDelete, onBringToFront, onSendToBack,
  updateElementStyle,
}: {
  selectedElement: SlideElement | null;
  editingSlide: SlideFormData | null;
  clipboard: SlideElement | null;
  isNew: boolean;
  onAddSlide: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  updateElementStyle: (id: string, style: Record<string, string>) => void;
}) {
  return (
    <>
      {/* Clipboard */}
      <div className="ppt-ribbon-group">
        <div className="ppt-ribbon-group-content">
          <button className="ppt-ribbon-btn ppt-ribbon-btn-lg" onClick={onAddSlide} disabled={isNew}>
            <Plus size={20} />
            <span>Slide</span>
          </button>
          {selectedElement && (
            <>
              <button className="ppt-ribbon-btn" onClick={onCopy} title="Ctrl+C">
                <Copy size={16} /><span>Copy</span>
              </button>
              <button className="ppt-ribbon-btn" onClick={onPaste} disabled={!clipboard} title="Ctrl+V">
                <Clipboard size={16} /><span>Paste</span>
              </button>
              <button className="ppt-ribbon-btn" onClick={onDuplicate} title="Ctrl+D">
                <CopyPlus size={16} /><span>Nhân đôi</span>
              </button>
            </>
          )}
        </div>
        <span className="ppt-ribbon-group-label">Clipboard</span>
      </div>

      {/* Font */}
      {selectedElement?.type === 'text' && (
        <div className="ppt-ribbon-group">
          <div className="ppt-ribbon-group-content">
            <select
              className="ppt-ribbon-select"
              value={selectedElement.style?.fontFamily || 'Arial'}
              onChange={(e) => updateElementStyle(selectedElement.id, { fontFamily: e.target.value })}
              title="Font"
            >
              {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <select
              className="ppt-ribbon-select ppt-ribbon-select-sm"
              value={parseInt(selectedElement.style?.fontSize || '24')}
              onChange={(e) => updateElementStyle(selectedElement.id, { fontSize: `${e.target.value}px` })}
              title="Cỡ chữ"
            >
              {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="ppt-ribbon-btn-group">
              <button
                className={`ppt-ribbon-btn-sm ${selectedElement.style?.fontWeight === 'bold' ? 'active' : ''}`}
                onClick={() => updateElementStyle(selectedElement.id, { fontWeight: selectedElement.style?.fontWeight === 'bold' ? 'normal' : 'bold' })}
                title="In đậm"
              ><Bold size={14} /></button>
              <button
                className={`ppt-ribbon-btn-sm ${selectedElement.style?.fontStyle === 'italic' ? 'active' : ''}`}
                onClick={() => updateElementStyle(selectedElement.id, { fontStyle: selectedElement.style?.fontStyle === 'italic' ? 'normal' : 'italic' })}
                title="In nghiêng"
              ><Italic size={14} /></button>
              <button
                className={`ppt-ribbon-btn-sm ${selectedElement.style?.textDecoration === 'underline' ? 'active' : ''}`}
                onClick={() => updateElementStyle(selectedElement.id, { textDecoration: selectedElement.style?.textDecoration === 'underline' ? 'none' : 'underline' })}
                title="Gạch chân"
              ><Underline size={14} /></button>
              <button
                className={`ppt-ribbon-btn-sm ${selectedElement.style?.textDecoration === 'line-through' ? 'active' : ''}`}
                onClick={() => updateElementStyle(selectedElement.id, { textDecoration: selectedElement.style?.textDecoration === 'line-through' ? 'none' : 'line-through' })}
                title="Gạch ngang"
              ><Strikethrough size={14} /></button>
            </div>
          </div>
          <span className="ppt-ribbon-group-label">Font</span>
        </div>
      )}

      {/* Text Color & Highlight */}
      {selectedElement?.type === 'text' && (
        <div className="ppt-ribbon-group">
          <div className="ppt-ribbon-group-content">
            <div className="ppt-color-section">
              <label className="ppt-ribbon-mini-label">Màu chữ</label>
              <div className="ppt-color-picker">
                {COLORS.slice(0, 9).map(c => (
                  <button
                    key={c}
                    className={`ppt-color-btn ${selectedElement.style?.color === c ? 'active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => updateElementStyle(selectedElement.id, { color: c })}
                    title={c}
                  />
                ))}
              </div>
            </div>
            <div className="ppt-color-section">
              <label className="ppt-ribbon-mini-label">Highlight</label>
              <div className="ppt-color-picker">
                {HIGHLIGHT_COLORS.slice(0, 6).map(c => (
                  <button
                    key={c}
                    className={`ppt-color-btn ${selectedElement.style?.backgroundColor === c ? 'active' : ''}`}
                    style={{ backgroundColor: c === 'transparent' ? '#fff' : c, border: c === 'transparent' ? '1px dashed #ccc' : undefined }}
                    onClick={() => updateElementStyle(selectedElement.id, { backgroundColor: c })}
                    title={c === 'transparent' ? 'Không' : c}
                  />
                ))}
              </div>
            </div>
          </div>
          <span className="ppt-ribbon-group-label">Màu sắc</span>
        </div>
      )}

      {/* Shape Fill Color */}
      {selectedElement?.type === 'shape' && (
        <div className="ppt-ribbon-group">
          <div className="ppt-ribbon-group-content">
            <div className="ppt-color-section">
              <label className="ppt-ribbon-mini-label">Màu nền</label>
              <div className="ppt-color-picker">
                {COLORS.slice(0, 12).map(c => (
                  <button
                    key={c}
                    className={`ppt-color-btn ${selectedElement.style?.backgroundColor === c ? 'active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => updateElementStyle(selectedElement.id, { backgroundColor: c })}
                    title={c}
                  />
                ))}
              </div>
            </div>
          </div>
          <span className="ppt-ribbon-group-label">Màu Shape</span>
        </div>
      )}

      {/* Paragraph */}
      {selectedElement?.type === 'text' && (
        <div className="ppt-ribbon-group">
          <div className="ppt-ribbon-group-content">
            <div className="ppt-ribbon-btn-group">
              <button
                className={`ppt-ribbon-btn-sm ${selectedElement.style?.textAlign === 'left' ? 'active' : ''}`}
                onClick={() => updateElementStyle(selectedElement.id, { textAlign: 'left' })}
                title="Căn trái"
              ><AlignLeft size={14} /></button>
              <button
                className={`ppt-ribbon-btn-sm ${selectedElement.style?.textAlign === 'center' ? 'active' : ''}`}
                onClick={() => updateElementStyle(selectedElement.id, { textAlign: 'center' })}
                title="Căn giữa"
              ><AlignCenter size={14} /></button>
              <button
                className={`ppt-ribbon-btn-sm ${selectedElement.style?.textAlign === 'right' ? 'active' : ''}`}
                onClick={() => updateElementStyle(selectedElement.id, { textAlign: 'right' })}
                title="Căn phải"
              ><AlignRight size={14} /></button>
            </div>
            <select
              className="ppt-ribbon-select ppt-ribbon-select-sm"
              value={selectedElement.style?.lineHeight || '1.5'}
              onChange={(e) => updateElementStyle(selectedElement.id, { lineHeight: e.target.value })}
              title="Khoảng cách dòng"
            >
              {LINE_HEIGHTS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <span className="ppt-ribbon-group-label">Đoạn văn</span>
        </div>
      )}

      {/* Text Box Background */}
      {selectedElement?.type === 'text' && (
        <div className="ppt-ribbon-group">
          <div className="ppt-ribbon-group-content">
            <div className="ppt-color-section">
              <label className="ppt-ribbon-mini-label">Nền khung</label>
              <div className="ppt-color-picker">
                {BOX_BACKGROUNDS.slice(0, 8).map((c, i) => (
                  <button
                    key={i}
                    className={`ppt-color-btn ${selectedElement.style?.boxBackground === c ? 'active' : ''}`}
                    style={{ backgroundColor: c === 'transparent' ? '#fff' : c, border: c === 'transparent' ? '1px dashed #ccc' : undefined }}
                    onClick={() => updateElementStyle(selectedElement.id, { boxBackground: c })}
                    title={c === 'transparent' ? 'Không' : c}
                  />
                ))}
              </div>
            </div>
            <select
              className="ppt-ribbon-select ppt-ribbon-select-sm"
              value={selectedElement.style?.padding?.replace('px', '') || '0'}
              onChange={(e) => updateElementStyle(selectedElement.id, { padding: `${e.target.value}px` })}
              title="Padding"
            >
              {PADDING_SIZES.map(p => <option key={p} value={p}>{p}px</option>)}
            </select>
            <select
              className="ppt-ribbon-select ppt-ribbon-select-sm"
              value={selectedElement.style?.borderRadius?.replace('px', '') || '0'}
              onChange={(e) => updateElementStyle(selectedElement.id, { borderRadius: `${e.target.value}px` })}
              title="Bo góc"
            >
              {['0', '4', '8', '12', '16', '20', '24'].map(r => <option key={r} value={r}>{r}px</option>)}
            </select>
          </div>
          <span className="ppt-ribbon-group-label">Khung Text</span>
        </div>
      )}

      {/* Element styling */}
      {selectedElement && (
        <div className="ppt-ribbon-group">
          <div className="ppt-ribbon-group-content">
            <select
              className="ppt-ribbon-select ppt-ribbon-select-sm"
              value={selectedElement.style?.opacity ? String(Math.round(parseFloat(selectedElement.style.opacity as string) * 100)) : '100'}
              onChange={(e) => updateElementStyle(selectedElement.id, { opacity: String(parseInt(e.target.value) / 100) })}
              title="Độ trong suốt"
            >
              {OPACITIES.map(o => <option key={o} value={o}>{o}%</option>)}
            </select>
            <select
              className="ppt-ribbon-select ppt-ribbon-select-sm"
              value={selectedElement.style?.borderWidth?.replace('px', '') || '0'}
              onChange={(e) => updateElementStyle(selectedElement.id, {
                borderWidth: `${e.target.value}px`,
                borderStyle: selectedElement.style?.borderStyle || 'solid',
                borderColor: selectedElement.style?.borderColor || '#000000'
              })}
              title="Độ dày viền"
            >
              {BORDER_WIDTHS.map(w => <option key={w} value={w}>{w}px</option>)}
            </select>
            {selectedElement.style?.borderWidth && selectedElement.style.borderWidth !== '0px' && (
              <>
                <select
                  className="ppt-ribbon-select ppt-ribbon-select-sm"
                  value={selectedElement.style?.borderStyle || 'solid'}
                  onChange={(e) => updateElementStyle(selectedElement.id, { borderStyle: e.target.value })}
                  title="Kiểu viền"
                >
                  {BORDER_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input
                  type="color"
                  className="ppt-color-input"
                  value={selectedElement.style?.borderColor || '#000000'}
                  onChange={(e) => updateElementStyle(selectedElement.id, { borderColor: e.target.value })}
                  title="Màu viền"
                />
              </>
            )}
          </div>
          <span className="ppt-ribbon-group-label">Kiểu dáng</span>
        </div>
      )}

      {/* Layer & Delete */}
      {selectedElement && (
        <div className="ppt-ribbon-group">
          <div className="ppt-ribbon-group-content">
            <button className="ppt-ribbon-btn-sm" onClick={onBringToFront} title="Đưa lên trên">
              <MoveUp size={14} />
            </button>
            <button className="ppt-ribbon-btn-sm" onClick={onSendToBack} title="Đưa xuống dưới">
              <MoveDown size={14} />
            </button>
            <button className="ppt-ribbon-btn-sm ppt-ribbon-btn-danger" onClick={onDelete} title="Xóa (Delete)">
              <Trash2 size={14} />
            </button>
          </div>
          <span className="ppt-ribbon-group-label">Sắp xếp</span>
        </div>
      )}
    </>
  );
}

// Insert Tab Content
function InsertTabContent({
  selectedElement, editingSlide, addElement, addShapeElement, insertSymbol,
  addTextTemplate, onGenerateFurigana, onGenerateAllFurigana, onRemoveFurigana,
  showFurigana, onToggleFurigana, furiganaLoading, onShowSymbolPicker,
  imageInputRef, onImageUpload,
}: {
  selectedElement: SlideElement | null;
  editingSlide: SlideFormData | null;
  addElement: (type: SlideElement['type']) => void;
  addShapeElement: (type: 'rectangle' | 'circle' | 'line' | 'arrow') => void;
  insertSymbol: (symbol: string) => void;
  addTextTemplate: (template: typeof TEXT_TEMPLATES[0]) => void;
  onGenerateFurigana: () => void;
  onGenerateAllFurigana: () => void;
  onRemoveFurigana: () => void;
  showFurigana: boolean;
  onToggleFurigana: () => void;
  furiganaLoading: boolean;
  onShowSymbolPicker: () => void;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <>
      {/* Media */}
      <div className="ppt-ribbon-group">
        <div className="ppt-ribbon-group-content">
          <button className="ppt-ribbon-btn ppt-ribbon-btn-lg" onClick={() => addElement('text')} disabled={!editingSlide}>
            <Type size={20} /><span>Text</span>
          </button>
          <button className="ppt-ribbon-btn" onClick={() => imageInputRef.current?.click()} disabled={!editingSlide}>
            <Image size={16} /><span>Ảnh</span>
          </button>
          <button className="ppt-ribbon-btn" onClick={() => addElement('video')} disabled={!editingSlide}>
            <Video size={16} /><span>Video</span>
          </button>
          <button className="ppt-ribbon-btn" onClick={() => addElement('audio')} disabled={!editingSlide}>
            <Volume2 size={16} /><span>Audio</span>
          </button>
        </div>
        <span className="ppt-ribbon-group-label">Media</span>
      </div>

      {/* Shapes */}
      <div className="ppt-ribbon-group">
        <div className="ppt-ribbon-group-content">
          <button className="ppt-ribbon-btn" onClick={() => addElement('shape')} disabled={!editingSlide} title="Hình chữ nhật">
            <Square size={16} /><span>Chữ nhật</span>
          </button>
          <button className="ppt-ribbon-btn" onClick={() => addShapeElement('circle')} disabled={!editingSlide} title="Hình tròn">
            <Circle size={16} /><span>Tròn</span>
          </button>
          <button className="ppt-ribbon-btn" onClick={() => addShapeElement('line')} disabled={!editingSlide} title="Đường thẳng">
            <Minus size={16} /><span>Line</span>
          </button>
          <button className="ppt-ribbon-btn" onClick={() => addShapeElement('arrow')} disabled={!editingSlide} title="Mũi tên">
            <ArrowRight size={16} /><span>Arrow</span>
          </button>
        </div>
        <span className="ppt-ribbon-group-label">Shapes</span>
      </div>

      {/* Symbols */}
      <div className="ppt-ribbon-group">
        <div className="ppt-ribbon-group-content">
          <button className="ppt-ribbon-btn" onClick={onShowSymbolPicker} disabled={!editingSlide}>
            <Sparkles size={16} /><span>Biểu tượng</span>
          </button>
          <div className="ppt-quick-symbols">
            {QUICK_SYMBOLS.map(s => (
              <button key={s} className="ppt-symbol-btn" onClick={() => insertSymbol(s)} disabled={!editingSlide} title={`Chèn ${s}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <span className="ppt-ribbon-group-label">Biểu tượng</span>
      </div>

      {/* Text Templates */}
      <div className="ppt-ribbon-group">
        <div className="ppt-ribbon-group-content">
          {TEXT_TEMPLATES.map((t, i) => (
            <button key={i} className="ppt-ribbon-btn" onClick={() => addTextTemplate(t)} disabled={!editingSlide} title={t.label}>
              <FileText size={14} /><span>{t.label}</span>
            </button>
          ))}
        </div>
        <span className="ppt-ribbon-group-label">Mẫu Text</span>
      </div>

      {/* Furigana */}
      <div className="ppt-ribbon-group">
        <div className="ppt-ribbon-group-content">
          <button
            className="ppt-ribbon-btn"
            onClick={onGenerateFurigana}
            disabled={!selectedElement || selectedElement.type !== 'text' || furiganaLoading}
            title="Tự động thêm furigana cho text đang chọn"
          >
            <Wand2 size={16} /><span>{furiganaLoading ? '...' : 'Furigana'}</span>
          </button>
          <button
            className="ppt-ribbon-btn"
            onClick={onGenerateAllFurigana}
            disabled={!editingSlide || furiganaLoading}
            title="Thêm furigana cho tất cả text trong slide"
          >
            <span className="ppt-ribbon-icon-text">全</span><span>Tất cả</span>
          </button>
          <button
            className="ppt-ribbon-btn"
            onClick={onRemoveFurigana}
            disabled={!selectedElement || selectedElement.type !== 'text'}
            title="Xóa furigana khỏi text đang chọn"
          >
            <X size={16} /><span>Xóa</span>
          </button>
          <button
            className={`ppt-ribbon-btn ${showFurigana ? 'active' : ''}`}
            onClick={onToggleFurigana}
            title={showFurigana ? 'Ẩn furigana' : 'Hiện furigana'}
          >
            {showFurigana ? <Eye size={16} /> : <EyeOff size={16} />}
            <span>{showFurigana ? 'Ẩn' : 'Hiện'}</span>
          </button>
        </div>
        <span className="ppt-ribbon-group-label">Furigana</span>
      </div>

      <input ref={imageInputRef} type="file" accept="image/*" onChange={onImageUpload} style={{ display: 'none' }} />
    </>
  );
}

// Design Tab Content
function DesignTabContent({
  selectedElement, editingSlide, updateEditingSlide,
  onShowGradientPanel, onShowThemesPanel, onShowTextEffects, onShowShapeEffects,
  onShowAnimationsPanel, onRotateElement, onOpacityChange, fileInputRef, onBackgroundImageUpload,
}: {
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
}) {
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

// Transitions Tab Content
function TransitionsTabContent({
  editingSlide, updateEditingSlide,
}: {
  editingSlide: SlideFormData;
  updateEditingSlide: (updates: Partial<SlideFormData>) => void;
}) {
  return (
    <div className="ppt-ribbon-group">
      <div className="ppt-ribbon-group-content">
        <select
          className="ppt-ribbon-select"
          value={editingSlide.transition || 'fade'}
          onChange={(e) => updateEditingSlide({ transition: e.target.value as SlideTransition })}
        >
          <option value="none">Không có</option>
          <option value="fade">Fade</option>
          <option value="slide-horizontal">Slide ngang</option>
          <option value="slide-vertical">Slide dọc</option>
          <option value="zoom">Zoom</option>
          <option value="flip">Flip</option>
        </select>
        <input
          type="number"
          className="ppt-ribbon-input"
          value={editingSlide.animationDuration || 500}
          onChange={(e) => updateEditingSlide({ animationDuration: parseInt(e.target.value) || 500 })}
          min={100}
          max={3000}
          step={100}
        />
        <span className="ppt-ribbon-label">ms</span>
      </div>
      <span className="ppt-ribbon-group-label">Transition</span>
    </div>
  );
}
