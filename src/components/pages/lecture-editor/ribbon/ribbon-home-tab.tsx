import {
  Plus, Copy, Clipboard, CopyPlus, Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, MoveUp, MoveDown, Trash2,
} from 'lucide-react';
import type { SlideElement, SlideFormData } from '../../../../types/lecture';
import {
  FONT_SIZES, FONT_FAMILIES, COLORS, HIGHLIGHT_COLORS, LINE_HEIGHTS,
  BORDER_WIDTHS, BORDER_STYLES, OPACITIES, PADDING_SIZES, BOX_BACKGROUNDS,
} from '../../../lecture-editor/editor-constants';

interface HomeTabContentProps {
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
}

export function HomeTabContent({
  selectedElement, editingSlide: _editingSlide, clipboard, isNew,
  onAddSlide, onCopy, onPaste, onDuplicate, onDelete, onBringToFront, onSendToBack,
  updateElementStyle,
}: HomeTabContentProps) {
  void _editingSlide; // Reserved for future use
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
