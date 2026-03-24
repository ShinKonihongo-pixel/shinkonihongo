import {
  Type, Image, Video, Volume2, Square, Circle, Minus, ArrowRight,
  Sparkles, FileText, Wand2, Eye, EyeOff, X,
} from 'lucide-react';
import type { SlideElement, SlideFormData } from '../../../../types/lecture';
import { TEXT_TEMPLATES, QUICK_SYMBOLS } from '../../../lecture-editor/editor-constants';

interface InsertTabContentProps {
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
}

export function InsertTabContent({
  selectedElement, editingSlide, addElement, addShapeElement, insertSymbol,
  addTextTemplate, onGenerateFurigana, onGenerateAllFurigana, onRemoveFurigana,
  showFurigana, onToggleFurigana, furiganaLoading, onShowSymbolPicker,
  imageInputRef, onImageUpload,
}: InsertTabContentProps) {
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
